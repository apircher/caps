/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([], function () {
    'use strict';

    return {
        mapPath: function (path) {
            var appPath = capsConfig.applicationPath;

            if (path.startsWith(appPath))
                return path;
            return path.replace(/^~/, function () {
                return appPath === '/' ? '' : appPath;
            });
        }
    };
});