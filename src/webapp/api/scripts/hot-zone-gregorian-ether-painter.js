/*==================================================
 *  Hot Zone Gregorian Ether Painter
 *==================================================
 */

define([
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var HotZoneGregorianEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    
    this._zones = [{
        startTime:  Number.NEGATIVE_INFINITY,
        endTime:    Number.POSITIVE_INFINITY,
        unit:       params.unit,
        multiple:   1
    }];
    for (var i = 0; i < params.zones.length; i++) {
        var zone = params.zones[i];
        var zoneStart = SimileAjax.DateTime.parseGregorianDateTime(zone.start).getTime();
        var zoneEnd = SimileAjax.DateTime.parseGregorianDateTime(zone.end).getTime();
        
        for (var j = 0; j < this._zones.length && zoneEnd > zoneStart; j++) {
            var zone2 = this._zones[j];
            
            if (zoneStart < zone2.endTime) {
                if (zoneStart > zone2.startTime) {
                    this._zones.splice(j, 0, {
                        startTime:   zone2.startTime,
                        endTime:     zoneStart,
                        unit:        zone2.unit,
                        multiple:    zone2.multiple
                    });
                    j++;
                    
                    zone2.startTime = zoneStart;
                }
                
                if (zoneEnd < zone2.endTime) {
                    this._zones.splice(j, 0, {
                        startTime:  zoneStart,
                        endTime:    zoneEnd,
                        unit:       zone.unit,
                        multiple:   (zone.multiple) ? zone.multiple : 1
                    });
                    j++;
                    
                    zone2.startTime = zoneEnd;
                    zoneStart = zoneEnd;
                } else {
                    zone2.multiple = zone.multiple;
                    zone2.unit = zone.unit;
                    zoneStart = zone2.endTime;
                }
            } // else, try the next existing zone
        }
    }
};

HotZoneGregorianEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className ='timeline-ether-bg';
    //this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
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

HotZoneGregorianEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

HotZoneGregorianEtherPainter.prototype.paint = function() {
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
    
    var p = this;
    var incrementDate = function(date, zone) {
        for (var i = 0; i < zone.multiple; i++) {
            SimileAjax.DateTime.incrementByInterval(date, zone.unit);
        }
    };
    
    var zStart = 0;
    while (zStart < this._zones.length) {
        if (minDate.getTime() < this._zones[zStart].endTime) {
            break;
        }
        zStart++;
    }
    var zEnd = this._zones.length - 1;
    while (zEnd >= 0) {
        if (maxDate.getTime() > this._zones[zEnd].startTime) {
            break;
        }
        zEnd--;
    }
    
    for (var z = zStart; z <= zEnd; z++) {
        var zone = this._zones[z];
        
        var minDate2 = new Date(Math.max(minDate.getTime(), zone.startTime));
        var maxDate2 = new Date(Math.min(maxDate.getTime(), zone.endTime));
        
        SimileAjax.DateTime.roundDownToInterval(minDate2, zone.unit, timeZone, zone.multiple, this._theme.firstDayOfWeek);
        SimileAjax.DateTime.roundUpToInterval(maxDate2, zone.unit, timeZone, zone.multiple, this._theme.firstDayOfWeek);
        
        while (minDate2.getTime() < maxDate2.getTime()) {
            this._intervalMarkerLayout.createIntervalMarker(
                minDate2, labeller, zone.unit, this._markerLayer, this._lineLayer);
                
            incrementDate(minDate2, zone);
        }
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

HotZoneGregorianEtherPainter.prototype.softPaint = function() {
};

HotZoneGregorianEtherPainter.prototype.zoom = function(netIntervalChange) {
  if (netIntervalChange != 0) {
    for (var i = 0; i < this._zones.length; ++i) {
      if (this._zones[i]) {
        this._zones[i].unit += netIntervalChange;
      }
    }
  }
};

    return HotZoneGregorianEtherPainter;
});
