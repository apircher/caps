
define(['ko'], function (ko) {

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

    Website.prototype.latestSitemap = function () {
        var maxVersion = Math.max.apply(null, ko.utils.arrayMap(this.SiteMapVersions(), function (sitemap) { return sitemap.Version(); }));
        return ko.utils.arrayFirst(this.SiteMapVersions(), function (sitemap) {
            return sitemap.Version() === maxVersion;
        });
    };

    /**
     * Sitemap Entity
     */
    function Sitemap() {
        var self = this;
    }

    function SitemapInitializer(sitemap) {
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

    Sitemap.prototype.previousVersion = function () {        
        var self = this,
            arr = ko.utils.arrayFilter(self.siblings(), function (sitemap) { return sitemap.Version() < self.Version(); });
        if (!arr.length) return undefined;
        arr.sort(sortSitemapsByVersionDesc);
        return arr[0];
    };

    Sitemap.prototype.nextVersion = function () {
        var self = this,
            arr = ko.utils.arrayFilter(self.siblings(), function (sitemap) { return sitemap.Version() > self.Version(); });
        if (!arr.length) return undefined;
        arr.sort(sortSitemapsByVersionAsc);
        return arr[0];
    };
    
    Sitemap.prototype.setDeleted = function () {
        this.rootNodes().slice(0).forEach(function (n) { n.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    Sitemap.prototype.createNewVersion = function (versionNumber, manager) {
        var siteMapVersion = manager.createEntity('DbSiteMap', { WebsiteId: this.WebsiteId(), Version: versionNumber });
        ko.utils.arrayForEach(this.rootNodes(), function (node) {
            var copy = node.clone(manager, siteMapVersion, null);
        });
        manager.addEntity(siteMapVersion);
        return siteMapVersion;
    };

    function sortSitemapsByVersionAsc(a, b) {
        var vA = a && a.Version ? a.Version() : 0,
            vB = b && b.Version ? b.Version() : 0;
        return vA == vB ? 0 : vA > vB ? 1 : -1;
    }

    function sortSitemapsByVersionDesc(a, b) {
        var vA = a && a.Version ? a.Version() : 0,
            vB = b && b.Version ? b.Version() : 0;
        return vA == vB ? 0 : vA < vB ? 1 : -1;
    }

    /**
     * SitemapNode Entity
     */
    function SitemapNode() {

    }

    function SitemapNodeInitializer(sitemapNode) {
        var self = this;

        sitemapNode.childNodes = ko.computed({
            read: function () {
                if (!sitemapNode.SiteMap() || !sitemapNode.SiteMap().SiteMapNodes())
                    return [];
                var result = ko.utils.arrayFilter(sitemapNode.SiteMap().SiteMapNodes(), function (node) {
                    return node.ParentNodeId() === sitemapNode.Id();
                });

                result.sort(sortSitemapNodesByRankingAsc);
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
    }

    SitemapNode.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    SitemapNode.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
            resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DbSiteMapNodeResource', {
            SiteMapNodeId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    SitemapNode.prototype.localeTitle = function (language) {
        var res = this.getResource('de');
        return res ? res.Title() : '';
    };
    
    SitemapNode.prototype.setDeleted = function () {
        var childNodes = this.childNodes().slice(0),
            resources = this.Resources().slice(0);
        
        for (var i = 0; i < childNodes.length; i++)
            childNodes[i].setDeleted();
        for (i = 0; i < resources.length; i++)
            resources[i].entityAspect.setDeleted();

        this.entityAspect.setDeleted();
    };

    SitemapNode.prototype.clone = function (manager, siteMapVersion, parentNodeId) {
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

    SitemapNode.prototype.maxChildNodeRanking = function () {
        var childNodes = this.childNodes();
        if (childNodes.length === 0) return 0;
        if (childNodes.length === 1) return childNodes[0].Ranking();

        return Math.max.apply(null, ko.utils.arrayMap(childNodes, function (n) { return n.Ranking(); }));
    };

    SitemapNode.prototype.moveUp = function () {
        var siblings = this.siblings().slice(0),
            index = siblings.indexOf(this);

        if (index <= 0)
            return;

        siblings.splice(index, 1);
        siblings.splice(index - 1, 0, this);

        setRankings(siblings);
    };

    SitemapNode.prototype.moveDown = function () {
        var siblings = this.siblings().slice(0),
            index = siblings.indexOf(this);

        if (index >= siblings.length - 1)
            return;

        siblings.splice(index, 1);
        siblings.splice(index + 1, 0, this);

        setRankings(siblings);
    };

    SitemapNode.prototype.reparent = function (newParentNode) {
        if (newParentNode) {
            this.ParentNodeId(newParentNode.Id());
            this.Ranking(newParentNode.maxChildNodeRanking() + 1);
        }
    };

    function setRankings(nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            if (nodeArray[i].Ranking() !== i + 1)
                nodeArray[i].Ranking(i + 1);
        }
    }

    function sortSitemapNodesByRankingAsc(a, b) {
        var rankingA = a.Ranking(),
            rankingB = b.Ranking();
        if (rankingA == rankingB) return a.Id() < b.Id() ? -1 : 1;
        return rankingA < rankingB ? -1 : 1;
    }
    
    /**
     * SitemapNodeContent Entity
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

    Publication.prototype.getContentPart = function (partType) {
        var key = partType.toLowerCase();
        return ko.utils.arrayFirst(this.ContentParts(), function (pt) {
            return pt.PartType().toLowerCase() === key;
        });
    };

    Publication.prototype.getOrCreateContentPart = function (partType, manager) {
        var key = partType.toLowerCase(),
        pt = this.getContentPart(key);
        if (pt) return pt;

        pt = manager.createEntity('PublicationContentPart', {
            PublicationId: this.Id(),
            PartType: key,
            ContentType: 'html',
            Ranking: 0
        });
        manager.addEntity(pt);
        this.ContentParts.push(pt);
        return pt;
    };

    Publication.prototype.deserializeTemplate = function () {
        var t = JSON.parse(this.TemplateData());
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
            metadataStore.registerEntityTypeCtor('DbSiteMap', Sitemap, SitemapInitializer);
            metadataStore.registerEntityTypeCtor('DbSiteMapNode', SitemapNode, SitemapNodeInitializer);
            metadataStore.registerEntityTypeCtor('Publication', Publication);
            metadataStore.registerEntityTypeCtor('PublicationContentPart', PublicationContentPart);
            metadataStore.registerEntityTypeCtor('PublicationFile', PublicationFile);
        }
    };
});