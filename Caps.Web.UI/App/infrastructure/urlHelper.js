define([], function () {
    
    /*
     * UrlHelper class
     */

    function UrlHelper() {

    }

    UrlHelper.prototype.getFileUrl = function (fileName, file, querystring) {
        if (file) {            
            if (/(\?|&amp;|&)download=1/i.test(querystring) || !file.isImage())
                return '/DbFileContent/Download/' + file.Id();
            else if (file.isImage()) {
                if (/(\?|&amp;|&)thumbnail=1/i.test(querystring)) {
                    var size = '220x160';
                    var sizeMatches = querystring.match(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/);
                    if (sizeMatches && sizeMatches.length == 3) {
                        size = sizeMatches[2];
                    }

                    return '/DbFileContent/Thumbnail/' + file.Id() + '?thumbnailName=' + size;
                }
                else
                    return '/DbFileContent/Inline/' + file.Id();
            }
        }
        return '';
    };

    var instance = new UrlHelper();
    return instance;
});