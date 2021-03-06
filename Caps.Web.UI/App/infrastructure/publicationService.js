﻿/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides services for publishing content.
 */
define([
    'durandal/system',
    'durandal/app',
    'entityManagerProvider',
    'breeze',
    'ko'
],
function (system, app, entityManagerProvider, breeze, ko) {
    'use strict';

    var EntityQuery = breeze.EntityQuery;

    /**
     * Publisher class
     */
    function Publisher() {
        var self = this;
        self.manager = entityManagerProvider.createManager();
    }

    Publisher.prototype.publish = function (siteMapId, parentNodeId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            var query = new EntityQuery().from('SiteMaps').where('Id', '==', siteMapId).expand('SiteMapNodes');
            self.manager.executeQuery(query).then(function (data) {
                var siteMap = data.results[0],
                    parentNode = ko.utils.arrayFirst(siteMap.SiteMapNodes(), function(n) { return n.Id() === parentNodeId; }),
                    nextRanking = parentNode ? parentNode.maxChildNodeRanking() + 1 : 0;

                var node = self.manager.createEntity('DbSiteMapNode', { NodeType: 'PAGE', Name: contentData.name, Ranking: nextRanking });
                self.manager.addEntity(node);

                node.SiteMapId(siteMapId);
                if (parentNode) node.ParentNodeId(parentNode.Id());

                self.createResources(node, contentData);

                var publication = self.createPublication(contentData, self.manager);
                node.ContentId(publication.Id());

                self.manager.saveChanges().then(function () {
                    app.trigger('caps:publication:created', node);
                    dfd.resolve(node);
                })
                .fail(dfd.reject);
            });
        })
        .promise();
    };

    Publisher.prototype.setNodeContent = function(siteMapNodeId, contentData) {
        var self = this;
        return system.defer(function (dfd) {
            // Fetch node
            fetchNode(self.manager, siteMapNodeId).then(function (node) {
                // Update content
                if (node.Content())
                    node.Content().setDeleted();

                var publication = self.createPublication(contentData);
                node.ContentId(publication.Id());

                self.manager.saveChanges().then(function () {
                    app.trigger('caps:publication:refreshed', node);
                    dfd.resolve(node);
                })
                .fail(dfd.reject);
            });
        })
        .promise();
    };

    Publisher.prototype.createTeaser = function (siteMapId, parentNodeId, contentNodeId) {
        var self = this;
        return system.defer(function (dfd) {            
            var query = new EntityQuery().from('SiteMaps').where('Id', '==', siteMapId).expand('SiteMapNodes.Resources');
            self.manager.executeQuery(query).then(function (data) {
                var siteMap = data.results[0],
                    parentNode = ko.utils.arrayFirst(siteMap.SiteMapNodes(), function (n) { return n.Id() === parentNodeId; }),
                    nextRanking = parentNode ? parentNode.maxChildNodeRanking() + 1 : 0,
                    contentNode = ko.utils.arrayFirst(siteMap.SiteMapNodes(), function (n) { return n.Id() === contentNodeId; });

                self.contentFromNode(contentNode).then(function (contentData) {
                    var node = self.manager.createEntity('DbSiteMapNode', { NodeType: 'TEASER', Name: contentNode.Name(), Ranking: nextRanking, Redirect: contentNode.PermanentId() });
                    self.manager.addEntity(node);

                    node.SiteMapId(siteMapId);
                    if (parentNode) node.ParentNodeId(parentNode.Id());

                    self.createResources(node, contentData);

                    var publication = self.createPublication(contentData, self.manager);
                    node.ContentId(publication.Id());

                    self.manager.saveChanges().then(function () {
                        app.trigger('caps:publication:created', node);
                        dfd.resolve(node);
                    })
                    .fail(dfd.reject);
                });
            });
        })
        .promise();
    };

    Publisher.prototype.contentFromNode = function (siteMapNode) {
        var self = this;
        return system.defer(function (dfd) {
            var query = new EntityQuery().from('Publications').where('Id', '==', siteMapNode.ContentId())
                .expand('Translations, ContentParts.Resources, Files.Resources.FileVersion.File');
            self.manager.executeQuery(query).then(function (data) {
                var pb = data.results[0];
                dfd.resolve(pb.generateContentData(siteMapNode));
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
            var firstPicture = findFirstPicture(contentData, res);
            if (firstPicture) {
                var pr = findFileResource(firstPicture, res.language);
                if (pr) nodeResource.PictureFileVersionId(pr.dbFileVersionId);
            }
        });
    };

    Publisher.prototype.createPublication = function (contentData) {
        var self = this;
        var publication = self.manager.createEntity('Publication', {
            EntityType: contentData.entityType,
            EntityKey: contentData.entityId,
            ContentVersion: contentData.version,
            ContentDate: new Date(),
            AuthorName: contentData.modified.by,
            Template: contentData.template
        });
        self.manager.addEntity(publication);

        // ContentParts
        ko.utils.arrayForEach(contentData.contentParts, function (contentPartData) {
            var part = publication.getOrCreateContentPart(contentPartData.name, self.manager);
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
                resource.DbFileVersionId(resourceData.dbFileVersionId);
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
            fetchNode(self.manager, siteMapNodeId).then(function (node) {

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
        .promise();
    };

    function fetchNode(manager, siteMapNodeId) {
        return system.defer(function (dfd) {
            var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', siteMapNodeId)
                .expand('Resources, Content');
            manager.executeQuery(query).then(function (data) {
                dfd.resolve(data.results[0]);
            })
            .fail(dfd.reject);
        })
        .promise();
    }

    function findFirstPicture(contentData, res) {
        var files = contentData.files;
        if (files && files.length) {
            var sortedFiles = files.slice(0);
            sortedFiles.sort(function (a, b) { return a.ranking < b.ranking; });
            return ko.utils.arrayFirst(files, function (f) {
                return f.determination == 'Picture';
            });
        }
        return null;
    }
    
    function findFileResource(file, language) {
        if (!file || !file.resources || !file.resources.length) return null;
        var r = ko.utils.arrayFirst(file.resources, function (r) { return r.language === language; });
        return r || file.resources[0];
    }

    return {
        publish: function (contentData, parentNode) {
            var publisher = new Publisher();
            return publisher.publish(parentNode.SiteMapId(), parentNode.Id(), contentData);
        },

        republish: function (siteMapNodeId, contentData) {
            var publisher = new Publisher();
            return publisher.republish(siteMapNodeId, contentData);
        },

        createTeaser: function (siteMapId, parentNodeId, contentNodeId) {
            var publisher = new Publisher();
            return publisher.createTeaser(siteMapId, parentNodeId, contentNodeId);
        },

        setNodeContent: function (siteMapNodeId, contentData) {
            var publisher = new Publisher();
            return publisher.setNodeContent(siteMapNodeId, contentData);
        }
    };
});