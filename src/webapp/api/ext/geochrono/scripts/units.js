/*==================================================
 *  Geochrono Unit
 *==================================================
 */
define(["./labellers"], function(GeochronoLabeller) {
var GeochronoUnit = new Object();

GeochronoUnit.MA     = 0;
GeochronoUnit.AGE    = 1;
GeochronoUnit.EPOCH  = 2;
GeochronoUnit.PERIOD = 3;
GeochronoUnit.ERA    = 4;
GeochronoUnit.EON    = 5;

GeochronoUnit.getParser = function(format) {
    return GeochronoUnit.parseFromObject;
};

GeochronoUnit.createLabeller = function(locale, timeZone) {
    return new GeochronoLabeller(locale);
};

GeochronoUnit.wrapMA = function (n) {
    return new GeochronoUnit._MA(n);
};

GeochronoUnit.makeDefaultValue = function () {
    return GeochronoUnit.wrapMA(0);
};

GeochronoUnit.cloneValue = function (v) {
    return new GeochronoUnit._MA(v._n);
};

GeochronoUnit.parseFromObject = function(o) {
    if (o instanceof GeochronoUnit._MA) {
        return o;
    } else if (typeof o == "number") {
        return GeochronoUnit.wrapMA(o);
    } else if (typeof o == "string" && o.length > 0) {
        return GeochronoUnit.wrapMA(Number(o));
    } else {
        return null;
    }
};

GeochronoUnit.toNumber = function(v) {
    return v._n;
};

GeochronoUnit.fromNumber = function(n) {
    return new GeochronoUnit._MA(n);
};

GeochronoUnit.compare = function(v1, v2) {
    var n1, n2;
    if (typeof v1 == "object") {
        n1 = v1._n;
    } else {
        n1 = Number(v1);
    }
    if (typeof v2 == "object") {
        n2 = v2._n;
    } else {
        n2 = Number(v2);
    }
    
    return n2 - n1;
};

GeochronoUnit.earlier = function(v1, v2) {
    return GeochronoUnit.compare(v1, v2) < 0 ? v1 : v2;
};

GeochronoUnit.later = function(v1, v2) {
    return GeochronoUnit.compare(v1, v2) > 0 ? v1 : v2;
};

GeochronoUnit.change = function(v, n) {
    return new GeochronoUnit._MA(v._n - n);
};

GeochronoUnit._MA = function(n) {
    this._n = n;
};

    return GeochronoUnit;
});
