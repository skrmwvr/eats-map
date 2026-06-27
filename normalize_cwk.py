import os
import json
import re

base_dir = r"C:\dev\sun-map - a performance and event guide"
fill_data_dir = os.path.join(base_dir, "fill-data")
bundles_dir = os.path.join(base_dir, "bundles")

# Load catalog
with open(os.path.join(fill_data_dir, "band", "cold-war-kids-catalog.json"), "r", encoding="utf-8") as f:
    catalog_data = json.load(f)

# Load setlist
with open(os.path.join(fill_data_dir, "band", "20260627-cold-war-kids-setlist.json"), "r", encoding="utf-8") as f:
    setlist_data = json.load(f)

def slugify(title):
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s-]+", "-", s)
    return s.strip("-")

# 1. Write Artist
artist_jsonc = """// Normalized Artist entity for Cold War Kids
{
  "id": "artist:cold-war-kids",
  "type": "artist",
  "name": "Cold War Kids",
  "display_name": "Cold War Kids",
  "slug": "cold-war-kids",
  "origin_city": "Fullerton",
  "origin_country": "US",
  "active_since_year": 2004,
  "genre_tags": [
    "indie rock",
    "alternative rock",
    "indie pop",
    "blues rock",
    "soul"
  ],
  "official_url": "https://www.coldwarkids.com",
  "social_urls": {
    "facebook": "https://www.facebook.com/coldwarkids",
    "instagram": "https://www.instagram.com/coldwarkids",
    "youtube": "https://www.youtube.com/@coldwarkidsvideos"
  },
  "sources": [
    "source:artist_official:cold-war-kids-bio"
  ],
  "confidence": 0.95,
  "lifecycle": "stable"
}
"""

os.makedirs(os.path.join(bundles_dir, "artists"), exist_ok=True)
with open(os.path.join(bundles_dir, "artists", "artist-cold-war-kids.jsonc"), "w", encoding="utf-8") as f:
    f.write(artist_jsonc)

# 2. Write Songs
os.makedirs(os.path.join(bundles_dir, "songs"), exist_ok=True)

catalog_lookup = {slugify(item["title"]): item for item in catalog_data["catalog"]}

for song_name in setlist_data["setlist"]:
    song_slug = slugify(song_name)
    song_id = f"song:cold-war-kids-{song_slug}"
    
    # Check catalog lookup
    cat_match = catalog_lookup.get(song_slug)
    
    if cat_match:
        album_name = cat_match.get("album")
        release_year = cat_match.get("release_year")
        track_number = cat_match.get("track_number")
        # Use catalog values for canonical musicality
        canonical_key = cat_match.get("canonical_key")
        tempo_bpm = cat_match.get("tempo_bpm")
    else:
        album_name = None
        release_year = None
        track_number = None
        # Use setlist values for canonical musicality if catalog not available
        setlist_mus = setlist_data["musicality"].get(song_name, {})
        canonical_key = setlist_mus.get("canonical_key")
        tempo_bpm = setlist_mus.get("tempo_bpm")
        
    sources = ["source:setlist_archive:cold-war-kids-setlist"]
    confidence = 0.75
    lifecycle = "draft"
        
    song_jsonc = f"""// Normalized Song entity for {song_name}
{{
  "id": "{song_id}",
  "type": "song",
  "name": "{song_name}",
  "display_name": "{song_name}",
  "slug": "{song_slug}",
  "artist_id": "artist:cold-war-kids",
  "album_id": null,
  "release_year": {json.dumps(release_year)},
  "track_number": {json.dumps(track_number)},
  "musicality": {{
    "canonical_key": {json.dumps(canonical_key)},
    "tempo_bpm": {json.dumps(tempo_bpm)},
    "time_signature": null,
    "primary_genre": "indie rock"
  }},
  "micro_summary": null,
  "sources": {json.dumps(sources)},
  "confidence": {confidence},
  "lifecycle": "{lifecycle}"
}}
"""
    with open(os.path.join(bundles_dir, "songs", f"song-cold-war-kids-{song_slug}.jsonc"), "w", encoding="utf-8") as sf:
        sf.write(song_jsonc)

print("Cold War Kids normalization completed successfully!")
