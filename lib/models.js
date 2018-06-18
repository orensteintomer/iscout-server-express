/**
 * Created by Tomer on 29-Jan-18.
 */
const mysql = require('mysql');
const MongoClient = require('mongodb').MongoClient;
const iscoutconf = require('./config').iscout;

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'tomer',
    password : 'tomer',
    database : 'iscout',
    multipleStatements: true
});

connection.connect(function(state){
    console.log('connected to db')
});

exports.dbConn = connection;

// Use connect method to connect to the server
MongoClient.connect("mongodb://localhost:27017", function(err, client) {
    if (err) {
        console.log("cannot connect to mongo - " + err);
    } else {
        console.log("Connected successfully to server");
        exports.mongoConn = client;
    }
});

exports.getMaxCollectionId = (collection, cb) => {
    collection.find().sort({id:-1}).limit(1).toArray(function(err, data) {
        if (err) {
            cb(err);
        } else {
            cb(null, data[0].id);
        }
    })
};