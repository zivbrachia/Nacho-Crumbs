'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var firebase = require('firebase-admin');
//var serviceAccount = "./serviceAccountKey.json"     // firebase credentials
var apiai = require('apiai');
var webRequest = require('request');
require('./config.js');

/*
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: process.env.DB_URL
});
*/
// setup firebase reference
//var ref = firebase.database().ref();
//var messagesRef = ref.child('Messages');

//messagesRef.push({
//    "a":"a"
//});
/*
ref.child('users').on('child_added', function(snap) {
    console.log(JSON.stringify(snap.val()) + "\n\n");
});
*/
var app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get('/', function(req, res, next){
    res.send('hello');
    next();
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
bot.dialog('/', function (session, args) {
    session.sendTyping();
    //session.send("hi this is a test");
    /*
    webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
            var refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('user_profile').update(JSON.parse(body));
            session.send("Hello " + JSON.parse(body).first_name);
        }
    });
    */
    //var refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('address').update(session.message.address);
    //var reזUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('session').update(JSON.parse(session));
    //var refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('session').update(session);
    //session.send("Hello " + firstname);
    //session.message.address.channelId == 'facebook';
    //session.message.user.name;
    //session.message.type == 'message';
    console.log(session.message.text);
    
    var textRequest = app.textRequest(session.message.text, {
        sessionId: session.message.address.user.id
    });

    textRequest.on('response', function(response) {
        console.log(JSON.stringify(response));
        var messages = [];
        var len = response.result.fulfillment.messages.length;
        for (var i=0; i<(len); i++) {
            var message = response.result.fulfillment.messages[i];
            console.log(message.type);
            switch(message.type) {
                case 0: // Text response
                    var msg = new builder.Message(session).text(message.speech);
                    messages.push(msg);
                    break;
                case 1: // Image
                    break;
                case 2: // Quick replies
                    var facebookObj = {};
                    //facebookObj.text = message.title;
                    facebookObj.quick_replies = [];
                    var len = message.replies.length;
                    for(var i=0; i<len; i++) {
                        var quick_reply = {};
                        quick_reply.content_type = "text";
                        quick_reply.title = message.replies[i];
                        quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
                        facebookObj.quick_replies.push(quick_reply);
                    } 
                    var msg = new builder.Message(session).sourceEvent({
                        "facebook": {
                            "text": message.title,
                            "quick_replies": facebookObj.quick_replies
                        }
                    });
                    messages.push(msg);
                    
                    break;
                case 3: // Card
                    break;
                case 4: // Custom Payload
                    var msg = new builder.Message(session).sourceEvent(message.payload);
                    messages.push(msg);
                    break;
            }
        }
        var len = messages.length;
        for (var i=0; i<(len); i++) {
            var message = messages[i];
            session.send(message);
        }
    });

    textRequest.on('error', function(error) {
        console.log(JSON.stringify(error));
    });

    textRequest.end();
});
/*
ref.child('users').child('facebook').child('1386701014687144').child('address').on("value", function(snapshot) {
    var address = snapshot.val();
    ////////////////////////////////////////////////////
    var event = {
        name : 'INVOKE_EVENT',
        data: {
            name: 'neta',
            address: address
        }
    }
    var options = {
        sessionId: address.user.id
    };
    var eventRequest = app.eventRequest(event, options);

    eventRequest.on('response', function(response) {
        console.log(JSON.stringify(response));
        var address = response.result.parameters.address;
        var messages = [];
        var len = response.result.fulfillment.messages.length;
        for (var i=0; i<(len); i++) {
            var message = response.result.fulfillment.messages[i];
            console.log(message.type);
            switch(message.type) {
                case 0: // Text response
                    var msg = new builder.Message().address(address).text(message.speech);
                    messages.push(msg);
                    break;
                case 1: // Image
                    break;
                case 2: // Quick replies
                    var facebookObj = {};
                    //facebookObj.text = message.title;
                    facebookObj.quick_replies = [];
                    var len = message.replies.length;
                    for(var i=0; i<len; i++) {
                        var quick_reply = {};
                        quick_reply.content_type = "text";
                        quick_reply.title = message.replies[i];
                        quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
                        facebookObj.quick_replies.push(quick_reply);
                    }
                    var msg = new builder.Message().address(address).sourceEvent({
                        "facebook": {
                            "text": message.title,
                            "quick_replies": facebookObj.quick_replies
                        }
                    }); 
                    messages.push(msg);
                    break;
                case 3: // Card
                    break;
                case 4: // Custom Payload
                    var msg = new builder.Message().address(address).sourceEvent(message.payload);
                    messages.push(msg);
                    break;
            }
            bot.send(messages);
        }
    });

    eventRequest.on('error', function(error) {
        console.log(error);
    });

    eventRequest.end();
    ////////////////////////////////////////////////////
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});
*/