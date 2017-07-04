'use strict';

let restify = require('restify');

module.exports = {createServer};
module.exports.restify = restify;

// Setup Restify Server
function createServer(port) {
    let server = restify.createServer();
    //
    server.listen(process.env.port || process.env.PORT || port || 3978, function () {
        console.log('%s listening to %s', server.name, server.url); 
    });
    return server;
}