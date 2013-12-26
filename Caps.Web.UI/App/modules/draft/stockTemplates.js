define(['ko', './entities'], function (ko, Entities) {
    
    var templates = null;

    function getTemplates() {
        if (!templates) templates = initStockTemplates();
        return templates;
    }

    function initStockTemplates() {
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
                buildCell('Header', 'Kopfbereich', 12, 'html')
            ]),
            buildRow([
                buildCell('Main', 'Hauptteil', 12, 'text')
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

        function buildCell(name, title, colspan, contentType) {
            contentType = contentType || 'markdown';
            return {
                'name': name,
                'title': title,
                'colspan': colspan,
                'contentType': contentType
            };
        }

        t.forEach(function (tmpl) { Entities.initializeTemplate(tmpl); });

        return t;
    }

    return {
        all: getTemplates
    }
});