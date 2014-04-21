/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides helpers to deal with controls that are embedded in draft content.
 * 
 * Controls are XML-Tags in the form:
 * 
 * <caps:[Control Name] [Attributes...] />
 * 
 * i.e.
 * <caps:slideshow filegroups="Group A, Group B" size="300x300" fitMode="Max" />
 * 
 */
define([
],
function () {
    'use strict';

    var regexPattern = /(?:<\s*)caps:([a-zA-Z0-9]*)(?:[^>]*\s*\/>)/gi;

    /**
     * Searches for control tags in the given content and executes
     * the provided callback for every hit. The callback method may
     * return a replacement for the control tag.
     */
    function replaceContentControls(content, replaceCallback) {
        replaceCallback = replaceCallback || defaultReplaceCallback;

        content = content.replace(regexPattern, function (hit, tagName, offset, s) {
            return replaceCallback.call(this, tagName, hit, offset);
        });

        return content;
    }

    /**
     * The default callback method for replaceContentControls.
     */
    function defaultReplaceCallback(tagName, hit, offset) {
        return '<div class="caps-ccctag">caps:<strong>' + tagName + '</strong></div>';
    }

    return {
        replaceContentControls: replaceContentControls
    };
});