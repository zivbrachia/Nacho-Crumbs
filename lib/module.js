'use strict';

const apiai = require('../lib/apiai.js');
const builder = require('../lib/botbuilder.js');
const controller = require('../lib/controller.js');
const db = require('../lib/database.js');
const facebook = require('../lib/facebook.js');
const fs = require('../lib/file_system.js');
const restify = require('../lib/restify.js');
const util = require('../lib/util.js');

module.exports.apiai = apiai;
module.exports.builder = builder;
module.exports.controller = controller;
module.exports.db = db;
module.exports.facebook = facebook;
module.exports.fs = fs;
module.exports.restify = restify;
module.exports.util = util;