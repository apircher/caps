define([
    'ko',
    'infrastructure/contentReferences',
    'infrastructure/urlHelper'
],
function (ko, ContentReferenceManager, urlHelper) {
    
    var crmgr = new ContentReferenceManager({
        replaceFileReference: function (reference, language, context) {
            var publication = reference.context,
                publicationFile = publication.findFile(reference.fileName),
                resource = publicationFile.getResource(language),
                fileVersion = resource !== null ? resource.FileVersion() : undefined;
            return urlHelper.getFileUrl(reference.fileName, fileVersion, reference.query);
        },
        replacePublicationReference: function (reference, language, context) {
            return urlHelper.getPublicationUrl(reference.id, language, reference.query);
        }
    });

    /*
     * PublicationViewModel class
     */
    function PublicationViewModel(siteMapNode) {
        var self = this,
            publication = siteMapNode != null ? siteMapNode.Content() : null;

        self.publication = publication;
        self.template = ko.observable(publication ? publication.template() : null);
        self.files = ko.computed(function () {
            if (!publication) return [];
            return publication.Files();
        });

        self.findContentPart = function (templateCell) {
            if (publication) {
                var cp = publication.getContentPart(templateCell.name);
                if (cp) {
                    var text = cp.getResource('de').Content();
                    return crmgr.replaceReferences(publication, text, 'de');
                }
            }
            return '';
        };
    }

    return PublicationViewModel;

});