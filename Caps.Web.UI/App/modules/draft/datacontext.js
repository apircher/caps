define(['entityManagerProvider', 'ko'], function (entityManagerProvider, ko) {
    
    var manager = entityManagerProvider.createManager();
    var EntityQuery = breeze.EntityQuery;

    function getDrafts() {
        var query = EntityQuery.from('Drafts');
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

    return {
        getDrafts: getDrafts,
        getTemplates: getTemplates,
        getTemplate: getTemplate
    };
});