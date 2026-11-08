-- =============================================================================
-- UAlbany LibraryDesk - Comprehensive SQL Verification & Test Queries
-- Database: ualbanylibrarydesk
-- Use this file to test, inspect, and verify all database operations.
-- You can run these queries directly in VS Code with the MySQL extension,
-- MySQL Workbench, or via the command line mysql client.
-- =============================================================================

USE `ualbanylibrarydesk`;

-- =============================================================================
-- 1. SYSTEM HEALTH & METADATA VERIFICATION
-- =============================================================================

-- 1.1 Verify database connection and MySQL server version
SELECT 
  DATABASE() AS current_database,
  VERSION() AS mysql_version,
  NOW() AS server_time,
  CONNECTION_ID() AS connection_id;

-- 1.2 Inspect all tables in ualbanylibrarydesk
SHOW TABLES;

-- 1.3 Count records in each table
SELECT 'staff_users' AS table_name, COUNT(*) AS total_records FROM staff_users
UNION ALL
SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL
SELECT 'equipment_accessories', COUNT(*) FROM equipment_accessories
UNION ALL
SELECT 'borrowers', COUNT(*) FROM borrowers
UNION ALL
SELECT 'loans', COUNT(*) FROM loans
UNION ALL
SELECT 'preparation_items', COUNT(*) FROM preparation_items
UNION ALL
SELECT 'preparation_checklist_items', COUNT(*) FROM preparation_checklist_items
UNION ALL
SELECT 'report_metrics', COUNT(*) FROM report_metrics;

-- =============================================================================
-- 2. STAFF AUTHENTICATION & PROFILE QUERIES
-- =============================================================================

-- 2.1 Authenticate staff user by NetID
SELECT 
  netid,
  name,
  university_id,
  department,
  division,
  email,
  role,
  desk_station,
  workstation_id,
  permissions,
  status
FROM staff_users
WHERE netid = 'linda.kovacs' AND status = 'active';

-- 2.2 List all registered staff with workstation assignments
SELECT netid, name, role, desk_station, workstation_id, email, status
FROM staff_users
ORDER BY name ASC;

-- =============================================================================
-- 3. EQUIPMENT CATALOG & INVENTORY QUERIES
-- =============================================================================

-- 3.1 List all equipment with availability count
SELECT 
  id AS equipment_id,
  name,
  category,
  available_quantity,
  total_quantity,
  status
FROM equipment
ORDER BY id ASC;

-- 3.2 Live search equipment by keyword (e.g., 'Camera', 'Switch', or 'EQ-001')
SELECT id, name, category, available_quantity, total_quantity, status, description
FROM equipment
WHERE name LIKE '%Camera%' 
   OR id LIKE '%Camera%' 
   OR description LIKE '%Camera%'
ORDER BY name ASC;

-- 3.3 Filter equipment by category
SELECT id, name, category, available_quantity, total_quantity, status
FROM equipment
WHERE category = 'Creative Technology'
ORDER BY name ASC;

-- 3.4 Check equipment accessories manifest for a kit (e.g., EQ-001)
SELECT e.id, e.name, e.category, a.accessory_name
FROM equipment e
JOIN equipment_accessories a ON e.id = a.equipment_id
WHERE e.id = 'EQ-001'
ORDER BY a.id ASC;

-- 3.5 Query items currently ready for checkout (available > 0)
SELECT id, name, category, available_quantity, total_quantity
FROM equipment
WHERE available_quantity > 0 AND status = 'available'
ORDER BY available_quantity DESC;

-- =============================================================================
-- 4. BORROWER DIRECTORY & ACCOUNT STANDING
-- =============================================================================

-- 4.1 List all borrowers with open loan counts
SELECT 
  netid,
  name,
  university_id,
  email,
  department,
  role,
  open_loans,
  status
FROM borrowers
ORDER BY name ASC;

-- 4.2 Verify borrower standing before new checkout
SELECT netid, name, university_id, open_loans, status
FROM borrowers
WHERE netid = 'emma.wilson' AND status = 'good-standing';

-- 4.3 Search borrowers by name or NetID
SELECT netid, name, university_id, email, status
FROM borrowers
WHERE name LIKE '%Wilson%' OR netid LIKE '%Wilson%' OR university_id LIKE '%Wilson%';

-- =============================================================================
-- 5. LOANS & CIRCULATION QUERIES
-- =============================================================================

-- 5.1 Overview: List all active circulation loans with borrower & equipment details
SELECT 
  l.id AS loan_id,
  e.name AS equipment_name,
  e.id AS equipment_id,
  b.name AS borrower_name,
  b.netid AS borrower_netid,
  b.university_id,
  l.asset_tag,
  DATE_FORMAT(l.checkout_date, '%d %b %Y %H:%i') AS checkout_formatted,
  DATE_FORMAT(l.due_date, '%d %b %Y %H:%i') AS due_formatted,
  l.status
FROM loans l
JOIN equipment e ON l.equipment_id = e.id
JOIN borrowers b ON l.borrower_netid = b.netid
ORDER BY l.due_date ASC;

-- 5.2 Filter: Overdue loans requiring staff follow-up
SELECT 
  l.id AS loan_id,
  e.name AS equipment_name,
  b.name AS borrower_name,
  b.email AS borrower_email,
  l.due_date,
  DATEDIFF(NOW(), l.due_date) AS days_overdue
FROM loans l
JOIN equipment e ON l.equipment_id = e.id
JOIN borrowers b ON l.borrower_netid = b.netid
WHERE l.status = 'overdue' OR (l.status = 'active' AND l.due_date < NOW())
ORDER BY l.due_date ASC;

-- 5.3 Filter: Loans due today
SELECT 
  l.id AS loan_id,
  e.name AS equipment_name,
  b.name AS borrower_name,
  b.email AS borrower_email,
  l.due_date
FROM loans l
JOIN equipment e ON l.equipment_id = e.id
JOIN borrowers b ON l.borrower_netid = b.netid
WHERE l.status = 'due-today' OR DATE(l.due_date) = CURDATE();

-- 5.4 Transaction Test: Simulate a new checkout
-- Step A: Insert new loan
INSERT INTO loans (id, equipment_id, borrower_netid, asset_tag, checkout_date, due_date, status)
VALUES ('LN-TEST-01', 'EQ-002', 'james.chen', 'ALB-EQ-002-TEST', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active');

-- Step B: Decrement equipment available count
UPDATE equipment 
SET available_quantity = available_quantity - 1 
WHERE id = 'EQ-002' AND available_quantity > 0;

-- Step C: Increment borrower open loans
UPDATE borrowers 
SET open_loans = open_loans + 1 
WHERE netid = 'james.chen';

-- Step D: Verify the new checkout
SELECT * FROM loans WHERE id = 'LN-TEST-01';

-- 5.5 Transaction Test: Simulate equipment return check-in
-- Step A: Mark loan returned
UPDATE loans 
SET 
  status = 'returned',
  return_date = NOW(),
  return_condition = 'good',
  destination = 'ready-shelf',
  return_notes = 'Returned in good working order.'
WHERE id = 'LN-TEST-01';

-- Step B: Restock equipment inventory
UPDATE equipment 
SET available_quantity = LEAST(total_quantity, available_quantity + 1)
WHERE id = 'EQ-002';

-- Step C: Decrement borrower open loans
UPDATE borrowers 
SET open_loans = GREATEST(0, open_loans - 1)
WHERE netid = 'james.chen';

-- Step D: Clean up test loan
DELETE FROM loans WHERE id = 'LN-TEST-01';

commit;
rollback;

-- =============================================================================
-- 6. EQUIPMENT PREPARATION WORKFLOW & READINESS CHECKS
-- =============================================================================

-- 6.1 Preparation queue grouped by status
SELECT 
  id AS prep_id,
  equipment_name,
  equipment_id,
  category,
  assigned_staff,
  target_date,
  status,
  current_step
FROM preparation_items
ORDER BY FIELD(status, 'awaiting', 'in-prep', 'review', 'ready'), id ASC;

-- 6.2 Multi-step sanitization & inspection checklist for a preparation item (e.g. PREP-002)
SELECT 
  p.id AS prep_id,
  p.equipment_name,
  c.step_key,
  c.title AS checklist_step,
  c.completed,
  c.completed_at
FROM preparation_items p
JOIN preparation_checklist_items c ON p.id = c.preparation_id
WHERE p.id = 'PREP-002'
ORDER BY c.id ASC;

-- 6.3 Update checklist step completion
UPDATE preparation_checklist_items 
SET completed = 1, completed_at = NOW() 
WHERE preparation_id = 'PREP-002' AND step_key = 'battery';

-- 6.4 Transition preparation status to 'review' when checklist finishes
UPDATE preparation_items 
SET status = 'review', current_step = 4 
WHERE id = 'PREP-002';

-- =============================================================================
-- 7. REPORTING & DASHBOARD KPI METRICS
-- =============================================================================

-- 7.1 Real-time Dashboard KPIs (Matches overview dashboard numbers)
SELECT 
  (SELECT SUM(total_quantity) FROM equipment) AS total_equipment_units,
  (SELECT COUNT(*) FROM loans WHERE status IN ('active', 'due-today', 'overdue')) AS active_loans_count,
  (SELECT COUNT(*) FROM loans WHERE status = 'due-today' OR DATE(due_date) = CURDATE()) AS due_today_count,
  (SELECT COUNT(*) FROM loans WHERE status = 'overdue' OR due_date < NOW()) AS overdue_count,
  (SELECT COUNT(*) FROM preparation_items WHERE status = 'awaiting') AS prep_needs_preparation,
  (SELECT COUNT(*) FROM preparation_items WHERE status = 'in-prep') AS prep_in_progress,
  (SELECT COUNT(*) FROM preparation_items WHERE status = 'review') AS prep_awaiting_review,
  (SELECT COUNT(*) FROM preparation_items WHERE status = 'ready') AS prep_ready_for_lending;

-- 7.2 Equipment Usage and Duration Report (for CSV export in reports.html)
SELECT 
  e.id AS equipment_id,
  e.name AS equipment_name,
  e.category,
  COALESCE(r.checkouts_count, 0) AS total_checkouts,
  COALESCE(r.avg_loan_days, 0.0) AS avg_days_out,
  COALESCE(r.total_days_out, 0) AS total_days_out
FROM equipment e
LEFT JOIN report_metrics r ON e.id = r.equipment_id
ORDER BY total_checkouts DESC;
