define(['ko'], function (ko) {

    function LocalizedDraftFile(draftFile, resource) {
        var self = this;
        self.draftFile = draftFile;
        self.language = resource.Language();
        self.resource = resource;

        self.fallbackResource = ko.computed(function () {
            return draftFile.getResource('de');
        });

        self.embedSrc = ko.computed(function () {
            return 'caps://draft-file/' + escape(self.resource.File().FileName());
        });
    }

    return {
        LocalizedDraftFile: LocalizedDraftFile
    };
});