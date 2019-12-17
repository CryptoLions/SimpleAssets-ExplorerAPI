/*
	Header require for daemons, created by orange1337
*/
const path 			= require("path");
const fs 			= require("fs");
const md5 			= require('md5');

const configName    = (process.env.CONFIG) ? process.env.CONFIG : 'config';
const config        = require(`../${configName}`);

const EOS     		= require('eosjs');
const eos     		= EOS(config.eosConfig);

module.exports = (loggerFileName) => {

	const { asyncWrapper, logWrapper } = require('../utils/main.utils');
	const log     	  = new logWrapper(loggerFileName);
	const logSlack    = log.customSlack(config.loggerSlack.alerts);
	const wrapper 	  = new asyncWrapper(log);	

	process.on('uncaughtException', (err) => {
    	logSlack(`======= UncaughtException ${loggerFileName} saemon : ${err}`);
	});
	process.on('unhandledRejection', (reason, p) => {
	    log.error(`Unhandled Rejection at: reason: ${reason}`, p);
	});

	const {  
		SETTINGS_DB, 
		CLAIMS_DB, 
		DELEGATES_DB, 
		ASSETS_DB, 
		ASSETS_LOGS_DB,
		CLAIMS_FT_DB,
		ORDERS_DB
	} = require('../db/init.db').connect(log);

	function sendSocketUpdate(act, uri){
		let options = {
			uri: `${config.host}/api/v1/socket/${uri}/${config.socketToken}`,
			method: 'POST',
			json: true,
		  	body: { act }
		};
		// send socket request without waiting for promise
		wrapper.request(options);
	}

	return {   
		      SETTINGS_DB, 
		      CLAIMS_DB,
		      DELEGATES_DB,
		      ASSETS_DB,
		      ASSETS_LOGS_DB,
		      CLAIMS_FT_DB,
		      ORDERS_DB,
		      eos, 
		      log, 
		      logSlack, 
		      config, 
		      path, 
		      fs,
		      md5,
		      sendSocketUpdate,
		      wrapper
		   };
};