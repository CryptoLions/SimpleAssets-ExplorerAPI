/*
  Created by orange1337
*/
let config = {};

config.host = 'http://localhost:3045';

config.assets = 'simpleassets';

// mongo uri and options
config.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/SIMPLE_ASSETS';
config.MONGO_OPTIONS = {
    socketTimeoutMS: 30000,
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Socket Token
config.socketToken = 'test123456';

// api url for history
config.daemons = {
    timeout: 1000, // 1 sec
    limitSells: 100,
    limitAssets: 1,
    limitClaims: 100,
    limitDelegates: 100,
    timeoutHistory: 3000 // 3sec
};
config.historyChain = "https://junglehistory.cryptolions.io:4433",
config.eosConfig    = {
  chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
  keyProvider: "",
  httpEndpoint: "https://jungle2.cryptolions.io",
  expireInSeconds: 60,
  broadcast: true,
  debug: false,
  sign: true
};

config.updateHistoryTime = 60; // every 5 sec
config.apiV = 'v1'; // api version

// slack notifications
config.loggerSlack = {
      alerts: {
        type: 'slack',
        token: '',
        channel_id: '',
        username: 'System bot',
      }
};

module.exports = config;


