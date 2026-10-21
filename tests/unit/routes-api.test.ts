import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './helpers/createTestDb.js';
import { getOrCreateOAuthUser } from '../../apps/api/src/routes/auth.js';
import { createSession } from '../../apps/api/src/auth/session.js';
import app from '../../apps/api/src/index.js';

describe('Routes API Endpoints (/api/routes)', () => {
  let testEnv: ReturnType<typeof createTestDb>;
  let userToken: string;
  let otherUserToken: string;

  beforeEach(async () => {
    testEnv = createTestDb();

    // Create primary user
    const { user: userA } = await getOrCreateOAuthUser(
      testEnv.db,
      'google',
      'user-a-sub',
      'user.a@example.com',
      'User A'
    );
    const { token: tokenA } = await createSession(testEnv.db, userA.id);
    userToken = tokenA;

    // Create second user
    const { user: userB } = await getOrCreateOAuthUser(
      testEnv.db,
      'github',
      'user-b-sub',
      'user.b@example.com',
      'User B'
    );
    const { token: tokenB } = await createSession(testEnv.db, userB.id);
    otherUserToken = tokenB;
  });

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const listRes = await app.request('/api/routes', { method: 'GET' }, { DB: testEnv.d1 });
    expect(listRes.status).toBe(401);

    const postRes = await app.request(
      '/api/routes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Hike' }),
      },
      { DB: testEnv.d1 }
    );
    expect(postRes.status).toBe(401);
  });

  it('saves a new route and retrieves it by id', async () => {
    const routePayload = {
      title: 'Veluwezoom Trail',
      totalDistanceKm: 14.2,
      coordinates: [
        { lat: 52.01, lng: 5.95 },
        { lat: 52.02, lng: 5.96 },
      ],
      waypoints: [
        { id: 'wp-1', coordinate: { lat: 52.01, lng: 5.95 }, routingMode: 'snap' },
        { id: 'wp-2', coordinate: { lat: 52.02, lng: 5.96 }, routingMode: 'snap' },
      ],
      elevationMetrics: {
        elevationGainMeters: 120,
        elevationLossMeters: 110,
      },
    };

    const createRes = await app.request(
      '/api/routes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${userToken}`,
        },
        body: JSON.stringify(routePayload),
      },
      { DB: testEnv.d1 }
    );

    expect(createRes.status).toBe(201);
    const createData = (await createRes.json()) as any;
    expect(createData.success).toBe(true);
    expect(createData.route.id).toBeDefined();
    expect(createData.route.title).toBe('Veluwezoom Trail');
    expect(createData.route.totalDistanceKm).toBe(14.2);

    const routeId = createData.route.id;

    // Fetch the created route
    const getRes = await app.request(
      `/api/routes/${routeId}`,
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );

    expect(getRes.status).toBe(200);
    const getData = (await getRes.json()) as any;
    expect(getData.route.id).toBe(routeId);
    expect(getData.route.coordinates).toHaveLength(2);
    expect(getData.route.waypoints).toHaveLength(2);
    expect(getData.route.elevationMetrics.elevationGainMeters).toBe(120);
  });

  it('lists user saved routes and isolates routes across accounts', async () => {
    // Save route as User A
    await app.request(
      '/api/routes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${userToken}`,
        },
        body: JSON.stringify({
          title: "User A's Favorite Path",
          totalDistanceKm: 8.5,
          coordinates: [{ lat: 52.1, lng: 5.1 }],
        }),
      },
      { DB: testEnv.d1 }
    );

    // List as User A
    const listResA = await app.request(
      '/api/routes',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(listResA.status).toBe(200);
    const dataA = (await listResA.json()) as any;
    expect(dataA.routes).toHaveLength(1);
    expect(dataA.routes[0].title).toBe("User A's Favorite Path");

    // List as User B (should be empty)
    const listResB = await app.request(
      '/api/routes',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${otherUserToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(listResB.status).toBe(200);
    const dataB = (await listResB.json()) as any;
    expect(dataB.routes).toHaveLength(0);
  });

  it('updates and deletes a route successfully', async () => {
    // Create route
    const createRes = await app.request(
      '/api/routes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${userToken}`,
        },
        body: JSON.stringify({
          title: 'Initial Title',
          coordinates: [{ lat: 52.0, lng: 5.0 }],
        }),
      },
      { DB: testEnv.d1 }
    );
    const { route } = (await createRes.json()) as any;

    // Update title
    const putRes = await app.request(
      `/api/routes/${route.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${userToken}`,
        },
        body: JSON.stringify({ title: 'Updated Title', totalDistanceKm: 5.0 }),
      },
      { DB: testEnv.d1 }
    );
    expect(putRes.status).toBe(200);

    // Verify update
    const getRes = await app.request(
      `/api/routes/${route.id}`,
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    const getData = (await getRes.json()) as any;
    expect(getData.route.title).toBe('Updated Title');
    expect(getData.route.totalDistanceKm).toBe(5.0);

    // Delete route
    const deleteRes = await app.request(
      `/api/routes/${route.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(deleteRes.status).toBe(200);

    // Verify gone
    const getDeletedRes = await app.request(
      `/api/routes/${route.id}`,
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(getDeletedRes.status).toBe(404);
  });
});
