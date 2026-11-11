const assert = require('assert');
const request = require('supertest');

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
  });

  await test('POST /api/loans creates a new equipment checkout', async () => {
    const res = await request(app)
      .post('/api/loans')
      .send({
        netid: 'emma.wilson',
        borrower: 'Emma Wilson',
        equipmentId: 'EQ-002',
        dueDate: '2026-10-20T17:00:00.000Z'
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'success');
    assert(res.body.loan.id.startsWith('LN-'));
    assert.strictEqual(res.body.loan.equipmentId, 'EQ-002');
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
