'use strict';

//let apiai = require('../lib/apiai.js');

module.exports = {chatFlow1};

function isSession(connObj) {
    if (connObj.constructor.name==='Session') {
        return true;
    }
    return false;
}

function isQuestion(intentAction) {
    if (intentAction.indexOf('input')>=0) {
        if (intentAction==='input.question') {
            return true;
        }
        return false;
    }
    else {
        if (intentAction.indexOf('question')>=0) {
            return true;
        }
        return false;
    }
}

function isNext(intentAction) {
    if (intentAction==='input.next') {
        return true;
    }
    return false;
}

function isFollowUpWrong(intentAction) {
    if (intentAction.indexOf('input')>=0) {
        if (intentAction==='input.wrong') {
            return true;
        }
        return false;
    }
    else {
        if (intentAction.indexOf('no')>=0) {
            return true;
        }
        return false;
    }
}

function isFollowUpRight(intentAction) {
    if (intentAction.indexOf('input')>=0) {
        if (intentAction==='input.right') {
            return true;
        }
        return false;
    }
    else {
        if (intentAction.indexOf('yes')>=0) {
            return true;
        }
        return false;
    }
}

function isFallback(intentAction) {
    if (intentAction.indexOf('fallback')>=0) {
            return true;
        }
        return false;
}

function isWelcomeSecondTime(intentAction) {
    if (intentAction==='input.welcome_2') {
        return true;
    }
    return false;
}

function isWelcome(intentAction) {
    if (intentAction==='input.welcome') {
        return true;
    }
    return false;
}

function isBreak(intentAction) {
    if (intentAction==='input.break_setting') {
        return true;
    }
    return false;
}

function isReturnToQuestion(intentAction) {
    if (intentAction==='input.return_question') {
        return true;
    }
    return false;
}

function isHintReply(intentAction) {
    if (intentAction.indexOf('input')>=0) {
        if (intentAction==='input.hint_reply') {
            return true;
        }
        return false;
    }
    else {
        if (intentAction.indexOf('hint')>=0) {
            return true;
        }
        return false;
    }
}

function isSubCategory(intentAction) {
    if (intentAction==='input.sub_category') {
        return true;
    }
    return false;
}

function isInfoExpand(intentAction) {
    if (intentAction==='input.info_expand') {
        return true;
    }
    return false;
}

function isOutputInfo(intentAction) {
    if (intentAction==='output.information') {
        return true;
    }
    return false;
}

function getAddress(connObj, intentAction, userData, metadata) {
    let address = connObj;
    if (isSession(connObj)) {
        address = connObj.message.address;
        if (isQuestion(intentAction)) {
            userData.question = userData.question || {};
            userData.question.intentId = metadata.intentId;
            userData.question.intentName = metadata.intentName;
        }
    }
    return address;
}

function updateScore(userData) {
    userData.score = Math.floor((userData.score || 0) + (100 / userData.study_session.stat.total_questions));
}

function getHint(gender) {
    let hint = null;
    if (gender==='male') {
        hint = require('../apiai_template/intents/Hint_Reply_Male.js').hintReply();
    }
    else {
        hint = require('../apiai_template/intents/Hint_Reply_Female.js').hintReply();
    }
    return hint;
}

function getAnswer(gender, intentAction) {
    if (gender==='male') {
        let answerMale = require('../apiai_template/intents/Answer_Reply_Male.js');
        if (isFollowUpRight(intentAction)) {
            return answerMale.rightAnswer();
        } else {
            return answerMale.wrongAnswer();
        }
    } else if (gender==='female') {
        let answerFemale = require('../apiai_template/intents/Answer_Reply_Female.js');
        if (isFollowUpRight(intentAction)) {
            return answerFemale.rightAnswer();
        } else {
            return answerFemale.wrongAnswer();
        }
    }

}

function chatFlow1(connObj, response, userData, source) {
    if (response.result.parameters.userData) {
        userData = JSON.parse(response.result.parameters.userData);
    }
    let address = getAddress(connObj, response.result.action, userData, response.result.metadata);
      
    /*if (isSubCategory(response.result.action)) {
        if (response.result.parameters.subcategory!=='') {  // default category
            userData.category = 'dna';
            userData.sub_category = response.result.parameters.subcategory;
        } else {
            let len = null;
            let total_questions = null;
            try {
                len = Object.keys(userData.study_session.questions).length;
                total_questions = userData.study_session.stat.total_questions;
            } catch (err) {
                len = 0;
                total_questions = false;
            }
            if ((len !== 0) && (!!total_questions)) {
                response.result.fulfillment.messages[0].title = 'התחלתי ולכן אסיים. ' +  'נשארו עוד ' + Object.keys(userData.study_session.questions).length + ' שאלות. ' + 'נסיים ואז תבחר נושא חדש.';
                response.result.fulfillment.messages[0].type = 2
                response.result.fulfillment.messages[0].replies = [];
                response.result.fulfillment.messages[0].replies.push('לחזור לשאלה');
                response.result.fulfillment.messages[0].replies.push('המשך');
            } else {
                response.result.fulfillment.messages[0].title = response.result.fulfillment.messages[0].speech;
                response.result.fulfillment.messages[0].type = 2
                response.result.fulfillment.messages[0].replies = [];
                let objKeys = Object.keys(questions['sub_category']);
                response.result.fulfillment.messages[0].replies.push('הכל');
                objKeys.forEach(function(subCategory) {
                    response.result.fulfillment.messages[0].replies.push(questions['sub_category'][subCategory].name);
                });
            }
        }
    }*/
    
    /*if (isInfoExpand(response.result.action)) {
        if (isOutputInfo(userData.intent.action)) {
            let subCategoryL = Object.keys(information);
            subCategoryL.forEach(function(subCategory) {
                let infoL = Object.keys(information[subCategory]);
                infoL.forEach(function(info) {
                    if (info===userData.intent.id) {
                        response.result.fulfillment.messages[0].buttons[0].postback = response.result.fulfillment.messages[0].buttons[0].postback + address.channelId + '/' + address.user.id + '/' + userData.intent.id;
                        response.result.fulfillment.messages[0].imageUrl = information[subCategory][info]['expand']['image'] || 'https://firebasestorage.googleapis.com/v0/b/nacho-crumbs.appspot.com/o/photos%2Fnacho1024.png?alt=media&token=40ea8306-8bf6-4810-b2b0-f45678438746';
                        response.result.fulfillment.messages[0].subtitle = information[subCategory][info]['expand']['subtitle'] || 'Nacho';
                        response.result.fulfillment.messages[0].title = information[subCategory][info]['expand']['title'] || 'Nacho';
                    }
                });
            });
        } else {

        }

    }*/

    /*if (response.result.action==='input.info_expand') {
    }*/
    let messages = require('../lib/apiai.js').buildMessages(response, address, source);
    //
    let builder = require('../lib/botbuilder.js');

    if (isWelcomeSecondTime(response.result.action)) {
        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "היי";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages[response.result.fulfillment.messages.length-1] = msg2.data;
    }

    if (isQuestion(response.result.action)) {
        let deno = userData.study_session.stat.total_questions;
        let length = Object.keys(userData.study_session.questions).length;
        let nume = userData.study_session.stat.total_questions - length + 1;
        let speech = "שאלה " + nume + " מתוך " + deno + " ("+ userData.question.intentName.split('_')[2] +")";;
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        messages.unshift(msg1.data);
    }

    if (isFollowUpWrong(response.result.action)) {
        let speech = getAnswer(userData.user_profile.gender || 'male', response.result.action);
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);
        
        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "כאן יהיה הסבר";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);

        messages = [];
        messages.push(msg1);
        messages.push(msg2);
    }

    if (isFollowUpRight(response.result.action)) {
        //updateScore(userData);
        let speech = getAnswer(userData.user_profile.gender || 'male', response.result.action)
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);

        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "כאן יהיה הסבר";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);

        messages = [];
        messages.push(msg1);
        messages.push(msg2);
    }

    if (isHintReply(response.result.action)) {
        let replies = ['A', 'B', 'C', 'D'];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech;
        let lastMessage = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages[response.result.fulfillment.messages.length-1] = lastMessage;
    }

    if (isFallback(response.result.action)) {
        let speech = getHint(userData.user_profile.gender || 'male');
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);
        //messages.unshift(msg1);
        let replies = ['A', 'B', 'C', 'D'];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech;
        let lastMessage = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages[response.result.fulfillment.messages.length-1] = lastMessage;
        messages.unshift(msg1);
    }

    if ((!userData.intent)&(!isWelcome(response.result.action))) { // first time ever - sends default welcome intent - whatever the user says
        return require('../lib/apiai.js').eventRequest('WELCOME', address, 0, userData || {});
    } else if ((!!userData.intent)&(isWelcome(response.result.action))) {
        return require('../lib/apiai.js').eventRequest('Welcome_Second_Time', address, 0, userData || {});
    }

    require('../lib/botbuilder.js').sendMessages(response, connObj, messages, userData || {});
    //let sendMessagesPromise = require('../lib/botbuilder.js').sendMessagesPromise(response, connObj, messages, userData || {});

    if (isNext(response.result.action)) {
        userData.study_session = userData.study_session || {};
        userData.study_session.questions = userData.study_session.questions || {};
        userData.study_session.stat = userData.study_session.stat || {};
        //
        userData.question = userData.question || {};
        delete userData.study_session.questions[userData.question.intentId];
        //

        let questionIndex = Object.keys(userData.study_session.questions)[0];
        if (questionIndex===undefined) {
            let queryQ = require('../lib/database.js').queryCategoryQuestions();
            queryQ.then(
                function (queryQuestions) {
                    console.log(queryQuestions);
                    let questions = queryQuestions;
                    //let questionIndex = require('../lib/database.js').buildQuestionsIndex(questions);
                    return newStudySession(address, userData, questions);
                }
            ).then(
                function (userData) {
                    return require('../lib/apiai.js').eventRequest('Information_101', address, 0, userData || {});
                    //questionIndex = Object.keys(userData.study_session.questions)[0];
                    //sendQuestionFromStudySession(address, userData, questionIndex);
                }
            ).catch(
                function (err) {
                    console.log('Next:');
                    console.log(err);
                }
            );
        }
        else {
            sendQuestionFromStudySession(address, userData, questionIndex);
        }
        
        //return require('../lib/apiai.js').eventRequest(eventName, address, 0, userData || {});
        //dbEventEmitter.emit('eventRequest', questionJson.question.name, address, timeout, userData || {}, false);
        //
        //let eventName = 'Question_Ask_131';
        //return require('../lib/apiai.js').eventRequest(eventName, address, 0, userData || {});
    }
}

function sendQuestionFromStudySession(address, userData, questionIndex) {
    let questionJson = {
        question : userData.study_session.questions[questionIndex]
    }
    //delete userData.study_session.questions[questionIndex];
    //
    userData.event = questionJson.question.name;
    if (!!userData.question===false) { 
        userData.question = {};
        userData.question.intentId = questionIndex;
        userData.question.intentName = questionJson.question.name;
    }
    else if (userData.question.intentId!==questionIndex) {
        userData.question = {};
        userData.question.intentId = questionIndex;
        userData.question.intentName = questionJson.question.name;
    }
    //
    //return require('../lib/apiai.js').eventRequest(questionJson.question.name, address, 0, userData || {});    
    return require('../lib/apiai.js').eventRequest('Question_Ask_131', address, 0, userData || {});
}

function newStudySession(address, userData, questions) {
    let promise = new Promise(function (resolve) {
        userData.study_session = buildStudySession(userData, questions);
        let questionIndex = Object.keys(userData.study_session.questions)[0];
        //
        let questionJson = {
            question : userData.study_session.questions[questionIndex]
        }
        //
        userData.event = questionJson.question.name;
        if (!!userData.question===false) { 
            userData.question = {};
            userData.question.intentId = questionIndex;
            userData.question.intentName = questionJson.question.name;
        }
        else if (userData.question.intentId!==questionIndex) {
            userData.question = {};
            userData.question.intentId = questionIndex;
            userData.question.intentName = questionJson.question.name;
        }
        //
        resolve(userData);
        //dbEventEmitter.emit('eventRequest', questionJson.question.name, address, timeout, userData || {}, false);
    });
    return promise;
}

function buildStudySession(userData) {
    let promise = new Promise (function (resolve) {

    });
    return promise;
}

function buildStudySession(userData, questions) {
    if ((questions || 'empty') === 'empty') {
        return;
    }
    //
    userData.sub_category = userData.sub_category || 'general';
    //
    let tempQuestions = questions;
    let study_session = {};
    study_session.questions = {};
    study_session.stat = {};
    //
    let STUDY_SESSION = 5
    for (let i=0; i<STUDY_SESSION; i++) {
        let subCategory = getSubCategory(userData.sub_category, tempQuestions);
        let question = getQuestion(subCategory, tempQuestions)
        //
        if (question.id===undefined) {
            break;
        } else {
            study_session.questions[question.id] = question.question;
        }
    }
    //
    study_session.stat.total_questions = Object.keys(study_session.questions).length;
    userData.score = 0;
    //
    return study_session;
}

function getQuestion(subCategory, questions) {
    let objkeys1 = Object.keys(questions['sub_category'][subCategory].questions);
    let questionLen = objkeys1.length;
    let intent = objkeys1[Math.floor(Math.random() * questionLen)];
    //
    let intentJson = {
        "id" : intent,
        "question" : questions['sub_category'][subCategory].questions[intent]
    };
    //
    delete questions['sub_category'][subCategory].questions[intent];
    //
    return intentJson;
}

function getSubCategory(sub_category, questions) {
    sub_category = sub_category || 'general';
    //
    if (sub_category==='general') {
        let objKeys = Object.keys(questions['sub_category']);
        let subCategoryLen = objKeys.length;
        sub_category = objKeys[Math.floor(Math.random() * subCategoryLen)];
    }
    //
    return sub_category;
}