define([
    'ko',
    '../datacontext',
    '../module',
    'breeze', 
    'entityManagerProvider',
    'durandal/system'
],
function (ko, datacontext, module, breeze, entityManagerProvider, system) {

    var listItems = ko.observableArray(),
        selectedItem = ko.observable(),
        EntityQuery = breeze.EntityQuery,
        manager = entityManagerProvider.createManager();

    var draftName = ko.observable();

    function GalleryListItem(title, name, template, icon) {
        this.title = title;
        this.name = name;
        this.template = template;
        this.icon = icon;
    }

    function refreshListItems() {
        return system.defer(function (dfd) {
            var stockTemplates = datacontext.getTemplates();
            fetchDraftTemplates().then(function (coll) {
                var draftTemplateListItems = ko.utils.arrayMap(coll, function (t) {
                    var templateObj = parseTemplate(t.TemplateContent());
                    return new GalleryListItem(t.Name(), t.Name(), templateObj, '/App/modules/draft/images/Template 3.png');
                });

                var stockTemplateListItems = ko.utils.arrayMap(stockTemplates, function (t) {
                    var icon = '/App/modules/draft/images/' + t.name + '.png';
                    return new GalleryListItem(t.name, t.name, t, icon);
                });

                var result = stockTemplateListItems.concat(draftTemplateListItems);
                listItems(result);
                dfd.resolve();
            })
            .fail(dfd.reject);
        });
    }

    function fetchDraftTemplates() {
        var query = new EntityQuery().from('Websites').expand('DraftTemplates');
        return manager.executeQuery(query).then(function (data) {
            return data.results[0].DraftTemplates();
        });
    }

    function parseTemplate(templateContent) {
        var t;
        try {
            t = JSON.parse(templateContent);
        }
        catch (error) {
            system.log(error.message);
        }
        return t;
    }

    return {
        activate: function () {
            draftName('');
            selectedItem(null);
            refreshListItems();
        },

        listItems: listItems,
        selectedItem: selectedItem,
        draftName: draftName,

        selectTemplate: function(template) {
            selectedItem(template);
        },

        createDraft: function () {
            if (selectedItem()) {
                var url = '#drafts/create/' + selectedItem().name;
                var queryString = [];
                if (draftName()) queryString.push('name=' + escape(draftName()));

                var template = selectedItem().template;
                if (template.parameters) {
                    template.parameters.forEach(function (p) {
                        if (p.value) queryString.push(p.name + '=' + escape(p.value));
                    });
                }

                if (queryString.length) url += '?' + queryString.join('&');
                module.router.navigate(url);
            }
        },

        cancel: function () {
            module.router.navigate('#drafts');
        }
    };
});