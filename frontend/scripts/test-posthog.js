// Test PostHog installation by sending a test event
const https = require('https');

const data = JSON.stringify({
  api_key: 'phc_yadYvotjjYlgPC374Vp1IMSX6pkkot7nKHrW6KEhxA2',
  event: 'test_installation',
  properties: {
    distinct_id: 'test-user-' + Date.now(),
    source: 'installation-test',
    timestamp: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
});

const options = {
  hostname: 'us.i.posthog.com',
  port: 443,
  path: '/capture/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending test event to PostHog...');

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  res.on('data', (d) => {
    process.stdout.write(d);
  });

  res.on('end', () => {
    console.log('\n✓ Test event sent successfully!');
    console.log('Check your PostHog dashboard for the "test_installation" event.');
  });
});

req.on('error', (error) => {
  console.error('✗ Error sending event:', error);
});

req.write(data);
req.end();
