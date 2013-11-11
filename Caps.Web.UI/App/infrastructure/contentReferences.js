define(['jquery'], function ($) {
    
    /*
     * ContentReferenceManager class
     */
    function ContentReferenceManager(options) {
        this.defaultReplaceOptions = $.extend({
            replaceFileReference: function (fileReference, language, hit, offset, s) {
                return '';
            }
        }, options);
    }

    ContentReferenceManager.prototype.replaceReferences = function (context, rawContent, language, replaceOptions) {
        replaceOptions = $.extend(this.defaultReplaceOptions, replaceOptions);

        // Replace draft file references.
        if (replaceOptions.replaceFileReference) {
            var regex = /caps:\/\/content-file\/([^\"'\s\?)]*)(\?[^\"'\s)]*)?/gi;
            rawContent = rawContent.replace(regex, function (hit, p1, p2, offset, s) {
                var fileReference = new FileReference(context, unescape(p1), p2);
                return replaceOptions.replaceFileReference.call(this, fileReference, language, hit, offset, s);
            });
        }

        return rawContent;
    };

    /*
     * FileReference class
     */
    function FileReference(context, fileName, query) {
        this.context = context;
        this.fileName = fileName;
        this.query = query;
    }

    return ContentReferenceManager;
});