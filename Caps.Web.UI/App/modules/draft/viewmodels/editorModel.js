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
            var orderedFiles = self.draftFile.Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(self.draftFile);

            if (index <= 0)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index - 1, 0, self.draftFile);

            setRankings(orderedFiles);
        };

        self.moveDown = function () {
            var orderedFiles = self.draftFile.Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(self.draftFile);

            if (index >= orderedFiles.length - 1)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index + 1, 0, self.draftFile);

            setRankings(orderedFiles);
        };

        self.showGroup = ko.observable(false);
        self.selectGroup = function () {
            self.showGroup(true);
        };
        
        function setRankings(files) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].Ranking() !== i + 1)
                    files[i].Ranking(i + 1);
            }
        }
    }

    /*
     * DraftFileGroup
     */
    function DraftFileGroup(draft, groupName) {
        var self = this;
        self.draft = ko.observable(draft);
        self.groupName = ko.observable(groupName);
        self.groupFilter = ko.observable(groupName);
        self.isExpanded = ko.observable(false);
        self.toggleIsExpanded = function () { self.isExpanded(!self.isExpanded()); };

        self.groupName.subscribe(function (newValue) {
            var files = self.files().slice(0);
            files.forEach(function (file) { file.draftFile.Group(newValue); });
            self.groupFilter(newValue);
        });

        self.files = ko.computed(function () {
            var draft = self.draft(),
            files = [];
            if (draft) {
                files = ko.utils.arrayMap(draft.filesByGroupName(self.groupFilter()), function (file) {
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
        
        self.groupFilter.subscribe(function (newValue) {
            var files = self.files().slice(0);
            files.forEach(function (f) { f.draftFile.Group(newValue); });
        });
    }

    DraftFileGroup.prototype.refresh = function () {
    };

    return {
        DraftFileViewModel: DraftFileViewModel,
        DraftFileGroup: DraftFileGroup
    };
});