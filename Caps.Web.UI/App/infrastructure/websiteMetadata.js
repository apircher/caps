/*
 * websiteMetadata.js
 */
define([
    'ko'
],
function (ko) {
    
    /*
     * WebsiteInfo Class
     */
    function websiteInfo() {
        this.title = 'Caps Demo Website';
        this.url = 'http://caps.luxbox.net';
        this._languages = ['de', 'en'];
        this._defaultCulture = 'de';
    }

    websiteInfo.prototype.supportedTranslations = function () {
        var defaultCulture = this._defaultCulture.toLowerCase();
        var filteredArray = ko.utils.arrayFilter(this._languages, function (item) {
            return item.toLowerCase() !== defaultCulture;
        });
        return ko.utils.arrayMap(filteredArray, function (item) {
            return new Language(item);
        });
    };

    websiteInfo.prototype.defaultCulture = function () {
        return new Language(this._defaultCulture);
    };

    /*
     * Language Class
     */
    var languageNames = {

        'de': {
            'de': 'Deutsch',
            'en': 'German'
        },
        'en': {
            'de': 'Englisch',
            'en': 'English'
        }
    };

    function Language(culture) {
        this.culture = culture;
    }

    Language.prototype.localeName = function (culture) {
        culture = culture || this.culture;
        var resourceSet = languageNames[this.culture];
        return resourceSet[culture];
    };


    var siteInfo = new websiteInfo();
    return {
        getSiteInfo: function () {
            return siteInfo;
        }
    };
});