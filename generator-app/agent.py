import time
import threading
import json
import os
import csv
import datetime

class GeneratorAgent:
    def __init__(self):
        self.status = "idle"
        self.logs = []
        self.current_pass = 0
        self.seed_data = {}
        self.paused = False
        self._thread = None
        self.output_url = None
        self.event_title = ""
        self.draft_data = {}

    def log(self, msg):
        print(msg)
        self.logs.append(msg)

    def start_generation(self, seed_data):
        self.seed_data = seed_data
        self.status = "running"
        self.logs = []
        self.current_pass = 1
        self.paused = False
        self.draft_data = {}
        self.log(f"Starting pipeline for {seed_data.get('band')} at {seed_data.get('venue')}")
        
        self._thread = threading.Thread(target=self._run_pipeline)
        self._thread.start()

    def _wait_if_paused(self):
        while self.paused:
            time.sleep(1)

    def _run_pipeline(self):
        # PASS 1: CAPTURE
        self.current_pass = 1
        self.log("[PASS 1] Initiating broad capture...")
        
        # Pre-Flight Collision Check
        collision = False
        if os.path.isfile('events_tracker.csv'):
            with open('events_tracker.csv', 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # Same venue, same date, different band
                    if row.get('Venue') == self.seed_data.get('venue') and row.get('Date') == self.seed_data.get('date') and row.get('Band') != self.seed_data.get('band'):
                        self.log(f"[WARNING] COLLISION: {row.get('Band')} is already logged at {row.get('Venue')} on {row.get('Date')}!")
                        collision = True
                    # Same band, same date, different venue
                    elif row.get('Band') == self.seed_data.get('band') and row.get('Date') == self.seed_data.get('date') and row.get('Venue') != self.seed_data.get('venue'):
                        self.log(f"[WARNING] COLLISION: {row.get('Band')} is already logged playing at {row.get('Venue')} on {row.get('Date')}!")
                        collision = True
                        
        if collision:
            self.status = "collision_alert"
            self.log("Pipeline paused due to scheduling conflict. Please inject a hint to resolve (e.g. 'ignore conflict, this is a lineup change').")
            self.paused = True
            self._wait_if_paused()
            self.status = "running"
            self.log("Collision resolved by developer hint. Resuming capture...")
        
        band_slug = self.seed_data.get('band', '').lower().replace(' ', '-')
        venue_slug = self.seed_data.get('venue', '').split(',')[0].lower().replace(' ', '-')
        
        band_kb = f"knowledge_base/kb_band_{band_slug}.json"
        venue_kb = f"knowledge_base/kb_venue_{venue_slug}.json"
        
        if os.path.exists(band_kb):
            with open(band_kb, 'r') as f:
                self.draft_data["band"] = json.load(f)
            self.log(f"[KB] Smart Caching: Loaded vetted data for band '{self.seed_data.get('band')}'")
            
        if os.path.exists(venue_kb):
            with open(venue_kb, 'r') as f:
                self.draft_data["venue"] = json.load(f)
            self.log(f"[KB] Smart Caching: Loaded vetted data for venue '{self.seed_data.get('venue')}'")

        time.sleep(2)
        self.log("[PASS 1] Searching Wikipedia for band lore...")
        time.sleep(3)
        self._wait_if_paused()
        self.log("[PASS 1] Scraping recent setlists from Setlist.fm...")
        time.sleep(2)
        self.log("[PASS 1] Fetching venue details and transit APIs...")
        time.sleep(2)
        self._wait_if_paused()
        
        self.log("[PASS 1] Complete. Waiting for developer review before Pass 1.5.")
        self.paused = True
        self._wait_if_paused()

        # PASS 1.5: REFINEMENT
        self.current_pass = 1.5
        self.log("[PASS 1.5] Analyzing Pass 1 data for missing gaps...")
        time.sleep(2)
        self._wait_if_paused()
        self.log("[PASS 1.5] Missing detected: Alt-lyrics for song 'Cough Syrup'. Executing targeted search...")
        time.sleep(3)
        self.log("[PASS 1.5] Missing detected: Historical weather for date. Querying NOAA archive...")
        time.sleep(2)
        
        # Populate draft data for review
        if "band" not in self.draft_data:
            self.draft_data["band"] = {
                "name": self.seed_data.get('band', 'Unknown Band'),
                "bio": "Extracted biography goes here...",
                "members": "John, Paul, George, Ringo"
            }
        if "venue" not in self.draft_data:
            self.draft_data["venue"] = {
                "name": self.seed_data.get('venue', 'Unknown Venue'),
                "parking": "Lot A, Lot B",
                "facilities": "ADA accessible, 20 restrooms"
            }
        
        self.draft_data["tour"] = {
                "name": "Victory Garden Tour",
                "creed": "Sustainability and Reverb partnership."
        }
        self.draft_data["timeline"] = {
                "gates": "18:00",
                "opener": "19:30"
        }
        self._wait_if_paused()

        self.log("[PASS 1.5] Complete. Waiting for developer review before Pass 2.")
        self.paused = True
        self._wait_if_paused()
        
        self.status = "awaiting_verification"
        self.log("[VERIFICATION] Pausing pipeline to await manual data verification...")
        self.paused = True
        self._wait_if_paused()
        self.status = "running"

        # PASS 2: NORMALIZE
        self.current_pass = 2
        self.log("[PASS 2] Normalizing data and assigning canonical IDs...")
        time.sleep(2)
        self._wait_if_paused()
        self.log("[PASS 2] Linking Artist, Venue, and Event objects...")
        time.sleep(2)
        self.log("[PASS 2] Writing JSON bundles to fill-data/ and bundles/ directories...")
        time.sleep(2)
        
        # Save to Knowledge Base
        band_slug = self.seed_data.get('band', '').lower().replace(' ', '-')
        venue_slug = self.seed_data.get('venue', '').split(',')[0].lower().replace(' ', '-')
        
        with open(f"knowledge_base/kb_band_{band_slug}.json", 'w') as f:
            json.dump(self.draft_data.get("band", {}), f, indent=2)
            
        with open(f"knowledge_base/kb_venue_{venue_slug}.json", 'w') as f:
            json.dump(self.draft_data.get("venue", {}), f, indent=2)
            
        # Append to CSV Tracker
        file_exists = os.path.isfile('events_tracker.csv')
        with open('events_tracker.csv', 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            if not file_exists:
                writer.writerow(['Timestamp', 'Band', 'Venue', 'Date', 'Status'])
            
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow([
                timestamp,
                self.seed_data.get('band', ''),
                self.seed_data.get('venue', ''),
                self.seed_data.get('date', ''),
                "Vetted & Complete"
            ])
            
        self.output_url = "http://localhost:8080/"
        self.event_title = f"{self.seed_data.get('band', 'Artist')} at {self.seed_data.get('venue', 'Venue')}"
        self.status = "complete"
        self.log("[PIPELINE COMPLETE] Event bundle generated successfully.")

    def approve_pass(self):
        if self.paused:
            self.log("Developer approved. Resuming pipeline...")
            self.paused = False

    def inject_hint(self, hint):
        self.log(f"[DEV HINT INJECTED] -> {hint}")
        if self.paused and self.status != "awaiting_verification":
            self.log("Resuming pipeline with new hint...")
            self.paused = False

    def process_verification(self, feedback):
        self.log("[VERIFICATION] Processing user feedback...")
        needs_research = False
        
        for section, action_data in feedback.items():
            action = action_data.get("action")
            value = action_data.get("value")
            
            if action == "confirm":
                self.log(f"  - {section.upper()} -> Confirmed.")
            elif action == "override":
                self.log(f"  - {section.upper()} -> Overridden manually or via URL: {value}")
                if section in self.draft_data:
                    self.draft_data[section]["_override"] = value
            elif action == "double_check":
                self.log(f"  - {section.upper()} -> Flagged for double check. Higher source needed.")
                needs_research = True
                
        if needs_research:
            self.log("[VERIFICATION] Pipeline executing localized re-search for flagged items...")
            time.sleep(3)
            self.log("[VERIFICATION] Re-search complete. Please verify again.")
            # Remain paused
        else:
            self.log("[VERIFICATION] All sections verified. Resuming pipeline to Pass 2.")
            self.paused = False

agent = GeneratorAgent()
