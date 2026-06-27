# STARTER_URLS

This file gives Antigravity a focused starter URL list for the current live event package. It is organized by the core grouping layers the system needs to construct content from: artist, tour, venue, event, and weather.

## Current example scope

- artist: `Young the Giant`
- tour: `Victory Garden Tour`
- venue: `Ascend Federal Credit Union Amphitheater`
- event: `Young the Giant - Victory Garden Tour with Cold War Kids`
- event date: `2026-06-27`
- city: `Nashville, TN`

## Use model

For each URL, capture:
- `url`
- `source_class`
- `group_layer`
- `primary_scope`
- `expected_targets`
- `source_family`
- `trust_notes`
- `likely_conflicts`

Do not over-seed prior tour dates as full event packages for this run. Prior dates may later inform tour context, but tomorrow's event package should focus on tomorrow's event graph.

## Artist URLs

### Official site
- URL: `https://youngthegiant.com`
- `source_class`: `artist_official`
- `group_layer`: `artist`
- `primary_scope`: `artist|tour|event`
- `expected_targets`: artist identity, official tour dates, event listing, outbound links
- `source_family`: `young-the-giant-official`
- `trust_notes`: primary artist anchor
- `likely_conflicts`: stale tour copy or delayed edits

### Official Facebook
- URL: `https://www.facebook.com/youngthegiant/`
- `source_class`: `social_post`
- `group_layer`: `artist`
- `primary_scope`: `artist|tour`
- `expected_targets`: announcements, promo timing, social phrasing
- `source_family`: `facebook-youngthegiant`
- `trust_notes`: useful direct band-adjacent signal
- `likely_conflicts`: promo framing, incomplete operational detail

### Official Instagram sales / promo vector
- URL: `https://www.instagram.com/reel/DU_S5cNEYGo/`
- `source_class`: `social_post`
- `group_layer`: `artist`
- `primary_scope`: `tour`
- `expected_targets`: sales announcement language, promo timing
- `source_family`: `instagram-young-the-giant`
- `trust_notes`: good artist-side current-tour signal
- `likely_conflicts`: teaser language may not map directly to event facts

### Official YouTube music vector
- URL: `https://www.youtube.com/watch?v=yAj77OQF0sU`
- `source_class`: `platform_official`
- `group_layer`: `artist`
- `primary_scope`: `artist|song|album`
- `expected_targets`: official metadata, outbound platform links, song/album packaging
- `source_family`: `youtube-young-the-giant`
- `trust_notes`: strong platform metadata input
- `likely_conflicts`: promotional wording or partial metadata

## Tour URLs

### Ticketmaster artist / tour dates page
- URL: `https://www.ticketmaster.com/young-the-giant-tickets/artist/1482431`
- `source_class`: `ticketing`
- `group_layer`: `tour`
- `primary_scope`: `artist|tour|event`
- `expected_targets`: tour routing, event schedule, linked venue/event entries
- `source_family`: `ticketmaster`
- `trust_notes`: strong tour-distribution source
- `likely_conflicts`: event sync lag vs venue systems

### Live Nation artist events page
- URL: `https://www.livenation.com/artist/K8vZ917GU-V/young-the-giant-events`
- `source_class`: `platform_official`
- `group_layer`: `tour`
- `primary_scope`: `artist|tour|event`
- `expected_targets`: upcoming dates, event listing structure, promoter-side phrasing
- `source_family`: `live-nation`
- `trust_notes`: strong distribution-side tour source
- `likely_conflicts`: mirrored metadata from ticketing feeds

### Setlist archive artist page
- URL: `https://www.setlist.fm/setlists/young-the-giant-7bd2cea0.html`
- `source_class`: `setlist_archive`
- `group_layer`: `tour`
- `primary_scope`: `artist|tour|song`
- `expected_targets`: recent set trends, active songs, prior tour naming
- `source_family`: `setlist-fm`
- `trust_notes`: useful tour-context signal, not primary truth
- `likely_conflicts`: user-submitted variance

## Venue URLs

### Official venue homepage
- URL: `https://www.ascendamphitheater.com`
- `source_class`: `venue_official`
- `group_layer`: `venue`
- `primary_scope`: `venue`
- `expected_targets`: venue identity, house rules, navigation to day-of pages
- `source_family`: `ascend-official`
- `trust_notes`: primary venue anchor
- `likely_conflicts`: site-wide policy may be less specific than event pages

### Official venue events list
- URL: `https://www.ascendamphitheater.com/events/filtered/2026/June`
- `source_class`: `venue_official`
- `group_layer`: `venue`
- `primary_scope`: `venue|event`
- `expected_targets`: venue calendar context, event discovery, date confirmation
- `source_family`: `ascend-official`
- `trust_notes`: strong venue-side event index
- `likely_conflicts`: minor lag vs dedicated event page

### Day-of-show page
- URL: `https://www.ascendamphitheater.com/day-of-show`
- `source_class`: `venue_official`
- `group_layer`: `venue`
- `primary_scope`: `venue|event`
- `expected_targets`: bag policy, day-of entry process, operational reminders
- `source_family`: `ascend-official`
- `trust_notes`: high-value venue utility page
- `likely_conflicts`: special-event exceptions may not be fully reflected

### Secondary venue rules page
- URL: `https://www.nashvilleamphitheater.net/rules/`
- `source_class`: `press`
- `group_layer`: `venue`
- `primary_scope`: `venue`
- `expected_targets`: simplified rules wording, alternate phrasing for policy extraction
- `source_family`: `nashvilleamphitheater-net`
- `trust_notes`: secondary convenience source only
- `likely_conflicts`: unofficial wording drift

### Secondary parking context
- URL: `https://blog.ticketmaster.com/step-inside-ascend-amphitheater-nashville-tn/`
- `source_class`: `press`
- `group_layer`: `venue`
- `primary_scope`: `venue`
- `expected_targets`: parking and accessibility context, general venue guidance
- `source_family`: `ticketmaster-blog`
- `trust_notes`: contextual support only
- `likely_conflicts`: not event-specific, may age out

## Event URLs

### Official Ascend event page
- URL: `https://www.ascendamphitheater.com/event/2026-06-27-young-the-giant-1333669-at-6-30-pm`
- `source_class`: `venue_official`
- `group_layer`: `event`
- `primary_scope`: `event`
- `expected_targets`: event title, event time, headline billing, on-sale state, direct venue framing
- `source_family`: `ascend-official`
- `trust_notes`: primary event anchor
- `likely_conflicts`: lineup/order wording may vary across sellers

### AXS event page
- URL: `https://www.axs.com/events/1333669/young-the-giant-tickets`
- `source_class`: `ticketing`
- `group_layer`: `event`
- `primary_scope`: `event`
- `expected_targets`: event time, lineup participants, ticketing identifiers
- `source_family`: `axs`
- `trust_notes`: strong event transaction source
- `likely_conflicts`: copy differences vs venue page

### Ticketmaster event page
- URL: `https://www.ticketmaster.com/young-the-giant-victory-garden-tour-nashville-06-27-2026/event/Z7r9jZ1A7-6od`
- `source_class`: `ticketing`
- `group_layer`: `event`
- `primary_scope`: `event`
- `expected_targets`: event title, start time, venue binding, sales metadata
- `source_family`: `ticketmaster`
- `trust_notes`: strong event distribution source
- `likely_conflicts`: feed lag or title variation

### Live Nation event page
- URL: `https://www.livenation.com/event/G5viZ_AADXAfj/young-the-giant-victory-garden-tour-with-cold-war-kids`
- `source_class`: `platform_official`
- `group_layer`: `event`
- `primary_scope`: `event`
- `expected_targets`: event framing, lineup wording, linked ticket flow
- `source_family`: `live-nation`
- `trust_notes`: good event corroboration source
- `likely_conflicts`: mirrored metadata

### Parking event page
- URL: `https://parking.com/nashville/events/9740983/young-the-giant-victory-garden-tour-with-cold-war-kids-6-27`
- `source_class`: `map_service`
- `group_layer`: `event`
- `primary_scope`: `event|venue`
- `expected_targets`: parking discovery, nearby lots, event parking linkage
- `source_family`: `parking-com`
- `trust_notes`: practical parking supplement
- `likely_conflicts`: not authoritative for venue policy

### Setlist placeholder page
- URL: `https://www.setlist.fm/show/2026-06-27/ascend-amphitheater-nashville-tn-6b8986ee.html?setlist=6b4b5642`
- `source_class`: `setlist_archive`
- `group_layer`: `event`
- `primary_scope`: `event|song`
- `expected_targets`: event stub, post-show setlist, recap structure
- `source_family`: `setlist-fm`
- `trust_notes`: useful for post-show enrichment, not pre-show authority
- `likely_conflicts`: pre-show incompleteness

## Weather URLs

### NOAA point forecast
- URL: `https://forecast.weather.gov/MapClick.php?lat=36.1606&lon=-86.7756`
- `source_class`: `weather_service`
- `group_layer`: `weather`
- `primary_scope`: `venue|event`
- `expected_targets`: official forecast, temperature, rain chance, wind
- `source_family`: `noaa`
- `trust_notes`: primary official weather source
- `likely_conflicts`: less granular than hourly commercial products

### Commercial hourly weather
- URL: `https://weather.com/weather/hourbyhour/l/Nashville+TN`
- `source_class`: `weather_service`
- `group_layer`: `weather`
- `primary_scope`: `event`
- `expected_targets`: hourly event-window weather detail
- `source_family`: `weather-com`
- `trust_notes`: useful hourly complement
- `likely_conflicts`: may disagree with NOAA timing or intensity

## Optional later-phase URLs

These are useful later, but are not core starter URLs for tomorrow's event package:
- prior show event pages
- rich prior-show recaps
- deep fan threads about yesterday's date
- older event parking pages from other venues

## Goal

This starter list should help Antigravity construct content from the exact grouping layers the system needs now:
- artist
- tour
- venue
- event
- weather

It should not distract the run with rich prior-event ingestion that is not operationally necessary for tomorrow.
