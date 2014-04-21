/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a global service to get or create Tags.
 */
define([
    'require',
    'durandal/app',
    'knockout',
    'Q',
    'infrastructure/datacontext',
    'authentication'
],
function (require, app, ko, Q, datacontext, authentication) {
    'use strict';

    var tags = ko.observableArray([]);

    app.on('caps:authentication:loggedOn', function () {
        refreshTags();
    });

    app.on('caps:tag:deleted', function (tag) {
        var t = findTagById(tag.Id());
        if (t) tags.remove(t);
    });


    function findTagByName(tagName) {
        var k = tagName.toLowerCase();
        return ko.utils.arrayFirst(tags(), function (item) {
            return item.Name().toLowerCase() === k;
        });
    }

    function findTagById(tagId) {
        return ko.utils.arrayFirst(tags(), function (item) {
            return item.Id() === tagId;
        });
    }

    function getOrCreateTag(tagName) {
        var deferred = Q.defer();
        var t = findTagByName(tagName);
        if (t) {
            deferred.resolve(t);
        }
        else {
            datacontext.getOrCreateTag(tagName)
                .fail(deferred.reject)
                .done(function (data) {
                    tags.push(data);
                    deferred.resolve(data);
                });
        }
        return deferred.promise;
    }

    function refreshTags() {
        if (!authentication.isAuthenticated())
            return;
        return datacontext.getTags()
            .fail(function (err) {
                console.log('Tags could not be refreshed. ' + err.message);
            })
            .done(function (data) {
                if (data && data.results) tags(data.results);
            });
    }

    if (authentication.isAuthenticated())
        refreshTags();

    return {
        tags: tags,
        findTagByName: findTagByName,
        findTagById: findTagById,
        getOrCreateTag: getOrCreateTag,
        refreshTags: refreshTags
    };
});