/*
	Init DB, created by orange1337
*/
const configName    = (process.env.CONFIG) ? process.env.CONFIG : 'config';
const config        = require(`../${configName}`);

const mongoose      = require("mongoose");
mongoose.Promise  	= global.Promise;

const connect = (log) => {
	const mongoMain = mongoose.createConnection(config.MONGO_URI, config.MONGO_OPTIONS,
	 (err) => {
	    if (err){
	      log.error(err);
	      process.exit(1);
	    }
	    log.info(`[Connected to Mongo]`);
	});

	const SETTINGS_DB  		= require('./schemas/global.model')(mongoMain);
	const CLAIMS_DB    		= require('./schemas/claims.model')(mongoMain);
	const DELEGATES_DB 		= require('./schemas/delegates.model')(mongoMain);
	const ASSETS_DB    		= require('./schemas/assets.model')(mongoMain);
	const ASSETS_LOGS_DB 	= require('./schemas/assets.logs.model')(mongoMain);
	const ORDERS_DB 		= require('./schemas/orders.model')(mongoMain);

	/**
	 * Fungible Tokens Tables
	 */
	const CLAIMS_FT_DB  = require('./schemas/ft.claims.model')(mongoMain);

	return { 
		SETTINGS_DB, 
		CLAIMS_DB,
		DELEGATES_DB,
		ASSETS_DB,
		ASSETS_LOGS_DB,
		CLAIMS_FT_DB,
		ORDERS_DB
	};
};

module.exports = { connect };