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
    this.wishlist = JSON.parse(localStorage.getItem('eatsmap_wishlist') || '[]');
    this.ratings = JSON.parse(localStorage.getItem('eatsmap_ratings') || '{}');
    this.carLocation = JSON.parse(localStorage.getItem('eatsmap_car') || 'null');
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

    document.getElementById('btn-home').addEventListener('click', () => this.switchViewport('home'));
    document.getElementById('btn-booths').addEventListener('click', () => this.switchViewport('booths'));
    document.getElementById('btn-passport').addEventListener('click', () => this.switchViewport('passport'));
    document.getElementById('btn-foot-map').addEventListener('click', () => this.switchViewport('map'));
    document.getElementById('btn-foot-help').addEventListener('click', () => this.switchViewport('about'));

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
        if (this.avoidedAllergens.includes(allergen)) {
          this.avoidedAllergens = this.avoidedAllergens.filter(a => a !== allergen);
        } else {
          this.avoidedAllergens.push(allergen);
        }
        localStorage.setItem('eatsmap_allergens', JSON.stringify(this.avoidedAllergens));
        this.renderAllergenChips();
        this.renderActiveViewport();
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

  switchViewport(view) {
    this.closeAllergenPanel();
    this.activeViewport = view;
    document.querySelectorAll('.top-btn, .bottom-btn').forEach(btn => btn.classList.remove('active'));
    if (view === 'weather') document.getElementById('btn-weather')?.classList.add('active');
    if (view === 'venue') document.getElementById('btn-venue')?.classList.add('active');
    if (view === 'program') document.getElementById('btn-timeline')?.classList.add('active');
    if (view === 'home') document.getElementById('btn-home')?.classList.add('active');
    if (view === 'booths') document.getElementById('btn-booths')?.classList.add('active');
    if (view === 'passport') document.getElementById('btn-passport')?.classList.add('active');

    this.renderActiveViewport();
  }

  renderAllergenChips() {
    document.querySelectorAll('#allergen-chips-tray .chip-btn').forEach(chip => {
      const allergen = chip.dataset.allergen;
      chip.classList.toggle('active', this.avoidedAllergens.includes(allergen));
    });
    
    const count = this.avoidedAllergens.length;
    const badgeEl = document.getElementById('active-avoid-badge');
    if (badgeEl) {
      badgeEl.textContent = count > 0 ? count + ' active' : '0';
      badgeEl.classList.toggle('has-active', count > 0);
    }
  }

  checkAllergenFlags(itemAllergens = []) {
    return (itemAllergens || []).filter(a => this.avoidedAllergens.includes(a));
  }

  updateTopBarStatus() {
    if (!this.venue || !this.venue.days) return;
    const currentDay = this.venue.days[this.activeDayIndex];
    if (currentDay) {
      const timelineStatus = document.getElementById('timeline-status');
      if (timelineStatus) timelineStatus.textContent = currentDay.date_short;
      const weatherStatus = document.getElementById('weather-status');
      if (weatherStatus) weatherStatus.textContent = currentDay.weather.split('•')[0].trim();
    }
  }

  updateWishlistBadge() {
    const badge = document.getElementById('wishlist-sub-label');
    if (badge) badge.textContent = this.wishlist.length + ' Queued';
  }

  // --- CAR BUTTON LOGIC: Dynamic Text Toggle Synced to Real GPS Location ---
  updateCarButtonStatus() {
    const carTextEl = document.getElementById('btn-car-text');
    const carBtn = document.getElementById('btn-venue-car');
    if (this.carLocation && typeof this.carLocation.lat === 'number') {
      if (carTextEl) carTextEl.textContent = 'Find my car';
      if (carBtn) carBtn.classList.add('car-saved');
    } else {
      if (carTextEl) carTextEl.textContent = 'Mark my car';
      if (carBtn) carBtn.classList.remove('car-saved');
    }
  }

  handleCarButtonClick() {
    if (this.carLocation && typeof this.carLocation.lat === 'number') {
      // Car is already marked -> View on map with navigation guide
      this.switchViewport('map');
      setTimeout(() => {
        if (this.mapManager) {
          this.mapManager.updateCarPin(this.carLocation);
        }
      }, 100);
      return;
    }

    // No car marked yet -> Request GPS and save only on real success
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const carTextEl = document.getElementById('btn-car-text');
    if (carTextEl) carTextEl.textContent = 'Locating...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.carLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        localStorage.setItem('eatsmap_car', JSON.stringify(this.carLocation));
        this.updateCarButtonStatus();
        alert('🚗 Car spot marked successfully at your exact GPS coordinates!');
        if (this.mapManager && this.activeViewport === 'map') {
          this.mapManager.updateCarPin(this.carLocation);
        }
      },
      (err) => {
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
      const itemFlagged = this.checkAllergenFlags(d.allergens);
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
    const flagged = this.checkAllergenFlags(dish.allergens);

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
      highlightsHtml += `
        <div class="stage-event-card" onclick="window.app.openStageEventModal('${item.id}')">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="color: var(--fl-orange); font-size: 0.88rem;">${item.time}</strong>
            <span style="font-size: 0.72rem; color: var(--fl-teal); font-weight: 600;">${item.stage_name}</span>
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
          ${isWishlisted ? '✓ Scheduled in My Wishlist' : '+ Add Stage Event to Wishlist'}
        </button>
      </div>
    `;

    modal.classList.add('active');
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

  renderWeatherView(container) {
    const days = (this.venue && this.venue.days) ? this.venue.days : [];
    container.innerHTML = `
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px;">
        <h3 style="color: #fff; font-size: 1.2rem; font-family: 'Outfit'; margin-bottom: 6px;">🌤️ FoodieLand 3-Day Forecast</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 14px;">Nashville Superspeedway • Lebanon, TN</p>
        
        ${days.map(d => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-surface); border-radius: var(--radius-md); margin-bottom: 8px; border: 1px solid var(--border-color);">
            <div>
              <strong style="color: var(--fl-orange); font-size: 0.9rem;">${d.date_str}</strong>
              <div style="font-size: 0.74rem; color: var(--text-secondary);">Hours: ${d.hours}</div>
            </div>
            <span style="color: var(--fl-yellow); font-weight: 700; font-size: 0.85rem;">${d.weather}</span>
          </div>
        `).join('')}
        
        <div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
          💡 <strong>Pro Tip:</strong> Evening night-market hours (6:00 PM – 10:00 PM) offer cooler breezes and twilight neon vibes. Stay hydrated at free water stations!
        </div>
      </div>
    `;
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
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="color: #fff; font-size: 0.92rem;">${foundDish.name}</strong>
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
              <button class="action-share-btn" style="padding: 4px 10px; font-size: 0.7rem;" onclick="window.app.shareTasting('${foundVendor.name}', '${foundDish.name}', ${userRating})">
                📤 Share
              </button>
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
        html += `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong style="color: var(--fl-orange); font-size: 0.85rem;">${foundStage.time} • ${foundStage.stage_name}</strong>
              <span style="font-size: 0.7rem; color: var(--fl-yellow);">${foundDay ? foundDay.date_short : ''}</span>
            </div>
            <div style="color: #fff; font-size: 0.92rem; font-weight: 700; margin: 2px 0;">${foundStage.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">${foundStage.performer}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.7rem; color: var(--fl-teal);">🎤 Stage Event</span>
              <button class="chip-btn" style="padding: 4px 8px; font-size: 0.68rem;" onclick="window.app.toggleWishlist('${foundStage.id}')">Remove ✕</button>
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