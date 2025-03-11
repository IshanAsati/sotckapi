# Indian Stock API

A free API service for getting data from Indian stock markets.

## Features

- Get real-time stock prices for Indian market symbols
- Multiple data sources (Yahoo Finance, MoneyControl) for reliability
- Caching to reduce load on data sources
- Rate limiting to prevent abuse
- React-based UI for easy interaction

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React
- **Data Sources**: Yahoo Finance API, Web scraping from MoneyControl

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```
git clone <your-repo-url>
cd sotckapi
```

2. Install dependencies:
```
npm install
npm run client:install
```

3. Start the development server:
```
npm run dev:full
```

This will start both the API server on port 3000 and the React development server.

## API Endpoints

### Status Check
```
GET /api/status
```
Returns the status of the API.

### Get Stock Data
```
GET /api/stock/:symbol
```
Returns data for a specific stock (e.g., RELIANCE, TCS).

### Get Multiple Stocks
```
GET /api/stocks?symbols=TCS,INFY,HDFCBANK
```
Returns data for multiple stocks at once.

### Get Market Indices
```
GET /api/indices
```
Returns data for major market indices like Nifty, Sensex, etc.

## Example Usage

### JavaScript (fetch)
```javascript
fetch('http://localhost:3000/api/stock/RELIANCE')
  .then(response => response.json())
  .then(data => console.log(data));
```

### cURL
```bash
curl http://localhost:3000/api/stock/RELIANCE
```

## Deployment

### Heroku
This app is Heroku-ready. Just push to Heroku and it will work.
```
heroku create
git push heroku main
```

### Regular Deployment
1. Build the frontend:
```
npm run build
```

2. Set NODE_ENV to production:
```
export NODE_ENV=production
```

3. Start the server:
```
npm start
```

## Notes

- This API uses web scraping as a fallback mechanism
- Data is cached for 5 minutes to reduce load on sources
- Rate limiting is implemented to prevent abuse

## Disclaimer

This API is for educational purposes only and should not be used for actual trading decisions.

## License

MIT
