const assert = require('assert');
const request = require('supertest');

// Set NODE_ENV to test to suppress access logs during testing
process.env.NODE_ENV = 'test';

const app = require('../server/app');

async function runTests() {
  console.log('--- Running Health Check and API Tests ---\n');
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

  await test('GET /health returns 200 with status ok and system metadata', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'].includes('application/json'), true);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(typeof res.body.timestamp, 'string');
    assert.strictEqual(typeof res.body.uptime, 'number');
    assert.strictEqual(res.body.environment, 'test');
    assert.strictEqual(typeof res.body.version, 'string');
  });

  await test('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await test('GET /ready returns 200 with status ready', async () => {
    const res = await request(app).get('/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ready');
    assert.strictEqual(typeof res.body.timestamp, 'string');
  });

  await test('GET /api/ready returns 200 with status ready', async () => {
    const res = await request(app).get('/api/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ready');
  });

  await test('CORS headers are present on responses', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
  });

  await test('GET /api/nonexistent-endpoint returns 404 with structured JSON error', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not Found');
    assert.strictEqual(res.body.status, 404);
    assert.strictEqual(typeof res.body.message, 'string');
  });

  console.log(`\n-----------------------------------------`);
  console.log(`Tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
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
