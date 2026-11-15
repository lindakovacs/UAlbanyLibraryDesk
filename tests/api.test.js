const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Set NODE_ENV to test to suppress access logs during testing
process.env.NODE_ENV = 'test';

const app = require('../server/app');

async function runTests() {
  console.log('--- Running API and Resource Tests ---\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Health & System
  await test('GET /health returns status ok with environment and database status', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert(res.body.timestamp);
    assert(res.body.database);
  });

  // 2. Auth & Session with JWT and bcrypt
  let authToken = null;

  await test('POST /api/auth/login authenticates staff credentials and issues JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'linda.kovacs', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert(res.body.token);
    assert.strictEqual(res.body.tokenType, 'Bearer');
    assert.strictEqual(res.body.user.netid, 'linda.kovacs');
    authToken = res.body.token;
  });

  await test('POST /api/auth/login rejects incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'linda.kovacs', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  await test('POST /api/auth/login fails without required fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'linda.kovacs' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Bad Request');
  });

  await test('GET /api/auth/getCurrentUser retrieves profile with valid JWT Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/getCurrentUser')
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.user.netid, 'linda.kovacs');
    assert.strictEqual(res.body.user.name, 'Linda Kovacs');
  });

  await test('GET /api/auth/me retrieves profile with valid JWT Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.netid, 'linda.kovacs');
  });

  await test('GET /api/auth/getCurrentUser rejects requests without token (401)', async () => {
    const res = await request(app).get('/api/auth/getCurrentUser');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  await test('GET /api/auth/getCurrentUser rejects requests with invalid token (401)', async () => {
    const res = await request(app)
      .get('/api/auth/getCurrentUser')
      .set('Authorization', 'Bearer invalid.token.value');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  await test('POST /api/auth/register creates new staff user with bcrypt hash and returns JWT', async () => {
    const testNetId = `test.staff.${Date.now()}`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        netid: testNetId,
        password: 'securePassword456!',
        name: 'Alex Rivera',
        email: `${testNetId}@ualbany.edu`,
        role: 'Circulation Specialist'
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'success');
    assert(res.body.token);
    assert.strictEqual(res.body.user.netid, testNetId);

    // Clean up temporary registered staff user from DB to keep staff_users clean
    try {
      const { pool } = require('../server/config/db');
      await pool.query('DELETE FROM staff_users WHERE netid = ?;', [testNetId]);
    } catch (e) {}
  });

  await test('GET /api/auth/session returns active staff session', async () => {
    const res = await request(app).get('/api/auth/session');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.session.authenticated, true);
    assert.strictEqual(res.body.session.user.role, 'Circulation Supervisor');
  });

  await test('POST /api/auth/login authenticates Circulation Specialist (linda.kovacs.spec)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'linda.kovacs.spec', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'Circulation Specialist');
    assert.strictEqual(res.body.user.name, 'Linda Kovacs');
    assert.strictEqual(res.body.user.email, 'linda.kovacs.spec@ualbany.edu');
  });

  await test('POST /api/auth/login rejects eliminated account (maria.santos)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'maria.santos', password: 'password123' });
    assert.strictEqual(res.status, 401);
  });

  await test('GET /api/reports rejects Circulation Specialist with 403 Forbidden', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'linda.kovacs.spec', password: 'password123' });
    const specialistToken = loginRes.body.token;
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${specialistToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');
  });

  await test('GET /api/reports permits Circulation Supervisor with 200 OK', async () => {
    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
  });

  await test('POST /api/auth/login authenticates team and external Supervisor & Specialist accounts', async () => {
    // Team accounts (2 per user: Supervisor and Specialist)
    const teamTests = [
      { netid: 'veronica.dindial', role: 'Circulation Supervisor', name: 'Veronica Dindial', email: 'veronica.dindial@ualbany.edu' },
      { netid: 'veronica.dindial.spec', role: 'Circulation Specialist', name: 'Veronica Dindial', email: 'veronica.dindial.spec@ualbany.edu' },
      { netid: 'rym.mahiddine', role: 'Circulation Supervisor', name: 'Rym Mahiddine', email: 'rym.mahiddine@ualbany.edu' },
      { netid: 'rym.mahiddine.spec', role: 'Circulation Specialist', name: 'Rym Mahiddine', email: 'rym.mahiddine.spec@ualbany.edu' },
      { netid: 'wendy.ouedraogo', role: 'Circulation Supervisor', name: 'Wendy Ouedraogo', email: 'wendy.ouedraogo@ualbany.edu' },
      { netid: 'wendy.ouedraogo.spec', role: 'Circulation Specialist', name: 'Wendy Ouedraogo', email: 'wendy.ouedraogo.spec@ualbany.edu' },
      { netid: 'amari.scott', role: 'Circulation Supervisor', name: 'Amari Scott', email: 'amari.scott@ualbany.edu' },
      { netid: 'amari.scott.spec', role: 'Circulation Specialist', name: 'Amari Scott', email: 'amari.scott.spec@ualbany.edu' },
      { netid: 'abby.adams', role: 'Circulation Supervisor', name: 'Abby Adams', email: 'abby.adams@ualbany.edu' },
      { netid: 'abby.adams.spec', role: 'Circulation Specialist', name: 'Abby Adams', email: 'abby.adams.spec@ualbany.edu' },
      // External accounts (2 per user: Supervisor and Specialist)
      { netid: 'external.user1', role: 'Circulation Supervisor', name: 'External User 1', email: 'external.user1@ualbany.edu' },
      { netid: 'external.user1.spec', role: 'Circulation Specialist', name: 'External User 1', email: 'external.user1.spec@ualbany.edu' },
      { netid: 'external.user2', role: 'Circulation Supervisor', name: 'External User 2', email: 'external.user2@ualbany.edu' },
      { netid: 'external.user2.spec', role: 'Circulation Specialist', name: 'External User 2', email: 'external.user2.spec@ualbany.edu' },
      { netid: 'external.user3', role: 'Circulation Supervisor', name: 'External User 3', email: 'external.user3@ualbany.edu' },
      { netid: 'external.user3.spec', role: 'Circulation Specialist', name: 'External User 3', email: 'external.user3.spec@ualbany.edu' }
    ];

    for (const item of teamTests) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ netid: item.netid, password: 'password123' });
      assert.strictEqual(res.status, 200, `Expected 200 for ${item.netid}`);
      assert.strictEqual(res.body.user.role, item.role, `Expected role ${item.role} for ${item.netid}`);
      assert.strictEqual(res.body.user.name, item.name, `Expected name ${item.name} for ${item.netid}`);
      assert.strictEqual(res.body.user.email, item.email, `Expected email ${item.email} for ${item.netid}`);
      assert(res.body.token, `Expected JWT token for ${item.netid}`);
    }
  });

  // 3. Equipment
  await test('GET /api/equipment returns full collection (13+ items)', async () => {
    const res = await request(app).get('/api/equipment');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 13);
    assert(Array.isArray(res.body.equipment));
  });

  await test('GET /api/equipment?category=Creative%20Technology filters by category', async () => {
    const res = await request(app).get('/api/equipment?category=Creative%20Technology');
    assert.strictEqual(res.status, 200);
    assert(res.body.total > 0);
    res.body.equipment.forEach(item => assert.strictEqual(item.category, 'Creative Technology'));
  });

  await test('GET /api/equipment/EQ-001 returns camera kit details', async () => {
    const res = await request(app).get('/api/equipment/EQ-001');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.equipment.id, 'EQ-001');
    assert.strictEqual(res.body.equipment.name, 'Mirrorless Camera Kit');
  });

  // 4. Borrowers
  await test('GET /api/borrowers returns 6 registered borrowers with dynamic open loans counts', async () => {
    const res = await request(app).get('/api/borrowers');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 6);
    const emma = res.body.borrowers.find(b => b.netid === 'emma.wilson');
    assert.ok(emma);
    assert.strictEqual(emma.openLoans, 2, 'Emma Wilson openLoans must be 2 matching her active loans');
    const james = res.body.borrowers.find(b => b.netid === 'james.chen');
    assert.ok(james);
    assert.strictEqual(james.openLoans, 2, 'James Chen openLoans must be 2 matching his open loans');
    const marcus = res.body.borrowers.find(b => b.netid === 'marcus.vance');
    assert.ok(marcus);
    assert.strictEqual(marcus.openLoans, 1, 'Marcus Vance openLoans must be 1');
  });

  await test('GET /api/borrowers/emma.wilson returns borrower profile with dynamic open loans', async () => {
    const res = await request(app).get('/api/borrowers/emma.wilson');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.borrower.netid, 'emma.wilson');
    assert(Array.isArray(res.body.borrower.loans));
    assert.strictEqual(res.body.borrower.openLoans, res.body.borrower.loans.length, 'openLoans count must match non-returned loans array length');
    assert.strictEqual(res.body.borrower.openLoans, 2, 'Emma Wilson must have 2 active loans');
  });

  // 5. Loans & Circulation
  await test('GET /api/loans returns active loan records', async () => {
    const res = await request(app).get('/api/loans');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 5);
  });

  await test('GET /api/loans?status=overdue filters overdue loans', async () => {
    const res = await request(app).get('/api/loans?status=overdue');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 1);
    assert.strictEqual(res.body.loans[0].id, 'LN-1040');
    assert(res.body.loans[0].checkoutDate);
    assert.strictEqual(res.body.loans[0].reservedDate, null);
  });

  await test('GET /api/loans?status=reserved filters reserved loans', async () => {
    const res = await request(app).get('/api/loans?status=reserved');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 1);
    const reservedLoan = res.body.loans.find(l => l.id === 'LN-1039');
    assert(reservedLoan);
    assert.strictEqual(reservedLoan.status, 'reserved');
    assert(reservedLoan.reservedDate);
    assert.strictEqual(reservedLoan.checkoutDate, null);
    assert.strictEqual(reservedLoan.dueDate, null);
  });

  await test('GET /api/loans/:id returns reserved loan details without checkout date or due date', async () => {
    const res = await request(app).get('/api/loans/LN-1039');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.loan.id, 'LN-1039');
    assert.strictEqual(res.body.loan.status, 'reserved');
    assert(res.body.loan.reservedDate);
    assert.strictEqual(res.body.loan.checkoutDate, null);
    assert.strictEqual(res.body.loan.dueDate, null);
    assert.strictEqual(res.body.loan.borrowerNetId, 'noah.thompson');
  });

  await test('GET /api/loans/:id returns standard loan details with checkout and due dates but null reserved date', async () => {
    const res = await request(app).get('/api/loans/LN-1040');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.loan.id, 'LN-1040');
    assert.strictEqual(res.body.loan.status, 'overdue');
    assert(res.body.loan.checkoutDate);
    assert(res.body.loan.dueDate);
    assert.strictEqual(res.body.loan.reservedDate, null);
    assert.strictEqual(res.body.loan.borrowerNetId, 'olivia.martinez');
  });

  await test('POST /api/loans with reservedDate triggers reserved status without checkout date or return due date', async () => {
    const res = await request(app)
      .post('/api/loans')
      .send({
        netid: 'james.chen',
        borrower: 'James Chen',
        equipmentId: 'EQ-001',
        reservedDate: '2026-10-18T10:00:00.000Z'
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.loan.status, 'reserved');
    assert(res.body.loan.reservedDate);
    assert.strictEqual(res.body.loan.checkoutDate, null);
    assert.strictEqual(res.body.loan.dueDate, null);
  });

  await test('POST /api/loans creates a new equipment checkout with normal active status', async () => {
    const res = await request(app)
      .post('/api/loans')
      .send({
        netid: 'emma.wilson',
        borrower: 'Emma Wilson',
        equipmentId: 'EQ-001',
        dueDate: '2026-10-20T17:00:00.000Z'
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'success');
    assert(res.body.loan.id.startsWith('LN-'));
    assert.strictEqual(res.body.loan.equipmentId, 'EQ-001');
    assert.strictEqual(res.body.loan.status, 'active');
    assert(res.body.loan.checkoutDate);
    assert(res.body.loan.dueDate);
    assert.strictEqual(res.body.loan.reservedDate, null);
  });

  await test('POST /api/loans/:id/return processes equipment return check-in', async () => {
    const res = await request(app)
      .post('/api/loans/LN-1042/return')
      .send({
        condition: 'good',
        destination: 'ready-shelf',
        notes: 'Returned on time and verified complete'
      });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.loan.status, 'returned');
    assert.strictEqual(res.body.loan.destination, 'ready-shelf');
    assert.strictEqual(res.body.loan.borrowerNetId, null, 'Borrower information must be cleared after return');
  });

  // 6. Preparation Pipeline
  await test('GET /api/preparation returns queue items', async () => {
    const res = await request(app).get('/api/preparation');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 4);
  });

  await test('PATCH /api/preparation/PREP-002 updates preparation task', async () => {
    const res = await request(app)
      .patch('/api/preparation/PREP-002')
      .send({
        status: 'review',
        currentStep: 4,
        notes: 'Sanitization completed, ready for supervisor review'
      });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.preparation.status, 'review');
    assert.strictEqual(res.body.preparation.currentStep, 4);

    // Restore PREP-002 to preserve initial database queue state
    await request(app)
      .patch('/api/preparation/PREP-002')
      .send({
        status: 'awaiting',
        currentStep: 1,
        notes: 'Needs physical inspection & sanitization wipe'
      });
  });

  // 7. Reports & KPIs
  await test('GET /api/reports/summary returns accurate dashboard KPIs', async () => {
    const res = await request(app).get('/api/reports/summary');
    assert.strictEqual(res.status, 200);
    assert(res.body.kpis.totalEquipment >= 28);
    assert(res.body.kpis.preparation);
  });

  await test('GET /api/reports returns equipment utilization data', async () => {
    const res = await request(app).get('/api/reports');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 11);
  });

  await test('GET /api/reports?semester=summer-2026 filters reports by timeframe', async () => {
    const res = await request(app).get('/api/reports?semester=summer-2026');
    assert.strictEqual(res.status, 200);
    assert(res.body.total > 0);
  });

  await test('GET /api/equipment?search=Switch filters collection by search query', async () => {
    const res = await request(app).get('/api/equipment?search=Switch');
    assert.strictEqual(res.status, 200);
    assert(res.body.equipment.length >= 1);
    assert(res.body.equipment[0].name.includes('Switch'));
  });

  await test('GET /api/loans?search=Emma filters loans by borrower query', async () => {
    const res = await request(app).get('/api/loans?search=Emma');
    assert.strictEqual(res.status, 200);
    assert(res.body.loans.length >= 1);
    const borrower = res.body.loans[0].borrower || res.body.loans[0].borrowerName;
    assert(borrower.includes('Emma'));
  });

  await test('GET /api/loans?search=overdue filters loans by overdue status', async () => {
    const res = await request(app).get('/api/loans?search=overdue');
    assert.strictEqual(res.status, 200);
    assert(res.body.loans.length >= 1);
    assert.strictEqual(res.body.loans[0].status, 'overdue');
  });

  await test('GET /api/loans?search=due filters loans by due date or status', async () => {
    const res = await request(app).get('/api/loans?search=due');
    assert.strictEqual(res.status, 200);
    assert(res.body.loans.length >= 2);
  });

  await test('GET /api/preparation?search=review filters preparation queue by status', async () => {
    const res = await request(app).get('/api/preparation?search=review');
    assert.strictEqual(res.status, 200);
    assert(res.body.preparation.length >= 2);
    res.body.preparation.forEach(p => assert.strictEqual(p.status, 'review'));
  });

  await test('GET /api/borrowers?search=Computer%20Science filters borrowers by department', async () => {
    const res = await request(app).get('/api/borrowers?search=Computer%20Science');
    assert.strictEqual(res.status, 200);
    assert(res.body.borrowers.length >= 1);
    assert.strictEqual(res.body.borrowers[0].department, 'Computer Science');
  });

  // 8. Error handling
  await test('GET /api/unmatched-endpoint returns 404 structured error', async () => {
    const res = await request(app).get('/api/unmatched-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not Found');
  });

  // 9. Client Scripts Syntax and Loan Record Integrity
  await test('api-client.js and components.js parse cleanly without syntax errors', async () => {
    const vm = require('vm');
    const apiCode = fs.readFileSync(path.join(__dirname, '../api-client.js'), 'utf8');
    assert.doesNotThrow(() => {
      new vm.Script(apiCode);
    }, 'api-client.js syntax error');

    const compCode = fs.readFileSync(path.join(__dirname, '../components.js'), 'utf8');
    assert.doesNotThrow(() => {
      new vm.Script(compCode);
    }, 'components.js syntax error');
  });

  await test('All loan records return distinct equipment items matching catalog', async () => {
    const expected = {
      'LN-1042': { equipmentName: 'Mirrorless Camera Kit', borrower: null },
      'LN-1041': { equipmentName: 'Nintendo Switch', borrower: 'James Chen' },
      'LN-1040': { equipmentName: 'H4 Zoom Audio Recording Kit', borrower: 'Olivia Martinez' },
      'LN-1039': { equipmentName: '3D Scanning Kit (Revopoint POP 3 Plus)', borrower: 'Noah Thompson' },
      'LN-1038': { equipmentName: 'Rode Wireless GO II Microphone System', borrower: 'Sophia Lee' }
    };

    for (const [id, exp] of Object.entries(expected)) {
      const res = await request(app).get(`/api/loans/${id}`);
      assert.strictEqual(res.status, 200, `Loan ${id} not found`);
      assert.strictEqual(res.body.loan.equipmentName, exp.equipmentName, `Item mismatch for ${id}`);
      assert.strictEqual(res.body.loan.borrowerName, exp.borrower, `Borrower mismatch for ${id}`);
    }
  });

  await test('preparation-all.html first item is highlighted with radio button and dark purple style', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../preparation-all.html'), 'utf8');
    assert.ok(html.includes('<tr class="selected-row"'), 'First row must have selected-row class');
    assert.ok(html.includes('background-color: #e5d8ef'), 'First row must have #e5d8ef background color');
    assert.ok(html.includes('class="selection-circle selected"'), 'First row must have selection-circle selected');
    assert.ok(html.includes('<span>EQ-014 selected</span>'), 'Footer must show EQ-014 selected');
  });

  await test('Reserved loan LN-1039 specifies reservedDate with null checkoutDate and dueDate', async () => {
    const res = await request(app).get('/api/loans/LN-1039');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.loan.status, 'reserved');
    assert.ok(res.body.loan.reservedDate, 'Must have reservedDate');
    assert.strictEqual(res.body.loan.checkoutDate, null, 'Reserved loan must not have checkoutDate');
    assert.strictEqual(res.body.loan.dueDate, null, 'Reserved loan must not have dueDate');
  });

  await test('index.html contains Preparation report and Loans report headings with updated counts', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    assert.ok(html.includes('>Preparation report</h2>'), 'Heading must be Preparation report');
    assert.ok(!html.includes('>Preparation reporting</h2>'), 'Old heading Preparation reporting must not be present');
    assert.ok(html.includes('>Loans report</h2>'), 'Heading must be Loans report');
    assert.ok(!html.includes('>Recent loans</h2>'), 'Old heading Recent loans must not be present');
    assert.ok(html.includes('7 loans: 6 open loans · 1 returned'), 'Subtitle must show 7 loans: 6 open loans · 1 returned');
    assert.ok(html.includes('All loans <b>7</b>'), 'Toolbar stats must show All loans 7');
    assert.ok(html.includes('Showing 7 of 7 loans'), 'Footer must show Showing 7 of 7 loans');
    assert.ok(html.includes('<span>Reserved</span><strong>02</strong>'), 'Overview stats card must show 02 Reserved');
  });

  await test('loans.html shows 7 loans with 6 open loans and 1 returned, and 7 rows total', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../loans.html'), 'utf8');
    assert.ok(html.includes('<h2 id="loan-list-heading">7 loans</h2>'), 'Heading must be 7 loans');
    assert.ok(html.includes('<p>6 open loans · 1 returned</p>'), 'Subheading must be 6 open loans · 1 returned');
    assert.ok(html.includes('Showing 7 of 7 loans'), 'Footer must show Showing 7 of 7 loans');
  });

  await test('Summary KPIs include totalLoans, openLoans, returnedLoans, reserved, overdue', async () => {
    const res = await request(app).get('/api/reports/summary');
    assert.strictEqual(res.status, 200);
    const k = res.body.kpis;
    assert.ok(k.totalLoans >= 7, 'Total loans must be at least 7');
    assert.ok(k.openLoans >= 6, 'Open loans must be at least 6');
    assert.ok(k.returnedLoans >= 1, 'Returned loans must be at least 1');
    assert.strictEqual(k.totalLoans, k.openLoans + k.returnedLoans, 'Total loans must equal openLoans + returnedLoans');
    assert.ok(k.reserved >= 1, 'Reserved loans must be at least 1');
    assert.ok(k.overdue >= 1, 'Overdue loans must be at least 1');
  });

  await test('Post-checkout report controls in index.html and reports.html have all 5 elements and single-row compact CSS', async () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const reportsHtml = fs.readFileSync(path.join(__dirname, '../reports.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');

    // Check index.html controls
    assert.ok(indexHtml.includes('id="overview-report-semester"'), 'index.html must have semester dropdown');
    assert.ok(indexHtml.includes('id="overview-report-from"'), 'index.html must have from date');
    assert.ok(indexHtml.includes('id="overview-report-to"'), 'index.html must have to date');
    assert.ok(indexHtml.includes('id="overview-report-search"'), 'index.html must have search input');
    assert.ok(indexHtml.includes('id="overview-btn-run-report"'), 'index.html must have Run report button');

    // Check reports.html controls
    assert.ok(reportsHtml.includes('id="report-semester"'), 'reports.html must have semester dropdown');
    assert.ok(reportsHtml.includes('id="report-from"'), 'reports.html must have from date');
    assert.ok(reportsHtml.includes('id="report-to"'), 'reports.html must have to date');
    assert.ok(reportsHtml.includes('id="report-search"'), 'reports.html must have search input');
    assert.ok(reportsHtml.includes('id="btn-run-report"'), 'reports.html must have Run report button');

    // Check styles.css has compact height and 5 columns for single row layout
    assert.ok(css.includes('.checkout-report-controls'), 'styles.css must have .checkout-report-controls class');
    assert.ok(css.includes('min-height: 1.85rem;'), 'styles.css must style controls with compact height');
  });

  await test('GET /api/borrowers/:netid excludes completed/returned loans and only returns active, reserved, and overdue items', async () => {
    const res = await request(app).get('/api/borrowers/emma.wilson');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.borrower.netid, 'emma.wilson');
    assert(Array.isArray(res.body.borrower.loans));
    const returnedLoans = res.body.borrower.loans.filter(l => l.status === 'returned');
    assert.strictEqual(returnedLoans.length, 0, 'Returned loans must never be displayed in borrower profile');
    const returnedLoanId = res.body.borrower.loans.find(l => l.id === 'LN-1042');
    assert.strictEqual(returnedLoanId, undefined, 'LN-1042 was returned and must not appear in patron loans');
  });

  await test('Returned loan anonymizes borrower information while retaining equipment use for reports', async () => {
    const loanRes = await request(app).get('/api/loans/LN-1042');
    assert.strictEqual(loanRes.status, 200);
    assert.strictEqual(loanRes.body.loan.status, 'returned');
    assert.strictEqual(loanRes.body.loan.borrowerNetId, null, 'Borrower NetID must be cleared for returned loans');
    assert.strictEqual(loanRes.body.loan.borrowerName, null, 'Borrower Name must be cleared for returned loans');
    assert.strictEqual(loanRes.body.loan.universityId, null, 'University ID must be cleared for returned loans');
    assert.strictEqual(loanRes.body.loan.equipmentId, 'EQ-001', 'Equipment ID must be retained for reporting');

    const reportsRes = await request(app).get('/api/reports');
    assert.strictEqual(reportsRes.status, 200);
    assert(reportsRes.body.reports.length > 0, 'Reports retain anonymous equipment utilization');
  });

  await test('borrowers.html links borrower names to borrower-details.html and borrower-details.html renders correctly', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../borrowers.html'), 'utf8');
    assert.ok(html.includes('href="borrower-details.html?netid=emma.wilson"'), 'borrowers.html must link Emma Wilson to borrower-details.html');
    assert.ok(html.includes('href="borrower-details.html?netid=james.chen"'), 'borrowers.html must link James Chen to borrower-details.html');
    assert.ok(html.includes('href="borrower-details.html?netid=marcus.vance"'), 'borrowers.html must link Marcus Vance to borrower-details.html');
    assert.ok(html.includes('href="borrower-details.html?netid=noah.thompson"'), 'borrowers.html must link Noah Thompson to borrower-details.html');
    assert.ok(html.includes('6 borrowers'), 'borrowers.html must show 6 borrowers');
    assert.ok(html.includes('Showing 6 of 6 borrowers'), 'borrowers.html must show Showing 6 of 6 borrowers');

    const detailHtml = fs.readFileSync(path.join(__dirname, '../borrower-details.html'), 'utf8');
    assert.ok(detailHtml.includes('borrower-detail-panel'), 'borrower-details.html must contain borrower-detail-panel');
    assert.ok(detailHtml.includes('id="borrower-items-rows"'), 'borrower-details.html must contain table rows for active/reserved/overdue items');
    assert.ok(detailHtml.includes('id="borrower-items-empty"'), 'borrower-details.html must contain empty state element');
  });

  await test('GET /api/loans?status=overdue returns overdue loans with registrar set to YES for LN-1040', async () => {
    const res = await request(app).get('/api/loans?status=overdue');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.loans.length, 1);
    const overdueLoan = res.body.loans[0];
    assert.strictEqual(overdueLoan.id, 'LN-1040');
    assert.strictEqual(overdueLoan.status, 'overdue');
    assert.strictEqual(overdueLoan.registrar, 'YES', 'LN-1040 must have registrar YES');
  });

  await test('PATCH /api/loans/:id updates registrar flag and validates loan existence', async () => {
    const notFoundRes = await request(app)
      .patch('/api/loans/LN-9999')
      .send({ registrar: 'YES' });
    assert.strictEqual(notFoundRes.status, 404);

    const patchNoRes = await request(app)
      .patch('/api/loans/LN-1040')
      .send({ registrar: 'NO' });
    assert.strictEqual(patchNoRes.status, 200);
    assert.strictEqual(patchNoRes.body.loan.registrar, 'NO');

    const patchYesRes = await request(app)
      .patch('/api/loans/LN-1040')
      .send({ registrar: 'YES' });
    assert.strictEqual(patchYesRes.status, 200);
    assert.strictEqual(patchYesRes.body.loan.registrar, 'YES');
  });

  await test('loan-details.html contains registrar toggle checkbox; loans.html and loans-overdue.html display Yes or No without checkbox', async () => {
    const detailHtml = fs.readFileSync(path.join(__dirname, '../loan-details.html'), 'utf8');
    assert.ok(detailHtml.includes('id="loan-registrar"'), 'loan-details.html must contain loan-registrar container');
    assert.ok(detailHtml.includes('class="registrar-checkbox"'), 'loan-details.html must contain registrar-checkbox');
    assert.ok(detailHtml.includes('id="loan-registrar-checkbox"'), 'loan-details.html must have id="loan-registrar-checkbox"');
    assert.ok(detailHtml.includes('id="loan-registrar-text"'), 'loan-details.html must have id="loan-registrar-text"');

    const overdueHtml = fs.readFileSync(path.join(__dirname, '../loans-overdue.html'), 'utf8');
    assert.ok(overdueHtml.includes('<th scope="col">Registrar yes/no</th>'), 'loans-overdue.html must have header Registrar yes/no');
    assert.ok(overdueHtml.includes('<td class="registrar-cell">Yes</td>'), 'loans-overdue.html must display Yes for overdue loan');
    assert.ok(!overdueHtml.includes('class="registrar-checkbox"'), 'loans-overdue.html must not display checkbox control');

    const loansHtml = fs.readFileSync(path.join(__dirname, '../loans.html'), 'utf8');
    assert.ok(loansHtml.includes('<th scope="col">Registrar yes/no</th>'), 'loans.html must have header Registrar yes/no');
    assert.ok(loansHtml.includes('<td class="registrar-cell">Yes</td>'), 'loans.html must display Yes for LN-1040');
    assert.ok(loansHtml.includes('<td class="registrar-cell">No</td>'), 'loans.html must display No for non-overdue loans');
    assert.ok(!loansHtml.includes('class="registrar-checkbox"'), 'loans.html must not display checkbox in table rows');

    const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
    assert.ok(css.includes('.registrar-toggle-label'), 'styles.css must style .registrar-toggle-label');
    assert.ok(css.includes('.registrar-checkbox'), 'styles.css must style .registrar-checkbox');
    assert.ok(css.includes('.registrar-text'), 'styles.css must style .registrar-text');
  });

  console.log(`\n-----------------------------------------`);
  console.log(`API Tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`-----------------------------------------`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
