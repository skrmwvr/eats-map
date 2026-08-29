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
      this.map = L.map('leaflet-map', { zoomControl: true }).setView(defaultCenter, 17);
      
      // High-contrast clean CartoDB Voyager tiles for festival vibe
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20
      }).addTo(this.map);
    } else {
      this.map.invalidateSize();
    }

    this.clearMarkers();

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
          this.vendorMarkers.push(marker);
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
    this.vendorMarkers.forEach(m => this.map.removeLayer(m));
    this.amenityMarkers.forEach(m => this.map.removeLayer(m));
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
      `;
      return div;
    };

    this.legendControl.addTo(this.map);
  }
}
