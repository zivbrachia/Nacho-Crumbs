module.exports = {skipTemplate};

function skipTemplate(QuestionNumber) {
    let skipTemplate = {
        "templates" : ["@SkipCommand:SkipCommand "],
        "userSays" : [
            {
                "data" : [
                    {
                        "text": "דלג",
                        "alias": "SkipCommand",
                        "meta": "@SkipCommand",
                        "userDefined": false
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }

        ],
        "name" : "Question_Skip_" + QuestionNumber,
        "auto" : true,
        "contexts" : [
            "Question_" + QuestionNumber
        ],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "input.skip",
                "affectedContexts" : [],
                "parameters" : [
                    {
                        "required": false,
                        "dataType": "@SkipCommand",
                        "name": "SkipCommand",
                        "value": "$SkipCommand",
                        "defaultValue": ""
                    },
                    {
                        "name" : "address",
                        "value" : "#Question_Skip_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_Skip_" + QuestionNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : "מדלג"
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
                "name" : "Question_Skip_" + QuestionNumber
            }
        ]
    };

    return skipTemplate
}


