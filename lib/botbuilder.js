'use strict';

let apiai = require('../lib/apiai.js');
let facebook = require('../lib/facebook.js');
let db = require('../lib/database.js');
let builder = require('botbuilder');
//let webRequest = require('request');
let BotanalyticsMiddleware = require('botanalytics-microsoftbotframework-middleware').BotanalyticsMiddleware({
    token: process.env.BOTANALYTICS_TOKEN
});

let connector = chatConnector();
let bot = universalBot(connector);
let intents = new builder.IntentDialog();

module.exports = {sendMessages, getMessageImage, getMessageSourceEvent, getMessageText, sendMessagesPromise};
module.exports.builder = builder;
module.exports.connector = connector;
module.exports.bot = bot;

bot.use({
    receive: BotanalyticsMiddleware.receive,
    send: BotanalyticsMiddleware.send
    
});

bot.dialog('/', intents);

function chatConnector(microsoft_app_id, microsoft_app_password) {
    // Create chat bot
    let connector = new builder.ChatConnector({
        appId: microsoft_app_id || process.env.MICROSOFT_APP_ID,
        appPassword: microsoft_app_password || process.env.MICROSOFT_APP_PASSWORD
    });

    return connector;
}

function universalBot(connector) {
    let bot = new builder.UniversalBot(connector);
    return bot;
}

function deleteUserData(session) {
    session.userData = {};
    return session;
}

intents.onDefault(function (session) {
    console.log('typing... message text: ' + session.message.text);
    session.sendTyping();

    if (!session.userData.address) {
        db.updateUserAddress(session.message.address.channelId, session.message.address.user.id, session.message.address);
        session.userData.address = true;
    }

    let webRequestFacebook = facebook.webRequestPromise(session);
    webRequestFacebook.then(
        function (user_profile) {
            db.updateUserProfile(session.message.address.channelId, session.message.address.user.id, user_profile);
            session.userData.user_profile = user_profile;
            let textRequest = apiai.getResponseForInput(session);
            textRequest.end();
        }
    ).catch(
        function (err) {
            console.log(err);
            let textRequest = apiai.getResponseForInput(session);
            textRequest.end();
        }
    );
});

intents.matches(/^reset userData/i, function (session) {
    session = deleteUserData(session);
    session.send("userData has been reset");
    session.sendBatch(function (err) {
        console.log(err);
    });
});

intents.matches(/^show userData/i, function (session) {
     session.send(JSON.stringify(session.userData));
     session.sendBatch(function (err) {
        console.log(err);
     });
});

intents.matches(/^db/i, function (session) {
    let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('questions');
    //refUser.update({[session.message.text.split(" ")[1]]: session.message.text.split(" ")[2]});
    let now = new Date();
    refUser = refUser.child(session.message.text.split(" ")[1]);
    refUser = refUser.child('timeline');
    let timeline = {};
    timeline[now.getTime()] = {};
    timeline[now.getTime()].action = session.message.text.split(" ")[2];
    refUser.update(timeline);
});

intents.matches(/^hello/i, function (session){
    session.send("Hi there");
    //https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q=Neta
    
    let translate = new Promise(function (resolve, reject) {
        translate('en', 'iw', 'Brachia', resolve, reject);
    }).bind(session);

    translate.then(
         function (val) {
            console.log(val);
            session.send('How do you do, ' + val)
         }
    ).catch(
        function (err) {
            console.log(err);
        }
    );
});

function translate(from, to, text, resolve, reject) {    // from = en (english), to = iw (hebrew) // used with Promise
    webRequest('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + from + '&tl=' + to + '&dt=t&q=' + text, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let result = body.split('"');
            console.log('user_name_translated to: ' + result[1]);
            //session.send('How do you do, ' + result[1])
            resolve("YES " + result[1]);
            //session.userData.user_profile = user_profile;
            //let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(user_profile);
        }
        reject("NO");
    });
}

function getMessageText(address, text) {
    let msg = new builder.Message().address(address).text(text);
    return msg;
}

function getMessageSourceEvent(address, payload) {
    let msg = new builder.Message().address(address).sourceEvent(payload);
    return msg;
}

function getMessageImage(address, imageUrl) {
    let msg = new builder.Message().address(address).attachments(
        [
            {
                contentType: "image/gif",
                contentUrl: imageUrl
            }
        ]
    );
    return msg;
}

function sendMessagesPromise(response, session, messages, userData) {
    let promise = new Promise(function (resolve) {
        let len = messages.length;
        let updateUserData = {};
        if (session.constructor.name==='Session') {
            for (let i=0; i<(len); i++) {
                let message = messages[i];
                updateUserData = sendMessageBySession(message, response, session);
            }
        }
        else {
            updateUserData = sendMessagesProactive(messages, response, userData);
        }
        if (updateUserData) {
            writeCurrentUserData(session, updateUserData);
        }
        resolve(updateUserData);    
    });
    return promise;
}

function sendMessages(response, session, messages, userData) {
    let len = messages.length;
    let updateUserData = {};
    if (session.constructor.name==='Session') {
        session.userData = userData;
        for (let i=0; i<(len); i++) {
            let message = messages[i];
            updateUserData = sendMessageBySession(message, response, session);
        }
    }
    else {
        updateUserData = sendMessagesProactive(messages, response, userData);
    }
    if (updateUserData) {
        writeCurrentUserData(session, updateUserData);
    }
}

function sendMessagesProactive(messages, response, userData) {
    userData.intent = userData.intent || {};
    //
    userData.intent.action = response.result.action;
    userData.intent.id = response.result.metadata.intentId;
    userData.intent.name = response.result.metadata.intentName;
    //
    if ((response.result.action=='input.question')&(response.result.metadata.intentName.indexOf(process.env.APIAI_QUESTION_TEMPLATE) !== (-1))) {
        let eventName = response.result.metadata.intentName;
        userData.event = eventName;
    }
    //
    let len = messages.length;
    for (let i=0; i<(len); i++) {
            messages[i].userData = userData;
    }

    bot.send(messages);

    return userData;
}

function writeCurrentUserData(session, userData) {
    if (session.constructor.name=='Session') {
        //let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').update(userData);
    } else {
        //let refUser = ref.child('users').child(session.channelId).child(session.user.id).child('userData').update(userData);
    }
}

function sendMessageBySession(message, response, session) {
    updateUserData(response, session);
    //
    message.userData = session.userData;
    session.send(message);
    session.sendBatch(function (err) {
        console.log(err);
     });
    //
    return session.userData;
}

function updateUserData(response, session) {
    //if (session.userData.intent||'empty'==='empty') {
    //    session.userData.intent = {};    
    //}
    session.userData.intent = session.userData.intent || {};
    session.userData.intent.action = response.result.action;
    session.userData.intent.id = response.result.metadata.intentId;
    session.userData.intent.name = response.result.metadata.intentName;
    //
    if ((response.result.action=='input.question')&(response.result.metadata.intentName.indexOf(process.env.APIAI_QUESTION_TEMPLATE) !== (-1))) {
        let eventName = response.result.metadata.intentName;
        session.userData.event = eventName;
        //
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
    //let refUser = ref.child('users').child(session.message.address.channelId).child(session.message.address.user.id).child('userData').child('user_profile').update(session.userData.user_profile);
}

function getCounter(number) {
    if ((!number)&(number!==0)) {
        return 1;
    }
    //if (number>3) {
    //    return 0;
    //}
    return (number+1);
}

