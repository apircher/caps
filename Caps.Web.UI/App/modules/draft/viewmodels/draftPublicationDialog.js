define([
    'durandal/system',
    'durandal/app',
    'plugins/dialog',
    'ko',
    'modules/sitemap/viewmodels/siteMapTree',
    '../datacontext',
    './draftPublicationViewModel',
    '../contentGenerator',
    'infrastructure/publicationService'
],
function (system, app, dialog, ko, SiteMapTree, datacontext, PublicationViewModel, contentGenerator, publicationService) {


    function DraftPublicationDialog(draft) {
        var self = this;

        self.draft = ko.observable(draft);
        self.siteMapTree = new SiteMapTree();
        self.publications = ko.observableArray();

        self.hasOutdatedPublications = ko.computed(function () {
            var coll = self.publications();
            for (var i = 0; i < coll.length; i++) {
                if (coll[0].isOutdated()) return true;
            }
            return false;
        });
    }

    DraftPublicationDialog.prototype.activate = function () {
        // fetch data
        var self = this,
            draft = self.draft();

        self.siteMapTree.fetchSiteMapVersions();
        fetchDraftPublications(draft).then(function (data) {
            self.publications(data);
        });

        function fetchDraftPublications(draft) {
            return system.defer(function (dfd) {
                datacontext.fetchPublications(draft.Id()).then(function (results) {
                    dfd.resolve(ko.utils.arrayMap(results, function (sn) {
                        return new PublicationViewModel(draft, sn);
                    }));
                })
                .fail(dfd.reject);
            })
            .promise();
        }
    };

    DraftPublicationDialog.prototype.selectCreateNew = function () {
        var self = this;

        // Create Publication
        try {
            var cnt = contentGenerator.createPublicationContent(self.draft());
            publicationService.publish(cnt, self.siteMapTree.selectedNode())
                .then(function () {
                    dialog.close(self, {
                        dialogResult: true
                    });
                })
                .fail(function (error) {
                    alert(error.message);
                });
        }
        catch (error) {
            alert(error.message);
        }
    };

    DraftPublicationDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    DraftPublicationDialog.prototype.selectLink = function () {
        var self = this,
            btnOk = 'Inhalt ersetzen',
            btnCancel = 'Abbrechen';

        app.showMessage('Soll der Inhalt der Seite wirklich ersetzt werden?', 'Inhalt ersetzen?', [btnOk, btnCancel]).then(function (dialogResult) {
            if (dialogResult === btnOk) setContentConfirmed();
        });

        function setContentConfirmed() {
            // Create Publication
            try {
                var cnt = contentGenerator.createPublicationContent(self.draft());

                publicationService.setNodeContent(self.siteMapTree.selectedNode().Id(), cnt)
                    .then(function () {
                        dialog.close(self, {
                            dialogResult: true
                        });
                    })
                    .fail(function (error) {
                        alert(error.message);
                    });
            }
            catch (error) {
                alert(error.message);
            }
        }
    };

    return DraftPublicationDialog;
});