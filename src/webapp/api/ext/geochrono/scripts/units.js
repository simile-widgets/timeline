/*==================================================
 *  Geochrono Unit
 *==================================================
 */
<<<<<<< HEAD

Timeline.GeochronoUnit = new Object();

Timeline.GeochronoUnit.MA     = 0;
Timeline.GeochronoUnit.AGE    = 1;
Timeline.GeochronoUnit.EPOCH  = 2;
Timeline.GeochronoUnit.PERIOD = 3;
Timeline.GeochronoUnit.ERA    = 4;
Timeline.GeochronoUnit.EON    = 5;

Timeline.GeochronoUnit.getParser = function(format) {
    return Timeline.GeochronoUnit.parseFromObject;
};

Timeline.GeochronoUnit.createLabeller = function(locale, timeZone) {
    return new Timeline.GeochronoLabeller(locale);
};

Timeline.GeochronoUnit.wrapMA = function (n) {
    return new Timeline.GeochronoUnit._MA(n);
};

Timeline.GeochronoUnit.makeDefaultValue = function () {
    return Timeline.GeochronoUnit.wrapMA(0);
};

Timeline.GeochronoUnit.cloneValue = function (v) {
    return new Timeline.GeochronoUnit._MA(v._n);
};

Timeline.GeochronoUnit.parseFromObject = function(o) {
    if (o instanceof Timeline.GeochronoUnit._MA) {
        return o;
    } else if (typeof o == "number") {
        return Timeline.GeochronoUnit.wrapMA(o);
    } else if (typeof o == "string" && o.length > 0) {
        return Timeline.GeochronoUnit.wrapMA(Number(o));
=======
define(function() {
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
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    } else {
        return null;
    }
};

<<<<<<< HEAD
Timeline.GeochronoUnit.toNumber = function(v) {
    return v._n;
};

Timeline.GeochronoUnit.fromNumber = function(n) {
    return new Timeline.GeochronoUnit._MA(n);
};

Timeline.GeochronoUnit.compare = function(v1, v2) {
=======
GeochronoUnit.toNumber = function(v) {
    return v._n;
};

GeochronoUnit.fromNumber = function(n) {
    return new GeochronoUnit._MA(n);
};

GeochronoUnit.compare = function(v1, v2) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
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

<<<<<<< HEAD
Timeline.GeochronoUnit.earlier = function(v1, v2) {
    return Timeline.GeochronoUnit.compare(v1, v2) < 0 ? v1 : v2;
};

Timeline.GeochronoUnit.later = function(v1, v2) {
    return Timeline.GeochronoUnit.compare(v1, v2) > 0 ? v1 : v2;
};

Timeline.GeochronoUnit.change = function(v, n) {
    return new Timeline.GeochronoUnit._MA(v._n - n);
};

Timeline.GeochronoUnit._MA = function(n) {
    this._n = n;
};

=======
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
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
