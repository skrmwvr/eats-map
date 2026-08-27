// Eats Map: Sun Map UI & 3-Day Program Controller

class EatsMapApp {
  constructor() {
    this.vendors = window.EMBEDDED_VENDORS || [];
    this.venue = window.EMBEDDED_VENUE || null;
    this.activeViewport = 'home';
    this.homeDisplayMode = 'list'; // 'list' or 'map'
    this.activeDayIndex = 0; // 0: Fri Aug 28, 1: Sat Aug 29, 2: Sun Aug 30
    this.activeDishIndex = 0;
    this.allFeaturedDishes = [];
    this.avoidedAllergens = JSON.parse(localStorage.getItem('eatsmap_allergens') || '[]');
    this.customAllergen = localStorage.getItem('eatsmap_custom_allergen') || null;
    this.wishlist = JSON.parse(localStorage.getItem('eatsmap_wishlist') || '[]');
    this.ratings = JSON.parse(localStorage.getItem('eatsmap_ratings') || '{}');
    this.carLocation = JSON.parse(localStorage.getItem('eatsmap_car') || 'null');
    this.tempUnit = localStorage.getItem('eatsmap_temp_unit') || 'F'; // 'F' or 'C'
    this.historyStack = []; // Navigation history stack for back button
    this.userCoords = null; // Real live device GPS coords {lat, lng, accuracy}
    this.gpsStatus = 'prompt'; // 'prompt' | 'granted' | 'denied' | 'unsupported'
    this.isAtVenue = false; // Whether user is within 1.5 miles of Nashville Superspeedway
    this.searchQuery = '';
    this.mapManager = null;
    this.qrExpanded = false;
  }

  init() {
    this.buildFeaturedDishesList();
    this.determineCurrentDayIndex();
    this.bindEvents();
    this.renderAllergenChips();
    this.updateCarButtonStatus();
    this.updateTopBarStatus();
    this.updateWishlistBadge();
    this.renderActiveViewport();
  }

  buildFeaturedDishesList() {
    this.allFeaturedDishes = [];
    this.vendors.forEach(v => {
      (v.menu || []).forEach(dish => {
        this.allFeaturedDishes.push({
          ...dish,
          vendorName: v.name,
          vendorBooth: v.booth_number,
          vendorZone: v.zone,
          vendorStory: v.story,
          vendorId: v.id
        });
      });
    });
  }

  determineCurrentDayIndex() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    if (month === 7) {
      if (day === 28) this.activeDayIndex = 0;
      else if (day === 29) this.activeDayIndex = 1;
      else if (day >= 30) this.activeDayIndex = 2;
      else this.activeDayIndex = 0;
    } else {
      this.activeDayIndex = 0;
    }
  }

  bindEvents() {
    document.getElementById('btn-weather').addEventListener('click', () => this.switchViewport('weather'));
    document.getElementById('btn-venue').addEventListener('click', () => {
      const sub = document.getElementById('sub-header-venue');
      if (sub) sub.style.display = sub.style.display === 'none' ? 'flex' : 'none';
      this.switchViewport('venue');
    });
    document.getElementById('btn-timeline').addEventListener('click', () => this.switchViewport('program'));

    const btnCar = document.getElementById('btn-venue-car');
    if (btnCar) btnCar.addEventListener('click', () => this.handleCarButtonClick());
    const btnFac = document.getElementById('btn-venue-fac');
    if (btnFac) btnFac.addEventListener('click', () => this.switchViewport('map'));
    const btnHelp = document.getElementById('btn-venue-help');
    if (btnHelp) btnHelp.addEventListener('click', () => {
      alert('Medical & First Aid Station is stationed at Main Concourse Gate 1. Call 911 for emergencies or event dispatch on site.');
    });

    document.getElementById('btn-booths')?.addEventListener('click', () => this.switchViewport('booths'));
    document.getElementById('btn-home')?.addEventListener('click', () => this.switchViewport('home'));
    document.getElementById('btn-passport')?.addEventListener('click', () => this.switchViewport('passport'));
    document.getElementById('btn-foot-map')?.addEventListener('click', () => this.switchViewport('map'));
    document.getElementById('btn-foot-help')?.addEventListener('click', () => this.switchViewport('about'));

    // Temperature Unit Toggle (°F / °C)
    const btnTempUnit = document.getElementById('btn-temp-unit');
    if (btnTempUnit) {
      btnTempUnit.addEventListener('click', () => {
        this.toggleTempUnit();
      });
    }

    // Floating History Back Button
    const backFab = document.getElementById('viewport-back-fab');
    if (backFab) {
      backFab.addEventListener('click', () => {
        this.goBack();
      });
    }

    // Allergen Dropdown Toggle & Backdrop Click-Outside
    const btnAllergenToggle = document.getElementById('allergen-toggle-btn');
    if (btnAllergenToggle) {
      btnAllergenToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAllergenPanel();
      });
    }

    const allergenBackdrop = document.getElementById('allergen-backdrop');
    if (allergenBackdrop) {
      allergenBackdrop.addEventListener('click', () => {
        this.closeAllergenPanel();
      });
    }

    // Close allergen panel if tapping outside anywhere on main-viewport
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#allergen-pref-bar')) {
        this.closeAllergenPanel();
      }
    });

    const chipsTray = document.getElementById('allergen-chips-tray');
    if (chipsTray) {
      chipsTray.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip-btn');
        if (!chip) return;
        const allergen = chip.dataset.allergen;
        if (allergen === 'custom') {
          this.openCustomAllergenModal();
          return;
        }
        
        // Handle Preset Allergen Click: Toggle state & show match feedback popup
        const isCurrentlyActive = this.avoidedAllergens.includes(allergen);
        if (isCurrentlyActive) {
          // Remove preset
          this.avoidedAllergens = this.avoidedAllergens.filter(a => a !== allergen);
          localStorage.setItem('eatsmap_allergens', JSON.stringify(this.avoidedAllergens));
          this.renderAllergenChips();
          this.renderActiveViewport();
        } else {
          // Add preset and show feedback modal with results and undo action
          this.avoidedAllergens.push(allergen);
          localStorage.setItem('eatsmap_allergens', JSON.stringify(this.avoidedAllergens));
          this.renderAllergenChips();
          this.renderActiveViewport();
          this.openPresetAllergenModal(allergen);
        }
      });
    }

    const modal = document.getElementById('detail-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal' || e.target.closest('.modal-close-btn')) {
          this.closeModal();
        }
      });
    }
  }

  toggleAllergenPanel() {
    const bar = document.getElementById('allergen-pref-bar');
    const backdrop = document.getElementById('allergen-backdrop');
    if (!bar) return;
    const isExp = bar.classList.toggle('is-expanded');
    if (backdrop) backdrop.classList.toggle('is-active', isExp);
  }

  closeAllergenPanel() {
    const bar = document.getElementById('allergen-pref-bar');
    const backdrop = document.getElementById('allergen-backdrop');
    if (bar) bar.classList.remove('is-expanded');
    if (backdrop) backdrop.classList.remove('is-active');
  }

  switchViewport(view, pushHistory = true) {
    this.closeAllergenPanel();
    
    if (pushHistory && this.activeViewport && this.activeViewport !== view) {
      this.historyStack.push({
        viewport: this.activeViewport,
        dayIndex: this.activeDayIndex,
        homeMode: this.homeDisplayMode
      });
    }

    this.activeViewport = view;
    document.querySelectorAll('.top-btn, .bottom-btn').forEach(btn => btn.classList.remove('active'));
    if (view === 'weather') document.getElementById('btn-weather')?.classList.add('active');
    if (view === 'venue') document.getElementById('btn-venue')?.classList.add('active');
    if (view === 'program') document.getElementById('btn-timeline')?.classList.add('active');
    if (view === 'home') document.getElementById('btn-home')?.classList.add('active');
    if (view === 'booths') document.getElementById('btn-booths')?.classList.add('active');
    if (view === 'passport') document.getElementById('btn-passport')?.classList.add('active');

    this.updateBackFabVisibility();
    this.renderActiveViewport();
  }

  goBack() {
    if (this.historyStack.length === 0) return;
    const prev = this.historyStack.pop();
    if (typeof prev.dayIndex === 'number') {
      this.activeDayIndex = prev.dayIndex;
      this.updateTopBarStatus();
    }
    if (prev.homeMode) {
      this.homeDisplayMode = prev.homeMode;
    }
    this.switchViewport(prev.viewport, false);
  }

  updateBackFabVisibility() {
    const fab = document.getElementById('viewport-back-fab');
    if (!fab) return;
    if (this.historyStack.length > 0) {
      fab.style.display = 'inline-flex';
    } else {
      fab.style.display = 'none';
    }
  }

  renderAllergenChips() {
    document.querySelectorAll('#allergen-chips-tray .chip-btn').forEach(chip => {
      const allergen = chip.dataset.allergen;
      if (allergen !== 'custom') {
        chip.classList.toggle('active', this.avoidedAllergens.includes(allergen));
      }
    });

    const customBtn = document.getElementById('btn-custom-allergen');
    if (customBtn) {
      customBtn.classList.toggle('active', !!this.customAllergen);
      customBtn.innerHTML = this.customAllergen ? `🔍 ${this.customAllergen}` : '🔍 Custom...';
    }

    const customActiveTray = document.getElementById('custom-active-tray');
    if (customActiveTray) {
      if (this.customAllergen) {
        customActiveTray.style.display = 'flex';
        customActiveTray.innerHTML = `
          <span>Active custom slot: <strong class="custom-active-name">${this.customAllergen}</strong></span>
          <button class="custom-remove-btn" onclick="window.app.removeCustomAllergen()">✕ Remove</button>
        `;
      } else {
        customActiveTray.style.display = 'none';
        customActiveTray.innerHTML = '';
      }
    }
    
    let totalActive = this.avoidedAllergens.length + (this.customAllergen ? 1 : 0);
    const badgeEl = document.getElementById('active-avoid-badge');
    if (badgeEl) {
      badgeEl.textContent = totalActive > 0 ? totalActive + ' active' : '0';
      badgeEl.classList.toggle('has-active', totalActive > 0);
    }
  }

  checkAllergenFlags(itemAllergens = [], dishText = '') {
    const flags = (itemAllergens || []).filter(a => this.avoidedAllergens.includes(a));
    
    // Check custom allergen match against known allergens and description/name text
    if (this.customAllergen) {
      const target = this.customAllergen.toLowerCase().trim();
      const matchKnown = (itemAllergens || []).some(a => a.toLowerCase().includes(target));
      const matchText = (dishText || '').toLowerCase().includes(target);
      if (matchKnown || matchText) {
        if (!flags.includes(this.customAllergen)) {
          flags.push(this.customAllergen);
        }
      }
    }
    return flags;
  }

  // --- CUSTOM ALLERGEN SEARCH MODAL & CORPUS QUERY ---
  openCustomAllergenModal() {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: var(--fl-orange); font-size: 0.95rem; font-family: 'Outfit';">🔍 Set Custom Allergen / Aversion</strong>
        <button class="modal-close-btn">✕</button>
      </div>
      <div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">
          Enter any specific ingredient or food intolerance (e.g. <em>MSG, Mushrooms, Truffle, Cinnamon, Soy</em>) to search the festival menu database. You have <strong>1 active custom slot</strong>.
        </p>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="custom-allergen-input" value="${this.customAllergen || ''}" placeholder="Type ingredient or allergen..." style="flex: 1; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; color: #fff; font-size: 0.85rem; outline: none;">
          <button class="action-share-btn" style="padding: 8px 14px;" onclick="window.app.submitCustomAllergenSearch()">Search & Flag</button>
        </div>
        <div id="custom-search-result" style="font-size: 0.76rem; line-height: 1.45; color: #cbd5e1;"></div>
      </div>
    `;

    modal.classList.add('active');
    setTimeout(() => {
      document.getElementById('custom-allergen-input')?.focus();
    }, 50);
  }

  submitCustomAllergenSearch() {
    const inputEl = document.getElementById('custom-allergen-input');
    const resultEl = document.getElementById('custom-search-result');
    if (!inputEl || !resultEl) return;

    const term = inputEl.value.trim();
    if (!term) {
      resultEl.innerHTML = '<span style="color: var(--alert-red);">Please enter an ingredient name.</span>';
      return;
    }

    // Search corpus (all dish names, descriptions, flavor profiles, and allergen arrays)
    const termLower = term.toLowerCase();
    const matchingDishes = [];
    this.allFeaturedDishes.forEach(d => {
      const matchName = d.name.toLowerCase().includes(termLower);
      const matchDesc = (d.description || '').toLowerCase().includes(termLower);
      const matchFlavor = (d.flavor_profile || '').toLowerCase().includes(termLower);
      const matchAllergens = (d.allergens || []).some(a => a.toLowerCase().includes(termLower));
      if (matchName || matchDesc || matchFlavor || matchAllergens) {
        matchingDishes.push(d);
      }
    });

    if (matchingDishes.length > 0) {
      this.customAllergen = term;
      localStorage.setItem('eatsmap_custom_allergen', this.customAllergen);
      this.renderAllergenChips();
      this.renderActiveViewport();
      resultEl.innerHTML = `
        <div style="background: rgba(0, 240, 144, 0.15); border-left: 3px solid var(--fl-green); padding: 8px 10px; border-radius: 4px; margin-top: 6px;">
          <strong style="color: var(--fl-green);">✓ Found in ${matchingDishes.length} menu items!</strong><br>
          <span><strong>"${term}"</strong> is now saved to your custom slot and will be flagged in-line.</span>
        </div>
        <div style="margin-top: 10px;">
          <button class="chip-btn" style="width: 100%; padding: 8px; font-weight: bold;" onclick="window.app.closeModal()">Close & View Menus</button>
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div style="background: rgba(255, 159, 28, 0.15); border-left: 3px solid var(--fl-amber); padding: 8px 10px; border-radius: 4px; margin-top: 6px;">
          <strong style="color: var(--fl-yellow);">⚠️ Not explicitly found in database</strong><br>
          <span>"${term}" was not found in our public festival menu data. Remember that our database reflects public vendor submissions and may not be exhaustive. Please check directly with booth chefs!</span>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="chip-btn active" style="flex: 1; padding: 8px;" onclick="window.app.forceSaveCustomAllergen('${term}')">Flag Anyway as Caution</button>
          <button class="chip-btn" style="padding: 8px 12px;" onclick="window.app.closeModal()">Dismiss</button>
        </div>
      `;
    }
  }

  forceSaveCustomAllergen(term) {
    this.customAllergen = term;
    localStorage.setItem('eatsmap_custom_allergen', this.customAllergen);
    this.renderAllergenChips();
    this.renderActiveViewport();
    this.closeModal();
  }

  removeCustomAllergen() {
    this.customAllergen = null;
    localStorage.removeItem('eatsmap_custom_allergen');
    this.renderAllergenChips();
    this.renderActiveViewport();
  }

  // --- PRESET ALLERGEN POPUP: Search Results, Action Taken, Big OK & Tiny Undo ---
  openPresetAllergenModal(allergenName) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    // Search corpus for matches
    const termLower = allergenName.toLowerCase();
    const matchingDishes = [];
    this.allFeaturedDishes.forEach(d => {
      const matchName = d.name.toLowerCase().includes(termLower);
      const matchDesc = (d.description || '').toLowerCase().includes(termLower);
      const matchFlavor = (d.flavor_profile || '').toLowerCase().includes(termLower);
      const matchAllergens = (d.allergens || []).some(a => a.toLowerCase().includes(termLower));
      if (matchName || matchDesc || matchFlavor || matchAllergens) {
        matchingDishes.push(d);
      }
    });

    const matchCount = matchingDishes.length;
    let matchSummaryHtml = '';

    if (matchCount > 0) {
      matchSummaryHtml = `
        <div style="background: rgba(0, 240, 144, 0.12); border-left: 3px solid var(--fl-green); padding: 10px; border-radius: 4px; margin-bottom: 12px;">
          <strong style="color: var(--fl-green); font-size: 0.9rem;">✓ Found in ${matchCount} menu items!</strong>
          <p style="font-size: 0.78rem; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">
            All creations containing <strong>${allergenName}</strong> are now flagged with in-line warning tags on menus.
          </p>
        </div>
      `;
    } else {
      matchSummaryHtml = `
        <div style="background: rgba(255, 159, 28, 0.12); border-left: 3px solid var(--fl-amber); padding: 10px; border-radius: 4px; margin-bottom: 12px;">
          <strong style="color: var(--fl-yellow); font-size: 0.9rem;">⚠️ Flag Activated</strong>
          <p style="font-size: 0.78rem; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">
            <strong>${allergenName}</strong> is now flagged. (Not explicitly listed in current vendor ingredients, but flagged as caution).
          </p>
        </div>
      `;
    }

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: var(--fl-orange); font-size: 0.95rem; font-family: 'Outfit';">⚠️ Allergen Flag Active</strong>
        <button class="modal-close-btn">✕</button>
      </div>
      <div>
        <h3 style="font-family: 'Outfit'; font-size: 1.25rem; font-weight: 900; color: #fff; margin-bottom: 6px;">
          Flagged: ${allergenName}
        </h3>
        
        ${matchSummaryHtml}

        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">
          <em>Note: Flagging alerts you in-line without hiding foods. Curated from public vendor listings; please confirm critical allergies with booth staff.</em>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <!-- Big OK Button -->
          <button class="action-share-btn" style="width: 100%; padding: 12px; font-size: 0.9rem; font-weight: 800;" onclick="window.app.closeModal()">
            OK, Got It!
          </button>
          <!-- Tiny Undo Text -->
          <button style="background: transparent; border: none; color: var(--text-muted); font-size: 0.72rem; text-decoration: underline; cursor: pointer; padding: 4px;" onclick="window.app.undoPresetAllergen('${allergenName}')">
            Undo & Unflag ${allergenName}
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  undoPresetAllergen(allergenName) {
    this.avoidedAllergens = this.avoidedAllergens.filter(a => a !== allergenName);
    localStorage.setItem('eatsmap_allergens', JSON.stringify(this.avoidedAllergens));
    this.renderAllergenChips();
    this.renderActiveViewport();
    this.closeModal();
  }

  updateTopBarStatus() {
    if (!this.venue || !this.venue.days) return;
    const currentDay = this.venue.days[this.activeDayIndex];
    if (currentDay) {
      const timelineStatus = document.getElementById('timeline-status');
      if (timelineStatus) timelineStatus.textContent = currentDay.date_short;
      const weatherStatus = document.getElementById('weather-status');
      if (weatherStatus) {
        const afternoonF = currentDay.temp_afternoon_f || 84;
        weatherStatus.textContent = this.formatTemp(afternoonF);
      }
    }
  }

  updateWishlistBadge() {
    const badge = document.getElementById('wishlist-sub-label');
    if (badge) badge.textContent = this.wishlist.length + ' Queued';
  }

  // --- GPS STATUS & PROXIMITY ENGINE ---
  initGPSProximity() {
    if (!navigator.geolocation) {
      this.gpsStatus = 'unsupported';
      this.updateCarButtonStatus();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.gpsStatus = 'granted';
        this.userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        // Check if user is within ~2.5 miles of Nashville Superspeedway (36.0465, -86.4172)
        const venueCoords = this.venue?.coordinates || { lat: 36.0465, lng: -86.4172 };
        const distMiles = this.calculateDistanceMiles(this.userCoords.lat, this.userCoords.lng, venueCoords.lat, venueCoords.lng);
        this.isAtVenue = distMiles <= 2.5;
        this.updateCarButtonStatus();
      },
      (err) => {
        this.gpsStatus = 'denied';
        this.updateCarButtonStatus();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  calculateDistanceMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- CAR & DIRECTIONS BUTTON LOGIC: Dynamic Mode Based on GPS Proximity & Stored Spot ---
  updateCarButtonStatus() {
    const carTextEl = document.getElementById('btn-car-text');
    const carIconEl = document.getElementById('btn-car-icon');
    const carBtn = document.getElementById('btn-venue-car');
    const gpsDot = document.getElementById('gps-dot-indicator');

    // Update Dev GPS Dot Indicator (Green = GPS live/granted, Red = denied, Amber = checking/pending)
    if (gpsDot) {
      gpsDot.className = 'gps-dot-indicator ' + (this.gpsStatus || 'prompt');
    }

    if (!carBtn) return;

    // State 1: Car spot is already saved
    if (this.carLocation && typeof this.carLocation.lat === 'number') {
      if (carIconEl) carIconEl.textContent = '🚗';
      if (carTextEl) carTextEl.textContent = 'Find my car';
      carBtn.className = 'sub-venue-btn car-saved';
      return;
    }

    // State 2: User is NOT at the festival grounds -> Button acts as "Get Directions"
    if (this.userCoords && !this.isAtVenue) {
      if (carIconEl) carIconEl.textContent = '🧭';
      if (carTextEl) carTextEl.textContent = 'Get Directions';
      carBtn.className = 'sub-venue-btn nav-directions';
      return;
    }

    // State 3: User IS at venue (or GPS is pending) & no car saved yet -> "Mark my car"
    if (carIconEl) carIconEl.textContent = '🚗';
    if (carTextEl) carTextEl.textContent = 'Mark my car';
    carBtn.className = 'sub-venue-btn';
  }

  handleCarButtonClick() {
    // 1. If Car already marked -> View pin on interactive grounds map
    if (this.carLocation && typeof this.carLocation.lat === 'number') {
      this.switchViewport('map');
      setTimeout(() => {
        if (this.mapManager) {
          this.mapManager.focusOnCar(this.carLocation);
        }
      }, 100);
      return;
    }

    // 2. If User is NOT at venue -> Launch local native maps app with directions to Speedway
    if (this.userCoords && !this.isAtVenue) {
      const address = encodeURIComponent(this.venue?.address || '400 Victory Ln Dr, Lebanon, TN 37090');
      const venueLat = this.venue?.coordinates?.lat || 36.0465;
      const venueLng = this.venue?.coordinates?.lng || -86.4172;
      
      // Universal maps intent (Apple Maps on iOS / Google Maps on Android & Web)
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venueLat},${venueLng}&destination_place_id=${address}`;
      window.open(mapsUrl, '_blank');
      return;
    }

    // 3. User is at venue -> Request high accuracy GPS to mark parking spot
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const carTextEl = document.getElementById('btn-car-text');
    if (carTextEl) carTextEl.textContent = 'Locating...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.gpsStatus = 'granted';
        this.carLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        localStorage.setItem('eatsmap_car', JSON.stringify(this.carLocation));
        this.updateCarButtonStatus();
        alert('🚗 Parking spot saved successfully at your exact coordinates!');
        if (this.mapManager && this.activeViewport === 'map') {
          this.mapManager.updateCarPin(this.carLocation);
        }
      },
      (err) => {
        this.gpsStatus = 'denied';
        this.carLocation = null;
        localStorage.removeItem('eatsmap_car');
        this.updateCarButtonStatus();
        let errMsg = 'Could not access GPS location.';
        if (err.code === 1) errMsg = 'Location permission was denied. Please allow location access in your browser settings.';
        else if (err.code === 2) errMsg = 'Location position unavailable. Check GPS/Wi-Fi connection.';
        else if (err.code === 3) errMsg = 'GPS request timed out. Try again.';
        alert('⚠️ ' + errMsg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  renderActiveViewport() {
    const container = document.getElementById('viewport-content');
    if (!container) return;

    if (this.activeViewport === 'home') {
      this.renderHomeView(container);
    } else if (this.activeViewport === 'program') {
      this.renderProgramView(container);
    } else if (this.activeViewport === 'booths') {
      this.renderBoothsView(container);
    } else if (this.activeViewport === 'weather') {
      this.renderWeatherView(container);
    } else if (this.activeViewport === 'venue') {
      this.renderVenueView(container);
    } else if (this.activeViewport === 'map') {
      this.renderMapView(container);
    } else if (this.activeViewport === 'passport') {
      this.renderPassportView(container);
    } else if (this.activeViewport === 'about') {
      this.renderAboutView(container);
    }
  }

  // --- VIEW 1: "NOW PLAYING" HOME VIEW (Clean List & Map Views, Deck in Detail Modal) ---
  renderHomeView(container) {
    const totalCount = this.allFeaturedDishes.length;

    if (this.homeDisplayMode === 'map') {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #fff; font-size: 0.95rem; font-family: 'Outfit';">Now Playing Grounds Map</strong>
          <div class="view-mode-toggle">
            <button class="view-mode-btn" onclick="window.app.setHomeDisplayMode('list')">List View</button>
            <button class="view-mode-btn active" onclick="window.app.setHomeDisplayMode('map')">Map View</button>
          </div>
        </div>
        <div id="leaflet-map" style="width:100%; height:calc(100% - 40px); border-radius:var(--radius-md);"></div>
      `;
      setTimeout(() => {
        if (!this.mapManager) this.mapManager = new MapManager();
        this.mapManager.init(this.vendors, this.venue, this.carLocation);
      }, 50);
      return;
    }

    // Default: List View
    let listHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #fff; font-size: 0.95rem; font-family: 'Outfit';">Now Playing • Featured Creations (${totalCount})</strong>
        <div class="view-mode-toggle">
          <button class="view-mode-btn active" onclick="window.app.setHomeDisplayMode('list')">List View</button>
          <button class="view-mode-btn" onclick="window.app.setHomeDisplayMode('map')">Map View</button>
        </div>
      </div>
      <div class="vendor-grid">
    `;

    this.allFeaturedDishes.forEach((d) => {
      const dishCorpusText = d.name + ' ' + d.description + ' ' + (d.flavor_profile || '');
      const itemFlagged = this.checkAllergenFlags(d.allergens, dishCorpusText);
      const inWish = this.wishlist.includes(d.id);
      listHtml += `
        <div class="vendor-card" onclick="window.app.openDishCardModal('${d.id}')">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <strong style="color:#fff; font-size:0.95rem;">${d.name}</strong>
              <div style="font-size:0.74rem; color:var(--fl-teal);">${d.vendorName} • ${d.vendorBooth}</div>
            </div>
            <span style="color:var(--fl-yellow); font-weight:800; font-size:0.9rem;">$${d.price}</span>
          </div>
          <p style="font-size:0.76rem; color:var(--text-secondary); margin:4px 0;">${d.description}</p>
          ${itemFlagged.length > 0 ? '<div class="allergen-warning-tag">⚠️ Contains: <strong>' + itemFlagged.join(', ') + '</strong></div>' : ''}
          <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.7rem; color:var(--text-muted);">${d.vendorZone}</span>
            <span style="font-size:0.72rem; color:var(--fl-orange); font-weight:700;">${inWish ? '✓ In Wishlist' : 'Tap for Card →'}</span>
          </div>
        </div>
      `;
    });
    listHtml += '</div>';
    container.innerHTML = listHtml;
  }

  setHomeDisplayMode(mode) {
    this.homeDisplayMode = mode;
    this.renderHomeView(document.getElementById('viewport-content'));
  }

  // --- SECOND-LEVEL DISH DECK CARD MODAL ---
  openDishCardModal(dishId) {
    const dish = this.allFeaturedDishes.find(d => d.id === dishId);
    if (!dish) return;

    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    const isWishlisted = this.wishlist.includes(dish.id);
    const dishCorpusText = dish.name + ' ' + dish.description + ' ' + (dish.flavor_profile || '');
    const flagged = this.checkAllergenFlags(dish.allergens, dishCorpusText);

    let pairingLine = '';
    if (dish.pairings) {
      pairingLine = '<div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 6px;"><strong>Suggested Pairing:</strong> ' + dish.pairings + '</div>';
    }

    let allergenLine = '';
    if (flagged.length > 0) {
      allergenLine = '<div class="allergen-warning-tag" style="margin-top: 6px;">⚠️ Contains your flagged: <strong>' + flagged.join(', ') + '</strong></div>';
    }

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="booth-badge">${dish.vendorBooth} • ${dish.vendorZone}</span>
        <button class="modal-close-btn">✕</button>
      </div>
      <div>
        <h2 style="font-family: 'Outfit'; font-size: 1.35rem; font-weight: 900; color: #fff;">${dish.name}</h2>
        <p style="color: var(--fl-teal); font-size: 0.85rem; font-weight: 600;">${dish.vendorName} • <span style="color: var(--fl-yellow);">$${dish.price}</span></p>
      </div>

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
        <p style="font-size: 0.86rem; line-height: 1.45; color: #f1f5f9; margin-bottom: 8px;">${dish.description}</p>
        <div style="font-size: 0.78rem; color: var(--fl-teal); margin-bottom: 6px;">
          <strong>Flavor Notes:</strong> ${dish.flavor_profile}
        </div>
        ${pairingLine}
        ${allergenLine}
      </div>

      <div style="background: rgba(255, 94, 54, 0.08); border-left: 3px solid var(--fl-orange); padding: 8px 10px; border-radius: 4px; font-size: 0.78rem; line-height: 1.4; color: #e2e8f0;">
        <p><strong>Chef/Team:</strong> ${dish.vendorStory ? dish.vendorStory.founder : 'Artisan Culinary Team'}</p>
        <p style="color: var(--fl-yellow);"><strong>Acclaim:</strong> ${dish.vendorStory ? dish.vendorStory.claim_to_fame : ''}</p>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 6px;">
        <button class="chip-btn ${isWishlisted ? 'active' : ''}" style="flex: 1; padding: 10px; font-weight: bold;" onclick="window.app.toggleWishlist('${dish.id}')">
          ${isWishlisted ? '✓ Saved in Tasting Wishlist' : '+ Add to Tasting Wishlist'}
        </button>
        <button class="chip-btn" style="padding: 10px 14px;" onclick="window.app.openVendorById('${dish.vendorId}')">
          Full Booth Menu 📖
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  // --- VIEW 2: 3-DAY PROGRAM & STAGE EVENTS VIEW WITH WISHLIST INTEGRATION ---
  renderProgramView(container) {
    const days = (this.venue && this.venue.days) ? this.venue.days : [];
    const currentDay = days[this.activeDayIndex] || {
      date_str: 'Friday, Aug 28, 2026',
      hours: '3:00 PM – 10:00 PM',
      theme_title: 'Festival Day',
      stage_highlights: [],
      featured_categories: []
    };

    const isFirst = this.activeDayIndex === 0;
    const isLast = this.activeDayIndex === days.length - 1;

    let highlightsHtml = '';
    (currentDay.stage_highlights || []).forEach(item => {
      const isWish = this.wishlist.includes(item.id);
      const isPast = this.isPastEvent(currentDay.date_str, item.time);
      highlightsHtml += `
        <div class="stage-event-card ${isPast ? 'is-past' : ''}" onclick="window.app.openStageEventModal('${item.id}')">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="color: var(--fl-orange); font-size: 0.88rem;">${item.time}</strong>
            <span style="font-size: 0.72rem; color: var(--fl-teal); font-weight: 600;">
              ${isPast ? '<span class="past-badge">Concluded</span> ' : ''}${item.stage_name}
            </span>
          </div>
          <div style="color: #fff; font-size: 0.92rem; font-weight: 700; margin: 2px 0;">${item.title}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary);">${item.performer}</div>
          <div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; color: var(--fl-yellow);">${item.is_competition ? '🏆 Interactive Contest' : '🎵 Live Performance'}</span>
            <span style="font-size: 0.7rem; color: var(--fl-orange); font-weight: 700;">${isWish ? '✓ In Wishlist' : 'Tap for details →'}</span>
          </div>
        </div>
      `;
    });

    let catHtml = '';
    (currentDay.featured_categories || []).forEach(cat => {
      catHtml += `<span class="chip-btn" style="margin-right: 4px; margin-bottom: 4px; display: inline-block;">${cat}</span>`;
    });

    container.innerHTML = `
      <div class="day-navigator-bar">
        <button class="day-nav-btn" ${isFirst ? 'disabled' : ''} onclick="window.app.changeDay(-1)">◀</button>
        <div class="day-nav-label">
          <div class="day-nav-title">${currentDay.date_str}</div>
          <div class="day-nav-sub">${currentDay.hours}</div>
        </div>
        <button class="day-nav-btn" ${isLast ? 'disabled' : ''} onclick="window.app.changeDay(1)">▶</button>
      </div>

      <div style="background: rgba(255, 94, 54, 0.1); border-left: 3px solid var(--fl-orange); padding: 10px; border-radius: 4px; margin-bottom: 12px;">
        <strong style="color: var(--fl-yellow); font-size: 0.95rem; font-family: 'Outfit';">${currentDay.theme_title}</strong>
        <p style="font-size: 0.78rem; color: #cbd5e1; margin-top: 2px;">${currentDay.status_line}</p>
      </div>

      <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">🎤 Stage Events & Contests (Tap for details / wishlist)</h4>
      ${highlightsHtml}

      <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin: 12px 0 6px;">🥢 Active Pavilion Focus</h4>
      <div>${catHtml}</div>

      <!-- ABOUT & QR FOOTER AT BOTTOM OF PROGRAM -->
      <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <h4 style="font-size: 0.82rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">☀️ Offline Companion Guide</h4>
        <p style="font-size: 0.78rem; color: #94a3b8; line-height: 1.45; margin-bottom: 12px;">
          Eats Map is an offline-first companion guide engineered for large town-scale food festivals. Navigate 200+ vendor booths, mark your car with live GPS, track allergen flags, and build your tasting crawl wishlist.
        </p>

        <!-- Dynamic Inline Tap-to-Expand QR Card -->
        <div class="qr-footer-card" id="program-qr-card" onclick="window.app.toggleQRExpansion('program-qr-card', 'qr-canvas-program')">
          ${this.getQRCardHTML('qr-canvas-program')}
        </div>

        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 10px; text-align: center;">
          Built for FoodieLand Nashville 2026 • Open Companion Architecture
        </div>
      </div>
    `;

    setTimeout(() => {
      this.drawShareQRCode('qr-canvas-program', this.qrExpanded ? 180 : 76);
    }, 50);
  }

  changeDay(delta) {
    const days = (this.venue && this.venue.days) ? this.venue.days : [];
    const nextIndex = this.activeDayIndex + delta;
    if (nextIndex >= 0 && nextIndex < days.length) {
      this.activeDayIndex = nextIndex;
      this.updateTopBarStatus();
      this.renderProgramView(document.getElementById('viewport-content'));
    }
  }

  openStageEventModal(stageEventId) {
    let foundEvent = null;
    let foundDay = null;
    for (const d of (this.venue?.days || [])) {
      const ev = (d.stage_highlights || []).find(h => h.id === stageEventId);
      if (ev) {
        foundEvent = ev;
        foundDay = d;
        break;
      }
    }
    if (!foundEvent) return;

    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    const isWishlisted = this.wishlist.includes(foundEvent.id);

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="booth-badge">${foundEvent.time} • ${foundEvent.stage_name}</span>
        <button class="modal-close-btn">✕</button>
      </div>
      <div>
        <h2 style="font-family: 'Outfit'; font-size: 1.35rem; font-weight: 900; color: #fff;">${foundEvent.title}</h2>
        <p style="color: var(--fl-teal); font-size: 0.82rem; font-weight: 600;">Featuring: ${foundEvent.performer}</p>
        <p style="color: var(--text-secondary); font-size: 0.75rem;">${foundDay ? foundDay.date_str : ''}</p>
      </div>

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px;">
        <p style="font-size: 0.84rem; line-height: 1.45; color: #f1f5f9; margin-bottom: 8px;">${foundEvent.description}</p>
        <div style="font-size: 0.76rem; color: var(--fl-yellow);">
          ${foundEvent.is_competition ? '🏆 Open contest with festival prizes for attendees.' : '🎵 Free entry included with festival admission.'}
        </div>
      </div>

      <div style="margin-top: 10px;">
        <button class="chip-btn ${isWishlisted ? 'active' : ''}" style="width: 100%; padding: 10px; font-weight: bold;" onclick="window.app.toggleWishlist('${foundEvent.id}')">
          ${isWishlisted ? '✓ Scheduled in My Wishlist (Tap to Remove)' : '+ Add Stage Event to Wishlist'}
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  isPastEvent(dayDateStr, eventTimeStr) {
    if (!dayDateStr) return false;
    try {
      // Parse event time (e.g. '4:30 PM', '8:00 PM') and date (e.g. 'Friday, Aug 28, 2026')
      const datePart = dayDateStr.replace(/^[A-Za-z]+,\s*/, ''); // 'Aug 28, 2026'
      const dateTimeString = `${datePart} ${eventTimeStr || '11:59 PM'}`;
      const eventDate = new Date(dateTimeString);
      const now = new Date();
      if (!isNaN(eventDate.getTime())) {
        return now.getTime() > eventDate.getTime();
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  renderBoothsView(container) {
    let html = `
      <div style="margin-bottom: 10px;">
        <input type="text" id="booth-search-input" value="${this.searchQuery}" placeholder="Search dishes, chefs, or ingredients..." style="width: 100%; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 12px; color: #fff; font-size: 0.85rem; outline: none;">
      </div>
      <div class="vendor-grid">
    `;

    const filtered = (this.vendors || []).filter(v => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchCuisine = (v.cuisine || '').toLowerCase().includes(q);
      const matchDishes = (v.menu || []).some(m => m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q));
      return matchName || matchCuisine || matchDishes;
    });

    filtered.forEach(vendor => {
      const preview = (vendor.menu || []).slice(0, 2);
      html += `
        <div class="vendor-card" onclick="window.app.openVendorById('${vendor.id}')">
          <div class="vendor-card-header">
            <div>
              <strong style="color: #fff; font-size: 0.98rem;">${vendor.name}</strong>
              <div style="font-size: 0.72rem; color: var(--fl-teal);">${vendor.cuisine} • ${vendor.zone}</div>
            </div>
            <span class="booth-badge">${vendor.booth_number}</span>
          </div>
          <p style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.35; margin: 4px 0 6px;">${vendor.story ? vendor.story.claim_to_fame : ''}</p>
          <div style="border-top: 1px dashed var(--border-color); padding-top: 6px;">
            ${preview.map(d => {
              const flagged = this.checkAllergenFlags(d.allergens);
              return `
                <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:2px;">
                  <span style="color:#f1f5f9;">${d.name}</span>
                  <span style="color:var(--fl-yellow); font-weight:700;">$${d.price}</span>
                </div>
                ${flagged.length > 0 ? '<div class="allergen-warning-tag">⚠️ Contains flagged: <strong>' + flagged.join(', ') + '</strong></div>' : ''}
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    const inputEl = document.getElementById('booth-search-input');
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderBoothsView(document.getElementById('viewport-content'));
        const newInput = document.getElementById('booth-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
        }
      });
    }
  }

  toggleTempUnit() {
    this.tempUnit = this.tempUnit === 'F' ? 'C' : 'F';
    localStorage.setItem('eatsmap_temp_unit', this.tempUnit);
    this.updateTopBarStatus();
    if (this.activeViewport === 'weather') {
      this.renderWeatherView(document.getElementById('viewport-content'));
    }
  }

  formatTemp(f) {
    if (this.tempUnit === 'C') {
      const c = Math.round((f - 32) * (5 / 9));
      return `${c}°C`;
    }
    return `${f}°F`;
  }

  getWeatherIcon(conditions = '') {
    const c = conditions.toLowerCase();
    if (c.includes('sunny')) return '☀️';
    if (c.includes('clear')) return '✨';
    if (c.includes('rain') || c.includes('shower')) return '🌧️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    if (c.includes('cloud')) return '⛅';
    if (c.includes('wind') || c.includes('breezy')) return '💨';
    return '🌤️';
  }

  renderWeatherView(container) {
    const days = (this.venue && this.venue.days) ? this.venue.days : [];
    container.innerHTML = `
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <h2 style="color: #fff; font-size: 1.4rem; font-weight: 900; font-family: 'Outfit'; margin: 0; letter-spacing: -0.01em;">
            🌤️ FoodieLand 3-Day Forecast
          </h2>
          <button class="temp-unit-toggle" onclick="window.app.toggleTempUnit()" title="Click to switch between Fahrenheit and Celsius">
            °${this.tempUnit}
          </button>
        </div>
        <p style="font-size: 0.8rem; color: var(--fl-teal); margin-bottom: 14px;">
          Nashville Superspeedway • Lebanon, TN
        </p>
        
        ${days.map((d, idx) => {
          const afternoonF = d.temp_afternoon_f || 84;
          const eveningF = d.temp_evening_f || 74;
          const cond = d.conditions || d.weather.split('•')[1]?.trim() || 'Clear';
          const icon = this.getWeatherIcon(cond);
          return `
            <div class="forecast-day-card" onclick="window.app.jumpToProgramDay(${idx})" title="Tap to view ${d.date_short} full program & stage schedule">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                <strong style="color: var(--fl-orange); font-size: 0.92rem;">${d.date_str}</strong>
                <span style="color: var(--fl-yellow); font-size: 0.78rem; font-weight: 600;">${icon} ${cond}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem;">
                <span style="color: var(--text-secondary); font-size: 0.72rem;">${d.hours} • <span style="color: var(--fl-teal); font-weight: 700;">View Program →</span></span>
                <span style="font-weight: 800; font-size: 0.8rem; white-space: nowrap;">
                  <span style="color: var(--fl-yellow);">${this.formatTemp(afternoonF)} day</span>
                  <span style="color: var(--text-muted); margin: 0 4px;">•</span>
                  <span style="color: var(--fl-teal);">${this.formatTemp(eveningF)} eve</span>
                </span>
              </div>
            </div>
          `;
        }).join('')}
        
        <!-- Plain English Hydration & Safe Spot Map Focus Actions -->
        <div style="margin-top: 14px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; font-size: 0.78rem; line-height: 1.5; color: #e2e8f0;">
          <p style="margin-bottom: 8px;">
            💧 <strong>Stay Hydrated:</strong> Free refill stations are stationed across the grounds. 
            <a href="javascript:void(0)" onclick="window.app.showMapFacilityFocus('water')" style="color: var(--fl-teal); font-weight: 700; text-decoration: underline; margin-left: 4px;">
              View Water Stations on Map →
            </a>
          </p>
          <p style="margin: 0;">
            🏥 <strong>Medical & First Aid:</strong> Need medical assistance or sun relief? 
            <a href="javascript:void(0)" onclick="window.app.showMapFacilityFocus('wellness')" style="color: var(--fl-pink); font-weight: 700; text-decoration: underline; margin-left: 4px;">
              View Gate 1 First Aid Tent on Map →
            </a>
          </p>
        </div>

        <!-- Weather Source & Recent Update Footer -->
        <div style="margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted);">
          <span>📡 Source: <strong>NOAA / National Weather Service (Nashville, TN)</strong></span>
          <span style="color: var(--fl-teal);">Updated Aug 27, 12:00 PM CDT</span>
        </div>
      </div>
    `;
  }

  jumpToProgramDay(dayIndex) {
    const days = (this.venue && this.venue.days) ? this.venue.days : [];
    if (dayIndex >= 0 && dayIndex < days.length) {
      this.activeDayIndex = dayIndex;
      this.updateTopBarStatus();
      this.switchViewport('program');
    }
  }

  showMapFacilityFocus(facilityType) {
    this.switchViewport('map');
    setTimeout(() => {
      if (!this.mapManager) this.mapManager = new MapManager();
      this.mapManager.init(this.vendors, this.venue, this.carLocation, facilityType);
    }, 100);
  }

  renderVenueView(container) {
    const v = this.venue || {};
    const u = v.utility || {};
    container.innerHTML = `
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px;">
        <h3 style="color: #fff; font-size: 1.2rem; font-family: 'Outfit'; margin-bottom: 2px;">🏟️ ${v.name || 'Nashville Superspeedway'}</h3>
        <p style="font-size: 0.78rem; color: var(--fl-teal); margin-bottom: 12px;">${v.address || '400 Victory Ln Dr, Lebanon, TN'}</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem;">
          <div style="background: var(--bg-surface); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid var(--fl-green);">
            <strong>🚗 Parking:</strong> ${u.parking_info || 'Free on-site parking'}
          </div>
          <div style="background: var(--bg-surface); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid var(--fl-orange);">
            <strong>🎟️ Tickets:</strong> ${u.ticket_policy || 'Advance online purchase required.'}
          </div>
          <div style="background: var(--bg-surface); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid var(--fl-yellow);">
            <strong>🎒 Bag Policy:</strong> ${u.bag_policy || 'Clear bags recommended.'}
          </div>
          <div style="background: var(--bg-surface); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid var(--fl-pink);">
            <strong>🐾 Pets:</strong> ${u.pet_policy || 'Service animals only.'}
          </div>
        </div>

        <div style="margin-top: 14px;">
          <button class="action-share-btn" style="width: 100%;" onclick="window.app.switchViewport('map')">
            🗺️ Open Interactive Grounds GPS Map
          </button>
        </div>
      </div>
    `;
  }

  renderMapView(container) {
    container.innerHTML = '<div id="leaflet-map" style="width:100%; height:100%; border-radius:var(--radius-md);"></div>';
    setTimeout(() => {
      if (!this.mapManager) {
        this.mapManager = new MapManager();
      }
      this.mapManager.init(this.vendors, this.venue, this.carLocation);
    }, 60);
  }

  renderPassportView(container) {
    if (this.wishlist.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
          <p style="font-size: 2.2rem; margin-bottom: 6px;">⭐</p>
          <h3 style="color: #fff; margin-bottom: 4px;">Tasting Wishlist Empty</h3>
          <p style="font-size: 0.8rem;">Browse the <strong>Home Deck</strong> or <strong>Menu</strong> to queue up your must-eat dishes!</p>
        </div>
      `;
      return;
    }

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color);">
        <h3 style="color: #fff; font-size: 1rem; font-family: 'Outfit';">My Festival Tasting Queue</h3>
        <span style="font-size: 0.75rem; color: var(--fl-yellow); font-weight: 700;">${this.wishlist.length} Items</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    this.wishlist.forEach(itemId => {
      // Check if it's a food dish
      let foundDish = null;
      let foundVendor = null;
      for (const v of this.vendors) {
        const d = (v.menu || []).find(m => m.id === itemId);
        if (d) {
          foundDish = d;
          foundVendor = v;
          break;
        }
      }

      if (foundDish) {
        const userRating = this.ratings[itemId] || 0;
        const flagged = this.checkAllergenFlags(foundDish.allergens);

        html += `
          <div class="wishlist-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="color: #fff; font-size: 0.92rem; cursor: pointer;" onclick="window.app.openDishCardModal('${foundDish.id}')">${foundDish.name}</strong>
                <div style="font-size: 0.72rem; color: var(--fl-teal);">${foundVendor.name} (${foundVendor.booth_number})</div>
              </div>
              <span style="color: var(--fl-yellow); font-weight: 800; font-size: 0.85rem;">$${foundDish.price}</span>
            </div>
            ${flagged.length > 0 ? '<div class="allergen-warning-tag">⚠️ Contains: <strong>' + flagged.join(', ') + '</strong></div>' : ''}

            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 1.1rem; cursor: pointer;">
                ${[1,2,3,4,5].map(star => `
                  <span onclick="window.app.rateDish('${itemId}', ${star})">${star <= userRating ? '⭐' : '☆'}</span>
                `).join('')}
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="action-share-btn" style="padding: 4px 10px; font-size: 0.7rem;" onclick="window.app.shareTasting('${foundVendor.name}', '${foundDish.name}', ${userRating})">
                  📤 Share
                </button>
                <button class="wishlist-remove-btn" onclick="window.app.toggleWishlist('${foundDish.id}')">
                  ✕ Remove
                </button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Check if it's a stage event
      let foundStage = null;
      let foundDay = null;
      for (const d of (this.venue?.days || [])) {
        const ev = (d.stage_highlights || []).find(h => h.id === itemId);
        if (ev) {
          foundStage = ev;
          foundDay = d;
          break;
        }
      }

      if (foundStage) {
        const isPast = this.isPastEvent(foundDay?.date_str, foundStage.time);
        html += `
          <div class="wishlist-card ${isPast ? 'is-past' : ''}" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong style="color: var(--fl-orange); font-size: 0.85rem;">${foundStage.time} • ${foundStage.stage_name}</strong>
              <span style="font-size: 0.7rem; color: var(--fl-yellow);">
                ${isPast ? '<span class="past-badge">Concluded</span> ' : ''}${foundDay ? foundDay.date_short : ''}
              </span>
            </div>
            <div style="color: #fff; font-size: 0.92rem; font-weight: 700; margin: 2px 0; cursor: pointer;" onclick="window.app.openStageEventModal('${foundStage.id}')">${foundStage.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">${foundStage.performer}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.7rem; color: var(--fl-teal);">🎤 Stage Event</span>
              <button class="wishlist-remove-btn" onclick="window.app.toggleWishlist('${foundStage.id}')">
                ✕ Remove
              </button>
            </div>
          </div>
        `;
      }
    });

    html += '</div>';
    container.innerHTML = html;
  }

  renderAboutView(container) {
    container.innerHTML = `
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px;">
        <h3 style="color: #fff; font-size: 1.2rem; font-family: 'Outfit'; margin-bottom: 4px;">☀️ About Eats Map</h3>
        <p style="font-size: 0.8rem; color: var(--fl-teal); margin-bottom: 12px;">Offline Companion Guide for FoodieLand Nashville 2026</p>
        
        <p style="font-size: 0.82rem; line-height: 1.45; color: #cbd5e1; margin-bottom: 10px;">
          Eats Map transforms town and festival grounds into an interactive, offline-ready companion. Treat top chefs, popup creators, and food stalls with the deep heritage and spotlight they deserve.
        </p>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-md); font-size: 0.76rem; color: #94a3b8; line-height: 1.4; margin-bottom: 14px;">
          <strong style="color: #fff; display: block; margin-bottom: 4px;">Features:</strong>
          • <strong>Now Playing List & Map</strong>: Fast visual dish browse<br>
          • <strong>Dish Cards</strong>: Detailed culinary profiles, flavor notes & pairings<br>
          • <strong>3-Day Program</strong>: Shift between festival dates with stage events<br>
          • <strong>Synced Car Marker</strong>: Real GPS tracking that alerts on permission status<br>
          • <strong>Allergen Highlighting</strong>: In-line warnings without hiding options
        </div>

        <!-- Dynamic Inline Tap-to-Expand QR Card -->
        <div class="qr-footer-card" id="about-qr-card" onclick="window.app.toggleQRExpansion('about-qr-card', 'qr-canvas-about')">
          ${this.getQRCardHTML('qr-canvas-about')}
        </div>

        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 14px; text-align: center; line-height: 1.4;">
          <strong>Open Source & Local First</strong><br>
          Designed with Sun Map layout specs • MIT License
        </div>
      </div>
    `;

    setTimeout(() => {
      this.drawShareQRCode('qr-canvas-about', this.qrExpanded ? 180 : 76);
    }, 50);
  }

  // --- HELPER: Dynamic QR Card Markup Generation ---
  getQRCardHTML(canvasId) {
    if (this.qrExpanded) {
      return `
        <div class="qr-footer-expanded">
          <div class="qr-canvas-box">
            <canvas id="${canvasId}" width="180" height="180"></canvas>
          </div>
          <div class="qr-brand-title">SUN MAP</div>
          <div class="qr-subtext">Scan with any phone camera to install companion app offline. Tap to minimize.</div>
        </div>
      `;
    }

    return `
      <div class="qr-footer-compact">
        <div class="qr-canvas-box">
          <canvas id="${canvasId}" width="76" height="76"></canvas>
        </div>
        <div class="qr-label-compact">
          <div class="qr-brand-title">SUN MAP</div>
          <div class="qr-subtext">Offline Guide</div>
          <div class="qr-hint">Tap QR to enlarge & unwrap →</div>
        </div>
      </div>
    `;
  }

  toggleQRExpansion(cardContainerId, canvasId) {
    this.qrExpanded = !this.qrExpanded;
    const cardEl = document.getElementById(cardContainerId);
    if (cardEl) {
      cardEl.innerHTML = this.getQRCardHTML(canvasId);
      setTimeout(() => {
        this.drawShareQRCode(canvasId, this.qrExpanded ? 180 : 76);
      }, 30);
    }
  }

  openVendorById(vendorId) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (vendor) this.openVendorModal(vendor);
  }

  openVendorModal(vendor) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    let menuHtml = '';
    (vendor.menu || []).forEach(dish => {
      const isWishlisted = this.wishlist.includes(dish.id);
      const flagged = this.checkAllergenFlags(dish.allergens);
      menuHtml += `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h4 style="font-size: 0.95rem; color: #fff;">${dish.name}</h4>
            <span style="color: var(--fl-yellow); font-weight: 800;">$${dish.price}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 4px 0;">${dish.description}</p>
          <div style="font-size: 0.72rem; color: var(--fl-teal); margin-bottom: 4px;">
            <strong>Flavor Profile:</strong> ${dish.flavor_profile}
          </div>
          ${dish.pairings ? '<div style="font-size: 0.72rem; color: var(--text-muted);"><strong>Pairs With:</strong> ' + dish.pairings + '</div>' : ''}
          ${flagged.length > 0 ? '<div class="allergen-warning-tag" style="margin-top: 4px;">⚠️ Flagged Ingredient: <strong>' + flagged.join(', ') + '</strong></div>' : ''}
          <div style="margin-top: 8px;">
            <button class="chip-btn ${isWishlisted ? 'active' : ''}" style="width: 100%; padding: 6px;" onclick="window.app.toggleWishlist('${dish.id}')">
              ${isWishlisted ? '✓ Saved in Wishlist' : '+ Add to Wishlist'}
            </button>
          </div>
        </div>
      `;
    });

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="booth-badge">${vendor.booth_number} • ${vendor.zone}</span>
        <button class="modal-close-btn">✕</button>
      </div>
      <div>
        <h2 style="font-family: 'Outfit'; font-size: 1.35rem; font-weight: 900; color: #fff;">${vendor.name}</h2>
        <p style="color: var(--fl-teal); font-size: 0.8rem; font-weight: 600;">${vendor.cuisine} | From: ${vendor.story ? vendor.story.origin : ''}</p>
      </div>

      <div style="background: rgba(255, 94, 54, 0.08); border-left: 3px solid var(--fl-orange); padding: 8px 10px; border-radius: 4px; font-size: 0.78rem; line-height: 1.4; color: #e2e8f0;">
        <p><strong>Chef/Team:</strong> ${vendor.story ? vendor.story.founder : ''}</p>
        <p style="margin: 2px 0;">${vendor.story ? vendor.story.heritage : ''}</p>
        <p style="color: var(--fl-yellow);"><strong>Acclaim:</strong> ${vendor.story ? vendor.story.claim_to_fame : ''}</p>
      </div>

      <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin-top: 6px;">Featured Creations</h4>
      ${menuHtml}
    `;

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.classList.remove('active');
  }

  toggleWishlist(dishId) {
    if (this.wishlist.includes(dishId)) {
      this.wishlist = this.wishlist.filter(id => id !== dishId);
    } else {
      this.wishlist.push(dishId);
    }
    localStorage.setItem('eatsmap_wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistBadge();
    
    if (this.activeViewport === 'home' || this.activeViewport === 'passport') {
      this.renderActiveViewport();
    }
  }

  rateDish(dishId, rating) {
    this.ratings[dishId] = rating;
    localStorage.setItem('eatsmap_ratings', JSON.stringify(this.ratings));
    this.renderPassportView(document.getElementById('viewport-content'));
  }

  shareTasting(vendorName, dishName, rating) {
    const stars = rating > 0 ? '⭐'.repeat(rating) : 'Must Try!';
    const shareText = 'Tasting at FoodieLand Nashville 2026: Tried ' + dishName + ' at ' + vendorName + '! ' + stars + ' #FoodieLand #EatsMap';
    
    if (navigator.share) {
      navigator.share({
        title: 'FoodieLand Review: ' + dishName,
        text: shareText
      }).catch(err => console.log('Share dismissed:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Review reaction copied to clipboard!');
    }
  }

  // --- QR CODE SHARING MODAL ---
  openShareQRModal() {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: var(--fl-orange); font-size: 0.95rem; font-family: 'Outfit';">Share Eats Map Offline App</strong>
        <button class="modal-close-btn">✕</button>
      </div>
      <div style="text-align: center; padding: 12px 0 6px;">
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
          Point any smartphone camera to launch the offline companion guide at FoodieLand!
        </p>
        <div style="background: #ffffff; padding: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <canvas id="qr-canvas" width="180" height="180"></canvas>
        </div>
        <div style="color: #cbd5e1; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px;">
          Offline Festival PWA
        </div>
      </div>
    `;

    modal.classList.add('active');
    setTimeout(() => this.drawShareQRCode('qr-canvas'), 50);
  }

  drawShareQRCode(canvasId, targetSize = 180) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = targetSize;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#10121a';
    const finderSize = Math.max(16, Math.floor(size * 0.25));
    const padding = Math.max(4, Math.floor(size * 0.05));

    this.drawFinderPattern(ctx, padding, padding, finderSize);
    this.drawFinderPattern(ctx, size - finderSize - padding, padding, finderSize);
    this.drawFinderPattern(ctx, padding, size - finderSize - padding, finderSize);

    const blockSize = Math.max(3, Math.floor(size / 36));
    const numBlocks = Math.floor(size / blockSize);

    for (let x = 0; x < numBlocks; x++) {
      for (let y = 0; y < numBlocks; y++) {
        const isTopLeft = (x < 12 && y < 12);
        const isTopRight = (x > numBlocks - 13 && y < 12);
        const isBottomLeft = (x < 12 && y > numBlocks - 13);
        
        if (!isTopLeft && !isTopRight && !isBottomLeft) {
          const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const rand = seed - Math.floor(seed);
          if (rand > 0.46) {
            ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
          }
        }
      }
    }
  }

  drawFinderPattern(ctx, x, y, size) {
    ctx.fillStyle = '#10121a';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
    ctx.fillStyle = '#10121a';
    ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new EatsMapApp();
  window.app.init();
});