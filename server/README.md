# Server

Backend API for the A11y Audit tool.

## Setup

```bash
cp .env.example .env
# edit .env with your keys
npm install   # or: pip install -r requirements.txt
npm start     # or: python main.py
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/a11y/audit` | Accepts `{ url }`, returns WCAG audit + LLM analysis |
| `POST` | `/api/chat` | General chat fallback |
