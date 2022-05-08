const express                   = require('express');
const bodyParser                = require('body-parser');
const app                       = express();
const compression               = require('compression');
const DBI                       = require('./db/db');
const port                      = process.env.PORT || 80;
const water_quality_model       = require('./db/models/water_quality');
const { buildSanitizeFunction } = require('express-validator');

// Build a sanitization function for req.query to clear harmful payload
const sanitizeQuery = buildSanitizeFunction(['query']);

// Setup dev environment if in "development"
const env = process.env.NODE_ENV || "development";

if(env === "development")
    require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));

// Allow cross-origin
const cors = require('cors');
const { roundDecimals } = require('./utils');
app.use(cors());

// Compress all packets from server
app.use(compression());

// Init connection with database interface if not already initialized
DBI.initConnection();

// Start Broker server - MQTT
require('./broker');

// Example publishers - Publishing random data through MQTT
require('./publisher')("Bayside Beach", true);
require('./publisher')("Paradise Bay", true);
require('./publisher')("Sandy Shores", true);
require('./publisher')("Glass Beach", true);

// Serve static webpages using Express
app.use(express.static('public'));

// Endpoint for retrieving water_quality readings
// Grab only the readings from the last 24 hours by default
const getWaterQualityReadings = async(hoursBack = 24, sort = {}, limit = null) => {
    if(!sort.timestamp)
        sort.timestamp = 1;

    const DateNow = new Date();
    const hoursInMilliseconds = 60*1000*60*hoursBack;
    const wq_list = await water_quality_model.find({
        timestamp: {
            $gte: new Date(DateNow-hoursInMilliseconds),
            $lte: DateNow // Prevent future data from being displayed
        }
    }).sort(sort).limit(limit); // Sort most recent readings first

    return wq_list;
}

app.get("/API/v1/water_quality", sanitizeQuery('hours').toInt(), async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_list = await getWaterQualityReadings(queryHours);
        res.status(200).send({data: wq_list});
    } catch(error) {
        res.status(500).send({error: error});
    }
});

app.get("/API/v1/water_quality/average", sanitizeQuery('hours').toInt(), async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_list = await getWaterQualityReadings(queryHours);

        var total = 0;
        wq_list.forEach((item) => {
            total += item.water_temperature; // Add temp to total
        });

        res.status(200).send({data: roundDecimals(total/wq_list.length, 2)});   // Divide total by list length to get average
    } catch(error) {
        res.status(500).send({error: error});
    }
});

app.get("/API/v1/water_quality/min", sanitizeQuery('hours').toInt(), async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_reading = await getWaterQualityReadings(queryHours, {water_temperature: 1}, 1);
        const min = wq_reading[0].water_temperature;

        res.status(200).send({data: min});
    } catch(error) {
        res.status(500).send({error: error});
    }
});

app.get("/API/v1/water_quality/max", sanitizeQuery('hours').toInt(), async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_reading = await getWaterQualityReadings(queryHours, {water_temperature: -1}, 1);
        const max = wq_reading[0].water_temperature;

        res.status(200).send({data: max});
    } catch(error) {
        res.status(500).send({error: error});
    }
});

// Open listening port for Express
app.listen(port, () => {
      console.log(`Webserver started on port ${port}`);
});