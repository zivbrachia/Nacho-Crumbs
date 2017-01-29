'use strict';

let restify = require('restify');
let builder = require('botbuilder');
let EventEmitter = require('events').EventEmitter;
let apiai = require('apiai');
let webRequest = require('request');
//require('./config.js');
let firebase = require('firebase-admin');
let db_credential = require('./serviceAccountKey.js');
let BotanalyticsMiddleware = require('botanalytics-microsoftbotframework-middleware').BotanalyticsMiddleware({
    token: process.env.BOTANALYTICS_TOKEN
});

firebase.initializeApp({
    credential: firebase.credential.cert(db_credential.serviceAccount),
    databaseURL: process.env.DB_URL
});

// setup firebase reference
let ref = firebase.database().ref();
let questions = null;
ref.child('category').child('dna').once("value", function(snapshot) {
        questions = snapshot.val()
        //dbEventEmitter.emit('eventRequest', 'QUESTION_2', address, null, userData || {});    
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
});

let app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get('/', function(req, res, next) {
    res.send('hello');
    next();
});

server.get('/build', function(req, res, next) {
    console.error("build");
    getAllIntents();
    res.send('build intent');
    next();
});

server.get('/start/:channelId/:eventName', function(req, res, next) {
    console.error("test console error");
    readAddresses(req, res, next, req.params.channelId, req.params.eventName);
});

function readAddresses(req, res, next, channelId, eventName) {
    //ref.child('users').child(channelId).child('1386701014687144').child('address').once("value", function(snapshot) {
    ref.child('users').child(channelId).once("value", function(snapshot) {
        let users = snapshot.val();
        if (users===null) return;
        ////////////////////////////////////////////////////
        Object.keys(users).forEach( function (user) {
            let address = users[user].address;
            if (address===undefined) return;
            if ((channelId==='telegram')&(user!=='154226484')) return;
            //
            let userData = users[user].userData;
            //
            dbEventEmitter.emit('eventRequest', eventName, address, null, userData);
        }, this);
        next();
        ////////////////////////////////////////////////////
        }, function (errorObject) {
            res.send('error');
            next();
            console.log("The read failed: " + errorObject.code);
    });
    /*
    ref.child('users').child('facebook').child('1386701014687144').once("value", function(snapshot) {
        let address = snapshot.val().address;
        if (address===null) return;
        //
        let userData = snapshot.val().userData;
        if (userData===null) return;
        ////////////////////////////////////////////////////
        let eventName = req.params.eventName;//"QUESTION_2";
        dbEventEmitter.emit('eventRequest', eventName, address, null, userData);
        ////////////////////////////////////////////////////
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
    });
    */
}
  
// Create chat bot
let connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//
let bot = new builder.UniversalBot(connector);
// Use the middleware
bot.use({
    receive: BotanalyticsMiddleware.receive,
    send: BotanalyticsMiddleware.send
    
});

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
let intents = new builder.IntentDialog();

intents.onDefault(function (session) {
    console.log('text: '+ session.message.text);
    console.log('typing...');
    session.sendTyping();
    //
    let textRequest = app.textRequest(session.message.text, {
        sessionId: session.message.address.user.id
    });
    textRequest.on('response', function(response) {
        apiaiEventEmitter.emit('apiai_response', session, response, session.userData || {}, "textRequest");
    });
    textRequest.on('error', function(error) {
        console.log("error: " + JSON.stringify(error));
    });
    //
    if ((session.message.address.channelId === 'facebook') & (session.userData.user_profile || 'empty'==='empty')) {
        userProfileEventEmitter.emit('facebook_user_profile', session, textRequest);
    } else {
        textRequest.end();
    }
    
    if (!session.userData.address) {
        let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('address').update(session.message.address);
        session.userData.address = true;
    }
});

intents.matches(/^reset userData/i, function (session){
     session.userData = {};
     session.send("userData has been reset");
});

intents.matches(/^show userData/i, function (session){
     session.send(JSON.stringify(session.userData));
});

intents.matches(/^hello/i, function (session){
     console.log('text: '+ session.message.text);
     console.log(session.userData.ziv);
     session.send("Hi there");
     //https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q=Neta
     webRequest('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q=Brachia', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let result = body.split('"');
            console.log('user_name_translated to: ' + result[1]);
            session.send('How do you do, ' + result[1])
            //session.userData.user_profile = user_profile;
            //let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(user_profile);
        }
    });
});

bot.dialog('/', intents);
//////////////////////////////////////////////////////////////////////////////////////////////////////
const apiaiEventEmitter = new EventEmitter();
const dbEventEmitter = new EventEmitter();
const userProfileEventEmitter = new EventEmitter();

/////////////////////////////////////////////////////////////////////////
userProfileEventEmitter.on('facebook_user_profile', function(session, request) {
    webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let user_profile = JSON.parse(body);
            console.log('user_profile: ' + user_profile);
            session.userData.user_profile = user_profile;
            //
            let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile');
            /*
            refUser.on('child_added', function (snapshot, prevChildKey) {
                if (snapshot.key==='first_name') {
                    webRequest('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q='+snapshot.val(), function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            //let user_profile = JSON.parse(body);
                            let first_name = body.split('"')[1];
                            console.log('first_name: ' + first_name);
                            session.userData.user_profile.first_name = first_name;
                            let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(
                                {first_name: session.userData.user_profile.first_name}
                            );
                        }
                    });
                }
                if (snapshot.key==='last_name') {
                    webRequest('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q='+snapshot.val(), function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            //let user_profile = JSON.parse(body);
                            let last_name = body.split('"')[1];
                            console.log('last_name: ' + last_name);
                            //session.userData.user_profile.last_name = last_name;
                            let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(
                                {last_name: last_name}
                            );
                        }
                    });
                }
            });
            */
            //let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(user_profile);
            refUser.update(user_profile);
        }
    });

    request.end();
});
//
dbEventEmitter.on('eventRequest', function (eventName, address, timeout, userData) {
    setTimeout(function () {
        let event = {
            name : eventName,
            data: {
                address: address,
                userData: userData,
                //first_name: userData.user_profile.first_name || ''
            }
        };

    let options = {
        sessionId: address.user.id
    };
    
    let eventRequest = app.eventRequest(event, options);

    eventRequest.on('response', function(response) {
        let address = response.result.parameters.address;
        let userData = response.result.parameters.userData;
        apiaiEventEmitter.emit('apiai_response', address, response, userData || {}, "eventRequest");
    });

    eventRequest.on('error', function(error) {
        console.log('error: ' + error);
    });
    
    eventRequest.end();
    }, timeout || process.env.TIMEOUT_QUESTION_MS || 3000, eventName, address);
    /*
    bot.isInConversation(address, function (err, lastAccess) {
        console.log('lastAccess: ' + lastAccess);
    });
    */
});

function chatFlow(connObj, response, userData, source) {
    let intentAction = response.result.action;
    //
    let actionsReplyByGender = ['input.right', 'input.wrong'];
    let actionsMetaQuestion = ['input.metaQuestion'];
    let actionsSendingNextQuestion = ['input.skip', 'input.next'];
    let actionsReturnQuestion = ['input.return_question'];  //, 'input.clue', 'input.hint'];
    let actionsStop = ['input.break_setting'];
    //
    let address = connObj;
    if (connObj.constructor.name=='Session') {
        address = connObj.message.address;
        /*
        if (connObj.userData || 'empty'==='empty') {
            connObj.userData = userData;
        } else if (connObj.userData.user_profile || 'empty'==='empty') {
            connObj.userData.user_profile = userData.user_profile;
        }
        if (connObj.userData.intent||'empty'!=='empty') {   // when userData.intent dont exists
            console.log("userData: " + connObj.userData.intent.event || 'empty');
        }
        */
    }
    //
    if (actionsReplyByGender.indexOf(intentAction)>=0) {
        // go to reply by gender
        // always connObj will be 'Session' object, cannot answer questions with proactive that connObj is 'Address' object
        replyByGender(intentAction, connObj.userData, address)
        // there is no reason to continue the function and send messages because there is none...
        return;
    } else if (actionsMetaQuestion.indexOf(intentAction)>=0) {
        // always connObj will be 'Session' object, cannot ask metaQuestions with proactive that connObj is 'Address' object
        inputMetaQuestion(response, connObj)
    } else if (actionsStop.indexOf(intentAction)>=0) {
        console.log('***');
    } else if (actionsReturnQuestion.indexOf(intentAction)>=0) {
        sendLastQuestion(response, connObj, userData || {});
    }
    //
    let messages = buildMessages(response, address, source);
    sendMessages(response, connObj, messages, userData || {});

    if (actionsSendingNextQuestion.indexOf(intentAction)>=0) {
        sendNextQuestion(response, address, userData || {});
    }
}

function replyByGender(intentAction, userData, address) {  // question reply (right/wrong)
    let eventName = null;
    switch(intentAction) {
        case 'input.right':
            eventName = 'RIGHT_ANSWER_REPLY_FEMALE';
            if ((userData.user_profile || 'empty'==='empty')||(userData.user_profile.gender==='male')) {
                eventName = 'RIGHT_ANSWER_REPLY_MALE';
            }
            break;
        case 'input.wrong':
            eventName = 'WRONG_ANSWER_REPLY_FEMALE';
            if ((userData.user_profile || 'empty'==='empty')||(userData.user_profile.gender==='male')) {
                eventName = 'WRONG_ANSWER_REPLY_MALE';
            }
            break;
        default:
            eventName = null;
            break;
    }
    //
    if (eventName!==null) {
        dbEventEmitter.emit('eventRequest', eventName, address, process.env.TIMEOUT_REPLY, userData || {});
    }
}

function buildMessages(response, address, source) {
    let len = response.result.fulfillment.messages.length;
    let textResponseToQuickReplies = '';
    let messages = [];
    for (let i=0; i<(len); i++) {
        let message = response.result.fulfillment.messages[i];
        let msg = {};
        console.log("message type: " + message.type + " " + source);
        switch(message.type) {
            case 0: // Text response
                if (message.speech.indexOf('[>>]') !== (-1)) {
                        textResponseToQuickReplies = message.speech.split('[>>]')[0];
                        break;
                }
                if (address.channelId==='telegram') {
                    msg = new builder.Message().address(address).sourceEvent({
                        telegram:{
                            method: 'sendMessage',
                            parameters: {
                                text: message.speech,
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    hide_keyboard: true
                                }
                            }
                        }
                    });
                    messages.push(msg);
                }
                else if (address.channelId==='facebook') {
                    let text = message.speech.replace(/\n/g, '\n\r');
                    msg = new builder.Message().address(address).text((response.result.action=="input.question")? ("שאלה:" + " " + text):(text));
                    messages.push(msg);
                }
                break;
            case 1: // Card
                /*
                let msg = new builder.Message(session).address(session.address).attachments([new builder.HeroCard(session).title("פיסת מידע").subtitle("פיסת מידע").text("זאת פיסת מידע בנושא השאלה שמכווינה לתשובה")
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
                if (address.channelId==='facebook') {
                    let facebookObj = {};
                    facebookObj.facebook = {};
                    facebookObj.facebook['text'] = (response.result.action=="input.question")? ("שאלה:" + " " + message.title):(message.title);
                    if (message.title.indexOf('[>>]') !== (-1)) {
                        facebookObj.facebook['text'] = textResponseToQuickReplies.replace(/\n/g, '\n\r');
                    }
                    facebookObj.facebook.quick_replies = [];
                    let len = message.replies.length;
                    for(let i=0; i<len; i++) {
                        let quick_reply = {};
                        quick_reply.content_type = "text";
                        quick_reply.title = message.replies[i];
                        quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
                        facebookObj.facebook.quick_replies.push(quick_reply);
                    }
                    
                    if (response.result.action=="input.question") {
                        let addQuickReplies = ['רמז', 'דלג'];
                        len = addQuickReplies.length;
                        for(let i=0; i<len; i++) {
                            let quick_reply = {};
                            quick_reply.content_type = "text";
                            quick_reply.title = addQuickReplies[i];
                            quick_reply.payload = addQuickReplies[i]; //"SOMETHING_SOMETHING";
                            facebookObj.facebook.quick_replies.push(quick_reply);
                        }
                    }
                    
                    msg = new builder.Message().address(address).sourceEvent(facebookObj);
                    messages.push(msg);

                } else if (address.channelId==='telegram') {
                    let len = message.replies.length;
                    if (message.title.indexOf('[>>]') !== (-1)) {
                        if (textResponseToQuickReplies === '') {
                            break;
                        } else {
                            message.title = textResponseToQuickReplies;
                        }
                    }
                    //let quick_reply = [];
                    //let actions = [];
                    let reply_markup = [];
                    for(let i=0; i<len; i++) {
                        //quick_reply.push(message.replies[i]);
                        //actions.push(new builder.CardAction().title(message.replies[i]).value(message.replies[i]));
                        reply_markup.push([{text: message.replies[i]}]);
                    }
                    /////////////////////
                    //let keyboard = new builder.Keyboard().buttons(actions);
                    //let msg = new builder.Message().address(address).text(message.title).attachments([keyboard]); buttons
                    msg = new builder.Message().address(address).sourceEvent({
                        telegram:{
                            method: 'sendMessage',
                            parameters: {
                                text: message.title,
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    //hide_keyboard: true
                                    keyboard:
                                    //[
                                        reply_markup
                                        
                                    //]
                                }
                            }
                        }
                    });
                    
                    /////////////////////
                    messages.push(msg);
                }
                //
                //messages.push(msg);
                break;
            case 3: // Card
                msg = new builder.Message().address(address)
                    .attachments([{
                        contentType: "image/jpeg",
                        contentUrl: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR0vB7eKzjzcDXW8Z-BaE5YoNnG3kgQ0S2lEg14-_3fWu88GkwIyQ'
                }]);
                messages.push(msg);
                break;
            case 4: // Custom Payload
                let payload = message.payload;
                /*if (response.result.action=="input.clue") {
                    let addQuickReplies = ['רמז נוסף', 'חזור לשאלה', 'דלג'];
                    payload.facebook.quick_replies = [];
                    len = addQuickReplies.length;
                    for(let i=0; i<len; i++) {
                        let quick_reply = {};
                        quick_reply.content_type = "text";
                        quick_reply.title = addQuickReplies[i];
                        quick_reply.payload = addQuickReplies[i]; //"SOMETHING_SOMETHING";
                        payload.facebook.quick_replies.push(quick_reply);
                    }
                }
                */
                msg = new builder.Message().address(address).sourceEvent(payload);
                messages.push(msg);
                break;
        }
    }
    return messages;
}

apiaiEventEmitter.on('apiai_response', function (connObj, response, userData, source) {
        chatFlow(connObj, response, userData, source)
        return;
        // connObj = session/address, response = from api.ai, userData = mainly if address sent, source = for debug
        /*
        let address = connObj;
        if (connObj.constructor.name=='Session') {
            address = connObj.message.address;
            if (connObj.userData || 'empty'==='empty') {
                connObj.userData = userData;
            } else if (connObj.userData.user_profile || 'empty'==='empty') {
                connObj.userData.user_profile = userData.user_profile;
            }
            if (connObj.userData.intent||'empty'!=='empty') {   // when userData.intent dont exists
                console.log("userData: " + connObj.userData.event || 'empty');
            }
        }
        let messages = [];
        console.log("action: " + response.result.action);
        //
        let eventName = null;
        switch(response.result.action) {
            case 'input.right':
                eventName = 'RIGHT_ANSWER_REPLY_FEMALE';
                if ((connObj.userData.user_profile || 'empty'==='empty')||(connObj.userData.user_profile.gender==='male')) {
                    eventName = 'RIGHT_ANSWER_REPLY_MALE';
                }
                break;
            case 'input.wrong':
                eventName = 'WRONG_ANSWER_REPLY_FEMALE';
                if ((connObj.userData.user_profile || 'empty'==='empty')||(connObj.userData.user_profile.gender==='male')) {
                    eventName = 'WRONG_ANSWER_REPLY_MALE';
                }
                break;
            default:
                eventName = null;
                break;
        }
        if (eventName!==null) {
            dbEventEmitter.emit('eventRequest', eventName, address, process.env.TIMEOUT_REPLY, userData || {});
            return;
        }
        //
        let len = response.result.fulfillment.messages.length;
        let textResponseToQuickReplies = '';
        for (let i=0; i<(len); i++) {
            let message = response.result.fulfillment.messages[i];
            let msg = {};
            console.log("message type: " + message.type + " " + source);
            switch(message.type) {
                case 0: // Text response
                    if (message.speech.indexOf('[>>]') !== (-1)) {
                            textResponseToQuickReplies = message.speech.split('[>>]')[0];
                            break;
                    }
                    if (address.channelId==='telegram') {
                        msg = new builder.Message().address(address).sourceEvent({
                            telegram:{
                                method: 'sendMessage',
                                parameters: {
                                    text: message.speech,
                                    parse_mode: 'Markdown',
                                    reply_markup: {
                                        hide_keyboard: true
                                    }
                                }
                            }
                        });
                        messages.push(msg);
                    }
                    else if (address.channelId==='facebook') {
                        let text = message.speech.replace(/\n/g, '\n\r');
                        msg = new builder.Message().address(address).text((response.result.action=="input.question")? ("שאלה:" + " " + text):(text));
                        messages.push(msg);
                    }
                    break;
                case 1: // Card
                    /*
                    let msg = new builder.Message(session).address(session.address).attachments([new builder.HeroCard(session).title("פיסת מידע").subtitle("פיסת מידע").text("זאת פיסת מידע בנושא השאלה שמכווינה לתשובה")
                    .images([builder.CardImage.create(session, 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR0vB7eKzjzcDXW8Z-BaE5YoNnG3kgQ0S2lEg14-_3fWu88GkwIyQ')
                    ]).buttons([
                        builder.CardAction.dialogAction(session, "info", "showInfo", "המשך לפיסת מידע"),
                        builder.CardAction.dialogAction(session, "info", "repeatQuestion", "חזור על השאלה"),
                        builder.CardAction.dialogAction(session, "info", "goToNextQuestion", "המשך לשאלה הבאה")
                    ])
                    ]);
                    messages.push(msg);
                    *//*
                    break;
                case 2: // Quick replies
                    if (address.channelId==='facebook') {
                        let facebookObj = {};
                        facebookObj.facebook = {};
                        facebookObj.facebook['text'] = (response.result.action=="input.question")? ("שאלה:" + " " + message.title):(message.title);
                        if (message.title.indexOf('[>>]') !== (-1)) {
                            facebookObj.facebook['text'] = textResponseToQuickReplies.replace(/\n/g, '\n\r');
                        }
                        facebookObj.facebook.quick_replies = [];
                        let len = message.replies.length;
                        for(let i=0; i<len; i++) {
                            let quick_reply = {};
                            quick_reply.content_type = "text";
                            quick_reply.title = message.replies[i];
                            quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
                            facebookObj.facebook.quick_replies.push(quick_reply);
                        } 
                        
                        msg = new builder.Message().address(address).sourceEvent(facebookObj);
                        messages.push(msg);

                    } else if (address.channelId==='telegram') {
                        let len = message.replies.length;
                        if (message.title.indexOf('[>>]') !== (-1)) {
                            if (textResponseToQuickReplies === '') {
                                break;
                            } else {
                                message.title = textResponseToQuickReplies;
                            }
                        }
                        //let quick_reply = [];
                        //let actions = [];
                        let reply_markup = [];
                        for(let i=0; i<len; i++) {
                            //quick_reply.push(message.replies[i]);
                            //actions.push(new builder.CardAction().title(message.replies[i]).value(message.replies[i]));
                            reply_markup.push([{text: message.replies[i]}]);
                        }
                        /////////////////////
                        //let keyboard = new builder.Keyboard().buttons(actions);
                        //let msg = new builder.Message().address(address).text(message.title).attachments([keyboard]); buttons
                        msg = new builder.Message().address(address).sourceEvent({
                            telegram:{
                                method: 'sendMessage',
                                parameters: {
                                    text: message.title,
                                    parse_mode: 'Markdown',
                                    reply_markup: {
                                        //hide_keyboard: true
                                        keyboard:
                                        //[
                                            reply_markup
                                            
                                        //]
                                    }
                                }
                            }
                        });
                        
                        /////////////////////
                        messages.push(msg);
                    }
                    //
                    //messages.push(msg);
                    break;
                case 3: // Card
                    msg = new builder.Message().address(address)
                        .attachments([{
                            contentType: "image/jpeg",
                            contentUrl: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR0vB7eKzjzcDXW8Z-BaE5YoNnG3kgQ0S2lEg14-_3fWu88GkwIyQ'
                    }]);
                    messages.push(msg);
                    break;
                case 4: // Custom Payload
                    msg = new builder.Message().address(address).sourceEvent(message.payload);
                    messages.push(msg);
                    break;
            }
        }
        //
        sendMessages(response, connObj, messages, userData || {});
        inputMetaQuestion(response, connObj);
        sendNextQuestion(response, address, userData || {});
      */  
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
function sendMessages(response, session, messages, userData) {
    let len = messages.length;
    let updateUserData = {};
    for (let i=0; i<(len); i++) {
        let message = messages[i];
        if (session.constructor.name=='Session') {
            updateUserData = sendMessageBySession(message, response, session);        
        } else {
            message.userData = userData;
            updateUserData = sendMessageProactive(message, response);
        }
    }
    //
    if (updateUserData) {
        writeCurrentUserData(session, updateUserData);
    }
}

function sendMessageProactive(message, response) {
    updateUserDataByMessage(message, response);
    //
    bot.send(message);
    //
    return message.userData;
}

function updateUserDataByMessage(message, response) {
    updateUserDataIntent(message, response);
}

function updateUserDataIntent(message, response) {
    message.userData.intent = {};
    //
    message.userData.intent.action = response.result.action;
    message.userData.intent.id = response.result.metadata.intentId;
    message.userData.intent.name = response.result.metadata.intentName;
    //
    if ((response.result.action=='input.question')&(response.result.resolvedQuery.indexOf('QUESTION_') !== (-1))) {
        let eventName = response.result.resolvedQuery;
        message.userData.event = eventName;
    }
}

function sendMessageBySession(message, response, session) {
    updateUserData(response, session);
    //
    message.userData = session.userData;
    session.send(message);
    //
    return session.userData;
}

function updateUserData(response, session) {
    if (session.userData.intent||'empty'==='empty') {
        session.userData.intent = {};    
    }
    session.userData.intent.action = response.result.action;
    session.userData.intent.id = response.result.metadata.intentId;
    session.userData.intent.name = response.result.metadata.intentName;
    //
    if ((response.result.action=='input.question')&(response.result.resolvedQuery.indexOf('QUESTION_') !== (-1))) {
        let eventName = response.result.resolvedQuery;
        session.userData.event = eventName;
    }
    //
    //let parameterName = response.result.action.split('.')[1];   // input.[paramet_name]
    //if (typeof session.userData.user_profile === typeof undefined) {
    //    session.userData.user_profile = {};    
    //}
    //console.log('session.userData.user_profile: ' + session.userData.user_profile);
    //session.userData.user_profile[parameterName] = response.result.parameters[parameterName];
    //console.log('session.userData.user_profile: ' + session.userData.user_profile);
}

function writeCurrentUserData(session, userData) {
    if (session.constructor.name=='Session') {
        let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').update(userData);
    } else {
        let refUser = ref.child('users').child(session.channelId).child(session.user.id).child('userData').update(userData);
    }
}

function sendLastQuestion(response, connObj, userData) {
    dbEventEmitter.emit('eventRequest', userData.event, address, null, userData || {});
}

function sendNextQuestion(response, address, userData) {
    let actionsForSending = ['input.skip', 'input.next'];
    if (actionsForSending.indexOf(response.result.action)>=0) {
        lotteryQuestion(address, userData);
    }
}

function lotteryQuestion(address, userData) {
    if ((questions || 'empty') === 'empty') {
        return;
    }
    let objKeys = Object.keys(questions)
    let subCategoryLen = objKeys.length;
    let subCategory = objKeys[Math.floor(Math.random() * subCategoryLen)];
    let objkeys1 = Object.keys(questions[subCategory]);
    let questionLen = objkeys1.length;
    let intent = objkeys1[Math.floor(Math.random() * questionLen)];
    let eventName = questions[subCategory][intent].events[0].name
    console.log(eventName);
    //eventName = "QUESTION_7";
    userData.event = eventName;
    dbEventEmitter.emit('eventRequest', eventName, address, null, userData || {});    
    
}

function inputMetaQuestion(response, session) {
    if (response.result.action=='input.metaQuestion') {
        if (!session.userData.event) {
            readCurrentIntent(session);
        } else {
            //dbEventEmitter.emit('eventRequest', session.userData.intent.event, address);
            eventRequestEmit(session);
        }
    }
}

function eventRequestEmit(session) {
    console.log('session.userData.event:' + session.userData.event || '');
    //console.log(userData || '');
    dbEventEmitter.emit('eventRequest', session.userData.event || '', session.message.address, null/*, userData || {}*/);
}

function readCurrentIntent(session) {
    ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).once("value", function(snapshot) {
        let user = snapshot.val();
        if (user.userData.intent===null) return;
        ////////////////////////////////////////////////////
        let eventName = user.event;
        session.userData.event = eventName;
        //dbEventEmitter.emit('eventRequest', connObj.userData.intent.event, address);
        eventRequestEmit(session);
        ////////////////////////////////////////////////////
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function getAllIntents(){
    let client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents'
    });
    let options = {};
    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    client.get(options,function(err, req, res) {
        syncFromApiaiToDb(JSON.parse(res.body));
    });
}

function syncFromApiaiToDb(intents) {
    let metaData = {};
    let len = intents.length;
    for (let i=0; i<(len); i++) {
        let intent = intents[i];
        buildToxonomy(intent, metaData);
    }
    console.log(metaData);
    let refCategory = ref.child('category').update(metaData);
}

function buildToxonomy(intent, metaData) {
    let temp = buildIntexCatalog(intent);

    metaData[temp.category.name] = metaData[temp.category.name] || {};
    let len = temp.category.subcategory.length || 0;
    for (let i=0; i<(len); i++) {
        metaData[temp.category.name][temp.category.subcategory[i].name] = metaData[temp.category.name][temp.category.subcategory[i].name] || {};
        metaData[temp.category.name][temp.category.subcategory[i].name][intent.id] = {
            'name': intent.name,
            'events': intent.events,
            'level' : temp.level
        };
    }
}

function buildIntexCatalog(intent) {
    let temp = {};
    temp.category = {};
    temp.category.subcategory = [];
    let len = intent.contextOut.length;
    for (let i=0; i<(len); i++) {
        let context = intent.contextOut[i];
        if (context.name.toLowerCase().indexOf(('level_')) !== (-1)) {
            let result = context.name.toLowerCase().split(('level_'));
            temp.level = result[1];
        } else if (context.name.toLowerCase().indexOf(('subcategory_')) !== (-1)) {
            let result = context.name.toLowerCase().split(('subcategory_'));
            let subcategory = {name: result[1]};
            temp.category['subcategory'].push(subcategory);
        } else if (context.name.toLowerCase().indexOf(('category_')) !== (-1)) {
            let result = context.name.toLowerCase().split(('category_'));
            temp.category['name'] = result[1];
        }
    }
    return temp;
}


