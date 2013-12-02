define(['infrastructure/serverUtil'], function (server) {
    
    /*
     * UrlHelper class
     */

    function UrlHelper() {

    }

    UrlHelper.prototype.getFileUrl = function (fileName, fileVersion, querystring) {
        if (fileVersion) {
            if (/(\?|&amp;|&)download=1/i.test(querystring) || !fileVersion.File().isImage())
                return server.mapPath('~/DbFileContent/Download/' + fileVersion.Id());
            else if (fileVersion.File().isImage()) {
                if (/(\?|&amp;|&)size=([0-9]+x[0-9]+)/i.test(querystring)) {
                    var size = '220x160';
                    var sizeMatches = querystring.match(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/);
                    if (sizeMatches && sizeMatches.length == 3) {
                        size = sizeMatches[2];
                    }
                    return server.mapPath('~/DbFileContent/Thumbnail/' + fileVersion.Id() + '?thumbnailName=' + size);
                }
                else
                    return server.mapPath('~/DbFileContent/Inline/' + fileVersion.Id());
            }
        }
        return '';
    };

    UrlHelper.prototype.getPublicationUrl = function (externalId, language, querystring) {
        return '#sitemap?p=' + externalId;
    };

    var instance = new UrlHelper();
    return instance;
});