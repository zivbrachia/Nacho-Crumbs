module.exports = {wrongTemplate};

function wrongTemplate(QuestionNumber, parentId, rootParentId, wrongAnswer1, wrongAnswer2, wrongAnswer3, speech) {
    let wrongTemplate = {
        "templates" : [wrongAnswer1, wrongAnswer2, wrongAnswer3],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : wrongAnswer1
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            },
            {
                "data" : [
                    {
                        "text" : wrongAnswer2
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            },
            {
                "data" : [
                    {
                        "text" : wrongAnswer3
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }

        ],
        "parentId": parentId,
        "rootParentId": rootParentId,
        "name" : "Question_Ask_" + QuestionNumber + " - no",
        "auto" : true,
        "contexts" : [
            "Question_Ask_" + QuestionNumber + "-followup"
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "Question_Ask_" + QuestionNumber + ".no",
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

    return wrongTemplate
}


