
define(['ko', 'authentication'], function (ko, authentication) {

    /**
     * Website Entity
     */
    function Website() {
        var self = this;

        self.sortedSiteMapVersions = ko.computed({
            read: function () {
                items = self.SiteMapVersions().slice(0);
                items.sort(function (a, b) {
                    var vA = a.Version(), vB = b.Version();
                    return vA == vB ? 0 : vA > vB ? -1 : 1;
                });
                return items;
            },
            deferEvaluation: true
        });
    }

    Website.prototype.latestSiteMap = function () {
        var maxVersion = Math.max.apply(null, ko.utils.arrayMap(this.SiteMapVersions(), function (sitemap) { return sitemap.Version(); }));
        return ko.utils.arrayFirst(this.SiteMapVersions(), function (sitemap) {
            return sitemap.Version() === maxVersion;
        });
    };

    /**
     * SiteMap Entity
     */
    function SiteMap() {
        var self = this;
    }

    function SiteMapInitializer(sitemap) {
        sitemap.rootNodes = ko.computed({
            read: function () {
                return ko.utils.arrayFilter(sitemap.SiteMapNodes(), function (node) { return !node.ParentNodeId(); });
            },
            deferEvaluation: true
        });

        sitemap.siblings = ko.computed(function() {
            if (!sitemap.Website()) return [];
            return sitemap.Website().SiteMapVersions();
        });
    }

    SiteMap.prototype.previousVersion = function () {
        var self = this,
            arr = ko.utils.arrayFilter(self.siblings(), function (sitemap) { return sitemap.Version() < self.Version(); });
        if (!arr.length) return undefined;
        arr.sort(sortSiteMapsByVersionDesc);
        return arr[0];
    };

    SiteMap.prototype.nextVersion = function () {
        var self = this,
            arr = ko.utils.arrayFilter(self.siblings(), function (sitemap) { return sitemap.Version() > self.Version(); });
        if (!arr.length) return undefined;
        arr.sort(sortSiteMapsByVersionAsc);
        return arr[0];
    };
    
    SiteMap.prototype.setDeleted = function () {
        this.rootNodes().slice(0).forEach(function (n) { n.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    SiteMap.prototype.createNewVersion = function (versionNumber, manager) {
        var siteMapVersion = manager.createEntity('DbSiteMap', { WebsiteId: this.WebsiteId(), Version: versionNumber });
        ko.utils.arrayForEach(this.rootNodes(), function (node) {
            var copy = node.clone(manager, siteMapVersion, null);
        });
        manager.addEntity(siteMapVersion);
        return siteMapVersion;
    };

    SiteMap.prototype.containsNode = function (node) {
        return node && node.SiteMapId() === this.Id();
    };

    function sortSiteMapsByVersionAsc(a, b) {
        var vA = a && a.Version ? a.Version() : 0,
            vB = b && b.Version ? b.Version() : 0;
        return vA == vB ? 0 : vA > vB ? 1 : -1;
    }

    function sortSiteMapsByVersionDesc(a, b) {
        var vA = a && a.Version ? a.Version() : 0,
            vB = b && b.Version ? b.Version() : 0;
        return vA == vB ? 0 : vA < vB ? 1 : -1;
    }

    /**
     * SiteMapNode Entity
     */
    function SiteMapNode() {

    }

    function SiteMapNodeInitializer(sitemapNode) {
        var self = this;

        sitemapNode.childNodes = ko.computed({
            read: function () {
                if (!sitemapNode.SiteMap() || !sitemapNode.SiteMap().SiteMapNodes())
                    return [];
                var result = ko.utils.arrayFilter(sitemapNode.SiteMap().SiteMapNodes(), function (node) {
                    return node.ParentNodeId() === sitemapNode.Id();
                });

                result.sort(sortSiteMapNodesByRankingAsc);
                return result;
            }, deferEvaluation: true
        });

        sitemapNode.siblings = ko.computed({
            read: function () {
                if (!sitemapNode.ParentNode()) return [];
                return sitemapNode.ParentNode().childNodes();
            },
            deferEvaluation: true
        });

        sitemapNode.nextNode = ko.computed({
            read: function () {
                var siblings = sitemapNode.siblings(),
                    index = siblings.indexOf(sitemapNode);
                return index == siblings.length - 1 ? undefined : siblings[index + 1];
            }, deferEvaluation: true
        });

        sitemapNode.previousNode = ko.computed({
            read: function () {
                var siblings = sitemapNode.siblings(),
                    index = siblings.indexOf(sitemapNode);
                return index === 0 ? undefined : siblings[index - 1];
            }, deferEvaluation: true
        });

        sitemapNode.path = ko.computed({
            read: function () {
                var parents = [],
                    current = sitemapNode;
                while (current) {
                    var resource = current.getResource('de'),
                        title = resource ? resource.Title() : 'no-res';
                    parents.splice(0, 0, title);
                    current = current.ParentNode();
                }
                return parents.join('/');
            },
            deferEvaluation: true
        });

        sitemapNode.canLinkTo = ko.computed(function () {
            return !sitemapNode.isTeaser();
        });

        sitemapNode.canHaveContent = ko.computed(function () {
            return !sitemapNode.isTeaser();
        });
    }

    SiteMapNode.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    SiteMapNode.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
            resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DbSiteMapNodeResource', {
            SiteMapNodeId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        //this.Resources.push(resource);
        return resource;
    };

    SiteMapNode.prototype.localeTitle = function (language) {
        var res = this.getResource('de');
        return res ? res.Title() : '';
    };
    
    SiteMapNode.prototype.setDeleted = function () {
        var childNodes = this.childNodes().slice(0),
            resources = this.Resources().slice(0);
        
        for (var i = 0; i < childNodes.length; i++)
            childNodes[i].setDeleted();
        for (i = 0; i < resources.length; i++)
            resources[i].entityAspect.setDeleted();

        this.entityAspect.setDeleted();
    };

    SiteMapNode.prototype.clone = function (manager, siteMapVersion, parentNodeId) {
        var args = {
            SiteMapId: siteMapVersion.Id(),
            ParentNodeId: parentNodeId,
            ContentId: this.ContentId(),
            PermanentId: this.PermanentId(),
            Name: this.Name(),
            Ranking: this.Ranking(),
            NodeType: this.NodeType(),
            IsDeleted: this.IsDeleted(),
            Redirect: this.Redirect(),
            RedirectType: this.RedirectType()
        };
        
        var copy = manager.createEntity('DbSiteMapNode', args);
        copy.Created().At(this.Created().At());
        copy.Created().By(this.Created().By());
        copy.Modified().At(this.Modified().At());
        copy.Modified().By(this.Modified().By());

        ko.utils.arrayForEach(this.Resources(), function (resource) {
            var resourceCopy = copy.getOrCreateResource(resource.Language(), manager);
            resourceCopy.Title(resource.Title());
            resourceCopy.Keywords(resource.Keywords());
            resourceCopy.Description(resource.Description());
        });

        ko.utils.arrayForEach(this.ChildNodes(), function (node) {
            var childCopy = node.clone(manager, siteMapVersion, copy.Id());
        });
        manager.addEntity(copy);
        return copy;
    };

    SiteMapNode.prototype.maxChildNodeRanking = function () {
        var childNodes = this.childNodes();
        if (childNodes.length === 0) return 0;
        if (childNodes.length === 1) return childNodes[0].Ranking();

        return Math.max.apply(null, ko.utils.arrayMap(childNodes, function (n) { return n.Ranking(); }));
    };

    SiteMapNode.prototype.moveUp = function () {
        var siblings = this.siblings().slice(0),
            index = siblings.indexOf(this);

        if (index <= 0)
            return;

        siblings.splice(index, 1);
        siblings.splice(index - 1, 0, this);

        setRankings(siblings);
    };

    SiteMapNode.prototype.moveDown = function () {
        var siblings = this.siblings().slice(0),
            index = siblings.indexOf(this);

        if (index >= siblings.length - 1)
            return;

        siblings.splice(index, 1);
        siblings.splice(index + 1, 0, this);

        setRankings(siblings);
    };

    SiteMapNode.prototype.reparent = function (newParentNode) {
        if (newParentNode && newParentNode.Id() !== this.ParentNodeId()) {
            this.ParentNodeId(newParentNode.Id());
            this.Ranking(newParentNode.maxChildNodeRanking() + 1);
        }
    };

    SiteMapNode.prototype.findTeasers = function () {
        var self = this,
            siteMap = self.SiteMap();

        if (!siteMap) return [];

        return ko.utils.arrayFilter(siteMap.SiteMapNodes(), function (n) {
            return n.isTeaser() && n.Redirect() == self.PermanentId();
        });
    };

    SiteMapNode.prototype.hasTeasers = function () {
        var teasers = this.findTeasers();
        return teasers.length > 0;
    };

    SiteMapNode.prototype.isTeaser = function () {
        return this.NodeType().toLowerCase() === 'teaser';
    };

    function setRankings(nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            if (nodeArray[i].Ranking() !== i + 1)
                nodeArray[i].Ranking(i + 1);
        }
    }

    function sortSiteMapNodesByRankingAsc(a, b) {
        var rankingA = a.Ranking(),
            rankingB = b.Ranking();
        if (rankingA == rankingB) return a.Id() < b.Id() ? -1 : 1;
        return rankingA < rankingB ? -1 : 1;
    }
    
    /**
     * Publication Entity
     */
    function Publication() {
        var self = this;
        self.template = ko.computed({
            read: function () {
                return self.deserializeTemplate();
            },
            deferEvaluation: true
        });
    }

    Publication.prototype.getTranslation = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Translations(), function (trns) {
            return trns.Language().toLowerCase() === key;
        });
    };

    Publication.prototype.getContentPart = function (name) {
        var key = name.toLowerCase();
        return ko.utils.arrayFirst(this.ContentParts(), function (pt) {
            return pt.Name().toLowerCase() === key;
        });
    };

    Publication.prototype.getOrCreateContentPart = function (name, manager) {
        var key = name.toLowerCase(),
        pt = this.getContentPart(key);
        if (pt) return pt;

        pt = manager.createEntity('PublicationContentPart', {
            PublicationId: this.Id(),
            Name: key,
            ContentType: 'html',
            Ranking: 0
        });
        manager.addEntity(pt);
        this.ContentParts.push(pt);
        return pt;
    };

    Publication.prototype.deserializeTemplate = function () {
        var t = JSON.parse(this.Template());
        if (!t) return undefined;

        t.findCell = function (cellName) {
            for (var r = 0; r < t.rows.length; r++) {
                var row = t.rows[r];
                for (var c = 0; c < row.cells.length; c++) {
                    var cell = row.cells[c];
                    if (cell.name.toLowerCase() === cellName.toLowerCase())
                        return cell;
                }
            }
            return undefined;
        };

        return t;
    };

    Publication.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.ContentParts(), function (cp) { cp.setDeleted(); });
        ko.utils.arrayForEach(this.Files(), function (cf) { cf.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    Publication.prototype.findFile = function (fileName, language) {
        language = language || 'de';
        var key = fileName.toLowerCase(),
            file = ko.utils.arrayFirst(this.Files(), function (f) {
                var res = f.getResource(language);
                if (!res) return false;
                return res.FileVersion() && res.FileVersion().File().FileName().toLowerCase() === key;
            });
        return file;
    };

    Publication.prototype.generateContentData = function (siteMapNode) {
        var self = this;
        return {
            entityType: 'Publication',
            entityId: self.Id(),
            version: self.ContentVersion(),

            name: siteMapNode.Name(),
            template: self.Template(),

            created: getChangeInfo(),
            modified: getChangeInfo(),

            resources: prepareResources(self, siteMapNode),
            contentParts: prepareContentParts(self),
            files: prepareFiles(self)
        };

        function prepareChangeInfo(changeInfo) {
            return {
                at: changeInfo.At(),
                by: changeInfo.By()
            };
        }

        function getChangeInfo() {
            return {
                at: new Date(),
                by: authentication.user().userName()
            };
        }

        function prepareResources(publication, siteMapNode) {
            var resources = ko.utils.arrayMap(siteMapNode.Resources(), function (resource) {
                return {
                    language: resource.Language(),
                    title: resource.Title(),
                    created: getChangeInfo(),
                    modified: getChangeInfo()
                };
            });
            return resources;
        }

        function prepareContentParts(publication) {
            return ko.utils.arrayMap(publication.ContentParts(), function (contentPart) {
                return {
                    name: contentPart.Name(),
                    contentType: contentPart.ContentType(),
                    ranking: contentPart.Ranking(),
                    resources: prepareContentPartResources(publication, contentPart.Resources())
                };
            });
        }

        function prepareContentPartResources(publication, resources) {
            return ko.utils.arrayMap(resources, function (resource) {
                return {
                    language: resource.Language(),
                    content: resource.Content()
                };
            });
        }

        function prepareFiles(publication) {
            return ko.utils.arrayMap(publication.Files(), function (file) {
                return {
                    name: file.Name(),
                    isEmbedded: file.IsEmbedded(),
                    determination: file.Determination(),
                    group: file.Group(),
                    ranking: file.Ranking(),
                    resources: prepareFileResources(file.Resources())
                };
            });
        }

        function prepareFileResources(resources) {
            return ko.utils.arrayMap(resources, function (resource) {
                return {
                    language: resource.Language(),
                    dbFileVersionId: resource.DbFileVersionId(),
                    title: resource.Title(),
                    description: resource.Description(),
                    credits: resource.Credits()
                };
            });
        }
    };

    /**
     * PublicationContentPart Entity
     */
    function PublicationContentPart() {

    }

    PublicationContentPart.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    PublicationContentPart.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('PublicationContentPartResource', {
            PublicationContentPartId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    PublicationContentPart.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.Resources(), function (res) { res.entityAspect.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    /**
     * PublicationFile Entity
     */
    function PublicationFile() {

    }

    PublicationFile.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    PublicationFile.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('PublicationFileResource', {
            PublicationFileId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    PublicationFile.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.Resources(), function (res) { res.entityAspect.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    return {
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('Website', Website);
            metadataStore.registerEntityTypeCtor('DbSiteMap', SiteMap, SiteMapInitializer);
            metadataStore.registerEntityTypeCtor('DbSiteMapNode', SiteMapNode, SiteMapNodeInitializer);
            metadataStore.registerEntityTypeCtor('Publication', Publication);
            metadataStore.registerEntityTypeCtor('PublicationContentPart', PublicationContentPart);
            metadataStore.registerEntityTypeCtor('PublicationFile', PublicationFile);
        }
    };
});