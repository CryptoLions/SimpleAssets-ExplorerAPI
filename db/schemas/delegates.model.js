/*
   Created by orange1337
*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var MODEL_NAME = 'DELEGATES';
var TABLE_NAME = 'DELEGATES';
var MODEL;

// Model without any fixed schema
var DELEGATES = new mongoose.Schema({}, {strict: false});

module.exports = function (connection) {
  if ( !MODEL ) {
    if ( !connection ) {
      connection = mongoose;
    }
    MODEL = connection.model(MODEL_NAME, DELEGATES, TABLE_NAME);
  }
  return MODEL;
};