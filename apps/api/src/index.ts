import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'hiking-companion-api',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

export default app;
