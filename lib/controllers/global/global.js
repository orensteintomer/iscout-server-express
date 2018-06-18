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

    // Player
    if (entityType == 1) {

        dbConn.query(`DELETE FROM iscout.players_yearly_statistics WHERE id=?;
                      DELETE FROM iscout.players_basic_info WHERE id=?;
                      DELETE FROM iscout.users_to_players_rel WHERE user_id=?;
                      DELETE FROM iscout.users WHERE id=?;`,
            [entityId, entityId, userId, userId], (err, data) => {

            if (err){
                reply.boom.badImplementation(err);
            } else {
                reply.status(200).end();
            }
        });
    } else { // Scouter
        dbConn.query(`DELETE FROM iscout.users_to_scouters_rel WHERE user_id=?;
                      DELETE FROM iscout.scouters_info WHERE id=?;
                      DELETE FROM iscout.users WHERE id=?;`,
            [userId, entityId, userId], (err, data) => {

                if (err){
                    reply.boom.badImplementation(err);
                } else {
                    reply.status(200).end();
                }
            });
    }
};