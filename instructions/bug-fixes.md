# University at Albany Libraries — LibraryDesk Portal
## Bug Fixes & System Resolution Documentation

**Document Title:** UAlbany LibraryDesk Bug Fixes Log  
**System Version:** 1.0.0  
**Project Team (KofN1):** Linda Kovacs, Veronica Dindial, Rym Mahiddine, Wendy Ouedraogo, Amari Scott  
**Affiliation:** University at Albany, SUNY — Access & Circulation Services  
**Document Status:** Production Verified  

---

## Overview

This document records identified system bugs, their visual manifestations, root causes, and implemented technical fixes across the UAlbany LibraryDesk circulation and equipment management platform. Each bug entry includes the associated screenshot from `assets/bug-fixes/`, affected views and files, problem analysis, and the technical remediation applied.

---

## Bug 1: European Date Format on Equipment Details Page

### Screenshot
![Bug 1: European Date Format on Equipment Details Page](../assets/bug-fixes/bug1.png)

### Affected Views & Files
- `preparation-details.html` (Preparation Step 1: Equipment Details)
- `components.js` (`PREPARATION_CATALOG`, `hydratePreparationUI`, `formatToUSDate`)
- `api-client.js` (`syncPreparationDetailsPage`)
- `server/data/store.js` (`initialPreparation`)
- `server/scripts/init-db.sql` (`preparation_items`)

### Problem Description
1. **European Date Format on Equipment Header & Specifications:**
   - On `preparation-details.html` (titled **Equipment details** for items such as `EQ-014` Game Console), the Target date in the upper right header rendered as `15 Oct 2026` inside the red highlight box.
   - In the **Preparation overview** metadata list, the `Target date` row also rendered as `15 Oct 2026`.
   - The European date format (`DD Mon YYYY`) caused inconsistency with standard US circulation desk date formats (`Mon DD, YYYY` / `Oct 15, 2026`).

### Root Cause
- In `components.js`, the client-side catalog `PREPARATION_CATALOG` hardcoded `targetDate: '15 Oct 2026'` across equipment records.
- When `hydratePreparationUI` executed upon page load, it dynamically injected `item.targetDate` into the header `<span>Target date</span><strong>` and `<dd>` elements, overwriting or enforcing the European format.
- Similarly, `server/data/store.js` and `init-db.sql` seeded preparation records with `15 Oct 2026`.

### Technical Fix Implemented
1. **Standardized Target Dates to US Format:**
   - Updated all preparation catalog records in `components.js` (`PREPARATION_CATALOG`), `server/data/store.js`, and `server/scripts/init-db.sql` from `15 Oct 2026` to `Oct 15, 2026`.
   - Updated static fallback values in `preparation-details.html` to `Oct 15, 2026`.
2. **Dynamic Date Normalizer:**
   - Added `formatToUSDate()` helper in both `components.js` and `api-client.js` that automatically transforms legacy or cached `DD Mon YYYY` date strings to `Mon DD, YYYY` prior to rendering in the DOM.

---

## Bug 2: Static Past Date on Login and Date Picker Tool Defaults

### Screenshot
![Bug 2: Static Past Date on Login and Date Picker Defaults](../assets/bug-fixes/bug2.png)

### Affected Views & Files
- `index.html` (Staff Workspace Overview Dashboard)
- `new-loan.html` (New Checkout Form)
- `preparation-assignment.html` (Preparation Task Assignment)
- `components.js` (`updateOverviewTodayDate`, `initDatePickers`, `hydratePreparationUI`)
- `api-client.js` (`syncUserSessionUI`, `syncNewLoanPage`, `syncPreparationDetailsPage`)

### Problem Description
1. **Static Past Date Display on Overview Dashboard:**
   - In `bug2.png`, the overview dashboard (`index.html`) header banner statically displayed `Sunday, October 11, 2026` inside the red highlight box upon staff login.
   - The date was frozen on a hardcoded past date rather than dynamically resolving and displaying today's current calendar date whenever a user logs into the system.
2. **Hardcoded Past Dates in Date Picker Tools:**
   - When staff accessed the date picker tool for new operations (such as creating a checkout on `new-loan.html` or assigning tasks on `preparation-assignment.html`), the date inputs were pre-populated with hardcoded past dates (`2026-10-11` for checkout date and `2026-10-15` for due date and target date).
   - Date pickers lacked dynamic initialization to today's date and lacked validation constraints allowing users to pick any future date freely while preventing inadvertent past date entry. Historical dates in the past should only be retained for existing items already recorded in the system; all newly worked on items must default to today's date using the date picker tool.

### Root Cause
1. `index.html` contained a static `<time datetime="2026-10-11">Sunday, October 11, 2026</time>` element that was never dynamically refreshed with the current system date on login or page load.
2. HTML templates `new-loan.html` and `preparation-assignment.html` had hardcoded `value="2026-10-11"` and `value="2026-10-15"` attributes on `<input type="date">` elements without dynamic JavaScript initialization or future `min` date limits.

### Technical Fix Implemented
1. **Dynamic Today's Date on Overview Login:**
   - Implemented dynamic date initialization in `index.html`, `components.js`, and `api-client.js`: on page load / staff login, the `<time id="overview-today-date">` element dynamically resolves the current client date via `new Date()`, updates `datetime="YYYY-MM-DD"`, and renders the standard US long format (e.g. `Sunday, November 22, 2026`).
2. **Date Picker Tool Defaults to Today & Enables Future Dates:**
   - Removed static past `value` attributes from `new-loan.html` (`#checkout-date`, `#due-date`, `#reserved-date`) and `preparation-assignment.html` (`#target-date`).
   - Implemented `initDatePickers()` across `components.js` and `api-client.js`:
     - Newly accessed date picker fields automatically default to today's date (`todayStr` = `YYYY-MM-DD`).
     - Set `min="YYYY-MM-DD"` so date pickers permit today and any date in the future.
     - Linked `#checkout-date` and `#due-date` so modifying the checkout date dynamically updates the minimum allowable due date.
     - Linked `#reserved-date` and `#checkout-date` so choosing a future reservation hold clears immediate checkout fields cleanly.
     - Existing items already registered in the system preserve their historical circulation timestamps.

---

## Bug 3: Timezone Rollback & Patron ID Binding on Loan Details Page

### Screenshot
![Bug 3: Loan Details Date and Borrower Data Discrepancies](../assets/bug-fixes/bug3.png)

### Affected Views & Files
- `loan-details.html` (Loan Details & Specifications)
- `new-loan.html` (Checkout Form)
- `api-client.js` (`formatShortEST`, checkout form handler, `syncLoanDetailsPage`)
- `server/data/store.js` (`createLoan`, `getLoanById`, `parseLocalDate`)

### Problem Description
1. **Timezone Rollback & Date Shift:**
   - When staff checked out equipment on `new-loan.html` selecting dates like `2026-10-11` (Checkout) and `2026-10-15` (Due Date), date-only inputs were parsed as UTC midnight (`2026-10-11T00:00:00.000Z`).
   - When formatted in local Eastern Time (`America/New_York` / `EST` / `EDT` UTC-4 / UTC-5), midnight UTC shifted backwards into the previous calendar evening, displaying `10/10/26, 8:00 PM EST` and `10/14/26, 8:00 PM EST` on `loan-details.html`.
2. **Missing Patron ID Forwarding:**
   - When checking out to a patron with a custom NetID entry (e.g. entering `emma` instead of cataloged `emma.wilson`), the `studentId` field on `new-loan.html` was omitted from `loanPayload` by `api-client.js`.
   - Consequently, the backend fell back to the placeholder University ID `001999999` rather than preserving the 9-digit university ID entered in the form.

### Technical Fix Implemented
1. **Calendar Day Integrity in Date Parsing:**
   - Updated `formatShortEST` in `api-client.js` to detect date-only strings and ISO midnight representations (`T00:00:00.000Z`), directly formatting calendar day components without timezone drift.
   - Enhanced `server/data/store.js` with `parseLocalDate` to anchor date-only inputs to local midday (`12:00:00Z`), guaranteeing consistent day retention across all US timezones.
2. **Complete Patron Data Capture:**
   - Updated `api-client.js` checkout form submit listener to read and send `studentId` / `universityId`, `email`, and `role`.
   - Updated `server/data/store.js` `createLoan` method to prioritize `data.universityId` and `data.studentId` before falling back to placeholders.

---

## Bug 4: Premature "Awaiting Review" Status Badge with 0/4 Checklist Completion

### Screenshot
![Bug 4: Preparation Checklist Status and Progress State Mismatch](../assets/bug-fixes/bug4.png)

### Affected Views & Files
- `preparation-checklist.html` (Preparation Step 3: Technical Checklist)
- `components.js` (`applyStatusBadgeFormat`, `hydratePreparationUI`)
- `api-client.js` (`syncPreparationDetailsPage`, `isChecklist`)

### Problem Description
1. **Status Badge & Step State Inconsistency:**
   - In `preparation-checklist.html` (Step 3: Checklist), the header status badge displayed `• Awaiting review` (in purple `#46166b`) even though the preparation steps counter read `0 / 4 complete` and all 4 task checkboxes were unchecked (`Pending`).
   - An item actively undergoing technician sanitization and diagnostic checks should display `• In preparation` (`Needs preparation`), not `Awaiting review`. Items should only transition to `Awaiting review` after all 4 checklist steps are completed and submitted.
2. **European Date Format on Target Date:**
   - The Target date in the upper right header displayed `23 Nov 2026` (European `DD Mon YYYY` format) generated by `Intl.DateTimeFormat('en-GB', ...)` rather than standard US format (`Nov 23, 2026`).

### Technical Fix Implemented
1. **Lifecycle Status Badge Correction:**
   - Updated `syncPreparationDetailsPage` in `api-client.js` so that when an item is being serviced in `preparation-checklist.html`, the status badge displays `In preparation` (`in-prep` amber pill) or reflects saved progress.
2. **Checklist Persistence & State Synchronization:**
   - Implemented dynamic checklist state management: checking or unchecking preparation steps immediately synchronizes step status between `Complete` and `Pending`, updates the header counter (e.g. `4 / 4 complete`), and persists progress to session storage and the backend database.
   - When the technician clicks `Submit for review →`, all 4 checklist items are marked complete, and the record transitions atomically to `review` (Step 4).
3. **US Date Formatting:**
   - Changed `Intl.DateTimeFormat` locale from `en-GB` to `en-US` with `{ month: 'short', day: 'numeric', year: 'numeric' }` in `components.js` and `api-client.js`, rendering target dates as `Nov 23, 2026`.

---

## Bug 5: Supervisor Review Queue Contradictory Status & Pending Steps

### Screenshot
![Bug 5: Supervisor Review Queue Status and Steps Contradiction](../assets/bug-fixes/bug5.png)

### Affected Views & Files
- `preparation-review-details.html` (Preparation Step 4: Supervisor Review)
- `api-client.js` (`syncPreparationDetailsPage`, `isReview`)
- `server/data/store.js` (`updatePreparation`)

### Problem Description
1. **Premature "Ready for Lending" Badge:**
   - In `preparation-review-details.html`, the header badge displayed `• Ready for lending` (green `#26734d`), creating a contradiction:
     - The item was located on Step 4 (Review) awaiting supervisor quality verification.
     - The primary action button at the bottom still read `✓ Mark ready for lending`.
     - An item cannot simultaneously be "Ready for lending" and have an active supervisor review button to mark it ready.
2. **Pending Checklist Items in Review Queue:**
   - All 4 preparation steps in the review manifest displayed `Pending` with `0 / 4 complete`, even though the item had supposedly been submitted for review following technician servicing.
3. **European Date Format:**
   - The Target date in the upper right and inside the review banner displayed `23 Nov 2026` in European format.

### Technical Fix Implemented
1. **Review Queue Status Lifecycle Enforcement:**
   - While on Step 4 Review prior to supervisor sign-off (`item.status === 'review'`), the header status badge strictly renders `• Awaiting review` (purple badge `#46166b` on `#f1ebf6`).
   - Only after a Circulation Supervisor clicks `Mark ready for lending` does the status update to `ready`, advancing the equipment to `preparation-ready.html` for re-shelving.
2. **Review Checklist Manifest Resolution:**
   - Updated `syncPreparationDetailsPage` in `api-client.js` and `updatePreparation` in `server/data/store.js`: when an item transitions to `review` or `ready`, all preparation steps are marked `Complete`, and the step counter displays `4 / 4 complete`.
   - In MySQL, `preparation_checklist_items` records for the preparation item are updated to `completed = 1`.
3. **US Date Localization:**
   - Standardized target dates in the review header and assignment status banner to US format (`Nov 23, 2026`).

---

## Bug 6: Missing Borrower Name and University ID in Loans Table

### Screenshot
![Bug 6: Missing Borrower Data in Loans and Returns Table](../assets/bug-fixes/bug6.png)

### Affected Views & Files
- `loans.html` (Loans & Returns Main Roster)
- `loans-reserved.html` (Reserved Loans View)
- `loans-overdue.html` (Overdue Loans View)
- `api-client.js` (`fetchAndRenderLoans`, `renderLoansTable`)
- `server/data/store.js` (`getLoans`, `getLoanById`, `initialLoans`)

### Problem Description
1. **Empty Borrower Cells Across All Loans:**
   - On `loans.html`, the `BORROWER` column displayed dashes (`—` over `—`) for every loan in the table, omitting the borrower's full name and their 9-digit University ID / NetID.
   - Desk staff were unable to see who had checked out or reserved equipment directly from the table roster.

### Root Cause
- Client-side and server-side data models had mismatched property naming:
  - The client rendering script in `api-client.js` attempted to read `loan.borrower` and `loan.netid`.
  - The backend database query (`LEFT JOIN borrowers b ON l.borrower_netid = b.netid`) and in-memory store initialized records with `borrowerName` and `borrowerNetId` (or `b.name AS borrower_name`, `b.university_id`).
  - Because neither `borrower` nor `netid` was populated directly on the loan object, the frontend expression `${escapeHtml(loan.borrower || '—')}` evaluated to undefined and fell back to dashes (`—`).

### Technical Fix Implemented
1. **Robust Client-Side Property Fallbacks:**
   - Updated `fetchAndRenderLoans` and overview loans rendering in `api-client.js` to check all property variants:
     - Full Name: `loan.borrowerName || loan.borrower || '—'`
     - Identifier: `loan.universityId || loan.borrowerNetId || loan.netid || '—'`
2. **Unified Backend Loan Serialization:**
   - Updated `getLoans` and `getLoanById` in `server/data/store.js` to map and expose both naming conventions:
     - `borrower`: borrower full name string
     - `borrowerName`: borrower full name string
     - `borrowerNetId`: borrower NetID (e.g. `marcus.vance`, `emma.wilson`)
     - `netid`: borrower NetID
     - `universityId`: 9-digit SUNY University ID (e.g. `001594821`, `001482759`)
3. **Data Verification:**
   - All 7 active, reserved, and overdue circulation records now display borrower names and university IDs in the main table on `loans.html`, matching circulation records.

---

## Bug 7: Form Error Validation with User Guidance & Accessible Error Banners

### Screenshot
![Bug 7: Accessible Form Error Validation Banners and Field-Level Indicators](../assets/bug-fixes/error-validation.png)

### Affected Views & Files
- `login.html` (Staff Sign-In Form)
- `new-loan.html` (New Checkout & Reservation Form)
- `return-item.html` (Equipment Return Check-In Form)
- `preparation-assignment.html` (Preparation Task Assignment Form)
- `preparation-checklist.html` (Technician Sanitization Checklist)
- `reports.html` & `index.html` (Utilization Filter Range)
- `styles.css` (`.form-error-banner`, `.field-invalid`, `.form-field-error`, `.form-success-banner`)
- `api-client.js` (`showFormErrors`, `clearFormErrors`, form submit handlers)

### Problem Description
1. **Disruptive and Inaccessible Validation Feedback:**
   - Forms previously relied on native browser tooltip alerts or JavaScript `alert()` popups upon submission.
   - When required fields were missing (such as unassigned staff in preparation, missing borrower full name in checkout, or empty damaged condition notes in returns), users received disruptive modal alerts that blocked workflow progression and failed WCAG accessibility criteria.
2. **Missing Field-Level Visual Indicators:**
   - Invalid fields lacked immediate visual styling (such as red border accents or inline error descriptions directly below the input) to guide users on required corrections.

### Root Cause
- HTML forms lacked structured validation components and error styling rules in `styles.css`.
- Forms lacked the `novalidate` attribute, resulting in raw browser tooltip popups, while scripts in `api-client.js` invoked `alert()` for checkout and return validation failures.

### Technical Fix Implemented
1. **Accessible Error Summary Container:**
   - Implemented `.form-error-banner` (`role="alert"`, `aria-live="assertive"`) in `styles.css` with UAlbany red styling (`#d9383a` border, `#fdf2f2` background) that renders an error title and itemized bullet points summarizing all form validation issues.
2. **Field-Level Indicators & Real-Time Dismissal:**
   - Implemented `.field-invalid` applying red focus borders (`#d9383a`) and `.form-field-error` inserting specific corrective guidance directly beneath each invalid input.
   - Attached dynamic `input` and `change` event listeners to invalid fields so error styling and messages are immediately dismissed once the user begins typing or selects a valid dropdown option.
3. **Comprehensive Form Validation Rules:**
   - **Login Form:** Requires NetID and password; displays user-friendly credentials error on 401 response without exposing sensitive server details.
   - **Checkout Form:** Validates borrower name, NetID format, 9-digit University ID, valid email, equipment availability (blocks 0 available units), date conflicts (prevents filling both checkout date and reserved date), minimum loan duration (due date >= checkout date), and blocks past reservation dates.
   - **Return Form:** Requires loan selection and mandates detailed staff explanatory notes whenever condition is marked as "Damaged" or "Missing Accessory".
   - **Preparation Assignment Form:** Mandates staff specialist selection, future target completion date, and at least one task checkbox.
   - **Checklist & Reports:** Verifies all 4 checklist steps prior to supervisor review and checks date range validity (`From` date <= `To` date).

---

## Bug 8: Dynamic Synchronization of Loans, Equipment Available Count, and Borrower Open Loans Upon Checkout

### Affected Views & Files
- `loans.html` (Loans & Returns Main Roster)
- `new-loan.html` (New Loan Checkout Form)
- `equipment.html` (Equipment Catalog & Availability Counts)
- `borrowers.html` (Borrower Directory & Open Loans Metrics)
- `borrower-details.html` (Borrower Profile & Active Loans List)
- `index.html` (Staff Workspace Overview Dashboard)
- `server/data/store.js` (`getNextLoanId`, `createLoan`, `returnLoan`, `deleteLoan`, `getLoans`, `getSummaryKPIs`)
- `api-client.js` (`syncLoansTable`, `fetchAndRenderLoans`, `syncGlobalTabBadges`, `syncEquipmentPage`, `syncBorrowersTable`)
- `server/SQLQueries.sql` (Section 5.5 Transaction Checkout and Return Operations)

### Problem Description
1. **Newly Checked Out Items Missing on Loans Page:**
   - When desk staff submitted a new equipment checkout on `new-loan.html`, the system redirected to `loans.html`, but the newly checked-out loan did not appear in the table roster.
2. **Circulation Numbers & Inventory Counts Out of Sync:**
   - The equipment available count on `equipment.html` and the checkout dropdown on `new-loan.html` did not decrement.
   - The borrower's open loans count on `borrowers.html` and `borrower-details.html` did not increment.
   - The total loans heading (`7 loans`), subheading (`6 open loans · 1 returned`), and tab badges (`All loans 7`, `Reserved 1`, `Overdue 1`) remained static.

### Root Cause
1. **Loan ID Primary Key Collision in Database:**
   - In `server/data/store.js`, the loan ID calculation was computed as `const nextNum = 1043 + this.loans.length - 5;`.
   - When the server restarted or initialized with 7 seed records in memory, `nextNum` evaluated to `1045` or `1046`.
   - Because `LN-1045` and `LN-1046` already existed in MySQL, MySQL rejected the query with `ER_DUP_ENTRY: Duplicate entry 'LN-1045' for key 'loans.PRIMARY'`.
   - The error was caught and rolled back the MySQL transaction (`conn.rollback()`), meaning the new loan was never saved to the database, equipment inventory was never decremented, and borrower open loans were never incremented.
   - When `loans.html` fetched `GET /api/loans`, MySQL returned only the pre-existing seed rows, omitting the new checkout.
2. **Static Roster Sorting by Due Date:**
   - `store.getLoans()` queried with `ORDER BY l.due_date ASC`. When a checkout was scheduled with a due date in the future (e.g. November 2026), it was placed after all October seed records, making it difficult for circulation staff to see recent desk transactions.

### Technical Fix Implemented
1. **Dynamic Loan ID Sequence Generator:**
   - Implemented `getNextLoanId()` in `server/data/store.js`:
     ```javascript
     async getNextLoanId() {
       let maxNum = 1044;
       try {
         const [rows] = await pool.query("SELECT id FROM loans WHERE id LIKE 'LN-%'");
         if (rows && rows.length > 0) {
           rows.forEach(r => {
             const m = (r.id || '').match(/LN-(\d+)/i);
             if (m) {
               const num = parseInt(m[1], 10);
               if (!isNaN(num) && num > maxNum) maxNum = num;
             }
           });
         }
       } catch (e) {}
       if (this.loans && this.loans.length > 0) {
         this.loans.forEach(l => {
           const m = (l.id || '').match(/LN-(\d+)/i);
           if (m) {
             const num = parseInt(m[1], 10);
             if (!isNaN(num) && num > maxNum) maxNum = num;
           }
         });
       }
       return `LN-${maxNum + 1}`;
     }
     ```
   - Automatically queries the highest existing loan numeric suffix across both MySQL and memory cache, guaranteeing unique IDs (`LN-1047`, `LN-1048`...) without primary key collisions.
   - Similarly implemented `getNextPrepId()` for preparation items (`PREP-012`, `PREP-013`...).
2. **Foreign Key Integrity & Automatic Borrower Registration:**
   - In `store.createLoan`, verified borrower existence in `borrowers` table before inserting loan to satisfy `fk_loans_borrower` foreign key constraint. Auto-creates borrower record if absent.
3. **Atomic Multi-Step SQL Transaction Matching `SQLQueries.sql` Section 5.5:**
   - **Step A:** `INSERT INTO loans (id, equipment_id, borrower_netid, asset_tag, checkout_date, due_date, reserved_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
   - **Step B:** `UPDATE equipment SET available_quantity = GREATEST(0, available_quantity - 1) WHERE id = ?;`
   - **Step C:** `UPDATE borrowers SET open_loans = (SELECT COUNT(*) FROM loans WHERE borrower_netid = ? AND status != 'returned') WHERE netid = ?;`
   - **Step D:** Commits transaction and updates in-memory cache synchronously.
4. **Circulation Desk Roster Sorting & Success Feedback Banners:**
   - Updated `syncLoansTable` in `api-client.js` to sort loans by ID descending (`idB - idA`), placing the newest checkouts at the top of `loans.html`.
   - Added green success alert banners (`.checkout-success-banner` and `.return-success-banner`) when arriving from checkout or return operations.
   - Dynamically updates table heading (`X loans`), subheading (`X open loans · Y returned`), tab badges (`<loan-tabs>`), and table footer (`Showing X of Y loans`).
5. **Real-Time Inventory & Directory Number Synchronization:**
   - `equipment.html`: `syncEquipmentPage()` immediately renders the decremented `available` count.
   - `borrowers.html`: `syncBorrowersTable()` immediately renders the incremented `openLoans` count.
   - `index.html`: Dashboard KPI cards and Recent Loans report reflect the new active loan count in real time.

---

## Bug 9: Duplicate Item Highlighting on Preparation Queue Pages

### Affected Views & Files
- `preparation.html` (Preparation Awaiting Assignment Roster)
- `preparation-all.html` (All Preparation Pipeline Items)
- `preparation-progress.html` (In-Preparation Roster)
- `preparation-review.html` (Supervisor Review Queue)
- `preparation-ready.html` (Ready for Lending Staging)
- `api-client.js` (`syncPreparationQueues`, `fetchAndRenderPrep`)

### Problem Description
1. **Simultaneous Highlighting of First and Last Queue Items:**
   - On the preparation queue pages, two separate items were highlighted simultaneously by default: the first item in the table and the last item in the table.
   - Both rows displayed the purple highlighted selection background (`#e5d8ef !important`) and active radio selection circle (`class="selection-circle selected"`).
   - Only the first item in the list should be highlighted by default.

### Root Cause
- In `api-client.js`, `fetchAndRenderPrep()` resolved the active preparation item and checked selection via:
  ```javascript
  const isSelected = activeId && (item.equipmentId === activeId || item.id === activeId);
  ```
- Multiple distinct preparation queue items can share the same catalog equipment model (`equipmentId`). For example, in the awaiting preparation queue, both `PREP-002` (the first awaiting item) and `PREP-012` (the last item returned from circulation) represent units of `EQ-001` Mirrorless Camera Kit.
- When `activeId` resolved to `EQ-001` from the first item, `item.equipmentId === activeId` evaluated to `true` for both `PREP-002` and `PREP-012`.
- Consequently, both the first and the last table rows received the `.selected-row` class and `#e5d8ef` background styling.

### Technical Fix Implemented
1. **Index-Based Single Row Selection Enforcement:**
   - Updated `syncPreparationQueues()` in `api-client.js` to track selection by unique item index:
     ```javascript
     let selectedIndex = 0;
     if (explicitId) {
       const matchedIdx = res.preparation.findIndex(p =>
         (p.id && p.id.toLowerCase() === explicitId.toLowerCase()) ||
         (p.equipmentId && p.equipmentId.toLowerCase() === explicitId.toLowerCase())
       );
       if (matchedIdx !== -1) {
         selectedIndex = matchedIdx;
       }
     }
     ```
   - Conditioned row styling on exact index matching:
     ```javascript
     const isSelected = (index === selectedIndex);
     ```
   - Guarantees that only a single row can ever be marked selected.
   - Defaults strictly to index `0` so that only the first item in the list is highlighted by default on initial page load.

---

## Bug 10: Static Preparation Queue Summary Count on Preparation Pages

### Screenshot
![Bug 10: Static Preparation Queue Summary Count on Preparation Pages](../assets/bug-fixes/bug10.png)

### Affected Views & Files
- `preparation-all.html` (All Preparation Pipeline Items)
- `preparation.html` (Preparation Awaiting Assignment Roster)
- `preparation-progress.html` (In-Preparation Roster)
- `preparation-ready.html` (Ready for Lending Staging)
- `preparation-review.html` (Supervisor Review Queue)
- `components.js` (`PreparationTabs`)
- `api-client.js` (`syncPreparationQueues`, `syncGlobalTabBadges`)

### Problem Description
1. **Static Hardcoded Queue Summary Text:**
   - On `preparation-all.html` ("All equipment") and other preparation pages, the summary banner header (`.preparation-summary strong`) contained hardcoded static markup: `<strong>11 items in the preparation queue</strong>`.
   - When items were added to or processed in the preparation queue, the toolbar counter dynamically updated (`N items`), but the summary banner stayed permanently frozen at `"11 items in the preparation queue"`.

### Root Cause
- The preparation summary card markup was rendered statically in HTML without an identifier or API synchronization binding.
- While `api-client.js` and `components.js` updated the table tools count and the tab badges, neither component targeted `.preparation-summary strong` or synchronized it with live KPI / queue metrics.

### Technical Fix Implemented
1. **Standardized Target Element ID in HTML:**
   - Added `id="preparation-summary-count"` to the summary header across all 5 preparation queue pages:
     ```html
     <strong id="preparation-summary-count">11 items in the preparation queue</strong>
     ```
2. **Dynamic KPI Binding in `<preparation-tabs>` (`components.js`):**
   - Updated `render()` and `updateCounts()` in `PreparationTabs` to target `#preparation-summary-count` / `.preparation-summary strong`.
   - Set dynamically formatted text: `${countTotal} item${countTotal === 1 ? '' : 's'} in the preparation queue`.
3. **Queue Synchronization & Real-time Update in `api-client.js`:**
   - In `syncPreparationQueues()`, queried `summaryStrong` and updated the banner whenever preparation items are fetched and rendered (`fetchAndRenderPrep`).
   - On initialization, performed a non-blocking fetch of `apiClient.getSummaryKPIs()` to ensure the banner count updates immediately upon page load.
   - In `syncGlobalTabBadges()`, ensured global polling and KPI refresh events propagate the latest `kpis.preparation.total` directly into the banner element.

---

## Verification & Testing Summary

1. **Automated Unit & API Tests:**
   - Ran `npm test`: all 61 tests (6 health checks + 55 API and resource tests) pass cleanly.
2. **Date Format Verification:**
   - Confirmed zero occurrences of European date patterns (`DD Mon YYYY` or `en-GB`) across all HTML files, client JavaScript, and server data.
3. **Data Integrity & Roster Display:**
   - Verified that borrower names and university IDs render across all rows in `loans.html`, `loans-reserved.html`, and `loans-overdue.html`.
4. **Dynamic Circulation & Inventory Updates:**
   - Verified end-to-end checkout execution: new loans generate unique incremental IDs, decrement equipment inventory, increment borrower open loans, and update UI metrics across all application pages.
5. **Preparation Queue Dynamic Counter Verification:**
   - Verified live count updates in the preparation summary banner (`#preparation-summary-count`) across `preparation-all.html`, `preparation.html`, `preparation-progress.html`, `preparation-ready.html`, and `preparation-review.html`.
