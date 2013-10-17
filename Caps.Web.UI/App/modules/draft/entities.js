define(['require', 'knockout'], function (require, ko) {
    
    /**
     * Draft Entity
     */
    function Draft() {
        var self = this;
    }

    Draft.prototype.deserializeTemplate = function () {
        return JSON.parse(this.TemplateContent());
    };

    Draft.prototype.toJSON = function () {
        var copy = ko.toJS(this);
        delete copy.entityAspect;
        delete copy.entityType;
        delete copy.Created;
        delete copy.Modified;
        return copy;
    };

    return {
        Draft: Draft,
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('Draft', Draft);
        }
    };

});