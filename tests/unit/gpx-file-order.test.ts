import { describe, it, expect } from 'vitest';
import { sortFilesNaturally, suggestFileOrder, type OrderableGpxFile } from '../../apps/web/src/utils/gpxFileOrder';

const names = (files: OrderableGpxFile[]) => files.map((f) => f.name);
const at = (lat: number, lng: number) => ({ lat, lng });

describe('sortFilesNaturally', () => {
  it('compares numeric parts by value', () => {
    const files = [{ name: 'etappe-10.gpx' }, { name: 'etappe-2.gpx' }, { name: 'etappe-1.gpx' }];
    expect(names(sortFilesNaturally(files))).toEqual(['etappe-1.gpx', 'etappe-2.gpx', 'etappe-10.gpx']);
  });

  it('ignores case', () => {
    const files = [{ name: 'Etappe-B.gpx' }, { name: 'etappe-a.gpx' }, { name: 'ETAPPE-C.gpx' }];
    expect(names(sortFilesNaturally(files))).toEqual(['etappe-a.gpx', 'Etappe-B.gpx', 'ETAPPE-C.gpx']);
  });

  it('keeps equal names in their original order and does not mutate the input', () => {
    const first = { name: 'dag.gpx', id: 1 };
    const second = { name: 'DAG.gpx', id: 2 };
    const files = [first, second, { name: 'a.gpx', id: 3 }];
    const sorted = sortFilesNaturally(files);
    expect(sorted.map((f) => f.id)).toEqual([3, 1, 2]);
    expect(files.map((f) => f.id)).toEqual([1, 2, 3]);
  });
});

describe('suggestFileOrder', () => {
  const a = { name: 'A', start: at(52.1, 5.1), end: at(52.2, 5.2) };
  const b = { name: 'B', start: at(52.0, 5.0), end: at(52.1, 5.1) };
  const c = { name: 'C', start: at(52.2, 5.2), end: at(52.3, 5.3) };

  it('chains files whose endpoints connect as B → A → C', () => {
    expect(names(suggestFileOrder([a, b, c]))).toEqual(['B', 'A', 'C']);
    expect(names(suggestFileOrder([c, a, b]))).toEqual(['B', 'A', 'C']);
  });

  it('keeps the current relative order on ties', () => {
    const p = at(52, 5);
    const loops = [
      { name: 'x', start: p, end: p },
      { name: 'y', start: p, end: p },
      { name: 'z', start: p, end: p },
    ];
    expect(names(suggestFileOrder(loops))).toEqual(['x', 'y', 'z']);
  });

  it('places files without coordinates last in their relative order', () => {
    const broken1 = { name: 'broken-1' };
    const broken2 = { name: 'broken-2' };
    expect(names(suggestFileOrder([broken1, a, broken2, b, c]))).toEqual(['B', 'A', 'C', 'broken-1', 'broken-2']);
  });

  it('handles fewer than two located files', () => {
    expect(names(suggestFileOrder([{ name: 'n' }, a]))).toEqual(['A', 'n']);
    expect(suggestFileOrder([])).toEqual([]);
  });
});
