'use strict';

//let apiai = require('../lib/apiai.js');
let db = require('../lib/database.js');

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

function isInfoExpand(intentAction) {
    if (intentAction==='input.info_expand') {
        return true;
    }
    return false;
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

function isProfile(intentAction) {
    if (intentAction.indexOf('profile.')>=0) {
        return true;
    }
    return false;
}

function isProfileFirstName(intentAction) {
    if (intentAction.indexOf('profile.first_name')>=0) {
        return true;
    }
    return false;
}

function getAddress(connObj) {
    let address = connObj;
    if (isSession(connObj)) {
        address = connObj.message.address;
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

function chatFlow1(connObj, response, userData, source, promises) {
    let address = getAddress(connObj);
    userData.action = userData.action || [];
    userData.action.push(response.result.action);
    if (isInfoExpand(response.result.action)) {
        //let infoL = Object.keys(information[subCategory]);
            //infoL.forEach(function(info) {
                //if (info===userData.intent.id) {
                    response.result.fulfillment.messages[0].buttons[0].postback = response.result.fulfillment.messages[0].buttons[0].postback + address.channelId + '/' + address.user.id + '/' + userData.intent.id;
                    response.result.fulfillment.messages[0].imageUrl = /*information[subCategory][info]['expand']['image'] ||*/ 'https://firebasestorage.googleapis.com/v0/b/nacho-crumbs.appspot.com/o/photos%2Fnacho1024.png?alt=media&token=40ea8306-8bf6-4810-b2b0-f45678438746';
                    response.result.fulfillment.messages[0].subtitle = /*information[subCategory][info]['expand']['subtitle'] ||*/ 'תת כותרת';
                    response.result.fulfillment.messages[0].title = /*information[subCategory][info]['expand']['title'] ||*/ 'כותרת';
                //}
            //});
    }

    let messages = require('../lib/apiai.js').buildMessages(response, address, source);
    //
    let builder = require('../lib/botbuilder.js');

    if (isWelcomeSecondTime(response.result.action)) {
        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "היי";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages[response.result.fulfillment.messages.length-1] = msg2.data;
    }

    if (isSubCategory(response.result.action)) {
        db.getChapters(function (chapters) {
            let replies = [];
            for (let i in chapters) {
                let id = chapters[i].id;
                let title = chapters[i].title;
                replies.push(title); 
            }
        });
        console.log('a');

        /*
        promises.push(chapters);
        //promises.push(chapters);
        let messagesPromise = buildMessageChapter(chapters, address, builder, messages);
        promises.push(messagesPromise);
        */
        /*
        chapters.then(function (chapters) {
            let replies = [];
            for (let i in chapters) {
                let id = chapters[i].id;
                let title = chapters[i].title;
                replies.push(title); 
            }
            let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, 'בחר נושא?', replies, builder);
            messages[response.result.fulfillment.messages.length-1] = msg2.data;
            console.log(messages);
        }).catch(function (err) {
            console.log(err);
        });
        */
        /*
        if (response.result.parameters.subcategory!=='') {
            userData.category = 'dna';
            userData.sub_category = response.result.parameters.subcategory;
        } else {
            let replies = ["מחלבון לדנא", "מבנה", "שעתוק","הכל"];
            let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech;
            let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
            messages[response.result.fulfillment.messages.length-1] = msg2.data;
        }*/
    }

    if (isQuestion(response.result.action)) {
        userData.question = userData.question || {};
        userData.question.intentId = response.result.metadata.intentId;
        userData.question.intentName = response.result.metadata.intentName;
        //userData.question.replies = [];
        //userData.aaa = (userData.aaa || 0) + 1;   //true;//getReplies(response.result.fulfillment.messages);
        //
        /*let speech = speechQuestionIndecator(userData);
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        messages.unshift(msg1.data);*/
    }

    if (isFollowUpWrong(response.result.action)) {
        let speech = getAnswer(userData.user_profile.gender || 'male', response.result.action);
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);
        messages.unshift(msg1.data);
        
        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "כאן יהיה הסבר";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages.splice(messages.length-1, 1, msg2.data);
        
        userData.study_session.questions = userData.study_session.questions || [];
        userData.study_session.questions.push(response.result.action);
    }

    if (isFollowUpRight(response.result.action)) {
        //updateScore(userData);
        let speech = getAnswer(userData.user_profile.gender || 'male', response.result.action)
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);
        messages.unshift(msg1.data);

        let replies = ["המשך"];
        let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech || "כאן יהיה הסבר";
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        messages.splice(messages.length-1, 1, msg2.data);
        
        userData.study_session.questions = userData.study_session.questions || [];
        userData.study_session.questions.push(response.result.action);
    }

    if (isHintReply(response.result.action)) {
        //let replies = ['A', 'B', 'C', 'D'];
        //let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech;
        //let lastMessage = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        //messages[response.result.fulfillment.messages.length-1] = lastMessage;
    }

    if (isFallback(response.result.action)) {
        let speech = getHint(userData.user_profile.gender || 'male');
        let msg1 = require('../lib/apiai.js').getMessageTypeText(address, speech, builder);
        //let msg1 = builder.getMessageText(address, speech);
        //messages.unshift(msg1);
        //let replies = ['A', 'B', 'C', 'D'];
        //let speech2 = response.result.fulfillment.messages[response.result.fulfillment.messages.length-1].speech;
        //let lastMessage = require('../lib/apiai.js').getMessageTypeQuickReplies(address, speech2, replies, builder);
        //messages[response.result.fulfillment.messages.length-1] = lastMessage;
        messages.unshift(msg1);
    }

    if (isProfile(response.result.action)) {
        if (isProfileFirstName(response.result.action)) {
            return require('../lib/apiai.js').eventRequest('Gender', address, 0, userData || {});
        }
    }

    if ((!userData.intent)&(!isWelcome(response.result.action))) { // first time ever - sends default welcome intent - whatever the user says
        return require('../lib/apiai.js').eventRequest('WELCOME', address, 0, userData || {});
    } else if ((!!userData.intent)&(isWelcome(response.result.action))) {
        return require('../lib/apiai.js').eventRequest('Welcome_Second_Time', address, 0, userData || {});
    }

    messages = mergeCardMessages(messages);
    require('../lib/botbuilder.js').sendMessages(response, connObj, messages, userData || {});

    if (isNext(response.result.action)) {
        userData.question = userData.question || {};
        let nextQuestion = getNextQuestion(userData.question.intentName);
        userData.question.intentName = nextQuestion;
        userData.study_session = userData.study_session || {};
        userData.study_session.stat = userData.study_session.stat || {};
        userData.study_session.stat.total = 5;
        if (nextQuestion.indexOf('Information')>=0) {
            userData.study_session.stat.current = 0;
        } else if (nextQuestion.indexOf('Break')>=0) {
                
        } else {
            userData.study_session.stat.current = (userData.study_session.stat.current || 0) + 1;
        }
        userData.study_session.questions = userData.study_session.questions || [];
        userData.study_session.questions.push(nextQuestion);
        
        return require('../lib/apiai.js').eventRequest(nextQuestion, address, 0, userData || {});
        /*
        userData.study_session = userData.study_session || {};
        userData.study_session.questions = userData.study_session.questions || {};
        userData.study_session.stat = userData.study_session.stat || {};
        
        userData.question = userData.question || {};
        delete userData.study_session.questions[userData.question.intentId];

        let questionIndex = Object.keys(userData.study_session.questions)[0];
        if (questionIndex===undefined) {
            let queryQ = require('../lib/database.js').queryCategoryQuestions();
            queryQ.then(
                function (queryQuestions) {
                    console.log(queryQuestions);
                    let questions = queryQuestions;
                    return newStudySession(address, userData, questions);
                }
            ).then(
                function (userData) {
                    sendQuestionFromStudySession(address, userData, userData.question.intentId);
                    //return require('../lib/apiai.js').eventRequest('Information_101', address, 0, userData || {});
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
        */
    }
}

function mergeCardMessages(messages) {
    let newMessages = [];
    let indexies = [];
    let len = messages.length;
    let cardFlag = null;
    for (let i=0; i<(len); i++) {
        let msg = messages[i];
        if (!!((msg || false) && (msg.sourceEvent || false) && (msg.sourceEvent.attachment || false) && (msg.sourceEvent.attachment.payload || false) && (msg.sourceEvent.attachment.payload.elements || false))===true) {
            if (cardFlag!==null) {
                let element = msg.sourceEvent.attachment.payload.elements[0];
                //messages[cardFlag].sourceEvent.attachment.payload.elements.push(element);
                newMessages[newMessages.length-1].sourceEvent.attachment.payload.elements.push(element);
                indexies.push(i);
            } else {
                cardFlag = i;
                newMessages.push(messages[cardFlag]);
            }
        } else {
            cardFlag = null; 
            newMessages.push(msg);  
        }
    }

    return newMessages;
}

function getReplies(messages) {
    let replies;

    messages.forEach(function(message) {
        if (message.type===2) {
            replies = message.replies;
        }
    });

    return replies;
}

function speechQuestionIndecator(userData) {
    let deno = 5;    //userData.study_session.stat.total_questions;
    //let length = Object.keys(userData.study_session.questions).length;
    if (!userData.study_session) {
        userData.study_session = {};
        userData.study_session.stat = {};
        userData.study_session.stat.current = 1;
    }
    let nume = userData.study_session.stat.current;  //userData.study_session.stat.total_questions - length + 1;
    let speech = "שאלה " + nume + " מתוך " + deno + " ("+ userData.question.intentName.split('_')[2] +")";
    return speech
}

function getNextQuestion(current_question) {
    let nextQuestion;

    let questions = {
        Begin : 'Question_Ask_150',
        /* Day 1 */
        Question_Ask_134 : 'Question_Ask_135',
        Question_Ask_135 : 'Question_Ask_136',
        Question_Ask_136 : 'Question_Ask_137',
        Question_Ask_137 : 'Question_Ask_138',
        Question_Ask_138 : 'Question_Ask_139', //'Information_101',
        //Information_101 : 'Question_Ask_134',
        /* Day 2 */
        Question_Ask_139 : 'Question_Ask_140',
        Question_Ask_140 : 'Question_Ask_141',
        Question_Ask_141 : 'Question_Ask_142',
        Question_Ask_142 : 'Question_Ask_143',
        Question_Ask_143 : 'Question_Ask_144',   //'Information_103',
        //Information_103 : 'Question_Ask_139',
        /* Day 3 */
        Question_Ask_144 : 'Question_Ask_145',
        Question_Ask_145 : 'Question_Ask_146',
        Question_Ask_146 : 'Question_Ask_147',
        Question_Ask_147 : 'Question_Ask_148',
        Question_Ask_148 : 'Question_Ask_149', //'Information_104',
        //Information_104 : 'Question_Ask_144',
        /* Day 4 */
        Question_Ask_149 : 'Question_Ask_150',
        Question_Ask_150 : 'Question_Ask_151',
        Question_Ask_151 : 'Question_Ask_151',
        Question_Ask_152 : 'Question_Ask_153',
        Question_Ask_153 : 'Question_Ask_134',
        

    };

    if (current_question===undefined) {
        nextQuestion = questions['Begin'];
    } else {
        nextQuestion = questions[current_question];
    }
    if (nextQuestion===undefined) {
        nextQuestion = questions['Begin'];
    } 
    return nextQuestion;
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
    return require('../lib/apiai.js').eventRequest('Question_Ask_133', address, 0, userData || {});
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

function buildMessageChapter(chapters, address, builder, messages) {
    let query = new Promise(function (resolve, reject) {
        let message = {};
        //message.type = 2;
        message.title = 'בחר נושא?';
        let replies = [];
        for (let i in chapters) {
            let id = chapters[i].id;
            let title = chapters[i].title;
            replies.push(title); 
        }
        message.replies = replies;
        //
        let msg2 = require('../lib/apiai.js').getMessageTypeQuickReplies(address, message.title, message.replies, builder);
        messages[messages.length-1] = msg2.data;
        //
        resolve(messages);
    }, function (errorObject) {
            reject(errorObject)
    });
    return query;
}