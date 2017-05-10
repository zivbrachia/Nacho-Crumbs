module.exports = {hintTemplate};

function hintTemplate(QuestionNumber, parentId, rootParentId, speech) {
    let hintTemplate = {
        "templates" : ["@ClueCommand:ClueCommand "],
        "userSays" : [
            {
                "data" : [
                    {
                        "text": "?",
                        "alias": "ClueCommand",
                        "meta": "@ClueCommand",
                        "userDefined": true
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }
        ],
        "parentId": parentId,
        "rootParentId": rootParentId,
        "name" : "Question_Ask_" + QuestionNumber + " - hint",
        "auto" : true,
        "contexts" : [
            "Question_Ask_"+ QuestionNumber +"-followup"
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "Question_Ask_"+QuestionNumber+".hint",
                "affectedContexts" : [],
                "parameters" : [],
                "messages": [
                    {
                        "type": 0,
                        "speech": speech
                    }
                ]
            }
        ],
        "priority" : 500000,
        "cortanaCommand" : {
            "navigateOrService" : "NAVIGATE",
            "target": ""
        },
        "webhookUsed" : false,
        "webhookForSlotFilling": false,
        "fallbackIntent": false,
        "events" : []
    };

    return hintTemplate
}


