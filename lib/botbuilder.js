'use strict';

let apiai = require('../lib/apiai.js');
let facebook = require('../lib/facebook.js');
let db = require('../lib/database.js');
let builder = require('botbuilder');
//let webRequest = require('request');
let BotanalyticsMiddleware = require('botanalytics-microsoftbotframework-middleware').BotanalyticsMiddleware({
    token: process.env.BOTANALYTICS_TOKEN
});
let reply = require('../lib/replies.js');
let reply_media = require('../lib/replies_media.js');

let connector = chatConnector();
let bot = universalBot(connector);
let intents = new builder.IntentDialog();

module.exports = {sendMessages, getMessageImage, getMessageSourceEvent, getMessageText};
module.exports.builder = builder;
module.exports.connector = connector;
module.exports.bot = bot;

/*bot.use({
    receive: BotanalyticsMiddleware.receive,
    send: BotanalyticsMiddleware.send
    
});*/

bot.set('persistConversationData', true);
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

function getCard(session, title, subtitle, text, imageUrl, buttons) {
    // buttons = [{postback: postback text, title: title}]
    let buttons_array = [];
    if (buttons) {
        for (let i = 0; i<buttons.length; i++) {
            let button = new builder.CardAction.postBack(session, buttons[i].postback, buttons[i].title );
            buttons_array.push(button);
        }
    }
    let card = new builder.HeroCard(session)
        .title(title)
        .subtitle(subtitle)
        .text(text)
        .buttons(buttons_array);

    if (imageUrl) {
        card.images([
            builder.CardImage.create(session, imageUrl)
        ]);
    }

    return card;
}
intents.matches(/^פרק [0-9]+$/i, function (session) {
    session.sendTyping();
    //
    let chapter = session.message.text.split(" ")[1];
    if (chapter===undefined) {
        session.send("הכנס 'פרק x'");
    }
    else {
        session.userData.chapter = session.message.text.split(" ")[1];
        session.userData.learn = session.userData.learn || "study";

        db.getQuestionsByChapter(session.userData.chapter, function (questions) {
            session.userData.questions_backet = questions.slice(1,questions.length);
            let replyMessage = new builder.Message(session).text("?מתחילים");
            replyMessage.sourceEvent({
                facebook: {
                    quick_replies: [{
                        content_type: "text",
                        title: "התחל",
                        payload: "question",
                    }]
                }
            });
            session.send(replyMessage);
        });
    }
});

function endChapter(session) {
    let messages = [];
    //
    let text = "";
    if (session.userData.learn==="study") {
        text = "סיימנו את הפרק הלימודי";
    } else {
        text = "סיימנו את תרגול הפרק"
    }
    let msg = new builder.Message(session).text(text);
    messages.push(msg);
    let sourceEvent = { "facebook": { "quick_replies": [] } };
    sourceEvent.facebook.quick_replies.push({ "content_type": "text", "title": "לימוד", "payload": "לימוד" });
    sourceEvent.facebook.quick_replies.push({ "content_type": "text", "title": "תרגול", "payload": "תרגול" });
    //
    messages[messages.length - 1].sourceEvent(sourceEvent);

    return messages;
}
intents.matches(/^question/i, function (session) {
    session.sendTyping();
    session.userData.hint_try = 0;
    let messages = [];
    if (session.userData.questions_backet[0]===undefined) {
        messages = endChapter(session);
    }
    else {
        if (session.userData.learn==="study") {
            session.userData.current_question = session.userData.questions_backet[0];
        }
        else if (session.userData.learn==="practice") {
            //session.userData.current_question = session.userData.questions_backet[Math.floor(Math.random()*session.userData.questions_backet.length)];
            session.userData.current_question = session.userData.questions_backet[0];
        }
        //session.userData.current_question = session.userData.questions_backet[0];
        //session.userData.questions_backet = session.userData.questions_backet.slice(1, session.userData.questions_backet.length);
        if (session.userData.current_question.Open_Sentence.length) {
            for (let i = 0; i < session.userData.current_question.Open_Sentence.length; i++) {
                let msg = new builder.Message(session).text(session.userData.current_question.Open_Sentence[i].title);
                messages.push(msg);
            }
        }
        let msg = new builder.Message(session).text(session.userData.current_question.Question);
        let sourceEvent = { "facebook": { "quick_replies": [] } };
        for (let i = 0; i < session.userData.current_question.choices.length; i++) {
            sourceEvent.facebook.quick_replies.push({ "content_type": "text", "title": session.userData.current_question.choices[i].title, "payload": session.userData.current_question.choices[i].isCorrect + "Answer" })
        }
        msg.sourceEvent(sourceEvent);
        messages.push(msg);
    }
    for (let i = 0; i < messages.length; i++) {
        session.send(messages[i].toMessage());
        session.sendBatch(function (err) {
            if (err) console.error(err);
        });
    }
});

function buildExplain(session) {
    let messages = [];
    //
    let sourceEvent = { "facebook": { "quick_replies": []}};
    sourceEvent.facebook.quick_replies.push({"content_type": "text", "title": "המשך", "payload": "question"});
    let lastMessage = new builder.Message(session).sourceEvent(sourceEvent);
    //
    if (session.userData.current_question.Explain_Sentence_Before.length) {
        for (let i=0; i<session.userData.current_question.Explain_Sentence_Before.length; i++) {
            if (session.userData.current_question.Explain_Sentence_Before[i].title!=="") {
                let msg = new builder.Message(session).text(session.userData.current_question.Explain_Sentence_Before[i].title);
                messages.push(msg);
            }
        }
    }
    if (session.userData.current_question.Explain_Sentence.length) {
        for (let i = 0; i < session.userData.current_question.Explain_Sentence.length; i++) {
            if (session.userData.current_question.Explain_Sentence[i].imageUrl) {
                let msg = new builder.Message(session).attachments([{"contentType": "image/gif", "contentUrl": session.userData.current_question.Explain_Sentence[i].imageUrl}]);
                messages.push(msg);
            }
            else {
                if (session.userData.current_question.Explain_Sentence[i].title!=="") {
                    let msg = new builder.Message(session).text(session.userData.current_question.Explain_Sentence[i].title);
                    messages.push(msg);
                }
            }
        }
    }
    if (session.userData.current_question.Explain_Sentence_After.length) {
        for (let i=0; i<session.userData.current_question.Explain_Sentence_After.length; i++) {
            if (session.userData.current_question.Explain_Sentence_After[i].title!=="") {
                let msg = new builder.Message(session).text(session.userData.current_question.Explain_Sentence_After[i].title);
                messages.push(msg);
            }
        }
    }
    return messages;
}

function afterAnswer(session) {
    let messages = buildExplain(session);
    //
    let sourceEvent = { "facebook": { "quick_replies": [] } };
    sourceEvent.facebook.quick_replies.push({ "content_type": "text", "title": "המשך", "payload": "question" });
    messages[messages.length - 1].sourceEvent(sourceEvent);
    //
    if (session.userData.learn==="study") {
        session.userData.questions_backet = session.userData.questions_backet.slice(1, session.userData.questions_backet.length);
    } else if (session.userData.learn==="practice") {
        session.userData.questions_backet = session.userData.questions_backet.slice(1, session.userData.questions_backet.length);
    }
    //
    return messages;
}

intents.matches(/^trueAnswer/i, function (session) {
    session.sendTyping();
    let messages = afterAnswer(session);
    reply_media
    let msg = new builder.Message(session).attachments([{"contentType": "image/gif", "contentUrl": reply_media.right_answer[Math.floor(Math.random()*reply_media.right_answer.length)]}]);
    messages.unshift(msg);
    msg = new builder.Message(session).text(reply.right_answer[Math.floor(Math.random()*reply.right_answer.length)]);
    messages.unshift(msg);
    //
    for (let i = 0; i < messages.length; i++) {
        session.send(messages[i].toMessage());
        session.sendBatch(function (err) {
            if (err) console.error(err);
        });
    }
});

intents.matches(/^falseAnswer/i, function (session) {
    session.sendTyping();
    let messages = [];
    if (session.userData.hint_try >= 1) {
        messages = afterAnswer(session);
        let msg = new builder.Message(session).attachments([{"contentType": "image/gif", "contentUrl": reply_media.wrong_answer[Math.floor(Math.random()*reply_media.wrong_answer.length)]}]);
        messages.unshift(msg);
        msg = new builder.Message(session).text(reply.wrong_answer[Math.floor(Math.random()*reply.wrong_answer.length)]);
        messages.unshift(msg);
    }
    else {
        messages = hint(session);
        let msg = new builder.Message(session).text(reply.wrong_answer[Math.floor(Math.random()*reply.wrong_answer.length)]);
        messages.unshift(msg);
    }

    for (let i = 0; i < messages.length; i++) {
        session.send(messages[i].toMessage());
        session.sendBatch(function (err) {
            if (err) console.error(err);
        });
    }
});

function hint(session) {
    let messages = [];
    session.userData.hint_try = session.userData.hint_try + 1;
    if (session.userData.current_question.Hint.length) {
        for (let i=0; i<session.userData.current_question.Hint.length; i++) {
            let msg = new builder.Message(session).text(session.userData.current_question.Hint[i].title);
            messages.push(msg);
        }
    }
    let msg = new builder.Message(session).text("אז מה התשובה תהיה?");
    let sourceEvent = { "facebook": { "quick_replies": []}};
    let wrong_answer = session.message && session.message.sourceEvent && session.message.sourceEvent.message && session.message.sourceEvent.message.text;
    for (let i=0; i<session.userData.current_question.choices.length; i++) {
        if ((wrong_answer) && (wrong_answer===session.userData.current_question.choices[i].title)) {
        }
        else {
            sourceEvent.facebook.quick_replies.push({"content_type": "text", "title": session.userData.current_question.choices[i].title, "payload": session.userData.current_question.choices[i].isCorrect + "Answer"})
        }
    }
    msg.sourceEvent(sourceEvent);
    messages.push(msg);
    return messages;
}
intents.matches(/^רמז/i, function (session) {
    session.sendTyping();
    let messages = [];
    if (session.userData.current_question.Hint.length) {
        for (let i=0; i<session.userData.current_question.Hint.length; i++) {
            let msg = new builder.Message(session).text(session.userData.current_question.Hint[i].title);
            messages.push(msg.toMessage());
        }
    }
    let msg = new builder.Message(session).text("אז מה התשובה תיהיה?");
    let sourceEvent = { "facebook": { "quick_replies": []}};
    for (let i=0; i<session.userData.current_question.choices.length; i++) {
        sourceEvent.facebook.quick_replies.push({"content_type": "text", "title": session.userData.current_question.choices[i].title, "payload": session.userData.current_question.choices[i].isCorrect + "Answer"})
    }
    msg.sourceEvent(sourceEvent);
    messages.push(msg.toMessage());
    for (let i=0; i<messages.length; i++) {
        session.send(messages[i]);
        session.sendBatch(function (err) {
            if (err) console.error(err);
        });
    }
});

intents.matches(/^לימוד/i, function (session) {
    session.sendTyping();
    session.userData.learn = "study";
    db.getChapters(function (chapters, res) {
        let chapter = [];
        chapters.forEach(function (element, i) {
            chapter.push(getCard(session, element.title, '', '', '', [{"postback": "פרק " + (4), "title": "פרק " + (i+1)}]));
        });
        var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(chapter);
        session.send(msg);
    });
});

intents.matches(/^תרגול/i, function (session) {
    session.sendTyping();
    session.userData.learn = "practice";
    db.getChapters(function (chapters, res) {
        let chapter = [];
        chapters.forEach(function (element, i) {
            chapter.push(getCard(session, element.title, '', '', '', [{"postback": "פרק " + (4), "title": "פרק " + (i+1)}]));
        });
        var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(chapter);
        session.send(msg);
    });
});

intents.matches(/^reset userData/i, function (session) {
    session = deleteUserData(session);
    session.send("userData has been reset");
    session.sendBatch(function (err) {
        if (err) console.error(err);
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

/*function sendMessagesPromise(response, session, messages, userData) {
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
}*/

function sendMessages(response, session, messages, userData) {
    //userData.aaa = ((userData.aaa || 0) + 1); 
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
        if (err) {
            console.error(err);
        }
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

