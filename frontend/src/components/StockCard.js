import React from 'react';
import './StockCard.css';

function StockCard({ stockData }) {
  if (!stockData) return null;

  const { companyName, symbol, price, change, percentChange, high, low, lastUpdated, source, error } = stockData;
  const isPositive = change > 0;
  const changeClass = isPositive ? 'positive' : 'negative';

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h2>{companyName || symbol}</h2>
        <span className="symbol">{symbol}</span>
      </div>
      
      {price ? (
        <>
          <div className="price">₹{price.toFixed(2)}</div>
          <div className={`change ${changeClass}`}>
            {isPositive ? '+' : ''}{change?.toFixed(2)} ({isPositive ? '+' : ''}{percentChange?.toFixed(2)}%)
          </div>
          
          {high && low && (
            <div className="range">
              <span>Range: ₹{low.toFixed(2)} - ₹{high.toFixed(2)}</span>
            </div>
          )}
          
          <div className="update-time">
            <small>Last updated: {new Date(lastUpdated).toLocaleString()}</small>
            {source && <small>Source: {source}</small>}
          </div>
        </>
      ) : (
        <div className="error-message">
          {error || "Unable to fetch stock data"}
        </div>
      )}
    </div>
  );
}

export default StockCard;
