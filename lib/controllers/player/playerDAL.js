/**
 * Created by Tomer on 28-Feb-18.
 */

const sqlFunction = require('../../utils').sqlFunction;
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
 * @param sqlArr
 * @param basicInfoAlias
 * @param statsAlias
 * @param cb
 */
exports.search = function (sqlArr, basicInfoAlias, statsAlias, cb) {

    // Creates basic query
    let query = `SELECT ${statsAlias}.player_id as player_id
                 FROM players_basic_info as ${basicInfoAlias}
                 INNER JOIN players_yearly_statistics as ${statsAlias}
                 ON ${basicInfoAlias}.id = ${statsAlias}.player_id `;

    // Creates WHERE clause
    let whereClause = (sqlArr.length === 0) ? '' :
        _.reduce(sqlArr, function(accumulator, currentItem) {
            return accumulator + ' ' + currentItem + ' AND';
        }, 'WHERE').slice(0, -4);

    // Runs query
    dbConn.query(query + whereClause, [], cb);
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
exports.player_basic_info_params_to_SQL = {
    name: (value, alias) => {
        return sqlFunction.contains(value, alias + '.' + 'name');
    },
    age: (value, alias) => {
        return sqlFunction.in_range(value - 2, value + 2, alias + '.' + 'age');
    },
    country: (value, alias) => {
        return sqlFunction.equals(value, alias + '.' + 'country', true);
    },
    leg: (value, alias) => {
        return sqlFunction.equals(value, alias + '.' + 'favourite_leg', true);
    },
    team: (value, alias) => {
        return sqlFunction.equals(value, alias + '.' + 'team', true);
    },
    position: (value, alias) => {
        return sqlFunction.equals(config.iscout.positionsToId[value], alias + '.' + 'position', false);
    }
};

/**
 * json of functions for each player statistic parameter - matched sql
 * value - the value of the parameter to search for
 * alias - the parameter's table alias name
 */
exports.player_statistics_params_to_SQL = {
    year: (value, alias) => {
        return sqlFunction.equals(value, alias + '.' + 'year', false);
    },
    goals: (value, alias) => {
        return sqlFunction.greater_or_equals(value, alias + '.' + 'goals');
    },
    assists: (value, alias) => {
        return sqlFunction.greater_or_equals(value, alias + '.' + 'assists');
    },
    games_in_starting_linup: (value, alias) => {
        return sqlFunction.greater_or_equals(value, alias + '.' + 'games_in_starting_linup');
    },
    games_entered_from_bench: (value, alias) => {
        return sqlFunction.greater_or_equals(value, alias + '.' + 'games_entered_from_bench');
    },
    yellow_cards: (value, alias) => {
        return sqlFunction.smaller_or_equals(value, alias + '.' + 'yellow_cards');
    },
    red_cards: (value, alias) => {
        return sqlFunction.smaller_or_equals(value, alias + '.' + 'red_cards');
    },
    average_km_per_game: (value, alias) => {
        return sqlFunction.greater_or_equals(value, alias + '.' + 'average_km_per_game');
    }
};