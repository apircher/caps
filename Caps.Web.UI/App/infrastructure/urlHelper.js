define([], function () {
    
    /*
     * UrlHelper class
     */

    function UrlHelper() {

    }

    UrlHelper.prototype.getFileUrl = function (fileName, fileVersion, querystring) {
        if (fileVersion) {
            if (/(\?|&amp;|&)download=1/i.test(querystring) || !fileVersion.File().isImage())
                return '/DbFileContent/Download/' + fileVersion.Id();
            else if (fileVersion.File().isImage()) {
                if (/(\?|&amp;|&)thumbnail=1/i.test(querystring)) {
                    var size = '220x160';
                    var sizeMatches = querystring.match(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/);
                    if (sizeMatches && sizeMatches.length == 3) {
                        size = sizeMatches[2];
                    }

                    return '/DbFileContent/Thumbnail/' + fileVersion.Id() + '?thumbnailName=' + size;
                }
                else
                    return '/DbFileContent/Inline/' + fileVersion.Id();
            }
        }
        return '';
    };

    var instance = new UrlHelper();
    return instance;
});