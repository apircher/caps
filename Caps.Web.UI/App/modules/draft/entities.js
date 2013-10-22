define(['require', 'ko'], function (require, ko) {
    
    /**
     * Draft Entity
     */
    function Draft() {
        var self = this;
    }

    Draft.prototype.findResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    Draft.prototype.findContentPart = function (partType) {
        var part = ko.utils.arrayFirst(this.ContentParts(), function (p) {
            return p.PartType().toLowerCase() === partType.toLowerCase();
        });
        return part;
    };

    Draft.prototype.deserializeTemplate = function () {
        return JSON.parse(this.TemplateContent());
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

    /**
     * DraftContentPart Entity
     */
    function DraftContentPart() {
        var self = this;
    }

    DraftContentPart.prototype.findResource = function (language) {
        var key = language.toLowerCase();
        return ko.utils.arrayFirst(this.Resources(), function (res) {
            return res.Language().toLowerCase() === key;
        });
    };

    DraftContentPart.prototype.setDeleted = function () {
        while (this.Resources().length) {
            this.Resources()[0].entityAspect.setDeleted();
        }
        this.entityAspect.setDeleted();
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