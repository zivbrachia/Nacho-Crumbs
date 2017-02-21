'use strict';

let restify = require('restify');
let builder = require('botbuilder');
let EventEmitter = require('events').EventEmitter;
let apiai = require('apiai');
let webRequest = require('request');
let schedule = require('node-schedule');
//require('./config.js');
let firebase = require('firebase-admin');
let db_credential = require('./serviceAccountKey.js');
let BotanalyticsMiddleware = require('botanalytics-microsoftbotframework-middleware').BotanalyticsMiddleware({
    token: process.env.BOTANALYTICS_TOKEN
});
let fs = require('fs');
let bodyParser = require('body-parser'); // for webhook

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

server.get('/info/:infoId', function (req, res, next) {
    let infoId = req.params.infoId || 'empty';
    let title = infoId;
    let header1 = infoId;
    let header2 = infoId;
    let heading1 = infoId;
    let lead1 = infoId;
    //
    let html = fs.readFileSync(__dirname + '/public/info.html', 'utf8');
    //
    html = html.replace('{title}', title);
    html = html.replace('{header1}', header1);
    html = html.replace('{header2}', header2);
    html = html.replace('{heading1}', heading1);
    html = html.replace('{lead1}', lead1);
    res.end(html);
});

server.get('/public/:folder/:fileName', function (req, res, next) {
    let file = fs.readFileSync(__dirname + '/public/' + req.params.folder + '/' + req.params.fileName, 'utf8');
    res.end(file);
});
//
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
            dbEventEmitter.emit('eventRequest', eventName, address, 0, userData, false);
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

server.use(bodyParser.json());   // webhook
server.post('/api/messages', connector.listen());

server.post('/webhook', function create(req, res, next) {   // webhook
    console.log('hook request');
    let bodyParser = require('body-parser');
    try {
        //var speech = 'empty speech';
        var speech = '';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                //requestBody.result.parameters.any
                ref.child('contacts').once("value", function(snapshot) {
                    let contacts = snapshot.val();
                    //
                    if (requestBody.result.action==='save_contact') {
                        speech = 'שמרתי את הנתונים, תודה :)';
                        let position = contacts.length;
                        let contact = {};
                        contact['name'] = requestBody.result.parameters['name'];
                        contact['phone-number'] = requestBody.result.parameters['phone-number'][0];
                        contact['job-place'] = requestBody.result.parameters['job-place'][0];
                        contact['job-title'] = requestBody.result.parameters['job-title'][0];
                        contacts.push(contact);
                        let refUser = ref.child('contacts').set(contacts);
                    }
                    else {
                        contacts.forEach(function(contact) {
                            if (contact.name.indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            } 
                            if (contact['job-place'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                            if (contact['job-title'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                            if (contact['phone-number'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                        }, this);
                    }
                    //
                    console.log(speech);
                    if (!speech) {
                        speech = 'empty speech'
                    }
                    return res.json({
                        speech: speech,
                        displayText: speech,
                        source: 'apiai-webhook-sample'
                    });
                }, function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                });
                /*
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action) {
                    speech += 'action: ' + requestBody.result.action;
                }
                */
            }
        }

        //console.log('result: ', speech);

        //return res.json({
        //    speech: speech,
        //    displayText: speech,
        //    source: 'apiai-webhook-sample'
        //});
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});
//=========================================================
// Bots Dialogs
//=========================================================
let intents = new builder.IntentDialog();

intents.onDefault(function (session) {
    let now = new Date();
    console.log('typing... message text: ' + session.message.text + ' userData: ' + session.userData.questionCounter);
    session.sendTyping();
    //
    
    let lastSendTime = new Date(session.userData.lastSendTime || now);
    //console.log('lastSendTime: ' + lastSendTime.toTimeString());
    lastSendTime.setMinutes(lastSendTime.getMinutes() + parseInt(process.env.APIAI_SESSION_TIMEOUT));
    //console.log('lastSendTime: ' + lastSendTime.toTimeString());
    //
    let textRequest = null;
    if (lastSendTime.getTime() < now.getTime()) {
        let eventName = session.userData.intent.name;
        dbEventEmitter.emit('eventRequest', eventName, session.message.address, 0, session.userData, session); // first revoke the user session
        //textRequest = setTextRequest(session);                                                          // second send the last user text
    } else {
        textRequest = setTextRequest(session);
    }
    //
    if ((session.message.address.channelId === 'facebook') & (session.userData.user_profile || 'empty'==='empty')) {
        userProfileEventEmitter.emit('facebook_user_profile', session, textRequest);
    } else {
        if (textRequest!==null) {
            textRequest.end();
        }
    }
    
    if (!session.userData.address) {
        let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('address').update(session.message.address);
        session.userData.address = true;
    }
});

function setTextRequest(session) {
    if (!session.userData.address) {
        session.message.text = 'hello';
    }
    let textRequest = app.textRequest(session.message.text, {
        sessionId: session.message.address.user.id
    });

    textRequest.on('response', function(response) {
        setImmediate(function() {
            session.userData.lastSendTime = session.lastSendTime;   // the request has made and we can update the send time
            //
            apiaiEventEmitter.emit('apiai_response', session, response, session.userData || {}, "textRequest");    
        });
    });

    textRequest.on('error', function(error) {
        console.log("error: " + JSON.stringify(error));
    });

    return textRequest;
}

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
    setImmediate(function() {
        webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let user_profile = JSON.parse(body);
                console.log('user_profile: ' + user_profile);
                session.userData.user_profile = user_profile;
                //
                let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile');
                refUser.update(user_profile);
            }
        });
    });
    /*
    webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let user_profile = JSON.parse(body);
            console.log('user_profile: ' + user_profile);
            session.userData.user_profile = user_profile;
            //
            let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile');
            refUser.update(user_profile);
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
            //refUser.update(user_profile);
            /*
        }
    });
    */
    request.end();
});
//
dbEventEmitter.on('eventRequest', function (eventName, address, timeout, userData, session) {
    console.error('setTimeout ' + eventName + ' : '+ timeout || process.env.TIMEOUT_QUESTION_MS);
    console.log('userData ' + userData.questionCounter);
    setTimeout(function () {
        let event = {
            name : eventName,
            data: {
                address: JSON.stringify(address),
                userData: JSON.stringify(userData)
            }
        };
        //
        if (userData.user_profile || 'empty' !== 'empty') {
            if (userData.user_profile.first_name || 'empty' !== 'empty') {
                event.data.first_name = userData.user_profile.first_name
            }
        }
        //
        let options = {
            sessionId: address.user.id
        };
        
        let eventRequest = app.eventRequest(event, options);

        eventRequest.on('response', function(response) {
            // when this activate it mean that api.ai response and we can send the actual text of the user.
            setImmediate(function() {
                if (session!==false) {
                    let textRequest = setTextRequest(session);
                    textRequest.end();
                    return;
                }
                let address = JSON.parse(response.result.parameters.address);
                let userData = JSON.parse(response.result.parameters.userData);
                apiaiEventEmitter.emit('apiai_response', address, response, userData || {}, "eventRequest");
            });
            /*
            if (session!==false) {
                let textRequest = setTextRequest(session);
                textRequest.end();
                return;
            }
            let address = JSON.parse(response.result.parameters.address);
            let userData = JSON.parse(response.result.parameters.userData);
            apiaiEventEmitter.emit('apiai_response', address, response, userData || {}, "eventRequest");
            */
        });

        eventRequest.on('error', function(error) {
            console.log('error: ' + error);
        });
    
        eventRequest.end();
    }, timeout || process.env.TIMEOUT_QUESTION_MS, eventName, address);
});

function chatFlow(connObj, response, userData, source) {
    let intentAction = response.result.action;
    console.error('INTENT_NAME: ' + response.result.metadata.intentName + ',  ' + 'ACTION_NAME: ' + intentAction + ', ' + 'SOURCE: ' + source);
    //
    let actionsReplyByGender = ['input.right', 'input.wrong'];
    let actionsMetaQuestion = ['input.metaQuestion', 'input.explain_last_question'];
    let actionsSendingNextQuestion = ['input.skip', 'input.next', 'input.category'];
    let actionsReturnQuestion = ['input.return_question', 'input.hint_replay'];  //, 'input.clue', 'input.hint'];
    let actionsStop = ['input.break_setting'];
    let actionExpand = ['input.info_expand'];
    //
    let address = connObj;
    if (connObj.constructor.name=='Session') {
        address = connObj.message.address;
    }
    //
    if ((!userData.intent)&(intentAction!=='input.welcome')) { // first time ever - sends default welcome intent - whatever the user says
        dbEventEmitter.emit('eventRequest', 'WELCOME', address, 0, userData || {}, false);
        return;
    } else if ((!!userData.intent)&(intentAction==='input.welcome')) {
        dbEventEmitter.emit('eventRequest', 'Welcome_Second_Time', address, 0, userData || {}, false);
        return;
    }
    //
    if (actionsReplyByGender.indexOf(intentAction)>=0) {
        // go to reply by gender
        // always connObj will be 'Session' object, cannot answer questions with proactive that connObj is 'Address' object
        if (response.result.fulfillment.messages[0].speech==='') {
            replyByGender(intentAction, connObj.userData, address)
            // there is no reason to continue the function and send messages because there is none...
            return;
        }
    } else if (actionsMetaQuestion.indexOf(intentAction)>=0) {
        // always connObj will be 'Session' object, cannot ask metaQuestions with proactive that connObj is 'Address' object
        inputMetaQuestion(response, connObj);
        return;
    } else if (actionsStop.indexOf(intentAction)>=0) {
        let date = new Date();
        if (response.result.parameters.duration) {
            switch(response.result.parameters.duration.unit) {
                case 'sec':
                    date.setSeconds(date.getSeconds() + response.result.parameters.duration.amount);
                break;
                default:
                    date.setSeconds(date.getSeconds() + 60);
                break;
            }    
        }
        let j = schedule.scheduleJob(date, function(){
            connObj.send("היי.... חזרתי");
            lotteryQuestion(connObj.message.address, connObj.userData, process.env.TIMEOUT_QUESTION_MS);
        }.bind(null, connObj));
    } else if (actionsReturnQuestion.indexOf(intentAction)>=0) {
        sendLastQuestion(response, connObj, userData || {});
        return;
    }
    //

    let messages = buildMessages(response, address, source);
    sendMessages(response, connObj, messages, userData || {});

    if (actionsSendingNextQuestion.indexOf(intentAction)>=0) {
        sendNextQuestion(response, address, userData || {});
        return;
    }

    if (intentAction==='profile.first_name') {  // TODO for MVP
        dbEventEmitter.emit('eventRequest', 'Gender', address, 4000, userData || {}, false);
        console.log("action: "+ intentAction);
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
        dbEventEmitter.emit('eventRequest', eventName, address, 0, userData || {}, false);
    }
}

function buildMsg(messageType, channelId, message) {
    if (messageType==='TextResponse') {
        if (channelId==='telegram') {

        } else if (channelId==='facebook') {

        }
    } else if (messageType==='Card') {
        if (channelId==='telegram') {

        } else if (channelId==='facebook') {

        }
    } else if (messageType==='QuickReplies') {
        if (channelId==='telegram') {

        } else if (channelId==='facebook') {

        }
    } else if (messageType==='CustomPayload') {
        if (channelId==='telegram') {

        } else if (channelId==='facebook') {

        }
    }
}
function buildMessages(response, address, source) {
    let startWith = '';
    if (response.result.action==="input.question") {
        startWith = 'שאלה: ';
    } else if (response.result.action==="input.hint_ask") {
        startWith = 'רמז: ';
    }
    let len = response.result.fulfillment.messages.length;
    let textResponseToQuickReplies = '';
    let messages = [];
    //
    if (response.result.action==='input.info_expand') {
        let msg = {};
        msg = new builder.Message().address(address).sourceEvent(cardJson('zzz', address, response));
        messages.push(msg);
        return messages;
    }
    //
    for (let i=0; i<(len); i++) {
        let message = response.result.fulfillment.messages[i];
        let msg = {};
        //console.log("message type: " + message.type + " " + source);
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
                                text: startWith + message.speech,
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
                    //msg = new builder.Message().address(address).text((response.result.action=="input.question")? ("שאלה:" + " " + text):(text));
                    msg = new builder.Message().address(address).text(startWith + text);
                    messages.push(msg);
                }
                break;
            case 1: // Card
            /*
                if (address.channelId==='facebook') {
                    let facebook = {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: []
                            }
                        }
                    };
                    facebook.attachment.payload.elements.push(buildElement(message));
                    let payload = {};
                    payload.facebook;
                    msg = new builder.Message().address(address).sourceEvent(payload);
                    messages.push(msg);
                }
                else if (address.channelId==='telegram') {

                }
                */
                break;
            case 2: // Quick replies
                if (address.channelId==='facebook') {
                    let facebookObj = {};
                    facebookObj.facebook = {};
                    facebookObj.facebook['text'] = startWith + message.title;
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
                    /*
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
                    */
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
                                text: startWith + message.title,
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
            case 3: // Image
                msg = new builder.Message().address(address)
                    .attachments([{
                        contentType: "image/gif",
                        contentUrl: message.imageUrl
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
        setImmediate(function() {
            chatFlow(connObj, response, userData, source)
        });
        //chatFlow(connObj, response, userData, source)
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
    if ((response.result.action=='input.question')&(response.result.metadata.intentName.indexOf(process.env.APIAI_QUESTION_TEMPLATE) !== (-1))) {
        let eventName = response.result.metadata.intentName;
        message.userData.event = eventName;
        message.userData.questionCounter = getCounter(message.userData.questionCounter);
    }
}

function getCounter(number) {
    if ((!number)&(number!==0)) {
        return 0;
    }
    if (number>3) {
        return 0;
    }
    return (number+1);
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
    if ((response.result.action=='input.question')&(response.result.metadata.intentName.indexOf(process.env.APIAI_QUESTION_TEMPLATE) !== (-1))) {
        let eventName = response.result.metadata.intentName;
        session.userData.event = eventName;
        session.userData.questionCounter = getCounter(session.userData.questionCounter);
    }
    //
    udpateUserDataByInputProfile(response, session);
}

function udpateUserDataByInputProfile(response, session) {
    if (response.result.action.indexOf('profile.') !== (-1)) {
        let parameterName = response.result.action.split('.')[1];   // profile.[paramet_name]
        if (typeof session.userData.user_profile === typeof undefined) {
            session.userData.user_profile = {};    
        }
        session.userData.user_profile[parameterName] = response.result.parameters[parameterName];
        copyUserDataToDb(session);
    }
}

function copyUserDataToDb(session) {
    let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(session.userData.user_profile);
}

function writeCurrentUserData(session, userData) {
    if (session.constructor.name=='Session') {
        let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').update(userData);
    } else {
        let refUser = ref.child('users').child(session.channelId).child(session.user.id).child('userData').update(userData);
    }
}

function sendLastQuestion(response, connObj, userData) {
    if (response.result.action==='input.hint_replay') {
        dbEventEmitter.emit('eventRequest', userData.event.replace('Ask', 'HintAsk'), connObj.message.address, process.env.TIMEOUT_REPLY, userData || {}, false);
    } else {
        dbEventEmitter.emit('eventRequest', userData.event, connObj.message.address, process.env.TIMEOUT_REPLY, userData || {}, false);
    }
}

function sendNextQuestion(response, address, userData) {
    let actionsForSending = ['input.skip', 'input.next'];
    let aaa = ['input.category'];
    let timeout = 4000;
    if (response.result.fulfillment.messages[0].speech!=='') {
            timeout = 4000;
    }
    //
    if (actionsForSending.indexOf(response.result.action)>=0) {
        if (userData.questionCounter===3) {
            lotteryInformation(address, userData, timeout);
            //lotteryQuestion(address, userData, timeout);
        } else {
            lotteryQuestion(address, userData, timeout);
        }
    } //else if (aaa.indexOf(response.result.action)>=0) {
      //  dbEventEmitter.emit('eventRequest', 'Category_Dna', address, 4000, userData || {}, false);    
    //}
}

function lotteryInformation(address, userData, timeout) {
    if ((questions || 'empty') === 'empty') {
        return;
    }
    /*
    let objKeys = Object.keys(questions)
    let subCategoryLen = objKeys.length;
    let subCategory = objKeys[Math.floor(Math.random() * subCategoryLen)];
    let objkeys1 = Object.keys(questions[subCategory]);
    let questionLen = objkeys1.length;
    let intent = objkeys1[Math.floor(Math.random() * questionLen)];
    let eventName = questions[subCategory][intent].name
    console.log('eventName :' + eventName);
    //eventName = "QUESTION_7";
    */
    let eventName = 'Information_1';
    //userData.event = 'Information_1';
    userData.questionCounter = 0;
    dbEventEmitter.emit('eventRequest', eventName, address, timeout, userData || {}, false);    
    
}

function lotteryQuestion(address, userData, timeout) {
    if ((questions || 'empty') === 'empty') {
        return;
    }
    let objKeys = Object.keys(questions)
    let subCategoryLen = objKeys.length;
    let subCategory = objKeys[Math.floor(Math.random() * subCategoryLen)];
    let objkeys1 = Object.keys(questions[subCategory]);
    let questionLen = objkeys1.length;
    let intent = objkeys1[Math.floor(Math.random() * questionLen)];
    let eventName = questions[subCategory][intent].name
    console.log('eventName :' + eventName);
    //eventName = "QUESTION_7";
    userData.event = eventName;
    userData.questionCounter = getCounter(userData.questionCounter);
    dbEventEmitter.emit('eventRequest', eventName, address, timeout, userData || {}, false);    
    
}

function inputMetaQuestion(response, session) {
    if (response.result.action==='input.metaQuestion') {
        if (!session.userData.event) {
            readCurrentIntent(session);
        } else {
            //dbEventEmitter.emit('eventRequest', session.userData.intent.event, address);
            eventRequestEmit(session);
        }
    }
    else if (response.result.action==='input.explain_last_question') {
        dbEventEmitter.emit('eventRequest', session.userData.event.replace('Ask', 'Explain') || '', session.message.address, 0, session.userData, false);
    }
}

function eventRequestEmit(session) {
    console.log('session.userData.event:' + session.userData.event || '');
    //console.log(userData || '');
    dbEventEmitter.emit('eventRequest', session.userData.event || '', session.message.address, 0, session.userData, false);
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

function cardJson(address, response) {
    let payload = {};
    //
    //if (address.channelId === 'facebook') {
        payload.facebook = cardJsonFacebook(response);
    //} else if (address.channelId === 'telegram') {
        payload.telegram = cardJsonTelegram(response);
    //}
    console.log(JSON.stringify(payload));
    return payload;
}

function cardJsonTelegram(infoId, response) {
    let telegram = {    method: "sendMessage",
                        text: 'title',
                        parameters: {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                       {
                                            text: 'title',
                                            url: 'https://nacho-crumbs.herokuapp.com/info/' + infoId
                                       } 
                                    ]
                                ]
                            }
                        }

    }
    return telegram;
}

function buildButton(text, url) {
    let button = {};
    button.title = text;
    if (url==='' ){
        button.type = 'postback';
        button.payload = text;
    } else {
        button.type = 'web_url';
        button.url = url;
        button.webview_height_ratio =  'tall';
    }
    return button;
}

function buildElement(message) {
    if (message.type!==1) {
        return {};
    }
    //
    let element = {
        image_url: "https://firebasestorage.googleapis.com/v0/b/nacho-crumbs.appspot.com/o/photos%2Fnacho1024.png?alt=media&token=40ea8306-8bf6-4810-b2b0-f45678438746",
        item_url: "https://firebasestorage.googleapis.com/v0/b/nacho-crumbs.appspot.com/o/photos%2Fnacho1024.png?alt=media&token=40ea8306-8bf6-4810-b2b0-f45678438746",
        subtitle: message.subtitle,
        title: message.title,
        buttons: []
    }
    //
    let len = message.buttons.length;
    for (let i=0; i<(len); i++) {
        element.buttons.push(buildButton(message.buttons[i]['text'], message.buttons[i]['postback']));    
    }
    
    return element;
}

function cardJsonFacebook(response) {
    let facebook = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: []
            }
        }
    };
    //
    let len = response.result.fulfillment.messages.length;
    for (let i=0; i<(len); i++) {
        facebook.attachment.payload.elements.push(buildElement(response.result.fulfillment.messages[i]));
    }
    
    return facebook;
}


