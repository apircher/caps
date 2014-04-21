/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides helper functions to handle URLs that represent
 * content in the CMS.
 * 
 * Supported routes are:
 * 
 * caps://content-file/[Filename]
 * caps://publication/[Permanent Id]
 * 
 * i.e.
 * caps://content-file/MyDocument.pdf
 * caps://publication/1010
 */
define([
    'jquery'
],
function ($) {
    'use strict';
    
    /**
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

    /**
     * Replaces content references in the given rawContent.
     */
    ContentReferenceManager.prototype.replaceReferences = function (context, rawContent, language, replaceOptions) {
        replaceOptions = $.extend(this.defaultReplaceOptions, replaceOptions);
        // Replace draft file references.
        if (replaceOptions.replaceFileReference) {
            var contentFileRegex = /caps:\/\/content-file\/([^\"'\s\?)]*)(\?[^\"'\s)]*)?/gi;
            rawContent = rawContent.replace(contentFileRegex, function (hit, p1, p2, offset, s) {
                var fileReference = new FileReference(context, unescape(p1), p2);
                return replaceOptions.replaceFileReference.call(this, fileReference, language, hit, offset, s);
            });
        }
        // Replace publication references.
        if (replaceOptions.replacePublicationReference) {
            var publicationRegex = /caps:\/\/publication\/(\d+)(-([a-zA-Z]{2,5}))?(\?[^\"'\s)]*)?/gi;
            rawContent = rawContent.replace(publicationRegex, function (hit, p1, p2, p3, p4, offset, s) {
                var publicationReference = new PublicationReference(context, p1, p3, p4);
                return replaceOptions.replacePublicationReference.call(this, publicationReference, language, hit, offset, s);
            });
        }
        return rawContent;
    };

    /**
     * FileReference class
     */
    function FileReference(context, fileName, query) {
        this.context = context;
        this.fileName = fileName;
        this.query = query;
    }

    /**
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