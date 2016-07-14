/*==================================================
 *  Gregorian Date Labeller
 *==================================================
 */
<<<<<<< HEAD

Timeline.GregorianDateLabeller = function(locale, timeZone) {
=======
define([
    "simile-ajax",
    "i18n!nls/months",
    "i18n!nls/timeline"
], function(SimileAjax, Months, Locale) {
var GregorianDateLabeller = function(locale, timeZone) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    this._locale = locale;
    this._timeZone = timeZone;
};

<<<<<<< HEAD
Timeline.GregorianDateLabeller.monthNames = [];
Timeline.GregorianDateLabeller.dayNames = [];
Timeline.GregorianDateLabeller.labelIntervalFunctions = [];

Timeline.GregorianDateLabeller.getMonthName = function(month, locale) {
    return Timeline.GregorianDateLabeller.monthNames[locale][month];
};

Timeline.GregorianDateLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var f = Timeline.GregorianDateLabeller.labelIntervalFunctions[this._locale];
    if (f == null) {
        f = Timeline.GregorianDateLabeller.prototype.defaultLabelInterval;
=======
GregorianDateLabeller.monthNames = [];
GregorianDateLabeller.dayNames = [];
GregorianDateLabeller.labelIntervalFunctions = [];

// @@@ With a switch to RequireJS i18n, this will exclusively
//     return the user agent's localization.  Should this change?
//     The rest of the structure outside of string localizing is
//     still in place if this feature needs to be restored.
GregorianDateLabeller.getMonthName = function(month, locale) {
    return Months[month.toString()];
};

GregorianDateLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var f = GregorianDateLabeller.labelIntervalFunctions[this._locale];
    if (f == null) {
        f = GregorianDateLabeller.prototype.defaultLabelInterval;
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    }
    return f.call(this, date, intervalUnit);
};

<<<<<<< HEAD
Timeline.GregorianDateLabeller.prototype.labelPrecise = function(date) {
=======
GregorianDateLabeller.prototype.labelPrecise = function(date) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    return SimileAjax.DateTime.removeTimeZoneOffset(
        date, 
        this._timeZone //+ (new Date().getTimezoneOffset() / 60)
    ).toUTCString();
};

<<<<<<< HEAD
Timeline.GregorianDateLabeller.prototype.defaultLabelInterval = function(date, intervalUnit) {
=======
GregorianDateLabeller.prototype.defaultLabelInterval = function(date, intervalUnit) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var text;
    var emphasized = false;
    
    date = SimileAjax.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    case SimileAjax.DateTime.MILLISECOND:
        text = date.getUTCMilliseconds();
        break;
    case SimileAjax.DateTime.SECOND:
        text = date.getUTCSeconds();
        break;
    case SimileAjax.DateTime.MINUTE:
        var m = date.getUTCMinutes();
        if (m == 0) {
            text = date.getUTCHours() + ":00";
            emphasized = true;
        } else {
            text = m;
        }
        break;
    case SimileAjax.DateTime.HOUR:
        text = date.getUTCHours() + "hr";
        break;
    case SimileAjax.DateTime.DAY:
<<<<<<< HEAD
        text = Timeline.GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
        break;
    case SimileAjax.DateTime.WEEK:
        text = Timeline.GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
=======
        if (Locale.dateStyle === "cs") {
            text = date.getUTCDate() + ". " + (date.getUTCMonth() + 1) + ".";
        } else if (Locale.dateStyle === "vi") {
            text = date.getUTCDate() + "/" + (date.getUTCMonth() + 1);
        } else if (Locale.dateStyle === "de") {
            text = date.getUTCDate() + ". " + GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale);
        } else if (Locale.dateStyle === "zh") {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + date.getUTCDate() + "日";
        } else {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
        }
        break;
    case SimileAjax.DateTime.WEEK:
        if (Locale.dateStyle === "cs") {
            text = date.getUTCDate() + ". " + (date.getUTCMonth() + 1) + ".";
        } else if (Locale.dateStyle === "vi") {
            text = date.getUTCDate() + "/" + (date.getUTCMonth() + 1);
        } else if (Locale.dateStyle === "de") {
            text = date.getUTCDate() + ". " + GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale);
        } else if (Locale.dateStyle === "zh") {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + date.getUTCDate() + "日";
        } else {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
        }
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
        break;
    case SimileAjax.DateTime.MONTH:
        var m = date.getUTCMonth();
        if (m != 0) {
<<<<<<< HEAD
            text = Timeline.GregorianDateLabeller.getMonthName(m, this._locale);
=======
            text = GregorianDateLabeller.getMonthName(m, this._locale);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
            break;
        } // else, fall through
    case SimileAjax.DateTime.YEAR:
    case SimileAjax.DateTime.DECADE:
    case SimileAjax.DateTime.CENTURY:
    case SimileAjax.DateTime.MILLENNIUM:
        var y = date.getUTCFullYear();
        if (y > 0) {
            text = date.getUTCFullYear();
        } else {
            text = (1 - y) + "BC";
        }
        emphasized = 
            (intervalUnit == SimileAjax.DateTime.MONTH) ||
            (intervalUnit == SimileAjax.DateTime.DECADE && y % 100 == 0) || 
            (intervalUnit == SimileAjax.DateTime.CENTURY && y % 1000 == 0);
        break;
    default:
        text = date.toUTCString();
    }
    return { text: text, emphasized: emphasized };
<<<<<<< HEAD
}

=======
};

    return GregorianDateLabeller;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
