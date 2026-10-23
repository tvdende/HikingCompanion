import type { SurfaceAnalysisSource, SurfaceAnalysisStatus, SurfaceBreakdown, SurfaceSegment } from '../types/index.js';

export function calculateSurfaceBreakdown(
  segments: SurfaceSegment[],
  source: SurfaceAnalysisSource = 'brouter',
  status: SurfaceAnalysisStatus = 'complete'
): SurfaceBreakdown {
  const totalMeters = segments.reduce((total, segment) => total + segment.distanceMeters, 0);
  if (totalMeters <= 0) throw new Error('Surface analysis requires non-zero geometry');

  const meters = { unpaved: 0, gravel: 0, paved: 0, unknown: 0 };
  for (const segment of segments) meters[segment.category] += segment.distanceMeters;
  const percentages = Object.fromEntries(
    Object.entries(meters).map(([category, distance]) => [category, Math.round((distance / totalMeters) * 100)])
  ) as Record<keyof typeof meters, number>;
  const largest = (Object.keys(meters) as Array<keyof typeof meters>).reduce((current, category) =>
    meters[category] > meters[current] ? category : current
  );
  percentages[largest] += 100 - Object.values(percentages).reduce((total, value) => total + value, 0);

  return {
    unpavedMeters: meters.unpaved,
    gravelMeters: meters.gravel,
    pavedMeters: meters.paved,
    unknownMeters: meters.unknown,
    totalMeters,
    unpavedPercentage: percentages.unpaved,
    gravelPercentage: percentages.gravel,
    pavedPercentage: percentages.paved,
    unknownPercentage: percentages.unknown,
    segments,
    source,
    status,
  };
}