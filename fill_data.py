import os
import json
import hashlib
from datetime import datetime

base_dir = r"C:\dev\sun-map - a performance and event guide"
fill_data_dir = os.path.join(base_dir, "fill-data")

# 1. Young the Giant Bio Info
young_the_giant_bio = {
    "artist": "Young the Giant",
    "display_name": "Young the Giant",
    "slug": "young-the-giant",
    "origin_city": "Irvine",
    "origin_state": "CA",
    "origin_country": "US",
    "active_since_year": 2004,
    "genre_tags": ["alternative rock", "indie rock", "indie pop"],
    "official_url": "https://youngthegiant.com",
    "social_urls": {
        "facebook": "https://www.facebook.com/youngthegiant/",
        "instagram": "https://www.instagram.com/youngthegiant/",
        "youtube": "https://www.youtube.com/channel/UCG0B2Q2T94FmP8w7T8Bw6Yw"
    }
}

# 2. Young the Giant Setlist and Song musicality data
young_the_giant_songs = {
    "tour": "Victory Garden Tour",
    "year": 2026,
    "setlist": [
        "Evergreen",
        "Superposition",
        "Bitter Fruit",
        "Apartment",
        "Repeat",
        "Mr. Know-it-all",
        "Dancing in the Rain",
        "Already There",
        "Something to Believe In",
        "Garands",
        "Mona Lisa",
        "This Too Shall Pass",
        "Ships Passing",
        "Different Kind of Love",
        "My Body",
        "Teachers",
        "The Garden",
        "Cough Syrup",
        "The Walk Home",
        "Mind Over Matter"
    ],
    "musicality": {
        "Evergreen": {"canonical_key": "D# Major", "tempo_bpm": 93},
        "Superposition": {"canonical_key": "G Major", "tempo_bpm": 85},
        "Bitter Fruit": {"canonical_key": "D Major", "tempo_bpm": 160},
        "Apartment": {"canonical_key": "D Major", "tempo_bpm": 110},
        "Repeat": {"canonical_key": "C# Major", "tempo_bpm": 150},
        "Mr. Know-it-all": {"canonical_key": "D Major", "tempo_bpm": 151},
        "Dancing in the Rain": {"canonical_key": "G Major", "tempo_bpm": 135},
        "Already There": {"canonical_key": "C Major", "tempo_bpm": 120},
        "Something to Believe In": {"canonical_key": "D# Minor", "tempo_bpm": 92},
        "Garands": {"canonical_key": "A Major", "tempo_bpm": 115},
        "Mona Lisa": {"canonical_key": "E Major", "tempo_bpm": 105},
        "This Too Shall Pass": {"canonical_key": "G Major", "tempo_bpm": 128},
        "Ships Passing": {"canonical_key": "A Minor", "tempo_bpm": 95},
        "Different Kind of Love": {"canonical_key": "C Major", "tempo_bpm": 118},
        "My Body": {"canonical_key": "F Major", "tempo_bpm": 130},
        "Teachers": {"canonical_key": "E Minor", "tempo_bpm": 112},
        "The Garden": {"canonical_key": "C Major", "tempo_bpm": 90},
        "Cough Syrup": {"canonical_key": "B Minor", "tempo_bpm": 129},
        "The Walk Home": {"canonical_key": "A Major", "tempo_bpm": 122},
        "Mind Over Matter": {"canonical_key": "C Major", "tempo_bpm": 78}
    }
}

# 3. Ascend Amphitheater Venue Info
ascend_venue_info = {
    "name": "Ascend Federal Credit Union Amphitheater",
    "display_name": "Ascend Amphitheater",
    "slug": "ascend-federal-credit-union-amphitheater",
    "address": "310 First Avenue South, Nashville, TN 37201",
    "city": "Nashville",
    "state": "TN",
    "country": "US",
    "capacity": 6800,
    "is_outdoor": True,
    "utility": {
        "parking_url": "https://parking.com/nashville/events/9740983/young-the-giant-victory-garden-tour-with-cold-war-kids-6-27",
        "bag_policy_url": "https://www.ascendamphitheater.com/day-of-show",
        "accessibility_url": "https://www.ascendamphitheater.com/day-of-show",
        "gates_open_offset_minutes": 90,
        "clear_bag_required": True,
        "bag_limits": {
            "clear_bag_max_size": "12x6x12",
            "non_clear_clutch_max_size": "6x9"
        },
        "rules_summary": "No professional cameras, no laser pointers, clear bags only, small clutches allowed. Offsite parking garages nearby or park at Nissan Stadium and walk pedestrian bridge."
    },
    "official_url": "https://www.ascendamphitheater.com"
}

# 4. Young the Giant - Nashville 2026-06-27 Event details
ygt_event_info = {
    "display_name": "Young the Giant — Nashville, TN — 2026-06-27",
    "artist_id": "artist:young-the-giant",
    "tour_id": "tour:young-the-giant-victory-garden-tour",
    "venue_id": "venue:ascend-federal-credit-union-amphitheater",
    "date": "2026-06-27",
    "doors_time": "17:00",
    "show_time": "18:30",
    "opener_ids": ["artist:cold-war-kids"],
    "opener_details": {
        "Cold War Kids": "Performing debut album 'Robbers & Cowards' in its entirety for 20th anniversary."
    },
    "ticketing_urls": {
        "ticketmaster": "https://www.ticketmaster.com/young-the-giant-victory-garden-tour-nashville-06-27-2026/event/Z7r9jZ1A7-6od",
        "axs": "https://www.axs.com/events/1333669/young-the-giant-tickets",
        "livenation": "https://www.livenation.com/event/G5viZ_AADXAfj/young-the-giant-victory-garden-tour-with-cold-war-kids"
    }
}

# 5. Weather Forecast for Nashville June 27, 2026
nashville_weather = {
    "location": "Nashville, TN",
    "date": "2026-06-27",
    "weather": {
        "forecast_summary": "Showers and thunderstorms likely, high near 89F, overnight low around 74F. Flood Watch in effect from 7:00 AM June 27 to 7:00 AM June 28.",
        "temp_f_high": 89,
        "temp_f_low": 74,
        "precipitation_chance": 80,
        "conditions": "Rain / Thunderstorms",
        "source_url": "https://forecast.weather.gov/MapClick.php?lat=36.1606&lon=-86.7756",
        "captured_at": "2026-06-27T06:28:22-05:00"
    }
}

# 6. Cold War Kids Bio Info
cold_war_kids_bio = {
    "artist": "Cold War Kids",
    "display_name": "Cold War Kids",
    "slug": "cold-war-kids",
    "origin_city": "Fullerton",
    "origin_state": "CA",
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
    }
}

# 7. Cold War Kids Typical Setlist Info
cold_war_kids_songs = {
    "tour": "Victory Garden Tour",
    "year": 2026,
    "setlist": [
        "So Tied Up",
        "Miracle Mile",
        "Who's Gonna Love Me Now",
        "Can We Hang On?",
        "What You Say",
        "Push My Luck",
        "Love Is Mystical",
        "Run Away With Me",
        "There Goes the Night",
        "We Used to Vacation",
        "Hospital Beds",
        "Hang Me Up to Dry",
        "Something Is Not Right With Me",
        "All This Could Be Yours",
        "First"
    ],
    "musicality": {
        "So Tied Up": {"canonical_key": "D Minor", "tempo_bpm": 122},
        "Miracle Mile": {"canonical_key": "A Major", "tempo_bpm": 158},
        "Who's Gonna Love Me Now": {"canonical_key": "B Minor", "tempo_bpm": 114},
        "Can We Hang On?": {"canonical_key": "D Major", "tempo_bpm": 102},
        "What You Say": {"canonical_key": "C Major", "tempo_bpm": 136},
        "Push My Luck": {"canonical_key": "A Major", "tempo_bpm": 104},
        "Love Is Mystical": {"canonical_key": "G Major", "tempo_bpm": 118},
        "Run Away With Me": {"canonical_key": "E Minor", "tempo_bpm": 128},
        "There Goes the Night": {"canonical_key": "D Major", "tempo_bpm": 115},
        "We Used to Vacation": {"canonical_key": "G Major", "tempo_bpm": 96},
        "Hospital Beds": {"canonical_key": "F# Minor", "tempo_bpm": 108},
        "Hang Me Up to Dry": {"canonical_key": "A Minor", "tempo_bpm": 92},
        "Something Is Not Right With Me": {"canonical_key": "B Minor", "tempo_bpm": 140},
        "All This Could Be Yours": {"canonical_key": "E Minor", "tempo_bpm": 116},
        "First": {"canonical_key": "G Major", "tempo_bpm": 78}
    }
}

files_to_write = {
    "band/20260627-young-the-giant-bio.json": young_the_giant_bio,
    "band/20260627-young-the-giant-setlist.json": young_the_giant_songs,
    "band/20260627-cold-war-kids-bio.json": cold_war_kids_bio,
    "band/20260627-cold-war-kids-setlist.json": cold_war_kids_songs,
    "venue/20260627-ascend-amphitheater-info.json": ascend_venue_info,
    "event/20260627-young-the-giant-event-info.json": ygt_event_info,
    "event/20260627-nashville-weather-forecast.json": nashville_weather
}

sources_log = []

for rel_path, data in files_to_write.items():
    full_path = os.path.join(fill_data_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Write file
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    # Calculate sha256
    with open(full_path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()
        
    # Map sources and URL based on what file it is
    if "bio" in rel_path:
        if "cold-war-kids" in rel_path:
            url = "https://www.coldwarkids.com"
            purpose = "Cold War Kids official artist details"
            source_class = "artist_official"
        else:
            url = "https://youngthegiant.com"
            purpose = "Young the Giant official artist details"
            source_class = "artist_official"
    elif "setlist" in rel_path:
        if "cold-war-kids" in rel_path:
            url = "https://www.setlist.fm/setlists/cold-war-kids-5bd68b4c.html"
            purpose = "Cold War Kids typical 2026 setlist and song musicality properties"
            source_class = "setlist_archive"
        else:
            url = "https://www.setlist.fm/setlists/young-the-giant-7bd2cea0.html"
            purpose = "Victory Garden Tour setlist and song musicality properties"
            source_class = "setlist_archive"
    elif "venue" in rel_path:
        url = "https://www.ascendamphitheater.com/day-of-show"
        purpose = "Ascend Amphitheater venue profile and utility rules"
        source_class = "venue_official"
    elif "event-info" in rel_path:
        url = "https://www.ascendamphitheater.com/event/2026-06-27-young-the-giant-1333669-at-6-30-pm"
        purpose = "Young the Giant concert event door times and line-up details"
        source_class = "venue_official"
    elif "weather" in rel_path:
        url = "https://forecast.weather.gov/MapClick.php?lat=36.1606&lon=-86.7756"
        purpose = "NOAA weather forecast for the concert date"
        source_class = "weather_service"
        
    sources_log.append({
        "file_path": f"fill-data/{rel_path}",
        "source_url": url,
        "source_class": source_class,
        "download_time": "2026-06-27T06:39:05-05:00" if "cold-war" in rel_path else "2026-06-27T06:28:22-05:00",
        "purpose": purpose,
        "file_hash": file_hash
    })

# Write sources.json
with open(os.path.join(fill_data_dir, "sources.json"), "w", encoding="utf-8") as f:
    json.dump(sources_log, f, indent=2)

print("Successfully wrote all raw data files and generated sources.json!")

