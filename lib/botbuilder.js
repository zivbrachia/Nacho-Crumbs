'use strict';

let restify = require('restify');
let apiai = require('../lib/apiai.js');
let facebook = require('../lib/facebook.js');
let db = require('../lib/database.js');
let builder = require('botbuilder');
//let webRequest = require('request');
let shuffle = require('shuffle-array');
let striptags = require('striptags');
let BotanalyticsMiddleware = require('botanalytics-microsoftbotframework-middleware').BotanalyticsMiddleware({
    token: process.env.BOTANALYTICS_TOKEN
});
let reply = require('../lib/replies.js');
let reply_media = require('../lib/replies_media.js');
let chapters = require('../lib/chapters.js');

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

bot.set('persistConversationData', true);
bot.dialog('/', intents);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
function buildQuestion(session, promptObj) {
    let messages = [];
    promptObj = promptObj || {};
    if (session.userData.questions_backet[0]===undefined) {
        promptObj.end_chapter = true;
    }
    else {
        messages = buildCurrentQuestion(session, promptObj);
    }
    return messages;
}

function buildCurrentQuestion(session, promptObj) {
    let messages = [];
    promptObj = promptObj || {};
    if (session.userData.learn === "study") {
        session.userData.current_question = session.userData.questions_backet[0];
    }
    else if (session.userData.learn === "practice") {
        session.userData.current_question = session.userData.questions_backet[0];
        let numerator = session.userData.questions_backet_history.length + 1;
        let denominator = session.userData.questions_backet.length + session.userData.questions_backet_history.length;
        let msg = new builder.Message(session).text("שאלה " + numerator + " מתוך " + denominator);
        messages.push(msg);
    }
    if (session.userData.current_question.Open_Sentence && session.userData.current_question.Open_Sentence.length) {
        for (let i = 0; i < session.userData.current_question.Open_Sentence.length; i++) {
            let msg = new builder.Message(session).text(session.userData.current_question.Open_Sentence[i].title);
            messages.push(msg);
        }
    }
    if (session.userData.current_question.Question && session.userData.current_question.Question.length) {
        for (let i = 0; i < session.userData.current_question.Question.length; i++) {
            let msg = new builder.Message(session).text(session.userData.current_question.Question[i].title);
            messages.push(msg);
        }
    }
    //promptObj.title = messages[messages.length - 1].data.text;
    //messages = messages.slice(0, messages.length-1);

    let arr_choice = [];
    let is_change_choise_to_msg = false;
    for (let i = 0; i < session.userData.current_question.choices.length; i++) {
        arr_choice.push(session.userData.current_question.choices[i].title);

        if (session.userData.current_question.choices[i].title.length >= 20) {
            is_change_choise_to_msg = true;
        }
    }
    promptObj.choice = arr_choice.join("|");
    //
    if (is_change_choise_to_msg) {
        promptObj.title = add_answers_to_msg(session);
        arr_choice = [];
        for (let i = 0; i < session.userData.current_question.choices.length; i++) {
            arr_choice.push(session.userData.current_question.choices[i].title);
        }
        promptObj.choice = arr_choice.join("|");
    } else {
        promptObj.title = messages[messages.length - 1].data.text;
        messages = messages.slice(0, messages.length-1);
    }
    //

    return messages;
}

function add_answers_to_msg(session) {
    let msg_text = "";
    //let choices_new = [];
    for (let i = 0; i < session.userData.current_question.choices.length; i++) {
        msg_text = (msg_text || "") + (i + 1) + ". " + session.userData.current_question.choices[i].title + "\n";
        //choices_new.push((i + 1));
        session.userData.current_question.choices[i].payload = session.userData.current_question.choices[i].title;
        session.userData.current_question.choices[i].title = (i + 1);
    }
    //obj_choice.arr_choice = choices_new;
    return msg_text;
}

function send_messages(session, messages) {
    for (let i = 0; i < messages.length; i++) {
        session.send(messages[i].toMessage());
        session.sendBatch(function (err) {
            if (err) console.error(err);
        });
    }
}
function is_answer_correct(session, answer) {
    if (answer===false) {
        return false;
    }
    for (let i = 0; i < session.userData.current_question.choices.length; i++) {
        if (((session.userData.current_question.choices[i].title===answer) || (session.userData.current_question.choices[i].payload===answer)) && (session.userData.current_question.choices[i].isCorrect===true)) {
            return true;
        }
        if (((session.userData.current_question.choices[i].title===answer) || (session.userData.current_question.choices[i].payload===answer)) && (session.userData.current_question.choices[i].isCorrect===false)) {
            return false;
        }
    }
    return false;
}

bot.dialog('question_flow', [
    function (session, args, next) {    // question
        session.sendTyping();
        console.log("question_flow", session.message.text);
        let promptObj = {};
        session.userData.hint_try = 0;
        let messages = buildQuestion(session, promptObj);
        send_messages(session, messages);
        if (promptObj.end_chapter) {
            session.replaceDialog("end_chapter");
        } else {
            console.log("question_flow Prompts", promptObj);
            builder.Prompts.choice(session, promptObj.title, promptObj.choice, {listStyle: builder.ListStyle.button, maxRetries:0});
        }
    },
    function (session, results, next) { // answer right - next question # answer wrong - send hint dialog
        session.sendTyping();
        console.log("question_flow answer1", session.message.text);
        session.dialogData.answer = session.message.text;   //results.response;
        let promptObj = {};
        
        let answer = session.message.text;//session.dialogData.answer && session.dialogData.answer.entity;
        let answer_status = is_answer_correct(session, answer);
        if (answer_status === true) {
            let messages = build_answer_messages(session, answer_status, promptObj);
            send_messages(session, messages);
            if (promptObj.end_chapter) {
                session.replaceDialog("end_chapter");
            } else {
                builder.Prompts.choice(session, promptObj.title, promptObj.choice, { listStyle: builder.ListStyle.button, maxRetries: 0 });
                console.log("question_flow corrent end", promptObj);
                session.endDialog();
            }
        }
        else {
            if (session.userData.hint_try >= 1) {
                let messages = build_answer_messages(session, answer_status, promptObj);
                 send_messages(session, messages);
                 if (promptObj.end_chapter) {
                     session.replaceDialog("end_chapter"); // Display the menu again.
                 } else {
                     builder.Prompts.choice(session, promptObj.title, promptObj.choice, { listStyle: builder.ListStyle.button, maxRetries: 0 });
                     console.log("question_flow wrong 2", promptObj);
                     session.endDialog();
                 }
            }
            else {
                session.replaceDialog('hint', 'question_flow');
            }
        }
    }
]).triggerAction({
    matches: [/^המשך/i, /^התחל/i]
});

bot.dialog("end_chapter", [
    function (session, args, next) {    // if end chapter study suggest to practice it else choose study or practice again
        let promptObj = {};
        let messages = endChapter(session, promptObj);
        send_messages(session, messages);
        builder.Prompts.choice(session, promptObj.title, promptObj.choice, {listStyle: builder.ListStyle.button, maxRetries:0});
        console.log("end_chapter Prompts", promptObj);
        session.endDialog();
    }
]);

bot.dialog("error_flow", [
    function (session, args, next) {
        let messages = [];
        //msg = new builder.Message(session).text("אוי זה ממש מביך, אולי תנסה שוב");
        //messages.push(msg);
        send_messages(session, messages);
        builder.Prompts.choice(session, "אוי זה ממש מביך, אולי תנסה שוב", "לימוד|תרגול", {listStyle: builder.ListStyle.button, maxRetries:0});
        console.log("error_flow", "try again");
        session.endDialog();
    }
]);

bot.dialog('study', [
    function (session) {
        session.sendTyping();
        session.userData.learn = "study";
        console.log("study", session.userData.learn);
        send_chapters(session);
    }
]).triggerAction({    // sending chapters of study
    matches: /^לימוד/i
});

bot.dialog('practice', [
    function (session) {    // sending chapters of practice
        session.sendTyping();
        session.userData.learn = "practice";
        console.log("practice", session.userData.learn);
        send_chapters(session);
    }
]).triggerAction({
    matches: /^תרגול/i,
});

bot.dialog('practice_specific_chapter', [
    function (session) {    // practice specific chapter per the study chapter
        session.sendTyping();
        session.userData.learn = "practice";
        session.userData.chapter = 4;   //session.message.text.split(" ")[1];

        
        cet_by_document("4d8dd634-2569-45d8-9cce-a4a83ae625ce", function (err, questions_backet) {
            if (err) {
                session.replaceDialog("error_flow");
            }
            else {
                session.userData.questions_backet = questions_backet;
                session.userData.questions_backet_history = [];
                shuffle(session.userData.questions_backet, { 'copy': false });
                session.replaceDialog("question_flow");
            }
        });

        /*db.getQuestionsByChapter(session.userData.chapter, function (questions) {
            session.userData.questions_backet = questions.slice(1, questions.length);
            session.userData.questions_backet_history = [];
            shuffle(session.userData.questions_backet, { 'copy': false });

            //builder.Prompts.choice(session, "?נתחיל לתרגל", "התחל", { listStyle: builder.ListStyle.button, maxRetries: 0 });
            //session.endDialog();session
            console.log("practice_specific_chapter", [session.userData.learn, session.userData.chapter]);
            session.replaceDialog("question_flow");
        });*/
    }
]).triggerAction({
    matches: [/^תרגול [0-9]+$/i, /^תרגול פרק [0-9]+$/i]
});

bot.dialog('chapter', [
    function (session) {    // loads the question per chapter
        session.sendTyping();
        //
        let chapter = session.message.text.split(" ")[1];
        if (chapter === undefined) {
            session.send("הכנס 'פרק x'");
        }
        else {
            session.userData.chapter = 4;//session.message.text.split(" ")[1];
            session.userData.learn = session.userData.learn || "study";
            session.userData.chapter_name = chapters[session.userData.chapter-1].title;

            db.getQuestionsByChapter(session.userData.chapter, function (questions) {
                session.userData.questions_backet = questions.slice(1, questions.length);
                session.userData.questions_backet_history = [];
                if (session.userData.learn === "practice") {
                    shuffle(session.userData.questions_backet, { 'copy': false });
                }
                console.log("chapter", [session.userData.learn, session.userData.chapter]);
                session.replaceDialog("question_flow"); // Display the menu again.
                //session.endDialog();
            });
        }
    }
]).triggerAction({
    matches: /^פרק [0-9]+$/i
});

bot.dialog('hint', [
    function (session, args, next) {    // show hint relate to question
        session.sendTyping();
        let promptObj = {};
        let messages = hint(session, promptObj);
        if (args==="question_flow") {
            let msg = new builder.Message(session).text("❌ קח רמז, תנסה שוב");
            messages.unshift(msg);
        } 
        else {
            let msg = new builder.Message(session).text("הרמז לשאלה");
            messages.unshift(msg);
        }
        send_messages(session, messages);
        console.log("hint", promptObj);
        builder.Prompts.choice(session, promptObj.title, promptObj.choice, { listStyle: builder.ListStyle.button, maxRetries: 0 });
    },
    function (session, results, next) { // answer right - positive indicator # answer wrong - negative indicator
        session.sendTyping();

        let promptObj = {};
        let answer = session.message.text;//session.dialogData.answer && session.dialogData.answer.entity;
        let answer_status = is_answer_correct(session, answer);

        let messages = build_answer_messages(session, answer_status, promptObj);
        send_messages(session, messages);
        if (promptObj.end_chapter) {
                session.replaceDialog("end_chapter"); // Display the menu again.
        }
        else {
            builder.Prompts.choice(session, promptObj.title, promptObj.choice, { listStyle: builder.ListStyle.button, maxRetries: 0 });
        }
        session.endDialog();
    }
]).triggerAction({
    matches: /^רמז/i
});

function build_answer_messages(session, is_answer_correct, promptObj) {
    let messages = [];
    promptObj = promptObj || {};
    messages = afterAnswer(session, promptObj);
    if (is_answer_correct===true) {
        let msg = new builder.Message(session).attachments([{ "contentType": "image/gif", "contentUrl": reply_media.right_answer[Math.floor(Math.random() * reply_media.right_answer.length)] }]);
        messages.unshift(msg);
        msg = new builder.Message(session).text(reply.right_answer[Math.floor(Math.random() * reply.right_answer.length)]);
        messages.unshift(msg);
    }
    else {
        let msg = new builder.Message(session).attachments([{ "contentType": "image/gif", "contentUrl": reply_media.wrong_answer[Math.floor(Math.random() * reply_media.wrong_answer.length)] }]);
        messages.unshift(msg);
        msg = new builder.Message(session).text(reply.wrong_answer[Math.floor(Math.random() * reply.wrong_answer.length)]);
        messages.unshift(msg);
    }
    return messages;
    
}

/*cet_by_document("4d8dd634-2569-45d8-9cce-a4a83ae625ce", function (err, questions_backet) {
    if (err) {
        //session.replaceDialog("error_flow");
    }
    else {
        console.log('aaa');
    }
});*/

function cet_by_document(item_id, callback) {
    var client = restify.createJsonClient({
        url: 'http://documentservice.cet.ac.il',
        version: '*'
    });

    client.get('/api/DocumentVersions/' + item_id + '/he', function (err, request, response, obj) {
        if (err) {
            callback(err);
            return;
        }
        let documentVersions = JSON.parse(response.body);
        let minorVersion = documentVersions.MinorVersion;
        let majorVersion = documentVersions.MajorVersion;

        client.get('/api/DocumentRevisions/' + item_id + '/he/' + majorVersion + '/' + minorVersion, function (err, request, response, obj) {
            if (err) {
                callback(err);
                return;
            }
            let documentRevisions = JSON.parse(response.body);
            let questions_backet = parseDocumentRevisions(documentRevisions);
            //
            //console.log(questions_backet);
            callback(null, questions_backet);
        });
    });
}

function buildSnapFromCet(questions_backet) { 
    return snapshot;
}

function parseDocumentRevisions(documentRevisions) {
    let questions_backet = [];
    
    documentRevisions.documentModel.e_questionnaire.e_page.forEach(function(page) {
        let question = {};
        question.Data = { "Chapter": 99, "Next_Question": 99, "Question_Id": page.e_question[0].elementId};
        if (page.e_question[0].instructions) {
            question.Question = [ {"title": ""} ];
            //let arr_tags = striptags(page.e_question[0].instructions, ['img'], '$#$').split('$#$');
            let arr_tags = striptags(page.e_question[0].instructions, [], '$#$').split('$#$');
            for (let i=0; i < arr_tags.length; i++) {
                if (arr_tags[i]) {
                    question.Question[0].title = (question.Question[0].title || "") + arr_tags[i];
                }
            }
        }
        if (page.e_question[0].e_questionAssistants.assistant3) {
            question.Hint = [ {"title": ""} ];
            //let arr_tags = striptags(page.e_question[0].e_questionAssistants.assistant3, ['img'], '$#$').split('$#$');
            let arr_tags = striptags(page.e_question[0].e_questionAssistants.assistant3, [], '$#$').split('$#$');
            for (let i=0; i < arr_tags.length; i++) {
                if (arr_tags[i]) {
                    question.Hint[0].title = (question.Hint[0].title || "") + arr_tags[i];
                }
            }
        }
        if (page.e_question[0].e_questionAssistants.assistant2) {
            question.Explain_Sentence = [ {"title": ""} ];
            //let arr_tags = striptags(page.e_question[0].e_questionAssistants.assistant2, ['img'], '$#$').split('$#$');
            let arr_tags = striptags(page.e_question[0].e_questionAssistants.assistant2, [], '$#$').split('$#$');
            for (let i=0; i < arr_tags.length; i++) {
                if (arr_tags[i]) {
                    question.Explain_Sentence[0].title = (question.Explain_Sentence[0].title || "") + arr_tags[i];
                }
            }
        }
        if (page.e_staticContent && page.e_staticContent[0] && page.e_staticContent[0].htmlContent) {
            question.Open_Sentence = [ {"title": ""} ];
            //let arr_tags = striptags(page.e_staticContent[0].htmlContent, ['img'], '$#$').split('$#$');
            let arr_tags = striptags(page.e_staticContent[0].htmlContent, [], '$#$').split('$#$');
            for (let i=0; i < arr_tags.length; i++) {
                if (arr_tags[i]) {
                    question.Open_Sentence[0].title = (question.Open_Sentence[0].title || "") + arr_tags[i];
                }
            }
        }
        if (page.e_question[0].e_singleChoice.e_option.length) {
            question.choices = [];
            for (let i = 0; i < page.e_question[0].e_singleChoice.e_option.length; i++) {
                let choise = { "title": "", "isCorrect": "", "payload": "" };
                choise.title = page.e_question[0].e_singleChoice.e_option[i].labelHtml;
                choise.payload = choise.title;
                choise.isCorrect = page.e_question[0].e_singleChoice.e_option[i].correct;
                question.choices.push(choise);
            }
        }
        
        questions_backet.push(question);
    });
    return questions_backet;
}

function send_chapters(session) {
    let chapter = [];
    chapters.forEach(function (element, i) {
        chapter.push(getCard(session, element.title, '', '', element.pic, [{ "postback": "פרק " + (4), "title": "פרק " + (element.id) }]));
    });
    let msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(chapter);
    session.send(msg);
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

function endChapter(session, promptObj) {
    let messages = [];
    promptObj = promptObj || {};
    //
    let text_title = "";
    let text_next = "";
    if (session.userData.learn==="study") {
        text_title = "סיימנו את חלק הלימוד של פרק";
        text_next = "עכשיו אפשר לתרגל את הפרק או ללמוד פרק חדש?"
        promptObj.choice = "תרגול פרק" + " " + session.userData.chapter + "|" + "לימוד";
    } else {
        text_title = "סיימנו את חלק התרגול של פרק"
        promptObj.choice = "תרגול|לימוד";
    }
    let msg = new builder.Message(session).attachments([{ "contentType": "image/gif", "contentUrl": "https://firebasestorage.googleapis.com/v0/b/nacho-crumbs.appspot.com/o/chapters%2Fend_perek_pic.gif?alt=media&token=a8ad5da0-fc44-448e-900c-5fb19afba7bd" }]);
    messages.push(msg);
    msg = new builder.Message(session).text(text_title + " " + session.userData.chapter + " " + session.userData.chapter_name);
    messages.push(msg);
    
    if (text_next) {
        messages.push(new builder.Message(session).text(text_next));
    }
    promptObj.title = messages[messages.length - 1].data.text;
    promptObj.end_chapter = true;
    messages = messages.slice(0, messages.length-1);
    return messages;
}

function buildExplain(session) {
    let messages = [];
    //
    if (session.userData.current_question.Explain_Sentence_Before && session.userData.current_question.Explain_Sentence_Before.length) {
        for (let i=0; i<session.userData.current_question.Explain_Sentence_Before.length; i++) {
            if (session.userData.current_question.Explain_Sentence_Before[i].title!=="") {
                let msg = new builder.Message(session).text(session.userData.current_question.Explain_Sentence_Before[i].title);
                messages.push(msg);
            }
        }
    }
    if (session.userData.current_question.Explain_Sentence && session.userData.current_question.Explain_Sentence.length) {
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
    if (session.userData.current_question.Explain_Sentence_After && session.userData.current_question.Explain_Sentence_After.length) {
        for (let i=0; i<session.userData.current_question.Explain_Sentence_After.length; i++) {
            if (session.userData.current_question.Explain_Sentence_After[i].title!=="") {
                let msg = new builder.Message(session).text(session.userData.current_question.Explain_Sentence_After[i].title);
                messages.push(msg);
            }
        }
    }
    return messages;
}

function afterAnswer(session, promptObj) {
    let messages = buildExplain(session);
    promptObj = promptObj || {};
    //
    if (session.userData.learn==="study") {
        session.userData.questions_backet_history.push(session.userData.questions_backet[0]);
        session.userData.questions_backet = session.userData.questions_backet.slice(1, session.userData.questions_backet.length);
    } else if (session.userData.learn==="practice") {
        session.userData.questions_backet_history.push(session.userData.questions_backet[0]);
        session.userData.questions_backet = session.userData.questions_backet.slice(1, session.userData.questions_backet.length);
    }
    //
    if (session.userData.questions_backet[0]===undefined) { // after delete the current question, we look at the future question.
        promptObj.end_chapter = true;
    }
    else {
        promptObj.title = messages[messages.length - 1].data.text;  //messages[messages.length - 1].text;
        messages = messages.slice(0, messages.length-1);
        promptObj.choice = "המשך"
    }
    return messages;
}

function hint(session, promptObj) {
    let messages = [];
    promptObj = promptObj || {};
    session.userData.hint_try = (session.userData.hint_try + 1);

    if (session.userData.current_question.Hint.length) {
        for (let i=0; i<session.userData.current_question.Hint.length; i++) {
            let msg = new builder.Message(session).text(session.userData.current_question.Hint[i].title);
            messages.push(msg);
        }
    }
    
    let wrong_answer = session.message && session.message.text; // && session.message.sourceEvent.message && session.message.sourceEvent.message.text;
    let arr_choice = [];
    for (let i = 0; i < session.userData.current_question.choices.length; i++) {
        if ((session.userData.current_question.choices[i].title !== wrong_answer) || (session.userData.current_question.choices[i].payload !== wrong_answer))
            arr_choice.push(session.userData.current_question.choices[i].title);
    }

    promptObj.title = "אז מה התשובה תהיה?";
    promptObj.choice = arr_choice.join("|");
    
    return messages;
}

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

