/*
   Created by orange1337
*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var MODEL_NAME = 'ASSETS_LOGS';
var TABLE_NAME = 'ASSETS_LOGS';
var MODEL;

// Model without any fixed schema
var ASSETS_LOGS = new mongoose.Schema({}, {strict: false});

module.exports = function (connection) {
  if ( !MODEL ) {
    if ( !connection ) {
      connection = mongoose;
    }
    MODEL = connection.model(MODEL_NAME, ASSETS_LOGS, TABLE_NAME);
  }
  return MODEL;
};