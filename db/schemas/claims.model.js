/*
   Created by orange1337
*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var MODEL_NAME = 'CLAIMS';
var TABLE_NAME = 'CLAIMS';
var MODEL;

// Model without any fixed schema
var CLAIMS = new mongoose.Schema({}, {strict: false});

module.exports = function (connection) {
  if ( !MODEL ) {
    if ( !connection ) {
      connection = mongoose;
    }
    MODEL = connection.model(MODEL_NAME, CLAIMS, TABLE_NAME);
  }
  return MODEL;
};