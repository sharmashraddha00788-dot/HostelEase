process.env.NODE_ENV = 'production';
const http = require('http');
const app = require('./server');

const TEST_PORT = 5088;
const server = app.listen(TEST_PORT, async () => {
  const get = (urlPath) =>
    new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${TEST_PORT}${urlPath}`, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, data: d }));
      }).on('error', reject);
    });

  try {
    const health = await get('/api/health');
    const root = await get('/');
    const deepLink = await get('/app/rooms');
    const nonExistentApi = await get('/api/some-unknown-route');

    console.log('✅ GET /api/health ->', health.status);
    console.log('✅ GET / ->', root.status, '| Contains root div:', root.data.includes('id="root"'));
    console.log('✅ GET /app/rooms (Deep Link Fallback) ->', deepLink.status, '| Contains root div:', deepLink.data.includes('id="root"'));
    console.log('✅ GET /api/some-unknown-route ->', nonExistentApi.status, '(Correctly returns 404 JSON)');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
