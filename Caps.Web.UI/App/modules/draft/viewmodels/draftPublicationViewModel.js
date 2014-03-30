define([
    'ko',
    'moment',
    '../contentGenerator',
    'infrastructure/publicationService'
],
function (ko, moment, contentGenerator, publicationService) {

    /*
     * PublicationViewModel class
     */
    function PublicationViewModel(draft, sitemapNode) {
        var self = this;

        self.draft = ko.observable(draft);
        self.sitemapNode = ko.observable(sitemapNode);

        self.title = ko.computed(function () {
            return self.sitemapNode().path();
        });

        self.contentVersion = ko.computed(function () {
            if (self.sitemapNode().Content())
                return 'v.' + self.sitemapNode().Content().ContentVersion();
            return '';
        });

        self.createdAt = ko.computed(function () {
            return moment.utc(self.sitemapNode().Created().At()).fromNow();
        });

        self.createdBy = ko.computed(function () {
            return self.sitemapNode().Created().By();
        });

        self.modifiedAt = ko.computed(function () {
            if (!self.sitemapNode().Content())
                return '';
            return moment.utc(self.sitemapNode().Content().ContentDate()).fromNow();
        });

        self.modifiedBy = ko.computed(function () {
            if (!self.sitemapNode().Content())
                return '';
            return self.sitemapNode().Content().AuthorName();
        });

        self.isOutdated = ko.computed(function () {
            if (self.sitemapNode().Content())
                return self.sitemapNode().Content().ContentVersion() < self.draft().Version();
            return false;
        });

        self.republish = function () {
            var content = contentGenerator.createPublicationContent(this.draft());
            publicationService.republish(this.sitemapNode().Id(), content);
        };
    }

    return PublicationViewModel;

});