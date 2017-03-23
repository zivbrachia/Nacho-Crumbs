module.exports = {hintTemplate};

function hintTemplate(QuestionNumber, hintText) {
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
        "name" : "Question_Hint_" + QuestionNumber,
        "auto" : true,
        "contexts" : [
            "Question_" + QuestionNumber
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.hint",
                "affectedContexts" : [
                    {
                        "name" : "Question_" + QuestionNumber,
                        "lifespan" : 1
                    }
                ],
                "parameters" : [
                    {
                        "dataType" : "@ClueCommand",
                        "name" : "ClueCommand",
                        "value" : "$ClueCommand",
                        "defaultValue" : ""
                    },
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
                        "speech" : hintText + "[\u003e\u003e]"
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
                "name" : "Question_Hint_" + QuestionNumber
            }
        ]
    };

    return hintTemplate
}


