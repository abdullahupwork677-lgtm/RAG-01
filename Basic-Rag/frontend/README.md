# Archive — RAG Chat Frontend

Next.js 16 chat UI for the [Archive RAG backend](../).  
Single ongoing conversation, full (non-streaming) responses, collapsible source citations.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

The backend must be running at `http://localhost:8000` (or change `NEXT_PUBLIC_API_URL` in `.env.local`).

## Structure

```
app/
  page.tsx          Chat screen (state, scrolling, submit)
  layout.tsx        Root layout with fonts & metadata
  globals.css       Tailwind v4 + custom design tokens
components/
  ChatMessage.tsx   Message bubble with error handling
  ChatInput.tsx     Auto-growing textarea + send button
  SourceList.tsx    Collapsible source citations
lib/
  api.ts            Backend client (POST /rag/ask)
  types.ts          Shared TypeScript types
```

## Design

- Paper / ink color palette with archival green accents
- Dot-pulse loading indicator during inference
- Paper-grain background texture via CSS radial gradients
- Responsive layout with max-width conversation container
