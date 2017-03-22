module.exports = {hintAskTemplate};

function hintAskTemplate(QuestionNumber, hintText) {
    let hintAskTemplate = {
        "templates" : ["שאלה" + QuestionNumber + "א"],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : "שאלה" + QuestionNumber + "א"
                    }
                ],
                "isTemplate" : false,
                "count" : 1
            }
        ],
        "name" : "Question_HintAsk_" + QuestionNumber,
        "auto" : true,
        "contexts" : [],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.hint_ask",
                "affectedContexts" : [
                    {
                        "name" : "Question_" + QuestionNumber,
                        "lifespan" : 1
                    }
                ],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Question_HintAsk_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_HintAsk_" + QuestionNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : hintText + "[\u003e\u003e]"    // [>>]
                    },
                    {
                        "title" : "[\u003e\u003e]",
                        "replies" : [
                            "לחזור לשאלה"
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
                "name" : "Question_HintAsk_" + QuestionNumber
            }
        ]
    };

    return hintAskTemplate
}