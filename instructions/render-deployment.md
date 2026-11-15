# Render Deployment Guide

Complete step-by-step guide to deploy the **UAlbany LibraryDesk Portal** to [Render.com](https://render.com), configure environment variables, connect to managed MySQL / TiDB Cloud, and deploy both the backend API and frontend static client.

---

## Architecture Overview

Render supports two deployment architectures for UAlbany LibraryDesk:

### Option 1: Unified Full-Stack Web Service (Recommended for Simplicity)
In this architecture, a single Node.js Web Service hosts both the static frontend assets (`express.static`) and the REST API (`/api/*`). Both UI and API share the exact same domain, avoiding all cross-origin requests.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Render Web Service                              │
│                    (ualbanylibrarydesk.onrender.com)                   │
│                                                                        │
│   ┌───────────────────────────┐      ┌───────────────────────────────┐ │
│   │     Frontend Client       │      │     Node.js / Express API     │ │
│   │  (Static HTML / CSS / JS) │ ────►│   (Health, Auth, Circulation) │ │
│   └───────────────────────────┘      └──────────────┬────────────────┘ │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                                      │ SSL / TLS (Port 4000 / 3306)
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │    Managed MySQL Database     │
                                       │ (TiDB Cloud / Aiven / Railway)│
                                       └───────────────────────────────┘
```

### Option 2: Decoupled Architecture (Separate Frontend & Backend)
The frontend is hosted as a CDN-cached **Render Static Site** (or GitHub Pages), while the backend API runs independently as a **Render Web Service**. The client communicates across domains via CORS.

```text
┌───────────────────────────────┐               ┌───────────────────────────────┐
│      Render Static Site       │               │      Render Web Service       │
│ (ualbany-librarydesk.         │   HTTP/REST   │ (ualbanylibrarydesk.          │
│        onrender.com)          │ ────────────► │        onrender.com)          │
│  Static HTML, CSS, client JS  │   (via CORS)  │   Node.js / Express Backend   │
└───────────────────────────────┘               └──────────────┬────────────────┘
                                                               │
                                                               │ SSL / TLS (Port 4000)
                                                               ▼
                                                ┌───────────────────────────────┐
                                                │       TiDB Cloud MySQL        │
                                                │      (Serverless Cluster)     │
                                                └───────────────────────────────┘
```

---

## Database Options Comparison

| Feature | TiDB Cloud (Recommended) | Traditional MySQL |
| :--- | :--- | :--- |
| **Cost** | Free Tier (5 GB storage) | Variable (AWS RDS, DigitalOcean, etc.) |
| **Setup Time** | 3–5 minutes | 15–30 minutes |
| **SSL / Security** | Required, enabled by default | Manual configuration required |
| **Default Port** | `4000` | `3306` |
| **Maintenance** | Serverless, auto-scaling | Self-managed or managed instance |
| **Best For** | Student evaluation, prototypes, free hosting | Dedicated institutional servers |

---

## Part 1: Backend Deployment (Express API Web Service)

### Step 1: Create Render Account
1. Visit [render.com](https://render.com).
2. Sign in with your GitHub account.
3. Grant access to your repository: `lindakovacs/UAlbanyLibraryDesk`.

### Step 2: Create New Web Service
1. In the Render Dashboard, click **New +** ➔ **Web Service**.
2. Select your repository `lindakovacs/UAlbanyLibraryDesk`.
3. Configure the service settings:
   - **Name:** `ualbanylibrarydesk` *(produces `https://ualbanylibrarydesk.onrender.com`)*
   - **Region:** `Oregon (US West)` or closest to your database
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for repository root)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. Click **Advanced** and set:
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`

### Step 3: Add Environment Variables
Under the **Environment Variables** section, add the following keys:

#### Configuration for TiDB Cloud (Recommended):

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode and optimizations |
| `FRONTEND_URL` | `https://ualbanylibrarydesk.onrender.com` | Base frontend URL |
| `CORS_ORIGIN` | `*` | Allowed CORS origins for cross-domain requests |
| `JWT_SECRET` | *(Click "Generate" or enter 32+ char string)* | Cryptographic signing secret for staff tokens |
| `JWT_EXPIRE` | `7d` | Token expiration period |
| `DB_HOST` | `gateway01.us-east-1.prod.aws.tidbcloud.com` | **TiDB gateway endpoint** (from TiDB Connect modal) |
| `DB_PORT` | `4000` | **TiDB port is 4000** (not 3306) |
| `DB_USER` | `xxxxxxxx.root` | TiDB user prefix and username |
| `DB_PASSWORD` | `your_tidb_cluster_password` | Cluster password created in TiDB |
| `DB_NAME` | `ualbanylibrarydesk` | Target database name |
| `DB_SSL` | `true` | **Required for TiDB Cloud** (enforces TLS encryption) |
| `DB_CONNECTION_LIMIT` | `5` | Pool connection limit for Render free tier |

> [!IMPORTANT]
> Do NOT use `ualbanylibrarydesk-db.tidbcloud.com` as the `DB_HOST`. You must copy the exact gateway hostname from the TiDB Cloud **Connect** modal (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`).

#### Configuration for Traditional MySQL:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode |
| `FRONTEND_URL` | `https://ualbanylibrarydesk.onrender.com` | Base frontend URL |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `JWT_SECRET` | *(Generate random 32+ char string)* | JWT signing secret |
| `JWT_EXPIRE` | `7d` | Token lifetime |
| `DB_HOST` | `your-db-host.com` | MySQL server host |
| `DB_PORT` | `3306` | Standard MySQL port |
| `DB_USER` | `your_mysql_user` | MySQL username |
| `DB_PASSWORD` | `your_secure_password` | MySQL password |
| `DB_NAME` | `ualbanylibrarydesk` | Database name |
| `DB_CONNECTION_LIMIT` | `10` | Pool connection limit |

### Step 4: Deploy & Verify Backend Health
1. Click **Create Web Service**.
2. Render will build the service, install dependencies, and start Node.js.
3. Wait for the status badge to display **Live**.
4. Test the health endpoint:
   ```bash
   curl -i https://ualbanylibrarydesk.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "environment": "production",
     "version": "1.0.0",
     "database": {
       "status": "connected",
       "database": "ualbanylibrarydesk"
     }
   }
   ```

---

## Part 2: Frontend Deployment (Static Site)

If you prefer hosting the frontend on a dedicated static CDN (Decoupled Option 2), follow these instructions:

### Option A: Deploy Frontend as a Render Static Site (Recommended)

1. In the Render Dashboard, click **New +** ➔ **Static Site**.
2. Select your repository `lindakovacs/UAlbanyLibraryDesk`.
3. Configure the Static Site settings:
   - **Name:** `ualbany-librarydesk` *(produces `https://ualbany-librarydesk.onrender.com`)*
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for repository root)*
   - **Build Command:** *(leave empty — static site requires no build step)*
   - **Publish Directory:** `.` *(dot indicates repository root containing `index.html` and `login.html`)*
4. Click **Create Static Site**.
5. Render deploys your HTML, CSS, JavaScript, and asset files to its global CDN within 30–60 seconds.
6. Note your frontend URL:
   ```text
   https://ualbany-librarydesk.onrender.com
   ```

### Option B: Deploy Frontend on GitHub Pages (Alternative Free Host)

1. Open your repository on GitHub: `https://github.com/lindakovacs/UAlbanyLibraryDesk`.
2. Navigate to **Settings** ➔ **Pages**.
3. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Click **Save**.
5. Your site is published at `https://lindakovacs.github.io/UAlbanyLibraryDesk/`.

---

## Part 3: Connecting Frontend to Backend (API URL & CORS)

### Automatic API URL Resolution in `api-client.js`
The client API helper in `api-client.js` automatically detects its deployment environment:

```javascript
const getApiBase = () => {
  if (typeof window === 'undefined' || !window.location || !window.location.origin || window.location.protocol.startsWith('file')) {
    return 'http://localhost:3000/api';
  }
  const origin = window.location.origin;
  // Decoupled static frontend hosts pointing to backend Web Service
  if (origin.includes('ualbany-librarydesk.onrender.com') || origin.includes('github.io')) {
    return 'https://ualbanylibrarydesk.onrender.com/api';
  }
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'http://localhost:3000/api';
  }
  return `${origin}/api`;
};
```

- **When hosted on the Unified Web Service (`ualbanylibrarydesk.onrender.com`):** Calls use the same origin (`https://ualbanylibrarydesk.onrender.com/api`).
- **When hosted on the Decoupled Static Site (`ualbany-librarydesk.onrender.com` or GitHub Pages):** Calls automatically route across domains to the backend Web Service at `https://ualbanylibrarydesk.onrender.com/api`.
- **When running locally (`localhost:3000` or `127.0.0.1`):** Calls target `http://localhost:3000/api`.

### CORS Configuration on the Backend
In `server/app.js`, CORS is configured to permit cross-origin requests:
```javascript
const corsOptions = {
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

When running in decoupled mode, ensure the backend Web Service has `CORS_ORIGIN=*` or includes your frontend URL (`https://ualbany-librarydesk.onrender.com`).

---

## Part 4: Remote Database Schema Migration & Seeding

Before processing live checkouts and returns, initialize the database tables on your remote MySQL / TiDB Cloud instance.

### Method 1: Local Terminal targeting Remote DB (Fastest)

Run the migration script directly from your Mac terminal substituting your TiDB Cloud credentials:

```bash
DB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com" \
DB_PORT=4000 \
DB_USER="xxxxxxxx.root" \
DB_PASSWORD="your_cluster_password" \
DB_NAME=ualbanylibrarydesk \
DB_SSL=true \
npm run db:init
```

Verify that all 7 tables and seed records are created:

```bash
DB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com" \
DB_PORT=4000 \
DB_USER="xxxxxxxx.root" \
DB_PASSWORD="your_cluster_password" \
DB_NAME=ualbanylibrarydesk \
DB_SSL=true \
npm run db:check
```

### Method 2: Render One-Off Shell
1. In the Render Dashboard, open your `ualbanylibrarydesk` Web Service.
2. Click the **Shell** tab on the left menu.
3. Run:
   ```bash
   npm run db:init
   npm run db:check
   ```

### Method 3: TiDB Cloud Web SQL Editor
1. Log in to [tidbcloud.com](https://tidbcloud.com).
2. Select your cluster `ualbanylibrarydesk-db` and click **SQL Editor**.
3. Copy the full content of `server/scripts/init-db.sql`.
4. Paste it into the query editor and click **Run**.

---

## Part 5: Deployment Verification Checklist

### Pre-Deployment Checks:
- [x] All `.env` and `server/.env` files are ignored in `.gitignore`.
- [x] Zero real passwords or API keys are committed to Git.
- [x] `server/config/db.js` supports `DB_SSL=true`.
- [x] `api-client.js` routes dynamically to `https://ualbanylibrarydesk.onrender.com/api`.
- [x] All 55 automated unit tests pass (`npm test`).

### Post-Deployment Checks:
- [ ] Backend Web Service shows **Live** on Render.
- [ ] `GET https://ualbanylibrarydesk.onrender.com/health` returns `200 OK` with `"database": {"status": "connected"}`.
- [ ] Navigating to root `/` redirects unauthenticated visitors to `/login.html`.
- [ ] Staff authentication succeeds with `linda.kovacs` / `password123`.
- [ ] Dashboard displays "Good afternoon, Linda." and live statistics.
- [ ] Checkout (`new-loan.html`) and return (`return-item.html`) transactions succeed.
- [ ] Clicking "Sign out" clears the session and returns to `login.html`.

---

## Part 6: Production Smoke Tests

### 1. Test Backend Health Endpoint:
```bash
curl -i https://ualbanylibrarydesk.onrender.com/api/health
```
Expected output:
```json
{"status":"ok","database":{"status":"connected"}}
```

### 2. Test Staff Authentication Endpoint:
```bash
curl -i -X POST https://ualbanylibrarydesk.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"netid":"linda.kovacs","password":"password123"}'
```
Expected output:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "netid": "linda.kovacs",
    "name": "Linda Kovacs",
    "role": "Circulation Supervisor"
  }
}
```

### 3. Test Frontend Console Connection:
1. Open `https://ualbanylibrarydesk.onrender.com/` (or your static frontend URL) in Google Chrome.
2. Open Developer Tools (`F12` or `Cmd + Option + I`) and click the **Console** tab.
3. Execute:
   ```javascript
   fetch('https://ualbanylibrarydesk.onrender.com/api/health')
     .then(r => r.json())
     .then(d => console.log('✅ API Connected:', d))
     .catch(e => console.error('❌ Connection Error:', e));
   ```

---

## Part 7: Troubleshooting Guide

### Issue: "Sign in returns empty 0-byte response or loops back to login.html"
- **Cause:** Request went to a Render **Static Site** (`ualbany-librarydesk.onrender.com`) instead of the **Web Service** (`ualbanylibrarydesk.onrender.com`). Static sites do not run Node.js/Express.
- **Fix:** Access the Web Service directly at `https://ualbanylibrarydesk.onrender.com/login.html` or ensure `api-client.js` routes API requests to `https://ualbanylibrarydesk.onrender.com/api`.

### Issue: "Database status is disconnected / ping: cannot resolve host"
- **Cause:** `DB_HOST` in Render Environment Variables was entered as a cluster name (e.g. `ualbanylibrarydesk-db.tidbcloud.com`), which is not a valid DNS host.
- **Fix:** In TiDB Cloud, click **Connect** on your cluster. Copy the real host (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`), set `DB_PORT=4000`, `DB_NAME=ualbanylibrarydesk`, and `DB_SSL=true`.

### Issue: "TiDB SSL connection rejected"
- **Cause:** Cloud databases require TLS/SSL encryption.
- **Fix:** Set environment variable `DB_SSL=true` in Render.

### Issue: "CORS error in browser console"
- **Cause:** When using a decoupled static frontend, the backend rejected the origin.
- **Fix:** In the backend Web Service environment variables, set `CORS_ORIGIN=*` and `FRONTEND_URL=https://ualbany-librarydesk.onrender.com`.

### Issue: "Free Tier spins down after inactivity (Cold Start)"
- **Note:** Render's free tier spins down web services after 15 minutes of inactivity. The first request after sleep may take 30–50 seconds while the container initializes. Subsequent requests respond immediately.

---

## Part 8: URLs & Quick Reference Summary

| Service | Environment | URL |
| :--- | :--- | :--- |
| **Backend Web Service** | Production (Render) | `https://ualbanylibrarydesk.onrender.com` |
| **Backend Health Check** | Production (Render) | `https://ualbanylibrarydesk.onrender.com/health` |
| **Decoupled Frontend Static Site** | Production (Render CDN) | `https://ualbany-librarydesk.onrender.com` |
| **Local Full-Stack Server** | Development (Localhost) | `http://localhost:3000` |
| **Database Console** | TiDB Cloud | `https://tidbcloud.com` (Cluster: `ualbanylibrarydesk-db`) |
