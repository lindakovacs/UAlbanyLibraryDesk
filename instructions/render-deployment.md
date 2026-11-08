# Render Deployment Guide (Milestone 8)

This guide provides step-by-step instructions for deploying the **UAlbany LibraryDesk Portal** to [Render](https://render.com), configuring environment variables, running migrations against a managed MySQL database, and conducting smoke tests.

---

## 1. Architecture on Render

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Render Web Service                              │
│                    (ualbany-librarydesk.onrender.com)                  │
│                                                                        │
│   ┌───────────────────────────┐      ┌───────────────────────────────┐ │
│   │     Frontend Client       │      │     Node.js / Express API     │ │
│   │  (Static HTML / CSS / JS) │ ────►│   (Health, Auth, Circulation) │ │
│   └───────────────────────────┘      └──────────────┬────────────────┘ │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                                      │ SSL / TCP (Port 3306)
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │    Managed MySQL Database     │
                                       │ (TiDB Cloud / Aiven / Railway)│
                                       └───────────────────────────────┘
```

---

## 2. Prerequisites

1. A [GitHub](https://github.com) account with repository access to `lindakovacs/UAlbanyLibraryDesk`.
2. A [Render](https://render.com) account (free tier supported).
3. A managed MySQL 8.0-compatible database instance:
   - **Recommended Free Managed Options:**
     - **[TiDB Cloud](https://tidbcloud.com)**: Free Serverless tier (5GB storage, 100% MySQL syntax compatible).
     - **[Aiven for MySQL](https://aiven.io)**: Free trial / managed MySQL instance.
     - **[Railway](https://railway.app)**: One-click managed MySQL database.

---

## 3. Deployment Method A: Infrastructure as Code (`render.yaml` Blueprint)

The repository includes a ready-to-use [`render.yaml`](../render.yaml) blueprint:

1. Log in to your **Render Dashboard**.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`UAlbanyLibraryDesk`).
4. Render will parse `render.yaml` and prompt you for the un-synced database credentials:
   - `DB_HOST`: Your remote MySQL hostname (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`)
   - `DB_USER`: Your MySQL username
   - `DB_PASSWORD`: Your MySQL user password
5. Click **Apply**. Render will automatically provision the web service, install dependencies, and build the project.

---

## 4. Deployment Method B: Manual Web Service Setup

If you prefer configuring via the Render web interface:

1. In the **Render Dashboard**, click **New +** ➔ **Web Service**.
2. Select your repository `UAlbanyLibraryDesk`.
3. Configure the service settings:
   - **Name:** `ualbany-librarydesk`
   - **Region:** `Oregon (US West)` or closest to your database
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for repository root)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. Click **Advanced** and set the **Health Check Path** to `/health`.

5. Under **Environment Variables**, add the following keys:

| Environment Variable | Value / Example | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `FRONTEND_URL` | `https://ualbany-librarydesk.onrender.com` | Base URL of the deployed application |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `JWT_SECRET` | *(Click "Generate" or enter random 32+ char string)* | Signing secret for staff JWT tokens |
| `JWT_EXPIRE` | `7d` | Token lifetime (7 days) |
| `DB_HOST` | `your-managed-db.provider.com` | Remote MySQL server host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `your_remote_db_user` | Remote database username |
| `DB_PASSWORD` | `your_actual_remote_password` | Remote database password |
| `DB_NAME` | `ualbanylibrarydesk` | Database name |
| `DB_CONNECTION_LIMIT`| `10` | Pool connection limit |

6. Click **Create Web Service**.

---

## 5. Running Database Migrations on Remote MySQL

Before the service accepts traffic, initialize the database tables on your managed MySQL instance:

### Option 1: Render One-Off Shell
1. In the Render Dashboard, navigate to your web service.
2. Click the **Shell** tab to open an SSH terminal into your running instance.
3. Run the migration script:
   ```bash
   npm run db:init
   ```
4. Verify table creation:
   ```bash
   npm run db:check
   ```

### Option 2: Run Migrations from Your Local Machine Targeting Remote DB
You can run migrations locally pointing to your remote MySQL server:

```bash
DB_HOST=your-remote-host.com DB_USER=your_user DB_PASSWORD=your_password DB_NAME=ualbanylibrarydesk npm run db:init
```

---

## 6. Post-Deployment Verification & Smoke Tests

Once Render shows the service as **Live**, perform the following smoke tests:

### 1. Health Probe
Open `https://<your-service-name>.onrender.com/api/health` in your browser.  
Verify that:
- HTTP status is `200 OK`
- `status` is `"ok"`
- `database.status` is `"connected"`

### 2. Frontend Landing
Open `https://<your-service-name>.onrender.com/` in your browser.  
Verify that:
- The Overview dashboard loads cleanly without console errors.
- Navigation links between pages function via PJAX.

### 3. Staff Sign-in
Open `https://<your-service-name>.onrender.com/login.html`.
- NetID: `linda.kovacs`
- Password: `password123`
- Click **Sign in** and verify redirect to `index.html` with authenticated session.

### 4. Equipment Circulation
1. Open `https://<your-service-name>.onrender.com/new-loan.html`.
2. Check out an available equipment item to borrower `emma.wilson`.
3. Verify that the active loan appears in `loans.html`.
4. Open `return-item.html`, process the return, and confirm the stock count updates.

---

## 7. Rollback & Troubleshooting Procedures

### Service Fails to Start
- **Symptom:** Render displays `Build succeeded` followed by `Deploy failed` or container crash.
- **Remedy:** Check Render's **Logs** tab. If the database is not reachable at startup, ensure your remote MySQL host allows incoming connections from `0.0.0.0/0` (or Render's outbound IPs) and that SSL/TLS is properly negotiated.

### Free Tier Sleep Behavior
- **Note:** Render's free tier spins down web services after 15 minutes of inactivity. The first request after spin-down may take 30–50 seconds to boot the container. Subsequent requests respond instantly.
- **Tip:** For high-availability production without spin-down, upgrade the web service to the `Starter` plan ($7/mo).

### Rollback to a Previous Deployment
1. Go to your Web Service in the Render Dashboard.
2. Click the **Deploys** tab.
3. Find the previous successful deploy.
4. Click the three dots (`...`) next to it and select **Rollback to this deploy**.
