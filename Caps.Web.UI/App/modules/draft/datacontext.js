/*
 * draft/datacontext.js
 */
define([
    'durandal/system',
    'entityManagerProvider',
    'ko',
    'infrastructure/userQueryParser'
],
function (system, entityManagerProvider, ko, UserQueryParser) {
    
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
        var query = EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Resources, ContentParts.Resources, Files.Resources.FileVersion.File');
        return manager.executeQuery(query);
    }

    var templates = null;
    function getTemplates() {
        if (!templates) templates = initTemplates();
        return templates;
    }
    function getTemplate(templateName) {
        var t = ko.utils.arrayFirst(getTemplates(), function (template) {
            return template.name.toLowerCase() === templateName.toLowerCase();
        });
        return t;
    }
    function initTemplates()  {
        var t = [];

        // Template 1
        t.push(buildTemplate('Template 1', [
            buildRow([
                buildCell('Header', 'Kopfbereich', 12)
            ]),
            buildRow([
                buildCell('Main', 'Hauptteil', 8),
                buildCell('Sidebar', 'Zusatzinformationen', 4)
            ]),
            buildRow([
                buildCell('Footer', 'Fußbereich', 12)
            ])
        ]));

        // Template 2
        t.push(buildTemplate('Template 2', [
            buildRow([
                buildCell('Header', 'Kopfbereich', 12)
            ]),
            buildRow([
                buildCell('Main', 'Hauptteil', 8),
                buildCell('Sidebar', 'Zusatzinformationen', 4)
            ])
        ]));

        // Template 3
        t.push(buildTemplate('Template 3', [
            buildRow([
                buildCell('Header', 'Kopfbereich', 12)
            ]),
            buildRow([
                buildCell('Main', 'Hauptteil', 12)
            ])
        ]));

        function buildTemplate(name, rows) {
            return {
                'name': name,
                'rows': rows
            };
        }

        function buildRow(cells) {
            return {
                'cells': cells
            };
        }

        function buildCell(name, title, colspan) {
            return {
                'name': name,
                'title': title,
                'colspan': colspan
            };
        }

        return t;
    }

    function fetchPublications(draftId, mgr) {
        mgr = mgr || manager;
        return system.defer(function (dfd) {
            clearCachedPublications(draftId, mgr);
            var pr = new breeze.Predicate('Content.EntityType', '==', 'Draft').and('Content.EntityKey', '==', draftId);
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

    return {
        getDrafts: getDrafts,
        getDraft: getDraft,
        getTemplates: getTemplates,
        getTemplate: getTemplate,
        fetchPublications: fetchPublications,
        searchDrafts: searchDrafts,

        isValidUserQuery: function (searchWords) {
            return parser.validate(searchWords);
        }
    };
});