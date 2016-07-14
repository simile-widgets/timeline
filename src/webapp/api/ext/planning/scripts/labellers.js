/*==================================================
 *  Planning Labeller
 *==================================================
 */
<<<<<<< HEAD

Timeline.PlanningLabeller = function(locale) {
    this._locale = locale;
};

Timeline.PlanningLabeller.labels = [];

Timeline.PlanningLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = Timeline.PlanningUnit.toNumber(date);
=======
define([
    "./units",
    "i18n!../nls/labellers"
], function(PlanningUnit, Locale) {
var PlanningLabeller = function(locale) {
    this._locale = locale;
};

PlanningLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = PlanningUnit.toNumber(date);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    
    var prefix = "";
    var divider = 1;
    var divider2 = 7;
<<<<<<< HEAD
    var labels = Timeline.PlanningLabeller.labels[this._locale];
    
    switch (intervalUnit) {
    case Timeline.PlanningUnit.DAY:     prefix = labels.dayPrefix;      break;
    case Timeline.PlanningUnit.WEEK:    prefix = labels.weekPrefix;     divider = 7;        divider2 = divider * 4; break;
    case Timeline.PlanningUnit.MONTH:   prefix = labels.monthPrefix;    divider = 28;       divider2 = divider * 3; break;
    case Timeline.PlanningUnit.QUARTER: prefix = labels.quarterPrefix;  divider = 28 * 3;   divider2 = divider * 4; break;
    case Timeline.PlanningUnit.YEAR:    prefix = labels.yearPrefix;     divider = 28 * 12;  divider2 = divider * 5; break;
=======
    var labels = Locale;
    
    switch (intervalUnit) {
    case PlanningUnit.DAY:     prefix = labels.dayPrefix;      break;
    case PlanningUnit.WEEK:    prefix = labels.weekPrefix;     divider = 7;        divider2 = divider * 4; break;
    case PlanningUnit.MONTH:   prefix = labels.monthPrefix;    divider = 28;       divider2 = divider * 3; break;
    case PlanningUnit.QUARTER: prefix = labels.quarterPrefix;  divider = 28 * 3;   divider2 = divider * 4; break;
    case PlanningUnit.YEAR:    prefix = labels.yearPrefix;     divider = 28 * 12;  divider2 = divider * 5; break;
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    }
    return { text: prefix + Math.floor(n / divider), emphasized: (n % divider2) == 0 };
};

<<<<<<< HEAD
Timeline.PlanningLabeller.prototype.labelPrecise = function(date) {
    return Timeline.PlanningLabeller.labels[this._locale].dayPrefix + 
        Timeline.PlanningUnit.toNumber(date);
};
=======
PlanningLabeller.prototype.labelPrecise = function(date) {
    return PlanningLabeller.labels[this._locale].dayPrefix + 
        PlanningUnit.toNumber(date);
};

    return PlanningLabeller;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
