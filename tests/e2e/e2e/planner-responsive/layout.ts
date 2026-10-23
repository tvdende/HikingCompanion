import { expect, type Locator, type Page } from '@playwright/test';

export const MIN_TOUCH_TARGET = 44;
const TOLERANCE = 0.5;

/** Selectors for map elements that are excluded from the touch target size rule. */
const MAP_HANDLE_SELECTORS = ['.editor-waypoint-marker', '.route-split-handle', '.stage-transition-badge', '.maplibregl-marker'];

const INTERACTIVE_SELECTOR = [
  'button',
  'select',
  'textarea',
  'a[href]',
  'input:not([type="hidden"]):not([type="file"])',
  '[role="button"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
].join(', ');

const MODAL_SCOPES = ['[role="dialog"]', '[role="alertdialog"]'];

const DEFAULT_AUDIT_SCOPES = [
  '#app-header',
  '#planner-panel',
  '#route-editor-toolbar',
  '.maplibregl-ctrl-top-right',
  '.maplibregl-popup',
  '#btn-locate-user',
  '.toast-viewport',
];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function viewport(page: Page) {
  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
}

function describe(locator: Locator) {
  return locator.toString().replace(/^locator\(/, '').replace(/\)$/, '');
}

/** The document and the app shell never scroll horizontally, and header content is not clipped. */
export async function expectNoHorizontalScroll(page: Page) {
  const result = await page.evaluate(() => {
    const width = window.innerWidth;
    const offenders: string[] = [];
    const check = (label: string, el: Element | null) => {
      if (!el) return;
      if (el.scrollWidth > el.clientWidth + 1) {
        const edge = el.getBoundingClientRect().left + el.clientWidth;
        const widest = [...el.querySelectorAll('*')]
          .filter((child) => child.getBoundingClientRect().right > edge + 1)
          .pop();
        const culprit = widest ? ` (${widest.tagName.toLowerCase()}${widest.id ? `#${widest.id}` : ''}.${[...widest.classList].slice(0, 3).join('.')})` : '';
        offenders.push(`${label} scrollWidth ${el.scrollWidth} > ${el.clientWidth}${culprit}`);
      }
    };
    if (document.documentElement.scrollWidth > width + 1) {
      offenders.push(`document scrollWidth ${document.documentElement.scrollWidth} > ${width}`);
    }
    check('body', document.body);
    check('#app-root', document.querySelector('#app-root'));
    check('#app-header', document.querySelector('#app-header'));
    check('.main-viewport', document.querySelector('.main-viewport'));
    check('#planner-panel', document.querySelector('#planner-panel'));
    const header = document.querySelector('#app-header');
    header?.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > width + 1 || r.left < -1)) {
        offenders.push(`header element ${el.id || el.className} spans ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    });
    return offenders;
  });
  expect(result, 'page must not overflow horizontally').toEqual([]);
}

/** The element is inside the viewport, after scrolling only its own scroll container. */
export async function expectReachable(locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const vp = await viewport(locator.page());
  expect(box, `${describe(locator)} has a layout box`).not.toBeNull();
  const b = box as Box;
  expect(
    b.x >= -1 && b.y >= -1 && b.x + b.width <= vp.width + 1 && b.y + b.height <= vp.height + 1,
    `${describe(locator)} ${JSON.stringify(b)} must be inside viewport ${vp.width}x${vp.height}`,
  ).toBe(true);
}

/** Nothing covers the center of the element. */
export async function expectNotCovered(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const hit = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const element = el as HTMLElement;
    const previousPointerEvents = element.style.pointerEvents;
    element.style.pointerEvents = 'auto';
    const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    element.style.pointerEvents = previousPointerEvents;
    if (!target) return 'nothing';
    if (el === target || el.contains(target)) return null;
    return `${target.tagName.toLowerCase()}#${target.id}.${String(target.className).split(' ').join('.')}`;
  });
  expect(hit, `${describe(locator)} must not be covered`).toBeNull();
}

/** The element is reachable, uncovered, and (on touch categories) large enough to tap. */
export async function expectUsable(locator: Locator, isTouch: boolean) {
  await expectReachable(locator);
  await expectNotCovered(locator);
  if (isTouch) await expectTouchTarget(locator);
}

export async function expectNoOverlap(a: Locator, b: Locator) {
  const [boxA, boxB] = [await a.boundingBox(), await b.boundingBox()];
  if (!boxA || !boxB) return;
  const overlapX = Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x);
  const overlapY = Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y);
  expect(
    overlapX <= 1 || overlapY <= 1,
    `${describe(a)} ${JSON.stringify(boxA)} overlaps ${describe(b)} ${JSON.stringify(boxB)}`,
  ).toBe(true);
}

export async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, `${describe(locator)} has a layout box`).not.toBeNull();
  const b = box as Box;
  expect(
    b.width >= MIN_TOUCH_TARGET - TOLERANCE && b.height >= MIN_TOUCH_TARGET - TOLERANCE,
    `${describe(locator)} is ${Math.round(b.width)}x${Math.round(b.height)}, needs ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}`,
  ).toBe(true);
}

/**
 * The map area not covered by the header or the planner panel is at least `minRatio` of the
 * viewport height. A side panel leaves the full map height, but must leave enough width too.
 */
export async function expectMapArea(page: Page, minRatio = 0.4) {
  const area = await page.evaluate(() => {
    const map = document.querySelector('#maplibre-canvas')!.getBoundingClientRect();
    const header = document.querySelector('#app-header')!.getBoundingClientRect();
    const panel = document.querySelector('#planner-panel')?.getBoundingClientRect();
    const top = Math.max(map.top, header.bottom);
    let bottom = map.bottom;
    let width = map.width;
    if (panel) {
      if (panel.width >= map.width * 0.9) bottom = Math.min(bottom, panel.top);
      else width = map.right - Math.max(map.left, panel.right);
    }
    return {
      heightRatio: (bottom - top) / window.innerHeight,
      widthRatio: width / window.innerWidth,
    };
  });
  expect(area.heightRatio, `uncovered map height ratio ${area.heightRatio.toFixed(2)}`).toBeGreaterThanOrEqual(minRatio);
  expect(area.widthRatio, `uncovered map width ratio ${area.widthRatio.toFixed(2)}`).toBeGreaterThanOrEqual(minRatio);
}

/** The dialog fits in the viewport and the given actions are reachable and uncovered. */
export async function expectDialogFits(dialog: Locator, actions: Locator[], isTouch: boolean) {
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox()) as Box;
  const vp = await viewport(dialog.page());
  expect(
    box.x >= -1 && box.y >= -1 && box.x + box.width <= vp.width + 1 && box.y + box.height <= vp.height + 1,
    `${describe(dialog)} ${JSON.stringify(box)} must fit viewport ${vp.width}x${vp.height}`,
  ).toBe(true);
  for (const action of actions) await expectUsable(action, isTouch);
}

/**
 * Checks every visible interactive control inside the planner surfaces: it must be reachable by
 * scrolling only real scroll containers, uncovered at its center, and on touch categories at
 * least 44x44 CSS pixels. Map markers and route handles are excluded from the size rule.
 */
export async function auditVisibleControls(page: Page, isTouch: boolean, scopes: string[] = DEFAULT_AUDIT_SCOPES) {
  const failures = await page.evaluate(
    ({ scopes, modalScopes, selector, handles, minSize, tolerance, isTouch }) => {
      const problems: string[] = [];
      const seen = new Set<Element>();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const openModals = modalScopes
        .flatMap((s) => [...document.querySelectorAll(s)])
        .filter((el) => el.getBoundingClientRect().width > 0);
      // With stacked dialogs only the topmost one (the one that receives clicks) must be usable.
      const topModal =
        openModals.filter((el) => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!hit && el.contains(hit);
        }).pop() ?? openModals.pop();
      const profileMenu = document.querySelector('#user-profile-dropdown');
      const hasOpenMenu = !!profileMenu && profileMenu.getBoundingClientRect().width > 0;
      // An open popover menu may cover the map; only the menu and the header must stay usable then.
      const activeRoots: Element[] = topModal
        ? [topModal, ...document.querySelectorAll('.toast-viewport')]
        : (hasOpenMenu ? ['#app-header', '#user-profile-dropdown', '.toast-viewport'] : scopes).flatMap((s) => [
            ...document.querySelectorAll(s),
          ]);
      const label = (el: Element) => {
        const aria = el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim().slice(0, 30);
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.classList.length ? `.${[...el.classList].slice(0, 2).join('.')}` : ''} "${aria}"`;
      };
      const isScrollable = (el: Element) => {
        const style = getComputedStyle(el);
        return /(auto|scroll)/.test(style.overflowX + style.overflowY);
      };
      const resetLockedScroll = (el: Element) => {
        const moved: string[] = [];
        for (let node: Element | null = el.parentElement; node; node = node.parentElement) {
          if ((node.scrollTop !== 0 || node.scrollLeft !== 0) && !isScrollable(node)) {
            moved.push(label(node));
            node.scrollTop = 0;
            node.scrollLeft = 0;
          }
        }
        return moved;
      };

      for (const root of activeRoots) {
        const candidates = [root, ...root.querySelectorAll(selector)].filter((el) => el.matches(selector));
        for (const el of candidates) {
          if (seen.has(el)) continue;
          seen.add(el);
          const rect0 = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect0.width === 0 || rect0.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
          if (el.closest('[aria-hidden="true"]')) continue;

          el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const locked = resetLockedScroll(el);
          if (locked.length) {
            problems.push(`${label(el)} is only reachable by scrolling a non-scrollable container (${locked.join(', ')})`);
            continue;
          }
          const r = el.getBoundingClientRect();
          if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) {
            problems.push(`${label(el)} is outside the viewport at ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
            continue;
          }
          // Disabled controls use pointer-events: none; hit-test them as if they were enabled.
          const previousPointerEvents = (el as HTMLElement).style.pointerEvents;
          (el as HTMLElement).style.pointerEvents = 'auto';
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          (el as HTMLElement).style.pointerEvents = previousPointerEvents;
          if (!hit || !(el === hit || el.contains(hit))) {
            // An open map popup is a transient overlay; it may cover other controls until it closes.
            const coveredByPopup = !!hit?.closest('.maplibregl-popup') && !el.closest('.maplibregl-popup');
            if (!coveredByPopup) problems.push(`${label(el)} is covered by ${hit ? label(hit) : 'nothing'}`);
          }
          const isHandle = handles.some((h) => el.closest(h));
          if (isTouch && !isHandle && (r.width < minSize - tolerance || r.height < minSize - tolerance)) {
            problems.push(`${label(el)} is ${Math.round(r.width)}x${Math.round(r.height)}, needs ${minSize}x${minSize}`);
          }
        }
      }
      return problems;
    },
    {
      scopes,
      modalScopes: MODAL_SCOPES,
      selector: INTERACTIVE_SELECTOR,
      handles: MAP_HANDLE_SELECTORS,
      minSize: MIN_TOUCH_TARGET,
      tolerance: TOLERANCE,
      isTouch,
    },
  );
  expect(failures, 'all visible planner controls must be reachable, uncovered and touch-sized').toEqual([]);
}

/** Combined check for a planner state: no horizontal overflow and every visible control usable. */
export async function expectPlannerLayout(page: Page, isTouch: boolean) {
  await expectNoHorizontalScroll(page);
  await auditVisibleControls(page, isTouch);
}
