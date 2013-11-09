define([
    'durandal/system',
    'durandal/app',
    'entityManagerProvider',
    'breeze',
    'ko'
],
function (system, app, entityManagerProvider, breeze, ko) {

    var EntityQuery = breeze.EntityQuery;

    /*
     * Class Publisher
     */
    function Publisher() {
        var self = this;
        self.manager = entityManagerProvider.createManager();
    }

    Publisher.prototype.createPublication = function (sitemapId, parentId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            var sitemapNode = self.manager.createEntity('SitemapNode', { NodeType: 'PAGE' });
            self.manager.addEntity(sitemapNode);
            sitemapNode.ParentNodeId(parentId);
            sitemapNode.SitemapId(sitemapId);

            self.createResources(sitemapNode, contentData);

            var publicationContent = self.createPublicationContent(contentData, self.manager);
            sitemapNode.ContentId(publicationContent.Id());

            self.manager.saveChanges().then(function () {
                app.trigger('caps:publication:created', sitemapNode);
                dfd.resolve(sitemapNode);
            })
            .fail(dfd.reject);
        })
        .promse();
    };

    Publisher.prototype.createResources = function (sitemapNode, contentData) {
        var self = this;
        ko.utils.arrayForEach(contentData.resources, function (res) {
            var nodeResource = sitemapNode.getOrCreateResource(res.language, self.manager);
            nodeResource.Title(res.title);
            nodeResource.Description(res.description);
            nodeResource.Keywords(res.keywords);
        });
    };

    Publisher.prototype.createPublicationContent = function (contentData) {
        var self = this;
        var sitemapNodeContent = self.manager.createEntity('SitemapNodeContent', {
            EntityType: contentData.entityType,
            EntityKey: contentData.entityId,
            ContentVersion: contentData.version,
            ContentDate: contentData.modified.at,
            AuthorName: contentData.created.by,
            TemplateData: contentData.templateContent
        });
        self.manager.addEntity(sitemapNodeContent);

        // ContentParts
        ko.utils.arrayForEach(contentData.contentParts, function (contentPartData) {
            var cp = sitemapNodeContent.getOrCreateContentPart(contentPartData.partType, self.manager);
            cp.ContentType(contentPartData.contentType);
            cp.Ranking(contentPartData.ranking);

            ko.utils.arrayForEach(contentPartData.resources, function (res) {
                var cpr = cp.getOrCreateResource(res.language, self.manager);
                cpr.Content(res.content);
            });
        });
        
        // ContentFiles
        ko.utils.arrayForEach(contentData.files, function (file) {
            var cf = self.manager.createEntity('SitemapNodeContentFile', { SitemapNodeContentId: sitemapNodeContent.Id() });
            self.manager.addEntity(cf);

            cf.Name(file.name);
            cf.IsEmbedded(file.isEmbedded);
            cf.Determination(file.determination);
            cf.Group(file.group);
            cf.Ranking(file.ranking);
            
            ko.utils.arrayForEach(file.resources, function (res) {
                var cfr = cf.getOrCreateResource(res.language, self.manager);
                cfr.DbFileId(res.dbFileId);
                cfr.Title(res.title);
                cfr.Description(res.description);
                cfr.Credits(res.credits);
            });
        });

        return sitemapNodeContent;
    };

    Publisher.prototype.refreshPublication = function (sitemapNodeId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            // Fetch node
            fetchNode(sitemapNodeId).then(function (sitemapNode) {

                // Update resources
                self.createResources(sitemapNode, contentData);

                // Update content
                sitemapNode.Content().setDeleted();
                var smnc =  self.createPublicationContent(contentData);
                sitemapNode.ContentId(smnc.Id());

                self.manager.saveChanges().then(function () {
                    app.trigger('caps:publication:refreshed', sitemapNode);
                    dfd.resolve(sitemapNode);
                })
                .fail(dfd.reject);
            });
        })
        .promse();

        function fetchNode(sitemapNodeId) {
            return system.defer(function (dfd) {
                var query = new EntityQuery().from('SitemapNodes').where('Id', '==', sitemapNodeId)
                    .expand('Resources, Content');
                self.manager.executeQuery(query).then(function (data) {
                    dfd.resolve(data.results[0]);
                })
                .fail(dfd.reject);
            })
            .promise();
        }
    };
    

    return {
        publish: function (module, contentData) {
            return system.defer(function (dfd) {
                app.selectSitemapNode({ module: module }).then(function (result) {
                    if (result.dialogResult) {
                        var publisher = new Publisher();
                        publisher.createPublication(result.selectedSitemapNode.SitemapId(), result.selectedSitemapNode.Id(), contentData)
                            .then(dfd.resolve)
                            .fail(dfd.reject);
                    }
                });
            })
            .promise();
        },

        republish: function (sitemapNodeId, contentData) {
            return system.defer(function (dfd) {
                var publisher = new Publisher();
                publisher.refreshPublication(sitemapNodeId, contentData)
                    .then(dfd.resolve)
                    .fail(dfd.reject);
            })
            .promse();
        }
    };
});