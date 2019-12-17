# Simple-Assets Opensource Explorer API
Made with ♥ by [Cryptolions](https://cryptolions.io/)

## Dependencies

 - [Node.js v12.13.1](https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions)
 - [PM2 v2.10.4](https://pm2.io/doc/en/runtime/quick-start)
 - [MONGO DB v4](https://www.mongodb.com/)

## Setup Instructions

Install, configure and test all dependencies above before continuing

#### 1. Clone & Install packages
```
git clone https://github.com/ansigroup/SimpleAssets-ExplorerAPI.git
cd SimpleAssets-ExplorerAPI
npm install -g pm2@2.10.4
npm install
```

#### 2. Create config
`Rename example.config.js -> config.js`

#### 3. Starting
```
// Start Production ENV
1. npm start
or
2. pm2 start ecosystem.config.js
or
3. pm2-runtime start ecosystem.config.js
```
```
// Start Dev ENV
1. npm run start:dev
or
2. pm2 start dev.ecosystem.config.js
or
2. pm2-runtime start dev.ecosystem.config.js
```

## Setup with Docker

#### Example docker-compose.yml
```
version: "3"

services:

  mongodb:
    image: mongo:4.0
    restart: always
    volumes:
      - ./mongo:/data/db
    ports:
      - "27018:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=XXX
      - MONGO_INITDB_ROOT_PASSWORD=XXX

  sa_explorer:
    build:
      context: ./SimpleAssets-ExplorerAPI
      dockerfile: Dockerfile
    ports: 
      - 3045:3045
    links:
      - mongodb
    volumes:
      - ./config.js:/home/sa/config.js
```

## Mongo indexes
```
mongo
use admin;
db.auth('username', 'password');
use SIMPLE_ASSETS;

db.ASSETS.createIndex({"assetId": 1},{background: true});
db.ASSETS.createIndex({"ftid": 1},{background: true});
db.ASSETS.createIndex({"owner": 1},{background: true});
db.ASSETS.createIndex({"author": 1},{background: true});
db.ASSETS.createIndex({"status": 1},{background: true});
db.ASSETS.createIndex({"symbol": 1},{background: true});

db.CLAIMS.createIndex({"active": 1},{background: true});
db.CLAIMS.createIndex({"claimer": 1},{background: true});
db.CLAIMS.createIndex({"owner": 1},{background: true});
db.CLAIMS.createIndex({"cdate": 1},{background: true});
db.CLAIMS.createIndex({"offeredto": 1},{background: true});

db.DELEGATES.createIndex({"active": 1},{background: true});
db.DELEGATES.createIndex({"owner": 1},{background: true});
db.DELEGATES.createIndex({"cdate": 1},{background: true});

db.ASSETS_LOGS.createIndex({"act.data.assetids": 1},{background: true});
db.ASSETS_LOGS.createIndex({"act.data.assetid": 1},{background: true});
db.ASSETS_LOGS.createIndex({"receipt.global_sequence": 1},{background: true});
db.ASSETS_LOGS.createIndex({"uniqueHash": 1},{background: true});

db.FT_CLAIMS.createIndex({"active": 1},{background: true});
db.FT_CLAIMS.createIndex({"owner": 1},{background: true});
db.FT_CLAIMS.createIndex({"cdate": 1},{background: true});
db.FT_CLAIMS.createIndex({"offeredto": 1},{background: true});
db.FT_CLAIMS.createIndex({"claimid": 1},{background: true});

db.ORDERS.createIndex({"act.data.to": 1},{background: true}); 
db.ORDERS.createIndex({"act.data.from": 1},{background: true}); 
db.ORDERS.createIndex({"act.data.owner": 1},{background: true});  
db.ORDERS.createIndex({"receipt.global_sequence": 1},{background: true}); 
db.ORDERS.createIndex({"uniqueHash": 1},{background: true});
```














