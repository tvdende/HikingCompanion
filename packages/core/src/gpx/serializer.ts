import type { HikeRoute } from '../types/index.js';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Serializes a HikeRoute into a compliant GPX 1.1 XML string.
 */
export function serializeToGpx(route: HikeRoute): string {
  const title = escapeXml(route.title || 'Hiking Companion Route');
  const now = new Date().toISOString();

  let trkSegmentsXml = '';

  for (const stage of route.stages) {
    let pointsXml = '';
    for (const coord of stage.coordinates) {
      const eleTag =
        typeof coord.elevation === 'number' && !isNaN(coord.elevation)
          ? `\n        <ele>${coord.elevation.toFixed(1)}</ele>`
          : '';
      pointsXml += `      <trkpt lat="${coord.lat.toFixed(6)}" lon="${coord.lng.toFixed(6)}">${eleTag}\n      </trkpt>\n`;
    }

    trkSegmentsXml += `    <trkseg>\n${pointsXml}    </trkseg>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hiking Companion - https://hikingcompanion.pages.dev" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${title}</name>
    <time>${now}</time>
  </metadata>
  <trk>
    <name>${title}</name>
${trkSegmentsXml}  </trk>
</gpx>
`;
}
