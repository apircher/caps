/*
 * antiForgeryToken.js
 * Provides functions to request anti forgery tokens and handles a global 
 * ajax event to send the tokens back to the server.
 */
define([
    'durandal/system',
    'jquery',
    'infrastructure/serverUtil'
],
function (system, $, server) {
    
    var tokens = { c: '', f: '' },
        tokenServiceUrl = '~/Caps/GetAntiForgeryToken';
        
    /*
     * Request tokens from the server.
     */
    function initToken() {
        return system.defer(function (dfd) {
            $.ajax(tokenServiceUrl, { method: 'post' }).done(function (data) {
                tokens = data;
                dfd.resolve();
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    /*
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