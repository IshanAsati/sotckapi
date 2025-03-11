module.exports = {
  PORT: process.env.PORT || 3000,
  CACHE_TTL: 300, // Cache time-to-live in seconds (5 minutes)
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  // Add a fallback data API key (for a free tier service if needed)
  ALTERNATIVE_API_KEY: process.env.ALTERNATIVE_API_KEY || ''
};
