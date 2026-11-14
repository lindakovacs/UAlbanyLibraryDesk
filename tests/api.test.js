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
  });

  await test('GET /api/auth/session returns active staff session', async () => {
    const res = await request(app).get('/api/auth/session');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.session.authenticated, true);
    assert.strictEqual(res.body.session.user.role, 'Circulation Supervisor');
  });

  await test('POST /api/auth/login authenticates Circulation Specialist (maria.santos)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'maria.santos', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'Circulation Specialist');
    assert.strictEqual(res.body.user.name, 'Maria Santos');
  });

  await test('GET /api/reports rejects Circulation Specialist with 403 Forbidden', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ netid: 'maria.santos', password: 'password123' });
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
  await test('GET /api/borrowers returns 5 registered borrowers', async () => {
    const res = await request(app).get('/api/borrowers');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 5);
  });

  await test('GET /api/borrowers/emma.wilson returns borrower profile and loans', async () => {
    const res = await request(app).get('/api/borrowers/emma.wilson');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.borrower.netid, 'emma.wilson');
    assert(Array.isArray(res.body.borrower.loans));
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
      'LN-1042': { equipmentName: 'Mirrorless Camera Kit', borrower: 'Emma Wilson' },
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
