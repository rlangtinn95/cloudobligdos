const mqtt = require('mqtt');
const fs = require('fs');
const xml2js = require('xml2js');
const cron = require('node-cron');
const Utils = require('./utils');

module.exports = (beachName, sensorActive, testDataFormats = false) => {
    // Setup dev environment if in "development"
    const env = process.env.NODE_ENV || "development";

    if(env === "development")
        require('dotenv').config();

    const client = mqtt.connect(`${process.env.MQTT_SERVER}:${process.env.MQTT_PORT}`, {
        username: process.env.MQTT_CLIENT_USERNAME,
        password: process.env.MQTT_CLIENT_PASSWORD
    });

    console.log(`${beachName} sensor started.`);

    // Packet structure
    /*
        location: {type: String, required: true},
        timestamp: {Type: Date, required: true},
        water_temperature: {Type: Number, required: true},
    */

    /////////////////////////
    // EXAMPLE SENSOR CODE //
    if(sensorActive) {
        var BrokerConnected = false;

        client.on('connect', () => {
            BrokerConnected = true;
        });

        const tempBase = 14;
        var fluc = [];
        fluc["Bayside Beach"] = [0.65, 0.6, 0.55, 0.53, 0.52, 0.51, 0.53, 0.54, 0.55, 0.56, 0.56, 0.58, 0.6, 0.62, 0.66, 0.72, 0.78, 0.85, 0.92, 1, 0.93, 0.8, 0.75, 0.7]; // Bayside Beach
        fluc["Paradise Bay"] = [0.63, 0.62, 0.56, 0.53, 0.56, 0.57, 0.59, 0.63, 0.65, 0.68, 0.7, 0.73, 0.76, 0.78, 0.8, 0.84, 0.86, 0.89, 0.97, 1.1, 0.96, 0.84, 0.79, 0.7]; // Paradise Bay
        fluc["Sandy Shores"] = [0.63, 0.62, 0.56, 0.53, 0.56, 0.57, 0.59, 0.63, 0.65, 0.68, 0.7, 0.73, 0.76, 0.78, 0.8, 0.84, 0.87, 0.9, 0.93, 0.97, 0.96, 0.89, 0.79, 0.7]; // Sandy Shores
        fluc["Glass Beach"] = [0.73, 0.67, 0.64, 0.6, 0.58, 0.58, 0.58, 0.6, 0.63, 0.66, 0.7, 0.73, 0.76, 0.8, 0.85, 0.9, 0.94, 1, 1.1, 1.13, 1.1, 1, 0.94, 0.8]; // Glass Beach

        cron.schedule("0 * * * *", () => {
            if(BrokerConnected) {
                // IoT sensor data
                //const wt = TemperatureSensor.Celsius;
                const DateNow = new Date();

                const selectedFluc = fluc[beachName];
                const wt = (tempBase * selectedFluc[DateNow.getHours()]+Utils.randomDecimals(-0.5, 0.5, 2)).toFixed(2);

                client.publish('water_quality', JSON.stringify({
                    location: beachName,
                    timestamp: DateNow,
                    water_temperature: wt
                }));
            }
        });
    }
    /////////////////////////
    /////////////////////////

    

    /////////////////////////
    //  DATA FORMAT TESTS  //
    if(testDataFormats) {
        const CBORTestTopic = 'data_format_test_cbor';
        const XMLTestTopic = 'data_format_test_xml';
        const EXITestTopic = 'data_format_test_exi';
        const JSONTestTopic = 'data_format_test_json';

        var CBORSendTime, CBORReceiveTime;
        var XMLSendTime, XMLReceiveTime;
        var EXISendTime, EXIReceiveTime;
        var JSONSendTime, JSONReceiveTime;

        client.on('message', async (topic, payload) => {

            var res = JSON.parse(payload);

            if(topic === CBORTestTopic+"_response") {
                client.unsubscribe(CBORTestTopic+"_response");
                CBORReceiveTime = Date.now();
                const time = res?.error ? "FAIL".padStart(6) : `${(CBORReceiveTime - CBORSendTime).toString().padStart(4)}ms`;
                console.log(`${"CBOR-to-jObj:".padStart(13)} ${time} | Data-size: ${Utils.roundDecimals(res.dataSize/1024, 2)}KB`);
            } else if(topic === XMLTestTopic+"_response") {
                client.unsubscribe(XMLTestTopic+"_response");
                XMLReceiveTime = Date.now();
                const time = res?.error ? "FAIL".padStart(6) : `${(XMLReceiveTime - XMLSendTime).toString().padStart(4)}ms`;
                console.log(`${"XML-to-jObj:".padStart(13)} ${time} | Data-size: ${Utils.roundDecimals(res.dataSize/1024, 2)}KB`);
            } else if(topic === EXITestTopic+"_response") {
                client.unsubscribe(EXITestTopic+"_response");
                EXIReceiveTime = Date.now();
                const time = res?.error ? "FAIL".padStart(6) : `${(EXIReceiveTime - EXISendTime).toString().padStart(4)}ms`;
                console.log(`${"EXI-to-jObj:".padStart(13)} ${time} | Data-size: ${Utils.roundDecimals(res.dataSize/1024, 2)}KB`);
            } else if(topic === JSONTestTopic+"_response") {
                client.unsubscribe(JSONTestTopic+"_response");
                JSONReceiveTime = Date.now();
                const time = res?.error ? "FAIL".padStart(6) : `${(JSONReceiveTime - JSONSendTime).toString().padStart(4)}ms`;
                console.log(`${"JSON-to-jObj:".padStart(13)} ${time} | Data-size: ${Utils.roundDecimals(res.dataSize/1024, 2)}KB`);
            }
        });


        {
            // SenML benchmarking (Each step is delayed to prevent MQTT from filling buffer before sending result)
            
            // CBOR - 0 sec delay
            setTimeout(() => {
                CBORSendTime = Date.now();
                const data = fs.readFileSync('./data/water_qualities.cbor');
                
                client.subscribe(CBORTestTopic+"_response");
                client.publish(CBORTestTopic, data);
            }, 0);

            // XML - 1 sec delay
            setTimeout(() => {
                XMLSendTime = Date.now();
                const data = fs.readFileSync('./data/water_qualities.xml');
                
                client.subscribe(XMLTestTopic+"_response");
                client.publish(XMLTestTopic, data);
            }, 1000);

            // EXI - 2 sec delay
            setTimeout(async () => {
                EXISendTime = Date.now();
                const data = fs.readFileSync('./data/water_qualities.xml.exi');
                
                client.subscribe(EXITestTopic+"_response");
                client.publish(EXITestTopic, data);
            }, 2000);

            // JSON - 3 sec delay
            setTimeout(() => {
                JSONSendTime = Date.now();
                const data = fs.readFileSync('./data/water_qualities.json');
                
                client.subscribe(JSONTestTopic+"_response");
                client.publish(JSONTestTopic, data);
            }, 3000);
        }
    }
    /////////////////////////
    /////////////////////////
}