/**
 * Created by Tomer on 28-Feb-18.
 */

const mongoFunction = require('../../utils').mongoFunction;
const config = require('../../config');
const models = require('../../models');
const dbConn = models.dbConn;
const _ = require('underscore');

/**
 * Query player by playerid
 * @param playerid
 * @param cb
 */
exports.getPlayerById = function (playerid, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.players);

    // Gets wanted player
    collection.find({id:parseInt(playerid)}).toArray(function(err, data) {
        if (err){
            cb(err);
        } else {
            cb(null, data);
        }
    });
};

/**
 *
 * @param userId
 * @param cb
 */
exports.getUserById = function (userId, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.users);

    // Gets wanted user player id
    collection.find({id:parseInt(userId)}).toArray(function(err, data) {
        if (err){
            cb(err);
        } else {
            cb(null, data);
        }
    });
};

/**
 * Query players by wanted params
 * @param filters
 * @param cb
 */
exports.search = function (filters, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.players);

    // Gets all teams
    collection.find(filters).toArray(function(err, data) {
        if (err){
            cb(err);
        } else {
            cb(null, data);
        }
    });
};

/**
 * Updates player's own description by playerid
 * @param own_desc
 * @param playerid
 * @param cb
 */
exports.updateDescription = function (own_desc, playerid, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.players);

    collection.updateOne(
            { "id": playerid}, // Filter
            { $set: { own_description : own_desc } } // Update
    , cb);
};

/**
 * Inserts player's video url
 * @param playerid
 * @param videoUrl
 * @param cb
 */
exports.insertVideoUrl = function (playerid, videoUrl, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.players);

    collection.updateOne(
        { "id": playerid}, // Filter
        { $push: { videos_url : videoUrl } } // Update
        , cb);
};

/**
 * Inserts player's picture base64
 * @param playerid
 * @param picStr
 * @param cb
 */
exports.insertPictureBase64 = function (playerid, picStr, cb) {

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.players);

    collection.updateOne(
        { "id": playerid}, // Filter
        { $set: { img : picStr } } // Update
        , cb);
};

/**
 * json of functions for each player basic parameter - matched sql
 * value - the value of the parameter to search for
 * alias - the parameter's table alias name
 */
exports.player_basic_info_params_to_mongo_filters = {
    name: (value) => {
        return mongoFunction.contains(value);
    },
    age: (value) => {
        value = parseInt(value);
        return mongoFunction.in_range(value - 2, value + 2);
    },
    country: (value) => {
        return mongoFunction.equals(value, true);
    },
    favourite_leg: (value) => {
        return mongoFunction.equals(value, true);
    },
    team: (value) => {
        value = parseInt(value);
        return mongoFunction.equals(value, false);
    },
    position: (value) => {
        return mongoFunction.equals(value, true);
    }
};

/**
 * json of functions for each player statistic parameter - matched sql
 * value - the value of the parameter to search for
 * alias - the parameter's table alias name
 */
exports.player_statistics_params_to_mongo_filters = {
    year: (value) => {
        return mongoFunction.equals(value, false);
    },
    goals: (value) => {
        return mongoFunction.greater_or_equals(value);
    },
    assists: (value) => {
        return mongoFunction.greater_or_equals(value);
    },
    games_in_starting_linup: (value) => {
        return mongoFunction.greater_or_equals(value);
    },
    games_entered_from_bench: (value) => {
        return mongoFunction.greater_or_equals(value);
    },
    yellow_cards: (value) => {
        return mongoFunction.smaller_or_equals(value);
    },
    red_cards: (value) => {
        return mongoFunction.smaller_or_equals(value);
    },
    average_km_per_game: (value) => {
        return mongoFunction.greater_or_equals(value);
    }
};