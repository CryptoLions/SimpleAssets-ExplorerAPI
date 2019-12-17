/*
   Created by orange1337
*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var MODEL_NAME = 'ORDERS';
var TABLE_NAME = 'ORDERS';
var MODEL;

// Model without any fixed schema
var ORDERS = new mongoose.Schema({}, {strict: false});

module.exports = function (connection) {
  if ( !MODEL ) {
    if ( !connection ) {
      connection = mongoose;
    }
    MODEL = connection.model(MODEL_NAME, ORDERS, TABLE_NAME);
  }
  return MODEL;
};



