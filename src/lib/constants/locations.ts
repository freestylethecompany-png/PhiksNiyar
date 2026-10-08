// Location Architecture: Country -> State -> District -> City -> Area -> Coordinates
import { City, ServiceArea } from '../db/types';

export const INITIAL_CITIES: City[] = [
  {
    id: 'city-cpt',
    name: 'Chilakaluripet',
    state: 'Andhra Pradesh',
    district: 'Palnadu',
    country: 'India',
    isActive: true,
    latitude: 16.0892,
    longitude: 80.1672,
  },
  {
    id: 'city-gnt',
    name: 'Guntur',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    country: 'India',
    isActive: false, // Ready for expansion
    latitude: 16.3067,
    longitude: 80.4365,
  },
  {
    id: 'city-vja',
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    district: 'NTR',
    country: 'India',
    isActive: false, // Ready for expansion
    latitude: 16.5062,
    longitude: 80.6480,
  },
];

export const CHILAKALURIPET_AREAS: ServiceArea[] = [
  {
    id: 'area-1',
    cityId: 'city-cpt',
    name: 'Kalamandir Center',
    pincode: '522616',
    latitude: 16.0885,
    longitude: 80.1660,
    radiusKm: 6,
  },
  {
    id: 'area-2',
    cityId: 'city-cpt',
    name: 'Pandaripuram',
    pincode: '522616',
    latitude: 16.0910,
    longitude: 80.1695,
    radiusKm: 6,
  },
  {
    id: 'area-3',
    cityId: 'city-cpt',
    name: 'Ganapavaram Road',
    pincode: '522616',
    latitude: 16.0820,
    longitude: 80.1550,
    radiusKm: 8,
  },
  {
    id: 'area-4',
    cityId: 'city-cpt',
    name: 'Clock Tower Center (Ganta Sthambham)',
    pincode: '522616',
    latitude: 16.0898,
    longitude: 80.1678,
    radiusKm: 6,
  },
  {
    id: 'area-5',
    cityId: 'city-cpt',
    name: 'Subhash Nagar',
    pincode: '522616',
    latitude: 16.0950,
    longitude: 80.1620,
    radiusKm: 6,
  },
  {
    id: 'area-6',
    cityId: 'city-cpt',
    name: 'Purushothapatnam',
    pincode: '522616',
    latitude: 16.1050,
    longitude: 80.1740,
    radiusKm: 8,
  },
  {
    id: 'area-7',
    cityId: 'city-cpt',
    name: 'Ramireddy Peta',
    pincode: '522616',
    latitude: 16.0855,
    longitude: 80.1710,
    radiusKm: 6,
  },
  {
    id: 'area-8',
    cityId: 'city-cpt',
    name: 'Pasumarru Road & Bypass',
    pincode: '522616',
    latitude: 16.0790,
    longitude: 80.1800,
    radiusKm: 10,
  },
];

/**
 * Calculates straight line distance in Kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}
