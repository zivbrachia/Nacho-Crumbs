'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var EventEmitter = require('events').EventEmitter;
var apiai = require('apiai');
var webRequest = require('request');
require('./config.js');
var firebase = require('firebase-admin');
var db_credential = require('./serviceAccountKey.js');

firebase.initializeApp({
    credential: firebase.credential.cert(db_credential.serviceAccount),
    databaseURL: process.env.DB_URL
});

// setup firebase reference
var ref = firebase.database().ref();

var app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get('/', function(req, res, next) {
    res.send('hello');
    next();
});

server.get('/start/facebook/:eventName', function(req, res, next) {
    console.error("test console error");
    res.send('question has send');
    next();
    readAddresses(req);
});

function readAddresses(req) {
    ref.child('users').child('facebook').child('1386701014687144').child('address').once("value", function(snapshot) {
        let address = snapshot.val();
        if (address===null) return;
        ////////////////////////////////////////////////////
        var eventName = req.params.eventName;//"QUESTION_2";
        dbEventEmitter.emit('eventRequest', eventName, address);
        ////////////////////////////////////////////////////
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
    });
}
  
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
var intents = new builder.IntentDialog();

intents.onDefault(function (session) {
    console.log('typing...');
    session.sendTyping();
    //var refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('address').update(session.message.address);
    var textRequest = app.textRequest(session.message.text, {
        sessionId: session.message.address.user.id
    });
    textRequest.on('response', function(response) {
        apiaiEventEmitter.emit('apiai_response', session, response, "textRequest");
    });
    textRequest.on('error', function(error) {
        console.log("error: " + JSON.stringify(error));
    });
    textRequest.end();
    /*
    webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
            var refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('user_profile').update(JSON.parse(body));
            session.send("Hello " + JSON.parse(body).first_name);
        }
    });
    */
});

intents.matches(/^hello/i, function (session){
     console.log('hello');
     console.log(session.userData.ziv);
     session.send("Hi there!");
});
bot.dialog('/', intents);
//////////////////////////////////////////////////////////////////////////////////////////////////////
const apiaiEventEmitter = new EventEmitter();
const dbEventEmitter = new EventEmitter();

/////////////////////////////////////////////////////////////////////////
dbEventEmitter.on('eventRequest', function (eventName, address) {
    setTimeout(function () {
        let event = {
            name : eventName,
            data: {
                address: address
            }
        };

    let options = {
        sessionId: address.user.id
    };
    
    let eventRequest = app.eventRequest(event, options);

    eventRequest.on('response', function(response) {
        let address = response.result.parameters.address;
        apiaiEventEmitter.emit('apiai_response', address, response, "eventRequest");
    });

    eventRequest.on('error', function(error) {
        console.log('error: ' + error);
    });
    
    eventRequest.end();
    }, process.env.TIMEOUT_QUESTION_MS, eventName, address);
    /*
    bot.isInConversation(address, function (err, lastAccess) {
        console.log('lastAccess: ' + lastAccess);
    });
    */
});

apiaiEventEmitter.on('apiai_response', function (connObj, response, source) {
        let address = connObj;
        if (connObj.constructor.name=='Session') {
            address = connObj.message.address;
            console.log("userData: " + connObj.userData.intent.event || "nothing");
        }
        var messages = [];
        console.log("action: " + response.result.action);
        var len = response.result.fulfillment.messages.length;
        for (var i=0; i<(len); i++) {
            var message = response.result.fulfillment.messages[i];
            console.log("message type: " + message.type + " " + source);
            switch(message.type) {
                case 0: // Text response
                    var msg = new builder.Message().address(address).text((response.result.action=="input.question")? ("שאלה:" + " " + message.speech):(message.speech));
                    messages.push(msg);
                    break;
                case 1: // Card
                    /*
                    var msg = new builder.Message(session).address(session.address).attachments([new builder.HeroCard(session).title("פיסת מידע").subtitle("פיסת מידע").text("זאת פיסת מידע בנושא השאלה שמכווינה לתשובה")
                    .images([builder.CardImage.create(session, 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR0vB7eKzjzcDXW8Z-BaE5YoNnG3kgQ0S2lEg14-_3fWu88GkwIyQ')
                    ]).buttons([
                        builder.CardAction.dialogAction(session, "info", "showInfo", "המשך לפיסת מידע"),
                        builder.CardAction.dialogAction(session, "info", "repeatQuestion", "חזור על השאלה"),
                        builder.CardAction.dialogAction(session, "info", "goToNextQuestion", "המשך לשאלה הבאה")
                    ])
                    ]);
                    messages.push(msg);
                    */
                    break;
                case 2: // Quick replies
                    var facebookObj = {};
                    facebookObj.facebook = {};
                    facebookObj.facebook['text'] = (response.result.action=="input.question")? ("שאלה:" + " " + message.title):(message.title);
                    facebookObj.facebook.quick_replies = [];
                    var len = message.replies.length;
                    for(var i=0; i<len; i++) {
                        var quick_reply = {};
                        quick_reply.content_type = "text";
                        quick_reply.title = message.replies[i];
                        quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
                        facebookObj.facebook.quick_replies.push(quick_reply);
                    } 
                    
                    var msg = new builder.Message().address(address).sourceEvent(facebookObj
                        //{
                        //"facebook": {
                        //    "text": message.title,//+ (response.result.action=="input.question")?"שאלה: ":"",
                        //    "quick_replies": facebookObj.quick_replies
                        //}
                    //}
                    );
                    messages.push(msg);
                    
                    break;
                case 3: // Card
                    var msg = new builder.Message().address(address)
                        .attachments([{
                            contentType: "image/jpeg",
                            contentUrl: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR0vB7eKzjzcDXW8Z-BaE5YoNnG3kgQ0S2lEg14-_3fWu88GkwIyQ'
                    }]);
                    messages.push(msg);
                    break;
                case 4: // Custom Payload
                    var msg = new builder.Message().address(address).sourceEvent(message.payload);
                    messages.push(msg);
                    break;
            }
        }
        //
        sendMessages(response, connObj, messages);
        inputMetaQuestion(response, connObj);
        sendNextQuestion(response, address);
        
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
function sendMessages(response, session, messages) {
    var len = messages.length;
    for (let i=0; i<(len); i++) {
        let message = messages[i];
        if (session.constructor.name=='Session') {
            sendMessageBySession(message, response, session);        
        } else {
            sendMessageProactive(message, response);
        }
    }
}

function sendMessageProactive(message, response) {
    updateUserDataByMessage(message, response);
    //
    bot.send(message);
    //
    writeCurrentIntent(message, message.userData.intent);
    //let refUser = ref.child('users').child(message.address.channelId).child(message.address.user.id).child('userData').child('intent').update(message.userData.intent);
}

function updateUserDataByMessage(message, response) {
    message.userData = {};
    message.userData.intent = {};
    //
    message.userData.intent.action = response.result.action;
    message.userData.intent.id = response.result.metadata.intentId;
    message.userData.intent.name = response.result.metadata.intentName;
    message.userData.intent.event = response.result.resolvedQuery;
}

function sendMessageBySession(message, response, session) {
    updateUserData(response, session);
    //
    session.send(message);
    //
    writeCurrentIntent(message, session.userData.intent);
}

function updateUserData(response, session) {
    session.userData.intent.action = response.result.action;
    session.userData.intent.id = response.result.metadata.intentId;
    session.userData.intent.name = response.result.metadata.intentName;
    //
    if (response.result.action=='input.question') {
        session.userData.intent.event = response.result.resolvedQuery;
    }
}

function writeCurrentIntent(message, intent) {
    let refUser = ref.child('users').child(message.data.address.channelId).child(message.data.address.user.id).child('userData').child('intent').update(intent);
}

function sendNextQuestion(response, address) {
    let nextQuestion = ['input.right', 'input.wrong', 'input.skip'];
    if (nextQuestion.indexOf(response.result.action)>=0) {
        dbEventEmitter.emit('eventRequest', 'QUESTION_2', address);
    }
}

function inputMetaQuestion(response, session) {
    if (response.result.action=='input.metaQuestion') {
        if (!session.userData.intent.event) {
            readCurrentIntent(session);
        } else {
            //dbEventEmitter.emit('eventRequest', session.userData.intent.event, address);
            eventRequestEmit(session);
        }
    }
}

function eventRequestEmit(session) {
    dbEventEmitter.emit('eventRequest', session.userData.intent.event, session.message.address);
}

function readCurrentIntent(session) {
    ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('intent').once("value", function(snapshot) {
        let intent = snapshot.val();
        if (intent===null) return;
        ////////////////////////////////////////////////////
        var eventName = intent.event;
        session.userData.intent.event = eventName;
        //dbEventEmitter.emit('eventRequest', connObj.userData.intent.event, address);
        eventRequestEmit(session);
        ////////////////////////////////////////////////////
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}