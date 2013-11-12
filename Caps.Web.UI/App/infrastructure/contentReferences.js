define(['jquery'], function ($) {
    
    /*
     * ContentReferenceManager class
     */
    function ContentReferenceManager(options) {
        this.defaultReplaceOptions = $.extend({

            replaceFileReference: function (fileReference, language, hit, offset, s) {
                return '';
            },

            replacePublicationReference: function (publicationReference, language, hit, offset, s) {
                return '';
            }

        }, options);
    }

    ContentReferenceManager.prototype.replaceReferences = function (context, rawContent, language, replaceOptions) {
        replaceOptions = $.extend(this.defaultReplaceOptions, replaceOptions);

        // Replace draft file references.
        if (replaceOptions.replaceFileReference) {
            var contentFileRegex = /caps:\/\/content-file\/([^\"'\s\?)]*)(\?[^\"'\s)]*)?/gi;
            rawContent = rawContent.replace(contentFileRegex, function (hit, p1, p2, offset, s) {
                var fileReference = new FileReference(context, unescape(p1), p2);
                return replaceOptions.replaceFileReference.call(this, fileReference, language, hit, offset, s);
            });

            var publicationRegex = /caps:\/\/publication\/(\d+)(-([a-zA-Z]{2,5}))?(\?[^\"'\s)]*)?/gi;
            rawContent = rawContent.replace(publicationRegex, function (hit, p1, p2, p3, p4, offset, s) {
                var publicationReference = new PublicationReference(context, p1, p3, p4);
                return replaceOptions.replacePublicationReference.call(this, publicationReference, language, hit, offset, s);
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

    /*
     * PublicationReference class
     */
    function PublicationReference(context, id, language, query) {
        this.context = context;
        this.id = id;
        this.language = language;
        this.query = query;
    }

    return ContentReferenceManager;
});