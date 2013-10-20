define(['../module', '../datacontext', 'ko'], function (module, datacontext, ko) {

    var drafts = ko.observableArray(),
        selectedDraft = ko.observable();

    var vm = {
        drafts: drafts,
        selectedDraft: selectedDraft,

        activate: function () {
            loadDrafts();
        },

        addDraft: function () {
            module.router.navigate('#drafts/create');
        },

        editDraft: function (draft) {
            module.router.navigate('#drafts/edit/' + draft.Id());
        },

        selectDraft: function (draft) {
            selectedDraft(draft);
            datacontext.getDraft(draft.Id());
        },

        formatDate: function (date) {
            var now = moment();
            var d = moment.utc(date);

            var diffDays = d.diff(now, 'days');
            if (diffDays < 7) {
                return d.format('dd HH:mm');
            }

            if (d.year() == now.year()) {
                return d.format('dd. D.MMM HH:mm');
            }

            return d.format('D.MMM YY HH:mm');            
        }
    };

    function loadDrafts() {
        datacontext.getDrafts().then(function (data) {
            drafts(data.results);
        });
    }

    return vm;
});