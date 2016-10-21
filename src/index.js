'use strict'; 

let Promise = require('promise');
let yargs = require('yargs').argv;
let request = require('request');
let _ = require('lodash');
const API_KEY = yargs.FLICKR_API_KEY || process.env.FLICKR_API_KEY || '';
const SECRET = yargs.FLICKR_SECRET || process.env.FLICKR_SECRET || '';
const USER_ID = yargs.FLICKR_USER_ID || process.env.FLICKR_USER_ID || '';
const NUM_RESULTS = yargs.NUM_RESULTS || 50;
const URL = 'https://api.flickr.com/services/rest';
const methods = {
    getPublicPhotos: 'flickr.people.getPublicPhotos',
    getSizes: 'flickr.photos.getSizes'
};
const template = require('./template');

let options = {
    url: URL,
    method: 'GET',
    qs: {
        api_key:'617d4007458d800217fe1a355accf25d',
        user_id:'61321497%40N03',
        format:'json',
        nojsoncallback:'1',
        auth_token:'72157665051435351-a0f67b527f6dea09',
        api_sig:'9d0942159b155ee78fb20e348005dda'
    }
};

function requestPromise(config) {
    return new Promise(function (resolve, reject) {
        request(config, function (err, res, body) {
            if (err) {
                return reject(err);
            } else if (res.statusCode !== 200 || _.get(body, 'code', 200) !== 200) {
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(body);
            }
            resolve(body);
        });
    });
}

// getPhotoIdsAndTitles :: Object -> [[String, String]]
let getPhotoIdsAndTitles = (data) => {
    let photos = JSON.parse(data).photos.photo;
    return photos.map((el) => [el.id, el.title]);
};

// transformSizesUrlToPhotoStreamUrl :: String -> String
let transformSizesUrlToPhotoStreamUrl = (sizeUrl) => {
    return sizeUrl.replace(/\/sizes\/.+\//, '/in/photostream');
}

// getPhotoAllSizes :: [String, String] -> Promise [String, String, Object]
let getPhotoAllSizes = (idAndTitle) => {
    return requestPromise({
        method: 'GET',
        url: URL,
        qs: {
            method: methods.getSizes,
            api_key: API_KEY,
            photo_id: idAndTitle[0],
            format:'json',
            nojsoncallback:'1'
        }
    })
    .then((data) => { return idAndTitle.concat([data]); });
}

// findSource :: Object -> String
let findSource = (o) => { return o.source }

// getUrl :: Object -> String
let getUrl = (sizeObj) => {
    return sizeObj.url;
}

// getSizeAndUrl :: [String, String, Object] -> [String, String, String]
let getSizeAndUrl = (idTitleAndSizes) => {
    let title = idTitleAndSizes[1];
    let sizeObject  = getSize(JSON.parse(idTitleAndSizes[2]).sizes.size)
    let url = _.flowRight(transformSizesUrlToPhotoStreamUrl, getUrl)(sizeObject);
    let src = findSource(sizeObject);

    return [].concat([title, src, url]);
}

// getSize :: [String, String, Object] -> Promise [String, String, String]
let getSize = (sizes) => {
    return _.chain(sizes)
    .filter(size => { return size.label === 'Large';})
    .head()
    .value();
}


// getMSizes :: [String, String] -> Promise [[String, String, String]]
let getMSizes = (idAndTitle) => {
    return getPhotoAllSizes(idAndTitle).then(getSizeAndUrl);
};

// preparePhotoInfo :: [String, String, String] -> String
let preparePhotoInfo = (photoInfo) => {
    let title = photoInfo[0];
    let src   = photoInfo[1];
    let url   = photoInfo[2];
    let filledTemplate = template(title, src, url);
    //let template = `<a href="${url}" target="_blank" title="${title}"><img src="${src}" alt="${title}"></a>`;
    //return template;
    return filledTemplate;
}

// print :: String -> null
let print = (string) => {
    console.log(string);
}

// printPhotos [[String, String, String]] -> null
let printPhotos = (stuff) => {
    _.chain(stuff)
    .reverse()
    .forEach(_.flowRight(print, preparePhotoInfo)).value();
};

let getMyPhotos = () => {
    return requestPromise({
        method: 'GET',
        url: URL,
        qs: {
            method: methods.getPublicPhotos,
            api_key: API_KEY,
            user_id: USER_ID,
            per_page: NUM_RESULTS,
            format:'json',
            nojsoncallback:'1'
        }
    })
}

let getSizesForAllPhotos = (idsAndTitles) => {
    let promises = idsAndTitles.map(getMSizes);
    return Promise.all(promises);
}

(function init() {
    getMyPhotos()
    .then(getPhotoIdsAndTitles)
    .then(getSizesForAllPhotos)
    .then(printPhotos)
    .catch((e) => console.log('Failed: ', e));
}())

