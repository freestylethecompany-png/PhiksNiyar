'use client';

import { GeoPoint, VehicleType } from '../db/types';
import { IMapProvider, RouteRenderOptions, interpolatePoint, interpolateAngle } from './modularMap';

export class LeafletMapProvider implements IMapProvider {
  private map: any = null;
  private L: any = null;
  private routeLine: any = null;
  private routeGlowLine: any = null;
  private trafficSegments: any[] = [];
  private partnerMarker: any = null;
  private customerMarker: any = null;
  private pickupMarker: any = null;
  private isUserInteracting = false;
  private userPanCallback: (() => void) | null = null;

  // Animation state
  private animationFrameId: number | null = null;
  private currentPartnerPos: GeoPoint | null = null;
  private currentPartnerHeading = 0;

  async initialize(container: HTMLElement, center: GeoPoint, zoom: number): Promise<void> {
    if (typeof window === 'undefined') return;

    // Dynamically load Leaflet
    const L = (await import('leaflet')).default;
    this.L = L;

    // Ensure Leaflet CSS is in DOM
    if (!document.getElementById('leaflet-css-bundle')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-bundle';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Guard against React StrictMode re-mounts / double initialization
    if (this.map) {
      this.destroy();
    }
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
      container.innerHTML = '';
    }

    // Initialize Map with custom options
    this.map = L.map(container, {
      center: [center.latitude, center.longitude],
      zoom,
      zoomControl: false, // We render our own clean modern controls
      attributionControl: false,
    });

    // Add crisp OpenStreetMap tiles (standard road & landmark tiles, zero API key required)
    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(this.map);

    // Detect user manual interaction (drag, pan, zoom)
    this.map.on('dragstart', () => {
      this.isUserInteracting = true;
      if (this.userPanCallback) this.userPanCallback();
    });

    this.map.on('zoomstart', () => {
      if (this.userPanCallback) this.userPanCallback();
    });
  }

  setCenter(point: GeoPoint, zoom?: number): void {
    if (!this.map) return;
    this.map.setView([point.latitude, point.longitude], zoom || this.map.getZoom());
  }

  panTo(point: GeoPoint): void {
    if (!this.map) return;
    this.map.panTo([point.latitude, point.longitude], {
      animate: true,
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }

  fitBounds(points: GeoPoint[], padding = 45): void {
    if (!this.map || !this.L || points.length === 0) return;
    const latLngs = points.map((p) => [p.latitude, p.longitude]);
    const bounds = this.L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 17 });
  }

  onUserPan(callback: () => void): void {
    this.userPanCallback = callback;
  }

  /**
   * Draws dual-line road polyline with smooth casing and traffic congestion coloring
   */
  drawRoute(geometry: GeoPoint[], options: RouteRenderOptions = {}): void {
    if (!this.map || !this.L || !geometry || geometry.length < 2) return;

    // Remove existing route lines
    if (this.routeGlowLine) this.map.removeLayer(this.routeGlowLine);
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    this.clearTrafficSegments();

    const latLngs = geometry.map((p) => [p.latitude, p.longitude]);

    // Outer glow casing
    this.routeGlowLine = this.L.polyline(latLngs, {
      color: '#0f172a',
      weight: (options.weight || 5) + 4,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    // Main vibrant road line
    const routeColor = options.color || '#00a651'; // Emerald brand color
    this.routeLine = this.L.polyline(latLngs, {
      color: routeColor,
      weight: options.weight || 5,
      opacity: options.opacity || 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    // If traffic overlay is enabled, color-code segments
    if (options.showTraffic) {
      this.renderTrafficSegments(geometry);
    }
  }

  private clearTrafficSegments(): void {
    if (this.trafficSegments.length > 0) {
      this.trafficSegments.forEach((seg) => this.map.removeLayer(seg));
      this.trafficSegments = [];
    }
  }

  private renderTrafficSegments(geometry: GeoPoint[]): void {
    if (!this.map || !this.L || geometry.length < 4) return;

    // Simulate traffic conditions: Free flow (green), moderate (amber), heavy (red)
    const count = geometry.length;
    for (let i = 0; i < count - 1; i++) {
      const segRatio = i / count;
      let segColor = '#22c55e'; // Green
      if (segRatio > 0.45 && segRatio < 0.7) {
        segColor = '#f59e0b'; // Amber (Moderate near market)
      } else if (segRatio >= 0.7 && segRatio < 0.85) {
        segColor = '#ef4444'; // Red (Heavy near junction)
      }

      const segLine = this.L.polyline(
        [
          [geometry[i].latitude, geometry[i].longitude],
          [geometry[i + 1].latitude, geometry[i + 1].longitude],
        ],
        {
          color: segColor,
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
        }
      ).addTo(this.map);

      this.trafficSegments.push(segLine);
    }
  }

  setTrafficVisible(visible: boolean): void {
    if (visible && this.routeLine) {
      const coords = this.routeLine.getLatLngs().map((ll: any) => ({
        latitude: ll.lat,
        longitude: ll.lng,
      }));
      this.renderTrafficSegments(coords);
    } else {
      this.clearTrafficSegments();
    }
  }

  /**
   * Sets customer destination marker with pulsing halo
   */
  setCustomerMarker(point: GeoPoint, title: string, address: string): void {
    if (!this.map || !this.L) return;

    if (this.customerMarker) this.map.removeLayer(this.customerMarker);

    const html = `
      <div class="customer-marker-container" style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(11, 59, 149, 0.2); animation: pulse-radar 2s infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #0b3b95; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(11, 59, 149, 0.4); border: 2.5px solid #ffffff; z-index: 2;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>
    `;

    const icon = this.L.divIcon({
      html,
      className: 'custom-customer-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    this.customerMarker = this.L.marker([point.latitude, point.longitude], { icon })
      .bindPopup(`<strong>${title}</strong><br><span style="font-size:12px;color:#64748b;">${address}</span>`)
      .addTo(this.map);
  }

  /**
   * Sets pickup location marker (Store / Spares Hub)
   */
  setPickupMarker(point: GeoPoint, title: string, address: string): void {
    if (!this.map || !this.L) return;

    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);

    const html = `
      <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4); border: 2.5px solid #ffffff;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
    `;

    const icon = this.L.divIcon({
      html,
      className: 'custom-pickup-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    this.pickupMarker = this.L.marker([point.latitude, point.longitude], { icon })
      .bindPopup(`<strong>${title}</strong><br><span style="font-size:12px;color:#64748b;">${address}</span>`)
      .addTo(this.map);
  }

  /**
   * Smoothly animates the delivery vehicle marker with heading rotation and speed indicator
   */
  updatePartnerMarker(
    targetPoint: GeoPoint,
    targetHeading: number,
    speedKmh: number,
    vehicleType: VehicleType = 'BIKE',
    animate = true
  ): void {
    if (!this.map || !this.L) return;

    // First time marker creation
    if (!this.partnerMarker) {
      this.currentPartnerPos = targetPoint;
      this.currentPartnerHeading = targetHeading;

      const html = this.generateVehicleHtml(targetHeading, speedKmh, vehicleType);
      const icon = this.L.divIcon({
        html,
        className: 'custom-vehicle-marker',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      this.partnerMarker = this.L.marker([targetPoint.latitude, targetPoint.longitude], {
        icon,
        zIndexOffset: 1000,
      }).addTo(this.map);
      return;
    }

    if (!animate || !this.currentPartnerPos) {
      this.currentPartnerPos = targetPoint;
      this.currentPartnerHeading = targetHeading;
      this.partnerMarker.setLatLng([targetPoint.latitude, targetPoint.longitude]);
      this.updateVehicleDom(targetHeading, speedKmh, vehicleType);
      return;
    }

    // 60FPS Spherical Lerp Animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startPos = { ...this.currentPartnerPos };
    const startHeading = this.currentPartnerHeading;
    const durationMs = 1200; // Smooth 1.2s interpolation between GPS updates
    const startTime = performance.now();

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Cubic ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const interpPos = interpolatePoint(startPos, targetPoint, easeProgress);
      const interpHeading = interpolateAngle(startHeading, targetHeading, easeProgress);

      this.currentPartnerPos = interpPos;
      this.currentPartnerHeading = interpHeading;

      this.partnerMarker.setLatLng([interpPos.latitude, interpPos.longitude]);
      this.updateVehicleDom(interpHeading, speedKmh, vehicleType);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animateStep);
      } else {
        this.currentPartnerPos = targetPoint;
        this.currentPartnerHeading = targetHeading;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animateStep);
  }

  private updateVehicleDom(heading: number, speedKmh: number, vehicleType: VehicleType): void {
    if (!this.partnerMarker) return;
    const el = this.partnerMarker.getElement();
    if (!el) return;

    const rotEl = el.querySelector('.vehicle-rotator') as HTMLElement;
    if (rotEl) {
      rotEl.style.transform = `rotate(${heading}deg)`;
    }

    const speedEl = el.querySelector('.vehicle-speed-badge') as HTMLElement;
    if (speedEl) {
      speedEl.innerText = `${Math.round(speedKmh)} km/h`;
    }
  }

  private generateVehicleHtml(heading: number, speedKmh: number, vehicleType: VehicleType): string {
    const isCar = vehicleType === 'CAR' || vehicleType === 'VAN';

    return `
      <div class="delivery-vehicle-wrapper" style="position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar glow -->
        <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(0, 166, 81, 0.22); animation: pulse-radar 1.8s infinite;"></div>
        
        <!-- Rotating Vehicle Container -->
        <div class="vehicle-rotator" style="position: relative; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #0b3b95 0%, #00a651 100%); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); border: 2.5px solid #ffffff; transform: rotate(${heading}deg); transition: transform 0.15s ease-out; z-index: 5;">
          ${
            isCar
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2 10.9 2 11 2 11.2V16c0 .6.4 1 1 1h2"/>
                  <circle cx="7" cy="17" r="2"/>
                  <path d="M9 17h6"/>
                  <circle cx="17" cy="17" r="2"/>
                </svg>`
              : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="15" cy="5" r="1"/>
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                </svg>`
          }
        </div>

        <!-- Real-time Speed Badge -->
        <div class="vehicle-speed-badge" style="position: absolute; bottom: -6px; background: #0f172a; color: #38bdf8; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap; z-index: 6; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${Math.round(speedKmh)} km/h
        </div>
      </div>
    `;
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
