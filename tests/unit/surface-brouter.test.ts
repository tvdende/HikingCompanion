import { describe, expect, it } from 'vitest';
import { parseBRouterMessages } from '@hiking-companion/core';
import messages from './fixtures/brouter-messages.json';

describe('parseBRouterMessages', () => {
  it('parses the documented BRouter WayTags column into categorized spans', () => {
    const segments = parseBRouterMessages(messages, [
      { lng: 5.121444, lat: 52.090681 },
      { lng: 5.121557, lat: 52.090705 },
    ], 'stage-1');
    expect(segments).toHaveLength(1);
    expect(segments[0].category).toBe('unpaved');
  });

  it('covers a route without BRouter messages as unknown surface', () => {
    const coordinates = [
      { lng: 5.121444, lat: 52.090681 },
      { lng: 5.121557, lat: 52.090705 },
    ];

    const segments = parseBRouterMessages([], coordinates, 'stage-1');

    expect(segments).toEqual([
      expect.objectContaining({ category: 'unknown', coordinates }),
    ]);
  });

  it('matches BRouter points within two meters and leaves uncovered tails visible', () => {
    const coordinates = [
      { lng: 5.121444, lat: 52.090681 },
      { lng: 5.121557, lat: 52.090705 },
      { lng: 5.121670, lat: 52.090730 },
    ];
    const segments = parseBRouterMessages([
      ['Longitude', 'Latitude', 'WayTags'],
      ['5121561', '52090708', 'highway=footway surface=ground'],
    ], coordinates, 'stage-1');

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual(expect.objectContaining({
      category: 'unpaved',
      coordinates: [coordinates[0], coordinates[1]],
    }));
    expect(segments[1]).toEqual(expect.objectContaining({
      category: 'unknown',
      coordinates: [coordinates[1], coordinates[2]],
    }));
  });
});