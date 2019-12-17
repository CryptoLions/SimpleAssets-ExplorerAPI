/**
 * API for Fungible Tokens, created by orange1337
 */

module.exports = (router, config, log, mongoMain, eos, wrapper) => {

	const elemLimit = config.daemons.limitSells;
	const limitDef  = 100;

	const { CLAIMS_FT_DB } = mongoMain;

    const assetJoinQuery = (DB, match, skip = 0, limit = limitDef, sort = {sellid: -1}) => {
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
      			   localField: "ftid", 
      			   foreignField: "ftid",
      			   as: "orderData"
      			}
			},
   			{
   			   $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$orderData", 0 ] }, "$$ROOT" ] } }
   			},
   			{ $project: { orderData: 0 } }
	    ]);
	}

	/**
     * @swagger
     *
     * /api/v1/ft/claims/{account}:
     *   get:
     *     description: Claims FT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/ft/claims/:account', async (req, res) => {
		let skip 		= Number(req.query.skip) || 0;
		let limit 		= Number(req.query.limit) || limitDef;
		if (skip < 0){
			res.status(401).send(`Wrong Skip ${skip}`)
		}
		if (limit <= 0 || limit > limitDef){
			res.status(401).send(`Limit from 0 till ${limitDef}`)
		}
		let offeredto = String(req.params.account);
		let match  	  = { active: true, offeredto };

		let [err, items] = await wrapper.to(assetJoinQuery(CLAIMS_FT_DB, match, skip, limit));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(items);
	});

	/**
     * @swagger
     *
     * /api/v1/ft/canceloffers/{account}:
     *   get:
     *     description: Cancel Offers FT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/ft/canceloffers/:account', async (req, res) => {
		let skip 		= Number(req.query.skip) || 0;
		let limit 		= Number(req.query.limit) || limitDef;
		if (skip < 0){
			res.status(401).send(`Wrong Skip ${skip}`)
		}
		if (limit <= 0 || limit > limitDef){
			res.status(401).send(`Limit from 0 till ${limitDef}`)
		}
		let owner = String(req.params.account);
		let match = { active: true, owner };

		let [err, items] = await wrapper.to(assetJoinQuery(CLAIMS_FT_DB, match, skip, limit));
		if (err){
			log.error(err);
			return res.status(500).end();
		}
		res.json(items);
	});

	/**
     * @swagger
     *
     * /api/v1/ft/notify/{account}:
     *   get:
     *     description: Count (Claims, Delegates, Offers) FT
     *     produces:
     *       - application/json
     *     parameters:
   	 *       - name: account
   	 *         in: path
   	 *         required: true
   	 *         type: string
     */
	router.get('/api/v1/ft/notify/:account', async (req, res) => {
		let account 	= String(req.params.account);
		let claims 		= CLAIMS_FT_DB.find({offeredto: account, active: true}).countDocuments();
		let cancel 		= CLAIMS_FT_DB.find({owner: account, active: true}).countDocuments();

		try {
			claims = await claims;
			cancel = await cancel;
		} catch(e){
			log.error(err);
			return res.status(500).end();
		}
		res.json({claims, cancel});
	});
}



