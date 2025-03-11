const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const { CACHE_TTL, USER_AGENT } = require('../utils/constants');
const yahooFinanceService = require('./yahooFinanceService');

// Cache to store data and reduce API calls
const cache = new NodeCache({ stdTTL: CACHE_TTL });

const stockService = {
  /**
   * Get stock data by symbol from NSE
   */
  async getStockBySymbol(symbol) {
    const cacheKey = `stock_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Try Yahoo Finance first (most reliable)
      const yahooData = await yahooFinanceService.getStockData(symbol);
      if (yahooData && yahooData.price) {
        cache.set(cacheKey, yahooData);
        return yahooData;
      }
      
      // If Yahoo fails, try MoneyControl with improved scraping
      console.log(`Trying MoneyControl for ${symbol}...`);
      
      // Improved URL construction for MoneyControl
      const searchUrl = `https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?q=${encodeURIComponent(symbol)}&type=1`;
      const searchResponse = await axios.get(searchUrl, {
        headers: {
          'User-Agent': USER_AGENT
        }
      });
      
      let mcUrl = '';
      
      try {
        // Parse the search response and get the first result URL
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
      
      const response = await axios.get(mcUrl, {
        headers: {
          'User-Agent': USER_AGENT
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Updated comprehensive selectors for MoneyControl
      const companyName = $('.comp_title h1').text().trim() || 
                          $('.company_name').text().trim();
      
      // Try multiple price selectors
      let price = $('.inprice1 span:first').text().trim() || 
                 $('.inprice1').text().trim() ||
                 $('#nsecp').text().trim();
      
      let change = $('.nsechange').text().trim() ||
                  $('#nsechange').text().trim();
      
      let percentChange = $('.nsepp').text().trim().replace(/[()%]/g, '') ||
                         $('#nsepchange').text().trim().replace(/[()%]/g, '');
      
      // Clean up the data
      price = price.replace(/,/g, '');
      change = change.replace(/[+,]/g, '');
      
      const stockData = {
        symbol,
        companyName: companyName || symbol,
        price: parseFloat(price) || null,
        change: parseFloat(change) || null,
        percentChange: parseFloat(percentChange) || null,
        lastUpdated: new Date().toISOString(),
        source: 'MoneyControl'
      };
      
      // Store in cache only if we got a price
      if (stockData.price) {
        cache.set(cacheKey, stockData);
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
   * Get data for multiple stocks
   */
  async getMultipleStocks(symbols) {
    const promises = symbols.map(symbol => this.getStockBySymbol(symbol));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          symbol: symbols[index],
          error: 'Failed to fetch data',
          status: 'ERROR'
        };
      }
    });
  },

  /**
   * Get major market indices
   */
  async getMarketIndices() {
    const cacheKey = 'market_indices';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await axios.get('https://www.moneycontrol.com/markets/indian-indices/');
      const $ = cheerio.load(response.data);
      
      const indices = [];
      
      // Extract index data from the page (example selectors)
      $('.tbldata tr').each((i, row) => {
        if (i === 0) return; // Skip header row
        
        const columns = $(row).find('td');
        if (columns.length >= 3) {
          const name = $(columns[0]).text().trim();
          const value = $(columns[1]).text().trim();
          const change = $(columns[2]).text().trim();
          
          indices.push({
            name,
            value: parseFloat(value.replace(/,/g, '')) || null,
            change: parseFloat(change.replace(/,/g, '')) || null,
            lastUpdated: new Date().toISOString()
          });
        }
      });
      
      // Store in cache
      cache.set(cacheKey, indices);
      
      return indices;
    } catch (error) {
      console.error('Error fetching market indices:', error.message);
      throw new Error('Failed to get market indices');
    }
  }
};

module.exports = stockService;
