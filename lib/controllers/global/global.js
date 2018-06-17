/**
 * Created by Tomer on 11-May-18.
 */
const models = require('../../models');
const dbConn = models.dbConn;

/**
 * Gets all possible teams -
 * {id, country, name, lat, lon}
 * @param request
 * @param reply
 */
exports.teams = function (request, reply){

    // Gets all teams
    dbConn.query(`SELECT id, country, name, lat, lon 
                  FROM iscout.teams`, (err, data) => {

        if (err){
            reply.boom.badImplementation(err);
        } else {
            reply.status(200).json(data);
        }
    });
};