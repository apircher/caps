define(['breeze'], function (breeze) {

    var serviceName = '/breeze/capsdata';
    var masterManager = new breeze.EntityManager(serviceName);

    //TODO: configure the metadataStore with entity type extensions.

    var provider = {
        createManager: createManager,
        initialize: initialize,
        refresh: refresh
    };
    return provider;

    function createManager() {
        var manager = masterManager.createEmptyCopy();

        //TODO: copy picklists,... from masterManager

        return manager;
    }

    function initialize() {
        //TODO: load masterManager with lookup entities and any other startup data. Returns a promise.
        return masterManager.fetchMetadata();
    }

    function refresh() {
        //TODO: refresh cached entities. Typically a subset of the initialize function.
    }
});