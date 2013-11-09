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

    Publisher.prototype.publish = function (siteMapId, parentNodeId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            var node = self.manager.createEntity('DbSiteMapNode', { NodeType: 'PAGE' });
            self.manager.addEntity(node);

            node.SiteMapId(siteMapId);
            node.ParentNodeId(parentNodeId);

            self.createResources(node, contentData);

            var publication = self.createPublication(contentData, self.manager);
            node.ContentId(publication.Id());

            self.manager.saveChanges().then(function () {
                app.trigger('caps:publication:created', node);
                dfd.resolve(node);
            })
            .fail(dfd.reject);
        })
        .promise();
    };

    Publisher.prototype.createResources = function (node, contentData) {
        var self = this;
        ko.utils.arrayForEach(contentData.resources, function (res) {
            var nodeResource = node.getOrCreateResource(res.language, self.manager);
            nodeResource.Title(res.title);
            nodeResource.Description(res.description);
            nodeResource.Keywords(res.keywords);
        });
    };

    Publisher.prototype.createPublication = function (contentData) {
        var self = this;
        var publication = self.manager.createEntity('Publication', {
            EntityType: contentData.entityType,
            EntityKey: contentData.entityId,
            ContentVersion: contentData.version,
            ContentDate: contentData.modified.at,
            AuthorName: contentData.created.by,
            TemplateData: contentData.templateContent
        });
        self.manager.addEntity(publication);

        // ContentParts
        ko.utils.arrayForEach(contentData.contentParts, function (contentPartData) {
            var part = publication.getOrCreateContentPart(contentPartData.partType, self.manager);
            part.ContentType(contentPartData.contentType);
            part.Ranking(contentPartData.ranking);

            ko.utils.arrayForEach(contentPartData.resources, function (resourceData) {
                var resource = part.getOrCreateResource(resourceData.language, self.manager);
                resource.Content(resourceData.content);
            });
        });
        
        // ContentFiles
        ko.utils.arrayForEach(contentData.files, function (fileData) {
            var file = self.manager.createEntity('PublicationFile', { PublicationId: publication.Id() });
            self.manager.addEntity(file);

            file.Name(fileData.name);
            file.IsEmbedded(fileData.isEmbedded);
            file.Determination(fileData.determination);
            file.Group(fileData.group);
            file.Ranking(fileData.ranking);
            
            ko.utils.arrayForEach(fileData.resources, function (resourceData) {
                var resource = file.getOrCreateResource(resourceData.language, self.manager);
                resource.DbFileId(resourceData.dbFileId);
                resource.Title(resourceData.title);
                resource.Description(resourceData.description);
                resource.Credits(resourceData.credits);
            });
        });

        return publication;
    };

    Publisher.prototype.republish = function (siteMapNodeId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            // Fetch node
            fetchNode().then(function (node) {

                // Update resources
                self.createResources(node, contentData);

                // Update content
                node.Content().setDeleted();
                var publication =  self.createPublication(contentData);
                node.ContentId(publication.Id());

                self.manager.saveChanges().then(function () {
                    app.trigger('caps:publication:refreshed', node);
                    dfd.resolve(node);
                })
                .fail(dfd.reject);
            });
        })
        .promse();

        function fetchNode() {
            return system.defer(function (dfd) {
                var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', siteMapNodeId)
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
                app.selectSiteMapNode({ module: module }).then(function (result) {
                    if (result.dialogResult) {
                        var publisher = new Publisher();
                        publisher.publish(result.selectedNode.SiteMapId(), result.selectedNode.Id(), contentData)
                            .then(dfd.resolve)
                            .fail(dfd.reject);
                    }
                });
            })
            .promise();
        },

        republish: function (siteMapNodeId, contentData) {
            return system.defer(function (dfd) {
                var publisher = new Publisher();
                publisher.republish(siteMapNodeId, contentData)
                    .then(dfd.resolve)
                    .fail(dfd.reject);
            })
            .promse();
        }
    };
});