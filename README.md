# 🎬 AI Video Summarizer

A production-ready full-stack web application that turns any video — uploaded directly or pasted as a link (YouTube or direct video URL) — into structured, AI-generated **summaries, flashcards, key points, and highlights**, powered by Google's **Gemini API**.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Tailwind-4F46E5)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![AI](https://img.shields.io/badge/AI-Gemini%20API-orange)

---

## ✨ Features

- **Two input methods** — upload a video file (MP4, MOV, AVI, MKV, WEBM) or paste a YouTube/direct video URL
- **Four output formats** — Text Summary, Flashcards, Key Points, Highlights (choose any combination, or Select All)
- **Real Gemini video understanding** — the video is sent to Gemini natively (not just a transcript), so visuals, on-screen text, and spoken content are all analyzed
- **Ask follow-up questions** — a chat tab on the results page lets you ask anything about the video; Gemini answers using the actual video content, with conversation history maintained across turns
- **Live processing UI** — Uploading → Extracting → Analyzing → Generating, with a progress bar and stage stepper
- **Results page with tabs** — Summary / Flashcards / Key Points / Highlights / Ask, each output tab with Copy, TXT download, and PDF download, plus an "Ask" tab for free-form Q&A about the video
- **Recent summary history** — stored locally in the browser, revisit past results instantly
- **Word count & estimated reading time** on every result
- **Light theme by default**, with a fully wired dark mode toggle
- **Caching** — identical videos + output selections are served from an in-memory cache instead of re-calling Gemini
- **Rate limiting** on the processing endpoint to protect your Gemini quota
- **Robust error handling** — invalid formats, broken URLs, oversized files, Gemini failures, and network errors all show friendly messages
- Fully responsive, mobile-friendly UI

---

## 🗂️ Project Structure

```
ai-video-summarizer/
├── backend/                   # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/            # Environment loading & validation
│   │   ├── controllers/       # Request handlers / orchestration
│   │   ├── middleware/        # Upload, rate limiting, error handling
│   │   ├── prompts/           # Gemini prompt engineering & JSON schemas
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Gemini integration, caching, job tracking
│   │   ├── types/             # Shared TypeScript types
│   │   ├── utils/             # Validators, logger, AppError
│   │   ├── app.ts             # Express app configuration
│   │   └── server.ts          # Entry point
│   ├── uploads/                # Temp storage for uploaded/downloaded videos
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript + Tailwind CSS (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Hero/            # Upload card, URL input, input tabs
│   │   │   ├── results/         # Tabs: Summary, Flashcards, KeyPoints, Highlights
│   │   │   ├── Header.tsx, Footer.tsx, ThemeToggle.tsx, ...
│   │   ├── context/             # ThemeContext (light/dark)
│   │   ├── hooks/                # useLocalStorage, useHistory
│   │   ├── services/             # API client (axios)
│   │   ├── types/                # Shared TypeScript types
│   │   ├── utils/                 # Export (TXT/PDF/clipboard), text stats
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md                    # You are here
```

---

## 🔧 Prerequisites

- **Node.js 18+** and npm
- A **Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 🚀 Quick Start (Local Development)

### 1. Clone / open the project

Open the `ai-video-summarizer` folder in VS Code.

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Start the backend in dev mode (auto-reloads on changes):

```bash
npm run dev
```

The API will be running at **http://localhost:5000**. Visit `http://localhost:5000/api/health` to confirm it's up and that `geminiConfigured` is `true`.

### 3. Set up the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` works out of the box for local dev (it uses Vite's dev proxy to reach the backend at `http://localhost:5000`, configured in `vite.config.ts`). No changes needed unless your backend runs on a different port.

Start the frontend:

```bash
npm run dev
```

Visit **http://localhost:5173** in your browser. 🎉

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origin(s) | `http://localhost:5173` |
| `GEMINI_API_KEY` | **Required.** Your Gemini API key | — |
| `GEMINI_MODEL` | Gemini model used for video analysis | `gemini-2.0-flash` |
| `MAX_FILE_SIZE_BYTES` | Max upload size in bytes | `209715200` (200 MB) |
| `UPLOAD_DIR` | Local temp folder for uploads | `uploads` |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | `15` |
| `RATE_LIMIT_MAX_REQUESTS` | Max video requests per window per IP | `20` |
| `CACHE_TTL_SECONDS` | How long generated summaries are cached | `86400` (24h) |
| `JOB_TTL_SECONDS` | How long job records persist after completion | `3600` (1h) |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL. Leave empty locally (uses Vite proxy) | _(empty)_ |
| `VITE_MAX_FILE_SIZE_MB` | Should match the backend's max upload size, for client-side validation | `200` |

> ⚠️ **Never commit your real `.env` files.** Only `.env.example` should be in version control. The `GEMINI_API_KEY` is only ever read on the backend — it is never sent to or exposed in the frontend.

---

## 📡 API Reference

All responses use the shape `{ ... }` on success or `{ "error": { "message": string, "code": string } }` on failure.

### `GET /api/health`
Health check. Returns server status, whether Gemini is configured, and cache stats.

### `POST /api/video/process`
Starts processing a video. Accepts **either**:
- `multipart/form-data` with a `video` file field, **or**
- a JSON/form body with a `url` string field

plus a required `outputs` field — a JSON array or comma-separated string of any of: `summary`, `flashcards`, `keyPoints`, `highlights`.

**Response (202 Accepted):**
```json
{ "jobId": "a1b2c3d4-..." }
```

### `GET /api/video/status/:jobId`
Poll this endpoint to track progress.

**Response:**
```json
{
  "jobId": "a1b2c3d4-...",
  "status": "analyzing",
  "progress": 70,
  "message": "Analyzing content with Gemini...",
  "result": null,
  "error": null,
  "fromCache": false
}
```

When `status` becomes `"completed"`, `result` contains the full structured output:

```json
{
  "videoTitle": "Introduction to Retrieval-Augmented Generation",
  "summary": {
    "executiveSummary": "...",
    "detailedSummary": "...",
    "sectionBreakdown": [{ "title": "...", "content": "..." }],
    "conclusion": "..."
  },
  "flashcards": [{ "question": "...", "answer": "..." }],
  "keyPoints": ["...", "..."],
  "highlights": [
    { "type": "insight", "title": "...", "description": "...", "timestamp": "04:12" }
  ]
}
```

The response also includes `"chatAvailable": true|false`, indicating whether the `/api/video/chat` endpoint can be used for this job (see below).

### `POST /api/video/chat`
Asks a free-form follow-up question about a video that has already been processed (identified by `jobId`). Reuses the same video reference Gemini already has — no re-upload needed. Only available while the job is still in memory and `chatAvailable` was `true` on its status response (i.e. not for cached or expired results).

**Request body:**
```json
{
  "jobId": "a1b2c3d4-...",
  "question": "What does the speaker say about vector databases?",
  "history": [
    { "role": "user", "text": "What is this video about?" },
    { "role": "model", "text": "It's an introduction to RAG..." }
  ]
}
```

**Response:**
```json
{ "answer": "The speaker explains that vector databases store embeddings for fast similarity search..." }
```

`history` is optional and represents prior turns of the conversation (oldest first), letting Gemini answer with context from earlier questions. Questions are limited to 1000 characters.

---

## 🧠 How It Works

1. The frontend uploads the video file directly to the backend (or sends a URL).
2. The backend validates the input (format, size, URL safety) and immediately responds with a `jobId`, then processes in the background.
3. For file uploads and direct video URLs, the backend uploads the video bytes to the **Gemini Files API** and waits until Gemini finishes processing it (`ACTIVE` state). YouTube URLs are passed directly to Gemini, which can fetch public YouTube videos natively.
4. The backend calls `generateContent` with the video reference plus a carefully engineered prompt, using Gemini's **structured output** (`responseSchema`) so the result is always valid, parseable JSON — no fragile regex or markdown parsing required.
5. The result is cached (keyed by a hash of the video / URL + selected outputs) and returned to the frontend via polling.
6. The frontend renders the result in tabs, and saves a copy to local history.
7. If you ask a question in the **Ask** tab, the backend looks up the same video reference from step 3-4 (kept alive in memory for the lifetime of the job) and sends it to Gemini again along with your question and prior chat turns — no re-upload required. This is only available for freshly generated results (not ones loaded from history or served from cache), since those don't have a live video reference to reuse.

The Gemini API key is **only ever used server-side** — the API flow is strictly `Frontend → Backend → Gemini API → Backend → Frontend`.

---

## 🧯 Error Handling

The app handles and surfaces friendly messages for:
- Unsupported file formats or oversized uploads (validated both client- and server-side)
- Broken, unreachable, or non-video URLs
- Gemini API failures, timeouts, and rate limits
- Network errors / dropped connections
- Missing/invalid input (no file or URL, no output format selected)

---

## 📦 Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo → set the **root directory** to `frontend`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variable `VITE_API_BASE_URL` = your deployed backend URL (e.g. `https://your-api.onrender.com`).
5. Deploy. The included `frontend/vercel.json` handles SPA routing.

### Backend → Render or Railway

**Render:**
1. New **Web Service** → connect your repo → set root directory to `backend`.
2. Build command: `npm install && npm run build`. Start command: `npm start`.
3. Add all environment variables from `backend/.env.example` (especially `GEMINI_API_KEY` and `CORS_ORIGIN` set to your Vercel frontend URL).

**Railway:**
1. New project → deploy from repo → set root directory to `backend`.
2. Railway auto-detects Node; set the build command to `npm run build` and start command to `npm start` if not auto-detected.
3. Add the same environment variables in the Railway dashboard's **Variables** tab.

> After deploying the backend, update the frontend's `VITE_API_BASE_URL` to point to it and redeploy the frontend (or set it before the first deploy).

---
    
## 🛡️ Security Notes

- The Gemini API key lives only in the backend's environment variables and is never bundled into frontend code.
- `helmet` is used for sensible HTTP security headers; CORS is restricted to the configured frontend origin.
- Uploaded files are validated by both MIME type and extension, size-limited, stored with randomized filenames, and deleted after processing (along with their corresponding Gemini-hosted file).
- Rate limiting protects the processing endpoint from abuse and accidental Gemini quota exhaustion.

---

## 🧩 Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Axios, jsPDF, lucide-react
**Backend:** Node.js, Express, TypeScript, Multer, node-cache, express-rate-limit, Helmet
**AI:** Google Gemini API (`@google/generative-ai`), using native video understanding + structured JSON output

---

**FROM TEAM WINNERS!!**
