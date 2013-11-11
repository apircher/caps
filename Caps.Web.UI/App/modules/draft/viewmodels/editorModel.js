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
            if (self.resource && self.resource.FileVersion())
                return 'caps://content-file/' + escape(self.resource.FileVersion().File().FileName());
            return '';
        });
    }

    return {
        LocalizedDraftFile: LocalizedDraftFile
    };
});