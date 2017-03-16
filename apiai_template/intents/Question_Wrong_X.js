module.exports = {wrongTemplate};

function wrongTemplate(QuestionNumber, wrongAnswer1, wrongAnswer2, wrongAnswer3) {
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
        "name" : "Question_Wrong_" + QuestionNumber,
        "auto" : true,
        "contexts" : [
            "Question_" + QuestionNumber
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.wrong",
                "affectedContexts" : [],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Question_Wrong_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_Wrong_" + QuestionNumber + ".userData"
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
                "name" : "Question_Wrong_" + QuestionNumber
            }
        ]
    };

    return wrongTemplate
}


