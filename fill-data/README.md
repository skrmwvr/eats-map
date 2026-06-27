# Fill Data Directory

This directory is designated for storing raw downloaded data to populate the database with information regarding bands, events, venues, and other details (such as concerts and artist profiles).

## Folder Structure

- `/band`: Contains raw download data about bands, artists, and musicians (e.g., Young the Giant data).
- `/event`: Contains schedules, concert listings, and performance event details.
- `/venue`: Contains venue profiles, address details, locations, contact info, and seating capacities.

## Source Recording and Reconciliation Guidelines

To maintain auditability and allow verification of ingested data, please adhere to these rules when saving raw data files:
1. **Source Logging**: For every download, log the entry in `sources.json` or document:
   - **Source URL / API Endpoint**: Exact URL/Endpoint from where data was pulled.
   - **Download Date & Time**: When the file was retrieved.
   - **Purpose**: Why this data was downloaded (e.g., "Young the Giant tour data").
   - **File Hash**: SHA-256 or MD5 hash of the original raw file.
2. **File Naming**: Name raw files clearly, including the source and a date identifier:
   - *Example*: `YYYYMMDD-spotify-young-the-giant.json`
3. **Immutability**: Raw files must never be edited directly. Any formatting, parsing, or cleanup should be executed by script tools processing the data into downstream stages or databases.

## Ingestion Progress Tracking

Use the table below to log current ingestion status of files stored in this folder structure:

| Date | File Path | Destination Table/Entity | Status | Notes / Errors |
|------|-----------|--------------------------|--------|----------------|
| 2026-06-27 | [20260627-young-the-giant-bio.json](file:///c:/dev/sun-map%20-%20a%20performance%20and%20event%20guide/fill-data/band/20260627-young-the-giant-bio.json) | `Artist` | `captured` | Raw bio & social vectors |
| 2026-06-27 | [20260627-young-the-giant-setlist.json](file:///c:/dev/sun-map%20-%20a%20performance%20and%20event%20guide/fill-data/band/20260627-young-the-giant-setlist.json) | `Song`, `PerformanceContext` | `captured` | Core song list with keys & tempos |
| 2026-06-27 | [20260627-ascend-amphitheater-info.json](file:///c:/dev/sun-map%20-%20a%20performance%20and%20event%20guide/fill-data/venue/20260627-ascend-amphitheater-info.json) | `Venue` | `captured` | Capacity, rules, parking, bag rules |
| 2026-06-27 | [20260627-young-the-giant-event-info.json](file:///c:/dev/sun-map%20-%20a%20performance%20and%20event%20guide/fill-data/event/20260627-young-the-giant-event-info.json) | `Event` | `captured` | Schedule, lineups, AXS ticketing details |
| 2026-06-27 | [20260627-nashville-weather-forecast.json](file:///c:/dev/sun-map%20-%20a%20performance%20and%20event%20guide/fill-data/event/20260627-nashville-weather-forecast.json) | `Event.weather` | `captured` | NOAA forecast (flood watch, storms) |

