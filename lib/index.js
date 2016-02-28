'use strict';

var Promise = require('promise');
var yargs = require('yargs').argv;
var request = require('request');
var _ = require('lodash');
var API_KEY = yargs.API_KEY || '';
var SECRET = yargs.SECRET || '';
var USER_ID = yargs.USER_ID || '';
var NUM_RESULTS = yargs.NUM_RESULTS || 50;
var URL = 'https://api.flickr.com/services/rest';
var methods = {
    getPublicPhotos: 'flickr.people.getPublicPhotos',
    getSizes: 'flickr.photos.getSizes'
};

var options = {
    url: URL,
    method: 'GET',
    qs: {
        api_key: '617d4007458d800217fe1a355accf25d',
        user_id: '61321497%40N03',
        format: 'json',
        nojsoncallback: '1',
        auth_token: '72157665051435351-a0f67b527f6dea09',
        api_sig: '9d0942159b155ee78fb20e348005dda'
    }
};

function requestPromise(config) {
    return new Promise(function (resolve, reject) {
        request(config, function (err, res, body) {
            if (err) {
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(err);
            }
            resolve(body);
        });
    });
}

// getPhotoIdsAndTitles :: Object -> [[String, String]]
var getPhotoIdsAndTitles = function getPhotoIdsAndTitles(data) {
    var photos = JSON.parse(data).photos.photo;
    return photos.map(function (el) {
        return [el.id, el.title];
    });
};

// transformSizesUrlToPhotoStreamUrl :: String -> String
var transformSizesUrlToPhotoStreamUrl = function transformSizesUrlToPhotoStreamUrl(sizeUrl) {
    return sizeUrl.replace(/\/sizes\/.+\//, '/in/photostream');
};

// getPhotoAllSizes :: [String, String] -> Promise [String, String, Object]
var getPhotoAllSizes = function getPhotoAllSizes(idAndTitle) {
    return requestPromise({
        method: 'GET',
        url: URL,
        qs: {
            method: methods.getSizes,
            api_key: API_KEY,
            photo_id: idAndTitle[0],
            format: 'json',
            nojsoncallback: '1'
        }
    }).then(function (data) {
        return idAndTitle.concat([data]);
    });
};

// findSource :: Object -> String
var findSource = function findSource(o) {
    return o.source;
};

// getUrl :: Object -> String
var getUrl = function getUrl(sizeObj) {
    return sizeObj.url;
};

// getSizeAndUrl :: [String, String, Object] -> [String, String, String]
var getSizeAndUrl = function getSizeAndUrl(idTitleAndSizes) {
    var title = idTitleAndSizes[1];
    var sizeObject = getSize(JSON.parse(idTitleAndSizes[2]).sizes.size);
    var url = _.flowRight(transformSizesUrlToPhotoStreamUrl, getUrl)(sizeObject);
    var src = findSource(sizeObject);

    return [].concat([title, src, url]);
};

// getSize :: [String, String, Object] -> Promise [String, String, String]
var getSize = function getSize(sizes) {
    return _.chain(sizes).filter(function (size) {
        return size.label === 'Medium 800';
    }).head().value();
};

// getMSizes :: [String, String] -> Promise [[String, String, String]]
var getMSizes = function getMSizes(idAndTitle) {
    return getPhotoAllSizes(idAndTitle).then(getSizeAndUrl);
};

// preparePhotoInfo :: [String, String, String] -> String
var preparePhotoInfo = function preparePhotoInfo(photoInfo) {
    var title = photoInfo[0];
    var src = photoInfo[1];
    var url = photoInfo[2];
    var template = '<a href="' + url + '" target="_blank" title="' + title + '"><img src="' + src + '" alt="' + title + '"></a>';
    return template;
};

// print :: String -> null
var print = function print(string) {
    console.log(string);
};

// printPhotos [[String, String, String]] -> null
var printPhotos = function printPhotos(stuff) {
    _.chain(stuff).forEach(_.flowRight(print, preparePhotoInfo)).value();
};

var getMyPhotos = function getMyPhotos() {
    return requestPromise({
        method: 'GET',
        url: URL,
        qs: {
            method: methods.getPublicPhotos,
            api_key: API_KEY,
            user_id: USER_ID,
            per_page: NUM_RESULTS,
            format: 'json',
            nojsoncallback: '1'
        }
    });
};

var getSizesForAllPhotos = function getSizesForAllPhotos(idsAndTitles) {
    var promises = idsAndTitles.map(getMSizes);
    return Promise.all(promises);
};

(function init() {
    getMyPhotos().then(getPhotoIdsAndTitles).then(getSizesForAllPhotos).then(printPhotos).catch(function (e) {
        return console.log('fail', e);
    });
})();