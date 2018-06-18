'use strict';

const Promise = require('bluebird');

exports.resolveDependency = (options, callback) => {

    return (server, next) => {

        callback(server, options).asCallback(next);
    };
};

exports.coHandler = (handler) => {

    return (request, reply) => {

        Promise.coroutine(handler)(request, reply)
            .catch((err) => reply(err));
    };
};

exports.numberRandomize = function (min, max, isDouble) {

    if (!isDouble) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    } else {
        return Math.random() * (max - min) + min;
    }
};

exports.mongoFunction = {
    equals: (value, isString) => {
        return isString ? {$regex: value.toLowerCase(), $options: 'i'} : parseInt(value);
    },
    greater_or_equals: (value) => {
        return { $gte: parseFloat(value) };
    },
    smaller_or_equals: (value) => {
        return { $lte: parseFloat(value) };
    },
    contains: (value) => {
        return {$regex: `.*${value.toLowerCase()}.*`, $options: 'i'}
    },
    in_range: (minValue, maxValue) => {
        return {
            $gte: minValue,
            $lte: maxValue
        };
    }
};
