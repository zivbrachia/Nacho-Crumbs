var apiai = require('apiai');
var emum = require('enum');

module.exports = {textRequest, eventRequest, getIntents, getIntentById, createNewIntent, updateIntentById, deleteIntentById};

var app = apiai(process.env.APIAI_CLIENT_ACCESS_TOKEN);

var responseType = new emum({'TEXT': 0, 'IMAGE': 1, 'QUICK_REPLIES': 2, 'CARD': 3, 'CUSTOM_PAYLOAD': 4});

function deleteIntentById(id, options) {
    // DELETE
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.AUTHORIZATION;

    return client;
}

function updateIntentById(id, options) {
    // PUT
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.AUTHORIZATION;
    options.headers['Content-Type'] = 'application/json; charset=utf-8';

    return client;
}

function createNewIntent(options) {
    // POST
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/'
    });

    options.headers = {};
    options.headers.Authorization = process.env.AUTHORIZATION;
    options.headers['Content-Type'] = 'application/json; charset=utf-8';

    return client;
}

function getIntentById(id, options) {
    // GET
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents/' + id
    });

    options.headers = {};
    options.headers.Authorization = process.env.AUTHORIZATION;

    return client;
}

function getIntents(options) {
    // GET
    var client = require('restify').createJsonClient({
        url: 'https://api.api.ai/v1/intents'
    });

    options.headers = {};
    options.headers.Authorization = process.env.AUTHORIZATION;

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
        messages = buildMessages(response.result.fulfillment.messages);
        console.log(messages);

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
        messages = buildMessages(response.result.fulfillment.messages);
        console.log(messages);
    });

    request.on('error', function(error) {
        console.log(JSON.stringify(error));
    });

    request.end();
}

function buildMessages(messages) { // messages is an array: response.result.fulfillment.messages
    let resultForSession = [];
    //
    var len = messages.length;
    for (let i=0; i<len; i++) {
        var message = messages[i];
        switch(message.type) {
            case responseType.TEXT.value: // Text response
                resultForSession.push(message.speech);
                break;
            case responseType.IMAGE.value: // Image
                break;
            case responseType.QUICK_REPLIES.value: // Quick replies
                let quick_replies = [];
                let len1 = message.replies.length;
                for(let j=0; j<len1; j++) {
                    let quick_reply = {};
                    //
                    quick_reply.content_type = "text";
                    quick_reply.title = message.replies[j];
                    quick_reply.payload = "SOMETHING_SOMETHING"
                    //
                    quick_replies.push(quick_reply);
                }
                resultForSession.push({
                    "facebook": {
                        "text": message.title,
                        "quick_replies": quick_replies
                    }
                });
                break;
            case responseType.CARD.value: // Card
                break;
            case responseType.CUSTOM_PAYLOAD.value: // Custom Payload
                resultForSession.push(message.payload);
                break;
        }            
    }
    return resultForSession;
}