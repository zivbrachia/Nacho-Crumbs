'use strict';

let firebase = require('firebase-admin');

module.exports = {
    queryCategoryQuestions, queryInformation, queryDictionary, queryChannel, queryUser, queryQuestionNumber, queryInfoNumber, 
    updateCategory, updateCategoryName, updateSubCategoryName, updateInfoNumber, updateQuestionNumber, updateQuestion, updateInformation, updateUserProfile,
    updateUserAddress, getChapters, queryQuestions, getUserData, getQuestionsByChapter, /*updateQuestionCet*/};

initializeApp();
let ref = getRefRoot();

function initializeApp() {
    let db_credential = require('../serviceAccountKey.js');

    firebase.initializeApp({
        credential: firebase.credential.cert(db_credential.serviceAccount),
        databaseURL: process.env.DB_URL
    });
    return firebase;    
}

function getRefRoot() {
    return firebase.database().ref();
}

function queryInfoNumber() {
    let query = new Promise(function (resolve, reject) {
        ref.child('settings').child('info_number').once("value", function(snapshot) {
           let InfoNumber = snapshot.val();
           if (InfoNumber===null) {
                InfoNumber = 101;
            }
            resolve(InfoNumber);
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    return query;
}

function getUserData(source, sender_id) {
    return ref.child('source').child(source).child('sender_id').child(sender_id).child('user_data');
}

function queryQuestions(chapter, currentQuestion) {
    let query = new Promise(function (resolve, reject) {
        ref.child('Questions').child(chapter).once("value", function(snapshot) {
           let questionsArr = snapshot.val();
           //console.log(questionsArr);
           let nextQuestion = parseInt(currentQuestion) + 1;
           resolve(questionsArr[nextQuestion] || questionsArr[1]);
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    return query;
}

function queryQuestionNumber() {
    let query = new Promise(function (resolve, reject) {
        ref.child('settings').child('question_number').once("value", function(snapshot) {
           let QuestionNumber = snapshot.val();
           if (QuestionNumber===null) {
               QuestionNumber = 1;
           }
            resolve(QuestionNumber);
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    return query;
}
/*
function getChapters() {
    let query = new Promise(function (resolve, reject) {
        ref.child('Chapters').once("value", function(snapshot) {
            let chapters = snapshot.val();
            resolve(chapters);
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    return query;
    
}
*/

function getChapters(callback, res) {
    ref.child('Chapters').once("value", function(snapshot) {
        let chapters = snapshot.val();
        callback(chapters, res);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function getQuestionsByChapter(chapterId, callback) {
    ref.child('Questions').child(chapterId).once("value", function(snapshot) {
        let questions = snapshot.val();
        callback(questions);
    });
}

function queryUser(channelId, userId) {
    let query = new Promise(function (resolve, reject) {
        ref.child('users').child(channelId).child(userId).once("value", function(snapshot) {
            let user = snapshot.val();
            resolve(user);
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    return query;
}

function queryChannel(channelId) {
    let query = new Promise(function (resolve, reject) {
        ref.child('users').child(channelId).once("value", function(snapshot) {
            let users = snapshot.val();
            resolve(users);
        }, function (errorObject) {
            reject(errorObject);
        });
    });
    return query;
}

function queryCategoryQuestions() {
    let query = new Promise(function (resolve, reject) {
        ref.child('category').child('dna').once("value", function(snapshot) {
            let questions = snapshot.val();
            resolve(questions);
        }, function (errorObject) {
            reject(errorObject);
        });
    });
    return query;
}

function queryInformation() {
    let query = new Promise(function (resolve, reject) {
        ref.child('information').child('dna').once("value", function(snapshot) {
            let information = snapshot.val();
            resolve(information);
        }, function (errorObject) {
            reject(errorObject);
        });
    });
    return query;
}

function queryDictionary() {
    let query = new Promise(function (resolve, reject) {
        ref.child('dictionary').child('category').once("value", function(snapshot) {
            let dictionary = snapshot.val();
            resolve(dictionary);
        }, function (errorObject) {
            reject(errorObject);
        });
    });
    return query;
}

/*function updateQuestionCet(data) {
    return ref.child('CET').update({"test" : data});
}*/

function updateInfoNumber(infoNumber) {
    return ref.child('settings').update({"info_number" : infoNumber + 1});
}

function updateQuestionNumber(questionNumber) {
    return ref.child('settings').update({"question_number" : questionNumber + 1});
}

function updateCategory(data) { 
    return ref.child('category').update(data);
}

function updateCategoryName(categoryName, data) {
    return ref.child('category').child(categoryName.toLowerCase()).update(data);
}

function updateSubCategoryName(categoryName, subCategoryName, data) { 
    return ref.child('category').child(categoryName.toLowerCase()).child('sub_category').child(subCategoryName.toLowerCase()).update(data);
}

function updateQuestion(Category, SubCategory, resultId, data) {
    return ref.child('category').child(Category.toLowerCase()).child('sub_category').child(SubCategory.toLowerCase()).child('questions').child(resultId).update(data);
}

function updateInformation(Category, SubCategory, responseId, data) {
    return ref.child('category').child(Category.toLowerCase()).child('sub_category').child(SubCategoryName.toLowerCase()).child(responseId).update(data);
}

function createListener(event, nodeRef) {
    // event = 'child_added', 'child_changed', 'child_removed', 'child_added'
    nodeRef.on(event, function(snap) {
        console.log(JSON.stringify(snap.val()) + "\n\n");
    });
}

function updateUserProfile(channelId, userId, data) {
    return ref.child('users').child(channelId).child(userId).child('userData').child('user_profile').update(data);
}

function updateUserAddress(channelId, userId, address) {
    return ref.child('users').child(channelId).child(userId).child('address').update(address);
}

function sendToChannel(req, res, next, channelId, eventName) {
    let ref = getRefRoot();
    ref.child('users').child(channelId).once("value", function(snapshot) {
        let users = snapshot.val();
        if (users===null) return;
        ////////////////////////////////////////////////////
        Object.keys(users).forEach( function (user) {
            let address = users[user].address;
            if (address===undefined) return;
            //if (channelId==='facebook') 
            //if ((channelId==='telegram')&(user!=='154226484')) return;
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
}

function sendToUser(req, res, next, channelId, eventName, userId) {
    let ref = getRefRoot();
    ref.child('users').child(channelId).child(userId).once("value", function(snapshot) {
        let users = snapshot.val();
        if (users===null) return;
        ////////////////////////////////////////////////////
        Object.keys(users).forEach( function (user) {
            let address = users[user].address;
            if (address===undefined) return;
            //if (channelId==='facebook') 
            //if ((channelId==='telegram')&(user!=='154226484')) return;
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
}