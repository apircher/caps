define(['../module', '../datacontext', 'ko'], function (module, datacontext, ko) {

    var drafts = ko.observableArray(),
        selectedDraft = ko.observable(),
        template = ko.observable();

    var vm = {
        drafts: drafts,
        selectedDraft: selectedDraft,
        template: template,

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
            template(null);

            datacontext.getDraft(draft.Id()).then(function (data) {
                var t = selectedDraft().deserializeTemplate();
                template(t);
            });
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
        },

        getContent: function (templateCell) {
            var cp = selectedDraft().findContentPart(templateCell.name);
            if (cp) {
                var res = cp.findResource('de');
                if (res) return res.Content();
            }
            return '<i>[leer]</i>';
        },

        getContentPartTemplate: function (templateCell) {
            var cp = selectedDraft().findContentPart(templateCell.name);
            if (cp) {
                if (cp.ContentType().toLowerCase() === 'html')
                    return 'CT_HTML';
                if (cp.ContentType().toLowerCase() === 'markdown')
                    return 'CT_MARKDOWN';
            }
            return 'CT_TEXT';
        }
    };

    function loadDrafts() {
        datacontext.getDrafts().then(function (data) {
            drafts(data.results);
        });
    }

    return vm;
});