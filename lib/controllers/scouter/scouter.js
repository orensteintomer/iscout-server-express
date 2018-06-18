/**
 * Created by Tomer on 27-Jan-18.
 */
const models = require('../../models');
const utils = require('../../utils');
const scouterDAL = require('./scouterDAL');
const iscountconf = require('../../config').iscout;
const _ = require('underscore');
const async = require('async');
const dbConn = models.dbConn;

/**
 * Gets scouter's info
 * @param scouterId
 * @param cb - callback
 */
const getScouterInfo = function (scouterId, cb) {

    // Gets current scouter basic info
    scouterDAL.getScouterInfo(scouterId, function (err, results) {

        if (err){
            cb(err);
        } else {

            // Returns player's basic info
            let resJson = {
                name: results[0].name,
                country: results[0].country,
                team: results[0].club
            };

            // Invokes callback with result data
            cb(null, resJson);
        }
    });
};

/**
 * This function registers new scout to IScout app
 * @param request
 * @param reply
 */
exports.register = function (request, reply) {

    // Gets users and players collection
    const mongoDB = models.mongoConn.db(iscountconf.mongo.db);
    const usersCollection = mongoDB.collection(iscountconf.mongo.collections.users);
    const scoutersCollection = mongoDB.collection(iscountconf.mongo.collections.scouters);

    // Checks if username already exists
    usersCollection
        .find({username: request.body.username})
        .toArray(function(err, results) {
            if (err){
                reply.boom.badImplementation(err);
            } else {

                // Gets the result
                let isUsernameExists = (results.length !== 0);

                if (isUsernameExists) {

                    // if exists - send error - username already exists
                    reply.boom.conflict('username already exists');
                } else {

                    models.getMaxCollectionId(usersCollection, (err, lastUserId) => {

                        if (err) {
                            reply.boom.badImplementation(err);
                        } else {
                            models.getMaxCollectionId(scoutersCollection, (err, lastScouterId) => {
                                if (err) {
                                    reply.boom.badImplementation(err);
                                } else {
                                    let userObj = {
                                        "id" : lastUserId+1,
                                        "username" : request.body.username,
                                        "password" : request.body.password,
                                        "type" : "scouter",
                                        "isadmin" : 0,
                                        "entityid" : lastScouterId+1
                                    };

                                    // Insert new user
                                    usersCollection.insert(userObj, (err, res) => {

                                        if (err) {
                                            reply.boom.badImplementation(err);
                                        } else {

                                            // Now inserts user to players collection
                                            let scouterObj = {
                                                "id" : lastScouterId+1,
                                                "name" : request.body.name,
                                                "club" : request.body.team,
                                                "country" : request.body.country
                                            };

                                            // Insert new user player data
                                            scoutersCollection.insert(scouterObj, (err, res) => {
                                                if (err) {
                                                    reply.boom.badImplementation(err);
                                                } else {

                                                    // sends 201 code - created
                                                    reply.status(201).end();
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
};

/**
 * This function handles scouters login
 * @param request
 * @param reply
 */
exports.login = function (request, reply) {

    // Gets users collection
    const mongoDB = models.mongoConn.db(iscountconf.mongo.db);
    const collection = mongoDB.collection(iscountconf.mongo.collections.users);

    // Checks if username and password exists
    collection.find({username: request.query.username, password: request.query.password, type: "scouter"})
        .toArray(function(err, res) {
            if (err){
                reply.boom.badImplementation(err);
            } else {

                // Gets the result
                let isUserExists = (res.length !== 0);

                if (isUserExists) {

                    // Returns player's basic info
                    let resJson = {
                        user_id: res[0].id,
                        scouter_id: res[0].entityid
                    };

                    reply.status(200).json(resJson);
                } else {

                    // Wrong username or password
                    reply.boom.unauthorized('Wrong username or password');
                }
            }
        });
};

/**
 * This function searches scouters by name, country, team
 * @param request
 * @param reply - Array of - { name, team, country }
 */
exports.search = function (request, reply) {

    // Sets alias for socoutersInfo DB table
    const alias = 'si';

    // Gets scouter info parameters sql array - filled with value
    let scouterInfoParamsSqlArr =

        // Checks if query contains current parameter - for knowing whether to ignore current param or not
        _.filter(Object.keys(scouterDAL.scouter_info_params_to_SQL), (param) => {
            return (Object.prototype.hasOwnProperty.call(request.query, param));
        }).map((param) => {
            return scouterDAL.scouter_info_params_to_SQL[param](request.query[param], alias);
        });

    // Searches scouters matching current search
    scouterDAL.search(scouterInfoParamsSqlArr, alias, function (err, results) {

        if (err){
            reply(models.Boom.badImplementation(err));
        } else {

            // Gets search matched scouters' ids
            let scouterIds = _.map(results, (res) => { return res.scouter_id; } );

            // Gets full data of each player and sends to client
            async.map(scouterIds, (id, cb) => {
                getScouterInfo(id, cb);
            }, (err, data) => {

                if (err) {
                    reply(models.Boom.badImplementation(err));
                } else {

                    // Returns objects
                    reply(data).code(200);
                }
            });
        }
    });
};