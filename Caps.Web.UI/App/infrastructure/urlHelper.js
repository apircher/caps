/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'infrastructure/serverUtil',
    'authentication'
],
function (server, authentication) {
    'use strict';

    /*
     * UrlHelper class
     */
    function UrlHelper() {
    }

    UrlHelper.prototype.getFileUrl = function (fileName, fileVersion, querystring) {
        if (fileVersion) {
            if (/(\?|&amp;|&)download=1/i.test(querystring) || !fileVersion.File().isImage())
                return this.fileDownload(fileVersion);
            else if (fileVersion.File().isImage()) {
                if (/(\?|&amp;|&)size=([0-9]+x[0-9]+)/i.test(querystring)) {
                    return this.fileThumbnail(fileVersion, thumbnailSizeFromQueryString(querystring, '220x160'));
                }
                else
                    return this.fileInline(fileVersion);
            }
        }
        return '';
    };

    UrlHelper.prototype.getPublicationUrl = function (externalId, language, querystring) {
        return '#sitemap?p=' + externalId;
    };

    UrlHelper.prototype.fileInline = function (fileVersion) {
        return server.mapPath('~/api/dbfile/' + fileVersion.Id() + '/inline/' + encodeURIComponent(fileVersion.File().FileName())
            + '?access_token=' + authentication.getAccessToken() + '&h=' + fileVersion.Hash());
    };

    UrlHelper.prototype.fileDownload = function (fileVersion) {
        return server.mapPath('~/api/dbfile/' + fileVersion.Id() + '/download/' + encodeURIComponent(fileVersion.File().FileName())
            + '?access_token=' + authentication.getAccessToken() + '&h=' + fileVersion.Hash());
    };

    UrlHelper.prototype.fileThumbnail = function (fileVersion, size) {
        size = size || '220x160';
        return server.mapPath('~/api/dbfile/' + fileVersion.Id() + '/thumbnail/' + encodeURIComponent(fileVersion.File().FileName())
            + '?access_token=' + authentication.getAccessToken() + '&h=' + fileVersion.Hash() + '&nameOrSize=' + encodeURIComponent(size));
    };

    function thumbnailSizeFromQueryString(querystring, defaultSize) {
        var size = defaultSize || '220x160';
        var sizeMatches = querystring.match(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/);
        if (sizeMatches && sizeMatches.length == 3) {
            size = sizeMatches[2];
        }
        return size;
    }

    window.$caps = window.$caps || {};
    window.$caps.url = new UrlHelper();
    return window.$caps.url; // Returns a singleton.
});