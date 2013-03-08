/*==================================================
 *  Quarterly Ether Painter
 *==================================================
 */
 
define([
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var QuarterlyEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    this._startDate = SimileAjax.DateTime.parseGregorianDateTime(params.startDate);
};

QuarterlyEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className = 'timeline-ether-bg';
 //   this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
};

QuarterlyEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
};

QuarterlyEtherPainter.prototype.paint = function() {
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
    
    var minDate = new Date(0);
    var maxDate = this._band.getMaxDate();
    
    minDate.setUTCFullYear(Math.max(this._startDate.getUTCFullYear(), this._band.getMinDate().getUTCFullYear()));
    minDate.setUTCMonth(this._startDate.getUTCMonth());
    
    var p = this;
    var incrementDate = function(date) {
        date.setUTCMonth(date.getUTCMonth() + 3);
    };
    var labeller = {
        labelInterval: function(date, intervalUnit) {
            var quarters = (4 + (date.getUTCMonth() - p._startDate.getUTCMonth()) / 3) % 4;
            if (quarters != 0) {
                return { text: "Q" + (quarters + 1), emphasized: false };
            } else {
                return { text: "Y" + (date.getUTCFullYear() - p._startDate.getUTCFullYear() + 1), emphasized: true };
            }
        }
    };
    
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(
            minDate, labeller, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
            
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

QuarterlyEtherPainter.prototype.softPaint = function() {
};

    return QuarterlyEtherPainter;
});
