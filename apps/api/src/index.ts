import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './auth/session.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { routingRoutes } from './routes/routing.js';
import { routesApi } from './routes/routes.js';

export interface Env {
  DB?: D1Database;
  MOCK_AUTH?: string;
  ENVIRONMENT?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS with credentials support
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
  })
);

// Session and auth middleware
app.use('*', authMiddleware);

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'hiking-companion-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/routing', routingRoutes);
app.route('/api/routes', routesApi);

export default app;
