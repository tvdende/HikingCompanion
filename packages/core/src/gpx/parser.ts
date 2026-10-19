import type { Coordinate, HikeRoute, HikeStage } from '../types/index.js';
import { calculateRouteMetrics } from './metrics.js';

export function parseGpx(xmlContent: string, defaultTitle?: string): HikeRoute {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Ongeldige invoer: GPX data moet een niet-lege string zijn');
  }

  const trimmed = xmlContent.trim();
  if (!trimmed.includes('<gpx') && !trimmed.includes('<GPX')) {
    throw new Error('Ongeldig GPX bestand: root element <gpx> ontbreekt');
  }

  // Extract Route/Track Title
  let title = defaultTitle;
  const nameMatch =
    trimmed.match(/<metadata[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i) ||
    trimmed.match(/<trk[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i) ||
    trimmed.match(/<rte[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);

  if (nameMatch && nameMatch[1]) {
    title = nameMatch[1].trim();
  }

  // Parse track segments: first look for <trkseg>, else fallback to entire <trk> or <rte>
  const segRegex = /<trkseg[^>]*>([\s\S]*?)<\/trkseg>/gi;
  let segMatch = segRegex.exec(trimmed);
  const rawSegments: string[] = [];

  while (segMatch !== null) {
    rawSegments.push(segMatch[1]);
    segMatch = segRegex.exec(trimmed);
  }

  // If no <trkseg> tags found, look for <rte> or whole content
  if (rawSegments.length === 0) {
    const rteRegex = /<rte[^>]*>([\s\S]*?)<\/rte>/gi;
    let rteMatch = rteRegex.exec(trimmed);
    while (rteMatch !== null) {
      rawSegments.push(rteMatch[1]);
      rteMatch = rteRegex.exec(trimmed);
    }
    if (rawSegments.length === 0) {
      rawSegments.push(trimmed);
    }
  }

  const stages: HikeStage[] = [];
  const allCoordinates: Coordinate[] = [];

  const pointRegex = /<(trkpt|rtept)\s+([^>]+)>(?:[\s\S]*?<ele>([\s\S]*?)<\/ele>)?[\s\S]*?<\/\1>/gi;

  for (let sIdx = 0; sIdx < rawSegments.length; sIdx++) {
    const segContent = rawSegments[sIdx];
    const stageCoords: Coordinate[] = [];

    let ptMatch: RegExpExecArray | null;
    const ptParser = new RegExp(pointRegex.source, pointRegex.flags);

    while ((ptMatch = ptParser.exec(segContent)) !== null) {
      const attributes = ptMatch[2];
      const eleString = ptMatch[3];

      // Extract lat and lon
      const latMatch = attributes.match(/lat=["']([^"']+)["']/i);
      const lonMatch = attributes.match(/lon=["']([^"']+)["']/i);

      if (latMatch && lonMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lonMatch[1]);

        if (!isNaN(lat) && !isNaN(lng)) {
          let elevation: number | undefined = undefined;
          if (eleString) {
            const parsedEle = parseFloat(eleString.trim());
            if (!isNaN(parsedEle)) {
              elevation = parsedEle;
            }
          }

          const coord: Coordinate = { lat, lng };
          if (elevation !== undefined) {
            coord.elevation = elevation;
          }

          stageCoords.push(coord);
          allCoordinates.push(coord);
        }
      }
    }

    if (stageCoords.length > 0) {
      const stageMetrics = calculateRouteMetrics(stageCoords);
      stages.push({
        id: crypto.randomUUID(),
        stageNumber: sIdx + 1,
        title: stages.length === 0 ? (title || 'Etappe 1') : `Etappe ${sIdx + 1}`,
        distanceKm: stageMetrics.totalDistanceKm,
        coordinates: stageCoords,
      });
    }
  }

  if (allCoordinates.length === 0) {
    throw new Error('Geen geldige GPS trackpunten (<trkpt> of <rtept>) gevonden in dit GPX bestand');
  }

  const overallMetrics = calculateRouteMetrics(allCoordinates);

  const route: HikeRoute = {
    id: crypto.randomUUID(),
    title: title || 'Geïmporteerde Route',
    totalDistanceKm: overallMetrics.totalDistanceKm,
    stages,
    elevationMetrics: overallMetrics.elevationMetrics,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return route;
}
