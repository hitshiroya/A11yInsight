# A11y Audit — QE Nexus

An AI-powered **web accessibility audit tool** built on React + Vite (frontend) and a Node.js/Python backend. Paste any URL and get a full WCAG 2.1 audit powered by Cypress + axe-core, with an LLM-generated analysis.

---

## Project Structure

```
Insight/
├── client/          # React + Vite frontend
└── server/          # Backend API (Node.js / Python)
```

---

## Getting Started

### Client

```bash
cd client
cp config.env.example .env
npm install
npm run dev
```

Runs on `http://localhost:3000`

### Server

```bash
cd server
cp .env.example .env
# install dependencies per server README
```

Runs on `http://localhost:5000`

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (glassmorphism theme)
- Lucide React icons
- React Markdown + remark-gfm

**Backend**
- Node.js / Express (or Python / FastAPI)
- Cypress + axe-core for accessibility audits
- LLM integration for analysis

---

## Environment Variables

### `client/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |
| `VITE_MAX_HISTORY` | `10` | Chat history window size |

### `server/.env`

See `server/.env.example`

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/a11y/audit` | Run accessibility audit on a URL |

---

## License

MIT
