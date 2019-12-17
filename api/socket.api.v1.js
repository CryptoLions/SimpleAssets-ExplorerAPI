/*
   Created by eoswebnetbp1
*/

let SOCKET_MAIN = 'pool';
let SOCKET_ROOM = {};
let userCountHandler = 0;

module.exports = (io, router, config, log, mongoMain, eos) => {

  const { asyncWrapper } = require('../utils/main.utils');
  const wrapper          = new asyncWrapper(log);

  //const { HISTORY_DB, CLAIMS_DB, DELEGATES_DB } = mongoMain;
  io.walletPool = {};

  io.on('connection', socket => {
    if (socket.handshake.query && socket.handshake.query.account){
        io.walletPool[socket.handshake.query.account] = socket;
    }
    socket.join(SOCKET_MAIN);
    //metrics.users.set(userCountHandler+=1);

    socket.on('disconnect', () => {
      socket.leave(SOCKET_MAIN);
      //metrics.users.set(userCountHandler-=1);
    });
  });

  router.post('/api/v1/socket/wallet/:token', (req, res) => {
        let token = String(req.params.token);
        let act = req.body.act;
        if (token !== config.socketToken){
            log.error(`Wrong Token Secret - ${req.params.token}`);
            return res.status(500).end();
        }
        if (act.name === 'update' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.claimer].emit('update', act.data.assetids);
            req.io.walletPool[act.data.claimer].emit('notify', true);
        }
        if (act.name === 'claim' && req.io.walletPool[act.data.claimer]){
            req.io.walletPool[act.data.claimer].emit('claim', act.data.assetids);
            req.io.walletPool[act.data.claimer].emit('notify', true);
        }
        if (act.name === 'canceloffer' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('canceloffer', act.data.assetids);
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        if (act.name === 'offer' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('offer', act.data.assetids);
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        if (act.name === 'undelegate' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('undelegate', act.data.assetids);
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        if (act.name === 'burn' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('burn', act.data.assetids);
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        if ( (act.name === 'transfer' || act.name === 'delegate') && req.io.walletPool[act.data.from]){
            req.io.walletPool[act.data.from].emit('transfer-delegate', act.data.assetids);
            req.io.walletPool[act.data.from].emit('notify', true);
        }
        if (act.name === 'detach'){
            req.io.to(SOCKET_MAIN).emit('detach', act.data.assetids);
        }
        res.end();
  });

  router.post('/api/v1/socket/ft/wallet/:token', (req, res) => {
        let token = String(req.params.token);
        let act = req.body.act;
        if (token !== config.socketToken){
            log.error(`Wrong Token Secret - ${req.params.token}`);
            return res.status(500).end();
        }
        if (act.name === 'claimf' && req.io.walletPool[act.data.claimer]){
            req.io.walletPool[act.data.claimer].emit('claimf', act.data.ftofferids);
            req.io.walletPool[act.data.claimer].emit('notify', true);
        }
        if (act.name === 'cancelofferf' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('cancelofferf', act.data.ftofferids);
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        /*if (act.name === 'cancelf'){
            req.io.to(SOCKET_MAIN).emit('cancelf', act.data.ftsid);
            req.io.to(SOCKET_MAIN).emit('notify', true);
        }*/
        if (act.name === 'detachf'){
            req.io.to(SOCKET_MAIN).emit('detachf', { author: act.data.author, quantity: act.data.quantity });
        }
        if (act.name === 'offerf' && req.io.walletPool[act.data.owner]){
            req.io.walletPool[act.data.owner].emit('notify', true);
        }
        res.end();
  });

  // ### end socket 
}



