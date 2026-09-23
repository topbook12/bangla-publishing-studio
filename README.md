# Bangla Word Processor & Publishing Studio

**An offline-first, print-ready WYSIWYG word processor and book designer built for Bengali publishing.**

> **বাংলা বই, কোচিং ম্যাটেরিয়াল ও প্রকাশনার জন্য তৈরি একটি অফলাইন-ফার্স্ট WYSIWYG ওয়ার্ড প্রসেসর।** ইন্টারনেট ছাড়াই ব্রাউজারে লিখুন, পেজ-বাই-পেজ বই ডিজাইন করুন, বাংলা পেজ নম্বরসহ প্রিন্ট-রেডি PDF বা DOCX এক্সপোর্ট করুন — সব ডেটা আপনার ব্রাউজারেই (IndexedDB) নিরাপদ থাকে, কোনো সার্ভার লাগে না।

Design real physical pages (A4, Letter, Legal, Tabloid, Demy Octavo, Crown Octavo…), type in beautiful Bengali fonts, add concept/warning/formula boxes, MCQ blocks, tables of contents and cover pages — then export print-ready PDF, DOCX, HTML or JSON. Everything runs 100% in your browser.

## ✨ Features

- **Physical-page WYSIWYG editor** — real paper sizes with margins and gutter, TipTap-based per-page editing, automatic text overflow to the next page, manual page split (`Ctrl+Enter`)
- **Bengali fonts bundle** — 9 offline-bundled families (Noto Serif/Sans Bengali, Hind Siliguri, Tiro Bangla, Baloo Da 2, Atma, Mina, Galada, Anek Bangla) + optional CDN fonts (Kalpurush, SolaimanLipi, Siyam Rupali)
- **Header/footer styles with Bengali page numbers** — Parallel, Royal, Academic and Plain masters; Bengali (১২৩), English or Roman numerals; different-first-page and odd/even mirroring
- **Concept / warning / formula / note boxes** — one-click callouts with live styling
- **MCQ blocks** — question + options with answer highlighting, inline-editable
- **Table of contents** — auto-generated from headings, with page references
- **Cover generator** — 3 styles with live mini-preview
- **Spelling & proofing** — offline Bengali dictionary (~900 common words), custom user dictionary, যুক্তবর্ণ (conjunct) palette with 120+ ligatures
- **Print-ready PDF** — dedicated print stylesheet with dynamic `@page` sizes; use the browser print dialog
- **DOCX / HTML / JSON export** — Word documents with headers/footers and tables, self-contained HTML, and JSON backups
- **Offline autosave** — every keystroke debounce-saved to IndexedDB (Dexie); projects survive reloads and offline restarts
- **Installable PWA** — works offline after first load, installable from the browser, with its own service worker and icon set

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Editor | TipTap 2 (ProseMirror) with custom nodes |
| Storage | Dexie.js over IndexedDB (offline autosave, zero backend) |
| State | Zustand |
| Export | `docx` (DOCX), self-contained HTML, JSON backup |
| Fonts | @fontsource Bengali bundles (offline) + maateen.me CDN (optional) |
| PWA | Custom service worker (`public/sw.js`) + web manifest |

## 🚀 Run Locally

Requires **Node.js 20+** (or [Bun](https://bun.sh)).

```bash
bun install     # or: npm install
bun run dev     # or: npm run dev
```

Open <http://localhost:3000> — the app loads fully in your browser. No database, no API keys, no environment variables.

## ☁️ Deploy to Vercel

1. Push this repository to GitHub (it is ready as-is — no secrets or env vars needed).
2. Go to [vercel.com/new](https://vercel.com/new) and **import** the repository.
3. Vercel auto-detects **Next.js** — keep the default build settings.
4. Click **Deploy** (no environment variables required).
5. Done. The PWA (service worker, install prompt, offline mode) activates automatically on the HTTPS domain. `vercel.json` in the repo root already sets the correct cache headers for `sw.js` and `manifest.webmanifest`.

## 📁 Project Structure

```
src/
├── app/                  # App Router entry (layout with fonts/PWA meta, page mounts the editor)
├── components/
│   ├── editor/           # Physical-page engine: per-page TipTap, auto-flow, page chrome
│   ├── ribbon/           # Word-style ribbon: Home, Insert, Layout, Design, Review, Export
│   ├── dialogs/          # Header/footer master, cover generator, projects, review
│   ├── ui/               # shadcn/ui primitives
│   └── …                 # App shell, status bar, PWA register
└── lib/                  # Document model, paper sizes, Dexie (IndexedDB), proofing, Bangla utils, exporters
public/
├── icons/                # PWA icon set (1024/512/512-maskable/192/apple-touch)
├── manifest.webmanifest  # PWA manifest
└── sw.js                 # Service worker (offline cache)
```

## 🔒 Offline-first by design

All documents, themes and settings live in your **browser's IndexedDB** — there is **no server database** and nothing leaves your device. Clearing site data deletes your documents, so use **Export → JSON** for backups.

## 📄 License

MIT
