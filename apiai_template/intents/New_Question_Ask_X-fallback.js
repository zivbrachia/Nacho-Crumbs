module.exports = {fallbackTemplate};

function fallbackTemplate(QuestionNumber, parentId, rootParentId, speech, arrReplies) {
    let fallbackTemplate = {
        "templates" : [],
        "userSays" : [],
        "parentId": parentId,
        "rootParentId": rootParentId,
        "name" : "Question_Ask_" + QuestionNumber + " - fallback",
        "auto" : true,
        "contexts" : [
            "Question_Ask_" + QuestionNumber + "-followup"
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "Question_Ask_" + QuestionNumber + ".fallback",
                "affectedContexts" : [],
                "parameters" : [],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : speech + "[\u003e\u003e]"    // [>>]
                    },
                    {
                        "title" : "[\u003e\u003e]",
                        "replies" : [
                            arrReplies[0], arrReplies[1], arrReplies[2], arrReplies[3]
                        ],
                        "type" : 2
                    }
                ]
            }
        ],
        "priority" : 500000,
        "webhookUsed" : false,
        "webhookForSlotFilling": false,
        "fallbackIntent": true,
        "events" : []
    };

    return fallbackTemplate
}