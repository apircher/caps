define(['ko'], function (ko) {

    function LocalizedDraftFile(draftFile, resource) {
        var self = this;
        self.draftFile = draftFile;
        self.language = resource.Language();
        self.resource = resource;

        self.fallbackResource = ko.computed(function () {
            return draftFile.getResource('de');
        });
    }

    return {
        LocalizedDraftFile: LocalizedDraftFile
    };
});