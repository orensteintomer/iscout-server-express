'use strict';

const express = require('express');
const http = require('http');
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

// web sockets
const server = http.createServer(app);
const io = require('socket.io').listen(server);
server.listen(config.port, () => console.log(`Server listening on port ${config.port}`));

// user_id => socket.id
let connectedUsers = {};

io.sockets.on('connection', function (socket) {

    // when the client emits 'sendoffer', this listens and executes
    socket.on('adduser', function (userId) {

        // Adds current user
        connectedUsers[userId] = socket.id;
    });

    // when the client emits 'sendoffer', this listens and executes
    socket.on('sendoffer', function (data) {

        // Gets destination socket id
        let destSocketId = connectedUsers[data.dest_user_id];

        // we tell the client to execute 'gotoffer' with 2 parameters
        io.to(destSocketId).emit('gotoffer', data);
    });
});

