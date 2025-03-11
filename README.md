# Indian Stock API

A free API service for getting data from Indian stock markets.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the API server:
```
npm start
```

3. Test if the API works:
```
npm test
```

## Available Endpoints

- `GET /api/status` - Check if API is working
- `GET /api/stock/:symbol` - Get data for a specific stock (e.g., RELIANCE, TCS)
- `GET /api/stocks?symbols=TCS,INFY,HDFCBANK` - Get data for multiple stocks
- `GET /api/indices` - Get data for major market indices

## Example Usage

```javascript
// Using fetch to get stock data
fetch('http://localhost:3000/api/stock/RELIANCE')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Notes

- This API uses web scraping for demonstration purposes
- Data is cached for 5 minutes to reduce load on sources
- For production use, consider implementing rate limiting

## Disclaimer

This API is for educational purposes only and should not be used for actual trading decisions.
