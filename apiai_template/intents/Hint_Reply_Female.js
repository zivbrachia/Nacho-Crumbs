module.exports = {hintReply};

let FemaleArr = [
            "תנסי שוב עם רמז קטן",
            "קבלי ממני רמז"
          ];

function hintReply() {
    let rightAnswerMaleLenght = FemaleArr.length;
    let hintReply = FemaleArr[Math.floor(Math.random() * rightAnswerMaleLenght)];
    return hintReply
}
