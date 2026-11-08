# Full-Stack Integration Testing Guide

This instruction file documents every command, script, HTTP test, and database query used to test and verify the connection between the **Frontend (HTML/CSS/JS)**, **Backend (Node.js/Express API)**, and **MySQL Database**.

---

## Quick Reference Summary of Commands

| Category | Command / Script | Purpose |
|---|---|---|
| **Database Diagnostics** | `npm run db:check` | Verifies MySQL connection and reports row counts across all 8 tables |
| **Database Initialization** | `npm run db:init` | Runs migration script (`init-db.sql`) to recreate schema and seeds |
| **Process Inspection** | `lsof -i :3000` | Checks if port 3000 is open and identifies the running process ID |
| **Kill Stale Process** | `kill <PID>` | Terminates an old server process occupying port 3000 |
| **Start Backend Server** | `npm start` | Launches the Express server on `http://localhost:3000` |
| **Development Server** | `npm run dev` | Launches with nodemon for automatic file reloading |
| **Health Probe** | `curl -s http://localhost:3000/api/health` | Tests API uptime and live MySQL pool connectivity |
| **Staff Sign-in Test** | `curl -s -X POST http://localhost:3000/api/auth/login ...` | Authenticates NetID credentials against MySQL with bcrypt |
| **Automated Test Suite** | `npm test` | Runs the 30-assertion suite (`tests/health.test.js` & `tests/api.test.js`) |
| **Interactive UI** | Open `http://localhost:3000/login.html` | Browser sign-in, session storage, and circulation workflows |

---

## 1. Database Connection & Schema Verification

### 1.1 Verify MySQL Service Status
Ensure the local MySQL server daemon is active:

```bash
# macOS (Homebrew)
brew services list

# Check MySQL connection directly
mysqladmin ping -u root -p
```

### 1.2 Run Automated Database Diagnostic Script
Verify that Node.js can connect to the MySQL connection pool and check that all 8 required tables exist:

```bash
npm run db:check
```

**Underlying Script:** [`server/check-db.js`](../server/check-db.js)  
**Expected Output:**
```text
==================================================
  UAlbany LibraryDesk - Database Connection Check
==================================================
Connecting to MySQL database 'ualbanylibrarydesk' on localhost:3306...
✓ MySQL Server Connected Successfully!

Database Information:
  - Database Name : ualbanylibrarydesk
  - MySQL Version : 9.4.0
  - Host          : localhost:3306
  - User          : root

Checking database tables...
✓ Found 8 tables in database 'ualbanylibrarydesk':
  - borrowers                    : 5 records
  - equipment                    : 13 records
  - equipment_accessories        : 27 records
  - loans                        : 5 records
  - preparation_checklist_items  : 16 records
  - preparation_items            : 4 records
  - report_metrics               : 11 records
  - staff_users                  : 1 records
==================================================
```

### 1.3 Quick Node.js In-Line Table Query
To quickly query the tables directly from your terminal:

```bash
node -e "const { pool } = require('./server/config/db'); pool.query('SHOW TABLES').then(([r]) => { console.log(r); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });"
```

### 1.4 Inspect Seeded Staff User & Password Hash
Verify that the default staff user exists and has a valid bcrypt hash:

```bash
node -e "const { pool } = require('./server/config/db'); pool.query('SELECT netid, name, email, LEFT(password_hash, 15) AS hash_prefix, status FROM staff_users').then(([r]) => { console.table(r); process.exit(0); });"
```

### 1.5 Re-initialize Database (If Starting Fresh)
If tables are missing or seed data needs to be restored:

```bash
npm run db:init
```

---

## 2. Server Process & Port Management

### 2.1 Check if Port 3000 is Already in Use
If an old server process is still listening on port 3000, new routes will not be picked up:

```bash
lsof -i :3000
```

**Sample Output:**
```text
COMMAND   PID        USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    88375 lindakovacs   23u  IPv6 0xbb27fb9245e777ef      0t0  TCP *:3000 (LISTEN)
```

### 2.2 Terminate Stale Server Process
If an old process is detected, terminate it by its PID:

```bash
kill <PID>
# Example:
kill 88375
```

Confirm port 3000 is free:
```bash
lsof -i :3000
```
*(No output indicates the port is completely free)*

### 2.3 Start the Express Backend Server
Run the production server or the nodemon development server:

```bash
npm start
# or
npm run dev
```

**Expected Startup Log:**
```text
===============================================
 UAlbany LibraryDesk API Server running
 Environment : development
 Port        : 3000
 Health check: http://localhost:3000/health
 API Health  : http://localhost:3000/api/health
 Static UI   : http://localhost:3000/
 Frontend URL: http://localhost:3000
-----------------------------------------------
 MySQL DB    : Connected (v9.4.0) -> ualbanylibrarydesk
===============================================
```

---

## 3. Server Health & Database Connectivity Probes

### 3.1 Test API Health Endpoint
Tests that Express is serving requests and actively querying MySQL:

```bash
curl -s http://localhost:3000/api/health
```

**Expected Response (`200 OK`):**
```json
{
  "status": "ok",
  "timestamp": "2026-11-08T19:38:30.224Z",
  "uptime": 9,
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "database": "ualbanylibrarydesk",
    "host": "localhost",
    "serverVersion": "9.4.0"
  }
}
```

### 3.2 Test Readiness Probe
Tests readiness for traffic:

```bash
curl -s http://localhost:3000/api/ready
```

**Expected Response (`200 OK`):**
```json
{
  "status": "ready",
  "timestamp": "2026-11-08T19:38:30.224Z",
  "uptime": 9
}
```

---

## 4. Authentication & Security Testing (JWT & bcrypt)

### 4.1 Positive Test: Valid Staff Login
Authenticates with seeded NetID credentials. The server queries MySQL, checks the password hash via `bcrypt.compare`, and issues a signed JWT:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"netid":"linda.kovacs","password":"password123"}'
```

**Expected Response (`200 OK`):**
```json
{
  "status": "success",
  "message": "Successfully authenticated as Linda Kovacs",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "user": {
    "netid": "linda.kovacs",
    "name": "Linda Kovacs",
    "universityId": "001239847",
    "department": "University Libraries",
    "division": "Access & Circulation Services",
    "email": "linda.kovacs@ualbany.edu",
    "role": "Authorized Circulation Specialist",
    "deskStation": "Uptown Circulation Desk #2",
    "workstationId": "DESK-CIRC-02 (Uptown)",
    "permissions": ["checkout", "return", "review", "reports"],
    "status": "active"
  }
}
```

### 4.2 Negative Test: Incorrect Password
Verifies standard OWASP-compliant unauthorized response:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"netid":"linda.kovacs","password":"wrongpassword"}'
```

**Expected Response (`401 Unauthorized`):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid NetID or password",
  "status": 401
}
```

### 4.3 Negative Test: Missing Required Fields
Verifies request body validation:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"netid":"","password":""}'
```

**Expected Response (`400 Bad Request`):**
```json
{
  "error": "Bad Request",
  "message": "Missing required field(s): netid, password",
  "missingFields": ["netid", "password"],
  "status": 400
}
```

### 4.4 Test Protected Endpoint with JWT Bearer Token
Extracts the token and queries the protected `/api/auth/getCurrentUser` route:

```bash
# Capture token into a shell variable
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"netid":"linda.kovacs","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Call protected endpoint
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/auth/getCurrentUser
```

**Expected Response (`200 OK`):**
```json
{
  "status": "success",
  "user": {
    "netid": "linda.kovacs",
    "name": "Linda Kovacs",
    "role": "Authorized Circulation Specialist",
    "permissions": ["checkout", "return", "review", "reports"]
  }
}
```

---

## 5. Circulation, Inventory & Dashboard API Testing

### 5.1 Equipment Catalog API
Test fetching all equipment and category filtering:

```bash
# Get all 13 items
curl -s http://localhost:3000/api/equipment

# Filter by Creative Technology category
curl -s "http://localhost:3000/api/equipment?category=Creative%20Technology"

# Get single item by ID
curl -s http://localhost:3000/api/equipment/EQ-001
```

### 5.2 Active Loans API
Test fetching open loan records:

```bash
# Get all loans
curl -s http://localhost:3000/api/loans

# Filter overdue loans
curl -s "http://localhost:3000/api/loans?status=overdue"
```

### 5.3 KPI Summary Metrics API
Test fetching aggregated statistics for the overview dashboard:

```bash
curl -s http://localhost:3000/api/reports/summary
```

**Expected Response (`200 OK`):**
```json
{
  "status": "success",
  "kpis": {
    "totalEquipment": 35,
    "activeLoans": 5,
    "dueToday": 2,
    "overdue": 1,
    "preparation": {
      "total": 4,
      "needsPreparation": 4,
      "inPreparation": 0,
      "awaitingReview": 0,
      "readyForLending": 0
    }
  }
}
```

### 5.4 Test Equipment Checkout Transaction (POST /api/loans)
Dispatches a new checkout. The backend executes an atomic transaction (`START TRANSACTION`), creates a loan, decrements equipment stock, and increments borrower active loans:

```bash
curl -s -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "borrower": "Emma Wilson",
    "netid": "emma.wilson",
    "equipmentId": "EQ-001",
    "assetTag": "CAM-042"
  }'
```

### 5.5 Test Equipment Return Check-in (POST /api/loans/:id/return)
Processes an equipment check-in, closes the loan in MySQL, and updates item readiness:

```bash
curl -s -X POST http://localhost:3000/api/loans/LN-1042/return \
  -H "Content-Type: application/json" \
  -d '{
    "condition": "good",
    "destination": "ready-shelf",
    "notes": "Returned on time in perfect condition"
  }'
```

---

## 6. Database Verification via SQL Queries

Open [`server/SQLQueries.sql`](../server/SQLQueries.sql) in VS Code (with the MySQL extension) or run these queries in the terminal to verify the database state directly:

```sql
-- 1. Inspect recent loans
SELECT loan_id, borrower_name, netid, equipment_name, status, checkout_date, due_date
FROM loans
ORDER BY loan_id DESC
LIMIT 5;

-- 2. Verify equipment availability
SELECT equipment_id, name, available_count, total_count
FROM equipment
WHERE equipment_id = 'EQ-001';

-- 3. Check borrower standing and active loan counts
SELECT netid, full_name, active_loans_count, standing
FROM borrowers;

-- 4. Check preparation queue status
SELECT prep_id, equipment_id, equipment_name, assigned_staff, status, target_date
FROM preparation_items;
```

---

## 7. Automated Test Suite Execution

Run the complete 30-assertion automated test suite:

```bash
npm test
```

**Test Files Executed:**
1. **`tests/health.test.js`** (6 tests):
   - `GET /health` returns 200 with system metadata
   - `GET /api/health` returns 200 with database status
   - `GET /ready` and `GET /api/ready` return readiness probe
   - CORS headers verification
   - 404 structured JSON error handling
2. **`tests/api.test.js`** (24 tests):
   - Staff login with valid credentials (returns signed JWT)
   - Password rejection for wrong credentials (401)
   - Required field validation (400)
   - Protected route access (`/api/auth/getCurrentUser`, `/api/auth/me`)
   - Registration with bcrypt hashing
   - Session verification
   - Equipment catalog filtering and detail lookups
   - Borrower lookups and loan history
   - Active and overdue loans filtering
   - Atomic checkout transaction handling
   - Return processing
   - Preparation pipeline status transitions
   - KPI summary reporting

**Target Result:**
```text
-----------------------------------------
Tests: 6 passed, 0 failed, 6 total
-----------------------------------------
API Tests: 24 passed, 0 failed, 24 total
-----------------------------------------
```

---

## 8. Interactive Browser Testing Checklist

Open [http://localhost:3000/](http://localhost:3000/) in your browser:

1. **Staff Sign-in ([http://localhost:3000/login.html](http://localhost:3000/login.html))**:
   - Enter NetID: `linda.kovacs`
   - Enter Password: `password123`
   - Click **Sign in**
   - *Verification:* JWT saved to `localStorage.librarydesk_token`, redirects to `index.html`.
2. **Dashboard Overview ([http://localhost:3000/index.html](http://localhost:3000/index.html))**:
   - Greeting dynamically renders `Good afternoon, Linda.`
   - KPI cards display live counts fetched from `/api/reports/summary`.
3. **Staff Profile ([http://localhost:3000/profile.html](http://localhost:3000/profile.html))**:
   - Displays authenticated NetID, full name, division, workstation ID, and active permissions.
4. **Equipment Catalog ([http://localhost:3000/equipment.html](http://localhost:3000/equipment.html))**:
   - Cards display live availability (e.g. `4 of 4 available`).
   - Category dropdown filters items.
5. **New Checkout ([http://localhost:3000/new-loan.html](http://localhost:3000/new-loan.html))**:
   - Select borrower `emma.wilson` and equipment `EQ-001`.
   - Submit form -> dispatches `POST /api/loans`, updates database, redirects to `loans.html`.
6. **Return Item ([http://localhost:3000/return-item.html](http://localhost:3000/return-item.html))**:
   - Select active loan, choose destination, and submit.
   - Dispatches `POST /api/loans/:id/return` and closes the loan.
7. **Sign Out**:
   - Click **Sign out** in the header or sidebar.
   - Clears `localStorage` and returns to `login.html`.
