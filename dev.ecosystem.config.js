module.exports = {
  apps : [{
    name: `api`,
    script    : `./server.js`,
    watch: true
  },
  {
    name        : `claims_table`,
    script      : `./workers/claims.worker.js`,
    watch: true
  },
  {
    name        : `delegates_table`,
    script      : `./workers/delegates.worker.js`,
    watch: true
  },
  {
    name        : `assets_history`,
    script      : `./workers/assets.history.worker.js`,
    watch: true
  }]
}