'use strict';

//require('./config.js');
let restify = require('./lib/restify.js');
let fs = require('./lib/file_system.js');
let db = require('./lib/database.js');
let builder = require('./lib/botbuilder.js');
let apiai = require('./lib/apiai.js');
let util = require('./lib/util.js');
let bodyParser = require('body-parser'); // for webhook
//let DirectLine = require('botframework-directlinejs');


let server = restify.createServer(3978);

server.use(bodyParser.json());   // webhook
server.use(bodyParser.urlencoded({extended: true})) // support encoded bodies for add_question post textarea

const STUDY_SESSION = 5;  // number of question for each study session;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
server.get('/', function(req, res, next) {
    //res.send('hello');
    //next();
    let html = fs.readFileSync(__dirname + '/public/chat.html');    
    res.end(html);
});

server.get('/send/:source/:userId/:msg', function (req, res, next) {
    builder.proactive(req.params.source, req.params.userId, req.params.msg);
    res.json("ok");
});

server.get('/chat', function (req, res, next) {
    let html = fs.readFileSync(__dirname + '/public/chat.html');    
    res.end(html);
});

server.get('/chat1', function (req, res, next) {
    let html = fs.readFileSync(__dirname + '/public/chat_direct_line.html');    
    res.end(html);
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

server.get({ path: 'api/directline/:fingerprint', version: "1.0.0" }, function (req, res, next) {
    var directLine = new DirectLine.DirectLine({
        //secret: "c2VsFnabiDE.cwA.Xfc.lqlI2Bo-2IPpMSW7FFd_dAgP2W64Y_2cs0B9aOui1c8"/* put your Direct Line secret here */,
        token: "c2VsFnabiDE.cwA.Xfc.lqlI2Bo-2IPpMSW7FFd_dAgP2W64Y_2cs0B9aOui1c8"/* or put your Direct Line token here (supply secret OR token, not both) */,
        //domain: /* optional: if you are not using the default Direct Line endpoint, e.g. if you are using a region-specific endpoint, put its full URL here */
        webSocket: false/* optional: false if you want to use polling GET to receive messages. Defaults to true (use WebSocket). */,
        //pollingInterval: /* optional: set polling interval in milliseconds. Default to 1000 */,
        //conversationId: 'HPAm2xzuNi1BhK76YN1HlF'
    });
    directLine.conversationId = 'HPAm2xzuNi1BhK76YN1HlF';
    directLine.postActivity({
        "type": "message",
        "from": {
            "id": "neta"
        },
        "text": "פרק 5"
    }).subscribe(
        id => console.log("Posted activity, assigned ID ", id),
        error => console.log("Error posting activity", error)
    );

    directLine.activity$.subscribe(activity => console.log(activity));
});
    
/*server.post('/hook', [setUserData, buildMessages, saveUserData, sendMessages]);*/

function setUserData(req, res, next) {
    req.source = (req.body.originalRequest) && (req.body.originalRequest.source);
    if (req.source === undefined) {
        req.source = (req.body.result) && (req.body.result.source);
    }
    req.sender_id = (req.body.originalRequest) && (req.body.originalRequest.data) && (req.body.originalRequest.data.sender) && (req.body.originalRequest.data.sender.id);
    if (req.sender_id === undefined) {
        req.sender_id = req.body.sessionId;
    }
    let query = db.getUserData(req.source, req.sender_id);
    query.once("value", function(snapshot) {
        req.userData = snapshot.val() || {};
        next();
    }, function (errorObject) {
        console.log("The read 'userData' failed: " + errorObject.code);
        next();
    });
}

function chapters(req, next) {
    if (req.body.result.parameters.chapter!=='') {
        req.userData.chapter = req.body.result.parameters.chapter;
        if (req.userData.chapter==="5") {
            let messages = [];
            messages.push(buildMessageQuickReplies('עכשיו שבחרנו פרק אפשר להמשיך', ["המשך"]));
            req.send_messages = {messages: messages};
            next();
        }
        else if (req.userData.chapter==="0") {
            let messages = [];
            messages.push(buildMessageQuickReplies('עכשיו שבחרנו פרק אפשר להמשיך', ["המשך"]));
            req.send_messages = {messages: messages};
            next();
        }
        else {
            req.send_messages = req.body.result.fulfillment.messages;
            next();
        }
    } else {
        let messages = [];
        db.getChapters(function (chapters, res) {
            let chapter = [];
            chapters.forEach(function(element) {
                chapter.push(element.title);
            });
            messages.push(buildMessageQuickReplies('בחר נושא', chapter));
            req.send_messages = {messages: messages};
            next();
        });
    }
}

function buildContextOutElement(name, parameters, lifespan) {
    let contextOut = {};

    contextOut.name = name;
    contextOut.parameters = parameters;
    contextOut.lifespan = lifespan;

    return contextOut;
}

function buildQuestion(req) {
    let callback = {};
    callback.contextOut = [];
    callback.messages = [];
    callback.contextOut.push(buildContextOutElement('ziv-followup', { ans: 'ans' }, 2));
    callback.messages = req.body.result.fulfillment.messages;
    callback.messages.push(buildMessage('שאלה גנרית?'));

    return callback;
}

function buildMessages(req, res, next) {
    var requestBody = req.body;
    console.log('hook request: ' + requestBody.result.resolvedQuery);
    try {
        var speech = '';
        if (req.body) {
            if (req.body.result) {
                if ((req.body.result.action === "input.chapters")) {
                    chapters(req, next);
                }
                else if ((req.body.result.action === "test.ziv")) {
                    //let callback = buildQuestion(req);
                    //req.send_messages = callback;
                }
                else if ((req.body.result.action === "ziv.more")) {
                    //callEvent('Chapters', req.body.sessionId, req, next);
                    //console.log('callEvent');
                    //
                    if (!req.userData.chapter) {
                        let messages = [];
                        messages.push(buildMessageQuickReplies('קודם צריך לבחור פרק', ["בחירת פרק"]));
                        req.send_messages = {messages: messages};
                        next();
                    } else {
                        let currentQuestion = (req.userData.question && req.userData.question.Data && req.userData.question.Data.Question_Id) || 0;
                        console.log(currentQuestion);
                        let queryQ = db.queryQuestions(req.userData.chapter, currentQuestion);
                        queryQ.then(function (question) {
                            req.userData.question = question;
                            console.log(question);
                            messages = [];
                            messages.push(buildMessageQuickReplies(question.Question, ["בחירת פרק"]))
                            let callback = buildQuestion(req);
                            req.send_messages = callback;
                            next();
                        }).catch(function (err) {
                            console.log(err);
                        });
                    }
                }
                else if ((req.body.result.action === "action")) {

                }
                else {
                    //req.send_messages = req.body.result.fulfillment.messages;
                    req.send_messages = req.body.result.fulfillment.messages;
                    //buildMessage('בדיקה');
                    next();
                }
            }
            //next();
        }
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json(err);
    }
}

function callEvent(eventName, sessionId, params, req, next) {
    var client = restify.restify.createJsonClient({
        url: 'https://api.api.ai',
        version: '*'
    });

    var options = {
        path: '/v1/query?v=20150910',
        headers: {
            'Authorization': process.env.APIAI_AUTHORIZATION,
            'content-type': 'application/json; charset=utf-8'
        }
    }

    var body = 
        {
            'event': {
                'name': eventName, 
                'data': params || {}
            }, 
            //'timezone':'America/New_York', 
            'lang':'en', 
            'sessionId':sessionId
        }

    client.post(options, body, function(err, reqApi, resApi, obj) {
        req.send_messages = obj.result.fulfillment.messages;
        next();
    });
}

function sendMessage(user_id, message) {
    var client = restify.restify.createJsonClient({
        url: 'https://graph.facebook.com',
        version: '*'
    });

    var options = {
        path: '/v2.6/me/messages?access_token=' + 'EAADW6j7AJtABAH0CyJcqY81m8eKjKlduO6XNQBQa6JWZCcEpg6cFtEHZAIZArP98sVph3zMnzklhVPmQ63LN6FMnsO4UPg6TiAvcEXnXrqfbyB3iXwrIFw9QnxvtjSLtgXpGfiDLCIou0NeKoaWOioili6zk4BZCpOpBA5HwcQZDZD'//process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    }

    var body = 
        {
            "recipient": {
                "id": user_id
            }, 
            "message": {
                "text": message,
                "quick_replies": [
                    {
                        "content_type":"text",
                        "title" : "test",
                        "payload" : "test"
                    }
                ]
            }
        }

    client.post(options, body, function(err, reqMsg, resMsg, obj) {
        console.log(err);
    });
}

function buildMessage(speech) {
    let message = {};
    message.speech = speech;
    message.type = 0;
    return message;
}

function buildMessageQuickReplies(title, repliesArray) {
    if (typeof repliesArray !== 'undefined' && repliesArray.length > 0) {
        let message = {};
        message.title = title;
        message.replies = repliesArray;
        message.type = 2;
        return message;
    } else {
        return buildMessage(title);
    }
}

function saveUserData(req, res, next) {
    let query = db.getUserData(req.source, req.sender_id);
    query.set(req.userData || {});
    next();
}

function sendMessages(req, res) {
    return res.json(req.send_messages);
}

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
                let messages = requestBody.result.fulfillment.messages;
                messages.unshift({speech:"ccc", type:0});
                messages.unshift({speech:"bbb", type:0});
                messages.unshift({speech:"aaa", type:0});
                console.log(speech);
                if (!speech) {
                    speech = 'empty speech'
                }
                return res.json({
                    speech: speech,
                    displayText: speech,
                    source: 'apiai-webhook-sample',
                    messages: messages
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
