const express = require('express');
const stockService = require('../services/stockService');

const router = express.Router();

// API Status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    message: 'Indian Stock API is running'
  });
});

// Get stock details by symbol
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await stockService.getStockBySymbol(symbol);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message || 'Failed to fetch stock data'
    });
  }
});

// Get multiple stocks
router.get('/stocks', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please provide stock symbols as query parameter'
      });
    }
    
    const symbolList = symbols.split(',');
    const stocksData = await stockService.getMultipleStocks(symbolList);
    res.json(stocksData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message || 'Failed to fetch stocks data'
    });
  }
});

// Get market indices
router.get('/indices', async (req, res) => {
  try {
    const indices = await stockService.getMarketIndices();
    res.json(indices);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message || 'Failed to fetch market indices'
    });
  }
});

module.exports = router;
