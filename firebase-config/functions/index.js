const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Ascend Amphitheater Nashville Coordinates (Known NOAA grid: OHX grid, X: 50, Y: 71)
const USER_AGENT = "(sun-map-concert-companion, contact@example.com)";
const FORECAST_URL = "https://api.weather.gov/gridpoints/OHX/50,71/forecast/hourly";

exports.getWeather = onRequest(
  {
    cors: true, // Enable CORS so app can request weather data
    maxInstances: 10,
  },
  async (req, res) => {
    try {
      logger.info("Fetching weather forecast for Nashville", { structuredData: true });

      const headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/ld+json"
      };

      const weatherResponse = await fetch(FORECAST_URL, { headers });
      if (!weatherResponse.ok) {
        throw new Error(`NOAA API returned status ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();

      // Cache-Control headers: 5 minutes CDN cache (s-maxage=300), 1 minute browser cache (max-age=60)
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      res.status(200).json({
        success: true,
        source: "NOAA",
        updatedAt: new Date().toISOString(),
        periods: weatherData.periods || weatherData.properties?.periods || []
      });
    } catch (error) {
      logger.error("Error fetching weather data", error);
      res.setHeader("Cache-Control", "public, max-age=10, s-maxage=10");
      res.status(500).json({
        success: false,
        error: "Failed to retrieve weather data from source.",
        details: error.message
      });
    }
  }
);
