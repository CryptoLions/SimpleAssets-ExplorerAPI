/*
   Created by orange1337
*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var MODEL_NAME = 'FT_CLAIMS';
var TABLE_NAME = 'FT_CLAIMS';
var MODEL;

// Model without any fixed schema
var FT_CLAIMS = new mongoose.Schema({}, {strict: false});

module.exports = function (connection) {
  if ( !MODEL ) {
    if ( !connection ) {
      connection = mongoose;
    }
    MODEL = connection.model(MODEL_NAME, FT_CLAIMS, TABLE_NAME);
  }
  return MODEL;
};