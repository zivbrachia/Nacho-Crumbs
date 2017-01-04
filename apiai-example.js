//////////////////////////////////////////////////////////////////////////////////
// Invoking Event
'use strict';

var apiai = require("apiai");

var app = apiai("b72d9f4a014542798c156effa1c9ae07");

var event = {
    name: "INVOKE_EVENT",
    data: {
        param1: "ziv",
    }
}

var options = {
    sessionId: '<UNIQE SESSION ID>'
}

var request = app.eventRequest(event, options);

request.on('response', function(response) {
    //console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
//////////////////////////////////////////////////////////////////////////////////
// create entity

var webRequest = require('request');
/* get entity/list of entities */
var options = {
  url: 'https://api.api.ai/v1/entities/3fb9ae01-f1d1-4ec3-9241-121aa9e216b3',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 456a9541d9a4408592738286911ffc53'
  }
};

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    //console.log(info);
  }
}
webRequest(options, callback);
///////////////////////////////////////////////////////////////////////////////////

// restify
var restify = require('restify');
https://docs.api.ai/docs/entities#get-entities
// Creates a JSON client
var client = restify.createJsonClient({
  url: 'https://api.api.ai/v1/entities/3fb9ae01-f1d1-4ec3-9241-121aa9e216b3'
});

var options = {
  //path: '/foo/bar',
  headers: {
    'Authorization': 'Bearer 456a9541d9a4408592738286911ffc53'
  },
};
// 
client.get(options,function(err, req, res) {
    console.log(JSON.parse(res.body));
 });
// POST
// https://docs.api.ai/docs/entities#post-entities
var data = {
    "name": "Appliances",
    "entries": [{
        "value": "Coffee Maker",
        "synonyms": ["coffee maker", "coffee machine",  "coffee"]
    }, {
        "value": "Thermostat",
        "synonyms": ["Thermostat", "heat", "air conditioning"]
    }, {
        "value": "Lights",
        "synonyms": ["lights", "light", "lamps"]
    }, {
        "value": "Garage door",
        "synonyms": ["garage door", "garage"]
    }]
};

var options1 = {
  headers: {
    'Authorization': 'Bearer 456a9541d9a4408592738286911ffc53'
    //'Content-Type': 'application/json; charset=utf-8'
  }
};

var client = restify.createJsonClient({
  url: 'https://api.api.ai/v1/entities/'
});

client.post(options1,data,function(err,req,res,obj) {
    console.log(JSON.parse(res.body));
 });

 // PUT
 // https://docs.api.ai/docs/entities#put-entities
var client = restify.createJsonClient({
  url: 'https://api.api.ai/v1/entities/'
});

var data = [
   {
      "name":"cat",
      "entries":[
         {
            "value":"cat",
            "synonyms":[
               "cat",
               "kitty"
            ]
         }
      ]
   },
   {
      "name":"dog",
      "entries":[
         {
            "value":"dog",
            "synonyms":[
               "dog",
               "puppy"
            ]
         }
      ]
   }
];

client.put(options1, data, function(err, req, res, obj) {
    console.log(JSON.parse(res.body));
});