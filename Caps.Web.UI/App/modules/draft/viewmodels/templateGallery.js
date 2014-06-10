define([
    'ko',
    '../datacontext',
    '../module',
    'breeze', 
    'entityManagerProvider',
    'durandal/system',
    'infrastructure/serverUtil'
],
function (ko, datacontext, module, breeze, entityManagerProvider, system, server) {

    var listItems = ko.observableArray(),
        selectedItem = ko.observable(),
        EntityQuery = breeze.EntityQuery,
        manager = entityManagerProvider.createManager();

    var draftName = ko.observable();

    function GalleryListItem(title, name, description, template, icon) {
        var self = this;

        self.title = title;
        self.name = name;
        self.template = template;
        self.icon = icon;
        self.description = description;

        self.isSelected = ko.computed(function () {
            return selectedItem() === self;
        });
    }

    function refreshListItems() {
        return system.defer(function (dfd) {
            fetchDraftTemplates().then(function (coll) {
                var draftTemplateListItems = ko.utils.arrayMap(coll, function (t) {
                    var templateObj = parseTemplate(t.TemplateContent());
                    return new GalleryListItem(t.Name(), t.Name(), t.Description(), templateObj, server.mapPath('~/App/modules/draft/images/Template 3.png'));
                });

                var result = draftTemplateListItems;
                listItems(result);
                dfd.resolve();
            })
            .fail(dfd.reject);
        })
        .promise();
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
            refreshListItems().then(function() {
                if (listItems && listItems().length)
                    selectedItem(listItems()[0]);
            });
        },

        listItems: listItems,
        selectedItem: selectedItem,
        draftName: draftName,

        selectTemplate: function(item) {
            selectedItem(item);
        },

        createDraft: function () {
            if (selectedItem()) {
                var url = '#drafts/create/' + selectedItem().name;
                var queryString = [];
                if (draftName()) queryString.push('name=' + encodeURIComponent(draftName()));

                var template = selectedItem().template;
                if (template.parameters) {
                    template.parameters.forEach(function (p) {
                        if (p.value) queryString.push(p.name + '=' + encodeURIComponent(p.value));
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