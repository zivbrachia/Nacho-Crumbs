let webRequest = require('request');

module.exports = {webRequestPromise, setMessageTypeQuickReplies, cardJson};

function webRequestPromise(session) {
    let webRequestPromise = new Promise(function (resolve, reject) {
        if ((session.message.address.channelId === 'facebook') & (session.userData.user_profile || 'empty'==='empty')) {
            webRequest('https://graph.facebook.com/v2.6/'+ session.message.address.user.id +'?access_token=' + process.env.FACEBOOK_PAGE_ACCESS_TOKEN, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let user_profile = JSON.parse(body);
                    console.log('user_profile: ' + user_profile);
                    resolve(user_profile);
                }
                else {
                    reject(response.statusCode + ' ' + error);    
                }
            });    
        } else {
            reject('profile_user already updated');
        }
    });
    return webRequestPromise;
}

function setMessageTypeQuickReplies(title, replies) {
    let facebookObj = {};
    facebookObj.facebook = {};
    facebookObj.facebook['text'] = title;
    if (message.title.indexOf('[>>]') !== (-1)) {
        facebookObj.facebook['text'] = startWith.replace(/\n/g, '\n\r') // + textResponseToQuickReplies.replace(/\n/g, '\n\r');
    }
    facebookObj.facebook.quick_replies = [];
    let len = replies.length;
    for(let i=0; i<len; i++) {
        let quick_reply = {};
        quick_reply.content_type = "text";
        quick_reply.title = message.replies[i];
        quick_reply.payload = message.replies[i]; //"SOMETHING_SOMETHING";
        facebookObj.facebook.quick_replies.push(quick_reply);
    }

    return facebookObj;
}

function cardJson(response, messageIndex) {
    let facebook = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: []
            }
        }
    };
    //
    let message = response.result.fulfillment.messages[messageIndex];
    while (message.type===1) {
        facebook.attachment.payload.elements.push(buildElement(response.result.fulfillment.messages[messageIndex]));
        messageIndex = messageIndex + 1;
        if (messageIndex>=response.result.fulfillment.messages.length) {
            message.type=false;
        }
        else {
            message = response.result.fulfillment.messages[messageIndex];
        }
    }
    
    return facebook;
}

function buildElement(message) {
    if (message.type!==1) {
        return {};
    }
    //
    let element = {
        image_url: message.imageUrl,
        subtitle: message.subtitle,
        title: message.title,
        buttons: []
    }
    //
    let len = message.buttons.length;
    for (let i=0; i<(len); i++) {
        element.buttons.push(buildButton(message.buttons[i]['text'], message.buttons[i]['postback']));    
    }
    
    return element;
}

function buildButton(text, url) {
    let button = {};
    button.title = text;
    if (url==='' ){
        button.type = 'postback';
        button.payload = text;
    } else {
        button.type = 'web_url';
        button.url = url;
        button.webview_height_ratio =  'tall';
    }
    return button;
}