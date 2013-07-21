define(['knockout', 'infrastructure/datacontext', 'durandal/system', 'authentication'], function (ko, datacontext, system, authentication) {
    var welcome = function () {
        this.displayName = 'Willkommen bei CAPS';
        this.description = 'Caps ist ein einfaches Content Management System zur Erstellung und Verwaltung Ihrer öffentlichen Inhalte.';
        this.websites = ko.observableArray();
        this.user = authentication.user;

        system.log('welcome model created');
    };

    welcome.prototype.activate = function () {
        var self = this;
        return datacontext.getWebsites().then(function (data) {
            ko.utils.arrayForEach(data.results, function (item) {
                self.websites.push(item);
            });
        });
    };

    return welcome;
});