/*==================================================
 *  Geochrono Labeller
 *==================================================
 */
<<<<<<< HEAD

Timeline.GeochronoLabeller = function(locale) {
    this._locale = locale;
};

Timeline.GeochronoLabeller.eonNames = [];
Timeline.GeochronoLabeller.eraNames = [];
Timeline.GeochronoLabeller.periodNames = [];
Timeline.GeochronoLabeller.epochNames = [];
Timeline.GeochronoLabeller.ageNames = [];

Timeline.GeochronoLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = Timeline.GeochronoUnit.toNumber(date);
    var dates, names;
    switch (intervalUnit) {
    case Timeline.GeochronoUnit.AGE:
        dates = Timeline.Geochrono.ages;
        names = Timeline.GeochronoLabeller.ageNames; break;
    case Timeline.GeochronoUnit.EPOCH:
        dates = Timeline.Geochrono.epoches;
        names = Timeline.GeochronoLabeller.epochNames; break;
    case Timeline.GeochronoUnit.PERIOD:
        dates = Timeline.Geochrono.periods;
        names = Timeline.GeochronoLabeller.periodNames; break;
    case Timeline.GeochronoUnit.ERA:
        dates = Timeline.Geochrono.eras;
        names = Timeline.GeochronoLabeller.eraNames; break;
    case Timeline.GeochronoUnit.EON:
        dates = Timeline.Geochrono.eons;
        names = Timeline.GeochronoLabeller.eonNames; break;
=======
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
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    default:
        return { text: n, emphasized: false };
    }
    
    for (var i = dates.length - 1; i >= 0; i--) {
        if (n <= dates[i].start) {
            return { 
<<<<<<< HEAD
                text: names[this._locale][i].name, 
=======
                text: names[i].name, 
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
                emphasized: n == dates[i].start 
            }
        }
    }
    return { text: n, emphasized: false };
};

<<<<<<< HEAD
Timeline.GeochronoLabeller.prototype.labelPrecise = function(date) {
    return Timeline.GeochronoUnit.toNumber(date) + "ma";
};
=======
GeochronoLabeller.prototype.labelPrecise = function(date) {
    return GeochronoUnit.toNumber(date) + "ma";
};

    return GeochronoLabeller;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
