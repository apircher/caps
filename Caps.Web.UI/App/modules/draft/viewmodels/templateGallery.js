define(['ko', '../datacontext', '../module'], function (ko, datacontext, module) {

    var templates = ko.observableArray(datacontext.getTemplates());

    return {
        templates: templates,
        createDraft: function (template) {
            module.router.navigate('#drafts/create/' + template.name);
        }
    };
});