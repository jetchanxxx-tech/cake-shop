# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Handmade cake shop — cross-platform mini program (uni-app) + standalone H5 website (Vue 3) + Express backend. Covers product browsing, cart, checkout, orders, favorites, coupons, and admin management.

## Tech Stack

- **Mini program:** uni-app (Vue 3 + Vuex), targets WeChat/Douyin/Alipay/Baidu/Xiaohongshu/H5
- **H5 frontend:** Vite 5, Vue 3, Pinia, Vue Router, Tailwind CSS, Sass, Axios
- **Backend:** Express 4, mysql2 (MySQL), bcryptjs, JWT, multer (file uploads)
- **Production server:** miocake.pangu-cloud.com (47.120.20.10); pm2 manages the Node process; Nginx proxies `/api` to `:3000`

## Commands

```bash
# Backend
cd backend && npm run dev              # Express on :3000 with --watch hot reload

# H5 frontend (dev)
cd frontend && npm run dev             # Vite on :5173, proxies /api → :3000

# H5 frontend (build)
cd frontend && npm run build           # output to frontend/dist/

# Full stack (backend serves built frontend)
node backend/app.js                    # API + static frontend on :3000

# MySQL init
mysql -u root -p < backend/data/init.sql
```

## Architecture

Monorepo with three parts:

**Root** — uni-app mini program. Pages declared in `pages.json`. Vuex for state.

**`frontend/`** — Standalone H5 SPA. Views under `src/views/` (Home, Category, Cart, Checkout, Orders, OrderDetail, Favorites, Coupons, Addresses, Login, Profile; admin sub-pages: AdminLayout, AdminDashboard, AdminOrders, AdminProducts, AdminSettings, AdminLogin). Pinia stores (`user`, `admin`, `cart`). Axios wrapper in `src/api/request.js` auto-attaches Bearer token. Vite proxies `/api` to Express.

**`backend/`** — Express REST API. Route modules: auth, banners, categories, products, cart, orders, favorites, coupons, addresses, admin, payment. JWT auth middleware (`authMiddleware`, `adminAuthMiddleware`). `app.js` is the entry point — it calls `await initDatabase()` (top-level await), then mounts routes, then serves built frontend static files from `../frontend/dist`.

## Database (MySQL)

Connection config: `backend/config/db.config.js` — reads env vars `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` with defaults for local dev. Pool settings: connectionLimit 10, `multipleStatements: true` (required for multi-statement `exec()`).

`backend/config/database.js` exports:
- `initDatabase()` — creates pool, creates tables with `IF NOT EXISTS`, seeds initial data (categories/products/banners/coupons) if categories is empty, always re-seeds admin user if missing
- `getDb()` — returns a `DbWrapper` that mirrors better-sqlite3's synchronous API with **async** methods: `prepare(sql).get/all/run(...params)`

### MySQL gotchas

- **DECIMAL columns return strings** (e.g. `"168.00"`, not `168`). Frontend code accessing `order.pay_amount`, `product.price`, etc. MUST cast with `Number(x || 0)` before calling `.toFixed()`.
- **`pool.execute()` does NOT support multiple statements** — the wrapper's `.exec()` method uses `pool.query()` for DDL batches. `.get()/.all()/.run()` use `pool.execute()` with parameterized queries (safe against SQL injection).
- **WeChat `prepay_id` can be `null`** — the `UPDATE orders SET prepay_id = ?` must handle null; mysql2 accepts `null` for nullable columns.

## WeChat Pay

`backend/config/wechat.js` — reads env vars `WECHAT_MCHID`, `WECHAT_APPID`, `WECHAT_APPSECRET`, `WECHAT_API_KEY`, `WECHAT_SERIAL_NO`, `WECHAT_PRIVATE_KEY`, `WECHAT_NOTIFY_URL`. H5 and JSAPI payment flow in `backend/utils/wechatPay.js`. OAuth callback at `/api/pay/wechat/callback`. Mock payment at `/api/pay/mock` for development.

## API response format

```json
{ "code": 200, "message": "success", "data": ... }
```

`backend/utils/response.js` provides `success()` and `error()` helpers. Frontend Axios interceptor unwraps `response.data` automatically, so stores receive `{ code, message, data }`.
