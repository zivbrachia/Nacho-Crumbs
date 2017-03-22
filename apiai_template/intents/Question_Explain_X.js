module.exports = {explainTemplate};

function explainTemplate(QuestionNumber, explainText, rightAnswer) {
    let explainTemplate = {
        "templates" : [],
        "userSays" : [],
        "name" : "Question_Explain_" + QuestionNumber,
        "auto" : true,
        "contexts" : [],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.explain",
                "affectedContexts" : [
                    {
                        "name" : "answer_replay_male",
                        "lifespan" : 1
                    }
                ],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Question_Explain_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_Explain_" + QuestionNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : explainText + "[\u003e\u003e]"    // [>>]
                    },
                    {
                        "title" : "[\u003e\u003e]",
                        "replies" : [
                            "המשך"
                        ],
                        "type" : 2

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
                "name" : "Question_Explain_" + QuestionNumber
            }
        ]
    };

    return explainTemplate
}