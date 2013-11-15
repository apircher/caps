define(['ko'], function (ko) {

    var validationStrings = {
        'de': {
            required: 'Dieses Feld ist erforderlich.',
            min: 'Gib einen Wert größer oder gleich {0} ein.',
            max: 'Gib einen Wert kleiner oder gleich {0} ein.',
            minLength: 'Gib mindestens {0} Zeichen ein.',
            maxLength: 'Gib weniger als {0} Zeichen ein.',
            pattern: 'Ungültiger Wert.',
            step: 'Der Wert muss um {0} erhöht werden.',
            email: 'Dies ist keine gültige Email-Adresse.',
            date: 'Dies ist kein gültiges Datum.',
            dateISO: 'Dies ist kein gültiges Datum.',
            number: 'Dies ist keine gültige Nummer.',
            digit: 'Gib eine Zahl ein.',
            phoneUS: 'Gib eine gültige Telefon-Nummer ein.',
            equal: 'Die Werte stimmen nicht überein.',
            notEqual: 'Die Werte dürfen nicht übereinstimmen.',
            unique: 'Dieser Wert wird bereits verwendet.'
        }
    };

    var momentLang = {
        'de': {
            months : "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort : "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
            weekdays : "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort : "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
            weekdaysMin : "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            longDateFormat : {
                LT: "H:mm U\\hr",
                L : "DD.MM.YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Heute] H:mm",
                sameElse: "L",
                nextDay: '[Morgen] H:mm',
                nextWeek: 'dddd H:mm',
                lastDay: '[Gestern] H:mm',
                lastWeek: '[letzten] dddd H:mm'
            },
            relativeTime : {
                future : "in %s",
                past : "vor %s",
                s : "ein paar Sekunden",
                m : "einer Minute",
                mm : "%d Minuten",
                h : "einer Stunde",
                hh : "%d Stunden",
                d : "einem Tag",
                dd : "%d Tagen",
                M : "einem Monat",
                MM : "%d Monaten",
                y : "einem Jahr",
                yy : "%d Jahren"
            },
            ordinal : function (number) {
                return '.';
            }
        }
    };
    
    function localizeKnockoutValidation(culture) {
        require(['knockout.validation'], function (validation) {
            var resource = validationStrings[culture];
            if (resource) validation.localize(resource);
        });
    }

    function localizeMoment(culture) {
        require(['moment'], function (moment) {
            var resource = momentLang[culture];
            if (resource) moment.lang(culture, resource);
        });
    }
    
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

    /*
     * WebsiteLocalization Class
     */
    function WebsiteLocalization() {
        this.languages = [new Language('de'), new Language('en')];
        this.defaultLanguage = this.languages[0];
    }

    WebsiteLocalization.prototype.supportedTranslations = function () {
        var defaultLanguage = this.defaultLanguage.culture.toLowerCase();
        return ko.utils.arrayFilter(this.languages, function (language) {
            return language.culture.toLowerCase() !== defaultLanguage;
        });
    };

    var wl = new WebsiteLocalization();

    return {
        Language: Language,
        localize: function (culture) {
            localizeKnockoutValidation(culture);
            localizeMoment(culture);
        },

        website: wl
    };

});