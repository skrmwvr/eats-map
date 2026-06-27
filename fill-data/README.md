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
|      |           |                          |        |                |
