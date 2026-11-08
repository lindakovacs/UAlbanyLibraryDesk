# UAlbany LibraryDesk Portal

UAlbany LibraryDesk is an Equipment and Resource Management System designed for University at Albany library circulation staff to streamline the tracking, preparation, sanitization, assignment, circulation, and reporting of university equipment. The system addresses challenges identified during stakeholder interviews related to equipment readiness, borrower accountability, historical usage reporting, and workflow visibility.

This Project is a Full-stack web application, a complete production-ready solution with a modern frontend (HTML/CSS/JavaScript), backend API (Node.js/Express), and MySQL database. Features include NetID user authentication, staff profiles, equipment inventory tracking, multi-step preparation and sanitization workflows, checkouts, returns, borrower accountability, automated reporting, and real-time alerts.

## Features & Interactivity

The project interactivity includes:

- **Equipment Checkouts:** Issuing equipment loans to borrowers with NetID verification, due date assignment, and accessory check.
- **Equipment Returns:** Processing returns, recording device condition, verifying accessories, and routing to readiness queues.
- **Preparation Workflow:** Multi-step equipment readiness pipeline (Details, Task Assignment, Sanitization/Wipe Checklist, Supervisor Review).
- **Interactive Checklists:** Real-time completion progress tracking ("X of Y steps complete") with dynamic state updates.
- **Live Search & Filtering:** Client-side filtering across equipment, active loans, borrowers, and preparation queues with empty-state feedback.
- **Catalog Category Filtering:** Combined search keyword and category dropdown filtering for the equipment collection.
- **Post-Checkout Reports:** Timeframe/semester filtering with automated CSV report generation and single-item/full-semester download.
- **Alerts & Notifications:** Priority alerts for overdue loans, items due today, and equipment awaiting readiness review with quick filter tabs.
- **Library Status Toggle:** Interactive open/closed library indicator in the top header.
- **Smooth Page Navigation:** Client-side PJAX page swapping and scrollbar gutter stabilization to eliminate white flashes and screen jumping on navigation.
- **Responsive Layout:** Adaptive layouts optimized for desktop, tablet, and mobile devices.

Static Site Deployed via [GitHub Pages](https://lindakovacs.github.io/UAlbany_LibraryDesk/)

## Project Team

- Linda Kovacs
- Veronica Dindial
- Rym Mahiddine
- Wendy Ouedraogo
- Amari Scott

## Pages & Functionality

### Overview & Dashboard
- **`index.html`** — Staff overview dashboard featuring real-time KPI metrics (total equipment, active loans, due today, overdue), quick checkout/return action triggers, preparation queue summary, and recent circulation activity.

### Authentication & Staff Portal
- **`login.html`** — Authorized staff sign-in portal featuring UAlbany purple and gold split branding, NetID credentials authentication, and team credits.
- **`profile.html`** — Staff member profile displaying user's credentials, NetID, circulation division, assigned desk station, active permissions, and session status.
- **`notifications.html`** — Centralized staff notification center with category filtering (*All alerts*, *Overdue*, *Due today*, *Preparation*) and direct action links.
- **`help.html`** — Circulation desk operating guidelines, standard operating procedures, damaged item quarantine protocols, and quick contact directory.

### Loans & Circulation
- **`loans.html`** — Active equipment loans management table with live search, borrower avatars, due dates, loan status tags, and return triggers.
- **`loans-overdue.html`** — Dedicated filtered view isolating overdue equipment loans requiring borrower follow-up.
- **`loan-details.html`** — Comprehensive loan record view with borrower standing, loan timeline, included kit accessory manifest, and return actions.
- **`new-loan.html`** — Equipment checkout form with borrower NetID input, 13-item collection selector with query pre-selection, loan duration, and accessory verification.
- **`return-item.html`** — Equipment check-in form with loan selector, condition assessment, accessory checklist, and destination routing.

### Equipment & Borrowers
- **`equipment.html`** — Complete 13-item University Library equipment catalog with live text search, category dropdown filter, availability counters, and checkout actions.
- **`borrowers.html`** — Library borrower roster displaying student IDs, active loan counts, account standing badges, and search filtering.
- **`reports.html`** — Post-checkout administrative reporting view with semester presets (Fall 2026, Summer 2026, Spring 2026, Custom), utilization statistics, and instant CSV export.

### Equipment Preparation Workflow
- **`preparation-progress.html`** — Queue view for equipment awaiting staff task assignment.
- **`preparation.html`** — Queue view for equipment actively undergoing preparation and sanitization.
- **`preparation-review.html`** — Queue view for completed equipment awaiting supervisor readiness review.
- **`preparation-ready.html`** — Queue view for equipment verified and ready for lending.
- **`preparation-all.html`** — Master preparation queue showing all 11 equipment items across every stage.
- **`preparation-details.html`** — Step 1: Equipment overview, required steps checklist, and preparation notes.
- **`preparation-assignment.html`** — Step 2: Staff assignment form, target completion date, and task checklist selection.
- **`preparation-checklist.html`** — Step 3: Interactive sanitization, user data wipe, inventory check, and repackaging checklist.
- **`preparation-review-details.html`** — Step 4: Final supervisor review, issue notes inspection, and readiness sign-off for lending.

## Shared UI Components

Custom Web Components implemented in `components.js`:

- **`<app-sidebar>`** — Navigation sidebar with automatic route detection, active state indicators, UAlbany crest, and persistent footer links.
- **`<app-header>`** — Global page header featuring dynamic breadcrumb navigation, interactive library open/closed toggle, notification bell, profile summary, and sign-out link.
- **`<app-footer>`** — Standard team copyright footer and institutional credits.
- **`<loan-tabs>`** — Tab navigation bar switching between all loans and overdue loans with real-time count badges.
- **`<preparation-tabs>`** — 5-status queue navigation tabs with live item counts across preparation stages.
- **`<preparation-steps>`** — 4-step preparation workflow progress navigation (1 Details, 2 Assignment, 3 Checklist, 4 Review).

## Styles & Assets

- **`styles.css`** — Core stylesheet defining UAlbany brand colors (`#46166b` Purple, `#eeb211` / `#fdbb30` Gold, `#f1ebf6` Background), typography, CSS Grid/Flexbox layouts, card components, form controls, and responsive media queries.
- **`components.js`** — Web Components definitions, PJAX seamless navigation, live search filters, and interactive checklist behavior.
- **`assets/`** — Static SVG graphics, including `UAlbany_logo.svg`, `favicon.svg`, and `library-equipment.jpg`.

## Getting Started

### 1. Download or Clone the Repository

Clone the project to your local machine using Git:

```bash
git clone https://github.com/lindakovacs/UAlbanyLibraryDesk.git
cd UAlbanyLibraryDesk
```

Alternatively, download the ZIP archive by clicking the green **Code** button on GitHub and selecting **Download ZIP**, then extract the folder on your computer.

### 2. View in Your Browser

Open any HTML file in your browser (for example, in VS Code, right-click on `index.html` or `login.html` and select **"Open with Live Server"**, or use the keyboard shortcut `Alt + L` then `Alt + O`). 

Alternatively, open `index.html` directly in any modern web browser. No build step, bundler, or local server is required for this Static UI phase.

## Backend & API Server (Node.js & Express)

A Node.js and Express backend service powers the application API and can also serve the static front-end assets:

### Prerequisites
- Node.js (`>= 16.0.0`)
- npm (`>= 8.0.0`)

### Setup & Running
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment configuration:**
   Copy `.env.example` to `.env` (default values run out-of-the-box on port 3000):
   ```bash
   cp .env.example .env
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
   For development with hot reloading:
   ```bash
   npm run dev
   ```
4. **View the application:**
   Open [http://localhost:3000/](http://localhost:3000/) in your web browser to view the project.

5. **Run automated tests:**
   ```bash
   npm test
   ```

### Application & Health Check Endpoints
- `GET http://localhost:3000/` — Main portal interface (serves the client-side JavaScript frontend)
- `GET http://localhost:3000/health` or `GET http://localhost:3000/api/health` — Returns status (`200 OK`), uptime, timestamp, environment, database status, and version.
- `GET http://localhost:3000/ready` or `GET http://localhost:3000/api/ready` — Readiness probe for monitoring and deployments.

### Authentication Endpoints (JWT & bcrypt)
- `POST /api/auth/login` — Authenticates NetID and password using bcrypt comparison; returns user profile and signed JWT Bearer token (`tokenType: Bearer`, 7-day expiration).
- `GET /api/auth/getCurrentUser` (or `/api/auth/me`) — Protected route; requires `Authorization: Bearer <token>`; returns active staff profile and permissions.
- `POST /api/auth/register` — Registers new staff member with bcrypt-hashed password (10 salt rounds); issues signed JWT token.
- `POST /api/auth/logout` — Signs out staff user session.

## MySQL Database Setup & VS Code Guide

A step-by-step guide for developers downloading and setting up the database in Visual Studio Code:

### 1. Prerequisites
- **MySQL Server** installed and running on your local machine:
  - **macOS (Homebrew):** `brew install mysql && brew services start mysql`
  - **Windows / Mac (MySQL Installer):** Download from [mysql.com](https://dev.mysql.com/downloads/mysql/) and ensure the MySQL service is started.
  - **Docker:** `docker run --name ualbany-mysql -e MYSQL_ROOT_PASSWORD=your_actual_password_here -e MYSQL_DATABASE=ualbanylibrarydesk -p 3306:3306 -d mysql:latest`
- **Recommended VS Code Extension:**
  - **MySQL** (by Weihan Chen / cweijan) or **SQLTools** with MySQL driver.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the project root (or inside `server/.env`):
```bash
cp .env.example .env
```
Open `.env` in VS Code and fill in your actual MySQL credentials:
```ini
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password_here
DB_NAME=ualbanylibrarydesk
```

### 3. Initialize the Database Schema & Seed Data
You can initialize the database using any of these methods:

**Method A: Automated Migration Command (Fastest)**
Run the migration script to automatically connect to MySQL, create the `ualbanylibrarydesk` database, generate all tables with foreign keys and indexes, and seed initial records:
```bash
npm run db:init
```

**Method B: Inside VS Code with MySQL Extension**
1. In the VS Code Activity Bar, click the **Database** icon and click **+ Add Connection**.
2. Enter your MySQL connection credentials:
   - Host: `localhost`
   - Port: `3306`
   - User: `root`
   - Password: `your_actual_password_here`
3. Open [`server/scripts/init-db.sql`](./server/scripts/init-db.sql) in VS Code.
4. Right-click anywhere inside the file and select **Run MySQL Query** (or click the **Execute** button at the top).

**Method C: Via Terminal CLI**
```bash
mysql -u root -p < server/scripts/init-db.sql
```

### 4. Verify Database Health & Diagnostics
Run the database diagnostic tool to verify connectivity and view record counts across all tables:
```bash
npm run db:check
```

Expected output:
```text
✓ MySQL Server Connected Successfully!
✓ Found 8 tables in database 'ualbanylibrarydesk':
   - borrowers                    : 5 records
   - equipment                    : 13 records
   - equipment_accessories        : 27 records
   - loans                        : 5 records
   - preparation_checklist_items  : 16 records
   - preparation_items            : 4 records
   - report_metrics               : 11 records
   - staff_users                  : 1 records
```

### 5. Running Test Queries in VS Code
Open [`server/SQLQueries.sql`](./server/SQLQueries.sql) in VS Code. This file contains structured, ready-to-run queries:
- **System Health:** Version checks, table lists, and row counts.
- **Staff Authentication:** Staff credential lookups and workstation status.
- **Equipment Catalog:** Live search, category filtering, availability, and accessory manifests.
- **Borrower Directory:** Active accounts, standing checks, and open loan counts.
- **Circulation & Loans:** Active loans, due today, overdue items, checkout transactions, and return workflows.
- **Preparation Pipeline:** Status queues, multi-step sanitization checklists, and supervisor reviews.
- **Analytics & KPIs:** Dashboard KPI metrics and CSV reporting data.

Highlight any query in VS Code and press `Ctrl + Alt + E` (or `Cmd + Enter`) to execute it and view results in the integrated data panel.

## End-to-End Integration Testing (Frontend + Backend + Database)

This section guides you through testing the full-stack system with all three tiers—**Client-Side Frontend (HTML/CSS/JS)**, **Node.js/Express API Backend**, and **MySQL Database**—connected and communicating in real time. For a complete command reference and copy-paste script catalog, see [`instructions/test-connection.md`](./instructions/test-connection.md).

```text
┌───────────────────────────┐         HTTP / JSON API (Fetch)        ┌───────────────────────────┐        mysql2 / Pool & Transactions      ┌───────────────────────────┐
│     Frontend Client       │ ◄────────────────────────────────────► │    Node.js / Express API  │ ◄──────────────────────────────────────► │       MySQL Database      │
│  (HTML5 / CSS3 / Vanilla  │       Authorization: Bearer <JWT>      │  (Port 3000, Auth Routes, │         Connection Pooling (3306),       │  (Database: ualbanylibrary│
│    JS & api-client.js)    │                                        │  Circulation Controllers) │         ACID Relational Storage)         │   desk, 8 Relational Tbls)│
└───────────────────────────┘                                        └───────────────────────────┘                                          └───────────────────────────┘
```

### Full-Stack Architecture Mapping Across All 22 Views

All 22 frontend HTML views and workflows are actively wired to the Node.js/Express API and MySQL database through `api-client.js`:

| Page | View / Feature | Backend Endpoint / Action | Connected Database Tables |
|---|---|---|---|
| **`login.html`** | Staff sign-in & JWT issuance | `POST /api/auth/login` | `staff_users` (bcrypt hash check) |
| **`index.html`** | Dashboard overview & statistics | `GET /api/reports/summary` | Aggregated from `equipment`, `loans`, `preparation_items` |
| **`profile.html`** | Authenticated staff profile & shift | `GET /api/auth/getCurrentUser` | `staff_users` (Bearer JWT validation) |
| **`equipment.html`** | Live equipment catalog & category search | `GET /api/equipment` | `equipment`, `equipment_accessories` |
| **`new-loan.html`** | Equipment checkout form & NetID autofill | `POST /api/loans` (Atomic transaction) | `loans` (insert), `equipment` (decrement stock), `borrowers` (increment active loans) |
| **`loans.html`** | Active equipment loans table | `GET /api/loans` | `loans`, `equipment`, `borrowers` |
| **`loans-overdue.html`** | Overdue loans filtered table | `GET /api/loans?status=overdue` | `loans` (filtered by due date) |
| **`loan-details.html`** | Single loan record (`?id=LN-...`) | `GET /api/loans/:id` | `loans`, `equipment`, `borrowers` |
| **`return-item.html`** | Return check-in & destination routing | `POST /api/loans/:id/return` | `loans` (status `returned`), `equipment` (increment stock), `preparation_items` (staging) |
| **`borrowers.html`** | Borrower accounts & active loan counts | `GET /api/borrowers` | `borrowers`, `loans` |
| **`reports.html`** | Equipment utilization & CSV export | `GET /api/reports` | `report_metrics`, `loans`, `equipment` |
| **`notifications.html`** | Alert center & category count badges | `GET /api/reports/summary` | Priority queries across `loans` and `preparation_items` |
| **`preparation-*.html`** (5 queue pages) | Readiness pipeline queues & step counters | `GET /api/preparation` | `preparation_items`, `preparation_checklist_items` |
| **`preparation-assignment.html`** | Task assignment to staff member | `PATCH /api/preparation/:id` | `preparation_items` (`assigned_staff`, `target_date`, `status = in-prep`) |
| **`preparation-checklist.html`** | Sanitization & data wipe checklist | `PATCH /api/preparation/:id` | `preparation_checklist_items`, `preparation_items` |
| **`preparation-review-details.html`**| Supervisor review & ready-to-lend signoff | `PATCH /api/preparation/:id` | `preparation_items` (`status = ready`) |

---

### Step 1: Confirm MySQL Service & Database Readiness

Before starting the application, ensure MySQL is running locally and the `ualbanylibrarydesk` database contains initial tables and seed data:

1. Confirm MySQL is running on your system:
   ```bash
   # On macOS via Homebrew:
   brew services list
   ```
2. Run the database diagnostic tool to verify all 8 tables and records:
   ```bash
   npm run db:check
   ```
   *If starting fresh or tables are missing, run `npm run db:init` to create all 8 tables and populate the initial seed records.*

---

### Step 2: Start the Backend Server

Start the Node.js Express server from the project root directory:

```bash
npm start
```
*(or use `npm run dev` for automatic server reload on file changes)*

Verify the server and database connection banner in your terminal:
```text
==================================================
  UAlbany LibraryDesk API Server
==================================================
  Port        : 3000
  Environment : development
  Frontend URL: http://localhost:3000
==================================================
Connecting to MySQL database 'ualbanylibrarydesk' on localhost:3306...
✓ MySQL Connection Pool Initialized Successfully
✓ Connected to database: ualbanylibrarydesk
✓ Server ready to accept requests
```

---

### Step 3: Verify Backend & Database Connectivity via Health Endpoint

Before opening the user interface, verify the backend API can communicate with MySQL by querying the health endpoint:

- **Browser URL:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Terminal command:**
  ```bash
  curl -s http://localhost:3000/api/health
  ```

**Expected JSON Response (`200 OK`):**
```json
{
  "status": "ok",
  "uptime": 14.85,
  "timestamp": "2026-11-08T18:00:00.000Z",
  "environment": "development",
  "database": {
    "status": "connected",
    "name": "ualbanylibrarydesk",
    "host": "localhost"
  },
  "version": "1.0.0"
}
```
*When `database.status` reports `"connected"`, the Express backend is actively querying the MySQL server pool.*

---

### Step 4: Step-by-Step End-to-End Workflow in the Browser

Open your browser and navigate to the application:
👉 **[http://localhost:3000/](http://localhost:3000/)**

#### 1. Staff Authentication Test (Frontend ➔ API ➔ MySQL `staff_users` ➔ JWT)
1. Go to the staff sign-in page: [http://localhost:3000/login.html](http://localhost:3000/login.html).
2. Enter the default seeded staff credentials:
   - **NetID:** `linda.kovacs`
   - **Password:** `password123`
3. Click **Sign in**.
   - **Behind the scenes:**
     - The client-side handler in `api-client.js` sends `POST /api/auth/login`.
     - The Express server queries MySQL: `SELECT * FROM staff_users WHERE netid = 'linda.kovacs'`.
     - The server compares the submitted password against the stored bcrypt hash with `bcrypt.compare`.
     - A signed JWT token is issued and returned in the response payload.
     - `api-client.js` securely saves the token in browser `localStorage` (`librarydesk_token`) and redirects to `index.html`.
4. **Negative Test (Wrong Password):**
   - Click **Sign out** and attempt to sign in with NetID `linda.kovacs` and password `wrongpass`.
   - The backend responds with `401 Unauthorized` (`"Invalid NetID or password"`).
   - An accessible error alert banner appears on the login card without a page reload.

#### 2. Staff Profile & Session Verification
1. Navigate to [http://localhost:3000/profile.html](http://localhost:3000/profile.html).
2. The page invokes `window.LibraryDeskAPI.getCurrentUser()` with the Bearer authorization header (`Authorization: Bearer <token>`).
3. The server validates the JWT signature and returns the authenticated staff user's name, NetID, division, workstation, and permissions.

#### 3. Equipment Catalog & Filtering Test (Frontend ➔ API ➔ MySQL `equipment`)
1. Navigate to [http://localhost:3000/equipment.html](http://localhost:3000/equipment.html).
2. The collection displays 13 equipment items populated from `GET /api/equipment`.
3. Select a category from the dropdown (e.g., **"Creative Technology"**, **"Computing"**, or **"Audio/Visual"**).
4. Enter search terms in the search bar. The client filters matching items matching data in the MySQL `equipment` table.

#### 4. New Equipment Checkout Test (Frontend ➔ API ➔ MySQL Transaction)
1. Navigate to [http://localhost:3000/new-loan.html](http://localhost:3000/new-loan.html).
2. Fill out the checkout form:
   - **Borrower NetID:** `emma.wilson` (or choose another registered borrower)
   - **Equipment:** Select `EQ-001` (*Sony Alpha A7 IV Kit*)
   - **Asset Tag:** `CAM-042`
3. Click **Complete checkout**.
   - **Behind the scenes:**
     - The form submits to `POST /api/loans`.
     - The backend executes an atomic MySQL transaction (`START TRANSACTION`):
       - Inserts a new loan record into `loans` with `status = 'active'`.
       - Decrements `available_count` for `EQ-001` in `equipment`.
       - Increments `active_loans_count` for `emma.wilson` in `borrowers`.
       - Commits the transaction (`COMMIT`).
4. You are redirected to [http://localhost:3000/loans.html](http://localhost:3000/loans.html), where the newly created active loan appears in the loans table.

#### 5. Verify the Transaction Directly in MySQL (VS Code Extension or Terminal)
In VS Code, open [`server/SQLQueries.sql`](./server/SQLQueries.sql) and run the queries under **Section 5 (Circulation & Loans Management)**:
```sql
-- 1. Verify the newly created loan row:
SELECT loan_id, borrower_name, netid, equipment_name, status, checkout_date, due_date
FROM loans
ORDER BY loan_id DESC
LIMIT 1;

-- 2. Verify equipment available count was decremented:
SELECT equipment_id, name, available_count, total_count
FROM equipment
WHERE equipment_id = 'EQ-001';

-- 3. Verify borrower active loans count was incremented:
SELECT netid, full_name, active_loans_count
FROM borrowers
WHERE netid = 'emma.wilson';
```

#### 6. Equipment Return Check-in Test (Frontend ➔ API ➔ MySQL Return & Preparation)
1. Navigate to [http://localhost:3000/return-item.html](http://localhost:3000/return-item.html).
2. Select the open loan from the dropdown selector.
3. Choose the condition (e.g., **"Good"**) and next destination (e.g., **"Prep Queue"** or **"Ready Shelf"**).
4. Click **Confirm return**.
   - The frontend dispatches `POST /api/loans/:id/return`.
   - The server updates the loan in MySQL to `status = 'returned'` and stamps `return_date = NOW()`.
   - If destination was set to prep queue, a new record is added to `preparation_items`.
   - The loan is closed and removed from active loans on `loans.html`.

#### 7. Session Sign Out
1. Click **Sign out** in the sidebar navigation or header profile menu.
2. The client calls `POST /api/auth/logout`, clears the JWT Bearer token and user session from `localStorage`, and safely redirects to `login.html`.

---

### Step 5: Run Automated Integration Tests

Execute the automated test suite to run all health check and REST API integration tests against the server and database:

```bash
npm test
```

This runs both test files:
- **`tests/health.test.js`** — 6 tests verifying health status (`/health`, `/api/health`, `/ready`, `/api/ready`), CORS security headers, and 404 handler.
- **`tests/api.test.js`** — 24 tests verifying staff authentication, bcrypt password hashing, JWT token validation, protected route access control, equipment catalog endpoints, borrower lookups, loan checkout transactions, return workflows, preparation pipeline, and summary KPI analytics.

**Expected test output:**
```text
✓ 6 passed in tests/health.test.js
✓ 24 passed in tests/api.test.js
-----------------------------------------
Tests: 30 passed, 0 failed, 30 total
-----------------------------------------
```

## Project Structure

```
.
├── assets/
│   ├── UAlbany_logo.svg
│   ├── favicon.svg
│   └── library-equipment.jpg
├── instructions/
│   ├── README.md
│   ├── render-deployment.md
│   └── test-connection.md
├── server/
│   ├── .env.example
│   ├── SQLQueries.sql
│   ├── check-db.js
│   ├── config/
│   │   ├── db.js
│   │   └── index.js
│   ├── data/
│   │   └── store.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── validate.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── borrowers.js
│   │   ├── equipment.js
│   │   ├── health.js
│   │   ├── loans.js
│   │   ├── preparation.js
│   │   └── reports.js
│   ├── scripts/
│   │   ├── init-db.sql
│   │   └── run-migrations.js
│   ├── app.js
│   ├── index.js
│   └── server.js
├── tests/
│   ├── api.test.js
│   └── health.test.js
├── .env.example
├── api-client.js
├── package.json
├── package-lock.json
├── borrowers.html
├── components.js
├── equipment.html
├── help.html
├── index.html
├── loan-details.html
├── loans.html
├── loans-overdue.html
├── login.html
├── new-loan.html
├── notifications.html
├── preparation.html
├── preparation-all.html
├── preparation-assignment.html
├── preparation-checklist.html
├── preparation-details.html
├── preparation-progress.html
├── preparation-ready.html
├── preparation-review.html
├── preparation-review-details.html
├── profile.html
├── reports.html
├── return-item.html
├── styles.css
├── render.yaml
├── LICENSE
└── README.md
```

## Development Approach

The project implementation milestones:

1. Repository boilerplate
2. HTML pages and components
3. CSS styling
4. Client-side JavaScript frontend
5. Node.js and Express backend
6. MySQL persistence
7. Render deployment

See [`instructions/`](./instructions/) for the complete implementation sequence.

## Technologies

- Frontend: HTML5, CSS3, JavaScript (Vanilla - no frameworks), DOM Manipulation, Fetch API
- Backend: Node.js, Express.js, MySQL database, JWT Authentication, bcryptjs
- Security: JWT tokens, bcrypt hashing, input validation, XSS prevention, CSRF protection
- Deployment: Render (free tier with HTTPS, auto-deploy from GitHub)
- DevTools: Git, GitHub, npm, nodemon, Postman

## Project Links

- [GitHub Repository - Version Control & Collaboration](https://github.com/lindakovacs/UAlbanyLibraryDesk)
- [Figma Prototype](https://www.figma.com/proto/hOLNuCHjmtsA7JDbaTkGuS/UAlbany-LibraryDesk?node-id=81-259&p=f&t=FXax9FUBmLrjkIsb-0&scaling=scale-down-width&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=81%3A259)
- [GitHub Pages – Static Website Deployment & Hosting](https://lindakovacs.github.io/UAlbany_LibraryDesk/)
- [GitHub Repository - Version Control & Collaboration​ - Static Version](https://github.com/lindakovacs/UAlbany_LibraryDesk)
