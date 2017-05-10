module.exports = {setMessageTypeQuickReplies, cardJson};

function setMessageTypeQuickReplies(title, replies) {
    let reply_markup = [];
    let len = replies.length;
    for(let i=0; i<len; i++) {
        reply_markup.push([{text: replies[i]}]);
    }
    
    let telegramObj = {
        telegram:{
            method: 'sendMessage',
            parameters: {
                text: title,
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard:
                    //[
                        reply_markup
                    //]
                }
            }
        }
    }
    return telegramObj;
}

function cardJson(infoId, title) {
    let telegram = {    method: "sendMessage",
                        text: 'title',
                        parameters: {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                       {
                                            text: 'title',
                                            url: 'https://nacho-crumbs.herokuapp.com/info/' + infoId
                                       } 
                                    ]
                                ]
                            }
                        }

    }
    return telegram;
}