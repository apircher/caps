/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define(function () {
    'use strict';
    
    function compareArrays(first, second) {
        if (!first || !second)
            return false;
        if (first.length != second.length)
            return false;
        for (var i = 0, len = first.length; i < len; i++) {
            if (first[i] != second[i])
                return false;
        }
        return true;
    }

    function formatFileSize(fileSizeInBytes) {
        var units = ["Bytes", "KB", "MB", "TB"];
        var unit = 0;
        var fileSize = fileSizeInBytes;

        while (fileSize > 1024) {
            fileSize /= 1024.0;
            if (unit++ >= 3)
                break;
        }
        var s = fileSize.toFixed(2).toLocaleString() + " " + units[unit];
        //TODO: Localization...
        return s.replace('.00', '').replace('.', ',');
    }

    function stringStartsWith(s, value) {
        s = s || '';
        if (value.length > s.length)
            return false;
        return s.substring(0, value.length) === value;
    };



    function getFragment() {
        if (window.location.hash.indexOf("#") === 0) {
            return parseQueryString(window.location.hash.substr(1));
        } else {
            return {};
        }
    }

    function parseQueryString(queryString) {
        var data = {},
            pairs, pair, separatorIndex, escapedKey, escapedValue, key, value;

        if (queryString === null) {
            return data;
        }

        pairs = queryString.split("&");

        for (var i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            separatorIndex = pair.indexOf("=");

            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            } else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }

            key = decodeURIComponent(escapedKey);
            value = decodeURIComponent(escapedValue);

            data[key] = value;
        }

        return data;
    }

    function verifyStateMatch(fragment) {
        var state;

        if (typeof (fragment.access_token) !== "undefined") {
            state = sessionStorage["state"];
            sessionStorage.removeItem("state");

            if (state === null || fragment.state !== state) {
                fragment.error = "invalid_state";
            }
        }
    }



    return {
        compareArrays: compareArrays,
        formatFileSize: formatFileSize,
        stringStartsWith: stringStartsWith,

        getFragment: getFragment,
        verifyStateMatch: verifyStateMatch
    };

});