/**
 * Created by Tomer on 13-Nov-16.
 */
const models = require('../../models');
const utils = require('../../utils');
const playerDAL = require('./playerDAL');
const iscountconf = require('../../config').iscout;
const _ = require('underscore');
const async = require('async');
const requestlib = require('request');
const dbConn = models.dbConn;

/**
 * Private Functions
 */

/**
 * Randomize specific parameter by player position
 * @param parameter - statistical parameter (goals, assists, average_km_per_game)
 * @param playerPosition
 * @returns {number}
 */
const getStatByPlayerPosition = function (parameter, playerPosition) {

    // Switches on current player position
    switch(playerPosition) {
        case iscountconf.positions.GK:
            if (parameter === iscountconf.stats_params.average_km_per_game) {
                return utils.numberRandomize(0.1, 1, true);
            } else {
                return 0;
            }
            break;
        case iscountconf.positions.CD:
            if (parameter === iscountconf.stats_params.average_km_per_game) {
                return utils.numberRandomize(3, 6, true);
            } else if (parameter === iscountconf.stats_params.goals){
                return utils.numberRandomize(0, 3, false);
            } else if (parameter === iscountconf.stats_params.assists){
                return utils.numberRandomize(0, 2, false);
            }
            break;
        case iscountconf.positions.MD:
            if (parameter === iscountconf.stats_params.average_km_per_game) {
                return utils.numberRandomize(4, 10, true);
            } else if (parameter === iscountconf.stats_params.goals){
                return utils.numberRandomize(0, 15, false);
            } else if (parameter === iscountconf.stats_params.assists){
                return utils.numberRandomize(0, 21, false);
            }
            break;
        case iscountconf.positions.ST:
            if (parameter === iscountconf.stats_params.average_km_per_game) {
                return utils.numberRandomize(5, 9, true);
            } else if (parameter === iscountconf.stats_params.goals){
                return utils.numberRandomize(0, 20, false);
            } else if (parameter === iscountconf.stats_params.assists){
                return utils.numberRandomize(0, 12, false);
            }
            break;
        default:
            return -1;
    }
};

/**
 * Generate specific player yearly statistics - currently random
 * @param playerPosition
 * @returns {{year: number, goals: number, assists: number, game_in_starting_linup,
  *          games_entered_from_bench, yellow_cards, red_cards, average_km_per_game: number}}
 */
const generatePlayerStats = function(playerPosition){
  return {
      year: 2018,
      goals: getStatByPlayerPosition(iscountconf.stats_params.goals, playerPosition),
      assists: getStatByPlayerPosition(iscountconf.stats_params.assists, playerPosition),
      game_in_starting_linup: utils.numberRandomize(0, 35, false),
      games_entered_from_bench: utils.numberRandomize(0, 22, false),
      yellow_cards: utils.numberRandomize(0, 13, false),
      red_cards: utils.numberRandomize(0, 6, false),
      average_km_per_game: getStatByPlayerPosition(iscountconf.stats_params.average_km_per_game, playerPosition)
  };
};

/**
 * Gets player's basic info
 * @param playerId
 * @param isExtraData - whether to add own desc, img, videos
 * @param cb - callback
 */
const getPlayerBasicInfo = function (playerId, isExtraData, cb) {

    // Gets current player basic info
    playerDAL.getPlayerById(playerId, function (err, results) {

        if (err){
            cb(err);
        } else if (results.length > 0){

            // Returns player's basic info
            let resJson = {
                name: results[0].name,
                age: results[0].age,
                leg: results[0].favourite_leg,
                position: results[0].position,
                country: results[0].country,
                team: results[0].team
            };

            if (isExtraData) {
                resJson.videos_url = results[0].videos_url;
                resJson.img =
                    (results[0].img != null) ? results[0].img : "";
                resJson.own_description = (results[0].own_description === null) ? "" : results[0].own_description;
            }

            // Invokes callback with result data
            cb(null, resJson);
        } else {
            cb(null, {});
        }
    });
};

/**
 * Gets player's statistics
 * @param playerId
 * @param cb - callback
 */
const getPlayerStatistics = function (playerId, cb) {

    // Gets current player statistics
    playerDAL.getPlayerById(playerId, function (err, results) {

        if (err){
            cb(err);
        } else {

            // Goes over all results
            let resJsons =
                _.map(results, (res) => {
                    return {
                        year: res.year,
                        goals: res.goals,
                        assists: res.assists,
                        games_in_starting_linup: res.games_in_starting_linup,
                        games_entered_from_bench: res.games_entered_from_bench,
                        yellow_cards: res.yellow_cards,
                        red_cards: res.red_cards,
                        average_km_per_game: res.average_km_per_game
                    };
                });

            cb(null, resJsons);
        }
    });
};

/**
 * Gets player's full data - its basic info and its statistics
 * @param playerId
 * @param cb - callback
 */
const getPlayerFullData = function (playerId, cb) {

    getPlayerBasicInfo(playerId, false, (err, basicInfo)=> {
        if (err) {
            cb(err);
        } else {
            getPlayerStatistics(playerId, (err, stats) => {
                if (err) {
                    cb(err);
                } else {
                    // Adds player id
                    basicInfo.player_id = playerId;
                    cb(null,  {
                        player_basic_info: basicInfo,
                        player_statistics: stats
                    });
                }
            });
        }
    });
};


/**
 * Public Functions
 */

/**
 * This function registers new player to IScout app
 * And generates random statistics for the player
 * @param request
 * @param reply
 */
exports.register = function (request, reply) {

    // Gets users and players collection
    const mongoDB = models.mongoConn.db(iscountconf.mongo.db);
    const usersCollection = mongoDB.collection(iscountconf.mongo.collections.users);
    const playersCollection = mongoDB.collection(iscountconf.mongo.collections.players);

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

                    // Randomize player statistics
                    let playerStats = generatePlayerStats(request.body.position);

                    models.getMaxCollectionId(usersCollection, (err, lastUserId) => {

                        if (err) {
                            reply.boom.badImplementation(err);
                        } else {
                            models.getMaxCollectionId(playersCollection, (err, lastPlayerId) => {
                                if (err) {
                                    reply.boom.badImplementation(err);
                                } else {
                                    let userObj = {
                                        "id" : lastUserId+1,
                                        "username" : request.body.username,
                                        "password" : request.body.password,
                                        "type" : "player",
                                        "isadmin" : 0,
                                        "entityid" : lastPlayerId+1
                                    };

                                    // Insert new user
                                    usersCollection.insert(userObj, (err, res) => {

                                        if (err) {
                                            reply.boom.badImplementation(err);
                                        } else {

                                            // Now inserts user to players collection
                                            let playerObj = {
                                                "id" : lastPlayerId+1,
                                                "name" : request.body.name,
                                                "age" : request.body.age,
                                                "favourite_leg" : request.body.leg,
                                                "position" : request.body.position,
                                                "country" : request.body.country,
                                                "team" : request.body.team,
                                                "own_description" : null,
                                                "img" : null,
                                                "year" : playerStats.year,
                                                "goals" : playerStats.goals,
                                                "assists" : playerStats.assists,
                                                "games_in_starting_linup" : playerStats.game_in_starting_linup,
                                                "games_entered_from_bench" : playerStats.games_entered_from_bench,
                                                "yellow_cards" : playerStats.yellow_cards,
                                                "red_cards" : playerStats.red_cards,
                                                "average_km_per_game" : playerStats.average_km_per_game,
                                                "videos_url" : []
                                            };

                                            // Insert new user player data
                                            playersCollection.insert(playerObj, (err, res) => {
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
 * This function handles players login
 * @param request
 * @param reply
 */
exports.login = function (request, reply) {

    // Gets users collection
    const mongoDB = models.mongoConn.db(iscountconf.mongo.db);
    const collection = mongoDB.collection(iscountconf.mongo.collections.users);

    // Checks if username and password exists
    collection.find({username: request.query.username, password: request.query.password, type: "player"})
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
                        player_id: res[0].entityid
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
 * This function gets wanted player basic information
 * @param request
 * @param reply - {age, name, country, leg, team, position, own_description}
 */
exports.getPlayerInfo = function (request, reply) {

    // Gets current player basic info
    getPlayerBasicInfo(request.query.playerid, true, (err, basicInfo) => {

        if (err){
            reply.boom.badImplementation(err);
        } else {

            requestlib({
            url: iscountconf.region_url + basicInfo.country}, (error, response, data) => {

                basicInfo.region = "None";

                if (!error && response.statusCode !== 404) {
                    basicInfo.region = eval(data)[0].region;
                }

                playerDAL.getUserById(request.query.user_id, (err, res) => {
                    if (err) {
                        reply.boom.badImplementation(err);
                    } else if (res.length > 0 && res[0].entityid == request.query.playerid) {
                        reply.status(200).json(basicInfo);
                    } else {
                        // Inserts user's view - for machine learning usage
                        let sql = `INSERT INTO user_views
                          (user_id, viewed_player_id) 
                          VALUES (?, ?)`;
                        dbConn.query(sql, [request.query.user_id, request.query.playerid], (err, dt) => {

                            if (err) {
                                reply.boom.badImplementation(err);
                            } else {
                                reply.status(200).json(basicInfo);
                            }
                        });
                    }
                });
            });
        }
    });
};

/**
 * This function gets wanted player statistics from all years
 * @param request
 * @param reply - Array of stats jsons
 * { year, goals, assists, game_in_starting_linup, games_entered_from_bench,
  * yellow_cards, red_cards, average_km_per_game }
 */
exports.getPlayerStatistics = function (request, reply) {

    // Gets current player statistics
    getPlayerStatistics(request.query.playerid, (err, data) => {

        if (err){
            reply.boom.badImplementation(err);
        } else {
            reply.status(200).json(data);
        }
    });
};

/**
 * This function searches players by 2 kinds of parameters -
 * 1. player basic info - age, name, country, leg, team, position
 * 2. players statistics - year, goals, assists, game_in_starting_linup, games_entered_from_bench,
 * yellow_cards, red_cards, average_km_per_game
 * @param request
 * @param reply - Array of - { player_basic_info: {}, player_statistics: [{}] }
 */
exports.search = function (request, reply) {

    let filters = {};

    // Gets basic player parameters sql array - filled with value
    // Checks if query contains current parameter - for knowing whether to ignore current param or not
    let arr = _.filter(Object.keys(playerDAL.player_basic_info_params_to_mongo_filters), (param) => {
        return (Object.prototype.hasOwnProperty.call(request.query, param));
    });

     _.each(arr, (param) => {
        filters[param] = playerDAL.player_basic_info_params_to_mongo_filters[param](request.query[param]);
    });

    // Gets player statistics parameters sql array - filled with value
    // Checks if query contains current parameter - for knowing whether to ignore current param or not
    let arr2 = _.filter(Object.keys(playerDAL.player_statistics_params_to_mongo_filters), (param) => {
        return (Object.prototype.hasOwnProperty.call(request.query, param));
    });
    _.each(arr2, (param) => {
        filters[param] = (playerDAL.player_statistics_params_to_mongo_filters[param](request.query[param]));
    });

    if (Object.prototype.hasOwnProperty.call(request.query, 'leg')) {
        filters['favourite_leg'] =
            (playerDAL.player_basic_info_params_to_mongo_filters['favourite_leg'](request.query['leg']));
    }

    // Gets user's players ranking from iscout-brain service (base on ml process)
    requestlib({
        url: iscountconf.brain_url,
        qs:{ user_id: request.query.user_id }}, (error, response, rankingArr) => {

        if (error) {
            rankingArr = [];
        } else {
            rankingArr = eval(rankingArr);
        }

        // Searches player matching current search
        playerDAL.search(filters, function (err, results) {

            if (err){
                reply.boom.badImplementation(err);
            } else {

                // Gets search matched players' ids
                let playersIds = _.map(results, (res) => { return res.id; } );

                // Gets current page ids - in combination with ml ranking
                let mlrankWithQueryResultsOnly = _.intersection(rankingArr, playersIds);

                // Adds registered players
                if (playersIds.length > mlrankWithQueryResultsOnly.length) {
                    mlrankWithQueryResultsOnly =
                        mlrankWithQueryResultsOnly.concat(_.difference(playersIds, mlrankWithQueryResultsOnly));
                }

                let currentPageStartIdx = (request.query.page - 1) * iscountconf.pageSize;
                let currentPageIds =
                    mlrankWithQueryResultsOnly.slice(currentPageStartIdx, currentPageStartIdx + iscountconf.pageSize);

                // Gets full data of each player and sends to client
                async.map(currentPageIds, (id, cb) => {
                    getPlayerFullData(id, cb);
                }, (err, data) => {

                    if (err) {
                        reply.boom.badImplementation(err);
                    } else {

                        // Returns objects
                        reply.status(200).json(data);
                    }
                });
            }
        });
    });
};

/**
 * This function updates player description
 * @param request
 * @param reply
 */
exports.updateDescription = function (request, reply) {

    // Searches player matching current search
    playerDAL.updateDescription(request.body.own_description, request.body.player_id, function (err, results) {

        if (err){
            reply.boom.badImplementation(err);
        } else {

            // Returns objects
            reply.status(200).end();
        }
    });
};

/**
 * This function saves in DB wanted player video's url
 * @param request
 * @param reply
 */
exports.uploadVideo = function (request, reply) {

    // Inserts player's video url to DB
    playerDAL.insertVideoUrl(request.body.player_id, request.body.youtube_url, function (err, results) {

        if (err){
            reply.boom.badImplementation(err);
        } else {

            // Returns objects
            reply.status(201).end();
        }
    });
};

/**
 * This function saves in DB wanted player picture's base 64 string
 * @param request
 * @param reply
 */
exports.uploadPicture = function (request, reply) {

    // Inserts player's video url to DB
    playerDAL.insertPictureBase64(request.body.player_id, request.body.picture_str, function (err, results) {

        if (err){
            reply.boom.badImplementation(err);
        } else {

            // Returns objects
            reply.status(201).end();
        }
    });
};