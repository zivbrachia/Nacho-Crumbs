var apiai = require('apiai');
var emum = require('enum');

module.exports = {textRequest, eventRequest, getIntents, getIntentById, createNewIntent, 
                  updateIntentById, deleteIntentById, buildMessages,
                  createIntentQuestion, createIntentAnswer, createIntentWrong, createIntentClue, createIntentSkip};

var app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

var responseType = new emum({'TEXT': 0, 'CARD': 1, 'QUICK_REPLIES': 2, 'IMAGE': 3, 'CUSTOM_PAYLOAD': 4});

function createScopeQuestion(qId, questionText, userSaysTriggers, rightAnswer, wrongAnswers) {
    // Scope = Question, Right Answer, Wrong Answers, Hint, Skip
    let question = apiai.createIntentQuestion('Question_'+qId, 'Question_'+qId, 'QUESTION_'+qId, 'input.question_'+qId, questionText, userSaysTrigger);
    let answer = apiai.createIntentAnswer('Question_'+qId+'_Answer', 1, answerUserSays, 'Question_'+qId,'input.question_'+qId+'.answer', 'Question_'+qId, rightAnswer);
    let wrong = apiai.createIntentWrong('Question_'+qId+'_Wrong', 1, wrongAnswers[0], 2, wrongAnswers[1], 4, wrongAnswers[2], 'Question_'+qId,'input.question_'+qId+'.wrong', 'Question_'+qId, 'טעות');

}
function createIntentQuestion(intentName, outputContext, eventName, actionName, questionOutput, usersSays) {
    let question = require("./apiai_template/intents/Question_X.json");
    //
    question.name = intentName;
    question.responses[0].affectedContexts[0].name = outputContext;
    question.userSays[0].data[0].text = usersSays;
    question.events[0].name = eventName;
    question.responses[0].action = actionName;
    question.responses[0].messages[0].speech = questionOutput;
    //
    return question;
}

function createIntentAnswer(intentName, answerNumber, answerText, inputContext, actionName, outputContext, answerOutput) {
    let answer = require("./apiai_template/intents/Question_X_Answer.json");
    //
    answer.name = intentName;
    answer.responses[0].affectedContexts[0].name = outputContext;
    answer.userSays[0].data[0].text = answerNumber;
    answer.userSays[1].data[0].text = answerText;
    answer.responses[0].action = actionName;
    answer.contexts[0] = inputContext;
    answer.responses[0].messages[0].speech = answerOutput;
    //
    return answer;
}

function createIntentWrong(intentName, answerNumber1, answerText1, 
                            answerNumber2, answerText2, answerNumber3, answerText3,
                            inputContext, actionName, outputContext, answerOutput) {
    let wrong = require("./apiai_template/intents/Question_X_Wrong.json");
    //
    wrong.name = intentName;
    wrong.responses[0].affectedContexts[0].name = outputContext;
    wrong.userSays[0].data[0].text = answerNumber1;
    wrong.userSays[1].data[0].text = answerNumber2;
    wrong.userSays[2].data[0].text = answerNumber3;
    wrong.userSays[3].data[0].text = answerText1;
    wrong.userSays[4].data[0].text = answerText2;
    wrong.userSays[5].data[0].text = answerText3;
    wrong.responses[0].action = actionName;
    wrong.contexts[0] = inputContext;
    wrong.responses[0].messages[0].speech = answerOutput;
    //
    return wrong;
}

function createIntentClue(intentName, inputContext, outputContext, actionName, answerOutput) {
    let clue = require("./apiai_template/intents/Question_X_Clue.json");
    //
    clue.name = intentName;
    clue.responses[0].affectedContexts[0].name = outputContext;
    clue.responses[0].action = actionName;
    clue.contexts[0] = inputContext;
    clue.responses[0].messages[0].speech = answerOutput;
    //
    return clue;
}

function createIntentSkip(intentName, inputContext, outputContext, actionName, answerOutput) { 
   let skip = require("./apiai_template/intents/Question_X_Skip.json");
    //
    skip.name = intentName;
    skip.responses[0].affectedContexts[0].name = outputContext;
    skip.responses[0].action = actionName;
    skip.contexts[0] = inputContext;
    skip.responses[0].messages[0].speech = answerOutput;
    //
    return skip; 
}
function deleteIntentById(id, options) {
    // DELETE
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    return client;
}

function updateIntentById(id, options) {
    // PUT
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;
    options.headers['Content-Type'] = 'application/json; charset=utf-8';

    return client;
}

function createNewIntent(options) {
    // POST
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/'
    });

    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;
    options.headers['content-type'] = 'application/json; charset=utf-8';

    return client;
}

function getIntentById(id, options) {
    // GET
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    return client;
}

function getIntents(options) {
    // GET
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents'
    });

    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    return client;
}

function eventRequest(eventName, session) {
    var event = {
        name : eventName,
        data: {
            name: 'ziv'
        }
    }
    var options = {
        sessionId: session.message.address.user.id
    };
    var request = app.eventRequest(event, options); 

    request.on('response', function(response) {
        console.log(JSON.stringify(response));
        //
        myEmitter.emit('apiai_response', session, response);
        //
        //messages = buildMessages(response.result.fulfillment.messages);
        //console.log(messages);

    });

    request.on('error', function(error) {
        console.log(error);
    });

    request.end();
}

function textRequest(text, session) {
    var request = app.textRequest(text, {
        sessionId: session.message.address.user.id
    });

    request.on('response', function(response) {
        console.log(JSON.stringify(response));
        //
        myEmitter.emit('apiai_response', session, response);
        //
        //messages = buildMessages(response.result.fulfillment.messages);
        //var len = messages.length;
        //for (var i=0; i<len; i++) {
        //    var message = messages[i];
        //    session.send(message);
        //}
    });

    request.on('error', function(error) {
        console.log(JSON.stringify(error));
    });

    request.end();
}

function buildMessageText(messageResult, session, message) {
    var msg = new builder.Message(session).text(message.speech);
    return msg;
}

function buildMessageQuickReplies(messageResult, session, message) {
    let quick_replies = [];
    let len = message.replies.length;
    for(let j=0; j<len; j++) {
        let quick_reply = {};
        //
        quick_reply.content_type = "text";
        quick_reply.title = message.replies[j];
        quick_reply.payload = "SOMETHING_SOMETHING"
        //
        quick_replies.push(quick_reply);
    }
    let msg = new builder.Message(session).sourceEvent({
        "facebook": {
            "text": message.title,
            "quick_reply": quick_replies
        }
    });
    return msg;
}

function buildMessegeCard(messagesResult, session, message) {
    var msg = new builder.Message(session).attachments([
        new builder.HeroCard(session)
            .title('title')
            .subtitle('subtitle')
            .text('text')
            .images([
                builder.CardImage.create(session, imageUrl)
            ])
            .buttons([
                builder.CardAction.dialogAction(session, "info", "showInfo", "המשך לפיסת מידע"),
                builder.CardAction.dialogAction(session, "info", "repeatQuestion", "חזור על השאלה"),
                builder.CardAction.dialogAction(session, "info", "goToNextQuestion", "המשך לשאלה הבאה") 
            ])
    ]);
    return msg;
}

function buildMessageCustomPayload(messagesResult, session , message) {
    var msg = new builder.Message(session).sourceEvent(message.payload);
    return msg;
}

function buildMessages(messages) { // messages is an array: response.result.fulfillment.messages
    let messagesResult = [];
    var len = messages.length;
    for (let i=0; i<len; i++) {
        var message = messages[i];
        switch(message.type) {
            case responseType.TEXT.value: // Text response
                var msg = buildMessageText(messagesResult, session, message);
                messagesResult.push(msg);
                break;
            case responseType.CARD.value: // Card
                var msg = buildMessegeCard(messagesResult, session, message);
                messagesResult.push(msg);
                break;
            case responseType.QUICK_REPLIES.value: // Quick replies
                var msg = buildMessageQuickReplies(messagesResult, session, message);
                messagesResult.push(msg);
                break;
            case responseType.IMAGE.value: // Image
                break;
            case responseType.CUSTOM_PAYLOAD.value: // Custom Payload
                var msg = buildMessageCustomPayload(messagesResult, session, message);
                messagesResult.push(msg);
                break;
        }            
    }
    return messagesResult;
}