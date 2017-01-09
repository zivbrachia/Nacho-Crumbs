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

bot.dialog('/', function (session) {
    session.sendTyping();
    var pageAddress = facebook.getUserProfile(session.message.address.user.id);
    console.log("pageAddress:" + pageAddress);
    var refUser = db.updateUserAddress(session.message.address.channelId, session.message.address.user.id, session.message.address);
    console.log("text:" + session.message.text);
    apiai.textRequest(session.message.text, session);
    //apiai.eventRequest(INVOKE_EVENT, session);
});
//
let userSays = 'שאלה2';
let questionOutput = 'אורך גן שמקודד לחלבון שאורכו  30 חומצות אמיניות הוא לפחות:';
let qId = 2
let question = apiai.createIntentQuestion('Question_' + qId, 'Question_' + qId, 'QUESTION_' + qId, 'input.question_' + qId, questionOutput, userSays);
let answerUserSays = '90 זוגות בסיסים';
let answerOutput = 'תשובה נכונה';
let answer = apiai.createIntentAnswer('Question_'+qId+'_Answer', 3, answerUserSays, 'Question_'+qId,'input.question_'+qId+'.answer', 'Question_'+qId, answerOutput);
let answerUserSays1 = '10 זוגות בסיסים';
let answerUserSays2 = '30 זוגות בסיסים';
let answerUserSays3 = '100 זוגות בסיסים';
let wrong = apiai.createIntentWrong('Question_'+qId+'_Wrong', 1, answerUserSays1, 2, answerUserSays2, 4, answerUserSays3, 'Question_'+qId,'input.question_'+qId+'.wrong', 'Question_'+qId, 'טעות');
answerOutput = "רמז לשאלה " + qId
let clue = apiai.createIntentClue('Question_'+qId+'_Clue', 'Question_' + qId, 'Question_' + qId, 'input.question_1.clue', answerOutput);
answerOutput = 'דלג לשאלה הבאה';
let skip = apiai.createIntentSkip('Question_'+qId+'_Skip', 'Question_' + qId, 'Question_' + qId, 'input.question_1.skip', answerOutput);

let options = {};
let client = apiai.createNewIntent(options);
let arr = [];
arr.push(question);
arr.push(answer);
arr.push(wrong);
arr.push(clue);
arr.push(skip);
client.post(options, arr, function(err, req, res, obj) {
    console.log(JSON.parse(res.body));
});
//client.post(options, answer, function(err, req, res, obj) {
//    console.log(JSON.parse(res.body));
//});
/*
var question = require( "./apiai_template/intents/Question_X.json" )
console.log(question.responses[0].messages[0].speech);

question.name = intentName;
question.responses[0].affectedContexts[0].name = outputContext;
question.events[0].name = eventName;
question.responses[0].action = actionName;
question.responses[0].messages[0].speech = questionOutput;


*/
console.log(question.events[0].name);

/*
var options = {};
var client = apiai.getInents(options);
client.get(options, function(err, req, res) {
        console.log('get ' + JSON.parse(res.body));
});
*/
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

//apiai.eventRequest('INVOKE_EVENT', '112121212' /*session.id*/);

/*
Piece of information:
    sessionStatus.status = "info";
    sessionStatus.intentId = infoId;
    sessionStatus.startTime = 00:00:00;
    sessionStatus.endTime = 00:00:00;
    
Question:
    sessionStatus.status = "question";
    sessionStatus.intentId = questionId;
    sessionStatus.startTime = 00:00:00;
    sessionStatus.endTime = 00:00:00;
    sessionStatus.clue[i] = intentId;
    sessionStatus.answer[i] = intentId;
    sessionStatus.skip = intentId;
*/