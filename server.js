/*
  Created by orange1337
*/
const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');
const fs            = require('fs');
const helmet        = require('helmet');
const compression   = require('compression');
const cors          = require('cors');
const swaggerJSDoc  = require('swagger-jsdoc');

const configName    = (process.env.CONFIG) ? process.env.CONFIG : 'config';
const config        = require(`./${configName}`);

const { asyncWrapper, logWrapper } = require('./utils/main.utils');
const log           = new logWrapper('server');
const logSlack      = log.customSlack(config.loggerSlack.alerts);
const wrapper       = new asyncWrapper(log);
                    
const EOS           = require('eosjs');
const eos           = EOS(config.eosConfig);

const mongoMain     = require('./db/init.db').connect(log);

// ################### exceptions
process.on('uncaughtException', (err) => {
    logSlack(` ======= UncaughtException Main Server : `, err);
});
process.on('unhandledRejection', (reason, p) => {
    log.error(`Unhandled Rejection at: reason: ${reason}`, p);
});

// ################### express middlewares
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(compression());

app.set('view engine', 'ejs');
app.set('views', './public');
app.use(express.static(path.join(__dirname, './public')));

// ################### swagger jsdoc
const swaggerSpec = swaggerJSDoc({
  definition: {
    info: {
      title: 'Simple-Assets Explorer API docs',
      version: '1.0.0',
    },
  },
  apis: ['./api/frontNFT.api.v1.js', './api/frontFT.api.v1.js'],
});
app.get('/', (req, res) => {
      res.render('index');
});
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ################### create http node express server
const debug = require('debug')('asd:server');
const http = require('http');
const port = normalizePort(process.env.PORT || '3045');
app.set('port', port);
const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// ################### Main API
require(`./api/frontNFT.api.${config.apiV}`)(app, config, log, mongoMain, eos, wrapper);
require(`./api/frontFT.api.${config.apiV}`)(app, config, log, mongoMain, eos, wrapper);

//################### socket io connection
const io = require('socket.io').listen(server);
app.use((req, res, next) => {
  req.io = io;
  next();
});
require(`./api/socket.api.${config.apiV}`)(io, app, config, log, mongoMain, eos);

// ################### catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ################### error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.error('===== Page not Found ', err);
  res.status(404).send('Page not found!');
});

function normalizePort(val) {
  let port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port; 
  return false;
}
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  let bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case 'EACCES':
      log.error(`${bind} requires elevated privileges`);
      break;
    case 'EADDRINUSE':
      log.error(`${bind} is already in use`);
      break;
    default:
      throw error;
  }
}
function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
  log.info(`Listening on ${bind}`);
}
