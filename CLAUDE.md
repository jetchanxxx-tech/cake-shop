# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Handmade cake shop — cross-platform mini program (uni-app) + standalone H5 website (Vue 3) + Express backend. Covers product browsing, cart, checkout, orders, favorites, coupons, and admin management.

## Tech Stack

- **Mini program:** uni-app (Vue 3 + Vuex), targets WeChat/Douyin/Alipay/Baidu/Xiaohongshu/H5
- **H5 frontend:** Vite 5, Vue 3, Pinia, Vue Router, Tailwind CSS, Sass, Axios
- **Backend:** Express 4, better-sqlite3 (SQLite), bcryptjs, JWT, multer (file uploads)
- **Testing:** Playwright 1.59 (installed but no test specs written yet)
- **Deploy:** Python scripts using paramiko for SFTP deployment to remote server

## Commands

```bash
# Backend
cd backend && npm run dev              # Express on :3000 with --watch hot reload

# H5 frontend (dev)
cd frontend && npm run dev             # Vite on :5173, proxies /api → :3000

# H5 frontend (build)
cd frontend && npm run build           # output to frontend/dist/

# Full stack (backend serves built frontend)
node backend/backend-app.js            # API + static frontend on :3000

# Deploy
python deploy.py                       # SFTP upload to remote server (47.120.20.10:22352)
python start-server.py                 # kill old Node process and restart backend remotely
```

## Architecture

Monorepo with three parts:

**Root** — uni-app mini program. Pages declared in `pages.json`: home, category, cart, profile, product detail, admin, orders, checkout, favorites, coupons. Vuex for state. HBuilderX launch config in `.hbuilderx/`.

**`frontend/`** — Standalone H5 SPA. Views under `src/views/` (home, category, cart, checkout, admin with 6 sub-pages). Pinia stores. Vite proxies `/api` to Express.

**`backend/`** — Express REST API. 11 route modules: auth, banners, categories, products, cart, orders, favorites, coupons, addresses, admin, payment. JWT auth. SQLite via better-sqlite3. File uploads via multer. `backend-app.js` is a combined entry point that serves both API and built frontend static files.

`design-ref/` contains 11 UI design reference screenshots.
