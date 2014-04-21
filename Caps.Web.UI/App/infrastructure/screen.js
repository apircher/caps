/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'jquery'
],
function ($) {
    'use strict';

    var $window = $(window);

    function isPhone() {
        return $window.width() <= 480;
    }

    return {
        isPhone: isPhone
    };
});