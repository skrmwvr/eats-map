// Eats Map: Leaflet GPS Engine & Interactive Map Manager for FoodieLand Nashville

class MapManager {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.carMarker = null;
    this.vendorMarkers = [];
    this.amenityMarkers = [];
    this.watchId = null;
  }

  init(vendors = [], venue = null, carLocation = null, filterMode = 'all') {
    const defaultCenter = [36.0465, -86.4172]; // Nashville Superspeedway Infield Plaza
    
    if (!this.map) {
      this.map = L.map('leaflet-map', { 
        zoomControl: true,
        attributionControl: false,
        minZoom: 15,
        maxZoom: 20
      }).setView(defaultCenter, 17);
    } else {
      this.map.invalidateSize();
    }

    this.clearMarkers();

    // Render 100% Offline Vector Venue & Parking Architecture
    this.renderVectorVenueLayout();

    // Render Map Legend Overlay (by default)
    this.renderLegend();

    // Render Food Booth Markers (Only if not in dedicated facility focus mode)
    if (filterMode === 'all') {
      vendors.forEach(vendor => {
        if (vendor.coordinates) {
          const marker = L.circleMarker([vendor.coordinates.lat, vendor.coordinates.lng], {
            radius: 8,
            fillColor: '#ff5e36',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(this.map);

          // Permanent text label by default
          marker.bindTooltip(`<strong>${vendor.booth_number}</strong> • ${vendor.name}`, {
            permanent: true,
            direction: 'top',
            offset: [0, -8],
            className: 'map-label-tooltip'
          });

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
              <strong style="color: #ff5e36; font-size: 0.95rem;">${vendor.name}</strong><br>
              <strong>Booth:</strong> ${vendor.booth_number} (${vendor.zone})<br>
              <em>${vendor.cuisine}</em><br>
              <button style="margin-top:6px; background:#ff5e36; color:#fff; border:none; border-radius:4px; padding:4px 8px; font-size:0.75rem; cursor:pointer; font-weight:bold;" onclick="window.app.openVendorById('${vendor.id}')">View Menu & Bio →</button>
            </div>
          `);
          this.vendorMarkers.push({
            vendorId: vendor.id,
            lat: vendor.coordinates.lat,
            lng: vendor.coordinates.lng,
            marker: marker
          });
        }
      });
    }

    // Render Health & Wellness / Restroom Amenities
    if (venue && venue.utility && venue.utility.amenities) {
      venue.utility.amenities.forEach(amenity => {
        if (filterMode !== 'all' && amenity.type !== filterMode) {
          return;
        }

        let pinColor = '#05d9e8';
        let radius = 7;
        if (amenity.type === 'wellness') {
          pinColor = '#ff2a6d'; // Red/Pink First Aid
          if (filterMode === 'wellness') radius = 12;
        }
        if (amenity.type === 'water') {
          pinColor = '#00f090';    // Green Water
          if (filterMode === 'water') radius = 12;
        }
        if (amenity.type === 'restroom') {
          pinColor = '#ffc837'; // Yellow Restrooms
        }

        const marker = L.circleMarker([amenity.lat, amenity.lng], {
          radius: radius,
          fillColor: pinColor,
          color: filterMode !== 'all' ? '#ffffff' : '#111',
          weight: filterMode !== 'all' ? 3 : 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(this.map);

        // Permanent text label by default
        marker.bindTooltip(`<strong>${amenity.name}</strong>`, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'map-label-tooltip amenity-label-' + amenity.type
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
            <strong style="color: ${pinColor}; font-size: 0.95rem;">${amenity.name}</strong><br>
            <span style="color: #444;">${amenity.location}</span><br>
            <small style="color: #666;">${amenity.type === 'water' ? '💧 Free Hydration Station' : '🏥 Emergency & First Aid Support'}</small>
          </div>
        `);

        if (filterMode !== 'all') {
          setTimeout(() => {
            marker.openPopup();
            this.highlightBullseye([amenity.lat, amenity.lng]);
          }, 200);
        }

        this.amenityMarkers.push(marker);
      });
    }

    // Render Car Pin if set
    if (carLocation) {
      this.updateCarPin(carLocation);
    }

    // Start Live GPS Tracking
    this.startTracking();
  }

  updateCarPin(carLocation) {
    if (this.carMarker) {
      this.map.removeLayer(this.carMarker);
    }
    this.carMarker = L.marker([carLocation.lat, carLocation.lng], {
      title: 'My Car Spot'
    }).addTo(this.map);

    this.carMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
        <strong style="color: #ff5e36;">🚗 Your Marked Car</strong><br>
        <span>Parked at Nashville Superspeedway</span><br>
        <small style="color: #666;">Saved at: ${carLocation.savedAt || 'GPS Marked'}</small>
      </div>
    `);
  }

  focusOnCar(carLocation) {
    if (!this.map) return;
    this.updateCarPin(carLocation);
    this.map.setView([carLocation.lat, carLocation.lng], 18);
    if (this.carMarker) {
      this.carMarker.openPopup();
    }
  }

  focusOnVendorWaypoint(vendorId) {
    if (!this.map) return;
    const markerObj = this.vendorMarkers.find(m => m.vendorId === vendorId);
    if (markerObj) {
      this.map.setView([markerObj.lat, markerObj.lng], 19, { animate: true });
      setTimeout(() => {
        markerObj.marker.openPopup();
        this.highlightBullseye([markerObj.lat, markerObj.lng]);
      }, 150);
    }
  }

  startTracking() {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (!this.userMarker) {
            this.userMarker = L.circleMarker([lat, lng], {
              radius: 9,
              fillColor: '#00f090',
              color: '#ffffff',
              weight: 3,
              opacity: 1,
              fillOpacity: 1
            }).addTo(this.map);
            this.userMarker.bindPopup('<strong>📍 You are here</strong>');
          } else {
            this.userMarker.setLatLng([lat, lng]);
          }
        },
        (err) => {
          console.log('GPS tracking notice:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
  }

  clearMarkers() {
    this.vendorMarkers.forEach(m => {
      const layer = m.marker || m;
      if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
    });
    this.amenityMarkers.forEach(m => {
      if (this.map.hasLayer(m)) this.map.removeLayer(m);
    });
    this.vendorMarkers = [];
    this.amenityMarkers = [];
    if (this.bullseyeLayerGroup) {
      this.map.removeLayer(this.bullseyeLayerGroup);
      this.bullseyeLayerGroup = null;
    }
  }

  highlightBullseye(latlng) {
    if (!this.map) return;
    
    // Remove existing bullseye group if present
    if (this.bullseyeLayerGroup) {
      this.map.removeLayer(this.bullseyeLayerGroup);
    }

    this.bullseyeLayerGroup = L.layerGroup().addTo(this.map);

    // Inner Ring 1
    const ring1 = L.circleMarker(latlng, {
      radius: 20,
      fillColor: 'transparent',
      color: '#ff2a6d',
      weight: 3,
      opacity: 0.9,
      className: 'bullseye-ring-1'
    }).addTo(this.bullseyeLayerGroup);

    // Outer Ring 2
    const ring2 = L.circleMarker(latlng, {
      radius: 36,
      fillColor: 'transparent',
      color: '#ff5e36',
      weight: 2,
      opacity: 0.7,
      className: 'bullseye-ring-2'
    }).addTo(this.bullseyeLayerGroup);

    this.map.setView(latlng, 18, { animate: true });
  }

  renderLegend() {
    if (this.legendControl) return;

    this.legendControl = L.control({ position: 'bottomright' });

    this.legendControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-legend-overlay');
      div.innerHTML = `
        <div class="legend-title">Grounds Legend</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ff5e36;"></span> Food Booths</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ff2a6d;"></span> Medical & First Aid</div>
        <div class="legend-item"><span class="legend-dot" style="background:#00f090;"></span> Water Stations</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ffc837;"></span> Restrooms</div>
        <div class="legend-item"><span class="legend-dot" style="background:#05d9e8;"></span> Parking Zones</div>
      `;
      return div;
    };

    this.legendControl.addTo(this.map);
  }

  // --- EMBEDDED VECTOR VENUE ARCHITECTURE (Zero Network Download) ---
  renderVectorVenueLayout() {
    if (this.venueVectorGroup) {
      this.map.removeLayer(this.venueVectorGroup);
    }
    this.venueVectorGroup = L.layerGroup().addTo(this.map);

    // 1. Speedway D-Shaped Oval Track & Outer Perimeter
    const trackOuterCoords = [
      [36.0515, -86.4172],
      [36.0510, -86.4140],
      [36.0485, -86.4130],
      [36.0440, -86.4135],
      [36.0415, -86.4165],
      [36.0415, -86.4185],
      [36.0440, -86.4210],
      [36.0485, -86.4215],
      [36.0510, -86.4200]
    ];
    L.polygon(trackOuterCoords, {
      color: '#334155',
      weight: 6,
      fillColor: '#1e293b',
      fillOpacity: 0.35,
      dashArray: '8, 8',
      interactive: false
    }).addTo(this.venueVectorGroup);

    // 2. Infield Festival Plaza (The Active Grounds)
    const infieldCoords = [
      [36.0492, -86.4182],
      [36.0490, -86.4158],
      [36.0465, -86.4152],
      [36.0442, -86.4162],
      [36.0445, -86.4185],
      [36.0470, -86.4190]
    ];
    L.polygon(infieldCoords, {
      color: '#ff5e36',
      weight: 2,
      fillColor: 'rgba(255, 94, 54, 0.08)',
      fillOpacity: 0.6,
      interactive: false
    }).addTo(this.venueVectorGroup);

    // 3. Surrounding Parking Lots (North, South, East, West)
    const parkingLots = [
      {
        name: "North General Parking Lot",
        coords: [
          [36.0535, -86.4195],
          [36.0535, -86.4155],
          [36.0518, -86.4155],
          [36.0518, -86.4195]
        ]
      },
      {
        name: "South General & VIP Parking",
        coords: [
          [36.0410, -86.4190],
          [36.0410, -86.4150],
          [36.0392, -86.4150],
          [36.0392, -86.4190]
        ]
      },
      {
        name: "West ADA & Rideshare Staging Lot",
        coords: [
          [36.0485, -86.4240],
          [36.0485, -86.4220],
          [36.0450, -86.4220],
          [36.0450, -86.4240]
        ]
      }
    ];

    parkingLots.forEach(lot => {
      const poly = L.polygon(lot.coords, {
        color: '#05d9e8',
        weight: 1.5,
        fillColor: '#05d9e8',
        fillOpacity: 0.12,
        dashArray: '4, 4'
      }).addTo(this.venueVectorGroup);

      poly.bindTooltip(`🚗 <strong>${lot.name}</strong><br><small style="color:#94a3b8;">Free Festival Parking</small>`, {
        permanent: true,
        direction: 'center',
        className: 'parking-label-tooltip'
      });
    });

    // 4. Main Concourse Pedestrian Thoroughfare (Gate 1 to Central Stage)
    const walkwayCoords = [
      [36.0475, -86.4210], // Gate 1 Entrance
      [36.0472, -86.4168], // Medical Tent
      [36.0467, -86.4171], // Water Hub
      [36.0460, -86.4169]  // Asian Market Row
    ];
    L.polyline(walkwayCoords, {
      color: '#ffc837',
      weight: 3,
      opacity: 0.6,
      dashArray: '6, 6'
    }).addTo(this.venueVectorGroup);

    // 5. Main Concourse Gate 1 Entrance Marker
    L.marker([36.0475, -86.4210], {
      icon: L.divIcon({
        className: 'gate-marker-icon',
        html: '<div style="background:#ff2a6d; color:#fff; font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:4px; border:1px solid #fff; white-space:nowrap;">🎟️ GATE 1 MAIN ENTRY</div>',
        iconSize: [120, 20],
        iconAnchor: [60, 10]
      })
    }).addTo(this.venueVectorGroup);
  }
}
