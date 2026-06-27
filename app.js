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
  timelines: [],
  dismissedAlertText: null
};

// Transition effects pool (Loops 5 unique vintage modes)
const transitions = [
  // 1. Analog TV Static (Default scanline glitch)
  (overlay, content) => {
    overlay.style.background = 'rgba(18, 18, 18, 0.95)';
    content.style.filter = 'none';
  },
  // 2. Retro Pixel Blur
  (overlay, content) => {
    overlay.style.background = 'rgba(30, 20, 10, 0.85)';
    content.style.filter = 'blur(15px) contrast(150%)';
  },
  // 3. Vertical CRT Shutter
  (overlay, content) => {
    overlay.style.background = 'rgba(5, 10, 20, 0.9)';
    content.style.transform = 'translateY(80%)';
  },
  // 4. Glitch RGB Split
  (overlay, content) => {
    overlay.style.background = 'rgba(20, 20, 20, 0.9)';
    content.style.filter = 'hue-rotate(90deg) saturate(200%)';
  },
  // 5. Minimal Zune Crossfade
  (overlay, content) => {
    overlay.style.background = 'rgba(15, 15, 15, 0.3)';
    content.style.opacity = '0.1';
  }
];

let activeTransitionIndex = 0;

function triggerTransition(callback) {
  const overlay = document.getElementById('loading-overlay');
  const content = document.getElementById('viewport-content');
  
  // Pick transition effect from loop
  const effect = transitions[activeTransitionIndex];
  activeTransitionIndex = (activeTransitionIndex + 1) % transitions.length;
  
  overlay.classList.add('active');
  effect(overlay, content);
  
  setTimeout(() => {
    callback();
    setTimeout(() => {
      overlay.classList.remove('active');
      // Reset inline styles
      content.style.filter = 'none';
      content.style.transform = 'none';
      content.style.opacity = '1';
      overlay.style.background = '';
    }, 300);
  }, 500);
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
    const alertText = state.event.weather.forecast_summary;
    document.getElementById('alert-text').textContent = alertText;
    
    // Only display alert banner if it hasn't been dismissed for this exact text
    if (state.dismissedAlertText !== alertText) {
      document.getElementById('alert-banner').style.display = 'flex';
    } else {
      document.getElementById('alert-banner').style.display = 'none';
    }
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

    const bannerState = document.getElementById('alert-banner').style.display === 'none' ? '' : 'checked';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Weather & Risk Alerts</h2>
        <h3>NOAA Alert</h3>
        <p style="color:#ff9f0a; font-weight:700; margin-bottom:12px;">⚠️ FLOOD WATCH active from 7:00 AM June 27 to 7:00 AM June 28.</p>
        
        <div style="margin:14px 0; background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; font-size:0.8rem;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="alert-banner-toggle" ${bannerState}>
            <span>Show Alert Banner at top</span>
          </label>
        </div>

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

    // Bind Toggle behavior
    document.getElementById('alert-banner-toggle').addEventListener('change', (e) => {
      document.getElementById('alert-banner').style.display = e.target.checked ? 'flex' : 'none';
      if (!e.target.checked) {
        state.dismissedAlertText = state.event?.weather?.forecast_summary || '';
      } else {
        state.dismissedAlertText = null;
      }
    });
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
        <h2>Venue Policies & Access</h2>
        <div style="margin-bottom:14px; padding:10px; background:rgba(211,47,47,0.15); border-radius:6px; font-size:0.75rem; border-left:3px solid #d32f2f;">
          <strong>⚠️ Same-Night Traffic Alert:</strong>
          <p style="margin:2px 0 0 0; line-height:1.3; color:#ffb74d;">Alan Jackson's stadium concert is occurring at Nissan Stadium (Show 18:00). Expect intense congestion near the Pedestrian Bridge, parking lot R, and rideshare drops.</p>
        </div>

        <h3>Bag Guidelines</h3>
        <ul>
          <li><strong>Clear Bags:</strong> Max dimensions 12" x 6" x 12"</li>
          <li><strong>Clutches (Non-clear):</strong> Max dimensions 6" x 9"</li>
        </ul>
        
        <h3>ADA Access & Assistance</h3>
        <p><strong>ADA Drop-off:</strong> Corner of Molloy St & 1st Ave S.</p>
        <p><strong>Wheelchair Viewing:</strong> Elevated viewing platforms are situated at the East and West flanks of the lawn area.</p>
        <p><strong>Coordination & Assistance:</strong> Call the venue ADA line at <a href="tel:6152585944" style="color:var(--accent); text-decoration:none; font-weight:700;">615-258-5944</a>.</p>

        <h3>First Aid & Medical</h3>
        <p><strong>Plaza Stations:</strong> First aid tents located on the East and West plazas. Permanent AED (Defibrillator) units are stationed inside both tents.</p>
        <p><strong>EMT Epipens:</strong> EMT staff from WeGo/Metro Nashville carry Epipens inside first aid packs (shielded from outdoor summer heat degradation).</p>

        <h3>Restrooms (Descriptive Locations)</h3>
        <p>Restroom blocks are situated at the East and West flanks of the main lawn. Premium VIP restrooms are behind the stage-left box suites.</p>

        <div style="margin-top:16px; border-top:1px dashed #444; padding-top:14px; display:flex; flex-direction:column; gap:10px;">
          <button id="btn-show-emergency" style="background:#d32f2f; border:none; color:#fff; padding:10px; border-radius:6px; font-weight:700; cursor:pointer;">🚨 Life Safety & Evacuation Protocol</button>
          <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">In partnership with Event Safety Alliance standards.</p>
        </div>
      </div>
    `;

    document.getElementById('btn-show-emergency').addEventListener('click', renderEmergencySafety);
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
        
        <div class="timeline-item" style="margin-bottom:12px; border-left:2px solid var(--accent); padding-left:10px;">
          <div class="time-slot" style="font-weight:700; color:var(--accent);">17:00</div>
          <div class="event-details">
            <strong>Gates Open</strong>
            <p style="font-size:0.8rem; margin:0;">Security clearance, bag checks begin.</p>
          </div>
        </div>

        <div class="timeline-item" style="margin-bottom:12px; border-left:2px solid #555; padding-left:10px;">
          <div class="time-slot" style="font-weight:700;">18:00</div>
          <div class="event-details">
            <strong>almost monday Set</strong>
            <p style="font-size:0.8rem; margin:0;">Opening performance (30 min set).</p>
          </div>
        </div>

        <div class="timeline-item" style="margin-bottom:12px; border-left:2px solid #555; padding-left:10px;">
          <div class="time-slot" style="font-weight:700;">18:45</div>
          <div class="event-details">
            <strong>Cold War Kids Set</strong>
            <p style="font-size:0.8rem; margin:0;">20th Anniversary performance of "Robbers & Cowards" in full.</p>
          </div>
        </div>

        <div class="timeline-item" style="margin-bottom:12px; border-left:2px solid #555; padding-left:10px;">
          <div class="time-slot" style="font-weight:700;">20:15</div>
          <div class="event-details">
            <strong>Young the Giant Set</strong>
            <p style="font-size:0.8rem; margin:0;">Headline performance (Victory Garden Tour).</p>
          </div>
        </div>

        <div style="margin-top:16px; padding:10px; background:rgba(255,87,34,0.1); border-radius:6px; font-size:0.75rem; border-left:3px solid var(--accent);">
          <strong>⚠️ Lineup Conflict Fallback:</strong>
          <p style="margin:2px 0 0 0; line-height:1.3; color:#aaa;">Some aggregator lists (Songkick) show KennyHoopla instead. If the lineup changes on the fly, profiles for both acts are cached offline in this app.</p>
        </div>

        <div style="margin-top:16px; display:flex; gap:10px; font-size:0.8rem;">
          <button id="lnk-to-venue" style="background:transparent; border:1px solid #444; color:#fff; padding:6px; border-radius:4px; cursor:pointer;">🗺️ Venue Restrooms</button>
          <button id="lnk-to-band" style="background:transparent; border:1px solid #444; color:#fff; padding:6px; border-radius:4px; cursor:pointer;">🎸 Openers Lore</button>
        </div>
      </div>
    `;

    // Bind Timeline shortcuts
    document.getElementById('lnk-to-venue').addEventListener('click', () => {
      document.getElementById('btn-venue').click();
    });
    document.getElementById('lnk-to-band').addEventListener('click', () => {
      document.getElementById('btn-band').click();
    });
  });
});

// Render Band Detail Card: The Lore Garden
document.getElementById('btn-band').addEventListener('click', () => {
  triggerTransition(renderLoreGarden);
});

function renderLoreGarden() {
  const viewport = document.getElementById('main-viewport');
  viewport.className = 'viewport-square theme-tour'; // deep artsy purple

  const content = document.getElementById('viewport-content');
  content.innerHTML = `
    <div class="details-view">
      <h2>The Lore Garden</h2>
      <p style="font-size:0.85rem; color:#aaa; margin-bottom:16px; font-style:italic;">"Tending the human connections behind the sound." Explore the lore, stories, and musicality of tonight's lineup.</p>
      
      <div style="display:grid; grid-template-columns:1fr; gap:10px; font-family:'Segoe UI', sans-serif;">
        <button class="lore-node-btn" id="lore-sameer" style="text-align:left; background:rgba(255,255,255,0.04); border:1px solid #444; color:#fff; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>Sameer Gadhia &bull; Vocal Delivery</strong>
          <div style="font-size:0.75rem; color:#ff9f0a; margin-top:2px;">Cultural duality, vocal presence, and the micro-KORG.</div>
        </button>

        <button class="lore-node-btn" id="lore-garden-origins" style="text-align:left; background:rgba(255,255,255,0.04); border:1px solid #444; color:#fff; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>Victory Garden Origins &bull; Themes</strong>
          <div style="font-size:0.75rem; color:#ff9f0a; margin-top:2px;">"Caring through chaos" and planting radical empathy.</div>
        </button>

        <button class="lore-node-btn" id="lore-gear" style="text-align:left; background:rgba(255,255,255,0.04); border:1px solid #444; color:#fff; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>Guitar-Lore & Harmonies &bull; Sound</strong>
          <div style="font-size:0.75rem; color:#ff9f0a; margin-top:2px;">Tilley's delay loop grids and Cannata's vocal lines.</div>
        </button>

        <button class="lore-node-btn" id="lore-cwk" style="text-align:left; background:rgba(255,255,255,0.04); border:1px solid #444; color:#fff; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>Cold War Kids &bull; Blues-Rock</strong>
          <div style="font-size:0.75rem; color:#ff9f0a; margin-top:2px;">Robbers & Cowards debut album, and "Hang Me Up to Dry".</div>
        </button>

        <button class="lore-node-btn" id="lore-monday" style="text-align:left; background:rgba(255,255,255,0.04); border:1px solid #444; color:#fff; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>almost monday &bull; Surf Pop</strong>
          <div style="font-size:0.75rem; color:#ff9f0a; margin-top:2px;">San Diego surf vibes, and wrapping the run tonight.</div>
        </button>

        <button class="lore-node-btn" id="lore-hoopla" style="text-align:left; background:rgba(255,255,255,0.04); border:1px dashed #666; color:#aaa; padding:12px; border-radius:6px; cursor:pointer;">
          <strong>KennyHoopla &bull; Conflict Cache</strong>
          <div style="font-size:0.75rem; color:#888; margin-top:2px;">Alternative support information saved offline just in case.</div>
        </button>
      </div>
    </div>
  `;

  // Bind Lore Links
  document.getElementById('lore-sameer').addEventListener('click', () => {
    renderLoreDetail("Sameer Gadhia", `
      <p>Sameer Gadhia's voice serves as the melodic anchor of Young the Giant. His songwriting often addresses themes of cultural duality, immigration, and finding identity inside modern spaces.</p>
      <p><strong>Stage Setup:</strong> Sameer runs lead vocals alongside a center-stage micro-KORG synthesizer which he uses to trigger ambient pads and synth offsets during transitions (most notably on "Superposition" and "Mind Over Matter").</p>
    `);
  });

  document.getElementById('lore-garden-origins').addEventListener('click', () => {
    renderLoreDetail("Victory Garden Origins", `
      <p>The sixth studio album <em>Victory Garden</em> represents a massive shift towards active, community-based resilience. Rather than treating hope as a passive feeling, the band frames it as something that must be actively planted, tended, and fought for.</p>
      <p>This "caring through chaos" ethos inspires the organic block-print sun logo, representing warm soil, roots, and collaborative survival in an increasingly digital and disconnected era.</p>
    `);
  });

  document.getElementById('lore-gear').addEventListener('click', () => {
    renderLoreDetail("Guitar-Lore & Harmonies", `
      <p>The band's distinctive atmospheric soundscape relies on the tight interplay between Jacob Tilley and Eric Cannata.</p>
      <p><strong>Jacob Tilley:</strong> Builds complex delay loop grids on the fly, creating a rhythmic and ethereal guitar layer that allows Sameer's vocals to float.</p>
      <p><strong>Eric Cannata:</strong> Provides the crisp, tight harmony backing vocals that create the band's signature choir-like chorus elevations. His guitar work focuses on rhythmic counter-melodies.</p>
    `);
  });

  document.getElementById('lore-cwk').addEventListener('click', () => {
    renderLoreDetail("Cold War Kids", `
      <p>Fullerton, California's Cold War Kids have been a force in alternative rock since 2004, known for blues-influenced indie rock driven by aggressive piano chords and soulful vocals.</p>
      <p>On tonight's program, they perform their landmark debut album <em>Robbers & Cowards</em> in full, commemorating its 20th anniversary. Highlights include the frantic, bass-heavy hooks of "Hang Me Up to Dry" and the emotional, hospital-corridor weight of "Hospital Beds".</p>
    `);
  });

  document.getElementById('lore-monday').addEventListener('click', () => {
    renderLoreDetail("almost monday", `
      <p>San Diego-based surf-pop trio almost monday brings sun-drenched indie pop and funky basslines to tonight's opening slot.</p>
      <p>Confirmed by label releases (Hollywood Records), their summer tour run wraps tonight here in Nashville, making this performance a celebratory final show of their current support run.</p>
    `);
  });

  document.getElementById('lore-hoopla').addEventListener('click', () => {
    renderLoreDetail("KennyHoopla (Conflict Safeguard)", `
      <p>KennyHoopla (Cleveland native Kenneth La'ron) is known for post-punk, dance-punk, and high-energy alternative rock. His breakout work includes collaborations with Travis Barker.</p>
      <p><strong>Lineup Safeguard:</strong> Although official venue files show almost monday playing the opening slot, Songkick listed KennyHoopla. We keep his profile cached here so you have access to his bio and material if there's a surprise lineup swap on stage.</p>
    `);
  });
}

function renderLoreDetail(title, htmlContent) {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-ytg';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>${title}</h2>
        <div style="font-size:0.9rem; line-height:1.6; color:rgba(255,255,255,0.9); margin-bottom:20px;">
          ${htmlContent}
        </div>
        <button id="btn-back-garden" style="background:transparent; border:1px solid #ff5722; color:#ff5722; padding:10px 16px; border-radius:6px; cursor:pointer; font-weight:700;">&larr; Back to Lore Garden</button>
      </div>
    `;

    document.getElementById('btn-back-garden').addEventListener('click', () => {
      triggerTransition(renderLoreGarden);
    });
  });
}

function renderEmergencySafety() {
  triggerTransition(() => {
    const viewport = document.getElementById('main-viewport');
    viewport.className = 'viewport-square theme-utility';

    const content = document.getElementById('viewport-content');
    content.innerHTML = `
      <div class="details-view">
        <h2>Life Safety & Evacuation</h2>
        <p style="font-size:0.8rem; color:#aaa; font-style:italic; margin-bottom:12px;">Provided in compliance with Event Safety Alliance standards.</p>
        
        <h3 style="color:#d32f2f;">⚠️ SILENCE IS NOT A DRILL PROTOCOL</h3>
        <p>If the stage performance suddenly goes silent and the stage lights go to a <strong>full white wash</strong> (no show colors or projection panels), it indicates an <strong>Official Show Hold</strong>. Please look to staff, and do not mistake it for a band intermission or encore delay.</p>

        <h3>🌪️ Weather Evacuation & Shelter</h3>
        <p>In case of severe storm warnings or active lightning: exit the venue and seek shelter inside your vehicle or the designated regional storm shelter zone at <strong>Nissan Stadium East Bank parking lots (Lot R)</strong>.</p>

        <h3>🚶 Evacuation Routes</h3>
        <ul>
          <li><strong>Main Gate Exit:</strong> Exit south towards Molloy St. and walk east over the Pedestrian Bridge.</li>
          <li><strong>Gate 2/4 Exit:</strong> Exit north towards Woodland St. for pedestrian pathways.</li>
        </ul>

        <h3>📞 Medical Emergency Contact</h3>
        <p>Contact Venue Security dispatch: <a href="tel:6152585944" style="color:var(--accent); text-decoration:none; font-weight:700;">615-258-5944</a> or locate staff in reflective vests at the East/West plazas.</p>
        
        <button id="btn-back-venue" style="margin-top:16px; background:transparent; border:1px solid #d32f2f; color:#d32f2f; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:700;">&larr; Back to Venue Policies</button>
      </div>
    `;

    document.getElementById('btn-back-venue').addEventListener('click', () => {
      document.getElementById('btn-venue').click();
    });
  });
}

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

  // Dismiss Weather alert banner
  document.getElementById('btn-close-alert').addEventListener('click', (e) => {
    e.stopPropagation();
    state.dismissedAlertText = state.event?.weather?.forecast_summary || '';
    document.getElementById('alert-banner').style.display = 'none';
  });
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered successfully', reg))
      .catch(err => console.warn('Service Worker registration failed', err));
  }
});
