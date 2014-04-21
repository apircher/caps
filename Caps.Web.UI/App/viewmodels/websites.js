/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'durandal/system',
    'durandal/app',
    'infrastructure/datacontext',
    'entityManagerProvider',
    'ko',
    'breeze',
    'plugins/router'
],
function (system, app, datacontext, entityManagerProvider, ko, breeze, router) {
    'use strict';

    var website = ko.observable(),
        EntityQuery = breeze.EntityQuery,
        manager = entityManagerProvider.createManager();

    app.on('caps:draftTemplate:deleted', function (templateId) {
        var t = ko.utils.arrayFirst(website().DraftTemplates(), function (t) { return t.Id() === templateId; });
        if (t) manager.detachEntity(t);
    });

    function createDefaultWebsite() {
        return system.defer(function (dfd) {
            var entity = manager.createEntity('Website', { Name: 'My Caps Website', Url: 'http://caps.luxbox.net' });
            manager.saveChanges().then(success).fail(dfd.reject);

            function success() {
                dfd.resolve(entity);
            }
        })
        .promise();
    }

    function fetchWebsites() {
        var query = new EntityQuery().from('Websites').expand('DraftTemplates');
        return manager.executeQuery(query);
    }

    return {
        website: website,

        activate: function () {
            fetchWebsites().then(function (data) {
                if (data.results.length > 0) 
                    website(data.results[0]);
                else {
                    createDefaultWebsite().then(function (entity) {
                        website(entity);
                    });
                }
            });
        },

        saveChanges: function () {
            manager.saveChanges().then(router.navigateBack);
        },

        navigateBack: function () {
            router.navigateBack();
        },

        addTemplate: function () {
            router.navigate('#templates/' + website().Id() + '/create');
        },

        editTemplate: function (template) {
            router.navigate('#templates/' + website().Id() + '/edit/' + template.Id());
        }
    };
});