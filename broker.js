const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const cbor = require('cbor');
const xml2js = require('xml2js');
const port = 2021;
const DBI = require('./db/db');

// Init connection with database interface if not already initialized
DBI.initConnection();

const user_model = require('./db/models/user');
const water_quality_model = require('./db/models/water_quality');

server.listen(port, () => {
  console.log('MQTT broker is listening on port', port)
});

////////////////////////////////////////////////////////////////////////////
// All of these listeners are useless as of now, but useful for debugging //
aedes.on('client', (client) => {
    console.log(`[CONNECT] Client ${client?.id} connected`);
});

aedes.on('clientDisconnect', (client) => {
    console.log(`[DISCONNECT] Client ${client?.id} disconnected`);
});

aedes.on('subscribe', (subscriptions, client) => {
    console.log(`[SUBSCRIBE] Client ${client?.id} subscribed to topics: ${subscriptions.map(s=>s.topic).join(',')}`);
});

aedes.on('unsubscribe', (subscriptions, client) => {
    console.log(`[SUBSCRIBE] Client ${client?.id} unsubscribed from topics: ${subscriptions.map(s=>s.topic).join(',')}`);
});
////////////////////////////////////////////////////////////////////////////

aedes.on('publish', (packet, client) => {
    if(!client?.id) // Filter all system messages
        return;

    if(packet.topic === "water_quality") {
        try {
            const parsedWQ = JSON.parse(packet.payload.toString());
            const wq = new water_quality_model(parsedWQ);
            wq.save();
        } catch (error) {
            console.log(`Failed at parsing water_quality reading: ${error}`);
            return;
        }
    }
});

// Authentication
aedes.authenticate = async (client, username, password, callback) => {
    // Find user by username
    const User = await user_model.findOne({username: username});

    // Check password
    if(User && User.validatePassword(password.toString())) {
        return callback(null, true); // Authenticated
    }

    var error = new Error("Authentication failed");
    error.returnCode = 4;
    return callback(error, null);
}

// Data format tests
const CBORTestTopic = 'data_format_test_cbor';
const XMLTestTopic = 'data_format_test_xml';
const EXITestTopic = 'data_format_test_exi';
const JSONTestTopic = 'data_format_test_json';

aedes.on('publish', async (packet, client) => {
    if(packet.topic === CBORTestTopic) {
        const jObj = await cbor.decodeAll(packet.payload);
        aedes.publish({
            topic: CBORTestTopic+"_response",
            payload: `${Buffer.byteLength(packet.payload)}`
        });
    } else if(packet.topic === XMLTestTopic) {
        const jObj = await xml2js.parseStringPromise(packet.payload);
        aedes.publish({
            topic: XMLTestTopic+"_response",
            payload: `${Buffer.byteLength(packet.payload)}`
        });
    } else if(packet.topic === EXITestTopic) {
        //const jObj = await xml2js.parseStringPromise(packet.payload);
        aedes.publish({
            topic: EXITestTopic+"_response",
            payload: `${Buffer.byteLength(packet.payload)}`
        });
    } else if(packet.topic === JSONTestTopic) {
        const jObj = await JSON.parse(packet.payload);
        aedes.publish({
            topic: JSONTestTopic+"_response",
            payload: `${Buffer.byteLength(packet.payload)}`
        });
    }
});