const axios = require('axios');
const { PORT } = require('../src/utils/constants');

const BASE_URL = `http://localhost:${PORT}/api`;

/**
 * Simple utility to test if the API is working
 */
async function checkAPI() {
  console.log('🔍 Testing Indian Stock API...');
  
  try {
    // Test 1: Check API status
    console.log('\n📝 Test 1: Checking API status...');
    const statusResponse = await axios.get(`${BASE_URL}/status`);
    console.log('✅ API Status:', statusResponse.data.status);
    console.log('⏰ Timestamp:', statusResponse.data.timestamp);
    
    // Test 2: Get single stock data
    console.log('\n📝 Test 2: Fetching data for RELIANCE...');
    const stockResponse = await axios.get(`${BASE_URL}/stock/RELIANCE`);
    console.log('✅ Got data for:', stockResponse.data.symbol);
    console.log('💰 Price:', stockResponse.data.price);
    
    // Test 3: Get multiple stocks
    console.log('\n📝 Test 3: Fetching data for multiple stocks...');
    const multipleStocksResponse = await axios.get(`${BASE_URL}/stocks?symbols=TCS,INFY,HDFCBANK`);
    console.log(`✅ Got data for ${multipleStocksResponse.data.length} stocks`);
    multipleStocksResponse.data.forEach(stock => {
      console.log(`- ${stock.symbol}: ${stock.price || 'N/A'}`);
    });
    
    // Test 4: Get market indices
    console.log('\n📝 Test 4: Fetching market indices...');
    const indicesResponse = await axios.get(`${BASE_URL}/indices`);
    console.log(`✅ Got data for ${indicesResponse.data.length} indices`);
    indicesResponse.data.slice(0, 3).forEach(index => {
      console.log(`- ${index.name}: ${index.value || 'N/A'}`);
    });
    
    console.log('\n🎉 All tests passed! API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    console.log('\nMake sure the API server is running with: npm start');
    process.exit(1);
  }
}

checkAPI();
