// Local helper dev-server simulating Netlify Functions environment
// Port 8888 (matches Vite config proxy target)
import http from 'http';
import { handler as loginHandler } from './netlify/functions/login.js';
import { handler as updatePasswordHandler } from './netlify/functions/update-password.js';
import { handler as attendanceHandler } from './netlify/functions/attendance.js';
import { handler as historyHandler } from './netlify/functions/history.js';
import { handler as leaveHandler } from './netlify/functions/leave.js';

const PORT = 8888;

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  let handler;
  if (path === '/.netlify/functions/login') handler = loginHandler;
  else if (path === '/.netlify/functions/update-password') handler = updatePasswordHandler;
  else if (path === '/.netlify/functions/attendance') handler = attendanceHandler;
  else if (path === '/.netlify/functions/history') handler = historyHandler;
  else if (path === '/.netlify/functions/leave') handler = leaveHandler;

  if (!handler) {
    res.writeHead(404, headers);
    res.end(JSON.stringify({ message: 'Function not found' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    const event = {
      httpMethod: req.method,
      body: body,
      queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
      headers: req.headers,
    };

    try {
      const response = await handler(event, {});
      res.writeHead(response.statusCode, {
        ...headers,
        ...response.headers,
      });
      res.end(response.body);
    } catch (err) {
      console.error('Handler error:', err);
      res.writeHead(500, headers);
      res.end(JSON.stringify({ message: 'Serverless execution error', error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`[SIPEKAL RSPB] Mock Serverless Backend Running!`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Vite dev server will proxy API calls here automatically.`);
  console.log(`=============================================================\n`);
});
