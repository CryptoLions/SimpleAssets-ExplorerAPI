module.exports = {
  apps : [{
    name: `api`,
    script    : `./server.js`,
    //instances : `2`,
    //exec_mode : `cluster`
  },
  {
    name        : `claims_table`,
    script      : `./workers/claims.worker.js`
  },
  {
    name        : `delegates_table`,
    script      : `./workers/delegates.worker.js`,
  },
  {
    name        : `assets_history`,
    script      : `./workers/assets.history.worker.js`
  }]
}