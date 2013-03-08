/*==================================================
 *  Planning Ether Painter
 *==================================================
 */
define([
    "../../../scripts/ether-highlight",
    "./layout",
    "./units"
], function(EtherHiglight, PlanningEtherMarkerLayout, PlanningUnit) { 
var PlanningEtherPainter = function(params, band, timeline) {
    this._params = params;
    this._intervalUnit = params.intervalUnit;
    this._multiple = ("multiple" in params) ? params.multiple : 1;
    this._theme = params.theme;
};

PlanningEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params && typeof this._params.align == "string") ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new PlanningEtherMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new Timeline.EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

PlanningEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

PlanningEtherPainter.prototype.paint = function() {
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
    
    var minDate = Math.max(0, Math.ceil(PlanningUnit.toNumber(this._band.getMinDate())));
    var maxDate = Math.floor(PlanningUnit.toNumber(this._band.getMaxDate()));
    
    var hasMore = function() {
        return minDate < maxDate;
    };
    var change = 1;
    var multiple = this._multiple;
    switch (this._intervalUnit) {
        case PlanningUnit.DAY:     change = 1; break;
        case PlanningUnit.WEEK:    change = 7; break;
        case PlanningUnit.MONTH:   change = 28; break;
        case PlanningUnit.QUARTER: change = 28 * 3; break;
        case PlanningUnit.YEAR:    change = 28 * 12; break;
    }
    var increment = function() {
        minDate += change * multiple;
    };
    
    var labeller = this._band.getLabeller();
    while (true) {
        this._intervalMarkerLayout.createIntervalMarker(
            PlanningUnit.fromNumber(minDate), 
            labeller, 
            this._intervalUnit, 
            this._markerLayer, 
            this._lineLayer
        );
        if (hasMore()) {
            increment();
        } else {
            break;
        }
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

PlanningEtherPainter.prototype.softPaint = function() {
};

    return PlanningEtherPainter;
});
