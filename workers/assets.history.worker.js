/*
	History aggregation Worker, created by orange1337  
*/
const { 
		CLAIMS_DB, 
		CLAIMS_FT_DB, 
		SETTINGS_DB, 
		ORDERS_DB, 
		DELEGATES_DB, 
		ASSETS_LOGS_DB,
		ASSETS_DB,
		eos, 
		log, 
		config, 
		md5,
		sendSocketUpdate,
		wrapper
	  } = require('./header')('assets_daemon');

const elemLimitAssets = config.daemons.limitAssets;
const timeout  		  = config.daemons.timeoutHistory;
let globalHashes 	  = {};

/**
 * [aggregateHistoryAssets - Aggregate history from Assets contract]
 */

async function aggregateHistoryAssets(){
	let settings = await wrapper.toStrong(SETTINGS_DB.findOne({}));
	if (!settings){
		settings = new SETTINGS_DB();
		await wrapper.toStrong(settings.save());
	}
	await getAssetsActions(settings);
	
	await wrapper.toStrong(settings.save());
	console.log('===== END assets aggregation', settings);
	setTimeout(aggregateHistoryAssets, timeout);
}
	
async function getAssetsActions(settings){
	let limit = 1000;
	let skip  = settings.cursor_assets;
	console.log('===== assets skip =====', skip);
	let options = {
		uri: `${config.historyChain}/v1/history/get_actions`,
		method: 'POST',
		json: true,
	  	body: {
	  		account_name: config.assets,
	  		pos: skip,
	  		offset: limit
	  	}
	}
	let [err, data] = await wrapper.to(wrapper.request(options));
	if (err){
		log.error(`[Error request ASSETS] ${options.uri}`);
		return;
	}
	if (data.actions.length === 0) return;
	await saveAssetsActions(data);
	settings.cursor_assets += data.actions.length;
	getAssetsActions(settings);
}
	
async function saveAssetsActions(data){
	for (let elem of data.actions){
		delete elem._id;
		if (elem.act){
			elem.action_trace = { act: elem.act, 
								  trx_id: elem.trx_id, 
								  receipt: elem.receipt, 
								  block_time: elem.block_time 
								};
		}
		let act = elem.action_trace.act;
		let ifArray = act.data && act.data.assetids;
		let hash = md5(elem.action_trace.trx_id + elem.action_trace.act.hex_data);

		if (globalHashes[hash]){
			delete globalHashes[hash];
		} else {
			globalHashes[hash] = true;
			if (act.name === 'transfer' && ifArray) {
				let owner   		=  act.data.to;
				let ids 			=  act.data.assetids;
				let transferTables 	=  wrapper.toLite(DELEGATES_DB.updateMany({ owner, assetId: { $in: ids } }, { active: false }));
				let assetsLogs 		=  saveAssetsLogs(elem, hash);
				
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT(ids, owner, act);
				await assetsLogs;
				await transferTables;
			}
			if (act.name === 'createlog') {
				if (typeof act.data === 'string'){
					act.data = await unpackAction(act.data);
				}
				let scope = (act.data.requireclaim) ? act.data.author: act.data.owner;
				await saveAssetNFT([act.data.assetid], scope, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'update') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT([act.data.assetid], act.data.owner, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'burn') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'claim' && ifArray) {
				sendSocketUpdate(act, 'wallet');
				await wrapper.toLite(CLAIMS_DB.updateMany({ assetId: { $in: act.data.assetids } }, { active: false }));
				await saveAssetNFT(act.data.assetids, act.data.claimer, act);
			}
			if (act.name === 'offer') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT(act.data.assetids, act.data.owner, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'canceloffer' && ifArray) {
				let owner 			 =  act.data.newowner ? act.data.newowner : act.data.owner;
				let claimsOperation  =  wrapper.toLite(CLAIMS_DB.updateMany({ assetId: { $in: act.data.assetids } }, { active: false, owner }));
				let ordersLogs  	 =  saveOrdersLogs(elem, hash);
				let assetsLogs 		 =  saveAssetsLogs(elem, hash);
	
				sendSocketUpdate(act, 'wallet');
				await claimsOperation;
				await ordersLogs;
				await assetsLogs;
			}
			if (act.name === 'delegate') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT(act.data.assetids, act.data.to, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'undelegate' && ifArray) {
				let delegatesTables = wrapper.toLite(DELEGATES_DB.updateMany({ assetId: { $in: act.data.assetids } }, { active: false }));
				let assetsLogs 		= saveAssetsLogs(elem, hash);
	
				await delegatesTables;
				await assetsLogs;
			}
			if (act.name === 'detach' || act.name === 'attach') {
				let status = (act.name === 'attach') ? 'ATTACHED' : 'ACTIVE';
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT(act.data.assetids, act.data.owner, act, status);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'issuef') {
				let symbol = act.data.quantity.split(" ")[1];
				await saveAssetFT(act.data.author, symbol);
			}
			if (act.name === 'detachf' || act.name === 'attachf') {
				sendSocketUpdate(act, 'ft/wallet');
				await saveAssetNFT([act.data.assetidc], act.data.owner, act);
			}
			if (act.name === 'updatef') {
				let symbol = act.data.sym.split(",")[1];
				await saveAssetFT(act.data.author, symbol);
			}
			if (act.name === 'offerf' && act.data.owner !== config.market){
				sendSocketUpdate(act, 'ft/wallet');
			}
			if (act.name === 'claimf' || act.name === 'cancelofferf') {
				sendSocketUpdate(act, 'ft/wallet');
				await wrapper.toLite(CLAIMS_FT_DB.updateMany({ claimid: { $in: act.data.ftofferids } }, { active: false }));
			}

			/**
			 * NTT
			 */
			if (act.name === 'createnttlog') {
				let scope = (act.data && act.data.requireclaim) ? act.data.author: act.data.owner;
				await saveAssetNFT([act.data.assetid], scope, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'updatentt') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetNFT([act.data.assetid], act.data.owner, act);
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'burnntt') {
				sendSocketUpdate(act, 'wallet');
				await saveAssetsLogs(elem, hash);
			}
			if (act.name === 'claimntt' && ifArray) {
				sendSocketUpdate(act, 'wallet');
				await wrapper.toLite(CLAIMS_DB.updateMany({ assetId: { $in: act.data.assetids } }, { active: false }));
				await saveAssetNFT(act.data.assetids, act.data.claimer, act);
			}
		}
	}
}

function saveAssetsLogs(elem, hash){
	return wrapper.toLite(ASSETS_LOGS_DB.updateOne({ uniqueHash: hash }, elem.action_trace, { upsert: true }));
}
function saveOrdersLogs(elem, hash){
	return wrapper.toLite(ORDERS_DB.updateOne({ uniqueHash: hash }, elem.action_trace, { upsert: true }));
}
async function saveAssetNFT(ids, scope, act, status = 'ACTIVE'){
	if (status === 'ATTACHED'){
		return await wrapper.toLite(ASSETS_DB.updateMany({ assetId: { $in: ids } }, { status: 'ATTACHED' }));
	}
	let table = 'sassets';
	let type  = 'NFT';
	if (act.name.indexOf('ntt') >= 0) {
		table = 'snttassets';
		type  = 'NTT';
	}
	await Promise.all(ids.map(async (assetId) => {
		 let [err, item] = await wrapper.to(eos.getTableRows({
		 		json: true,
    			code:  config.assets,
    			scope: scope,
    			table,
    			table_key: 'id',
    			lower_bound: `${assetId}`,
    			upper_bound: `${assetId}0`,
    			limit: elemLimitAssets
		 }));
		 if (err){
		 	log.error(err);
		 }
		 if (item && item.rows && item.rows[0]){
		 	let objUpdate = {
		 			mdata: item.rows[0].mdata,
		 			idata: item.rows[0].idata,
		 			author: item.rows[0].author,
		 			container: item.rows[0].container,
		 			containerf: item.rows[0].containerf,
		 			category: item.rows[0].category,
		 			owner: scope,
		 			status,
		 			type
		 	};
		 	await wrapper.toLite(ASSETS_DB.updateOne({ assetId }, objUpdate, {upsert: true}));
		 }
	}));
}
async function saveAssetFT(author, symbol){
	let [err, item] = await wrapper.to(eos.getTableRows({
	 	json: true,
    	code:  config.assets,
    	scope: author,
    	table: 'stat',
    	table_key: 'id',
    	lower_bound: `${symbol}`,
    	upper_bound: `${symbol}ZZZZZZZ`,
    	limit: elemLimitAssets
	}));
	if (err){
	 	log.error(err);
	}
	if (item && item.rows && item.rows[0]){
	 	let objUpdate = {
	 			supply: item.rows[0].supply,
	 			max_supply: item.rows[0].max_supply,
	 			issuer: item.rows[0].issuer,
	 			authorctrl: item.rows[0].authorctrl,
	 			data: item.rows[0].data,
	 			ftid: item.rows[0].id,
	 			assetId: item.rows[0].id,
	 			symbol: symbol,
	 			type: 'FT',
	 			status: 'ACTIVE'
	 	};
	 	await wrapper.toLite(ASSETS_DB.updateOne({ftid: objUpdate.ftid}, objUpdate, {upsert: true}));
	}
}

const Fcbuffer = require('fcbuffer');
const createlogNoClaim = {
	account_name: 'uint64',
    message: { 
        fields: { 
          author: 'account_name',
   		  category: 'account_name',
   		  owner: 'account_name',
   		  idata: 'string',
   		  mdata: 'string',
   		  assetid: 'uint64'
   		}
    }
};
const createlog = {
	account_name: 'uint64',
    message: { 
        fields: { 
          author: 'account_name',
   		  category: 'account_name',
   		  owner: 'account_name',
   		  idata: 'string',
   		  mdata: 'string',
   		  assetid: 'uint64',
   		  requireclaim: 'uint8'
   		}
    }
};
const noClaim 	= Fcbuffer(createlogNoClaim).structs.message;
const assetLog 	= Fcbuffer(createlog).structs.message;

async function unpackAction(action){
	let data = {}, assetIdData = {};
	let buff = Buffer.from(action, 'hex');
	try {
		data = Fcbuffer.fromBuffer(assetLog, buff);
	} catch(e){
		console.error('asset missed requireclaim');
		try {
			let mycontract = await eos.contract(config.assets, { accounts: [config.eosConfig] });
			assetIdData = mycontract.fc.fromBuffer('create', action);
			data = Fcbuffer.fromBuffer(noClaim, buff);
			if (assetIdData.author && assetIdData.owner && assetIdData.category){
				data.author = assetIdData.author;
				data.owner  = assetIdData.owner;
				data.category = assetIdData.category;
			}
		} catch(e){
			console.error(`wrong packed action`);
		}
	}
	return data;
}

/**
 * Start history daemons aggregation
 */
aggregateHistoryAssets();

