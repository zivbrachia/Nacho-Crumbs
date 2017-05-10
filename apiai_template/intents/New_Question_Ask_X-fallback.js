module.exports = {fallbackTemplate};

function fallbackTemplate(QuestionNumber, parentId, rootParentId, speech) {
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
                "messages": [
                    {
                        "type": 0,
                        "speech": speech /* hint text */
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