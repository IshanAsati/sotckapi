const server = require('./api/server');
const { PORT } = require('./utils/constants');

server.listen(PORT, () => {
  console.log(`Indian Stock API running on port ${PORT}`);
  console.log(`Try it out: http://localhost:${PORT}/api/status`);
  console.log(`Get a stock: http://localhost:${PORT}/api/stock/RELIANCE`);
});
