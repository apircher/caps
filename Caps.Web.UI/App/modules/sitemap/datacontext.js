define([
    'entityManagerProvider',
    'breeze',
    'durandal/system'
],
function (entityManagerProvider, breeze, system) {

    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery;

    function createInitialSiteMap(website) {
        var siteMap = manager.createEntity('DbSiteMap', { WebsiteId: website.Id(), Version: 1 }),
            rootNode = manager.createEntity('DbSiteMapNode', { NodeType: 'ROOT', Name: 'HOME' }),
            rootNodeResource = rootNode.getOrCreateResource('de', manager);

        rootNode.SiteMapId(siteMap.Id());
        rootNodeResource.Title('Startseite');
        manager.addEntity(rootNode);

        return siteMap;
    }

    function createNewSiteMapVersion(website) {
        return system.defer(function (dfd) {
            if (!website) dfd.reject(new Error('No website provided.'));

            var latestVersion = website.latestSiteMap(),
                nextVersion = latestVersion ? latestVersion.Version() + 1 : 1,
                sitemapVersion;
            if (latestVersion)
                sitemapVersion = latestVersion.createNewVersion(nextVersion, manager);
            else
                sitemapVersion = createInitialSiteMap(website);

            manager.saveChanges().then(function () {
                dfd.resolve(sitemapVersion);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function deleteSiteMapVersion(siteMapVersion) {
        return system.defer(function (dfd) {
            siteMapVersion.setDeleted();
            manager.saveChanges().then(dfd.resolve).fail(dfd.reject);
        })
        .promise();
    }

    function publishSiteMap(siteMapVersion, userName) {
        siteMapVersion.PublishedFrom(new Date());
        siteMapVersion.PublishedBy(userName);
        return manager.saveChanges();
    }

    function createSiteMapNode(siteMap, parentNode) {
        return system.defer(function (dfd) {
            if (!siteMap) dfd.reject(new Error('No siteMap provided'));
            if (!parentNode) dfd.reject(new Error('No parentNode provided'));

            var node = manager.createEntity('DbSiteMapNode', { NodeType: 'PAGE' });
            manager.addEntity(node);
            node.ParentNodeId(parentNode.Id());
            node.SiteMapId(siteMap.Id());

            var nodeResource = node.getOrCreateResource('de', manager);
            nodeResource.Title('Seite ' + (new Date()).toLocaleTimeString());

            manager.saveChanges().then(function () {
                dfd.resolve(node);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function deleteSiteMapNode(node) {
        node.setDeleted();
        return manager.saveChanges();
    }

    function fetchPublication(id) {
        return system.defer(function (dfd) {
            var query = new EntityQuery().from('Publications').where('Id', '==', id)
                .expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");
            manager.executeQuery(query).then(function (data) {
                dfd.resolve(data.results[0]);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function fetchFirstWebsite() {
        var query = new EntityQuery().from('Websites').expand('SiteMapVersions').take(1);
        return manager.executeQuery(query);
    }

    function fetchSiteMapNode(id) {
        var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', id).expand('Resources');
        return manager.executeQuery(query);
    }

    function fetchSiteMapNodeByContentId(contentId) {
        var query = new EntityQuery().from('SiteMapNodes').where('ContentId', '==', contentId).expand('SiteMap.Website.SiteMapVersions');
        return manager.executeQuery(query);
    }

    function fetchSiteMapNodes(siteMapId) {
        var query = new EntityQuery('SiteMapNodes').where('SiteMapId', '==', siteMapId).expand('Resources');
        return manager.executeQuery(query);
    }
    
    return {
        createInitialSiteMap: createInitialSiteMap,
        createNewSiteMapVersion: createNewSiteMapVersion,
        deleteSiteMapVersion: deleteSiteMapVersion,
        publishSiteMap: publishSiteMap,
        createSiteMapNode: createSiteMapNode,
        deleteSiteMapNode: deleteSiteMapNode,
        fetchPublication: fetchPublication,
        fetchFirstWebsite: fetchFirstWebsite,
        fetchSiteMapNode: fetchSiteMapNode,
        fetchSiteMapNodes: fetchSiteMapNodes,
        fetchSiteMapNodeByContentId: fetchSiteMapNodeByContentId,
        saveChanges: function () {
            return manager.saveChanges();
        }
    };

});