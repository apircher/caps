﻿define(function (require) {

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
                sameDay: "[Heute um] LT",
                sameElse: "L",
                nextDay: '[Morgen um] LT',
                nextWeek: 'dddd [um] LT',
                lastDay: '[Gestern um] LT',
                lastWeek: '[letzten] dddd [um] LT'
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

    var validation = require('knockout.validation');
    var moment = require('moment');

    function localizeKnockoutValidation(culture) {
        var resource = validationStrings[culture];
        if (resource) validation.localize(resource);
    }

    function localizeMoment(culture) {
        var resource = momentLang[culture];
        if (resource) moment.lang(culture, resource);
    }

    return {
        localize: function (culture) {
            localizeKnockoutValidation(culture);
            localizeMoment(culture);
        }
    };

});