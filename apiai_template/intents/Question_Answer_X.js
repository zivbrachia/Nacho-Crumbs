module.exports = {answerTemplate};

function answerTemplate(QuestionNumber, rightAnswer) {
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
        "name" : "Question_Answer_" + QuestionNumber,
        "auto" : true,
        "contexts" : [
            "Question_" + QuestionNumber
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.right",
                "affectedContexts" : [],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Question_Answer_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_Answer_" + QuestionNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : []
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
        "events" : [
            {
                "name" : "Question_Answer_" + QuestionNumber
            }
        ]
    };

    return answerTemplate
}


