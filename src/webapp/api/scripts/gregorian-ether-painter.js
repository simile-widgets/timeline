/*==================================================
 *  Gregorian Ether Painter
 *==================================================
 */
 
define([
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var GregorianEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    this._unit = params.unit;
    this._multiple = ("multiple" in params) ? params.multiple : 1;
};

GregorianEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className = 'timeline-ether-bg';
  //  this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];

    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params && this._params.align != undefined) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

GregorianEtherPainter.prototype.setHighlight = function(startDate, endDate, orthogonalOffset, orthogonalExtent) {
    this._highlight.position(startDate, endDate, orthogonalOffset, orthogonalExtent);
}

GregorianEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var timeZone = this._band.getTimeZone();
    var labeller = this._band.getLabeller();
    
    SimileAjax.DateTime.roundDownToInterval(minDate, this._unit, timeZone, this._multiple, this._theme.firstDayOfWeek);
    
    var p = this;
    var incrementDate = function(date) {
        for (var i = 0; i < p._multiple; i++) {
            SimileAjax.DateTime.incrementByInterval(date, p._unit);
        }
    };
    
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(
            minDate, labeller, this._unit, this._markerLayer, this._lineLayer);
            
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

GregorianEtherPainter.prototype.softPaint = function() {
};

GregorianEtherPainter.prototype.zoom = function(netIntervalChange) {
  if (netIntervalChange != 0) {
    this._unit += netIntervalChange;
  }
};

    return GregorianEtherPainter;
});
