const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const water_quality_schema = new Schema({
    beach_name: {type: String, required: true},
    measurement_timestamp: {type: Date, required: true},
    water_temperature: {type: Schema.Types.Decimal128, required: true},
    turbidity: {type: Schema.Types.Decimal128, required: true},
    transducer_depth: {type: Schema.Types.Decimal128, required: true},
    wave_height: {type: Schema.Types.Decimal128, required: true},
    wave_period: {type: Number, required: true},
    battery_life: {type: Schema.Types.Decimal128, required: true},
    measurement_timestamp_label: {type: Date, required: true},
    measurement_id: {type: String, required: true}
});

module.exports = mongoose.model('water_quality', water_quality_schema);