/*
   API for Non Fungible Tokens, created by orange1337
*/
const path = require('path');

module.exports = (router, config, log, mongoMain, eos, wrapper) => {
	
	const elemLimit 		= config.daemons.limitSells;
	const limitProducts 	= 100;
	const limitExplorer 	= 20;

	const {  
    		SETTINGS_DB, 
    		CLAIMS_DB, 
    		DELEGATES_DB, 
    		ASSETS_DB, 
    		ASSETS_LOGS_DB
    } = mongoMain;
	
	/**
     * @swagger
     *
     * /api/v1/explorer:
     *   get:
     *     description: Assets List
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: skip
   	 *         in: query
   	 *         required: false
   	 *         type: number
     *       - name: limit
     *         in: query
   	 *         required: false
   	 *         type: number
   	 *       - name: searchString
   	 *         in: query
   	 *         required: false
   	 *         type: string
     */
	router.get('/api/v1/explorer', async (req, res) => {
		let match 		 = { status: 'ACTIVE' };
		let searchString 		 = (req.query.searchString && req.query.searchString !== 'undefined') ? String(req.query.searchString): null;
		let skip 		 = (!isNaN(Number(req.query.skip))) ? Number(req.query.skip) : 0;
		let limit 		 = (!isNaN(Number(req.query.limit))) ? Number(req.query.limit) : limitExplorer;

		if (isNaN(limit) || limit > limitProducts || limit < 0){
			return res.status(401).send(`Wrong limit ${limit}`);
		}
		if (isNaN(skip) || skip < 0){
			return res.status(401).send(`Wrong skip ${limit}`);
		}
		if (searchString){
			match = { $or: [{ owner: searchString }, { author: searchString }, { assetId: searchString}, { ftid: searchString }], status: 'ACTIVE' };
		}

		let [err, assets] = await wrapper.to(ASSETS_DB.find(match).sort({ assetId: -1 }).skip(skip).limit(limit));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(assets);
	});

	/**
     * @swagger
     *
     * /api/v1/asset/{assetId}:
     *   get:
     *     description: Asset by ID
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: assetId
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/asset/:assetId', async (req, res) => {
		let assetId = String(req.params.assetId);
		if (isNaN(assetId) || assetId === 'undefined'){
			return res.status(500).end();
		}
		let [err, asset] = await wrapper.to(ASSETS_DB.findOne({ assetId }));
		if (err){
			return res.status(500).end();
		}
		res.json(asset);
	});

	/**
     * @swagger
     *
     * /api/v1/claims/{account}:
     *   get:
     *     description: Claims NFT, NTT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/claims/:account', async (req, res) => {
		let account 	  = String(req.params.account);
		let [err, claims] = await wrapper.to(assetJoinQuery(CLAIMS_DB, { offeredto: account, active: true }, 0, 0, { cdate: -1 }));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(claims);
	});

	/**
     * @swagger
     *
     * /api/v1/delegates/{account}:
     *   get:
     *     description: Delegates
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/delegates/:account', async (req, res) => {
		let account 	 = String(req.params.account);
		let [err, items] = await wrapper.to(assetJoinQuery(DELEGATES_DB, {active: true, owner: account}, 0, 0));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(items);
	});

	/**
     * @swagger
     *
     * /api/v1/canceloffers/{account}:
     *   get:
     *     description: Cancel Offers NFT, NTT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/canceloffers/:account', async (req, res) => {
		let account 	 = String(req.params.account);
		let [err, items] = await wrapper.to(assetJoinQuery(CLAIMS_DB, {active: true, owner: account}, 0, 0));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(items);
	});

	/**
     * @swagger
     *
     * /api/v1/logs:
     *   get:
     *     description: Asset Logs by ID
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: assetId
   	 *         in: query
   	 *         required: true
   	 *         type: number
   	 *       - name: skip
   	 *         in: query
   	 *         required: false
   	 *         type: number
     *       - name: limit
     *         in: query
   	 *         required: false
   	 *         type: number
     */
	router.get('/api/v1/logs', async (req, res) => {
		let assetId = String(req.query.assetId); 
		let skip 	= (!isNaN(Number(req.query.skip))) ? Number(req.query.skip) : 0;
		let limit 	= (!isNaN(Number(req.query.limit))) ? Number(req.query.limit) : 20;

		if (isNaN(limit) || limit > limitProducts || limit < 0){
			return res.status(401).send(`Wrong limit ${limit}`);
		}
		if (isNaN(skip) || skip < 0){
			return res.status(401).send(`Wrong skip ${limit}`);
		}
		let query = {$or: [{'act.data.assetids': assetId}, {'act.data.assetid': assetId}]};
		let [err, items] = await wrapper.to(ASSETS_LOGS_DB.find(query).sort({ 'receipt.global_sequence': -1 }).skip(skip).limit(limit));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(items);
	});

	/**
     * @swagger
     *
     * /api/v1/notify/{account}:
     *   get:
     *     description: Count (Claims, Delegates, Offers) NFT, NTT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/notify/:account', async (req, res) => {
		let account 	= String(req.params.account);
		let claims 		= CLAIMS_DB.find({offeredto: account, active: true}).countDocuments();
		let delegates 	= DELEGATES_DB.find({owner: account, active: true}).countDocuments();
		let cancel 		= CLAIMS_DB.find({owner: account, active: true}).countDocuments();

		try {
			claims 		= await claims;
			delegates 	= await delegates;
			cancel 		= await cancel;
		} catch(e){
			log.error(err);
			return res.status(500).end();
		}
		res.json({claims, delegates, cancel});
	});

	/**
	 * Custom functions
	 */
	function assetJoinQuery(DB, match, skip = 0, limit = limitProducts, sort = {assetId: -1}){
		let matchQuery = [{ $match: match }];
		if (sort){
			matchQuery.push({ $sort: sort })
		}
		if (skip !== 0){
			matchQuery.push({ $skip: skip })
		}
		if (limit !== 0){
			matchQuery.push({ $limit: limit })
		}
		return DB.aggregate([
			...matchQuery,
			{
      			$lookup: {
      			   from: "ASSETS",
      			   localField: "assetId", 
      			   foreignField: "assetId",
      			   as: "itemData"
      			}
			},
   			{
   			   $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$itemData", 0 ] }, "$$ROOT" ] } }
   			},
   			{ $project: { itemData: 0 } }
	    ]);
	}

 
}; // ============== end of exports
























