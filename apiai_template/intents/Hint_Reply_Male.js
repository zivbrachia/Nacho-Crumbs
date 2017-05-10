module.exports = {hintReply};

let MaleArr = [
            "תנסה שוב עם רמז קטן",
            "קבל ממני רמז"
          ];

function hintReply() {
    let rightAnswerMaleLenght = MaleArr.length;
    let hintReply = MaleArr[Math.floor(Math.random() * rightAnswerMaleLenght)];
    return hintReply
}
