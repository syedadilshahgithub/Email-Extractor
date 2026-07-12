<div align="center">

# ⚡ EMAIL EXTRACTOR

### Concurrent Web Intelligence Engine for Contact Discovery

*Crawl. Extract. Stream. Repeat.*

![Status](https://img.shields.io/badge/status-production--ready-brightgreen?style=for-the-badge)
![Python](https://img.shields.io/badge/python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/flask-backend-000000?style=for-the-badge&logo=flask&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)

<br>

**[Overview](#-overview) · [Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API](#-api-reference) · [Internals](#-how-the-crawler-thinks) · [Config](#%EF%B8%8F-configuration) · [Roadmap](#%EF%B8%8F-roadmap)**

</div>

---

## 🧠 Overview

**Email Extractor** is a full-stack contact-discovery engine that ingests a batch of website URLs and autonomously crawls each domain — following internal links, prioritizing high-signal pages (`/contact`, `/about`, `/team`), and surgically extracting valid email addresses while filtering out noise (analytics scripts, placeholder emails, tracking pixels, font/image false positives).

Instead of a slow request → wait → dump-everything-at-once model, results are **streamed live** over Server-Sent Events (SSE), so the frontend renders each site's findings the instant it's ready — even while other sites in the batch are still being crawled in parallel.

It's built for one purpose: turning a list of raw domains into a clean, de-duplicated list of real, usable contact emails — fast.

> Built by [Adii](https://github.com/syedadilshahgitub) — freelance web dev & AI/ML engineer-in-training.

---

## ✨ Features

| | |
|---|---|
| 🔎 **Smart Crawling** | BFS-style traversal per domain, biased toward contact/about/team pages via keyword scoring |
| ⚡ **Concurrent Fetching** | `ThreadPoolExecutor`-powered parallel page fetches (configurable worker pool) |
| 📡 **Real-Time Streaming** | SSE-based `/extract` endpoint pushes per-site results the moment they're ready — no polling |
| 🧹 **Aggressive Noise Filtering** | Multi-layer email validation: junk domain blocklist, placeholder blocklist, file-extension false-positive filter |
| 🎯 **Priority Queue Crawling** | Contact/about-style URLs jump the queue ahead of generic pages |
| 🛡️ **Timeout-Hardened** | Per-page and per-site timeout budgets — one broken/slow site can never stall the whole batch |
| 🚫 **Scope-Aware** | Stays strictly within the target domain; skips assets (`.css`, `.js`, `.pdf`, images, etc.) automatically |
| 🩺 **Live Health Monitoring** | Frontend polls `/health` and reflects backend connectivity status in real time |
| 🎨 **Zero-Dependency UI** | Dark, terminal/hacker-inspired interface — hand-crafted CSS, no Tailwind/Bootstrap bloat |
| 🧩 **Batch-Oriented** | Submit dozens of URLs in one go; each is tracked and rendered independently |

---

## 🏗️ Architecture

```
┌──────────────────────────┐          POST /extract           ┌───────────────────────────┐
│                          │ ───────────────────────────────▶ │                           │
│   React (Vite) Frontend  │        (list of URLs, JSON)       │      Flask Backend        │
│                          │                                    │                           │
│  • URL batch input       │ ◀─────────────────────────────── │  • crawl_site() per URL   │
│  • Live progress bar     │      SSE stream: processing /      │  • ThreadPoolExecutor     │
│  • Per-site email cards  │      result / error / done         │    (10 workers/batch)     │
│  • Health status dot     │                                    │  • BFS link queue         │
│                          │ ───────────────────────────────▶  │    (priority + normal)    │
│                          │           GET /health              │  • BeautifulSoup + regex  │
└──────────────────────────┘                                    │    email extraction       │
                                                                  │  • Noise-filter pipeline  │
                                                                  └───────────────────────────┘
                                                                              │
                                                                              ▼
                                                                    ┌───────────────────┐
                                                                    │  Target Websites  │
                                                                    │  (crawled live)    │
                                                                    └───────────────────┘
```

**Flow per submitted URL:**

```
start_url
   │
   ▼
[priority queue] ──▶ fetch batch (parallel) ──▶ extract emails ──▶ discover new links
   │                                                                        │
   └────────────────────── loop until MAX_PAGES_SITE or SITE_TIMEOUT ◀─────┘
   │
   ▼
stream "result" event → frontend renders instantly
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer            | Technology                                                        |
|-------------------|--------------------------------------------------------------------|
| **Frontend**      | React 19 · Vite 7 · Hand-rolled CSS (no framework)                 |
| **Backend**       | Flask · Flask-CORS                                                  |
| **Scraping Core** | Requests · BeautifulSoup4 (`lxml` parser) · Python `re`            |
| **Concurrency**   | `concurrent.futures.ThreadPoolExecutor`, threaded batch fetching   |
| **Transport**     | Server-Sent Events (`text/event-stream`)                           |
| **Tooling**       | ESLint, Vite dev server / build pipeline                           |

</div>

---

## 📂 Project Structure

```
email-extractor/
├── server.py                    # Flask backend — crawler engine + SSE API
├── requirements.txt             # Python dependencies
└── email-extractor/             # React (Vite) frontend
    ├── src/
    │   ├── App.jsx               # Core UI: input, streaming client, results grid
    │   ├── main.jsx               # React root mount
    │   ├── index.css
    │   └── App.css
    ├── public/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── eslint.config.js
```

---

## 🚀 Quick Start

### Prerequisites

- Python **3.9+**
- Node.js **18+**
- npm

### 1. Clone

```bash
git clone https://github.com/<your-username>/email-extractor.git
cd email-extractor
```

### 2. Backend

```bash
pip install -r requirements.txt
python server.py
```

> Server boots at **`http://localhost:5000`**

### 3. Frontend

```bash
cd email-extractor
npm install
npm run dev
```

> App runs at **`http://localhost:5173`**

### 4. Use it

Open the app → paste a list of URLs (one per line) → hit **Extract** → watch results stream in live, per site.

---

## 🔌 API Reference

### `POST /extract`

Streams extraction results as Server-Sent Events — one event per lifecycle stage, per URL.

**Request:**
```http
POST /extract
Content-Type: application/json
```
```json
{
  "urls": [
    "https://example-company.com",
    "https://another-business.io"
  ]
}
```

**Event stream:**
```
data: {"type": "processing", "url": "https://example-company.com", "domain": "example-company.com"}

data: {"type": "result", "url": "https://example-company.com", "domain": "example-company.com", "emails": ["contact@example-company.com", "hello@example-company.com"]}

data: {"type": "error", "url": "https://broken-site.com", "domain": "broken-site.com", "error": "timeout"}

data: {"type": "done"}
```

| Event type   | Meaning                                      |
|--------------|-----------------------------------------------|
| `processing` | Crawl has started for this URL                |
| `result`     | Crawl finished — emails array attached        |
| `error`      | Crawl failed — error message attached         |
| `done`       | Entire batch has finished processing          |

### `GET /health`

```json
{ "status": "ok" }
```

Used by the frontend to render the live server-status indicator (green/red/yellow dot).

---

## 🧬 How The Crawler Thinks

1. **Seed** — Each submitted URL becomes the root of its own independent crawl (isolated by a per-site timeout budget).
2. **Prioritized BFS** — Two queues are maintained per site: a `priority_q` (URLs matching keywords like `contact`, `about`, `team`, `staff`, `reach`, `get-in-touch`) and a `normal_q` for everything else. Priority links always jump the line.
3. **Batch fetching** — Up to `PAGE_WORKERS` pages are fetched concurrently per round via a thread pool, bounded by `REQUEST_TIMEOUT`.
4. **Multi-surface extraction** — For every fetched page:
   - Raw regex scan of the full HTML for `user@domain.tld` patterns
   - Dedicated `mailto:` link parsing
   - Targeted re-scan of `<header>`, `<footer>`, `<nav>`, `<aside>` and elements classed `contact`/`footer`/`header`/`topbar`/`sidebar` — these are where real contact emails live
5. **Noise elimination** — Every candidate email is run through a rejection pipeline:
   - Known placeholder addresses (`test@test.com`, `example@example.com`, …)
   - Blocklisted domains (Google, Facebook, Amazon AWS, Cloudflare, WordPress, …)
   - Domain keyword blocklist (`wixpress`, `sentry`, `gravatar`, `schema.org`, …)
   - File-extension false positives (emails accidentally matching image/script/font filenames)
6. **Link discovery & scoping** — New same-domain links are extracted from every page, filtered against a skip-list (`login`, `cart`, `shop`, `wp-`, `sitemap`, `privacy`, `terms`, …), normalized (query/fragment stripped), and fed back into the queues.
7. **Bounded termination** — The crawl for a site stops when it hits `MAX_PAGES_SITE`, runs out of `SITE_TIMEOUT`, or exhausts both queues — whichever comes first.
8. **Stream out** — The moment a site's crawl concludes, its result is emitted as an SSE event — the frontend never waits for the entire batch.

---

## ⚙️ Configuration

All tunables live at the top of `server.py`:

| Constant          | Default | Description                                          |
|-------------------|---------|-------------------------------------------------------|
| `MAX_PAGES_SITE`  | `15`    | Max pages crawled per individual site                |
| `PAGE_WORKERS`    | `10`    | Concurrent worker threads per fetch batch             |
| `REQUEST_TIMEOUT` | `6s`    | Timeout for a single page fetch                       |
| `SITE_TIMEOUT`    | `30s`   | Total time budget allotted per site                   |

Increasing `MAX_PAGES_SITE` / `SITE_TIMEOUT` yields deeper crawls at the cost of latency — tune based on whether you're optimizing for speed or coverage.

---

## 🧪 Example Output

```json
{
  "example-company.com": [
    "contact@example-company.com",
    "sales@example-company.com"
  ],
  "another-business.io": [
    "hello@another-business.io"
  ]
}
```

---

## 🛣️ Roadmap

- [ ] CSV / Excel export of extracted results
- [ ] Per-domain polite crawl delay + robots.txt respect
- [ ] Dockerfile + docker-compose for one-command deployment
- [ ] Optional headless-browser (Playwright) mode for JS-rendered sites
- [ ] Phone number / social-link extraction alongside emails
- [ ] Persistent job history (SQLite/Postgres) instead of in-memory only

---

## 🤝 Contributing

Pull requests, issues, and feature suggestions are genuinely welcome. If you're extending the crawler's filtering rules or adding new extraction surfaces, please include before/after test cases in your PR description.

## 📄 License

Released under the **MIT License** — free to use, modify, and distribute.

---

<div align="center">

**Built with ☕, regex, and a mild obsession with clean UIs.**

[![GitHub](https://img.shields.io/badge/GitHub-<your--username>-181717?style=flat&logo=github)](https://github.com/syedadilshahgithub)

</div>
