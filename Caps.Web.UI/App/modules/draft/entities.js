/*
 * draft/entities.js
 */
define([
    'require',
    'ko',
    'durandal/system'
],
function (require, ko, system) {

    // Supported Draft States
    var draftStates = [
        {
            value: 'NEW',
            title: 'Entwurf in Arbeit'
        },
        {
            value: 'RFT',   // Ready for Translation
            title: 'Übersetzung in Arbeit'
        },
        {
            value: 'RFP',   // Ready for Publication
            title: 'Bereit zur Veröffentlichung'
        }
    ];
    
    /**
     * Draft Entity
     */
    function Draft() {

    }

    function InitializeDraft(draft) {
        draft.template = ko.computed({
            read: function () {
                return draft.deserializeTemplate();
            },
            deferEvaluation: true
        });
        draft.fileGroupNames = ko.computed(function () {
            return ko.utils.arrayMap(draft.Files(), function (f) { return f.Group() || ''; });
        });
        draft.distinctFileGroupNames = ko.computed(function () {
            return ko.utils.arrayGetDistinctValues(draft.fileGroupNames());
        });
        draft.orderedFiles = ko.computed(function () {
            var files = draft.Files();
            files.sort(function (a, b) {
                if (a.Group() !== b.Group())
                    return compareGroups(a, b);
                else
                    return compareRankings(a, b);
            });
            return files;

            function compareGroups(a, b) {
                if (a.Group() === b.Group()) return 0;
                return a.Group() <= b.Group() ? - 1 : 1;
            }
            function compareRankings(a, b) {
                if (a.Ranking() === b.Ranking()) return 0;
                return a.Ranking() <= b.Ranking() ? -1 : 1;
            }
        });

        draft.statusTitle = ko.computed(function () {
            if (!draft.Status()) return '';
            var key = draft.Status().toLowerCase(),
                vm = ko.utils.arrayFirst(draftStates, function (ds) { return ds.value.toLowerCase() === key; });
            return vm ? vm.title : '';
        });
    }

    Draft.prototype.getTranslation = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Translations(), function (t) {
            return t.Language().toLowerCase() === key;
        });
    };
    
    Draft.prototype.getOrCreateTranslation = function (language, manager) {
        var key = language.toLowerCase(),
            translation = this.getTranslation(language);
        if (translation)
            return translation;

        translation = manager.createEntity('DraftTranslation', {
            DraftId: this.Id(),
            Language: key
        });
        manager.addEntity(translation);
        this.Translations.push(translation);
        return translation;
    };

    Draft.prototype.findContentPart = function (name) {
        var part = ko.utils.arrayFirst(this.ContentParts(), function (p) {
            return p.Name().toLowerCase() === name.toLowerCase();
        });
        return part;
    };

    Draft.prototype.findDraftFile = function (fileName, language) {
        language = language || 'de';
        var key = fileName.toLowerCase(),
            file = ko.utils.arrayFirst(this.Files(), function (f) {
                var res = f.getResource(language);
                if (!res) return false;
                return res.FileVersion() && res.FileVersion().File().FileName().toLowerCase() === key;
            });
        return file;
    };

    Draft.prototype.deserializeTemplate = function () {
        var t;
        try {
            t = JSON.parse(this.Template());
        }
        catch (error) {
            system.log(error.message);
        }
        if (!t) return undefined;

        t.findCell = function (cellName) {
            for (var r = 0; r < t.rows.length; r++) {
                var row = t.rows[r];
                for (var c = 0; c < row.cells.length; c++) {
                    var cell = row.cells[c];
                    if (cell.name.toLowerCase() === cellName.toLowerCase())
                        return cell;
                }
            }
            return undefined;
        };

        return t;
    };

    Draft.prototype.setDeleted = function () {
        while (this.Translations().length) {
            this.Translations()[0].entityAspect.setDeleted();
        }        
        while (this.ContentParts().length) {
            this.ContentParts()[0].setDeleted();
        }
        while (this.Files().length) {
            this.Files()[0].setDeleted();
        }
        this.entityAspect.setDeleted();
    };

    Draft.prototype.filesByGroupName = function (groupName) {
        var files = ko.utils.arrayFilter(this.Files(), function (file) {
            var gn = file.Group() || '';
            return gn.toLowerCase() === groupName.toLowerCase();
        });
        return files;
    };

    Draft.prototype.filesByDetermination = function (determination) {
        var files = ko.utils.arrayFilter(this.Files(), function (file) {
            var gn = file.Determination() || '';
            return gn.toLowerCase() === determination.toLowerCase();
        });
        return files;
    };

    /**
     * DraftContentPart Entity
     */
    function DraftContentPart() {
        var self = this;
    }

    DraftContentPart.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    DraftContentPart.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
            resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DraftContentPartResource', {
            DraftContentPartId: this.Draft().Id(),
            Language: key,
            Content: ''
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    DraftContentPart.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }
        this.entityAspect.setDeleted();
    };

    DraftContentPart.prototype.previewText = function (language, length) {
        language = language || 'de';
        length = length || 80;
        var res = this.getResource(language);
        if (res && res.Content()) {
            var content = res.Content();
            return content.length > length ? content.substr(0, length - 3) + '...' : content;
        }
        return '';
    };

    /**
     * DraftFile Entity
     */
    function DraftFile() {
    }

    DraftFile.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }
        this.entityAspect.setDeleted();
    };

    DraftFile.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    DraftFile.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DraftFileResource', {
            DraftFileId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;    
    };

    return {
        Draft: Draft,
        DraftContentPart: DraftContentPart,

        supportedDraftStates: draftStates,

        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('Draft', Draft, InitializeDraft);
            metadataStore.registerEntityTypeCtor('DraftContentPart', DraftContentPart);
            metadataStore.registerEntityTypeCtor('DraftFile', DraftFile);
        }
    };

});