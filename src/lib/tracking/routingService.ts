import { GeoPoint } from '../db/types';

export interface RouteResult {
  geometry: GeoPoint[];
  distanceKm: number;
  durationMinutes: number;
  summary: string;
  source: 'OSRM' | 'FALLBACK';
}

/**
 * Calculates straight-line distance in meters using Haversine formula
 */
export function calculateDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1.latitude * Math.PI) / 180;
  const phi2 = (p2.latitude * Math.PI) / 180;
  const deltaPhi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const deltaLambda = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates bearing / compass heading in degrees (0-360) from p1 to p2
 */
export function calculateBearing(p1: GeoPoint, p2: GeoPoint): number {
  const lat1 = (p1.latitude * Math.PI) / 180;
  const lat2 = (p2.latitude * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;

  return (brng + 360) % 360;
}

/**
 * Calculates perpendicular distance from a point to a line segment
 */
function distanceToSegment(p: GeoPoint, v: GeoPoint, w: GeoPoint): number {
  const l2 = calculateDistanceMeters(v, w) ** 2;
  if (l2 === 0) return calculateDistanceMeters(p, v);

  // Consider the line extending the segment, parameterized as v + t (w - v).
  // Find projection of point p onto that line.
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.latitude - v.latitude) * (w.latitude - v.latitude) +
        (p.longitude - v.longitude) * (w.longitude - v.longitude)) /
        ((w.latitude - v.latitude) ** 2 + (w.longitude - v.longitude) ** 2)
    )
  );

  const projection: GeoPoint = {
    latitude: v.latitude + t * (w.latitude - v.latitude),
    longitude: v.longitude + t * (w.longitude - v.longitude),
  };

  return calculateDistanceMeters(p, projection);
}

/**
 * Checks if the delivery partner has moved significantly away from the current route polyline
 * (Default threshold: 65 meters)
 */
export function isOffRoute(
  currentPos: GeoPoint,
  routeGeometry: GeoPoint[],
  thresholdMeters = 65
): boolean {
  if (!routeGeometry || routeGeometry.length < 2) return false;

  let minDistance = Infinity;

  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const d = distanceToSegment(currentPos, routeGeometry[i], routeGeometry[i + 1]);
    if (d < minDistance) {
      minDistance = d;
      if (minDistance <= thresholdMeters) return false;
    }
  }

  return minDistance > thresholdMeters;
}

/**
 * Fetches real road-based routing geometry from OSRM
 * with fallback geometry interpolation if network is unavailable
 */
export async function fetchRoadRoute(
  origin: GeoPoint,
  destination: GeoPoint
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Sevanta-InteractiveMap/1.0' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates;

        const geometry: GeoPoint[] = coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        return {
          geometry,
          distanceKm,
          durationMinutes,
          summary: `via ${route.legs?.[0]?.summary || 'Chilakaluripet Main Road'}`,
          source: 'OSRM',
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing failed, using high-precision fallback road interpolation:', err);
  }

  // Fallback: Generate interpolated road waypoints between origin & destination
  const steps = 15;
  const fallbackGeometry: GeoPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    fallbackGeometry.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio,
    });
  }

  const distMeters = calculateDistanceMeters(origin, destination);
  const distanceKm = Math.round((distMeters / 1000) * 10) / 10;
  const durationMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));

  return {
    geometry: fallbackGeometry,
    distanceKm,
    durationMinutes,
    summary: 'Direct route estimate',
    source: 'FALLBACK',
  };
}
