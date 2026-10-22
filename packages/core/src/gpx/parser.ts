import type { Coordinate, HikeRoute, HikeStage } from '../types/index.js';
import { calculateRouteMetrics } from './metrics.js';

export interface ParseGpxOptions {
  mergeSegments?: boolean; // When true, all track segments are merged into 1 stage
}

export interface GpxStructureInfo {
  trackCount: number;
  segmentCount: number;
  trackNames: string[];
  hasMultipleStages: boolean;
}

/**
 * Inspects a GPX XML string to detect how many tracks and segments it contains.
 * Useful for deciding whether to prompt the user for multi-stage import.
 */
export function detectGpxTracks(xmlContent: string): GpxStructureInfo {
  if (!xmlContent || typeof xmlContent !== 'string') {
    return { trackCount: 0, segmentCount: 0, trackNames: [], hasMultipleStages: false };
  }

  const trkMatches = xmlContent.match(/<trk[\s>]/gi) || [];
  const segMatches = xmlContent.match(/<trkseg[\s>]/gi) || [];

  const trackNames: string[] = [];
  const trkNameRegex = /<trk[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/gi;
  let match: RegExpExecArray | null;
  while ((match = trkNameRegex.exec(xmlContent)) !== null) {
    if (match[1]?.trim()) {
      trackNames.push(match[1].trim());
    }
  }

  const trackCount = trkMatches.length;
  const segmentCount = segMatches.length;
  const hasMultipleStages = trackCount > 1 || segmentCount > 1;

  return {
    trackCount,
    segmentCount,
    trackNames,
    hasMultipleStages,
  };
}

function parseCoordinatesFromXmlBlock(xmlBlock: string): Coordinate[] {
  const coords: Coordinate[] = [];
  const pointRegex = /<(trkpt|rtept)\s+([^>]+)>(?:[\s\S]*?<ele>([\s\S]*?)<\/ele>)?[\s\S]*?<\/\1>/gi;
  let ptMatch: RegExpExecArray | null;

  while ((ptMatch = pointRegex.exec(xmlBlock)) !== null) {
    const attributes = ptMatch[2];
    const eleString = ptMatch[3];

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
        coords.push(coord);
      }
    }
  }

  return coords;
}

export function parseGpx(
  xmlContent: string,
  defaultTitle?: string,
  options: ParseGpxOptions = {}
): HikeRoute {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Ongeldige invoer: GPX data moet een niet-lege string zijn');
  }

  const trimmed = xmlContent.trim();
  if (!trimmed.includes('<gpx') && !trimmed.includes('<GPX')) {
    throw new Error('Ongeldig GPX bestand: root element <gpx> ontbreekt');
  }

  // Check how many <trk> elements exist
  const trkRegex = /<trk[^>]*>([\s\S]*?)<\/trk>/gi;
  const rawTracks: string[] = [];
  let trkMatch: RegExpExecArray | null;
  while ((trkMatch = trkRegex.exec(trimmed)) !== null) {
    rawTracks.push(trkMatch[1]);
  }

  // Extract Route/Track Title:
  // 1. <metadata><name> takes highest precedence.
  // 2. If single track/route: the track/route name takes precedence over fallback defaultTitle.
  // 3. If multi-track and mergeSegments is true: defaultTitle is preferred as overall route name.
  let title = defaultTitle;
  const metaMatch = trimmed.match(/<metadata[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);
  if (metaMatch && metaMatch[1]?.trim()) {
    title = metaMatch[1].trim();
  } else if (rawTracks.length <= 1) {
    const nameMatch =
      trimmed.match(/<trk[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i) ||
      trimmed.match(/<rte[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);
    if (nameMatch && nameMatch[1]?.trim()) {
      title = nameMatch[1].trim();
    }
  } else if (!title) {
    const nameMatch =
      trimmed.match(/<trk[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i) ||
      trimmed.match(/<rte[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);
    if (nameMatch && nameMatch[1]?.trim()) {
      title = nameMatch[1].trim();
    }
  }

  const stages: HikeStage[] = [];
  const allCoordinates: Coordinate[] = [];

  if (rawTracks.length > 1 && !options.mergeSegments) {
    // Each <trk> represents a separate stage
    rawTracks.forEach((trkBlock, tIdx) => {
      let stageTitle = `Etappe ${tIdx + 1}`;
      const tNameMatch = trkBlock.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
      if (tNameMatch && tNameMatch[1]?.trim()) {
        stageTitle = tNameMatch[1].trim();
      }

      let stageNotes: string | undefined = undefined;
      const tDescMatch =
        trkBlock.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i) ||
        trkBlock.match(/<cmt[^>]*>([\s\S]*?)<\/cmt>/i);
      if (tDescMatch && tDescMatch[1]?.trim()) {
        stageNotes = tDescMatch[1].trim();
      }

      const coords = parseCoordinatesFromXmlBlock(trkBlock);
      if (coords.length > 0) {
        const metrics = calculateRouteMetrics(coords);
        stages.push({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `stage-${tIdx + 1}-${Date.now()}`,
          stageNumber: tIdx + 1,
          title: stageTitle,
          notes: stageNotes,
          distanceKm: metrics.totalDistanceKm,
          coordinates: coords,
          elevationGainMeters: metrics.elevationMetrics?.elevationGainMeters,
          elevationLossMeters: metrics.elevationMetrics?.elevationLossMeters,
        });
        allCoordinates.push(...coords);
      }
    });
  } else {
    // Look for <trkseg> elements
    const segRegex = /<trkseg[^>]*>([\s\S]*?)<\/trkseg>/gi;
    let segMatch: RegExpExecArray | null;
    const rawSegments: string[] = [];

    while ((segMatch = segRegex.exec(trimmed)) !== null) {
      rawSegments.push(segMatch[1]);
    }

    if (rawSegments.length === 0) {
      const rteRegex = /<rte[^>]*>([\s\S]*?)<\/rte>/gi;
      let rteMatch: RegExpExecArray | null;
      while ((rteMatch = rteRegex.exec(trimmed)) !== null) {
        rawSegments.push(rteMatch[1]);
      }
      if (rawSegments.length === 0) {
        rawSegments.push(trimmed);
      }
    }

    if (options.mergeSegments) {
      // Merge all segments into a single stage
      const mergedCoords: Coordinate[] = [];
      for (const segContent of rawSegments) {
        const coords = parseCoordinatesFromXmlBlock(segContent);
        mergedCoords.push(...coords);
      }
      if (mergedCoords.length > 0) {
        const metrics = calculateRouteMetrics(mergedCoords);
        stages.push({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `stage-1-${Date.now()}`,
          stageNumber: 1,
          title: title || 'Etappe 1',
          distanceKm: metrics.totalDistanceKm,
          coordinates: mergedCoords,
          elevationGainMeters: metrics.elevationMetrics?.elevationGainMeters,
          elevationLossMeters: metrics.elevationMetrics?.elevationLossMeters,
        });
        allCoordinates.push(...mergedCoords);
      }
    } else {
      // Each segment is its own stage
      for (let sIdx = 0; sIdx < rawSegments.length; sIdx++) {
        const segContent = rawSegments[sIdx];
        const stageCoords = parseCoordinatesFromXmlBlock(segContent);

        if (stageCoords.length > 0) {
          const stageMetrics = calculateRouteMetrics(stageCoords);
          stages.push({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `stage-${sIdx + 1}-${Date.now()}`,
            stageNumber: sIdx + 1,
            title: stages.length === 0 ? (title || 'Etappe 1') : `Etappe ${sIdx + 1}`,
            distanceKm: stageMetrics.totalDistanceKm,
            coordinates: stageCoords,
            elevationGainMeters: stageMetrics.elevationMetrics?.elevationGainMeters,
            elevationLossMeters: stageMetrics.elevationMetrics?.elevationLossMeters,
          });
          allCoordinates.push(...stageCoords);
        }
      }
    }
  }

  if (allCoordinates.length === 0) {
    throw new Error('Geen geldige GPS trackpunten (<trkpt> of <rtept>) gevonden in dit GPX bestand');
  }

  const overallMetrics = calculateRouteMetrics(allCoordinates);

  const route: HikeRoute = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `route-${Date.now()}`,
    title: title || 'Geïmporteerde Route',
    totalDistanceKm: overallMetrics.totalDistanceKm,
    stages,
    elevationMetrics: overallMetrics.elevationMetrics,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return route;
}
