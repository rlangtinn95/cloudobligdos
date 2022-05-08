const water_quality_model       = require('../db/models/water_quality');
const { roundDecimals }         = require('../utils');

const { query }                 = require('express-validator');
const express                   = require('express')
const router                    = express.Router()

const validator                 = require('../middleware/validator');

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

router.get("/API/v1/water_quality", query('hours').toInt(), query('hours').isInt({gt: 0}), validator.ValidationHandler, async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_list = await getWaterQualityReadings(queryHours);
        res.status(200).send({data: wq_list});
    } catch(error) {
        res.status(500).send({error: error});
    }
});

router.get("/API/v1/water_quality/average", query('hours').toInt(), query('hours').isInt({gt: 0}), validator.ValidationHandler, async (req, res) => {
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

router.get("/API/v1/water_quality/min", query('hours').toInt(), query('hours').isInt({gt: 0}), validator.ValidationHandler, async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_reading = await getWaterQualityReadings(queryHours, {water_temperature: 1}, 1);
        const min = wq_reading[0].water_temperature;

        res.status(200).send({data: min});
    } catch(error) {
        res.status(500).send({error: error});
    }
});

router.get("/API/v1/water_quality/max", query('hours').toInt(), query('hours').isInt({gt: 0}), validator.ValidationHandler, async (req, res) => {
    try {
        const queryHours = req.query?.hours || 24;
        const wq_reading = await getWaterQualityReadings(queryHours, {water_temperature: -1}, 1);
        const max = wq_reading[0].water_temperature;

        res.status(200).send({data: max});
    } catch(error) {
        res.status(500).send({error: error});
    }
});


module.exports = router;