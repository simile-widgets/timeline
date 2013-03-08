/*==================================================
 *  Planning Unit
 *==================================================
 */

define(["labellers"], function(PlanningLabeller) {
var PlanningUnit = new Object();

PlanningUnit.DAY     = 0;
PlanningUnit.WEEK    = 1;
PlanningUnit.MONTH   = 2;
PlanningUnit.QUARTER = 3;
PlanningUnit.YEAR    = 4;

PlanningUnit.getParser = function(format) {
    return PlanningUnit.parseFromObject;
};

PlanningUnit.createLabeller = function(locale, timeZone) {
    return new PlanningLabeller(locale);
};

PlanningUnit.makeDefaultValue = function () {
    return 0;
};

PlanningUnit.cloneValue = function (v) {
    return v;
};

PlanningUnit.parseFromObject = function(o) {
    if (o == null) {
        return null;
    } else if (typeof o == "number") {
        return o;
    } else {
        try {
            return parseInt(o);
        } catch (e) {
            return null;
        }
    }
};

PlanningUnit.toNumber = function(v) {
    return v
};

PlanningUnit.fromNumber = function(n) {
    return n;
};

PlanningUnit.compare = function(v1, v2) {
    return v1 - v2;
};

PlanningUnit.earlier = function(v1, v2) {
    return PlanningUnit.compare(v1, v2) < 0 ? v1 : v2;
};

PlanningUnit.later = function(v1, v2) {
    return PlanningUnit.compare(v1, v2) > 0 ? v1 : v2;
};

PlanningUnit.change = function(v, n) {
    return v + n;
};
    return PlanningUnit;
});
