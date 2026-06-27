// Sun Map: PWA Core Client logic

// Helper to strip JSONC comments so standard JSON.parse works
function parseJSONC(jsoncText) {
  // Remove single line comments
  let cleaned = jsoncText.replace(/\/\/.*$/gm, '');
  // Remove block comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  return JSON.parse(cleaned);
}

// Data State Cache
const state = {
  activeArtistId: 'artist:young-the-giant',
  activeBandName: 'Young the Giant',
  songs: [],
  activeSongIndex: 0,
  venue: null,
  event: null,
  transit: null,
  sentiment: null,
  tourHistory: null,
  timelines: []
};

// Loading transition wrapper
function triggerTransition(callback) {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');
  setTimeout(() => {
    callback();
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 300); // fade out static
  }, 600); // show static noise
}

// Load Core Data from bundles/ & fill-data/
async function loadCorpusData() {
  try {
    // 1. Fetch Venue
    const venueRes = await fetch('bundles/venues/venue-ascend-federal-credit-union-amphitheater.jsonc');
    const venueText = await venueRes.text();
    state.venue = parseJSONC(venueText);

    // 2. Fetch Event
    const eventRes = await fetch('bundles/events/event-young-the-giant-nashville-2026-06-27.jsonc');
    const eventText = await eventRes.text();
    state.event = parseJSONC(eventText);

    // 3. Fetch Transit Options & Tour History (Raw Fill-data)
    const transitRes = await fetch('fill-data/venue/nashville-transit-parking-options.json');
    state.transit = await transitRes.json();

    const tourRes = await fetch('fill-data/event/victory-garden-tour-history.json');
    state.tourHistory = await tourRes.json();

    const sentimentRes = await fetch('fill-data/band/young-the-giant-song-sentiment.json');
    state.sentiment = await sentimentRes.json();

    // 4. Set default lyrics list based on current active band
    await loadArtistSonglist();
    
    // Initial Render
    renderDashboardMetadata();
    renderCurrentSong();
    setupActiveBandDetector();

  } catch (error) {
    console.error("Error loading event corpus data:", error);
  }
}

// Fetch and load song schemas for the active band
async function loadArtistSonglist() {
  state.songs = [];
  const activeSlug = state.activeArtistId.split(':')[1];
  
  if (activeSlug === 'young-the-giant') {
    // Load YTG songs
    const songlist = [
      "evergreen", "superposition", "bitter-fruit", "apartment", "repeat", 
      "mr-know-it-all", "dancing-in-the-rain", "already-there", "something-to-believe-in", 
      "garands", "mona-lisa", "this-too-shall-pass", "ships-passing", 
      "different-kind-of-love", "my-body", "teachers", "the-garden", 
      "cough-syrup", "the-walk-home", "mind-over-matter"
    ];
    for (const song of songlist) {
      try {
        const res = await fetch(`bundles/songs/song-young-the-giant-${song}.jsonc`);
        const text = await res.text();
        state.songs.push(parseJSONC(text));
      } catch(e) {
        console.warn("Failed to load song:", song, e);
      }
    }
  } else {
    // Load Cold War Kids songs
    const songlist = [
      "all-this-could-be-yours", "can-we-hang-on", "first", "hang-me-up-to-dry",
      "hospital-beds", "love-is-mystical", "miracle-mile", "push-my-luck",
      "run-away-with-me", "so-tied-up", "something-is-not-right-with-me",
      "there-goes-the-night", "we-used-to-vacation", "what-you-say",
      "whos-gonna-love-me-now"
    ];
    for (const song of songlist) {
      try {
        const res = await fetch(`bundles/songs/song-cold-war-kids-${song}.jsonc`);
        const text = await res.text();
        state.songs.push(parseJSONC(text));
      } catch(e) {
        console.warn("Failed to load song:", song, e);
      }
    }
  }
  state.activeSongIndex = 0;
}

// Render Top and Bottom button values
function renderDashboardMetadata() {
  if (!state.venue || !state.event) return;

  // Venue metadata
  document.getElementById('venue-status').textContent = state.venue.display_name;
  
  // Weather status & alerts
  if (state.event.weather) {
    document.getElementById('weather-status').textContent = `${state.event.weather.temp_f_high}°F / ${state.event.weather.conditions}`;
    document.getElementById('alert-text').textContent = state.event.weather.forecast_summary;
  }
  
  // Timeline schedule text
  document.getElementById('timeline-status').textContent = `Doors: ${state.event.doors_time}`;
}

// Auto-switch active band based on approximate time-of-day
function setupActiveBandDetector() {
  // Simulate time-of-day checks
  const hour = new Date().getHours();
  // Assume Cold War Kids plays around 18:30 - 19:30
  // Young the Giant plays 20:00 - 22:00
  const bandBtnTitle = document.getElementById('band-btn-title');
  const bandBtnSubtitle = document.getElementById('band-btn-subtitle');
  const bandBtnIcon = document.getElementById('band-btn-icon');

  if (hour >= 18 && hour < 20) {
    state.activeArtistId = 'artist:cold-war-kids';
    state.activeBandName = 'Cold War Kids';
    bandBtnIcon.textContent = '🎹';
  } else {
    state.activeArtistId = 'artist:young-the-giant';
    state.activeBandName = 'Young the Giant';
    bandBtnIcon.textContent = '🎸';
  }
  
  bandBtnTitle.textContent = "Live Now";
  bandBtnSubtitle.textContent = state.activeBandName;
}

// Render the Karaoke Lyrics interface in the center viewport
function renderCurrentSong() {
  if (state.songs.length === 0) return;
  const song = state.songs[state.activeSongIndex];
  
  // Apply band theme color palettes to center panel
  const viewport = document.getElementById('main-viewport');
  viewport.className = 'viewport-square'; // reset
  if (state.activeArtistId === 'artist:young-the-giant') {
    viewport.classList.add('theme-ytg');
  } else {
    viewport.classList.add('theme-cwk');
  }

  // Find song sentiment crowd behaviors
  let crowdNote = "Focus on the performance!";
  if (state.sentiment && state.sentiment.songs) {
    const songSent = state.sentiment.songs.find(s => s.song_slug === song.slug);
    if (songSent) crowdNote = songSent.crowd_interaction;
  }

  // Build options list for Track Jumplist
  let optionsHTML = '';
  state.songs.forEach((s, idx) => {
    const isSelected = idx === state.activeSongIndex ? 'selected' : '';
    optionsHTML += `<option value="${idx}" ${isSelected}>${idx + 1}. ${s.display_name}</option>`;
  });

  const content = document.getElementById('viewport-content');
  content.innerHTML = `
    <div class="lyrics-view">
      <div class="song-header">
        <h1>${song.display_name}</h1>
        <p>${state.activeBandName} &bull; ${song.musicality?.canonical_key || 'C Major'} &bull; ${song.musicality?.tempo_bpm || 110} BPM</p>
      </div>
      
      <div class="lyrics-body" id="lyrics-scroll">
        <p class="lyrics-line active">🎵 Projected Live Note: 🎵</p>
        <p class="lyrics-line sing-along active" style="font-size: 1.1rem; line-height: 1.4; margin: 8px 0;">"${crowdNote}"</p>
        
        <div style="margin-top: 20px; font-size: 0.8rem; font-family: 'Inter', sans-serif;">
          <label for="track-select" style="display:block; margin-bottom:6px; text-transform:uppercase; font-weight:700; color:var(--text-secondary);">Select Active Song:</label>
          <select id="track-select" style="width:100%; padding:10px; background:#222; border:1px solid #44; color:#fff; border-radius:6px; font-family:'Inter', sans-serif;">
            ${optionsHTML}
          </select>
        </div>

        <div style="margin-top: 24px; display:flex; flex-direction:column; gap:10px; font-size:0.8rem; font-family:'Inter', sans-serif;">
          <a href="https://www.setlist.fm/setlists/young-the-giant-7bd2cea0.html" target="_blank" style="color:#ff5722; text-decoration:none; font-weight:700;">🌐 View All Known Live Songs ↗</a>
          <button id="btn-share-trigger" style="background:transparent; border:1px dashed #666; color:#aaa; padding:8px; border-radius:6px; cursor:pointer;">📲 Share App (Show QR Code)</button>
        </div>
      </div>
      
      <div class="song-controller" style="justify-content: center; gap: 20px;">
        <button class="ctrl-btn" id="btn-prev-song">◀</button>
        <span class="song-index" style="font-family:'Courier Prime', monospace;">${state.activeSongIndex + 1} / ${state.songs.length}</span>
        <button class="ctrl-btn" id="btn-next-song">▶</button>
      </div>
    </div>
  `;

  // Bind controls
  document.getElementById('btn-prev-song').addEventListener('click', () => {
    state.activeSongIndex = (state.activeSongIndex - 1 + state.songs.length) % state.songs.length;
    triggerTransition(renderCurrentSong);
  });
  document.getElementById('btn-next-song').addEventListener('click', () => {
    state.activeSongIndex = (state.activeSongIndex + 1) % state.songs.length;
    triggerTransition(renderCurrentSong);
  });

  // Track Selector Change Event
  document.getElementById('track-select').addEventListener('change', (e) => {
    state.activeSongIndex = parseInt(e.target.value);
    triggerTransition(renderCurrentSong);
  });

  // Share Dialog Event
  document.getElementById('btn-share-trigger').addEventListener('click', () => {
    const menuModal = document.getElementById('share-modal');
    generateShareQRCode();
    menuModal.classList.add('active');
  });
}

// ----------------------------------------
// BUTTON TASK CLICKS & TEMPLATE RENDERING
// ----------------------------------------

// Render Weather Card
document.getElementById('btn-weather').addEventListener('click', () => {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-utility';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Weather Forecast</h2>
        <h3>NOAA Alert</h3>
        <p style="color:#ff9f0a; font-weight:700;">⚠️ FLOOD WATCH active from 7:00 AM June 27 to 7:00 AM June 28.</p>
        <h3>Hourly Outlook</h3>
        <ul>
          <li><strong>High Forecast:</strong> ${state.event?.weather?.temp_f_high || 89}°F</li>
          <li><strong>Low Forecast:</strong> ${state.event?.weather?.temp_f_low || 74}°F</li>
          <li><strong>Conditions:</strong> ${state.event?.weather?.conditions || 'Showers & Thunderstorms'}</li>
          <li><strong>Precipitation:</strong> 80% chance of heavy downpours.</li>
        </ul>
        <p style="font-size:0.75rem; margin-top:14px; color:var(--text-secondary);">Source: NOAA point forecast mapclick</p>
      </div>
    `;
  });
});

// Render Venue Card
document.getElementById('btn-venue').addEventListener('click', () => {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-venue';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Venue Policies & Transit</h2>
        <h3>Bag Guidelines</h3>
        <ul>
          <li><strong>Clear Bags:</strong> Max dimensions 12" x 6" x 12"</li>
          <li><strong>Clutches (Non-clear):</strong> Max dimensions 6" x 9"</li>
        </ul>
        <h3>Parking & Walking Route</h3>
        <p><strong>Nissan Stadium Walkway:</strong> Park at Nissan Stadium East Bank Lot, walk ~0.6 miles over the Seigenthaler Pedestrian Bridge directly to the gates (~15 min walk).</p>
        <h3>Restroom Points</h3>
        <p>Main plazas on East and West flanks of the lawn. VIP restrooms behind stage left boxes.</p>
      </div>
    `;
  });
});

// Render Timeline Schedule Card
document.getElementById('btn-timeline').addEventListener('click', () => {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-utility';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Projected Program</h2>
        <div class="timeline-item">
          <div class="time-slot">17:00</div>
          <div class="event-details">
            <strong>Gates & Doors Open</strong>
            <p>Security clearance, clear bag checks start.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="time-slot">18:30</div>
          <div class="event-details">
            <strong>Cold War Kids Set</strong>
            <p>20th Anniversary performance of "Robbers & Cowards" in full.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="time-slot">20:00</div>
          <div class="event-details">
            <strong>Young the Giant Set</strong>
            <p>Headline performance (Victory Garden Tour).</p>
          </div>
        </div>
      </div>
    `;
  });
});

// Render Band Detail Card
document.getElementById('btn-band').addEventListener('click', () => {
  triggerTransition(async () => {
    const viewport = document.getElementById('main-viewport');
    const content = document.getElementById('viewport-content');
    
    if (state.activeArtistId === 'artist:young-the-giant') {
      viewport.className = 'viewport-square theme-ytg';
      content.innerHTML = `
        <div class="details-view">
          <h2>Young the Giant</h2>
          <p><strong>Origin:</strong> Irvine, California (Active since 2004)</p>
          <p><strong>Genre:</strong> Indie Rock, Alternative Rock</p>
          <h3>Members & Gear Details</h3>
          <ul>
            <li><strong>Sameer Gadhia:</strong> Lead vocals, micro-KORG synth</li>
            <li><strong>Jacob Tilley:</strong> Guitar, delay loop pedals</li>
            <li><strong>Eric Cannata:</strong> Guitar, backing vocal harmonies</li>
            <li><strong>Payam Doostzadeh:</strong> Bass guitar</li>
            <li><strong>Francois Comtois:</strong> Drums, percussion pads</li>
          </ul>
        </div>
      `;
    } else {
      viewport.className = 'viewport-square theme-cwk';
      content.innerHTML = `
        <div class="details-view">
          <h2>Cold War Kids</h2>
          <p><strong>Origin:</strong> Fullerton, California (Active since 2004)</p>
          <p><strong>Genre:</strong> Blues-influenced Indie Rock</p>
          <h3>20th Anniversary Details</h3>
          <p>Performing their landmark debut album <em>Robbers & Cowards</em> in full, including "Hang Me Up to Dry" and "Hospital Beds".</p>
        </div>
      `;
    }
  });
});

// Render Tour Ethos Card
document.getElementById('btn-tour').addEventListener('click', () => {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-tour';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Victory Garden Tour</h2>
        <h3>Tour Creed & REVERB</h3>
        <p>The 2026 tour partners with <strong>REVERB</strong> to combat food insecurity and fund community-based carbon reduction. The album represents <em>"caring through chaos"</em> and treating hope as something to be planted, tended, and fought for.</p>
        <h3>Event Creed & Cause</h3>
        <p><strong>Local Watershed Protection:</strong> A portion of tonight's proceeds goes to the Cumberland River Compact to protect Tennessee's local water resources and natural habitats.</p>
        <h3>Duet & Guest Features</h3>
        <p>Prior shows featured a Darren Criss surprise duet in NYC. Watch the stage tonight for local guest features!</p>
      </div>
    `;
  });
});

// Reset Viewport back to main song lyrics when Sun Home is clicked
document.getElementById('btn-home').addEventListener('click', () => {
  triggerTransition(renderCurrentSong);
});

// Modal Dismiss Events
document.getElementById('btn-close-share').addEventListener('click', () => {
  document.getElementById('share-modal').classList.remove('active');
  triggerTransition(renderCurrentSong);
});

// ----------------------------------------
// OFFLINE QR CODE CANVAS RENDER (Pure JS)
// ----------------------------------------
function generateShareQRCode() {
  const canvas = document.getElementById('qr-canvas');
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  // Clear Canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw QR Finder Patterns (Corners)
  ctx.fillStyle = '#121212';
  
  // Top-Left Finder
  drawFinderPattern(ctx, 10, 10, 45);
  // Top-Right Finder
  drawFinderPattern(ctx, size - 55, 10, 45);
  // Bottom-Left Finder
  drawFinderPattern(ctx, 10, size - 55, 45);

  // Draw some pseudo-random binary QR-code blocks for the POC
  ctx.fillStyle = '#121212';
  const blockSize = 5;
  const numBlocks = size / blockSize;

  for (let x = 0; x < numBlocks; x++) {
    for (let y = 0; y < numBlocks; y++) {
      // Avoid overwriting the corner finder zones
      const isTopLeft = (x < 12 && y < 12);
      const isTopRight = (x > numBlocks - 13 && y < 12);
      const isBottomLeft = (x < 12 && y > numBlocks - 13);
      
      if (!isTopLeft && !isTopRight && !isBottomLeft) {
        // Draw pseudo-random dot grids
        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        if (rand > 0.45) {
          ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    }
  }
}

function drawFinderPattern(ctx, x, y, size) {
  ctx.fillStyle = '#121212';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
  ctx.fillStyle = '#121212';
  ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
}

// Modal Dismiss Events
document.getElementById('btn-close-share').addEventListener('click', () => {
  document.getElementById('share-modal').classList.remove('active');
  // Reset viewport back to lyrics mode on menu close
  triggerTransition(renderCurrentSong);
});

// PWA Install Event Handler
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('btn-install-pwa').style.display = 'block';
});

document.getElementById('btn-install-pwa').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User installed Sun Map PWA');
    }
    deferredPrompt = null;
  }
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  loadCorpusData();
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered successfully', reg))
      .catch(err => console.warn('Service Worker registration failed', err));
  }
});
