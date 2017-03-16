module.exports = {questionTemplate};

function questionTemplate(QuestionNumber, Category, SubCategory, questionText, rightAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3) {
    let questionTemplate = {
        "templates" : [QuestionNumber + "שאלה"],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : QuestionNumber + "שאלה"
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
                "action": "input.question",
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
                            rightAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3
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


