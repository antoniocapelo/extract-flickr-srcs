'use strict';
/**
 * Available properties: 
 * - url
 * - title
 * - src
 **/

let template =function(title, src, url) {
    return `<a href="${url}" target="_blank" title="${title}"><img src="${src}" alt="${title}"></a>`;
}
module.exports = template;
