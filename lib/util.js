'use strict';

let db = require('../lib/database.js');
let apiai = require('../lib/apiai.js');
let fs = require('../lib/file_system.js');

module.exports = {buildQuestionsIndex, buildToxonomy, readAddresses, createInfoSession, buildHtmlCard};

function createQuestionSession(req_params) {
    
}

function createInfoSession(req_params) {
    let queryI = db.queryInfoNumber();
    queryI.then(
        function (infoNumber) {
            console.log(InfoNumber);
            apiai.createInfoIntent(infoNumber, req_params);
        }
    ).catch(
        function (err) {
            console.log(err);
            //res.send('error');
            //next();
        }
    );
}

function readAddresses(req, res, next, channelId, eventName, userId) {
    userId = (userId || '');
    if (userId==='') {
        sendToChannel(req, res, next, channelId, eventName);
    } else {
        sendToUser(req, res, next, channelId, eventName, userId);
    }
}

function sendToUser(req, res, next, channelId, eventName, userId) {
    let queryU = db.queryUser(channelId, userId);
    queryU.then(
        function (user) {
            console.log(user);
            if (user===null) return;
            let address = user.address;
            if (address===undefined) return;
            let userData = user.userData;
            dbEventEmitter.emit('eventRequest', eventName, address, 0, userData, false);
            next();
        }
    ).catch(
        function (err) {
            console.log(err);
            res.send('error');
            next();
        }
    );


    ref.child('users').child(channelId).child(userId).once("value", function(snapshot) {
        let user = snapshot.val();
        if (user===null) return;
        ////////////////////////////////////////////////////
        let address = user.address;
        if (address===undefined) return;
        //if (channelId==='facebook') 
        //if ((channelId==='telegram')&(user!=='154226484')) return;
        //
        let userData = user.userData;
        //
        dbEventEmitter.emit('eventRequest', eventName, address, 0, userData, false);
        next();
        ////////////////////////////////////////////////////
        }, function (errorObject) {
            res.send('error');
            next();
            console.log("The read failed: " + errorObject.code);
    });
}

function sendToChannel(req, res, next, channelId, eventName) {
    let queryC = db.queryChannel(channelId);
    queryC.then(
        function (users) {
            console.log(users);
            if (users===null) return;
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
        }
    ).catch(
        function (err) {
            console.log(err);
            res.send('error');
            next();
        }
    );
}

function buildQuestionsIndex(questions) {
    let questionIndex = [];
    let categoryL = Object.keys(questions);
    categoryL.forEach(function(subCategory) {
        if (subCategory==='name') return;
        let subCategoryL = Object.keys(questions[subCategory]);
        subCategoryL.forEach(function(sub_cat) {
            let questionsL = Object.keys(questions[subCategory][sub_cat].questions);
            questionsL.forEach(function (question) {
                questionIndex[question] = questionIndex[question] || {};
                questionIndex[question].category = 'dna';
                questionIndex[question].subCategory = questionIndex[question].subCategory || [];
                questionIndex[question].subCategory.push(sub_cat);
            });
        });
    });
    return questionIndex;
}

function buildToxonomy(intent, metaData) {
    if(intent.name.indexOf('Information') > -1) {
        return;
    }
    let temp = buildIntexCatalog(intent);
    if (temp.category.name===undefined) {
        return;
    }
    metaData[temp.category.name] = metaData[temp.category.name] || {};
    metaData[temp.category.name]['sub_category'] = metaData[temp.category.name]['sub_category'] || {};
    let len = temp.category.subcategory.length || 0;
    for (let i=0; i<(len); i++) {
        metaData[temp.category.name]['sub_category'][temp.category.subcategory[i].name] = metaData[temp.category.name]['sub_category'][temp.category.subcategory[i].name] || {};
        metaData[temp.category.name]['sub_category'][temp.category.subcategory[i].name]['questions'] = metaData[temp.category.name]['sub_category'][temp.category.subcategory[i].name]['questions'] || {};
        metaData[temp.category.name]['sub_category'][temp.category.subcategory[i].name]['questions'][intent.id] = {
            'name': intent.name,
            'events': intent.events,
            'level' : temp.level || 1
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

function buildHtmlCard(dirname, title, text, q1, q2, q3, q4) {
    let card = fs.readFileSync(dirname + '/public/card.html', 'utf8');
    card = card.replace('{title}', title);
    card = card.replace('{content}', text);
    card = card.replace('{q1}', q1);
    card = card.replace('{q2}', q2);
    card = card.replace('{q3}', q3);
    card = card.replace('{q4}', q4);
    return card;
}