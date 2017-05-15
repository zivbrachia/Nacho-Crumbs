module.exports = {questionTemplate};

function questionTemplate(QuestionNumber, Category, SubCategory, questionText, arrReplies) {
    let questionTemplate = {
        "templates" : ["שאלה" + QuestionNumber],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : "שאלה" + QuestionNumber
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }

        ],
        "name" : "Question_Ask_" + QuestionNumber,
        "auto" : true,
        "contexts" : [],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "Question_Ask_"+QuestionNumber+".question",
                "affectedContexts" : [
                    {
                        "name" : "Question_" + QuestionNumber,
                        "lifespan" : 1
                    },
                    {
                        "name" : "Category_" + Category,
                        "lifespan" : 1
                    },
                    {
                        "name" : "SubCategory_" + SubCategory,
                        "lifespan" : 1
                    },
                    {
                        "name": "Question_Ask_"+QuestionNumber+"-followup",
                        "parameters": {},
                        "lifespan": 2
                    }
                ],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Question_Ask_" + QuestionNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Question_Ask_" + QuestionNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : questionText + "[\u003e\u003e]"    // [>>]
                    },
                    {
                        "title" : "[\u003e\u003e]",
                        "replies" : [
                            arrReplies[0], arrReplies[1], arrReplies[2], arrReplies[3]
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
                "name" : "Question_Ask_" + QuestionNumber
            }
        ]
    };

    return questionTemplate
}