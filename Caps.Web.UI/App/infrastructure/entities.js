define([
    'ko'
],
function (ko) {

    /**
     * Website Entity
     */
    function Website() {

    }

    Website.prototype.latestSitemap = function () {
        var maxVersion = Math.max.apply(null, ko.utils.arrayMap(this.Sitemaps(), function (sitemap) { return sitemap.Version(); }));
        return ko.utils.arrayFirst(this.Sitemaps(), function (sitemap) {
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
                return ko.utils.arrayFilter(sitemap.Nodes(), function (node) { return !node.ParentNodeId(); });
            },
            deferEvaluation: true
        });

        sitemap.siblings = ko.computed(function() {
            if (!sitemap.Website()) return [];
            return sitemap.Website().Sitemaps();
        });
    };

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
        var n = this.rootNodes().slice(0);
        ko.utils.arrayForEach(n, function (node) { node.setDeleted(); });
        this.entityAspect.setDeleted();
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
                if (!sitemapNode.Sitemap() || !sitemapNode.Sitemap().Nodes())
                    return [];
                var result = ko.utils.arrayFilter(sitemapNode.Sitemap().Nodes(), function (node) {
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
                return index == 0 ? undefined : siblings[index - 1];
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
        })
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

        resource = manager.createEntity('SitemapNodeResource', {
            SitemapNodeId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };
    
    SitemapNode.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.childNodes().slice(0), function (childNode) { childNode.setDeleted(); });
        ko.utils.arrayForEach(this.Resources().slice(0), function (resource) { resource.entityAspect.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    function sortSitemapNodesByRankingAsc(a, b) {
        var rankingA = a.Ranking(),
            rankingB = b.Ranking();
        if (rankingA == rankingB) return a.Id() < b.Id() ? -1 : 1;
        return rankingA < rankingB ? -1 : 1;
    }
    
    /**
     * SitemapNodeContent Entity
     */
    function SitemapNodeContent() {
        var self = this;
        self.template = ko.computed({
            read: function () {
                return self.deserializeTemplate();
            },
            deferEvaluation: true
        });
    }

    SitemapNodeContent.prototype.getContentPart = function (partType) {
        var key = partType.toLowerCase();
        return ko.utils.arrayFirst(this.ContentParts(), function (pt) {
            return pt.PartType().toLowerCase() === key;
        });
    }

    SitemapNodeContent.prototype.getOrCreateContentPart = function (partType, manager) {
        var key = partType.toLowerCase(),
        pt = this.getContentPart(key);
        if (pt) return pt;

        pt = manager.createEntity('SitemapNodeContentPart', {
            SitemapNodeContentId: this.Id(),
            PartType: key,
            ContentType: 'html',
            Ranking: 0
        });
        manager.addEntity(pt);
        this.ContentParts.push(pt);
        return pt;
    };

    SitemapNodeContent.prototype.deserializeTemplate = function () {
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

    SitemapNodeContent.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.ContentParts(), function (cp) { cp.setDeleted(); });
        ko.utils.arrayForEach(this.Files(), function (cf) { cf.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    /**
     * SitemapNodeContentPart Entity
     */
    function SitemapNodeContentPart() {

    }

    SitemapNodeContentPart.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    SitemapNodeContentPart.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('SitemapNodeContentPartResource', {
            SitemapNodeContentPartId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    SitemapNodeContentPart.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.Resources(), function (res) { res.entityAspect.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    /**
     * SitemapNodeContentFile Entity
     */
    function SitemapNodeContentFile() {

    }

    SitemapNodeContentFile.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    SitemapNodeContentFile.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('SitemapNodeContentFileResource', {
            SitemapNodeContentFileId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    SitemapNodeContentFile.prototype.setDeleted = function () {
        ko.utils.arrayForEach(this.Resources(), function (res) { res.entityAspect.setDeleted(); });
        this.entityAspect.setDeleted();
    };

    return {
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('Website', Website);
            metadataStore.registerEntityTypeCtor('Sitemap', Sitemap, SitemapInitializer);
            metadataStore.registerEntityTypeCtor('SitemapNode', SitemapNode, SitemapNodeInitializer);
            metadataStore.registerEntityTypeCtor('SitemapNodeContent', SitemapNodeContent);
            metadataStore.registerEntityTypeCtor('SitemapNodeContentPart', SitemapNodeContentPart);
            metadataStore.registerEntityTypeCtor('SitemapNodeContentFile', SitemapNodeContentFile);
        }
    };
});