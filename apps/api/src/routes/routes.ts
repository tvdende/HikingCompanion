import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { routes } from '../db/schema.js';
import type { Env } from '../index.js';
import type { Coordinate, HikeStage, RouteElevationMetrics, RouteWaypoint, UserProfile } from '@hiking-companion/core';

export const routesApi = new Hono<{
  Bindings: Env;
  Variables: {
    user?: UserProfile;
    session?: import('../db/schema.js').Session;
  };
}>();

// GET /api/routes - List all routes for current authenticated user
routesApi.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const db = getDb(c.env.DB);
  const userRoutes = await db
    .select({
      id: routes.id,
      title: routes.title,
      totalDistanceKm: routes.totalDistanceKm,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
    })
    .from(routes)
    .where(eq(routes.userId, user.id))
    .orderBy(desc(routes.updatedAt));

  return c.json({ routes: userRoutes });
});

// POST /api/routes - Save a new route
routesApi.post('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  let body: {
    title: string;
    totalDistanceKm?: number;
    coordinates?: Coordinate[];
    waypoints?: RouteWaypoint[];
    stages?: HikeStage[];
    elevationMetrics?: RouteElevationMetrics;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return c.json({ error: 'Route title is required' }, 400);
  }

  const coordinates = body.coordinates || [];
  if (coordinates.length === 0 && (!body.waypoints || body.waypoints.length === 0)) {
    return c.json({ error: 'Route must contain coordinates or waypoints' }, 400);
  }

  const db = getDb(c.env.DB);
  const routeId = crypto.randomUUID();
  const now = new Date();

  const totalDistanceKm =
    typeof body.totalDistanceKm === 'number'
      ? Number(body.totalDistanceKm.toFixed(2))
      : 0;

  await db.insert(routes).values({
    id: routeId,
    userId: user.id,
    title: body.title.trim(),
    totalDistanceKm,
    coordinatesJson: JSON.stringify(coordinates),
    waypointsJson: body.waypoints ? JSON.stringify(body.waypoints) : null,
    stagesJson: body.stages ? JSON.stringify(body.stages) : null,
    elevationMetricsJson: body.elevationMetrics ? JSON.stringify(body.elevationMetrics) : null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json(
    {
      success: true,
      route: {
        id: routeId,
        userId: user.id,
        title: body.title.trim(),
        totalDistanceKm,
        coordinates,
        waypoints: body.waypoints || [],
        stages: body.stages || [],
        elevationMetrics: body.elevationMetrics || null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    },
    201
  );
});

// GET /api/routes/:id - Retrieve specific route
routesApi.get('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const routeId = c.req.param('id');
  const db = getDb(c.env.DB);

  const found = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, routeId), eq(routes.userId, user.id)))
    .limit(1);

  if (found.length === 0) {
    return c.json({ error: 'Route not found' }, 404);
  }

  const r = found[0];
  return c.json({
    route: {
      id: r.id,
      userId: r.userId,
      title: r.title,
      totalDistanceKm: r.totalDistanceKm,
      coordinates: JSON.parse(r.coordinatesJson || '[]'),
      waypoints: r.waypointsJson ? JSON.parse(r.waypointsJson) : [],
      stages: r.stagesJson ? JSON.parse(r.stagesJson) : [],
      elevationMetrics: r.elevationMetricsJson ? JSON.parse(r.elevationMetricsJson) : null,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    },
  });
});

// PUT /api/routes/:id - Update existing route
routesApi.put('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const routeId = c.req.param('id');
  const db = getDb(c.env.DB);

  const existing = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, routeId), eq(routes.userId, user.id)))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: 'Route not found' }, 404);
  }

  let body: {
    title?: string;
    totalDistanceKm?: number;
    coordinates?: Coordinate[];
    waypoints?: RouteWaypoint[];
    stages?: HikeStage[];
    elevationMetrics?: RouteElevationMetrics;
  };

  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const now = new Date();
  const updateValues: Record<string, unknown> = {
    updatedAt: now,
  };

  if (typeof body.title === 'string' && body.title.trim().length > 0) {
    updateValues.title = body.title.trim();
  }
  if (typeof body.totalDistanceKm === 'number') {
    updateValues.totalDistanceKm = Number(body.totalDistanceKm.toFixed(2));
  }
  if (body.coordinates) {
    updateValues.coordinatesJson = JSON.stringify(body.coordinates);
  }
  if (body.waypoints) {
    updateValues.waypointsJson = JSON.stringify(body.waypoints);
  }
  if (body.stages) {
    updateValues.stagesJson = JSON.stringify(body.stages);
  }
  if (body.elevationMetrics) {
    updateValues.elevationMetricsJson = JSON.stringify(body.elevationMetrics);
  }

  await db.update(routes).set(updateValues).where(eq(routes.id, routeId));

  return c.json({ success: true, updatedAt: now.toISOString() });
});

// DELETE /api/routes/:id - Delete route
routesApi.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const routeId = c.req.param('id');
  const db = getDb(c.env.DB);

  const existing = await db
    .select()
    .from(routes)
    .where(and(eq(routes.id, routeId), eq(routes.userId, user.id)))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: 'Route not found' }, 404);
  }

  await db.delete(routes).where(eq(routes.id, routeId));
  return c.json({ success: true });
});
