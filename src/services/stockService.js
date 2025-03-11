const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const { CACHE_TTL, USER_AGENT } = require('../utils/constants');
const yahooFinanceService = require('./yahooFinanceService');

// Advanced caching with different TTLs for different data types
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_TTL * 0.2, // Check for expired keys at 20% of TTL
  useClones: false // Don't clone data for better performance
});

// Maintain a request queue to prevent duplicate concurrent requests
const pendingRequests = new Map();

const stockService = {
  /**
   * Get stock data by symbol using efficient request management
   */
  async getStockBySymbol(symbol) {
    // Normalize the symbol to prevent case-sensitive cache misses
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `stock_${normalizedSymbol}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Check if there's already a pending request for this symbol
    if (pendingRequests.has(normalizedSymbol)) {
      // Return the existing promise instead of making a new request
      return pendingRequests.get(normalizedSymbol);
    }
    
    // Create a new promise for this request
    const requestPromise = this._fetchStockData(normalizedSymbol, cacheKey);
    
    // Add to pending requests
    pendingRequests.set(normalizedSymbol, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from pending requests once completed
      pendingRequests.delete(normalizedSymbol);
    }
  },
  
  /**
   * Private method to fetch stock data from various sources
   */
  async _fetchStockData(symbol, cacheKey) {
    try {
      // Try Yahoo Finance first (most reliable)
      const yahooData = await yahooFinanceService.getStockData(symbol);
      if (yahooData && yahooData.price) {
        // Cache valid Yahoo Finance data
        cache.set(cacheKey, yahooData);
        return yahooData;
      }
      
      // If Yahoo fails, try MoneyControl with improved scraping
      console.log(`Yahoo data unavailable for ${symbol}, trying MoneyControl...`);
      
      // Improved URL construction for MoneyControl with error handling
      const stockData = await this._getMoneyControlData(symbol);
      
      // Only cache if we got valid data
      if (stockData && stockData.price) {
        // Use shorter cache TTL for fallback data sources
        cache.set(cacheKey, stockData, CACHE_TTL / 2);
      }
      
      return stockData;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error.message);
      
      // Return a structured error response
      return {
        symbol,
        companyName: symbol,
        price: null,
        change: null,
        percentChange: null,
        lastUpdated: new Date().toISOString(),
        error: "Could not retrieve stock data from available sources"
      };
    }
  },
  
  /**
   * Optimized method to get data from MoneyControl
   */
  async _getMoneyControlData(symbol) {
    try {
      // Try to get the exact MoneyControl URL by searching first
      const searchUrl = `https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?q=${encodeURIComponent(symbol)}&type=1`;
      const searchResponse = await axios.get(searchUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 5000 // Add timeout to prevent hanging requests
      });
      
      let mcUrl = '';
      
      try {
        const searchData = JSON.parse(searchResponse.data.trim());
        if (searchData && searchData.length > 0) {
          mcUrl = searchData[0].link_src;
        }
      } catch (e) {
        console.error('Error parsing MoneyControl search result:', e.message);
      }
      
      if (!mcUrl) {
        mcUrl = `https://www.moneycontrol.com/india/stockpricequote/${symbol}`;
      }
      
      // Get the stock page with the found URL
      const response = await axios.get(mcUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 5000
      });
      
      const $ = cheerio.load(response.data);
      
      // More robust selector strategy with multiple fallbacks
      const companyName = $('.comp_title h1').text().trim() || 
                         $('.company_name').text().trim() ||
                         symbol;
      
      // Use a chain of selectors for price with fallbacks
      const priceSelectors = [
        '.inprice1 span:first-child',
        '.inprice1',
        '#nsecp',
        '.pcstkspr span:first-child'
      ];
      
      let price = null;
      for (const selector of priceSelectors) {
        const priceText = $(selector).text().trim();
        if (priceText) {
          price = priceText.replace(/,/g, '');
          break;
        }
      }
      
      // Similar approach for change and percent change
      let change = null;
      const changeSelectors = ['.nsechange', '#nsechange', '.pricupdn .grn span:first-child', '.pricupdn .rd span:first-child'];
      for (const selector of changeSelectors) {
        const changeText = $(selector).text().trim();
        if (changeText) {
          change = changeText.replace(/[+,]/g, '');
          break;
        }
      }
      
      let percentChange = null;
      const percentChangeSelectors = ['.nsepp', '#nsepchange', '.pricupdn .grn span:nth-child(2)', '.pricupdn .rd span:nth-child(2)'];
      for (const selector of percentChangeSelectors) {
        const percentText = $(selector).text().trim();
        if (percentText) {
          percentChange = percentText.replace(/[()%]/g, '');
          break;
        }
      }
      
      return {
        symbol,
        companyName: companyName || symbol,
        price: parseFloat(price) || null,
        change: parseFloat(change) || null,
        percentChange: parseFloat(percentChange) || null,
        lastUpdated: new Date().toISOString(),
        source: 'MoneyControl'
      };
    } catch (error) {
      console.error(`MoneyControl fetch error for ${symbol}:`, error.message);
      return {
        symbol,
        companyName: symbol,
        price: null,
        change: null,
        percentChange: null,
        lastUpdated: new Date().toISOString(),
        source: 'MoneyControl',
        error: error.message
      };
    }
  },

  /**
   * Get data for multiple stocks with optimized concurrency
   */
  async getMultipleStocks(symbols) {
    // Limit concurrency to avoid overwhelming servers
    const MAX_CONCURRENT = 5;
    const results = [];
    
    // Process symbols in batches to control concurrency
    for (let i = 0; i < symbols.length; i += MAX_CONCURRENT) {
      const batch = symbols.slice(i, i + MAX_CONCURRENT);
      const batchPromises = batch.map(symbol => this.getStockBySymbol(symbol));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            symbol: batch[index],
            error: 'Failed to fetch data',
            status: 'ERROR',
            lastUpdated: new Date().toISOString()
          });
        }
      });
    }
    
    return results;
  },

  /**
   * Get major market indices with improved error handling
   */
  async getMarketIndices() {
    const cacheKey = 'market_indices';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Try to get indices from Yahoo Finance first (more reliable)
      const indices = await this._getYahooFinanceIndices();
      
      if (indices && indices.length > 0) {
        cache.set(cacheKey, indices);
        return indices;
      }
      
      // Fallback to MoneyControl
      return await this._getMoneyControlIndices();
    } catch (error) {
      console.error('Error fetching market indices:', error.message);
      throw new Error('Failed to get market indices');
    }
  },
  
  /**
   * Get market indices from Yahoo Finance
   */
  async _getYahooFinanceIndices() {
    try {
      // List of major Indian indices on Yahoo Finance
      const indexSymbols = [
        '^NSEI',  // Nifty 50
        '^BSESN', // Sensex
        '^NSMIDCP', // Nifty Midcap
        '^CNXBANK', // Bank Nifty
        '^CNXIT'  // Nifty IT
      ];
      
      const promises = indexSymbols.map(async symbol => {
        try {
          const response = await axios.get(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`,
            {
              headers: {
                'User-Agent': USER_AGENT
              },
              timeout: 5000
            }
          );
          
          if (!response.data?.chart?.result?.[0]?.meta) {
            return null;
          }
          
          const data = response.data.chart.result[0];
          const meta = data.meta;
          
          return {
            name: meta.shortName || symbol,
            value: meta.regularMarketPrice || null,
            change: meta.regularMarketPrice - meta.previousClose || null,
            percentChange: ((meta.regularMarketPrice / meta.previousClose - 1) * 100) || null,
            lastUpdated: new Date().toISOString(),
            source: 'Yahoo Finance'
          };
        } catch (e) {
          console.error(`Error fetching index ${symbol}:`, e.message);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      return results.filter(item => item !== null);
    } catch (error) {
      console.error('Error in getIndicesFromYahoo:', error.message);
      return [];
    }
  },
  
  /**
   * Get market indices from MoneyControl
   */
  async _getMoneyControlIndices() {
    try {
      const response = await axios.get('https://www.moneycontrol.com/markets/indian-indices/', {
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 5000
      });
      
      const $ = cheerio.load(response.data);
      const indices = [];
      
      // Updated selectors for MoneyControl indices
      $('#indicesTable tr, .tbldata tr').each((i, row) => {
        if (i === 0) return; // Skip header row
        
        const columns = $(row).find('td');
        if (columns.length >= 3) {
          const name = $(columns[0]).text().trim();
          const value = $(columns[1]).text().trim().replace(/,/g, '');
          const change = $(columns[2]).text().trim().replace(/,/g, '');
          
          indices.push({
            name,
            value: parseFloat(value) || null,
            change: parseFloat(change) || null,
            lastUpdated: new Date().toISOString(),
            source: 'MoneyControl'
          });
        }
      });
      
      // Store in cache
      if (indices.length > 0) {
        cache.set('market_indices', indices, CACHE_TTL);
      }
      
      return indices;
    } catch (error) {
      console.error('Error fetching MoneyControl indices:', error.message);
      return [];
    }
  }
};

module.exports = stockService;