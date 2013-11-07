﻿/*
 * draft/entities.js
 */
define([
    'require',
    'ko'
],
function (require, ko) {
    
    /**
     * Draft Entity
     */
    function Draft() {
        var self = this;

        self.template = ko.computed({
            read: function () {
                return self.deserializeTemplate();
            },
            deferEvaluation: true
        });
    }

    Draft.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };
    
    Draft.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DraftResource', {
            DraftId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    Draft.prototype.findContentPart = function (partType) {
        var part = ko.utils.arrayFirst(this.ContentParts(), function (p) {
            return p.PartType().toLowerCase() === partType.toLowerCase();
        });
        return part;
    };

    Draft.prototype.findDraftFile = function (fileName, language) {
        language = language || 'de';
        var key = fileName.toLowerCase(),
            file = ko.utils.arrayFirst(this.Files(), function (f) {
                var res = f.getResource(language);
                if (!res) return false;
                return res.File() && res.File().FileName().toLowerCase() === key;
            });
        return file;
    };

    Draft.prototype.deserializeTemplate = function () {
        var t = JSON.parse(this.TemplateContent());
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

    Draft.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }        
        while (this.ContentParts().length) {
            this.ContentParts()[0].setDeleted();
        }                
        this.entityAspect.setDeleted();
    };

    Draft.prototype.generateContent = function () {
        return {
            entityType: 'Draft',
            entityId: this.Id(),
            version: this.Version(),

            name: this.Name(),
            template: this.Template(),
            templateContent: this.TemplateContent(),

            created: {
                at: this.Created().At(),
                by: this.Created().By()
            },
            modified: {
                at: this.Modified().At(),
                by: this.Modified().By()
            },

            resources: this.generateContentResources()
        };
    };

    Draft.prototype.generateContentResources = function () {
        return ko.utils.arrayMap(this.Resources(), function (resource) {
            return {
                language: resource.Language(),
                title: resource.Title(),
                keywords: resource.Keywords(),
                description: resource.Description(),
                created: {
                    at: resource.Created().At(),
                    by: resource.Created().By()
                },
                modified: {
                    at: resource.Modified().At(),
                    by: resource.Modified().By()
                }
            };
        });
    };

    /**
     * DraftContentPart Entity
     */
    function DraftContentPart() {
        var self = this;
    }

    DraftContentPart.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    DraftContentPart.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
            resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DraftContentPartResource', {
            DraftContentPartId: this.Draft().Id(),
            Language: key,
            Content: ''
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;
    };

    DraftContentPart.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }
        this.entityAspect.setDeleted();
    };

    DraftContentPart.prototype.previewText = function (language, length) {
        language = language || 'de';
        length = length || 80;
        var res = this.getResource(language);
        if (res && res.Content()) {
            var content = res.Content();
            return content.length > length ? content.substr(0, length - 3) + '...' : content;
        }
        return '';
    };

    /**
     * DraftFile Entity
     */
    function DraftFile() {
    }

    DraftFile.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }
        this.entityAspect.setDeleted();
    };

    DraftFile.prototype.getResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    DraftFile.prototype.getOrCreateResource = function (language, manager) {
        var key = language.toLowerCase(),
        resource = this.getResource(language);
        if (resource)
            return resource;

        resource = manager.createEntity('DraftFileResource', {
            DraftFileId: this.Id(),
            Language: key
        });
        manager.addEntity(resource);
        this.Resources.push(resource);
        return resource;    
    };


    return {
        Draft: Draft,
        DraftContentPart: DraftContentPart,

        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('Draft', Draft);
            metadataStore.registerEntityTypeCtor('DraftContentPart', DraftContentPart);
            metadataStore.registerEntityTypeCtor('DraftFile', DraftFile);
        }
    };

});