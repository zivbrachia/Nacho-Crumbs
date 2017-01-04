'use strict';

require('./config.js');
var restify = require('restify');
var builder = require('botbuilder');
var facebook = require('./facebook');
var db = require('./database');
var apiai = require('./apiai');

db.initializeApp();

var ref = db.getRefRoot();
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', function (session) {
    session.sendTyping();
    var pageAddress = facebook.getUserProfile(session.message.address.user.id);
    console.log(pageAddress);
    session.send("Hello");
    var refUser = db.updateUserAddress(session.message.address.channelId, session.message.address.user.id, session.message.address);
    //apiai.textRequest(session.message.text, session);
    apiai.eventRequest(INVOKE_EVENT, session);
});

var options = {};
var client = apiai.getIntents(options);
client.get(options, function(err, req, res) {
        console.log('get ' + JSON.parse(res.body));
});
/*
var options = {};
var client = apiai.deleteIntentById('c1fc9649-0e49-433d-aaba-a1b2f5385cb1', options);
client.del(options, function(err, req, res) {
            console.log('delete ' + JSON.parse(res.body));
});
*/
/*
var options = {};
var client = apiai.createNewIntent(options);
var data = {
    "name": "Appliances",
    "entries": [{
        "value": "Coffee Maker",
        "synonyms": ["coffee maker", "coffee machine",  "coffee"]
    }, {
        "value": "Thermostat",
        "synonyms": ["Thermostat", "heat", "air conditioning"]
    }, {
        "value": "Lights",
        "synonyms": ["lights", "light", "lamps"]
    }, {
        "value": "Garage door",
        "synonyms": ["garage door", "garage"]
    }]
};
client.post(options, data, function(err, req, res, obj) {
    console.log(JSON.parse(res.body));
});
*/

apiai.eventRequest('INVOKE_EVENT', '112121212' /*session.id*/);

