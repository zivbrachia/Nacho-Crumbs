module.exports = {answerTemplate};

function answerTemplate(QuestionNumber, rightAnswer, parentId, rootParentId, speech) {
    let answerTemplate = {
        "templates" : [rightAnswer],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : rightAnswer
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }

        ],
        "parentId": parentId,
        "rootParentId": rootParentId,
        "name" : "Question_Ask_" + QuestionNumber +" - yes",
        "auto" : true,
        "contexts" : [
            "Question_Ask_" + QuestionNumber + "-followup"
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "Question_Ask_"+ QuestionNumber +".yes",
                "affectedContexts" : [],
                "parameters": [
                    {
                    "name": "address",
                    "value": "#Question_Ask_"+ QuestionNumber +"-followup.address"
                    },
                    {
                    "name": "userData",
                    "value": "#Question_Ask_"+ QuestionNumber +"-followup.userData"
                    }
                ],
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

    return answerTemplate
}


