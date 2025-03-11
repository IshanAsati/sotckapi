const axios = require('axios');
const { USER_AGENT } = require('../utils/constants');

/**
 * Helper service to get stock data from Yahoo Finance
 */
const yahooFinanceService = {
  /**
   * Get stock data from Yahoo Finance
   */
  async getStockData(symbol) {
    try {
      // Append ".NS" for NSE stocks in Yahoo Finance
      const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
      
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d`,
        {
          headers: {
            'User-Agent': USER_AGENT
          }
        }
      );
      
      if (!response.data || !response.data.chart || !response.data.chart.result || 
          !response.data.chart.result[0] || !response.data.chart.result[0].meta) {
        throw new Error('Invalid response structure from Yahoo Finance');
      }
      
      const data = response.data.chart.result[0];
      const quote = data.indicators.quote[0];
      const meta = data.meta;
      const timestamp = data.timestamp;
      
      // Get the latest price data
      const latestIndex = timestamp.length - 1;
      
      return {
        symbol: symbol,
        companyName: meta.symbol.replace('.NS', ''),
        price: meta.regularMarketPrice || null,
        change: meta.regularMarketPrice - meta.previousClose || null,
        percentChange: ((meta.regularMarketPrice / meta.previousClose - 1) * 100) || null,
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
