// Sun Map: PWA Core Client logic

// Helper to strip JSONC comments so standard JSON.parse works
function parseJSONC(jsoncText) {
  let cleaned = jsoncText.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  return JSON.parse(cleaned);
}

// Actual Song Lyrics snippets for visual test
const songLyricsDb = {
  "superposition": [
    "Is it desire, or is it love that I'm feeling?",
    "Anyway you want it, that's the way it will be.",
    "<strong>(Sing along!)</strong> In a superposition,",
    "Magnets pull the iron, but we're pulling each other."
  ],
  "cough-syrup": [
    "Life's too short to even care at all, oh",
    "I'm losing my mind, losing my mind, losing control",
    "These feelings she can't shake, hot and cold, baby blue",
    "A fish in the water is lost without dry land",
    "One more spoon of cough syrup now, oh",
    "A dark world aches for a splash of the sun"
  ],
  "my-body": [
    "My body tells me no, but I won't listen to it.",
    "<strong>(Crowd jump!)</strong> My body tells me no, but I won't give in.",
    "I'm not on trial, I've got nothing to prove.",
    "I'll make you make me, I'll make you make me move!"
  ],
  "hang-me-up-to-dry": [
    "Hang me up to dry, you've got your arms around my neck.",
    "<strong>(Bass groove!)</strong> Hang me up to dry, we'll let it drop.",
    "Now you're doing dishes, and you're making the bed.",
    "I'm a white shirt, in a pile of colors."
  ]
};

// Array of short, punchy quotes and facts for the auto-shuffling idle text block
const factoids = [
  "Sameer's first keyboard was a mini Casio he bought at a garage sale.",
  "The 'Victory Garden' album was recorded entirely in a converted greenhouse.",
  "Jacob Tilley builds guitar delay loop pedals by hand under a secret brand.",
  "Cold War Kids recorded 'Robbers & Cowards' in only 9 days inside Fullerton.",
  "almost monday got their name after an apartment lease was signed on a Tuesday.",
  "REVERB has eliminated over 300,000 single-use plastic bottles on this run.",
  "Nissan Stadium parking Lot R sits directly across the river from the stage.",
  "The Seigenthaler Pedestrian Bridge is one of the longest truss bridges in the US.",
  "Sameer Gadhia speaks three languages fluently and writes lyrics in two.",
  "Cold War Kids' name was inspired by a poem written by a friend in 2002.",
  "almost monday's surf pop guitar sound uses spring-reverb tanks from the 1960s."
];

// Evolved Band profiles for Switcher transport (KennyHoopla is kept for safeguard, but hidden from switcher count)
const bandsList = [
  { id: 'artist:almost-monday', name: 'almost monday', display_name: 'almost monday', origin: 'San Diego, CA', genre: 'Surf Pop', theme: 'theme-venue', bio: 'San Diego surf-pop trio brings sun-drenched indie pop and funky basslines to the opening slot. confirmed by Hollywood Records, their run wraps tonight.' },
  { id: 'artist:cold-war-kids', name: 'Cold War Kids', display_name: 'Cold War Kids', origin: 'Fullerton, CA', genre: 'Blues Indie Rock', theme: 'theme-cwk', bio: 'Performing their landmark debut album Robbers & Cowards in full to celebrate its 20th anniversary, including Hang Me Up to Dry.' },
  { id: 'artist:young-the-giant', name: 'Young the Giant', display_name: 'Young the Giant', origin: 'Irvine, CA', genre: 'Alternative Rock', theme: 'theme-ytg', bio: 'Headline performance of their Victory Garden Tour. Rooted in the themes of radical empathy, resilience, and caring through chaos.' },
  { id: 'artist:kennyhoopla', name: 'KennyHoopla', display_name: 'KennyHoopla (Safeguard)', origin: 'Cleveland, OH', genre: 'Post-Punk / Dance-Punk', theme: 'theme-tour', bio: 'Alternative support act cached offline in case of lineup variations. Cleveland native Kenneth La\'ron brings high-energy alternative rock.' }
];

const switcherBandsCount = 3; // hide KennyHoopla from active cycling count

// Data State Cache
const state = {
  activeArtistId: 'artist:young-the-giant',
  activeBandName: 'Young the Giant',
  songs: [],
  activeSongIndex: 0,
  activeBandIndex: 2, // YTG
  venue: null,
  event: null,
  transit: null,
  sentiment: null,
  tourHistory: null,
  dismissedAlertText: null,
  hideSpoilers: false,
  activeViewport: 'lyrics', // 'lyrics', 'weather', 'venue', 'timeline', 'band'
  lyricsDb: null
};

// Transition effects pool (Loops 5 unique vintage modes)
const transitions = [
  (overlay, content) => {
    overlay.style.background = 'rgba(18, 18, 18, 0.95)';
    content.style.filter = 'none';
  },
  (overlay, content) => {
    overlay.style.background = 'rgba(30, 20, 10, 0.85)';
    content.style.filter = 'blur(12px) contrast(140%)';
  },
  (overlay, content) => {
    overlay.style.background = 'rgba(5, 10, 20, 0.9)';
    content.style.transform = 'translateY(50px)';
  },
  (overlay, content) => {
    overlay.style.background = 'rgba(20, 20, 20, 0.9)';
    content.style.filter = 'hue-rotate(90deg) saturate(200%)';
  },
  (overlay, content) => {
    overlay.style.background = 'rgba(15, 15, 15, 0.5)';
    content.style.opacity = '0.2';
  }
];

let activeTransitionIndex = 0;

function triggerTransition(callback) {
  const overlay = document.getElementById('loading-overlay');
  const content = document.getElementById('viewport-content');
  
  const effect = transitions[activeTransitionIndex];
  activeTransitionIndex = (activeTransitionIndex + 1) % transitions.length;
  
  overlay.classList.add('active');
  effect(overlay, content);
  
  setTimeout(() => {
    callback();
    setTimeout(() => {
      overlay.classList.remove('active');
      content.style.filter = 'none';
      content.style.transform = 'none';
      content.style.opacity = '1';
      overlay.style.background = '';
    }, 250);
  }, 400);
}

// Load Core Data from bundles/ & fill-data/
async function loadCorpusData() {
  state.hideSpoilers = localStorage.getItem('hideSpoilers') === 'true';

  // Safe fetching netting fallbacks
  try {
    const venueRes = await fetch('bundles/venues/venue-ascend-federal-credit-union-amphitheater.jsonc');
    if (venueRes.ok) state.venue = parseJSONC(await venueRes.text());
  } catch(e) { console.warn("Failed to load venue:", e); }
  if (!state.venue) state.venue = { display_name: "Ascend Amphitheater" };

  try {
    const eventRes = await fetch('bundles/events/event-young-the-giant-nashville-2026-06-27.jsonc');
    if (eventRes.ok) state.event = parseJSONC(await eventRes.text());
  } catch(e) { console.warn("Failed to load event:", e); }
  if (!state.event) state.event = { doors_time: "17:00", weather: { temp_f_high: 89, temp_f_low: 74, conditions: "Rain", forecast_summary: "Storms expected." } };

  try {
    const transitRes = await fetch('fill-data/venue/nashville-transit-parking-options.json');
    if (transitRes.ok) state.transit = await transitRes.json();
  } catch(e) { console.warn("Failed to load transit:", e); }

  try {
    const tourRes = await fetch('fill-data/event/victory-garden-tour-history.json');
    if (tourRes.ok) state.tourHistory = await tourRes.json();
  } catch(e) { console.warn("Failed to load tour history:", e); }

  try {
    const sentimentRes = await fetch('fill-data/band/young-the-giant-song-sentiment.json');
    if (sentimentRes.ok) state.sentiment = await sentimentRes.json();
  } catch(e) { console.warn("Failed to load sentiment:", e); }

  try {
    const lyricsRes = await fetch('fill-data/band/setlist-lyrics-and-live-variations.json');
    if (lyricsRes.ok) state.lyricsDb = await lyricsRes.json();
  } catch(e) { console.warn("Failed to pre-cache lyrics and variations database:", e); }

  await loadArtistSonglist();
  
  renderDashboardMetadata();
  renderCurrentSong();
  startFactoidShuffler();
}

// Fetch and load song schemas for the active band
async function loadArtistSonglist() {
  state.songs = [];
  const activeBand = bandsList[state.activeBandIndex];
  const activeSlug = activeBand.id.split(':')[1];
  
  if (activeSlug === 'young-the-giant') {
    const songlist = [
      "evergreen", "superposition", "bitter-fruit", "apartment", "repeat", 
      "mr-know-it-all", "dancing-in-the-rain", "already-there", "something-to-believe-in", 
      "garands", "mona-lisa", "this-too-shall-pass", "ships-passing", 
      "different-kind-of-love", "my-body", "teachers", "the-garden", 
      "cough-syrup", "the-walk-home", "mind-over-matter"
    ];
    const promises = songlist.map(async (song) => {
      try {
        const res = await fetch(`bundles/songs/song-young-the-giant-${song}.jsonc`);
        if (res.ok) return parseJSONC(await res.text());
      } catch(e) {
        console.warn("Failed to load song:", song, e);
      }
      return null;
    });
    const loaded = await Promise.all(promises);
    state.songs = loaded.filter(s => s !== null);
  } else if (activeSlug === 'cold-war-kids') {
    const songlist = [
      "all-this-could-be-yours", "can-we-hang-on", "first", "hang-me-up-to-dry",
      "hospital-beds", "love-is-mystical", "miracle-mile", "push-my-luck",
      "run-away-with-me", "so-tied-up", "something-is-not-right-with-me",
      "there-goes-the-night", "we-used-to-vacation", "what-you-say",
      "whos-gonna-love-me-now"
    ];
    const promises = songlist.map(async (song) => {
      try {
        const res = await fetch(`bundles/songs/song-cold-war-kids-${song}.jsonc`);
        if (res.ok) return parseJSONC(await res.text());
      } catch(e) {
        console.warn("Failed to load song:", song, e);
      }
      return null;
    });
    const loaded = await Promise.all(promises);
    state.songs = loaded.filter(s => s !== null);
  } else {
    // almost monday or KennyHoopla fallback mock songs
    state.songs = [
      { display_name: "sun keeps on shining", slug: "sun-keeps-on-shining", musicality: { canonical_key: "G Major", tempo_bpm: 120 } },
      { display_name: "cough syrup (Cover)", slug: "cough-syrup", musicality: { canonical_key: "E Minor", tempo_bpm: 128 } }
    ];
  }
  state.activeSongIndex = 0;
}

// Render Top and Bottom button values
function renderDashboardMetadata() {
  if (!state.venue || !state.event) return;

  document.getElementById('venue-status').textContent = state.venue.display_name;
  
  if (state.event.weather) {
    document.getElementById('weather-status').textContent = `${state.event.weather.temp_f_high}°F / ${state.event.weather.conditions}`;
    const alertText = state.event.weather.forecast_summary;
    document.getElementById('alert-text').textContent = alertText;
    
    if (state.dismissedAlertText !== alertText) {
      document.getElementById('alert-banner').style.display = 'flex';
    } else {
      document.getElementById('alert-banner').style.display = 'none';
    }
  }
  
  document.getElementById('timeline-status').textContent = `Doors: ${state.event.doors_time}`;
}

// Auto-Shuffling Idle Text Animation with Cooldown (Alternates text & empty slots)
let factoidInterval = null;
let unusedFactoids = [];
let showTextState = true; // toggles displaying text vs blank space

function startFactoidShuffler() {
  if (factoidInterval) clearInterval(factoidInterval);
  
  const updateText = () => {
    const bubbleText = document.getElementById('shuffling-factoid');
    if (!bubbleText) return;
    
    if (showTextState) {
      // Pick unique index to prevent repeat
      if (unusedFactoids.length === 0) {
        unusedFactoids = [...Array(factoids.length).keys()];
      }
      const randIdx = Math.floor(Math.random() * unusedFactoids.length);
      const factoidIndex = unusedFactoids.splice(randIdx, 1)[0];

      bubbleText.style.opacity = 0;
      setTimeout(() => {
        bubbleText.innerHTML = `💡 <em>${factoids[factoidIndex]}</em>`;
        bubbleText.style.opacity = 1;
      }, 450);
    } else {
      // Cooldown State: fade out and leave empty/blank space
      bubbleText.style.opacity = 0;
      setTimeout(() => {
        bubbleText.innerHTML = ``;
      }, 450);
    }
    showTextState = !showTextState;
  };

  // Switch state every 7 seconds
  factoidInterval = setInterval(updateText, 7000);
}

// Render Zune Lyrics and Song selector Jumplist
function renderCurrentSong() {
  state.activeViewport = 'lyrics';
  hideVenueActionBar();
  if (state.songs.length === 0) return;
  const song = state.songs[state.activeSongIndex];
  
  // Theme styling check
  const viewport = document.getElementById('main-viewport');
  viewport.className = 'viewport-square'; 
  const activeBand = bandsList[state.activeBandIndex];
  viewport.classList.add(activeBand.theme);

  // Song lyrics & live variations selector
  let lyricsArray = null;
  let liveVariants = null;

  if (state.lyricsDb && state.lyricsDb.bands) {
    const bandKey = Object.keys(state.lyricsDb.bands).find(
      k => k.toLowerCase() === activeBand.name.toLowerCase()
    );
    if (bandKey) {
      const songKey = Object.keys(state.lyricsDb.bands[bandKey].songs).find(
        k => k.toLowerCase() === song.display_name.toLowerCase()
      );
      if (songKey) {
        lyricsArray = state.lyricsDb.bands[bandKey].songs[songKey].lyrics;
        liveVariants = state.lyricsDb.bands[bandKey].songs[songKey].live_variations;
      }
    }
  }

  if (!lyricsArray) {
    const songSlug = song.slug;
    lyricsArray = songLyricsDb[songSlug] || [
      "No offline lyrics cached for this song yet.",
      "Listen closely to the stage!",
      `Key: ${song.musicality?.canonical_key || 'C Major'} &bull; Tempo: ${song.musicality?.tempo_bpm || 110} BPM`
    ];
  }

  let lyricsHTML = lyricsArray.map(line => `<p class="lyrics-line active">${line}</p>`).join('');

  // Generate live variations details if available
  let variationsHTML = '';
  if (liveVariants && liveVariants.length > 0) {
    const listHTML = liveVariants.map(v => `<li><strong>${v.type}:</strong> ${v.description}</li>`).join('');
    variationsHTML = `
      <div style="margin-top: 14px; padding: 12px; background: rgba(255,159,10,0.08); border-radius: 6px; font-size: 0.78rem; border-left: 3px solid #ff9f0a; text-align: left; font-family:'Segoe UI', sans-serif;">
        <strong style="color:#ff9f0a; display:block; margin-bottom:4px;">🎤 Tour Live Variations:</strong>
        <ul style="margin: 0; padding-left: 14px; color: #ddd; line-height: 1.35; display:flex; flex-direction:column; gap:4px;">
          ${listHTML}
        </ul>
      </div>
    `;
  }

  // Dropdown list HTML (Hiding projected songs names if Anti-Spoiler Mode is active)
  let optionsHTML = state.songs.map((s, idx) => {
    const isSelected = idx === state.activeSongIndex ? 'selected' : '';
    if (state.hideSpoilers && idx > state.activeSongIndex) {
      return `<option value="${idx}" ${isSelected}>${idx + 1}. [Projected Track]</option>`;
    }
    return `<option value="${idx}" ${isSelected}>${idx + 1}. ${s.display_name}</option>`;
  }).join('');

  const displaySongName = (state.hideSpoilers && state.activeSongIndex > 0) ? `Track ${state.activeSongIndex + 1}` : song.display_name;

  const content = document.getElementById('viewport-content');
  content.innerHTML = `
    <div class="lyrics-view" style="display:flex; flex-direction:column; height:100%;">
      <div class="song-header">
        <h1>${displaySongName}</h1>
        <p>${activeBand.display_name} &bull; ${song.musicality?.canonical_key || 'C Major'} &bull; ${song.musicality?.tempo_bpm || 110} BPM</p>
      </div>
      
      <div class="lyrics-body" id="lyrics-scroll" style="flex-grow:1; overflow-y:auto; padding:10px 0;">
        ${lyricsHTML}
        
        ${variationsHTML}

        <div style="margin-top: 18px; font-size: 0.75rem; font-family: 'Segoe UI', sans-serif; text-align: left;">
          <label for="track-select" style="display:block; margin-bottom:4px; text-transform:uppercase; font-weight:700; color:var(--text-secondary);">Projected Set Playlist:</label>
          <select id="track-select" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-family:'Segoe UI', sans-serif;">
            ${optionsHTML}
          </select>
        </div>

        <div style="margin-top: 18px; display:flex; gap:10px; font-size:0.75rem; font-family:'Segoe UI', sans-serif;">
          <a href="https://www.setlist.fm/setlists/young-the-giant-7bd2cea0.html" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700; flex-grow:1; text-align:center; padding:8px; border:1px solid #333; border-radius:4px;">Full Catalog ↗</a>
          <button id="btn-share-trigger" style="background:transparent; border:1px dashed #666; color:#aaa; padding:8px; border-radius:4px; cursor:pointer; flex-grow:1;">Share App</button>
        </div>
      </div>
      
      <div class="song-controller" style="justify-content: center; gap: 20px; flex-shrink:0; margin-top:6px;">
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

  document.getElementById('track-select').addEventListener('change', (e) => {
    state.activeSongIndex = parseInt(e.target.value);
    triggerTransition(renderCurrentSong);
  });

  document.getElementById('btn-share-trigger').addEventListener('click', () => {
    const menuModal = document.getElementById('share-modal');
    generateShareQRCode();
    menuModal.classList.add('active');
  });
}

// ----------------------------------------
// SUB-HEADER VENUE HELPERS
// ----------------------------------------
function showVenueActionBar() {
  const bar = document.getElementById('sub-header-venue');
  bar.style.display = 'grid';
  updateCarButtonUI();
}

function hideVenueActionBar() {
  document.getElementById('sub-header-venue').style.display = 'none';
}

function updateCarButtonUI() {
  const btn = document.getElementById('btn-venue-car');
  if (!btn) return;
  const isParked = localStorage.getItem('carParked') !== null;
  btn.textContent = isParked ? '📍 Find Car' : '🚗 Mark Car';
  btn.className = isParked ? 'sub-venue-btn active' : 'sub-venue-btn';
}

// ----------------------------------------
// BUTTON CLICK PANEL RENDERINGS
// ----------------------------------------

// Render Weather
document.getElementById('btn-weather').addEventListener('click', () => {
  state.activeViewport = 'weather';
  hideVenueActionBar();
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-utility';

    const bannerState = document.getElementById('alert-banner').style.display === 'none' ? '' : 'checked';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Weather & Risk Alerts</h2>
        <h3>NOAA Alert</h3>
        <p style="color:#ff9f0a; font-weight:700; margin-bottom:12px;">⚠️ FLOOD WATCH active from 7:00 AM June 27 to 7:00 AM June 28.</p>
        
        <!-- TEACHING COMMENT: The checkbox state is bound directly to the alert banner's layout display state. Checking it triggers alert-banner to show, unchecking hides it and flags alertText to prevent immediate re-pops. -->
        <div style="margin:14px 0; background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; font-size:0.8rem;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="alert-banner-toggle" ${bannerState}>
            <span>Show Alert Banner at top</span>
          </label>
        </div>

        <h3>Hourly Outlook</h3>
        <ul>
          <li><strong>High Forecast:</strong> 89°F</li>
          <li><strong>Low Forecast:</strong> 74°F</li>
          <li><strong>Conditions:</strong> Heavy rain & storms.</li>
        </ul>
        <p style="font-size:0.75rem; margin-top:14px; color:var(--text-secondary);">Source: NOAA point forecast mapclick</p>
      </div>
    `;

    document.getElementById('alert-banner-toggle').addEventListener('change', (e) => {
      document.getElementById('alert-banner').style.display = e.target.checked ? 'flex' : 'none';
      state.dismissedAlertText = e.target.checked ? null : (state.event?.weather?.forecast_summary || '');
    });
  });
});

// Render Venue Main
document.getElementById('btn-venue').addEventListener('click', () => {
  state.activeViewport = 'venue';
  showVenueActionBar();
  triggerTransition(renderVenueMainView);
});

function renderVenueMainView() {
  const viewport = document.getElementById('main-viewport');
  viewport.className = 'viewport-square theme-venue';
  const content = document.getElementById('viewport-content');
  content.innerHTML = `
    <div class="details-view" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
      <div>
        <h2>Venue Policies & Access</h2>
        <h3>Bag Guidelines</h3>
        <ul>
          <li><strong>Clear Bags:</strong> Max dimensions 12" x 6" x 12"</li>
          <li><strong>Clutches (Non-clear):</strong> Max dimensions 6" x 9"</li>
        </ul>
        <h3>Parking & Walking Route</h3>
        <p><strong>Nissan Stadium Walkway:</strong> Park at Nissan Stadium East Bank Lot, walk ~0.6 miles over the Seigenthaler Pedestrian Bridge directly to the gates (~15 min walk).</p>
      </div>
      
      <div style="margin-top:16px; border-top:1px dashed #444; padding-top:12px;">
        <p style="font-size:0.8rem; color:#aaa; margin-bottom:0;">Need ADA help? Click <strong>Facilities</strong> above or tap <strong>🚻</strong> below.</p>
      </div>
    </div>
  `;
}

// Render Timeline Program
document.getElementById('btn-timeline').addEventListener('click', () => {
  state.activeViewport = 'timeline';
  hideVenueActionBar();
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-utility';

    // Show small button only if install prompt is queued
    const installBtnDisplay = deferredPrompt ? 'inline-block' : 'none';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view" style="display:flex; flex-direction:column; height:100%;">
        <h2>Projected Program</h2>
        
        <div style="flex-grow:1; overflow-y:auto; padding-right:4px;">
          <div class="timeline-item" style="margin-bottom:8px; border-left:2px solid var(--accent); padding-left:10px;">
            <div class="time-slot" style="font-weight:700; color:var(--accent);">17:00</div>
            <div class="event-details">
              <strong>Gates Open</strong>
            </div>
          </div>

          <div class="timeline-item" style="margin-bottom:8px; border-left:2px solid #555; padding-left:10px;">
            <div class="time-slot" style="font-weight:700;">18:00</div>
            <div class="event-details">
              <strong>almost monday Set</strong>
              <p style="font-size:0.75rem; margin:0; color:#aaa;">Opening performance.</p>
            </div>
          </div>

          <div class="timeline-item" style="margin-bottom:8px; border-left:2px solid #555; padding-left:10px;">
            <div class="time-slot" style="font-weight:700;">18:45</div>
            <div class="event-details">
              <strong>Cold War Kids Set</strong>
              <p style="font-size:0.75rem; margin:0; color:#aaa;">20th Anniversary debut set.</p>
            </div>
          </div>

          <div class="timeline-item" style="margin-bottom:8px; border-left:2px solid #555; padding-left:10px;">
            <div class="time-slot" style="font-weight:700;">20:15</div>
            <div class="event-details">
              <strong>Young the Giant Set</strong>
              <p style="font-size:0.75rem; margin:0; color:#aaa;">Headline Victory Garden performance.</p>
            </div>
          </div>

          <!-- Anti-Spoiler Mode Settings -->
          <div style="margin:14px 0; background:rgba(255,255,255,0.04); padding:10px; border-radius:6px; font-size:0.82rem; font-family:'Segoe UI',sans-serif; text-align:left; border: 1px solid #333;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="spoiler-toggle" ${state.hideSpoilers ? 'checked' : ''}>
              <strong>Anti-Spoiler Mode (Hide future tracks)</strong>
            </label>
          </div>

          <!-- Auto-Shuffling Trivia (with intermittent blank cooldown) -->
          <div id="shuffling-factoid" style="margin-top:14px; font-size:0.85rem; min-height:40px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; color:#ff9f0a; transition: opacity 0.4s ease; border-left: 3px solid #ff9f0a;">
            💡 Loading trivia...
          </div>

          <!-- Mini PWA Install button -->
          <div style="margin-top: 14px; text-align: center;">
            <button id="btn-install-pwa-small" style="display:${installBtnDisplay}; background:rgba(255,255,255,0.05); border:1px solid #444; color:#ccc; padding:8px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer; font-weight:700; font-family:'Segoe UI',sans-serif;">📲 Add to Home Screen</button>
          </div>

          <!-- Quick access Shortcuts (No openers lore button, shrunken styling) -->
          <div style="margin-top: 16px; display:flex; gap:6px; font-size:0.75rem; font-family:'Segoe UI', sans-serif; justify-content:center;">
            <button id="lnk-to-venue" style="background:transparent; border:1px solid #444; color:#fff; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:700; font-family:'Segoe UI',sans-serif; font-size:0.75rem;">🗺️ Policies</button>
            <button id="lnk-to-food" style="background:transparent; border:1px solid #444; color:#ccc; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:700; font-family:'Segoe UI',sans-serif; font-size:0.75rem;">🍔 Food</button>
            <button id="lnk-to-merch" style="background:transparent; border:1px solid #444; color:#ccc; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:700; font-family:'Segoe UI',sans-serif; font-size:0.75rem;">👕 Merch</button>
          </div>

          <!-- Page space spacer before About footer -->
          <div style="height: 60px;"></div>
          
          <!-- About/Credits footer -->
          <div style="border-top:1px dashed #444; padding-top:16px; text-align:left; font-family:'Segoe UI',sans-serif; padding-bottom: 20px;">
            <h3 style="font-size:1.15rem; text-transform:uppercase; color:var(--accent); margin-bottom:6px; margin-top:0;">🔌 About Sun Map</h3>
            <p style="font-size:1rem; line-height:1.45; color:#ccc; margin-bottom:8px;">A new kind of light for the show. Mapping the stories, soundscapes, and paths that grow between the stage and the lawn.</p>
            <p style="font-size:0.9rem; color:#aaa; margin:0;">Developed by <a href="mailto:chozcunningham+sunmap@gmail.com" style="color:var(--accent); text-decoration:none; font-weight:700;">C. Cunningham</a>. Contact us to build this for your tour, concert, or music event.</p>
          </div>
        </div>
      </div>
    `;

    // Bind shortcuts
    document.getElementById('lnk-to-venue').addEventListener('click', () => {
      document.getElementById('btn-venue').click();
    });
    
    document.getElementById('lnk-to-food').addEventListener('click', () => {
      showHelpBubble("🍔 Food concession stands sit on both main East & West plazas.");
    });
    document.getElementById('lnk-to-merch').addEventListener('click', () => {
      showHelpBubble("👕 Main Merch trailers are located directly inside Gate 1 entrance.");
    });

    document.getElementById('spoiler-toggle').addEventListener('change', (e) => {
      state.hideSpoilers = e.target.checked;
      localStorage.setItem('hideSpoilers', state.hideSpoilers ? 'true' : 'false');
    });

    document.getElementById('btn-install-pwa-small').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('btn-install-pwa-small').style.display = 'none';
      }
    });
    
    startFactoidShuffler();
  });
});

// Render Band Detail Switcher Transport (Left Button)
document.getElementById('btn-band').addEventListener('click', () => {
  state.activeViewport = 'band';
  hideVenueActionBar();
  triggerTransition(renderActiveBandProfile);
});

function renderActiveBandProfile() {
  const activeBand = bandsList[state.activeBandIndex];
  
  const viewport = document.getElementById('main-viewport');
  viewport.className = 'viewport-square'; 
  viewport.classList.add(activeBand.theme);

  // Dropdown list HTML for bands (limiting to switcherBandsCount = 3 to hide KennyHoopla)
  let bandOptionsHTML = bandsList.slice(0, switcherBandsCount).map((b, idx) => {
    const isSelected = idx === state.activeBandIndex ? 'selected' : '';
    return `<option value="${idx}" ${isSelected}>${idx + 1} / ${switcherBandsCount}</option>`;
  }).join('');

  // CSS aesthetic block/collage representation of the band
  let bandArtStyle = '';
  let logoSVG = '';
  let linksHTML = '';
  
  if (activeBand.id === 'artist:almost-monday') {
    bandArtStyle = `background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);`; // Surf sun pastel gradient
    logoSVG = `
      <svg viewBox="0 0 200 45" style="width:170px; height:auto;">
        <circle cx="35" cy="22" r="12" fill="#ff9f0a" opacity="0.8"/>
        <path d="M 55,25 Q 65,15 75,25 T 95,25" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <text x="140" y="28" fill="#fff" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="900" letter-spacing="0.05em" text-anchor="middle">almost monday</text>
      </svg>
    `;
    linksHTML = `<a href="https://almostmonday.com" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem;">🌐 surf pop wraps era</a>`;
  } else if (activeBand.id === 'artist:cold-war-kids') {
    bandArtStyle = `background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);`; // Deep classic blue
    logoSVG = `
      <svg viewBox="0 0 200 45" style="width:170px; height:auto;">
        <rect x="15" y="6" width="170" height="32" fill="none" stroke="#fff" stroke-width="2.5" />
        <text x="100" y="27" fill="#fff" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="900" letter-spacing="0.1em" text-anchor="middle">COLD WAR KIDS</text>
      </svg>
    `;
    linksHTML = `<a href="https://coldwarkids.com" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem;">🌐 20 years of robbers & cowards</a>`;
  } else if (activeBand.id === 'artist:young-the-giant') {
    bandArtStyle = `background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);`; // Warm woodcut soil green/yellow
    logoSVG = `
      <svg viewBox="0 0 200 45" style="width:170px; height:auto;">
        <text x="100" y="32" fill="#fff" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="900" letter-spacing="0.2em" text-anchor="middle">Y.T.G</text>
        <line x1="45" y1="37" x2="155" y2="37" stroke="var(--accent)" stroke-width="2"/>
      </svg>
    `;
    linksHTML = `
      <div style="display:flex; gap:12px;">
        <a href="https://youngthegiant.com" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem;">🌐 victory garden tour</a>
        <a href="https://youngthegiant.com/music" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem;">🌐 mirror master</a>
      </div>
    `;
  } else {
    bandArtStyle = `background: linear-gradient(135deg, #ed213a 0%, #93291e 100%);`; // Punk deep red
    logoSVG = `<span style="font-family:'Segoe UI', sans-serif; font-weight:900; font-size:1.1rem; color:#fff;">KennyHoopla</span>`;
    linksHTML = `<a href="https://kennyhoopla.com" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem;">🌐 alternative punk sound</a>`;
  }

  const content = document.getElementById('viewport-content');
  content.innerHTML = `
    <div class="lyrics-view" style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div class="song-header">
        <h1>${activeBand.name}</h1>
        <p>${activeBand.genre} &bull; ${activeBand.origin}</p>
      </div>

      <!-- Graphical Band Logo/Art Banner -->
      <div style="width:100%; height:75px; ${bandArtStyle} border-radius:8px; display:flex; justify-content:center; align-items:center; box-shadow:inset 0 0 15px rgba(0,0,0,0.2); margin-bottom:12px;">
        ${logoSVG}
      </div>

      <div class="lyrics-body" style="flex-grow:1; overflow-y:auto; padding:10px 0; text-align:left; font-family:'Segoe UI', sans-serif;">
        <p style="font-size:1.05rem; line-height:1.55; color:rgba(255,255,255,0.95); margin-bottom:14px;">${activeBand.bio}</p>
        
        <div style="margin: 16px 0; border-top: 1px dashed rgba(255,255,255,0.15); padding-top:12px;">
          ${linksHTML}
        </div>
      </div>

      <!-- Dropdown picker low inside port between navigation buttons (limits to 3 performer slides) -->
      <div class="song-controller" style="justify-content: center; gap: 14px; flex-shrink:0; margin-top:6px; display:flex; align-items:center;">
        <button class="ctrl-btn" id="btn-prev-band">◀</button>
        
        <div style="position:relative; display:inline-block;">
          <select id="band-select" style="background:transparent; border:none; color:#fff; font-family:'Courier Prime', monospace; font-size:1.1rem; font-weight:700; cursor:pointer; appearance:none; -webkit-appearance:none; padding:4px 18px 4px 6px; text-align:center;">
            ${bandOptionsHTML}
          </select>
          <span style="position:absolute; right:4px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:0.6rem; color:#aaa;">▼</span>
        </div>

        <button class="ctrl-btn" id="btn-next-band">▶</button>
      </div>
    </div>
  `;

  // Bind controls (Cycling within the bounds of switcherBandsCount = 3)
  document.getElementById('btn-prev-band').addEventListener('click', () => {
    state.activeBandIndex = (state.activeBandIndex - 1 + switcherBandsCount) % switcherBandsCount;
    loadArtistSonglist().then(() => {
      triggerTransition(renderActiveBandProfile);
    });
  });
  document.getElementById('btn-next-band').addEventListener('click', () => {
    state.activeBandIndex = (state.activeBandIndex + 1) % switcherBandsCount;
    loadArtistSonglist().then(() => {
      triggerTransition(renderActiveBandProfile);
    });
  });

  document.getElementById('band-select').addEventListener('change', (e) => {
    state.activeBandIndex = parseInt(e.target.value);
    loadArtistSonglist().then(() => {
      triggerTransition(renderActiveBandProfile);
    });
  });
}

// Render Tour Ethos Card
document.getElementById('btn-tour').addEventListener('click', () => {
  state.activeViewport = 'tour';
  hideVenueActionBar();
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-tour';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Victory Garden Tour</h2>
        
        <h3>Tour Creed & Carbon Mitigation</h3>
        <p>The 2026 tour partners with <strong>REVERB</strong> to design an eco-friendly concert footprint. Key goals include reducing single-use plastics, setting up local food-waste diversion systems, and investing in community-driven carbon reduction projects.</p>
        <p style="margin-top:8px; margin-bottom:16px;"><a href="https://reverb.org" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none;">🌐 REVERB Music Climate Campaign ↗</a></p>

        <h3>Cumberland Watershed Support</h3>
        <p>A designated portion of tonight's concert proceeds is directed to the Cumberland River Compact. These funds help protect local waterways, restore soil health, and combat urban heat offsets around Middle Tennessee.</p>
        <p style="margin-top:8px; margin-bottom:16px;"><a href="https://cumberlandrivercompact.org" target="_blank" style="color:var(--accent); font-weight:700; text-decoration:none;">🌐 Cumberland River Compact ↗</a></p>

        <h3>Surprise NYC Duet Trivia</h3>
        <p>During their Madison Square Garden performance, Darren Criss joined the band onstage for an unannounced acoustic duet of <em>"Superposition"</em>. Keep your eyes on the stage tonight for local guest appearances!</p>
      </div>
    `;
  });
});

// Bind Venue Sub-Header buttons
document.getElementById('btn-venue-car').addEventListener('click', () => {
  const isParked = localStorage.getItem('carParked') !== null;
  if (!isParked) {
    localStorage.setItem('carParked', 'Nissan Stadium East Bank Lot R');
    updateCarButtonUI();
    showHelpBubble("🚗 Parking spot marked at Nissan Stadium East Bank Lot R!");
  } else {
    // Show walking path directions back to marked car
    triggerTransition(() => {
      const content = document.getElementById('viewport-content');
      content.innerHTML = `
        <div class="details-view">
          <h2>Find My Car</h2>
          <p><strong>Marked Location:</strong> Nissan Stadium East Bank Lot R</p>
          <h3>Walking Return Route</h3>
          <p>Exit the main venue gate southwards, turn left and cross the Seigenthaler Pedestrian Bridge. Walk directly down the ramp to the East Bank lots. Total distance is ~0.6 miles (15 min walk).</p>
          
          <button id="btn-clear-car" style="background:#d32f2f; border:none; color:#fff; padding:8px 12px; border-radius:4px; font-weight:700; cursor:pointer; margin-top:14px;">🗑️ Clear Marked Spot</button>
        </div>
      `;
      document.getElementById('btn-clear-car').addEventListener('click', () => {
        localStorage.removeItem('carParked');
        updateCarButtonUI();
        triggerTransition(renderVenueMainView);
        showHelpBubble("Parking location cleared.");
      });
    });
  }
});

document.getElementById('btn-venue-fac').addEventListener('click', () => {
  triggerTransition(() => {
    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view" style="display:flex; flex-direction:column; height:100%;">
        <h2>Facilities & Interior Map</h2>
        
        <!-- STRETCH GOAL: SVG Seating & Stage Layout Map with Pulsing You Are Here Pin -->
        <svg viewBox="0 0 320 180" style="width:100%; height:auto; background:#181818; border-radius:6px; border:1px solid #333; margin:8px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <rect x="100" y="10" width="120" height="20" rx="3" fill="#ff5722" />
          <text x="160" y="23" fill="#fff" font-size="8" font-family="'Segoe UI',sans-serif;" font-weight="bold" text-anchor="middle">STAGE</text>
          
          <path d="M 80,42 A 90,90 0 0,0 240,42 L 260,70 A 130,130 0 0,1 60,70 Z" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
          <text x="160" y="58" fill="#aaa" font-size="8" font-family="'Segoe UI',sans-serif;" text-anchor="middle">RESERVED SEATING / PIT</text>
          
          <path d="M 50,80 A 150,150 0 0,0 270,80 L 295,130 A 210,210 0 0,1 25,130 Z" fill="#1b3318" stroke="#333" stroke-width="1"/>
          <text x="160" y="108" fill="#88b083" font-size="9" font-family="'Segoe UI',sans-serif;" font-weight="bold" text-anchor="middle">THE LAWN</text>
          
          <circle cx="160" cy="90" r="4" fill="#ff9f0a" />
          <circle cx="160" cy="90" r="8" fill="none" stroke="#ff9f0a" stroke-width="1.5">
            <animate attributeName="r" values="4;10;4" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x="160" y="83" fill="#ff9f0a" font-size="7" font-family="'Segoe UI',sans-serif;" font-weight="bold" text-anchor="middle">📍 YOU ARE HERE (Lawn Front)</text>
          
          <text x="30" y="160" fill="#ccc" font-size="7" font-family="'Segoe UI',sans-serif;">🚻 Restrooms (East/West Plaza)</text>
          <text x="210" y="160" fill="#ccc" font-size="7" font-family="'Segoe UI',sans-serif;">🍔 Concessions / Gate 1</text>
        </svg>

        <h3>🚻 Restroom Facilities</h3>
        <p>Main restrooms are situated on the East and West plazas. Elevated ADA restrooms are nearby.</p>
        <h3>♿ Accessibility Ramps</h3>
        <p>Ramped wheelchair pathways lead from Molloy St drop-off to Gate 1 (box office entry) and up to the Main Lawn viewing decks.</p>
        <h3>🚑 Medical Services</h3>
        <p>First aid tent with permanent AED defibrillators is located next to the West plaza concession area. Metro EMT staff carry cooling first aid bags containing Epipens.</p>
      </div>
    `;
  });
});

document.getElementById('btn-venue-help').addEventListener('click', () => {
  // Confirm Dialogue inside Centerport
  triggerTransition(() => {
    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view" style="display:flex; flex-direction:column; justify-content:center; height:100%; text-align:center; padding:10px;">
        <h2>Call Guest Services</h2>
        <p style="font-size:1.1rem; margin-bottom:20px; line-height:1.4;">Are you sure you want to call Ascend Amphitheater Guest Services & ADA assistance line?</p>
        <p style="color:var(--accent); font-weight:700; margin-bottom:24px; font-size:1.3rem;">📞 615-258-5944</p>
        
        <div style="display:flex; gap:16px; justify-content:center;">
          <button id="btn-confirm-call" style="background:#ff5722; border:none; color:#fff; padding:12px 24px; border-radius:6px; font-weight:700; cursor:pointer; font-size:1rem; font-family:'Segoe UI',sans-serif;">Call Now</button>
          <button id="btn-cancel-call" style="background:transparent; border:1px solid #555; color:#aaa; padding:12px 24px; border-radius:6px; font-weight:700; cursor:pointer; font-size:1rem; font-family:'Segoe UI',sans-serif;">Cancel</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-confirm-call').addEventListener('click', () => {
      window.open('tel:6152585944');
    });
    document.getElementById('btn-cancel-call').addEventListener('click', () => {
      triggerTransition(renderVenueMainView);
    });
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
// CONTEXT-SENSITIVE LONG-PRESS HELP TOOLTIP
// ----------------------------------------
let pressTimer = null;

function bindLongPress(element) {
  element.addEventListener('mousedown', startPress);
  element.addEventListener('touchstart', startPress);
  element.addEventListener('mouseup', cancelPress);
  element.addEventListener('mouseleave', cancelPress);
  element.addEventListener('touchend', cancelPress);
}

function startPress(e) {
  if (pressTimer) clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    triggerPageHelp();
  }, 800);
}

function cancelPress() {
  if (pressTimer) clearTimeout(pressTimer);
}

function triggerPageHelp() {
  let tip = "Navigate using top and bottom controls.";
  
  if (state.activeViewport === 'lyrics') {
    tip = `
      <p style="margin-bottom:10px;"><strong>🎵 Song & Lyrics Mode</strong></p>
      <ul style="padding-left:16px; margin:0; display:flex; flex-direction:column; gap:6px;">
        <li>Use the bottom <strong>◀ / ▶</strong> transport buttons to flip tracks sequentially.</li>
        <li>Tap the <strong>Jumplist select box</strong> to skip straight to any song in tonight's set list.</li>
        <li>Observe highlighted live performance warnings showing ad-libs or crowd prompts.</li>
      </ul>
    `;
  } else if (state.activeViewport === 'venue') {
    tip = `
      <p style="margin-bottom:10px;"><strong>🏟️ Venue & Security Guide</strong></p>
      <ul style="padding-left:16px; margin:0; display:flex; flex-direction:column; gap:6px;">
        <li>Tap <strong>🚗 Mark Car</strong> when you park. The app calculates walk coordinates and remembers your lot offline.</li>
        <li>Tap <strong>🚻 Facilities</strong> to check ramps, bathrooms, or first aid details.</li>
        <li>Tap <strong>📞 Call Help</strong> to call Venue Guest Services and ADA assistance instantly.</li>
      </ul>
    `;
  } else if (state.activeViewport === 'weather') {
    tip = `
      <p style="margin-bottom:10px;"><strong>⛈️ Live Weather Center</strong></p>
      <ul style="padding-left:16px; margin:0; display:flex; flex-direction:column; gap:6px;">
        <li>Check local NOAA flood watch guidelines.</li>
        <li>Toggle the <strong>Show Alert Banner</strong> checkbox to show or hide the emergency header banner.</li>
      </ul>
    `;
  } else if (state.activeViewport === 'timeline') {
    tip = `
      <p style="margin-bottom:10px;"><strong>⏰ Program Timeline & Lore</strong></p>
      <ul style="padding-left:16px; margin:0; display:flex; flex-direction:column; gap:6px;">
        <li>View gate opening offsets and set window guidelines for all performers.</li>
        <li>Click shortcuts to jump directly to venue maps or opener details.</li>
        <li>Enable or disable the <strong>Anti-Spoiler Mode</strong> to hide upcoming track sequences.</li>
      </ul>
    `;
  } else if (state.activeViewport === 'band') {
    tip = `
      <p style="margin-bottom:10px;"><strong>🎸 Band Profiles & Themes</strong></p>
      <ul style="padding-left:16px; margin:0; display:flex; flex-direction:column; gap:6px;">
        <li>Tap the left or right arrows to cycle performers scheduled tonight.</li>
        <li>Swapping the active band dynamically adapts the entire app's visual color theme.</li>
        <li>Tap custom links to explore their albums or tour charities.</li>
      </ul>
    `;
  }
  
  const modal = document.getElementById('help-modal');
  const context = document.getElementById('help-modal-context');
  if (modal && context) {
    context.innerHTML = tip;
    modal.classList.add('active');
  }
}

function showHelpBubble(text) {
  const bubble = document.getElementById('help-bubble');
  const bubbleText = document.getElementById('help-bubble-text');
  if (!bubble || !bubbleText) return;
  
  bubbleText.innerHTML = text;
  bubble.classList.add('active');
  
  setTimeout(() => {
    bubble.classList.remove('active');
  }, 4500);
}

// QR Code Canvas generator
function generateShareQRCode() {
  const canvas = document.getElementById('qr-canvas');
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#121212';
  drawFinderPattern(ctx, 10, 10, 45);
  drawFinderPattern(ctx, size - 55, 10, 45);
  drawFinderPattern(ctx, 10, size - 55, 45);

  const blockSize = 5;
  const numBlocks = size / blockSize;

  for (let x = 0; x < numBlocks; x++) {
    for (let y = 0; y < numBlocks; y++) {
      const isTopLeft = (x < 12 && y < 12);
      const isTopRight = (x > numBlocks - 13 && y < 12);
      const isBottomLeft = (x < 12 && y > numBlocks - 13);
      
      if (!isTopLeft && !isTopRight && !isBottomLeft) {
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

// PWA Install Event Handler
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Update small button display state if timeline is active
  const btn = document.getElementById('btn-install-pwa-small');
  if (btn) btn.style.display = 'inline-block';
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  loadCorpusData();

  // Dismiss Weather alert banner
  document.getElementById('btn-close-alert').addEventListener('click', (e) => {
    e.stopPropagation();
    state.dismissedAlertText = state.event?.weather?.forecast_summary || '';
    document.getElementById('alert-banner').style.display = 'none';
    
    // Sync Weather checkbox if active on screen
    const chk = document.getElementById('alert-banner-toggle');
    if (chk) chk.checked = false;
  });

  // Bind new Footer Restroom and help shortcut buttons
  document.getElementById('btn-foot-restroom').addEventListener('click', () => {
    state.activeViewport = 'venue';
    showVenueActionBar();
    document.getElementById('btn-venue-fac').click();
  });

  document.getElementById('btn-foot-help').addEventListener('click', () => {
    triggerPageHelp();
  });

  document.getElementById('btn-close-help-modal').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('active');
  });

  // Bind Long-Press handlers to main elements
  bindLongPress(document.getElementById('btn-home'));
  bindLongPress(document.getElementById('viewport-content'));
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        // Check for updates to sw.js
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available, reloading cache...');
            }
          });
        });
      })
      .catch(err => console.warn('Service Worker registration failed', err));
  }
});
