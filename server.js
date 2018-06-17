'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./lib/config');
const boom = require('express-boom');
const bodyParser = require('body-parser');
const swagger = require('swagger-express-router');
const swaggerDocument = require('./swagger.json');
const useBasePath = true;
const middlewareObj = {
    'global': require('./lib/controllers/global/global'),
    'player': require('./lib/controllers/player/player'),
    'scouter': require('./lib/controllers/scouter/scouter')
};

const app = express();
app.use(cors());
app.use(boom());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath);
app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));

