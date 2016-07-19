/*==================================================
 *  Geochrono Ether Painter
 *==================================================
 */
define([
    "../../../scripts/ether-highlight",
    "./layout",
    "./units",
    "./labellers"
], function(EtherHighlight, GeochronoEtherMarkerLayout, GeochronoUnit, GeochronoLabeller) { 
var GeochronoEtherPainter = function(params, band, timeline) {
    this._params = params;
    this._intervalUnit = params.intervalUnit;
    this._multiple = ("multiple" in params) ? params.multiple : 1;
    this._theme = params.theme;
};

GeochronoEtherPainter.prototype.initialize = function(band, timeline) {
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
        
    this._intervalMarkerLayout = new GeochronoEtherMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

GeochronoEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

GeochronoEtherPainter.prototype.paint = function() {
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
    
    var minDate = Math.ceil(GeochronoUnit.toNumber(this._band.getMinDate()));
    var maxDate = Math.floor(GeochronoUnit.toNumber(this._band.getMaxDate()));
    
    var increment;
    var hasMore;
    (function(intervalUnit, multiple) {
        var dates;

        switch (intervalUnit) {
        case GeochronoUnit.AGE:
            dates = GeochronoLabeller.ageNames; break;
        case GeochronoUnit.EPOCH:
            dates = GeochronoLabeller.epochNames; break;
        case GeochronoUnit.PERIOD:
            dates = GeochronoLabeller.periodNames; break;
        case GeochronoUnit.ERA:
            dates = GeochronoLabeller.eraNames; break;
        case GeochronoUnit.EON:
            dates = GeochronoLabeller.eonNames; break;
        default:
            hasMore = function() {
                return minDate > 0 && minDate > maxDate;
            }
            increment = function() {
                minDate -= multiple;
            };
            return;
        }

        var startIndex = dates.length - 1;
        while (startIndex > 0) {
            if (minDate <= dates[startIndex].start) {
                break;
            }
            startIndex--;
        }
        
        minDate = dates[startIndex].start;
        hasMore = function() {
            return startIndex < (dates.length - 1) && minDate > maxDate;
        };
        increment = function() {
            startIndex++;
            minDate = dates[startIndex].start;
        };
    })(this._intervalUnit, this._multiple);
    
    var labeller = this._band.getLabeller();
    while (true) {
        this._intervalMarkerLayout.createIntervalMarker(
            GeochronoUnit.fromNumber(minDate), 
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

GeochronoEtherPainter.prototype.softPaint = function() {
};

    return GeochronoEtherPainter;
});
