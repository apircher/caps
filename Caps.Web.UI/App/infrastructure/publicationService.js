define([
    'durandal/system',
    'durandal/app',
    'entityManagerProvider',
    'breeze',
    'ko'
],
function (system, app, entityManagerProvider, breeze, ko) {

    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery;

    /*
     * Publish content.
     */
    function publishContent(sitemapId, parentId, content) {
        return system.defer(function (dfd) {
            var sitemapNode = manager.createEntity('SitemapNode', { NodeType: 'PAGE' });
            manager.addEntity(sitemapNode);
            sitemapNode.ParentNodeId(parentId);
            sitemapNode.SitemapId(sitemapId);

            updateSitemapNodeResources(sitemapNode, content);

            var publicationContent = manager.createEntity('SitemapNodeContent', {
                EntityType: content.entityType,
                EntityKey: content.entityId,
                ContentVersion: content.version,
                ContentDate: content.modified.at,
                AuthorName: content.created.by
            });
            manager.addEntity(publicationContent);
            sitemapNode.ContentId(publicationContent.Id());

            manager.saveChanges().then(function () {
                app.trigger('caps:publication:created', sitemapNode);
                dfd.resolve(sitemapNode);
            })
            .fail(dfd.reject);
        })
        .promse();
    }

    function updateSitemapNodeResources(sitemapNode, content) {
        ko.utils.arrayForEach(content.resources, function (res) {
            var nodeResource = sitemapNode.getOrCreateResource(res.language, manager);
            nodeResource.Title(res.title);
            nodeResource.Description(res.description);
            nodeResource.Keywords(res.keywords);
        });
    }

    /*
     * Refresh publication
     */
    function refreshContent(sitemapNodeId, content) {
        return system.defer(function (dfd) {
            // Fetch Node
            fetchNode(sitemapNodeId).then(function (sitemapNode) {

                // Update Resources
                updateSitemapNodeResources(sitemapNode, content);

                // Update Content
                var smnc = sitemapNode.Content();
                smnc.ContentVersion(content.version);
                smnc.ContentDate(content.modified.at);
                smnc.AuthorName(content.created.by);

                manager.saveChanges().then(function () {
                    app.trigger('caps:publication:refreshed', sitemapNode);
                    dfd.resolve(sitemapNode);
                })
                .fail(dfd.reject);
            });
        })
        .promse();
    }

    function fetchNode(sitemapNodeId) {
        return system.defer(function (dfd) {
            var query = new EntityQuery().from('SitemapNodes').where('Id', '==', sitemapNodeId)
                .expand('Resources, Content');
            manager.executeQuery(query).then(function (data) {
                dfd.resolve(data.results[0]);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    return {
        publish: function (module, content) {
            return system.defer(function (dfd) {
                app.selectSitemapNode({ module: module }).then(function (result) {
                    if (result.dialogResult) {
                        publishContent(result.selectedSitemapNode.SitemapId(), result.selectedSitemapNode.Id(), content)
                            .then(dfd.resolve)
                            .fail(dfd.reject);
                    }
                });
            })
            .promise();
        },

        republish: function (sitemapNodeId, content) {
            return system.defer(function (dfd) {
                refreshContent(sitemapNodeId, content)
                    .then(dfd.resolve)
                    .fail(dfd.reject);
            })
            .promse();
        }
    };
});