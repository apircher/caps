define(['../module', '../datacontext', 'ko'], function (module, datacontext, ko) {

    var drafts = ko.observableArray();

    var vm = {
        drafts: drafts,

        activate: function () {
            loadDrafts();
        },

        addDraft: function () {
            module.router.navigate('#drafts/create');
        },

        editDraft: function (draft) {
            module.router.navigate('#drafts/edit/' + draft.Id());
        }
    };

    function loadDrafts() {
        datacontext.getDrafts().then(function (data) {
            drafts(data.results);
        });
    }

    return vm;
});