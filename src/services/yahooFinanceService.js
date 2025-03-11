const axios = require('axios');
const { USER_AGENT } = require('../utils/constants');

// Axios instance with default configuration for better performance
const yahooAxios = axios.create({
  timeout: 5000, // 5 second timeout
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json'
  }
});

/**
 * Optimized helper service to get stock data from Yahoo Finance
 */
const yahooFinanceService = {
  /**
   * Get stock data from Yahoo Finance with better error handling
   */
  async getStockData(symbol) {
    try {
      // Normalize and prepare symbol for Yahoo Finance format
      const normalizedSymbol = symbol.trim().toUpperCase();
      const yahooSymbol = normalizedSymbol.includes('.') ? normalizedSymbol : `${normalizedSymbol}.NS`;
      
      const response = await yahooAxios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`
      );
      
      // Guard clauses for more efficient error handling
      if (!response.data) return null;
      
      const result = response.data;
      if (!result.chart?.result?.[0]?.meta) return null;
      
      const data = result.chart.result[0];
      const meta = data.meta;
      
      // Check if we have valid quote data
      if (!data.indicators?.quote?.[0]) return null;
      
      const quote = data.indicators.quote[0];
      const timestamp = data.timestamp;
      
      // Get the latest price data using more reliable approach
      const latestIndex = timestamp ? timestamp.length - 1 : 0;
      
      // More efficient data extraction with better null handling
      const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
      const currentPrice = meta.regularMarketPrice || 
                          (quote.close?.[latestIndex] || 
                          quote.open?.[latestIndex] || 0);
      
      const change = previousClose ? currentPrice - previousClose : 0;
      const percentChange = previousClose && previousClose !== 0 
        ? ((currentPrice / previousClose - 1) * 100)
        : 0;
      
      return {
        symbol: normalizedSymbol,
        companyName: meta.symbol.replace('.NS', '') || normalizedSymbol,
        price: currentPrice || null,
        change: change || null,
        percentChange: percentChange || null,
        high: quote.high?.[latestIndex] || null,
        low: quote.low?.[latestIndex] || null,
        open: quote.open?.[latestIndex] || null,
        volume: quote.volume?.[latestIndex] || null,
        lastUpdated: new Date().toISOString(),
        source: 'Yahoo Finance'
      };
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error.message);
      return null;
    }
  }
};

module.exports = yahooFinanceService;
