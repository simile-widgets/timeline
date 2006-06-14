/*==================================================
 *  Linear Ether
 *==================================================
 */
 
Timeline.LinearEther = function(params, timeline) {
    this._duration = params.duration;
    this._timeline = timeline;
    
    if (params.startsOn) {
        this._start = Timeline.parseGregorianDateTime(params.startsOn);
    } else if (params.endsOn) {
        this._start = new Date(Timeline.parseGregorianDateTime(params.endsOn).getTime() - this._duration);
    } else if (params.centersOn) {
        this._start = new Date(Timeline.parseGregorianDateTime(params.centersOn).getTime() - this._duration / 2);
    } else {
        this._start = new Date(new Date().getTime() - this._duration / 2);
    }
};

Timeline.LinearEther.getDefaultEtherPainter = function() {
    return Timeline.GregorianEtherPainter;
};

Timeline.LinearEther.prototype.setDate = function(date) {
    this._start = new Date(date.getTime());
};

Timeline.LinearEther.prototype.shiftPixels = function(pixels) {
    var milliseconds = this._duration * pixels / this._timeline.getPixelLength();
    this._start = new Date(this._start.getTime() + milliseconds);
    //debug(this._start.toString());
};

Timeline.LinearEther.prototype.dateToPixelOffset = function(date) {
    var milliseconds = date.getTime() - this._start.getTime();
    return this._timeline.getPixelLength() * milliseconds / this._duration;
};

Timeline.LinearEther.prototype.pixelOffsetToDate = function(pixels) {
    var milliseconds = pixels * this._duration / this._timeline.getPixelLength();
    return new Date(this._start.getTime() + milliseconds);
};

/*==================================================
 *  Hot Zone Ether
 *==================================================
 */
 
Timeline.HotZoneEther = function(params, timeline) {
    this._timeline = timeline;
    this._duration = params.duration;
    
    this._zones = [{
        startTime:  Number.NEGATIVE_INFINITY,
        endTime:    Number.POSITIVE_INFINITY,
        magnify:    1
    }];
    for (var i = 0; i < params.zones.length; i++) {
        var zone = params.zones[i];
        var zoneStart = Timeline.parseGregorianDateTime(zone.start).getTime();
        var zoneEnd = Timeline.parseGregorianDateTime(zone.end).getTime();
        
        for (var j = 0; j < this._zones.length && zoneEnd > zoneStart; j++) {
            var zone2 = this._zones[j];
            
            if (zoneStart < zone2.endTime) {
                if (zoneStart > zone2.startTime) {
                    this._zones.splice(j, 0, {
                        startTime:   zone2.startTime,
                        endTime:     zoneStart,
                        magnify:     zone2.magnify
                    });
                    j++;
                    
                    zone2.startTime = zoneStart;
                }
                
                if (zoneEnd < zone2.endTime) {
                    this._zones.splice(j, 0, {
                        startTime:  zoneStart,
                        endTime:    zoneEnd,
                        magnify:    zone.magnify * zone2.magnify
                    });
                    j++;
                    
                    zone2.startTime = zoneEnd;
                    zoneStart = zoneEnd;
                } else {
                    zone2.magnify += zone.magnify;
                    zoneStart = zone2.endTime;
                }
            } // else, try the next existing zone
        }
    }
    
    if (params.startsOn) {
        this._start = Timeline.parseGregorianDateTime(params.startsOn);
    } else if (params.endsOn) {
        this._start = Timeline.parseGregorianDateTime(params.endsOn);
        this.shiftPixels(-this._timeline.getPixelLength());
    } else if (params.centersOn) {
        this._start = Timeline.parseGregorianDateTime(params.centersOn);
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    } else {
        this._start = new Date();
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    }
};

Timeline.HotZoneEther.getDefaultEtherPainter = function() {
    return Timeline.HotZoneGregorianEtherPainter;
};

Timeline.HotZoneEther.prototype.setDate = function(date) {
    this._start = new Date(date.getTime());
};

Timeline.HotZoneEther.prototype.shiftPixels = function(pixels) {
    this._start = this.pixelOffsetToDate(pixels);
};

Timeline.HotZoneEther.prototype.dateToPixelOffset = function(date) {
    return this._dateDiffToPixelOffset(this._start, date);
};

Timeline.HotZoneEther.prototype.pixelOffsetToDate = function(pixels) {
    return this._pixelOffsetToDate(pixels, this._start);
};

Timeline.HotZoneEther.prototype._dateDiffToPixelOffset = function(fromDate, toDate) {
    var scale = this._getScale();
    var fromTime = fromDate.getTime();
    var toTime = toDate.getTime();
    
    var pixels = 0;
    if (fromTime < toTime) {
        var z = 0;
        while (z < this._zones.length) {
            if (fromTime < this._zones[z].endTime) {
                break;
            }
            z++;
        }
        
        while (fromTime < toTime) {
            var zone = this._zones[z];
            var toTime2 = Math.min(toTime, zone.endTime);
            
            pixels += ((toTime2 - fromTime) / (scale / zone.magnify));
            
            fromTime = toTime2;
            z++;
        }
    } else {
        var z = this._zones.length - 1;
        while (z >= 0) {
            if (fromTime > this._zones[z].startTime) {
                break;
            }
            z--;
        }
        
        while (fromTime > toTime) {
            var zone = this._zones[z];
            var toTime2 = Math.max(toTime, zone.startTime);
            
            pixels += ((toTime2 - fromTime) / (scale / zone.magnify));
            
            fromTime = toTime2;
            z--;
        }
    }
    return pixels;
};

Timeline.HotZoneEther.prototype._pixelOffsetToDate = function(pixels, fromDate) {
    var scale = this._getScale();
    var time = fromDate.getTime();
    if (pixels > 0) {
        var z = 0;
        while (z < this._zones.length) {
            if (time < this._zones[z].endTime) {
                break;
            }
            z++;
        }
        
        while (pixels > 0) {
            var zone = this._zones[z];
            var scale2 = scale / zone.magnify;
            
            if (zone.endTime == Number.POSITIVE_INFINITY) {
                time += pixels * scale2;
                pixels = 0;
            } else {
                var pixels2 = (zone.endTime - time) / scale2;
                if (pixels2 > pixels) {
                    time += pixels * scale2;
                    pixels = 0;
                } else {
                    time = zone.endTime;
                    pixels -= pixels2;
                }
            }
            z++;
        }
    } else {
        var z = this._zones.length - 1;
        while (z >= 0) {
            if (time > this._zones[z].startTime) {
                break;
            }
            z--;
        }
        
        pixels = -pixels;
        while (pixels > 0) {
            var zone = this._zones[z];
            var scale2 = scale / zone.magnify;
            
            if (zone.startTime == Number.NEGATIVE_INFINITY) {
                time -= pixels * scale2;
                pixels = 0;
            } else {
                var pixels2 = (time - zone.startTime) / scale2;
                if (pixels2 > pixels) {
                    time -= pixels * scale2;
                    pixels = 0;
                } else {
                    time = zone.startTime;
                    pixels -= pixels2;
                }
            }
            z--;
        }
    }
    return new Date(time);
};

Timeline.HotZoneEther.prototype._getScale = function() {
    return this._duration / this._timeline.getPixelLength();
};

/*==================================================
 *  Gregorian Utilities
 *==================================================
 */
Timeline.GregorianUtilities = new Object();

Timeline.GregorianUtilities.monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

Timeline.GregorianUtilities.roundDownToInterval = function(date, intervalUnit) {
    var clearInDay = function(d) {
        d.setUTCMilliseconds(0);
        d.setUTCSeconds(0);
        d.setUTCMinutes(0);
        d.setUTCHours(0);
    };
    var clearInYear = function(d) {
        clearInDay(d);
        d.setUTCDate(1);
        d.setUTCMonth(0);
    };
    
    switch(intervalUnit) {
    case Timeline.MILLISECOND:
        break;
    case Timeline.SECOND:
        date.setUTCMilliseconds(0);
        break;
    case Timeline.MINUTE:
        date.setUTCMilliseconds(0);
        date.setUTCSeconds(0);
        break;
    case Timeline.HOUR:
        date.setUTCMilliseconds(0);
        date.setUTCSeconds(0);
        date.setUTCMinutes(0);
        break;
    case Timeline.DAY:
        clearInDay(date);
        break;
    case Timeline.WEEK:
        // TODO: a week starts on different days in different locales.
        clearInDay(date);
        date.setDate(date.getDate() - date.getDay());
        break;
    case Timeline.MONTH:
        clearInDay(date);
        date.setUTCDate(1);
        break;
    case Timeline.YEAR:
        clearInYear(date);
        break;
    case Timeline.DECADE:
        clearInYear(date);
        date.setUTCFullYear(Math.floor(date.getFullYear() / 10) * 10);
        break;
    case Timeline.CENTURY:
        clearInYear(date);
        date.setUTCFullYear(Math.floor(date.getFullYear() / 100) * 100);
        break;
    case Timeline.MILLENNIUM:
        clearInYear(date);
        date.setUTCFullYear(Math.floor(date.getFullYear() / 1000) * 1000);
        break;
    }
};

Timeline.GregorianUtilities.incrementByInterval = function(date, intervalUnit) {
    switch(intervalUnit) {
    case Timeline.MILLISECOND:
        date.setTime(date.getTime() + 1)
        break;
    case Timeline.SECOND:
        date.setTime(date.getTime() + 1000);
        break;
    case Timeline.MINUTE:
        date.setTime(date.getTime() + Timeline.GregorianUnitLengths[Timeline.MINUTE]);
        break;
    case Timeline.HOUR:
        date.setTime(date.getTime() + Timeline.GregorianUnitLengths[Timeline.HOUR]);
        break;
    case Timeline.DAY:
        date.setUTCDate(date.getUTCDate() + 1);
        break;
    case Timeline.WEEK:
        date.setUTCDate(date.getUTCDate() + 7);
        break;
    case Timeline.MONTH:
        date.setUTCMonth(date.getUTCMonth() + 1);
        break;
    case Timeline.YEAR:
        date.setUTCFullYear(date.getUTCFullYear() + 1);
        break;
    case Timeline.DECADE:
        date.setUTCFullYear(date.getUTCFullYear() + 10);
        break;
    case Timeline.CENTURY:
        date.setUTCFullYear(date.getUTCFullYear() + 100);
        break;
    case Timeline.MILLENNIUM:
        date.setUTCFullYear(date.getUTCFullYear() + 1000);
        break;
    }
};

Timeline.GregorianUtilities.labelInterval = function(date, intervalUnit) {
    var text;
    var emphasized = false;
    
    switch(intervalUnit) {
    case Timeline.MILLISECOND:
        text = date.getUTCMilliseconds();
        break;
    case Timeline.SECOND:
        text = date.getUTCSeconds();
        break;
    case Timeline.MINUTE:
        var m = date.getUTCMinutes();
        if (m == 0) {
            text = date.getUTCHours() + ":00";
            emphasized = true;
        } else {
            text = m;
        }
        break;
    case Timeline.HOUR:
        text = date.getUTCHours() + "hr";
        break;
    case Timeline.DAY:
        text = Timeline.GregorianUtilities.monthNames[date.getMonth()] + " " + date.getUTCDate();
        break;
    case Timeline.WEEK:
        text = Timeline.GregorianUtilities.monthNames[date.getMonth()] + " " + date.getUTCDate();
        break;
    case Timeline.MONTH:
        var m = date.getUTCMonth();
        if (m == 0) {
            text = date.getUTCFullYear();
            emphasized = true;
        } else {
            text = Timeline.GregorianUtilities.monthNames[m];
        }
        break;
    case Timeline.YEAR:
        text = date.getUTCFullYear();
        break;
    case Timeline.DECADE:
        text = date.getUTCFullYear();
        break;
    case Timeline.CENTURY:
        text = date.getUTCFullYear();
        break;
    case Timeline.MILLENNIUM:
        text = date.getUTCFullYear();
        break;
    }
    return { text: text, emphasized: emphasized };
}

/*==================================================
 *  Gregorian Ether Painter
 *==================================================
 */
 
Timeline.GregorianEtherPainter = function(params, band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._unit = params.unit;
    
    this._divs = [];
    this._dates = [];
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.className = this._backgroundLayer.className.split(" ").concat(params.cssClass).join(" ");
    
    this._markerLayer = band.createLayerDiv(100);
    this._highlightDiv = null;
};

Timeline.GregorianEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    if (!(this._highlightDiv)) {
        this._highlightDiv = this._timeline.getDocument().createElement("div");
        this._highlightDiv.className = "timeline-band-highlight";
        this._backgroundLayer.appendChild(this._highlightDiv);
    }
    
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    if (this._timeline.isHorizontal()) {
        this._highlightDiv.style.left = startPixel + "px";
        this._highlightDiv.style.width = (endPixel - startPixel) + "px";
        this._highlightDiv.style.top = "2px";
        this._highlightDiv.style.height = (this._band.getViewWidth() - 4) + "px";
    } else {
        this._highlightDiv.style.top = startPixel + "px";
        this._highlightDiv.style.height = (endPixel - startPixel) + "px";
        this._highlightDiv.style.left = "2px";
        this._highlightDiv.style.width = (this._band.getViewWidth() - 4) + "px";
    }
}

Timeline.GregorianEtherPainter.prototype.paint = function() {
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    Timeline.GregorianUtilities.roundDownToInterval(minDate, this._unit);
    
    var newDivs = [];
    var newDates = [];
    
    var p = this;
    var incrementDate = function(date) {
        Timeline.GregorianUtilities.incrementByInterval(date, p._unit);
    };
    var positionDiv = function(div, date) {
        var offset = Math.round(p._band.dateToPixelOffset(date));
        if (p._timeline.isHorizontal()) {
            div.style.left = offset + "px";
            div.style.bottom = "0px";
        } else {
            div.style.top = offset + "px";
            div.style.right = "0px";
        }
    };
    var createDiv = function(date) {
        var div = p._timeline.getDocument().createElement("div");
        div.className = p._timeline.isHorizontal() ? 
            "timeline-ether-interval-label-horizontal" :
            "timeline-ether-interval-label-vertical";
        
        var label = Timeline.GregorianUtilities.labelInterval(date, p._unit);
        div.innerHTML = label.text;
        if (label.emphasized) {
            div.className += "-emphasized";
        }
        
        positionDiv(div, date);
        p._markerLayer.appendChild(div);
        
        return div;
    };
    
    for (var i = 0; i < this._divs.length; i++) {
        var oldDate = this._dates[i];
        if (oldDate.getTime() < minDate.getTime() || oldDate.getTime() > maxDate.getTime()) {
            this._markerLayer.removeChild(this._divs[i]);
        } else {
            while (minDate.getTime() < oldDate.getTime() && minDate.getTime() < maxDate.getTime()) {
                newDivs.push(createDiv(minDate));
                newDates.push(new Date(minDate.getTime()));
                
                incrementDate(minDate);
            }
            incrementDate(minDate);
            
            if (oldDate.getTime() < maxDate.getTime()) {
                newDivs.push(this._divs[i]);
                newDates.push(this._dates[i]);
                positionDiv(this._divs[i], this._dates[i]);
            }
        }
    }
    
    while (minDate.getTime() < maxDate.getTime()) {
        newDivs.push(createDiv(minDate));
        newDates.push(new Date(minDate.getTime()));
        
        incrementDate(minDate);
    }
    
    this._divs = newDivs;
    this._dates = newDates;
};

Timeline.GregorianEtherPainter.prototype.softPaint = function() {
};

/*==================================================
 *  Hot Zone Gregorian Ether Painter
 *==================================================
 */
 
Timeline.HotZoneGregorianEtherPainter = function(params, band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._zones = [{
        startTime:  Number.NEGATIVE_INFINITY,
        endTime:    Number.POSITIVE_INFINITY,
        unit:       params.unit,
        multiple:   1
    }];
    for (var i = 0; i < params.zones.length; i++) {
        var zone = params.zones[i];
        var zoneStart = Timeline.parseGregorianDateTime(zone.start).getTime();
        var zoneEnd = Timeline.parseGregorianDateTime(zone.end).getTime();
        
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
                    zone2.magnify += zone.magnify;
                    zoneStart = zone2.endTime;
                }
            } // else, try the next existing zone
        }
    }
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.className = this._backgroundLayer.className.split(" ").concat(params.cssClass).join(" ");
    
    this._markerLayer = null;
    this._highlightDiv = null;
};

Timeline.HotZoneGregorianEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    if (!(this._highlightDiv)) {
        this._highlightDiv = this._timeline.getDocument().createElement("div");
        this._highlightDiv.className = "timeline-band-highlight";
        this._backgroundLayer.appendChild(this._highlightDiv);
    }
    
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    if (this._timeline.isHorizontal()) {
        this._highlightDiv.style.left = startPixel + "px";
        this._highlightDiv.style.width = (endPixel - startPixel) + "px";
        this._highlightDiv.style.top = "2px";
        this._highlightDiv.style.height = (this._band.getViewWidth() - 4) + "px";
    } else {
        this._highlightDiv.style.top = startPixel + "px";
        this._highlightDiv.style.height = (endPixel - startPixel) + "px";
        this._highlightDiv.style.left = "2px";
        this._highlightDiv.style.width = (this._band.getViewWidth() - 4) + "px";
    }
}

Timeline.HotZoneGregorianEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    Timeline.GregorianUtilities.roundDownToInterval(minDate, this._unit);
    
    var p = this;
    var incrementDate = function(date, zone) {
        for (var i = 0; i < zone.multiple; i++) {
            Timeline.GregorianUtilities.incrementByInterval(date, zone.unit);
        }
    };
    var positionDiv = function(div, date) {
        var offset = Math.round(p._band.dateToPixelOffset(date));
        if (p._timeline.isHorizontal()) {
            div.style.left = offset + "px";
            div.style.bottom = "0px";
        } else {
            div.style.top = offset + "px";
            div.style.right = "0px";
        }
    };
    var createDiv = function(date, zone) {
        var div = p._timeline.getDocument().createElement("div");
        div.className = p._timeline.isHorizontal() ? 
            "timeline-ether-interval-label-horizontal" :
            "timeline-ether-interval-label-vertical";
        
        var label = Timeline.GregorianUtilities.labelInterval(date, zone.unit);
        div.innerHTML = label.text;
        if (label.emphasized) {
            div.className += "-emphasized";
        }
        
        positionDiv(div, date);
        p._markerLayer.appendChild(div);
        
        return div;
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
        
        while (minDate2.getTime() < maxDate2.getTime()) {
            createDiv(minDate2, zone);
            incrementDate(minDate2, zone);
        }
    }
};

Timeline.HotZoneGregorianEtherPainter.prototype.softPaint = function() {
};
