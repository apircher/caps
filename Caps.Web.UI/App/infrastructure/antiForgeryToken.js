define(function (require) {

    var system = require('durandal/system'),
        Q = require('Q'),
        $ = require('jquery');

    var tokens = { c: '', f: '' },
        tokenServiceUrl = '/Caps/GetAntiForgeryToken';
        
    function initToken() {
        var deferred = Q.defer();
        $.ajax(tokenServiceUrl, { method: 'post' }).done(function (data) {
            tokens = data;
            deferred.resolve();
        })
        .fail(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    $(document).ajaxSend(function (event, request, settings) {
        if (settings.url !== tokenServiceUrl) {
            request.setRequestHeader('RequestVerificationToken', tokens.c + ':' + tokens.f);
        }
    });

    return {
        initToken: initToken
    };

});