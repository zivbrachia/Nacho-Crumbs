'use strict';

let apiai = require('apiai');
let db = require('../lib/database.js');
let controller = require('../lib/controller.js');
let util = require('../lib/util.js');
let facebook = require('../lib/facebook.js');
let telegram = require('../lib/telegram.js');
let EventEmitter = require('events').EventEmitter;

let app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

const apiaiEventEmitter = new EventEmitter();

module.exports = {app, getAllIntents, createQuestionSession, createInfoIntent, 
                    createInfoIntentPromise, createIntentQuestionAskPromise, createIntentFollowUpPromise, eventRequest, getResponseForInput,
                    buildMessages, getIntentById, getAllIntentsPromise, syncFromApiaiToDb, updateNames,
                    getMessageTypeText, getMessageTypeQuickReplies, buildArrReplies};

apiaiEventEmitter.on('apiai_response', function (connObj, response, userData, source) {
        setImmediate(function() {
            let promises = []
            controller.chatFlow1(connObj, response, userData, source, promises);
            //let builder = require('../lib/botbuilder.js');
            //let msg2 = getMessageTypeText(connObj.message.address, 'adsfadf', builder);
            //let messages = [];
            //messages.push(msg2.data);

            //if (promises) {
            //    Promise.all(promises);
            //    console.log(promises);
                /*Promise.all(promises).then(function (messagesPromise) {
                    messagesPromise.forEach(function(element) {
                        element.forEach(function(message) {
                            messages[response.result.fulfillment.messages.length-1] = message;
                        });
                    });
                });
                */
            //}
        });
});

apiaiEventEmitter.on('eventRequest', function (eventName, address, timeout, userData) {
    console.error('setTimeout ' + eventName + ' : '+ (timeout || process.env.TIMEOUT_QUESTION_MS) + ", SCORE: " + (userData.score || 0));
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
                try {
                    let address = JSON.parse(response.result.parameters.address);
                    let userData = JSON.parse(response.result.parameters.userData);
                    apiaiEventEmitter.emit('apiai_response', address, response, userData || {}, "eventRequest");
                } catch (err) {
                    console.log("error 100: " + err);
                }
            });
        });

        eventRequest.on('error', function(error) {
            console.log('error: ' + error);
        });
    
        eventRequest.end();
    }, timeout || process.env.TIMEOUT_QUESTION_MS, eventName, address);
});

function eventRequest(eventName, address, timeout, userData) {
    apiaiEventEmitter.emit('eventRequest', eventName, address, timeout, userData || {});
}

function createQuestionSession(Category, SubCategory, questionText, rightAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, hintText, explainText) {
}

function getAllIntents() {
    let client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents'
    });
    let options = {};
    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    client.get(options,function(err, req, res) {
        syncFromApiaiToDb(JSON.parse(res.body));
        updateNames();
    });
}

function getAllIntentsPromise() {
    let client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents'
    });
    let options = {};
    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    let intents = new Promise( function (resolve, reject) {
        client.get(options,function(err, req, res) {
            //syncFromApiaiToDb(JSON.parse(res.body));
            //updateNames()
            if (err) {
                reject(err);
            }
            else if (res) {
                let jsonObj = JSON.parse(res.body);
                if (jsonObj.status!==undefined) {
                    reject (jsonObj.status.code + ' ' + jsonObj.status.errorDetails);
                }
                resolve(jsonObj);
            }
        });
    });
    return intents;
}

function getIntentById(intentId, timeout) {
    let client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + intentId + '?v=20150910'
    });
    let options = {};
    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;

    let intent = new Promise( function (resolve, reject) {
        setTimeout(function () {
            client.get(options,function(err, req, res) {
                if (err) {
                    reject(err);
                }
                else if (res) {
                    let jsonObj = JSON.parse(res.body);
                    if (jsonObj.status!==undefined) {
                        reject (jsonObj.status.code + ' ' + jsonObj.status.errorDetails);
                    }
                    resolve(jsonObj);
                }
            });
        }, timeout || 0);
    });

    return intent;
}

function syncFromApiaiToDb(intents) {
    let metaData = {};
    //try {
        let len = intents.length;
        for (let i=0; i<(len); i++) {
            let intent = intents[i];
            util.buildToxonomy(intent, metaData);
        }
    //} catch (err) {}
    let refCategory = db.updateCategory(metaData);
}

function updateNames() {
    let queryD = db.queryDictionary();
    queryD.then(
    function (queryDictionary) {
        queryDictionary.forEach(function(category, i) {
            db.updateCategoryName(category.name.toLowerCase(), {"name" : category.heb});
            //
            category.sub_category.forEach(function(subCategory, j) {
                db.updateSubCategoryName(category.name.toLowerCase(), subCategory.name.toLowerCase(), {"name" : subCategory.heb});
            });
        }
    ).catch(
        function (err) {
            console.log(err);
        }
    )});
}

function createIntentInfo(infoNumber, infoData) {
    let info = require("../apiai_template/intents/Information_X.js").infoTemplate(
        infoNumber, 
        infoData.Category, 
        infoData.SubCategory, 
        infoData.info_short, 
        infoData.title, 
        infoData.sub_title, 
        infoData.heading, 
        infoData.lead, 
        infoData.url);
    //
    return info;
}

function getHeaders() {
    let headers = {};

    headers.Authorization = process.env.APIAI_AUTHORIZATION;
    headers['content-type'] = 'application/json; charset=utf-8';

    return headers;
}

function getOptions(headers) {
    let options = {};

    if (headers===true) {
        options.headers = getHeaders();
    }

    return options;
}

function requestInfoOk(response, infoNumber, req_params) {      // code 200
    db.updateInfoNumber((infoNumber + 1));
    db.updateInformation(
        req_params.Category.toLowerCase(), 
        req_params.SubCategory.toLowerCase(), 
        response.id,
        {
            "name" : "Information_" + infoNumber,
            "expand" : {
                "heading" : req_params.heading,
                "image" : req_params.url,
                "lead" : req_params.lead,
                "subtitle" : req_params.sub_title,
                "title" : req_params.title
            }
        });
}

function buildArrReplies(req_params) {
    let arr = [req_params.right_answer, req_params.wrong_answer_1, req_params.wrong_answer_2, req_params.wrong_answer_3];
    let index;
    let newArr = [];
    let len = arr.length;
    for (let i=0; i<(len); i++) {
        index = Math.floor(Math.random() * arr.length);
        newArr.push(arr[index]);
        arr.splice(index, 1);
    }
    return newArr;
}

function createIntentQuestionAsk(questionNumber, req_params, arrReplies) { //Category, SubCategory, questionText, rightAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3) {
    //let arr = [req_params.right_answer, req_params.wrong_answer_1, req_params.wrong_answer_2, req_params.wrong_answer_3];
    //let newArr = buildArrReplies(req_params);
    //let index;
    //let len = arr.length;
    //for (let i=0; i<(len); i++) {
    //    index = Math.floor(Math.random() * arr.length);
    //    newArr.push(arr[index]);
    //    arr.splice(index, 1);
    //}
    //    
    //let question = require('../apiai_template/intents/Question_Ask_X.js').questionTemplate(questionNumber, req_params.category, req_params.sub_category, req_params.question, newArr[0], newArr[1], newArr[2], newArr[3]);
    let question = require('../apiai_template/intents/New_Question_Ask_X.js').questionTemplate(questionNumber, req_params.category, req_params.sub_category, req_params.question, arrReplies);
    return question;
}

function createIntentQuestionAskPromise(questionNumber, req_params, arrReplies) {
    let questionAsk = new Promise(function (resolve, reject) {
        let client = require('restify').createJsonClient({
            url: 'https://api.api.ai/v1/intents/'
        });
        let options = getOptions(true);
        
        let questionIntent = createIntentQuestionAsk(questionNumber, req_params, arrReplies);

        client.post(options, questionIntent, function(err, req, res, obj) {
            let response = JSON.parse(res.body);
            if (response.status.code===200) {
                db.updateQuestion(req_params.category.toLowerCase(),
                                    req_params.sub_category.toLowerCase(),
                                    response.id,
                                    {
                                        "events" : [
                                            {
                                                "name" : "Question_Ask_" + questionNumber
                                            }
                                        ],
                                        "level" : 1,
                                        "name" : "Question_Ask_" + questionNumber
                                    });
                resolve(response.id);
            }
            else {
                reject('error ' + response.status.code + ': ' + response.status.errorDetails);
            }
        });
    });
    return questionAsk;
}

function createIntentFollowUpPromise(questionNumber, req_params, parentId, rootParentId, arrReplies) { 
    let followUp = new Promise(function (resolve, reject) {
        let client = require('restify').createJsonClient({
            url: 'https://api.api.ai/v1/intents/'
        });
        let options = getOptions(true);

        let intentArray = createFollowUpIntents(questionNumber, req_params, parentId, rootParentId, arrReplies);

        client.post(options, intentArray, function(err, req, res, obj) {
            let status = JSON.parse(res.body).status;
            if (status.code===200) {
                db.updateQuestionNumber(questionNumber);
                resolve(true);
            }
            else {
                reject('error ' + response.status.code + ': ' + response.status.errorDetails);
            }
        });
    });
    return followUp;
}

function createFollowUpIntents(questionNumber, req_params, parentId, rootParentId, arrReplies) {
    let intentArray = [];
    let rightAnswerIntent = createIntentRightAnswer(questionNumber, req_params.right_answer, parentId, rootParentId, req_params.show_answer);
    let wrongAnswerIntent = createIntentWrongAnswer(questionNumber, req_params.wrong_answer_1, req_params.wrong_answer_2, req_params.wrong_answer_3, parentId, rootParentId, req_params.show_answer);
    let hintIntent = createIntentHint(questionNumber, req_params.hint, parentId, rootParentId, arrReplies);
    let fallbackIntent = createIntentFallback(questionNumber, parentId, rootParentId, req_params.hint, arrReplies);
    //let explainIntent = createIntentExplain(questionNumber, req_params.show_answer, req_params.right_answer);
    //let hintAskIntent = createIntentHintAsk(questionNumber, req_params.hint);
    //let skipIntent = createIntentSkip(questionNumber);

    intentArray.push(rightAnswerIntent);
    intentArray.push(wrongAnswerIntent);
    intentArray.push(hintIntent);
    intentArray.push(fallbackIntent);
    //intentArray.push(explainIntent);
    //intentArray.push(hintAskIntent);
    //intentArray.push(skipIntent);

    return intentArray;
}

function createIntentFallback(QuestionNumber, parentId, rootParentId, speech, arrReplies) {
    let fallback = require("../apiai_template/intents/New_Question_Ask_X-fallback.js").fallbackTemplate(QuestionNumber, parentId, rootParentId, speech, arrReplies);
    //
    return fallback;
}
function createIntentSkip(QuestionNumber) {
    let skip = require("../apiai_template/intents/Question_Skip_X.js").skipTemplate(QuestionNumber);
    //
    return skip;
}
function createIntentHintAsk(QuestionNumber, hintText) {
    let hintAsk = require("../apiai_template/intents/Question_HintAsk_X.js").hintAskTemplate(QuestionNumber, hintText);
    //
    return hintAsk;
}

function createIntentExplain(QuestionNumber, explainText, rightAnswer) {
    let explain = require("../apiai_template/intents/Question_Explain_X.js").explainTemplate(QuestionNumber, explainText, rightAnswer);
    //
    return explain;
}

function createIntentHint(QuestionNumber, hintText, parentId, rootParentId, arrReplies) {
    //let hint = require("../apiai_template/intents/Question_Hint_X.js").hintTemplate(QuestionNumber, hintText);
    let hint = require("../apiai_template/intents/New_Question_Ask_X-hint.js").hintTemplate(QuestionNumber, parentId, rootParentId, hintText, arrReplies);
    //
    return hint;
}
function createIntentWrongAnswer(QuestionNumber, wrongAnswer1, wrongAnswer2, wrongAnswer3, parentId, rootParentId, explain) { 
    //let wrongAnswer = require("../apiai_template/intents/Question_Wrong_X.js").wrongTemplate(QuestionNumber, wrongAnswer1, wrongAnswer2, wrongAnswer3);
    let wrongAnswer = require("../apiai_template/intents/New_Quesiton_Ask_X-no.js").wrongTemplate(QuestionNumber, parentId, rootParentId, wrongAnswer1, wrongAnswer2, wrongAnswer3, explain);

    return wrongAnswer;
}

function createIntentRightAnswer(QuestionNumber, rightAnswer, parentId, rootParentId, explain) { 
    //let rightAnswerIntent = require('../apiai_template/intents/Question_Answer_X.js').answerTemplate(QuestionNumber, rightAnswer);
    let rightAnswerIntent = require('../apiai_template/intents/New_Question_Ask_X-yes.js').answerTemplate(QuestionNumber, rightAnswer, parentId, rootParentId, explain);

    return rightAnswerIntent;
}

function createInfoIntentPromise(infoNumber, req_params) {
    let query = new Promise(function (resolve, reject) {
        let client = require('restify').createJsonClient({
            url: 'https://api.api.ai/v1/intents/'
        });
        let options = getOptions(true);

        let intentArray = [];
        let infoIntent = createIntentInfo(infoNumber, req_params);

        intentArray.push(infoIntent);
        
        client.post(options, intentArray, function(err, req, res, obj) {
        let response = JSON.parse(res.body);
            if (response.status.code===200) {
                requestInfoOk(response, infoNumber, req_params);
                resolve(true);
            }
            else {
                reject('error ' + response.status.code + ': ' + response.status.errorDetails);
            }
        });    
    });
    return query;
}

function createInfoIntent(infoNumber, req_params) {
    let client = require('restify').createJsonClient({
            url: 'https://api.api.ai/v1/intents/'
    });
    
    let options = {};
    options.headers = {};
    options.headers.Authorization = process.env.APIAI_AUTHORIZATION;
    options.headers['content-type'] = 'application/json; charset=utf-8';

    let intentArray = [];
    let infoIntent = createIntentInfo(infoNumber, req_params);

    intentArray.push(infoIntent);

    client.post(options, intentArray, function(err, req, res, obj) {
        let response = JSON.parse(res.body);
            if (response.status.code===200) {
                db.updateInfoNumber((infoNumber + 1));
                
                ref.child('information').child(Category.toLowerCase()).child(SubCategory.toLowerCase()).child(response.id).update(
                    {
                        "name" : "Information_" + InfoNumber,
                        "expand" : {
                            "heading" : heading,
                            "image" : url,
                            "lead" : lead,
                            "subtitle" : sub_title,
                            "title" : title
                        }
                    });
            }
            else {
                //res.end(res.body);
            }
    });
}

function getResponseForInput(session) {
    if (!session.userData.address) {
        session.message.text = 'hello';
    }
    let textRequest = app.textRequest(session.message.text, { sessionId: session.message.address.user.id });

    textRequest.on('response', function(response) {
        setImmediate(function() {
            session.userData.lastSendTime = session.lastSendTime;   // the request has made and we can update the send time
            let userData = session.userData;
            if (response.result.parameters.userData) {
                userData = JSON.parse(response.result.parameters.userData);
            }
            apiaiEventEmitter.emit('apiai_response', session, response, userData || {}, "textRequest");    
        });
    });

    textRequest.on('error', function(error) {
        console.log("error: " + JSON.stringify(error));
    });

    return textRequest;
}

function getMessage(address, message, builder, textData) {
    let msg = {};
    switch (message.type) {
        case 0:
            textData = getMsgTextData(message.speech || '');
            msg.textData = textData;
            if (textData.changed===true) {
                break;
            } 
            if (textData['text']==='') {
                break;
            } else {
                msg.msg = getMessageTypeText(address, textData['text'], builder)
            }
            break;
        case 1:
            msg.msg = getMessageTypeCard(address, builder, message);
            break;
        case 2:
            if (getMsgTextData(message.title).changed===true) {
                message.title = textData['text'];
            }
            msg.msg = getMessageTypeQuickReplies(address, message.title, message.replies, builder);
            break;
        case 3:
            msg.msg = getMessageTypeImage(address, message.imageUrl, builder);
            break;
        case 4:
            msg.msg = getMessageTypeCustomPayload(address, message.payload, builder);
            break;
    }
    return msg;
}

function getMessageTypeText(address, text, builder) {
    let msg = {};
    if (address.channelId==='facebook') {
        let textForFacebook = text.replace(/\n/g, '\n\r');
        msg = builder.getMessageText(address, textForFacebook, builder);
    } else if (address.channelId==='telegram') {
        let telegramObj = {
            telegram:{
                method: 'sendMessage',
                parameters: {
                    text: text,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        hide_keyboard: true
                    }
                }
            }
        }
        msg = getMessageTypeCustomPayload(address, telegramObj, builder);
    } else if (address.channelId==='webchat') {
        msg = builder.getMessageText(address, text, builder);
    }
    else if (address.channelId==='directline') {
        let textForFacebook = text.replace(/\n/g, '\n\r');
        msg = builder.getMessageText(address, textForFacebook, builder);
    }
    return msg;
}

function getMessageTypeCard(address, builder, message) {
    let msg = {};
    let payload = {};
    if (address.channelId==='facebook') {
        payload.facebook = facebook.cardJson(message);
        msg = getMessageTypeCustomPayload(address, payload, builder);
    }
    else if (address.channelId==='telegram') {
        payload.telegram = facebook.cardJson(message);  //telegram.cardJson('1111', 'מידע');
        msg = getMessageTypeCustomPayload(address, payload, builder);
    }
    return msg;
}

function getMessageTypeQuickReplies(address, title, replies, builder) {
    /*let msg = {};
    if (address.channelId==='facebook') {
        let facebookObj = facebook.setMessageTypeQuickReplies(title, replies);
        msg = getMessageTypeCustomPayload(address, facebookObj, builder);
    } else if (address.channelId==='telegram') {
        let telegramObj = telegram.setMessageTypeQuickReplies(title, replies);
        msg = getMessageTypeCustomPayload(address, telegramObj, builder);
    } else if (address.channelId==='webchat') {
        msg = getMessageTypeText(address, title, builder);
    }*/
    let msg = builder.getMessageTypeQuickReplies(address, title, replies)
    return msg;
}

function getMessageTypeImage(address, imageUrl, builder) {
    let msg = builder.getMessageImage(address, imageUrl);
    return msg;
}

function getMessageTypeCustomPayload(address, payload, builder) {
    let msg = builder.getMessageSourceEvent(address, payload);
    return msg;
}

function buildMessages(response, address, source) {
    let len = response.result.fulfillment.messages.length;
    let textResponseToQuickReplies = '';
    let messages = [];
    let msg = {};
    let cardFlag = false;
    let builder = require('../lib/botbuilder.js');
    let textData = {};
    //textData.messages = response.result.fulfillment.messages;   // for cards;

    for (let i=0; i<(len); i++) {
        let apiaiMessage = response.result.fulfillment.messages[i];
        msg = getMessage(address, apiaiMessage, builder, textData);
        textData = msg.textData;
        //if ((msg.msg!==undefined) && (msg.msg.constructor.name==="Message")) {
        if (msg.msg!==undefined) {
            messages.push(msg.msg.toMessage());
        }
    }
    return messages;
}

function getMsgTextData(text) {
    let textData = {};
    textData.text = text;
    textData.changed = false;
    let textNoMerge = getTextNoMergeSign(text);
    if (textNoMerge!==text) {
        textData.text = textNoMerge;
        textData.changed = true;
    }
    return textData;
}

function getTextNoMergeSign(text) {
    return text.replace(getMergeSign(), '');
}

function getMergeSign() {
    return '[>>]';
}