﻿/*
 * draft/datacontext.js
 */
define([
    'durandal/system',
    'entityManagerProvider',
    'ko',
    'infrastructure/userQueryParser',
    './entities'
],
function (system, entityManagerProvider, ko, UserQueryParser, Entities) {
    
    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery,
        parser = new UserQueryParser();

    parser.translateColumnName = function (col) {
        return 'Name';
    };

    function getDrafts() {
        var query = EntityQuery.from('Drafts');
        return manager.executeQuery(query);
    }

    function searchDrafts(searchWords, orderBy) {
        var query = EntityQuery.from('Drafts');
        if (searchWords && searchWords.length) {
            var p = parser.getBreezePredicate(searchWords);
            if (p) query = query.where(p);
        }
        query = query.orderBy(orderBy || 'Created.At desc');
        return manager.executeQuery(query);
    }

    function getDraft(id) {
        var query = new EntityQuery().from('Drafts').where('Id', '==', id)
                .expand('Translations, ContentParts.Resources, Files.Resources.FileVersion.File');
        return manager.executeQuery(query);
    }

    function getTemplate(templateName) {
        return system.defer(function (dfd) {
            // Search Database.
            var query = new EntityQuery().from('DraftTemplates').where('Name', '==', templateName);
            manager.executeQuery(query).then(function (data) {
                if (!data.results || !data.results.length) dfd.resolve(null);
                try {
                    t = JSON.parse(data.results[0].TemplateContent());
                    Entities.initializeTemplate(t);
                }
                catch (error) {
                    dfd.reject(error);
                }
                dfd.resolve(t);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function fetchPublications(draftId, mgr) {
        mgr = mgr || manager;
        return system.defer(function (dfd) {
            //clearCachedPublications(draftId, mgr);
            var pr = new breeze.Predicate('Content.EntityType', '==', 'Draft').and('Content.EntityKey', '==', draftId.toString());
            var query = new EntityQuery().from('SiteMapNodes')
                .where(pr)
                .expand('Content, SiteMap, SiteMap.SiteMapNodes, SiteMap.SiteMapNodes.Resources');
            mgr.executeQuery(query).then(function (data) {
                dfd.resolve(data.results);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function clearCachedPublications(draftId, mgr) {
        mgr = mgr || manager;
        var pr = new breeze.Predicate('Content.EntityType', '==', 'Draft').and('Content.EntityKey', '==', draftId);
        var query = new EntityQuery().from('SiteMapNodes').where(pr);
        var cachedEntities = mgr.executeQueryLocally(query);
        cachedEntities.forEach(function (entity) { mgr.detachEntity(entity); });
    }

    function detachEntity(entity) {
        manager.detachEntity(entity);
    }
    function detachDraftFile(entity) {
        var query = new EntityQuery().from('DraftFiles').where('Id', '==', entity.Id());
        var results = manager.executeQueryLocally(query);
        if (results && results.length) {
            results.forEach(function (r) {
                if (r.Resources()) r.Resources().forEach(function (res) { manager.detachEntity(res); });
                manager.detachEntity(r);
            });
        }
    }

    return {
        getDrafts: getDrafts,
        getDraft: getDraft,
        getTemplate: getTemplate,
        fetchPublications: fetchPublications,
        searchDrafts: searchDrafts,
        detachDraftFile: detachDraftFile,

        isValidUserQuery: function (searchWords) {
            return parser.validate(searchWords);
        }
    };
});