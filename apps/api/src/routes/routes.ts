import { Hono } from 'hono';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { routes, type RouteStatus } from '../db/schema.js';
import { analyzeRouteSurface } from './surface.js';
import type { Env } from '../index.js';
import type {
  Coordinate,
  HikeStage,
  RouteElevationMetrics,
  RouteWaypoint,
  SurfaceBreakdown,
  UserProfile,
} from '@hiking-companion/core';

export const routesApi = new Hono<{
  Bindings: Env;
  Variables: {
    user?: UserProfile;
    session?: import('../db/schema.js').Session;
  };
}>();

// GET /api/routes - List all routes for current authenticated user with optional status and search filters
routesApi.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const statusQuery = c.req.query('status') as RouteStatus | undefined;
  const searchQuery = c.req.query('search')?.trim();

  const conditions = [eq(routes.userId, user.id)];

  if (statusQuery === 'draft' || statusQuery === 'definitive') {
    conditions.push(eq(routes.status, statusQuery));
  }

  if (searchQuery && searchQuery.length > 0) {
    conditions.push(
      or(
        like(routes.title, `%${searchQuery}%`),
        like(routes.location, `%${searchQuery}%`),
        like(routes.description, `%${searchQuery}%`)
      )!
    );
  }

  const db = getDb(c.env.DB);
  const userRoutes = await db
    .select({
      id: routes.id,
      title: routes.title,
      description: routes.description,
      location: routes.location,
      status: routes.status,
      priceEur: routes.priceEur,
      totalDistanceKm: routes.totalDistanceKm,
      stagesJson: routes.stagesJson,
      elevationMetricsJson: routes.elevationMetricsJson,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
    })
    .from(routes)
    .where(and(...conditions))
    .orderBy(desc(routes.updatedAt));

  const mapped = userRoutes.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || null,
    location: r.location || null,
    status: r.status as RouteStatus,
    priceEur: r.priceEur,
    totalDistanceKm: r.totalDistanceKm,
    stageCount: r.stagesJson ? (JSON.parse(r.stagesJson) || []).length : 1,
    elevationMetrics: r.elevationMetricsJson ? JSON.parse(r.elevationMetricsJson) : null,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));

  return c.json({ routes: mapped });
});

// POST /api/routes - Save a new route with metadata and lifecycle status
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
    description?: string;
    location?: string;
    status?: RouteStatus;
    priceEur?: number;
    totalDistanceKm?: number;
    coordinates?: Coordinate[];
    waypoints?: RouteWaypoint[];
    stages?: HikeStage[];
    elevationMetrics?: RouteElevationMetrics;
    surfaceBreakdown?: SurfaceBreakdown;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return c.json({ error: 'Route title is required' }, 400);
  }

  const coordinates =
    body.coordinates && body.coordinates.length > 0
      ? body.coordinates
      : (body.stages || []).flatMap((s) => s.coordinates || []);
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

  const status: RouteStatus =
    body.status === 'definitive' ? 'definitive' : 'draft';
  const priceEur =
    typeof body.priceEur === 'number' && !isNaN(body.priceEur) && body.priceEur >= 0
      ? Number(body.priceEur.toFixed(2))
      : 0;
  const routeStages = body.stages && body.stages.length > 0
    ? body.stages
    : coordinates.length > 1
      ? [{ id: 'stage-1', stageNumber: 1, title: 'Route', distanceKm: totalDistanceKm, coordinates }]
      : [];
  const surfaceBreakdown = body.surfaceBreakdown ?? await analyzeRouteSurface(routeStages);

  await db.insert(routes).values({
    id: routeId,
    userId: user.id,
    title: body.title.trim(),
    description: body.description?.trim() || null,
    location: body.location?.trim() || null,
    status,
    priceEur,
    totalDistanceKm,
    coordinatesJson: JSON.stringify(coordinates),
    waypointsJson: body.waypoints ? JSON.stringify(body.waypoints) : null,
    stagesJson: body.stages ? JSON.stringify(body.stages) : null,
    elevationMetricsJson: body.elevationMetrics ? JSON.stringify(body.elevationMetrics) : null,
    surfaceBreakdownJson: surfaceBreakdown ? JSON.stringify(surfaceBreakdown) : null,
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
        description: body.description?.trim() || null,
        location: body.location?.trim() || null,
        status,
        priceEur,
        totalDistanceKm,
        coordinates,
        waypoints: body.waypoints || [],
        stages: body.stages || [],
        elevationMetrics: body.elevationMetrics || null,
        surfaceBreakdown: surfaceBreakdown || null,
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
      description: r.description || null,
      location: r.location || null,
      status: (r.status || 'draft') as RouteStatus,
      priceEur: r.priceEur ?? 0,
      totalDistanceKm: r.totalDistanceKm,
      coordinates: JSON.parse(r.coordinatesJson || '[]'),
      waypoints: r.waypointsJson ? JSON.parse(r.waypointsJson) : [],
      stages: r.stagesJson ? JSON.parse(r.stagesJson) : [],
      elevationMetrics: r.elevationMetricsJson ? JSON.parse(r.elevationMetricsJson) : null,
      surfaceBreakdown: r.surfaceBreakdownJson ? JSON.parse(r.surfaceBreakdownJson) : null,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    },
  });
});

// PUT /api/routes/:id - Update existing route (supports partial metadata and/or geometry)
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
    description?: string;
    location?: string;
    status?: RouteStatus;
    priceEur?: number;
    totalDistanceKm?: number;
    coordinates?: Coordinate[];
    waypoints?: RouteWaypoint[];
    stages?: HikeStage[];
    elevationMetrics?: RouteElevationMetrics;
    surfaceBreakdown?: SurfaceBreakdown;
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
  const hasGeometryUpdate = body.coordinates !== undefined || body.stages !== undefined;

  if (typeof body.title === 'string' && body.title.trim().length > 0) {
    updateValues.title = body.title.trim();
  }
  if (body.description !== undefined) {
    updateValues.description = body.description ? body.description.trim() : null;
  }
  if (body.location !== undefined) {
    updateValues.location = body.location ? body.location.trim() : null;
  }
  if (body.status === 'draft' || body.status === 'definitive') {
    updateValues.status = body.status;
  }
  if (typeof body.priceEur === 'number' && !isNaN(body.priceEur) && body.priceEur >= 0) {
    updateValues.priceEur = Number(body.priceEur.toFixed(2));
  }
  if (typeof body.totalDistanceKm === 'number') {
    updateValues.totalDistanceKm = Number(body.totalDistanceKm.toFixed(2));
  }
  if (body.coordinates && body.coordinates.length > 0) {
    updateValues.coordinatesJson = JSON.stringify(body.coordinates);
  } else if (body.stages && body.stages.length > 0) {
    const coords = body.stages.flatMap((s) => s.coordinates || []);
    if (coords.length > 0) {
      updateValues.coordinatesJson = JSON.stringify(coords);
    }
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
  if (hasGeometryUpdate) {
    const updatedCoordinates = body.coordinates && body.coordinates.length > 0
      ? body.coordinates
      : (body.stages || []).flatMap((stage) => stage.coordinates || []);
    const updatedStages = body.stages && body.stages.length > 0
      ? body.stages
      : updatedCoordinates.length > 1
        ? [{ id: 'stage-1', stageNumber: 1, title: 'Route', distanceKm: body.totalDistanceKm || 0, coordinates: updatedCoordinates }]
        : [];
    const surfaceBreakdown = body.surfaceBreakdown ?? await analyzeRouteSurface(updatedStages);
    updateValues.surfaceBreakdownJson = surfaceBreakdown ? JSON.stringify(surfaceBreakdown) : null;
  } else if (body.surfaceBreakdown) {
    updateValues.surfaceBreakdownJson = JSON.stringify(body.surfaceBreakdown);
  }

  await db.update(routes).set(updateValues).where(eq(routes.id, routeId));

  const updated = await db
    .select()
    .from(routes)
    .where(eq(routes.id, routeId))
    .limit(1);

  const r = updated[0];

  return c.json({
    success: true,
    updatedAt: now.toISOString(),
    route: {
      id: r.id,
      title: r.title,
      description: r.description || null,
      location: r.location || null,
      status: (r.status || 'draft') as RouteStatus,
      priceEur: r.priceEur ?? 0,
      totalDistanceKm: r.totalDistanceKm,
      surfaceBreakdown: r.surfaceBreakdownJson ? JSON.parse(r.surfaceBreakdownJson) : null,
      updatedAt: new Date(r.updatedAt).toISOString(),
    },
  });
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
