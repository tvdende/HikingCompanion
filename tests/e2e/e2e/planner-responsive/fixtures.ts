import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type DeviceCategory = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export const TOUCH_CATEGORIES: readonly DeviceCategory[] = ['mobile', 'tablet'];

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures');
const neutralTile = readFileSync(resolve(fixturesDir, 'map-tile.png'));

export const PLANNER_USER = {
  id: 'responsive-planner',
  name: 'Robin Planner',
  email: 'planner@hiking.test',
  role: 'planner',
  isActive: true,
  createdAt: '2026-01-01T08:00:00.000Z',
  lastLoginAt: '2026-01-01T08:00:00.000Z',
};

type LatLng = { lat: number; lng: number };

interface StoredRoute {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status: 'draft' | 'definitive';
  priceEur: number;
  totalDistanceKm: number;
  stages: unknown[];
  waypoints: unknown[];
  coordinates: LatLng[];
  surfaceBreakdown?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface MockApi {
  routes: Map<string, StoredRoute>;
}

function seedRoute(
  id: string,
  title: string,
  status: StoredRoute['status'],
  priceEur: number,
  location: string,
  start: LatLng,
): StoredRoute {
  const coordinates = [
    start,
    { lat: start.lat + 0.02, lng: start.lng + 0.03 },
    { lat: start.lat + 0.04, lng: start.lng + 0.05 },
  ];
  const stageId = `${id}-stage-1`;
  return {
    id,
    title,
    description: `${title} – testroute`,
    location,
    status,
    priceEur,
    totalDistanceKm: 6.4,
    coordinates,
    stages: [{ id: stageId, stageNumber: 1, title, distanceKm: 6.4, transportType: 'foot', coordinates }],
    waypoints: [
      { id: `${id}-wp-1`, coordinate: coordinates[0], routingMode: 'snap', stageId },
      { id: `${id}-wp-2`, coordinate: coordinates[2], routingMode: 'snap', stageId },
    ],
    createdAt: '2026-01-02T08:00:00.000Z',
    updatedAt: '2026-01-03T08:00:00.000Z',
  };
}

function haversineMeters(a: [number, number], b: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function surfaceBreakdownFor(stages: { id: string; coordinates?: LatLng[] }[]) {
  const segments = stages
    .filter((stage) => (stage.coordinates?.length ?? 0) > 1)
    .map((stage, index) => ({
      stageId: stage.id,
      category: index % 2 === 0 ? 'unpaved' : 'gravel',
      coordinates: stage.coordinates,
      distanceMeters: 3200,
    }));
  const unpaved = segments.filter((s) => s.category === 'unpaved').length * 3200;
  const gravel = segments.filter((s) => s.category === 'gravel').length * 3200;
  const total = Math.max(unpaved + gravel, 1);
  return {
    unpavedMeters: unpaved,
    pavedMeters: 0,
    gravelMeters: gravel,
    unknownMeters: 0,
    totalMeters: total,
    unpavedPercentage: Math.round((unpaved / total) * 100),
    pavedPercentage: 0,
    gravelPercentage: Math.round((gravel / total) * 100),
    unknownPercentage: 0,
    segments,
    source: 'brouter',
    status: 'complete',
  };
}

async function installApiMocks(page: Page, api: MockApi) {
  let signedIn = true;

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, json: { user: signedIn ? PLANNER_USER : null } }),
  );
  await page.route('**/api/auth/mock-login', (route) => {
    signedIn = true;
    return route.fulfill({ status: 200, json: { success: true, user: PLANNER_USER } });
  });
  await page.route('**/api/auth/logout', (route) => {
    signedIn = false;
    return route.fulfill({ status: 200, json: { success: true } });
  });

  await page.route('**/api/routing/route', (route) => {
    const body = route.request().postDataJSON() as { coordinates: [number, number][] };
    const [from, to] = body.coordinates;
    const mid: [number, number] = [(from[0] + to[0]) / 2 + 0.002, (from[1] + to[1]) / 2 + 0.001];
    return route.fulfill({
      status: 200,
      json: {
        coordinates: [from, mid, to],
        distanceMeters: Math.round(haversineMeters(from, mid) + haversineMeters(mid, to)),
        durationSeconds: 900,
        isFallback: false,
      },
    });
  });

  await page.route(/\/api\/routes(\/[^/?]+)?(\?.*)?$/, async (route) => {
    const request = route.request();
    const segments = new URL(request.url()).pathname.split('/').filter(Boolean);
    const id = segments.length > 2 ? decodeURIComponent(segments[2]) : undefined;
    const method = request.method();

    if (id === 'surface-analysis') {
      const body = request.postDataJSON() as { stages: { id: string; coordinates?: LatLng[] }[] };
      return route.fulfill({ status: 200, json: { surfaceBreakdown: surfaceBreakdownFor(body.stages) } });
    }

    if (!id && method === 'GET') {
      const routes = [...api.routes.values()].map(
        ({ stages: _stages, waypoints: _waypoints, coordinates: _coordinates, ...summary }) => summary,
      );
      return route.fulfill({ status: 200, json: { routes } });
    }

    if (!id && method === 'POST') {
      const body = request.postDataJSON() as Partial<StoredRoute>;
      const now = new Date().toISOString();
      const created: StoredRoute = {
        id: `route-created-${api.routes.size + 1}`,
        title: body.title ?? 'Route',
        description: body.description,
        location: body.location,
        status: body.status ?? 'draft',
        priceEur: body.priceEur ?? 0,
        totalDistanceKm: body.totalDistanceKm ?? 0,
        stages: body.stages ?? [],
        waypoints: body.waypoints ?? [],
        coordinates: body.coordinates ?? [],
        surfaceBreakdown: body.surfaceBreakdown,
        createdAt: now,
        updatedAt: now,
      };
      api.routes.set(created.id, created);
      return route.fulfill({ status: 201, json: { route: created } });
    }

    const existing = id ? api.routes.get(id) : undefined;
    if (!existing) return route.fulfill({ status: 404, json: { error: 'Not found' } });

    if (method === 'GET') return route.fulfill({ status: 200, json: { route: existing } });
    if (method === 'PUT' || method === 'PATCH') {
      const body = request.postDataJSON() as Partial<StoredRoute>;
      const updated = { ...existing, ...body, id: existing.id, updatedAt: new Date().toISOString() };
      api.routes.set(existing.id, updated);
      return route.fulfill({ status: 200, json: { success: true, route: updated } });
    }
    if (method === 'DELETE') {
      api.routes.delete(existing.id);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 405 });
  });

  if (process.env.PLANNER_REAL_TILES !== '1') {
    await page.route('https://tile.openstreetmap.org/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: neutralTile }),
    );
  }
}

const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

export const test = base.extend<{ category: DeviceCategory; isTouch: boolean; api: MockApi }>({
  category: async ({}, use, testInfo) => {
    const category = testInfo.project.metadata?.category as DeviceCategory | undefined;
    if (!category) throw new Error(`Project ${testInfo.project.name} has no device category metadata`);
    await use(category);
  },
  isTouch: async ({ category }, use) => {
    await use(TOUCH_CATEGORIES.includes(category));
  },
  api: async ({}, use) => {
    await use({
      routes: new Map([
        ['route-draft-veluwe', seedRoute('route-draft-veluwe', 'Veluwe Verkenning', 'draft', 0, 'Gelderland', { lat: 52.05, lng: 5.9 })],
        ['route-final-pieterpad', seedRoute('route-final-pieterpad', 'Pieterpad Etappe 1', 'definitive', 2.99, 'Groningen', { lat: 53.33, lng: 6.43 })],
      ]),
    });
  },
  page: async ({ page, api }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((css) => {
      const inject = () => {
        const style = document.createElement('style');
        style.dataset.test = 'disable-animations';
        style.textContent = css;
        document.head.appendChild(style);
      };
      if (document.head) inject();
      else document.addEventListener('DOMContentLoaded', inject);
    }, DISABLE_ANIMATIONS_CSS);
    await installApiMocks(page, api);
    await use(page);
  },
});

export { expect };

/** Opens the app as a signed-in planner in Planner Mode and waits for the map. */
export async function openPlanner(page: Page) {
  await page.goto('/');
  await expect(page.locator('#planner-panel')).toBeVisible();
  await expect(page.locator('#maplibre-canvas canvas')).toBeVisible();
}

/**
 * Returns the map area that is not covered by the header, editor toolbar, planner panel,
 * or top-right map controls, shrunk by a safety margin.
 */
export async function uncoveredMapRect(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
    const map = rect('#maplibre-canvas')!;
    const panel = rect('#planner-panel');
    const toolbar = rect('#route-editor-toolbar');
    const controls = rect('.maplibregl-ctrl-top-right');
    let { left, right, top, bottom } = map;
    if (panel) {
      if (panel.width >= map.width * 0.9) bottom = Math.min(bottom, panel.top);
      else left = Math.max(left, panel.right);
    }
    if (toolbar) top = Math.max(top, toolbar.bottom);
    if (controls && controls.height > 0) right = Math.min(right, controls.left);
    const margin = 24;
    return {
      x: left + margin,
      y: top + margin,
      width: Math.max(0, right - left - margin * 2),
      height: Math.max(0, bottom - top - margin * 2),
    };
  });
}

/** Page coordinates at a fraction of the uncovered map area. */
export async function mapPoint(page: Page, fx: number, fy: number) {
  const area = await uncoveredMapRect(page);
  return { x: Math.round(area.x + area.width * fx), y: Math.round(area.y + area.height * fy) };
}

/** Taps or clicks a page point, using the input method of the category. */
export async function tapAt(page: Page, isTouch: boolean, point: { x: number; y: number }) {
  if (isTouch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

/** Activates a control with the input method of the category. */
export async function activate(locator: Locator, isTouch: boolean) {
  await locator.scrollIntoViewIfNeeded();
  if (isTouch) await locator.tap();
  else await locator.click();
}

/**
 * Opens a map marker popup and returns the requested popup control. Markers are redrawn when a
 * pending route update lands, which closes an open popup, so opening is retried until it sticks.
 */
export async function openMapPopup(page: Page, marker: Locator, isTouch: boolean, control: string) {
  const target = page.locator(`.maplibregl-popup ${control}`);
  await expect(async () => {
    if (!(await target.isVisible())) await activate(marker, isTouch);
    await expect(target).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(300);
    await expect(target).toBeVisible({ timeout: 100 });
  }).toPass({ timeout: 15_000 });
  return target;
}

export const DEFAULT_ROUTE: [number, number][] = [
  [0.15, 0.25],
  [0.5, 0.65],
  [0.85, 0.3],
];

/** Starts a new route and places waypoints at fractions of the free map area. */
export async function drawRoute(page: Page, isTouch: boolean, fractions: [number, number][] = DEFAULT_ROUTE) {
  const newRoute = page.locator('#btn-new-route');
  if (await newRoute.isVisible()) await activate(newRoute, isTouch);
  await expect(page.locator('#btn-toggle-edit-mode')).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < fractions.length; i++) {
    const marker = page.locator(`#waypoint-marker-${i}`);
    const point = await mapPoint(page, fractions[i][0], fractions[i][1]);
    // Under load MapLibre can swallow a tap (e.g. as part of a double-tap); tap again only if no marker appeared.
    await expect(async () => {
      if ((await marker.count()) === 0) await tapAt(page, isTouch, point);
      await expect(marker).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10_000 });
  }
  await expect(page.locator('#stat-point-count')).toContainText(`${fractions.length}`);
  await expect(page.locator('#btn-save-route')).toBeEnabled();
}
