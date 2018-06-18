/**
 * Created by Tomer on 11-May-18.
 */
const config = require('../../config');
const models = require('../../models');
const dbConn = models.dbConn;

/**
 * Gets all possible teams -
 * {id, country, name, lat, lon}
 * @param request
 * @param reply
 */
exports.teams = function (request, reply){

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.teams);

    // Gets all teams
    collection.find({}).toArray(function(err, data) {
        if (err){
            reply.boom.badImplementation(err);
        } else {
            reply.status(200).json(data);
        }
    });
};

exports.deleteUser = function (request, reply) {

    let entityType = request.query.entity_type;
    let userId = request.query.user_id;
    let entityId = request.query.entity_id;

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const userCollection = mongoDB.collection(config.iscout.mongo.collections.users);

    userCollection.deleteOne(
        { "id": parseInt(userId)}, // Filter
        (err, res) => {

            if (err){
                reply.boom.badImplementation(err);
            } else {

                // Player
                if (entityType === 'player') {

                    const playersCollection = mongoDB.collection(config.iscout.mongo.collections.players);

                    playersCollection.deleteOne(
                        { "id": parseInt(entityId)}, // Filter
                        (err, res) => {

                            if (err) {
                                reply.boom.badImplementation(err);
                            } else {
                                reply.status(200).end();
                            }
                        });
                } else {

                    const scoutersCollection = mongoDB.collection(config.iscout.mongo.collections.scouters);

                    scoutersCollection.deleteOne(
                        { "id": parseInt(entityId)}, // Filter
                        (err, res) => {

                            if (err) {
                                reply.boom.badImplementation(err);
                            } else {
                                reply.status(200).end();
                            }
                        });
                }
            }
        });
};

exports.searchUsers = function (request, reply){

    let isadmin = request.query.isadmin;
    let entityType = request.query.entity_type;
    let usernamefilter = request.query.username;

    const mongoDB = models.mongoConn.db(config.iscout.mongo.db);
    const collection = mongoDB.collection(config.iscout.mongo.collections.users);

    let filters = {};
    if (Object.prototype.hasOwnProperty.call(request.query, "isadmin")) {
        filters["isadmin"] = (isadmin === "true") ? (1) : (0);
    }
    if (entityType === 'player' || entityType === 'scouter') {
        filters["type"] = entityType;
    }
    if (Object.prototype.hasOwnProperty.call(request.query, "username")) {
        filters["username"] = {$regex : `.*${usernamefilter}.*`};
    }

    // Gets all matching users
    collection.find(filters).toArray(function(err, data) {
        if (err){
            reply.boom.badImplementation(err);
        } else {
            reply.status(200).json(data);
        }
    });
};