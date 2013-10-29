define(['../module', '../datacontext', 'ko', 'durandal/app', 'moment'], function (module, datacontext, ko, app, moment) {

    var drafts = ko.observableArray(),
        selectedDraft = ko.observable(),
        template = ko.observable(),
        initialized = false;

    app.on('caps:draft:saved', function (args) {
        var draft = args.entity;
        if (selectedDraft() && draft.Id() === selectedDraft().Id())
            loadDraft(draft.Id());
        if (args.isNewDraft) {
            loadDrafts().
                then(function () {
                    vm.selectDraftById(draft.Id());
                });            
        }
    });

    var vm = {
        drafts: drafts,
        selectedDraft: selectedDraft,
        template: template,

        activate: function () {
            if (!initialized) {
                initialized = true;
                loadDrafts().then(selectFirstDraft);
            }
        },

        addDraft: function () {
            module.router.navigate('#drafts/create');
        },

        editDraft: function (draft) {
            module.router.navigate('#drafts/edit/' + draft.Id());
        },

        editSelectedDraft: function () {
            vm.editDraft(selectedDraft());
        },

        selectDraft: function (draft) {
            selectedDraft(draft);
            template(null);
            loadDraft(draft.Id());
        },

        selectDraftById: function(id) {
            var draft = ko.utils.arrayFirst(drafts(), function (d) { return d.Id() === id; });
            if (draft) vm.selectDraft(draft);
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
        return datacontext.getDrafts().then(function (data) {
            drafts(data.results);
        });
    }

    function selectFirstDraft() {
        if (drafts().length) {
            var d = drafts()[0];
            selectedDraft(d);
            loadDraft(d.Id());
        }
    }

    function loadDraft(id) {
        datacontext.getDraft(id).then(function (data) {
            var t = data.results[0].deserializeTemplate();
            template(t);
        });
    }

    return vm;
});