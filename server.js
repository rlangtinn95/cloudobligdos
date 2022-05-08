const express                   = require('express');
const app                       = express();
const compression               = require('compression');
const DBI                       = require('./db/db');
const port                      = process.env.PORT || 80;
const http                      = require('http');

// Setup dev environment if in "development"
const env = process.env.NODE_ENV || "development";

if(env === "development")
    require('dotenv').config();

// Allow cross-origin
const cors = require('cors');
app.use(cors());

// Compress all packets from server
app.use(compression());

// Init connection with database interface if not already initialized
DBI.initConnection();

// Build HTTP server that Broker attaches to with websocket
const server = http.createServer(app); // Attach Express to HTTP server

// Start Broker server - MQTT
require('./broker')(server);

// Example publishers - Publishing random data through MQTT
require('./publisher')("Bayside Beach", true);
require('./publisher')("Paradise Bay", true);
require('./publisher')("Sandy Shores", true);
require('./publisher')("Glass Beach", true);

// Init endpoints for API
app.use(require('./routes/water_quality'));

// Serve static webpages using Express
app.use(express.static('public'));

// Open listening port for Express
server.listen(port, () => {
      console.log(`Webserver started on port ${port}`);
});