# UAlbany LibraryDesk project plan

This is the complete implementation plan for UAlbany LibraryDesk. Work through
the steps in order, finish and verify one step before beginning the next, and
let the project owner choose what to stage and commit.

## Milestones

1. **Boilerplate** — Keep the root README, `.gitignore`, MIT license, and this
   instruction folder current.
2. **HTML** — Add one page or reusable component at a time. Verify each page
   in a browser and commit it separately.
3. **CSS** — Add layout, typography, color, responsive behavior, and states in
   small focused commits.
4. **Client-Side JavaScript Frontend** — Pure JavaScript frontend (HTML/CSS/JS
   Web Components and PJAX client-side architecture; no Python frontend).
5. **Express backend** — Add the Node.js/Express API incrementally, with
   validation and focused tests for each route.
6. **MySQL database** — Add the schema and migrations before wiring persistence
   into API routes. Keep credentials in environment variables.
7. **Render deployment** — Add deployment configuration only after local
   development, tests, and production builds are verified.

## 1. Repository setup

- Add the minimal `README.md`, `.gitignore`, MIT `LICENSE`, and this
  instructions folder.
- Document the team, technologies, prototype link, and phased workflow.
- Check that secrets, local environments, dependencies, and build output are
  ignored.
- Review the files and create the first commit manually.

## 2. HTML foundation

Build the static interface before adding styling or application behavior.

1. Add the base document structure and shared page shell.
2. Add the login page.
3. Add the preparation workspace page.
4. Add equipment detail, assignment, checklist, and review views.
5. Add the staff dashboard page.
6. Add the reports page.
7. Add the equipment inventory page.
8. Add the loans and checkout page.
9. Add the borrowers page.
10. Add accessible forms, labels, buttons, tables, navigation, empty states,
    and error states.

After each page or cohesive component:

- Open it in a browser.
- Check headings, landmarks, labels, keyboard order, links, and form controls.
- Add only that page or component.
- Review the diff and manually create a focused commit.

## 3. CSS styling

Style the completed HTML incrementally.

1. Define the UAlbany color, typography, spacing, border, shadow, and radius
   tokens.
2. Style the shared shell, header, navigation, and responsive layout.
3. Style cards, tables, badges, buttons, fields, dialogs, and alerts.
4. Style each page in the same order as the HTML phase.
5. Add responsive layouts for mobile, tablet, and desktop.
6. Add visible focus, hover, disabled, loading, success, and error states.
7. Check contrast, text scaling, overflow, and keyboard usability.

Validate each cohesive styling change in a browser and commit it manually as a
separate focused change.

## 4. Client-Side JavaScript Frontend

The frontend is implemented with client-side JavaScript, Web Components,
and HTML5/CSS3.

1. Create the JavaScript application entry point and local development command.
2. Move the shared HTML shell into templates.
3. Move each completed page into a template without changing its visual behavior.
4. Add static asset serving for CSS, images, and browser-side JavaScript.
5. Add server-side form parsing and validation for the login, checkout, assignment, checklist, and review forms.
6. Return clear validation errors and preserve submitted values when a form fails.
7. Add focused tests for routes, templates, validation, and error responses.
8. Static pages and custom elements (`components.js`) provide client-side layout
   and interaction.
9. PJAX-style client-side navigation handles responsive, flicker-free page loads.
10. Client-side form handlers and data tables communicate directly with the
   backend API via `fetch()`.
11. Keep frontend presentation separate from backend database access and services.

## 5. Express backend

Add the Node.js/Express API as a separate backend service.

1. Initialize the Node.js project and pin supported versions.
2. Add configuration loading from environment variables.
3. Add request logging, JSON parsing, CORS policy, and centralized error
   handling.
4. Define typed request and response shapes for equipment, borrowers, loans,
   preparation tasks, and reports.
5. Add health and readiness endpoints.
6. Add authentication/session endpoints required by the interface.
7. Add equipment, borrower, loan, preparation, and report endpoints one
   resource at a time.
8. Validate request bodies, route parameters, query parameters, and
   authorization for every endpoint.
9. Add automated route and error-path tests.
10. Connect the JavaScript frontend to the API only after the API contract is
    verified.

Do not place database credentials or private keys in source control.

## 6. MySQL database

Introduce persistence after the API shape is stable.

1. Define the schema for users, borrowers, equipment, loans, preparation
   records, checklist items, assignments, and audit/report data.
2. Define keys, relationships, uniqueness rules, status values, and timestamps.
3. Add versioned migrations and a documented local database setup.
4. Add a least-privilege database user for the application.
5. Add repository/data-access modules behind the API service.
6. Replace temporary in-memory data one resource at a time.
7. Add transaction handling for checkout, return, assignment, and checklist
   updates.
8. Add indexes for the equipment, borrower, loan, and reporting queries.
9. Add migration and integration tests using a disposable test database.
10. Add safe error responses that do not expose SQL, credentials, or stack
    traces.

## 7. Integration and quality

- Connect every completed frontend view to live API data.
- Remove placeholder data only after the corresponding endpoint is working.
- Test successful, empty, invalid, unauthorized, and server-error states.
- Verify keyboard navigation, responsive layouts, and accessible names.
- Run formatting, linting, type checks, unit tests, integration tests, and a
  production build.
- Review environment-variable documentation and startup instructions.
- See [test-connection.md](./test-connection.md) for the complete full-stack integration and test scripts guide.
- See [user-manual.md](./user-manual.md) for the complete end-user operations manual, screenshots, and standard operating procedures.

### Frontend-to-Backend & Database Connection Across All Pages

#### Architecture: Dynamic Population with Offline Fallback

The application implements a progressive enhancement and graceful degradation pattern across all views:

- **Dynamic Data Population (Online)**: When the Node.js/Express API server and MySQL database are online and reachable, `api-client.js` queries live REST endpoints (`/api/equipment`, `/api/loans`, `/api/preparation`, `/api/reports`, etc.) upon page load and user interaction. The retrieved database records dynamically replace the static placeholder content in the DOM in real time.
- **Static Content as Offline Fallback**: The initial static HTML markup and sample table rows are intentionally retained in each template as an offline fallback. If the database is temporarily down, disconnected, or undergoing maintenance, client-side API requests fail gracefully through defensive error handling, ensuring the interface remains fully rendered, styled, accessible, and informative rather than displaying blank containers or unhandled error screens.

All 22 frontend HTML views and workflows are actively wired to the Node.js/Express API and MySQL database through `api-client.js`:

| Page | View / Feature | Backend Endpoint / Action | Connected Database Tables |
|---|---|---|---|
| **`login.html`** | Staff sign-in & JWT issuance | `POST /api/auth/login` | `staff_users` (bcrypt hash check) |
| **`index.html`** | Dashboard overview & statistics | `GET /api/reports/summary` | Aggregated from `equipment`, `loans`, `preparation_items` |
| **`profile.html`** | Authenticated staff profile & shift | `GET /api/auth/getCurrentUser` | `staff_users` (Bearer JWT validation) |
| **`equipment.html`** | Live equipment catalog & debounced search | `GET /api/equipment?search=...&category=...` | `equipment`, `equipment_accessories` |
| **`new-loan.html`** | Equipment checkout form & NetID autofill | `POST /api/loans` (Atomic transaction) | `loans` (insert), `equipment` (decrement stock), `borrowers` (increment active loans) |
| **`loans.html`** | Active equipment loans table & live search | `GET /api/loans?search=...` | `loans`, `equipment`, `borrowers` |
| **`loans-overdue.html`** | Overdue loans filtered table & live search | `GET /api/loans?status=overdue&search=...` | `loans` (filtered by due date) |
| **`loan-details.html`** | Single loan record (`?id=LN-...`) | `GET /api/loans/:id` | `loans`, `equipment`, `borrowers` |
| **`return-item.html`** | Return check-in & destination routing | `POST /api/loans/:id/return` | `loans` (status `returned`), `equipment` (increment stock), `preparation_items` (staging) |
| **`borrowers.html`** | Borrower accounts & live search | `GET /api/borrowers?search=...` | `borrowers`, `loans` |
| **`reports.html`** | Post-checkout reports & timeframe analytics | `GET /api/reports?semester=...&from=...&to=...&search=...` | `report_metrics`, `loans`, `equipment` |
| **`notifications.html`** | Alert center & category count badges | `GET /api/reports/summary` | Priority queries across `loans` and `preparation_items` |
| **`preparation-*.html`** (5 queue pages) | Readiness pipeline queues & live search | `GET /api/preparation?status=...&search=...` | `preparation_items`, `preparation_checklist_items` |
| **`preparation-assignment.html`** | Task assignment to staff member | `PATCH /api/preparation/:id` | `preparation_items` (`assigned_staff`, `target_date`, `status = in-prep`) |
| **`preparation-checklist.html`** | Sanitization & data wipe checklist | `PATCH /api/preparation/:id` | `preparation_checklist_items`, `preparation_items` |
| **`preparation-review-details.html`**| Supervisor review & ready-to-lend signoff | `PATCH /api/preparation/:id` | `preparation_items` (`status = ready`) |

#### Account Types & Page Access Matrix

| Page / Feature | URL | Circulation Supervisor<br>*(Linda Kovacs)* | Circulation Specialist<br>*(Maria Santos)* |
|---|---|:---:|:---:|
| **Dashboard / Overview** | `index.html` | Full Access | Full Access |
| **Equipment Catalog** | `equipment.html` | Full Access | Full Access |
| **New Loan / Checkout** | `new-loan.html` | Full Access | Full Access |
| **Loans & Overdue Tracking** | `loans.html` | Full Access | Full Access |
| **Return Check-In** | `return-item.html` | Full Access | Full Access |
| **Borrower Directory** | `borrowers.html` | Full Access | Full Access |
| **Prep Queues & Checklists** | `preparation.html` | Full Access | Full Access |
| **Supervisor Review Sign-Off** | `preparation-review-details.html` | **Approve & Mark Ready** | **Restricted** (Locked: Supervisor Approval Required) |
| **Circulation Reports & Analytics** | `reports.html` | **Full Access** (Run & Export) | **Restricted** (Access Denied Banner & Disabled Controls) |
| **Staff Profile** | `profile.html` | Role: *Circulation Supervisor* | Role: *Circulation Specialist* |

## 8. Render deployment

Deploy only after local verification is complete. See [render-deployment.md](./render-deployment.md) for the step-by-step deployment guide and [render.yaml](../render.yaml) for the Infrastructure-as-Code Blueprint specification.

1. Create Render service for the Express API and frontend assets,
   unless a documented alternative is selected.
2. Provision a managed MySQL-compatible database supported by the deployment
   design.
3. Configure build and start commands for each service.
4. Configure production environment variables in Render, never in the
   repository.
5. Configure the frontend API URL, CORS origins, cookies, and HTTPS settings.
6. Run database migrations as a controlled deployment step.
7. Deploy to a preview environment and verify health, authentication, forms,
   CRUD operations, and reports.
8. Configure production domains, backups, logs, and restart behavior.
9. Add a deployment and rollback procedure to the project documentation.
10. Perform a final smoke test and record the deployed service URLs.

## Rules for every milestone

- Work only on the current step.
- Do not add a later layer early just to make a screen appear complete.
- Keep secrets out of files tracked by Git.
- Validate the exact behavior being changed.
- Review changes before staging or committing.
- The project owner chooses when and what to commit.
