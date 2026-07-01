import time
import threading

class GeneratorAgent:
    def __init__(self):
        self.status = "idle"
        self.logs = []
        self.current_pass = 0
        self.seed_data = {}
        self.paused = False
        self._thread = None

    def log(self, msg):
        print(msg)
        self.logs.append(msg)

    def start_generation(self, seed_data):
        self.seed_data = seed_data
        self.status = "running"
        self.logs = []
        self.current_pass = 1
        self.paused = False
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
        self._wait_if_paused()

        self.log("[PASS 1.5] Complete. Waiting for developer review before Pass 2.")
        self.paused = True
        self._wait_if_paused()

        # PASS 2: NORMALIZE
        self.current_pass = 2
        self.log("[PASS 2] Normalizing data and assigning canonical IDs...")
        time.sleep(2)
        self._wait_if_paused()
        self.log("[PASS 2] Linking Artist, Venue, and Event objects...")
        time.sleep(2)
        self.log("[PASS 2] Writing JSON bundles to fill-data/ and bundles/ directories...")
        time.sleep(2)
        
        self.status = "complete"
        self.log("[PIPELINE COMPLETE] Event bundle generated successfully.")

    def approve_pass(self):
        if self.paused:
            self.log("Developer approved. Resuming pipeline...")
            self.paused = False

    def inject_hint(self, hint):
        self.log(f"[DEV HINT INJECTED] -> {hint}")
        if self.paused:
            self.log("Resuming pipeline with new hint...")
            self.paused = False

agent = GeneratorAgent()
