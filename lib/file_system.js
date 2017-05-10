'use strict';

let fs = require('fs');

module.exports = {readFileSync};

function readFileSync(fullPathName) {
    //let html = fs.readFileSync(__dirname + '/public/add_question.html', 'utf8');
    let file = fs.readFileSync(fullPathName, 'utf8');
    return file;
}