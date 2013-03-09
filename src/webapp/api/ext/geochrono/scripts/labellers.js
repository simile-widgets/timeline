/*==================================================
 *  Geochrono Labeller
 *==================================================
 */
define([
    "./units",
    "./timespans",
    "i18n!../nls/eons",
    "i18n!../nls/eras",
    "i18n!../nls/periods",
    "i18n!../nls/epochs",
    "i18n!../nls/ages"
], function(GeochronoUnit, Timespans, Eons, Eras, Periods, Epochs, Ages) {
    var GeochronoLabeller = function(locale) {
        this._locale = locale;
    };

    GeochronoUnit.createLabeller = function(locale, timeZone) {
        return new GeochronoLabeller(locale);
    };

    var makeNamesList = function(spans, names) {
        var key, i, r = [];
        for (i = 0; i < spans.length; i++) {
            n = spans[i].name;
            r.push(spans[i]);
            r[i].name = names[n];
        }
        return r;
    };

    GeochronoLabeller.eonNames = makeNamesList(Timespans.eons, Eons);
    GeochronoLabeller.eraNames = makeNamesList(Timespans.eras, Eras);
    GeochronoLabeller.periodNames = makeNamesList(Timespans.periods, Periods);
    GeochronoLabeller.epochNames = makeNamesList(Timespans.epochs, Epochs);
    GeochronoLabeller.ageNames = makeNamesList(Timespans.ages, Ages);

GeochronoLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = GeochronoUnit.toNumber(date);
    var dates, names;
    switch (intervalUnit) {
    case GeochronoUnit.AGE:
        dates = GeochronoLabeller.ageNames;
        names = GeochronoLabeller.ageNames; break;
    case GeochronoUnit.EPOCH:
        dates = GeochronoLabeller.epochNames;
        names = GeochronoLabeller.epochNames; break;
    case GeochronoUnit.PERIOD:
        dates = GeochronoLabeller.periodNames;
        names = GeochronoLabeller.periodNames; break;
    case GeochronoUnit.ERA:
        dates = GeochronoLabeller.eraNames;
        names = GeochronoLabeller.eraNames; break;
    case GeochronoUnit.EON:
        dates = GeochronoLabeller.eonNames;
        names = GeochronoLabeller.eonNames; break;
    default:
        return { text: n, emphasized: false };
    }
    
    for (var i = dates.length - 1; i >= 0; i--) {
        if (n <= dates[i].start) {
            return { 
                text: names[i].name, 
                emphasized: n == dates[i].start 
            }
        }
    }
    return { text: n, emphasized: false };
};

GeochronoLabeller.prototype.labelPrecise = function(date) {
    return GeochronoUnit.toNumber(date) + "ma";
};

    return GeochronoLabeller;
});
