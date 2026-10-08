import { GeoPoint, VehicleType } from '../db/types';

export interface MarkerConfig {
  title: string;
  subtitle?: string;
  iconType: 'CUSTOMER' | 'PICKUP' | 'PARTNER';
  vehicleType?: VehicleType;
  heading?: number;
  speedKmh?: number;
}

export interface RouteRenderOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  showTraffic?: boolean;
}

export interface IMapProvider {
  initialize(container: HTMLElement, center: GeoPoint, zoom: number): Promise<void>;
  setCenter(point: GeoPoint, zoom?: number): void;
  panTo(point: GeoPoint): void;
  fitBounds(points: GeoPoint[], padding?: number): void;
  drawRoute(geometry: GeoPoint[], options?: RouteRenderOptions): void;
  updatePartnerMarker(
    point: GeoPoint,
    heading: number,
    speedKmh: number,
    vehicleType?: VehicleType,
    animate?: boolean
  ): void;
  setCustomerMarker(point: GeoPoint, title: string, address: string): void;
  setPickupMarker(point: GeoPoint, title: string, address: string): void;
  setTrafficVisible(visible: boolean): void;
  onUserPan(callback: () => void): void;
  destroy(): void;
}

/**
 * Spherical linear interpolation between two coordinates
 */
export function interpolatePoint(p1: GeoPoint, p2: GeoPoint, fraction: number): GeoPoint {
  return {
    latitude: p1.latitude + (p2.latitude - p1.latitude) * fraction,
    longitude: p1.longitude + (p2.longitude - p1.longitude) * fraction,
  };
}

/**
 * Normalizes degree difference for smooth angular rotation without 360-degree spins
 */
export function interpolateAngle(a1: number, a2: number, fraction: number): number {
  let diff = (a2 - a1) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a1 + diff * fraction;
}
