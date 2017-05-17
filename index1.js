'use strict';

//require('./config.js');
let restify = require('./lib/restify.js');
let fs = require('./lib/file_system.js');
let db = require('./lib/database.js');
let builder = require('./lib/botbuilder.js');
let apiai = require('./lib/apiai.js');
let util = require('./lib/util.js');
let bodyParser = require('body-parser'); // for webhook


let server = restify.createServer(3978);

server.use(bodyParser.json());   // webhook
server.use(bodyParser.urlencoded({extended: true})) // support encoded bodies for add_question post textarea

const STUDY_SESSION = 5;  // number of question for each study session;
/*let questions = null;
let questionIndex = {};
let information = null;

let queryQ = db.queryCategoryQuestions();
queryQ.then(
    function (queryQuestions) {
        console.log(queryQuestions);
        questions = queryQuestions;
        questionIndex = util.buildQuestionsIndex(questions);
    }
).catch(
    function (err) {
        console.log('Questions:');
        console.log(err);
    }
);

let queryI = db.queryInformation();
queryI.then(
    function (queryInformation) {
        console.log(queryInformation);
        information = queryInformation;
    }
).catch(
    function (err) {
        console.log('Information:');
        console.log(err);
    }
);*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
server.get('/', function(req, res, next) {
    res.send('hello');
    next();
});

server.get('/add_question', function (req, res, next) {
    let html = fs.readFileSync(__dirname + '/public/add_question.html');    
    res.end(html);
});

server.get('/add_info', function (req, res, next) {
    let html = fs.readFileSync(__dirname + '/public/add_info.html');
    res.end(html);
});

server.get('/study_session/:channelId/:userId/:score', function (req, res, next) {
});

server.get('/info/:channelId/:userId/:infoId', function (req, res, next) {
    
});

server.get('/public/:folder/:fileName', function (req, res, next) {
    let file = fs.readFileSync(__dirname + '/public/' + req.params.folder + '/' + req.params.fileName, 'utf8');
    res.end(file);
});

server.get('/build', function(req, res, next) {
    //apiai.getAllIntents();
    //res.send('build intent went good');
    //next();

    let intents = apiai.getAllIntentsPromise();
    intents.then(function (jsonObj) {
        apiai.syncFromApiaiToDb(jsonObj);
        //apiai.updateNames();
        return db.queryDictionary();
    }).then(function (queryDictionary) {
        queryDictionary.forEach(function(category, i) {
            db.updateCategoryName(category.name.toLowerCase(), {"name" : category.heb});
            
            category.sub_category.forEach(function(subCategory, j) {
                db.updateSubCategoryName(category.name.toLowerCase(), subCategory.name.toLowerCase(), {"name" : subCategory.heb});
            });
        });
        res.send('build intent wend good');
        next();
    }).catch(function (err) {
        res.send(err);
        next();
    });
});

server.get('/show', function(req, res, next) {
    console.time('show');
    let promises = [];
    let intents = apiai.getAllIntentsPromise();
    intents.then(function (jsonObj) {
        for (let i = 0; i < 30; ++i) {
            promises.push(apiai.getIntentById(jsonObj[i].id));
        }

        Promise.all(promises).then(function (results) {
            let cards = [];
            results.forEach(function(intent, i) {
                let htmlCard = util.buildHtmlCard(__dirname, intent.name, intent.responses[0].messages[0].speech, 'A', 'B', 'C', 'D');
                cards.push(htmlCard);
            });
            let html = fs.readFileSync(__dirname + '/public/cards.html', 'utf8');
            //
            html = html.replace('{cards}', cards);
            res.end(html);
            console.timeEnd('show');
        }).catch(function (err) {
            res.send('Promise.all:' + ' ' + err);
            next();
            console.timeEnd('show');
        });
    }).catch(function (err) {
        res.send('getIntents:' + ' ' + err);
        next();
        console.timeEnd('show');
    });
});

server.get('/user/:channelId/:userId', function(req, res, next) {

});

server.get('/start/:channelId/:userId/:eventName', function(req, res, next) {
    util.readAddresses(req, res, next, req.params.channelId, req.params.eventName, req.params.userId || '');
});

server.get('/start/:channelId/:eventName', function(req, res, next) {
    readAddresses(req, res, next, req.params.channelId, req.params.eventName, req.params.userId || '');
});

server.post('/api/messages', builder.connector.listen());

server.post('/add_question', function create(req, res, next) {
    let q_number = null;
    let parentId = null
    let rootParentId = null;
    let arrReplies = apiai.buildArrReplies(req.body);
    let queryQ = db.queryQuestionNumber();
    queryQ.then(
        function (questionNumber) {
            console.log(questionNumber);
            q_number = questionNumber;
            return apiai.createIntentQuestionAskPromise(questionNumber, req.body, arrReplies);
        }
    ).then(
        function (resultId) {
            parentId = resultId;
            rootParentId = resultId;
            console.log(resultId);
            return apiai.createIntentFollowUpPromise(q_number, req.body, parentId, rootParentId, arrReplies);
        }
    ).then(
        function (status) {
            console.log(status);
            res.send('Ok, thank you. question '+ q_number);
            next();
        }
    ).catch(
        function (err) {
            console.log(err);
            res.send(err);
            next();
        }
    );
});

server.post('/add_info', function create(req, res, next) {
    //util.createInfoSession(req.body);
    //res.redirect('/', next);
    // nested promises
    let queryI = db.queryInfoNumber();
    queryI.then(
        function (infoNumber) {
            console.log(infoNumber);
            return apiai.createInfoIntentPromise(infoNumber, req.body);
        }
    ).then(
        function (a) {
            console.log(a);
            //res.redirect('/', next);
            res.send('Ok, thank you');
            next();
        }
    )
    .catch(
        function (err) {
            console.log(err);
            res.send(err);
            next();
        }
    );

});

server.post('/webhook', function create(req, res, next) {
    console.log('hook request');
    let bodyParser = require('body-parser');
    try {
        //var speech = 'empty speech';
        var speech = '';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                //requestBody.result.parameters.any
                ref.child('contacts').once("value", function(snapshot) {
                    let contacts = snapshot.val();
                    //
                    if (requestBody.result.action==='save_contact') {
                        speech = 'שמרתי את הנתונים, תודה :)';
                        let position = contacts.length;
                        let contact = {};
                        contact['name'] = requestBody.result.parameters['name'];
                        contact['phone-number'] = requestBody.result.parameters['phone-number'][0];
                        contact['job-place'] = requestBody.result.parameters['job-place'][0];
                        contact['job-title'] = requestBody.result.parameters['job-title'][0];
                        contacts.push(contact);
                        let refUser = ref.child('contacts').set(contacts);
                    }
                    else {
                        contacts.forEach(function(contact) {
                            if (contact.name.indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            } 
                            if (contact['job-place'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                            if (contact['job-title'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                            if (contact['phone-number'].indexOf(requestBody.result.parameters.any)>=0) {
                                speech += contact.name + ' ' + contact['phone-number'];
                                speech += '\n';
                            }
                        }, this);
                    }
                    //
                    console.log(speech);
                    if (!speech) {
                        speech = 'empty speech'
                    }
                    return res.json({
                        speech: speech,
                        displayText: speech,
                        source: 'apiai-webhook-sample'
                    });
                }, function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                });
            }
        }
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
