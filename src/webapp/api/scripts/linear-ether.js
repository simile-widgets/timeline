/*==================================================
 *  An "ether" is a object that maps date/time to pixel coordinates.
 *==================================================
 */

/*==================================================
 *  Linear Ether
 *==================================================
 */

define(["simile-ajax"], function(SimileAjax) { 
var LinearEther = function(params) {
    this._params = params;
    this._interval = params.interval;
    this._pixelsPerInterval = params.pixelsPerInterval;
};

LinearEther.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    this._unit = timeline.getUnit();
    
    if ("startsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.startsOn);
    } else if ("endsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.endsOn);
        this.shiftPixels(-this._timeline.getPixelLength());
    } else if ("centersOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.centersOn);
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    } else {
        this._start = this._unit.makeDefaultValue();
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    }
};

LinearEther.prototype.setDate = function(date) {
    this._start = this._unit.cloneValue(date);
};

LinearEther.prototype.shiftPixels = function(pixels) {
    var numeric = this._interval * pixels / this._pixelsPerInterval;
    this._start = this._unit.change(this._start, numeric);
};

LinearEther.prototype.dateToPixelOffset = function(date) {
    var numeric = this._unit.compare(date, this._start);
    return this._pixelsPerInterval * numeric / this._interval;
};

LinearEther.prototype.pixelOffsetToDate = function(pixels) {
    var numeric = pixels * this._interval / this._pixelsPerInterval;
    return this._unit.change(this._start, numeric);
};

LinearEther.prototype.zoom = function(zoomIn) {
  var netIntervalChange = 0;
  var currentZoomIndex = this._band._zoomIndex;
  var newZoomIndex = currentZoomIndex;

  if (zoomIn && (currentZoomIndex > 0)) {
    newZoomIndex = currentZoomIndex - 1;
  }
  
  if (!zoomIn && (currentZoomIndex < (this._band._zoomSteps.length - 1))) {
    newZoomIndex = currentZoomIndex + 1;
  }

  this._band._zoomIndex = newZoomIndex;  
  this._interval = 
    SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[newZoomIndex].unit];
  this._pixelsPerInterval = this._band._zoomSteps[newZoomIndex].pixelsPerInterval;
  netIntervalChange = this._band._zoomSteps[newZoomIndex].unit - 
    this._band._zoomSteps[currentZoomIndex].unit;

  return netIntervalChange;
};

    return LinearEther;
});
