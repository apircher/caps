define(['ko'], function (ko) {

    /*
     * DraftFileViewModel
     */
    function DraftFileViewModel(draftFile, resource) {
        var self = this;
        self.draftFile = draftFile;
        self.language = resource.Language();
        self.resource = resource;

        self.fallbackResource = ko.computed(function () {
            return draftFile.getResource('de');
        });

        self.embedSrc = ko.computed(function () {
            if (self.resource && self.resource.FileVersion())
                return 'caps://content-file/' + escape(self.resource.FileVersion().File().FileName());
            return '';
        });

        self.moveUp = function () {
            self.draftFile.Ranking(self.draftFile.Ranking() - 1);
        };

        self.moveDown = function () {
            self.draftFile.Ranking(self.draftFile.Ranking() + 1);
        };

        self.showGroup = ko.observable(false);
        self.selectGroup = function () {
            self.showGroup(true);
        };
    }

    /*
     * DraftFileGroup
     */
    function DraftFileGroup(draft, groupName) {
        var self = this;
        self.draft = ko.observable(draft);
        self.groupName = ko.observable(groupName);
        self.isExpanded = ko.observable(false);
        self.toggleIsExpanded = function () { self.isExpanded(!self.isExpanded()); };

        self.files = ko.computed(function () {
            var draft = self.draft(),
            files = [];
            if (draft) {
                files = ko.utils.arrayMap(draft.filesByGroupName(self.groupName()), function (file) {
                    return new DraftFileViewModel(file, file.getOrCreateResource('de'));
                });
            }
            return files;
        });
        self.sortedFiles = ko.computed(function () {
            var result = self.files();
            result.sort(function (a, b) {
                if (!a || !a.draftFile || !b || !b.draftFile) return 0;
                var r1 = a.draftFile.Ranking(),
                    r2 = b.draftFile.Ranking();
                return r1 === r2 ? 0 : r1 < r2 ? -1 : 1;
            });
            return result;
        });
        
        self.groupName.subscribe(function (newValue) {
            var files = self.files().slice(0);
            files.forEach(function (f) { f.draftFile.Group(newValue); });
        });
    }

    DraftFileGroup.prototype.refresh = function () {
        //var draft = this.draft(),
        //    files = [];
        //if (draft) {
        //    files = ko.utils.arrayMap(draft.filesByGroupName(this.groupName()), function (file) {
        //        return new DraftFileViewModel(file, file.getOrCreateResource('de'));
        //    });
        //}
        //this.files(files);
    };

    return {
        DraftFileViewModel: DraftFileViewModel,
        DraftFileGroup: DraftFileGroup
    };
});