const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const water_quality_schema = new Schema({
    location: {type: String, required: true},
    timestamp: {type: Date, required: true},
    water_temperature: {type: Number, required: true},
});

module.exports = mongoose.model('water_quality', water_quality_schema);