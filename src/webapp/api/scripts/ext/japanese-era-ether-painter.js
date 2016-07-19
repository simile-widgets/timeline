/*==================================================
 *  Japanese Era Ether Painter
 *==================================================
 */
define([
    "simile-ajax",
    "../ether-interval-marker-layout",
    "../ether-highlight",
    "./japanese-eras"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight, JapaneseEraDateLabeller) { 
JapaneseEraEtherPainter = function(params, band, timeline) {
    this._params = params;
    this._theme = params.theme;
};

JapaneseEraEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
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
}

JapaneseEraEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

JapaneseEraEtherPainter.prototype.paint = function() {
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
    
    var minYear = this._band.getMinDate().getUTCFullYear();
    var maxYear = this._band.getMaxDate().getUTCFullYear();
    var eraIndex = JapaneseEraDateLabeller._eras.find(function(era) {
            return era.startingYear - minYear;
        }
    );
    
    var l = JapaneseEraDateLabeller._eras.length();
    for (var i = eraIndex; i < l; i++) {
        var era = JapaneseEraDateLabeller._eras.elementAt(i);
        if (era.startingYear > maxYear) {
            break;
        }
        
        var d = new Date(0);
        d.setUTCFullYear(era.startingYear);
        
        var labeller = {
            labelInterval: function(date, intervalUnit) {
                return {
                    text: era.japaneseName,
                    emphasized: true
                };
            }
        };
        
        this._intervalMarkerLayout.createIntervalMarker(
            d, labeller, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

JapaneseEraEtherPainter.prototype.softPaint = function() {
};

    return JapaneseEraEtherPainter;
});
