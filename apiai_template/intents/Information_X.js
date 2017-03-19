module.exports = {infoTemplate};

function infoTemplate(InfoNumber, Category, SubCategory, infoShort) {
    let infoTemplate = {
        "templates" : ["מידע" + InfoNumber],
        "userSays" : [
            {
                "data" : [
                    {
                        "text" : "מידע" + InfoNumber
                    }
                ],
                "isTemplate" : false,
                "count" : 0
            }

        ],
        "name" : "Information_" + InfoNumber,
        "auto" : true,
        "contexts" : [],
        "responses" : [
            {
                "resetContexts" : false,
                "action": "output.information",
                "affectedContexts" : [
                    {
                        "name" : "answer_reply_male",
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
                        "name" : "Information_1",
                        "lifespan" : 1
                    }
                ],
                "parameters" : [
                    {
                        "name" : "address",
                        "value" : "#Information_" + InfoNumber + ".address"
                    },
                    {
                        "name" : "userData",
                        "value" : "#Information_" + InfoNumber + ".userData"
                    }
                ],
                "messages" : [
                    {
                        "type" : 0,
                        "speech" : infoShort + "[\u003e\u003e]"
                    },
                    {
                        "title" : "[\u003e\u003e]",
                        "replies" : [
                            "רוצה להרחיב את המידע",
                            "בוא נמשיך לתרגל"
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
                "name" : "Information_" + InfoNumber
            }
        ]
    };

    return infoTemplate
}


