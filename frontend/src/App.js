import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  const fetchStockData = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/stock/${symbol}`);
      setStockData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch stock data');
      setStockData(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Indian Stock API</h1>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter stock symbol (e.g., RELIANCE)"
        />
        <button onClick={fetchStockData}>Get Stock Data</button>
        {error && <p className="error">{error}</p>}
        {stockData && (
          <div className="stock-data">
            <h2>{stockData?.companyName} ({stockData?.symbol})</h2>
            <p>Price: {stockData?.price}</p>
            <p>Change: {stockData?.change}</p>
            <p>Percent Change: {stockData?.percentChange}%</p>
            <p>Last Updated: {new Date(stockData?.lastUpdated).toLocaleString()}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
