import os
import json
import hashlib

base_dir = r"C:\dev\sun-map - a performance and event guide"
fill_data_dir = os.path.join(base_dir, "fill-data")

# Files to add
new_files = {
    "band/20260627-cold-war-kids-bio.json": {
        "source_url": "https://www.coldwarkids.com",
        "source_class": "artist_official",
        "purpose": "Cold War Kids official artist details"
    },
    "band/20260627-cold-war-kids-setlist.json": {
        "source_url": "https://www.setlist.fm/setlists/cold-war-kids-5bd68b4c.html",
        "source_class": "setlist_archive",
        "purpose": "Cold War Kids typical 2026 setlist and song musicality properties"
    }
}

# Read existing sources.json
sources_path = os.path.join(fill_data_dir, "sources.json")
if os.path.exists(sources_path):
    with open(sources_path, "r", encoding="utf-8") as f:
        sources_log = json.load(f)
else:
    sources_log = []

# Exclude existing ones to avoid duplication
existing_paths = {item["file_path"] for item in sources_log}

for rel_path, info in new_files.items():
    full_path = os.path.join(fill_data_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        file_path_str = f"fill-data/{rel_path}"
        if file_path_str not in existing_paths:
            sources_log.append({
                "file_path": file_path_str,
                "source_url": info["source_url"],
                "source_class": info["source_class"],
                "download_time": "2026-06-27T06:39:05-05:00",
                "purpose": info["purpose"],
                "file_hash": file_hash
            })

# Save updated sources.json
with open(sources_path, "w", encoding="utf-8") as f:
    json.dump(sources_log, f, indent=2)

print("Updated sources.json successfully!")
