import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from groq import AsyncGroq

router = APIRouter()

AXE_CORE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js"

# Fetched once on first audit, then cached for the lifetime of the server process
_axe_source: str | None = None


async def _get_axe_source() -> str:
    """Download and cache axe-core source. Injected via page.evaluate() to bypass CSP."""
    global _axe_source
    if _axe_source is None:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(AXE_CORE_URL)
            r.raise_for_status()
            _axe_source = r.text
    return _axe_source


AUDIT_SYSTEM_PROMPT = """You are an expert web accessibility auditor. You have been given the raw results 
from an automated axe-core accessibility scan of a website. Your job is to produce a clear, 
detailed, and actionable accessibility audit report in markdown.

Structure your report exactly as follows:

## Executive Summary
Brief overview of the site's accessibility state, overall score impression, and critical risk.

## Violation Summary

| Severity | Count | Impact |
|----------|-------|--------|
| Critical | X | Must fix — blocks access for disabled users |
| Serious  | X | Should fix — significantly impairs experience |
| Moderate | X | Consider fixing — causes confusion |
| Minor    | X | Low priority — minor inconvenience |

## Detailed Findings

For each violation, include:
### [Severity] — [Violation Name]
- **WCAG Criteria**: [relevant success criterion]
- **Issue**: What is wrong and why it matters
- **Affected Elements**: (list the specific elements/selectors)
- **How to Fix**: Concrete code example or step-by-step guidance

## Priority Fix Roadmap
Numbered list of fixes in priority order (critical first), each with estimated effort (Low/Medium/High).

## Overall Assessment
One paragraph summary with a recommended next step."""


def _format_violations_for_prompt(url: str, violations: list) -> str:
    counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    for v in violations:
        impact = v.get("impact", "minor")
        if impact in counts:
            counts[impact] += 1

    lines = [
        f"**URL Audited:** {url}",
        f"**Total Violations:** {len(violations)}",
        f"**By Severity:** Critical={counts['critical']}, Serious={counts['serious']}, "
        f"Moderate={counts['moderate']}, Minor={counts['minor']}",
        "",
        "---",
        "",
        "**RAW VIOLATIONS:**",
        "",
    ]

    for i, v in enumerate(violations, 1):
        nodes = v.get("nodes", [])
        element_snippets = []
        for node in nodes[:3]:
            html = node.get("html", "")
            if html:
                element_snippets.append(f"  - `{html[:200]}`")
        if len(nodes) > 3:
            element_snippets.append(f"  - ...and {len(nodes) - 3} more elements")

        lines.append(f"**{i}. [{v.get('impact', 'unknown').upper()}] {v.get('id', '')}**")
        lines.append(f"- Description: {v.get('description', '')}")
        lines.append(f"- Help: {v.get('help', '')}")
        lines.append(f"- Help URL: {v.get('helpUrl', '')}")
        lines.append(f"- Affected elements ({len(nodes)} total):")
        lines.extend(element_snippets or ["  - (no element details)"])
        lines.append("")

    return "\n".join(lines)


class AuditRequest(BaseModel):
    url: str


class AuditResponse(BaseModel):
    response: str
    url: str
    audit: list


@router.post("/a11y/audit", response_model=AuditResponse)
async def audit(request: AuditRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    url = str(request.url).strip()

    # --- Step 1: Get axe-core source (cached after first fetch) ---
    try:
        axe_source = await _get_axe_source()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load axe-core: {str(e)}")

    # --- Step 2: Run Playwright + axe-core scan ---
    violations = []
    passes_count = 0
    incomplete_count = 0

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                ignore_https_errors=True,
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = await context.new_page()

            try:
                # "commit" fires as soon as the HTTP response is received — least strict,
                # works even on pages that block load/DOMContentLoaded events.
                await page.goto(url, wait_until="commit", timeout=30000)
                # Give JS-heavy SPAs time to render meaningful DOM
                try:
                    await page.wait_for_load_state("domcontentloaded", timeout=10000)
                except Exception:
                    pass
                await page.wait_for_timeout(1500)
            except PlaywrightTimeout:
                await browser.close()
                raise HTTPException(
                    status_code=400,
                    detail=f"Timed out loading {url}. The page may be too slow or blocking automated browsers.",
                )
            except Exception as nav_err:
                err_str = str(nav_err)
                await browser.close()
                if "ERR_NAME_NOT_RESOLVED" in err_str:
                    detail = (
                        f"Could not resolve the domain for `{url}`. "
                        "Please check the URL — the hostname may not exist or may be misspelled. "
                        "Try without the `www.` prefix (e.g. `https://example.com`)."
                    )
                elif "ERR_CONNECTION_REFUSED" in err_str:
                    detail = f"Connection refused for `{url}`. The server may be down or the port may be incorrect."
                elif "ERR_CONNECTION_TIMED_OUT" in err_str or "TIMEOUT" in err_str.upper():
                    detail = f"Connection timed out loading `{url}`. The page may be too slow or blocking automated browsers."
                else:
                    detail = f"Could not navigate to `{url}`: {err_str}"
                raise HTTPException(status_code=400, detail=detail)

            # Inject axe-core source via page.evaluate() — this bypasses CSP because
            # it runs in the devtools/browser context, not as a page-level <script> tag.
            try:
                await page.evaluate(axe_source)
            except Exception as inject_err:
                await browser.close()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to inject axe-core: {str(inject_err)}",
                )

            # Run axe and collect results
            try:
                axe_result = await page.evaluate("""
                    async () => {
                        const results = await axe.run(document, {
                            runOnly: {
                                type: 'tag',
                                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
                            }
                        });
                        return {
                            violations: results.violations,
                            passes: results.passes.length,
                            incomplete: results.incomplete.length,
                            inapplicable: results.inapplicable.length
                        };
                    }
                """)
            except Exception as axe_err:
                await browser.close()
                raise HTTPException(
                    status_code=500,
                    detail=f"axe-core scan failed: {str(axe_err)}",
                )

            await browser.close()

            violations = axe_result.get("violations", [])
            passes_count = axe_result.get("passes", 0)
            incomplete_count = axe_result.get("incomplete", 0)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed unexpectedly: {str(e)}")

    # --- Step 3: Build prompt and call Groq for the analysis report ---
    if not violations:
        no_violation_msg = (
            f"## Accessibility Audit: {url}\n\n"
            "**No violations detected!** axe-core found no WCAG A/AA issues on this page.\n\n"
            f"- Passed checks: {passes_count}\n"
            f"- Needs manual review: {incomplete_count}\n\n"
            "> Note: Automated tools catch ~30–40% of accessibility issues. "
            "Manual testing with a screen reader and keyboard navigation is still recommended."
        )
        return AuditResponse(response=no_violation_msg, url=url, audit=[])

    violation_text = _format_violations_for_prompt(url, violations)
    user_prompt = (
        f"Please generate a detailed accessibility audit report for the following scan results.\n\n"
        f"{violation_text}"
    )

    client = AsyncGroq(api_key=api_key)
    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": AUDIT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        report = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

    return AuditResponse(response=report, url=url, audit=violations)
