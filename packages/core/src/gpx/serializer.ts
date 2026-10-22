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
 * Preserves multi-stage boundaries, stage titles, notes, and transport modes.
 */
export function serializeToGpx(route: HikeRoute): string {
  const routeTitle = escapeXml(route.title || 'Hiking Companion Route');
  const now = new Date().toISOString();

  let trkXml = '';

  if (route.stages.length > 1) {
    for (const stage of route.stages) {
      const stageTitle = escapeXml(stage.title || `Etappe ${stage.stageNumber}`);
      const descTag = stage.notes ? `\n    <desc>${escapeXml(stage.notes)}</desc>` : '';
      const typeTag = stage.transportType ? `\n    <type>${escapeXml(stage.transportType)}</type>` : '';

      let pointsXml = '';
      for (const coord of stage.coordinates) {
        const eleTag =
          typeof coord.elevation === 'number' && !isNaN(coord.elevation)
            ? `\n        <ele>${coord.elevation.toFixed(1)}</ele>`
            : '';
        pointsXml += `      <trkpt lat="${coord.lat.toFixed(6)}" lon="${coord.lng.toFixed(6)}">${eleTag}\n      </trkpt>\n`;
      }

      trkXml += `  <trk>\n    <name>${stageTitle}</name>${descTag}${typeTag}\n    <trkseg>\n${pointsXml}    </trkseg>\n  </trk>\n`;
    }
  } else {
    const singleStage = route.stages[0];
    const stageTitle = singleStage?.title ? escapeXml(singleStage.title) : routeTitle;
    const descTag = singleStage?.notes ? `\n    <desc>${escapeXml(singleStage.notes)}</desc>` : '';
    const typeTag = singleStage?.transportType ? `\n    <type>${escapeXml(singleStage.transportType)}</type>` : '';

    let pointsXml = '';
    const coords = singleStage?.coordinates || [];
    for (const coord of coords) {
      const eleTag =
        typeof coord.elevation === 'number' && !isNaN(coord.elevation)
          ? `\n        <ele>${coord.elevation.toFixed(1)}</ele>`
          : '';
      pointsXml += `      <trkpt lat="${coord.lat.toFixed(6)}" lon="${coord.lng.toFixed(6)}">${eleTag}\n      </trkpt>\n`;
    }

    trkXml = `  <trk>\n    <name>${stageTitle}</name>${descTag}${typeTag}\n    <trkseg>\n${pointsXml}    </trkseg>\n  </trk>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hiking Companion - https://hikingcompanion.pages.dev" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${routeTitle}</name>
    <time>${now}</time>
  </metadata>
${trkXml}</gpx>
`;
}
