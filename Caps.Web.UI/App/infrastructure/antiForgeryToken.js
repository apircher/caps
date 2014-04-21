/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides methods to request anti forgery tokens and handles a global 
 * ajax event to send the tokens back to the server.
 */
define([
    'durandal/system',
    'jquery',
    'infrastructure/serverUtil'
],
function (system, $, server) {
    'use strict';
    
    var tokens = { c: '', f: '' },
        tokenServiceUrl = '~/api/antiforgery/tokens';
        
    /**
     * Request tokens from the server.
     */
    function initToken() {
        return system.defer(function (dfd) {
            $.ajax(tokenServiceUrl, { method: 'get' }).done(function (data) {
                tokens = data;
                dfd.resolve();
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    /**
     * Handles global ajax events to send the tokens back to the server.
     */
    $(document).ajaxSend(function (event, request, settings) {
        if (!settings.url.endsWith(tokenServiceUrl.slice(1))) {
            request.setRequestHeader('RequestVerificationToken', tokens.c + ':' + tokens.f);
        }        
    });

    return {
        initToken: initToken
    };

});