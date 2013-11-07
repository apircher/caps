/*
 * draft/datacontext.js
 */
define([
    'durandal/system',
    'entityManagerProvider',
    'ko'
],
function (system, entityManagerProvider, ko) {
    
    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery;

    function getDrafts() {
        var query = EntityQuery.from('Drafts');
        return manager.executeQuery(query);
    }

    function getDraft(id) {
        var query = EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Resources, ContentParts, ContentParts.Resources, Files, Files.Resources, Files.Resources.File');
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
            var pr = new breeze.Predicate('Content.EntityType', '==', 'Draft').and('Content.EntityKey', '==', draftId);
            var query = new EntityQuery().from('SitemapNodes')
                .where(pr)
                .expand('Content, Sitemap, Sitemap.Nodes, Sitemap.Nodes.Resources');
            manager.executeQuery(query).then(function (data) {
                dfd.resolve(data.results);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    return {
        getDrafts: getDrafts,
        getDraft: getDraft,
        getTemplates: getTemplates,
        getTemplate: getTemplate,
        fetchPublications: fetchPublications
    };
});