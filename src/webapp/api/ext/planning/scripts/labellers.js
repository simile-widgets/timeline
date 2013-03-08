/*==================================================
 *  Planning Labeller
 *==================================================
 */
define([
    "./units",
    "i18n!../nls/labellers"
], function(PlanningUnit, Locale) {
var PlanningLabeller = function(locale) {
    this._locale = locale;
};

PlanningLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = PlanningUnit.toNumber(date);
    
    var prefix = "";
    var divider = 1;
    var divider2 = 7;
    var labels = Locale;
    
    switch (intervalUnit) {
    case PlanningUnit.DAY:     prefix = labels.dayPrefix;      break;
    case PlanningUnit.WEEK:    prefix = labels.weekPrefix;     divider = 7;        divider2 = divider * 4; break;
    case PlanningUnit.MONTH:   prefix = labels.monthPrefix;    divider = 28;       divider2 = divider * 3; break;
    case PlanningUnit.QUARTER: prefix = labels.quarterPrefix;  divider = 28 * 3;   divider2 = divider * 4; break;
    case PlanningUnit.YEAR:    prefix = labels.yearPrefix;     divider = 28 * 12;  divider2 = divider * 5; break;
    }
    return { text: prefix + Math.floor(n / divider), emphasized: (n % divider2) == 0 };
};

PlanningLabeller.prototype.labelPrecise = function(date) {
    return PlanningLabeller.labels[this._locale].dayPrefix + 
        PlanningUnit.toNumber(date);
};

    return PlanningLabeller;
});
