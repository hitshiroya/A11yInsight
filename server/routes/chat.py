import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import AsyncGroq

router = APIRouter()

SYSTEM_PROMPT = """You are an expert web accessibility consultant with deep knowledge of:
- WCAG 2.1 and 2.2 guidelines (levels A, AA, AAA)
- ARIA (Accessible Rich Internet Applications) specification
- Keyboard navigation and focus management patterns
- Screen reader compatibility (NVDA, JAWS, VoiceOver, TalkBack)
- Color contrast and visual accessibility
- Semantic HTML and document structure
- Accessible forms, modals, carousels, and interactive components
- Legal compliance (ADA, Section 508, EN 301 549)

Answer questions clearly and concisely. Provide:
- Actionable guidance with concrete examples
- Code snippets (HTML/CSS/JS/ARIA) when helpful
- References to specific WCAG success criteria (e.g. 1.4.3 Contrast Minimum)
- Prioritized recommendations (critical → serious → moderate → minor)

Format responses in clean markdown. Be direct and practical."""


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    client = AsyncGroq(api_key=api_key)

    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message},
            ],
            temperature=0.4,
            max_tokens=2048,
        )
        answer = completion.choices[0].message.content
        return ChatResponse(response=answer)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
