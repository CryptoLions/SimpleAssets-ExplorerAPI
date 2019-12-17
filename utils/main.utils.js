/*
	Utils functions, created by orange1337
*/
const rq    = require('request');
const slack = require('slack');

class logWrapper { 
	constructor (logName){
		this.logName = logName;
	}
	info (){
		console.log.apply(console.log, ['\x1b[36m%s\x1b[0m', `[${new Date().toISOString()}] ${this.logName} -`, ...arguments]);
	}
	error (){
		console.error.apply(console.error, ['\x1b[33m%s\x1b[0m', `[${new Date().toISOString()}] ${this.logName} -`, ...arguments]);
	}
	customSlack (config){
		return (loggingEvent, err) => {
		    console.error('\x1b[33m%s\x1b[0m', loggingEvent, err);
		    const data = {
		      token: config.token,
		      channel: config.channel_id,
		      text: `[${new Date()}] ${loggingEvent} ${err}`,
		      icon_url: config.icon_url,
		      username: config.username
		    };
		
		    slack.chat.postMessage(data, (err) => {
		      if (err) {
		        console.error('log:slack - Error sending log to slack: ', err);
		      }
		    });
		  };
	}
}

class asyncWrapper {
	constructor (log){
		this.log = log;
	}
	toStrong (promise){
		return promise.then(result => result)
				  	  .catch(err => {
			  			  	this.log.error(err);
			  			  	process.exit(1);
				  	  });
	}
	toLite (promise){
		return promise.then(result => result)
		  	  .catch(err => {
			 		  	this.log.error(err);
			 		  	return;
		  	  });
	}
	to (promise){
		return promise.then(result => [null, result])
		  	  .catch(err => [err, null]);
	}
 	pause(func, timeout, fromId){
		return setTimeout(() => { func(fromId) }, timeout);
	}
	request(options){
		return new Promise((resolve, reject) => {
          rq(options, (err, response, body) => {
                if (err){
                  return reject(err);
                }
                if (typeof body === 'object'){
                  return resolve(body);
                }
                // for empty body response 
                if (typeof body === 'undefined'){
                  return resolve();
                }
                try {
                  body = JSON.parse(body);
                } catch(e){
                  return reject(e);
                }
                resolve(body);
          });
      });
	}
	catchErr(log, err, res){
        log.error(err);
        res.status(500).end();
    }
}

/*async function asyncForEach(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
         await cb(arr[i], i, arr);
    }
}*/

module.exports = { asyncWrapper, logWrapper };
