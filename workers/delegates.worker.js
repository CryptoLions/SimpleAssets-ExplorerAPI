/*
	Delegates Worker, created by orange1337
*/
const { DELEGATES_DB, 
		log, 
		config, 
		eos, 
		wrapper 
	  } = require('./header')('delegates_daemon');

const timeout   		 	= config.daemons.timeout; // 1 sec
const elemLimitDelegates  = config.daemons.limitClaims;
const elemLimitAssets  	= config.daemons.limitAssets;

async function generateDelegatesHistory(fromId){
	  let delegatesTable = await wrapper.toStrong(eos.getTableRows({
	  			json: true,
			    code: config.assets,
			    scope: config.assets,
			    table: 'delegates',
			    table_key: 'string',
			    lower_bound: fromId,
			    upper_bound: '-1',
			    limit: elemLimitDelegates
	  }));

	  if (!delegatesTable || !delegatesTable.rows || !delegatesTable.rows.length){
	  		console.log(`==== Delegates cursor: `, fromId);
	  		return wrapper.pause(generateDelegatesHistory, timeout, 0);
	  }

	  for (let elem of delegatesTable.rows){
	  	elem.assetId = elem.assetid;
	  	elem.active  = true;
	  	await wrapper.toLite(DELEGATES_DB.updateOne({ assetId: elem.assetId }, elem, { upsert: true }));
	  }
	  let lastAssetId = Number(delegatesTable.rows[delegatesTable.rows.length - 1].assetid);
	  wrapper.pause(generateDelegatesHistory, 0, (lastAssetId) ? lastAssetId + 1 : 0);
}

/**
 * Start workers
 */
generateDelegatesHistory(0);
