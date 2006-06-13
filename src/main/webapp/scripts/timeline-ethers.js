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
        this.shiftPixels(this._timeline.getPixelLength() / 2);
    } else {
        this._start = new Date();
        this.shiftPixels(this._timeline.getPixelLength() / 2);
    }
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

Timeline.GregorianEtherPainter._monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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
    
    var clearInDay = function(d) {
        d.setMilliseconds(0);
        d.setSeconds(0);
        d.setMinutes(0);
        d.setHours(0);
    };
    var clearInYear = function(d) {
        clearInDay(d);
        d.setDate(1);
        d.setMonth(0);
    };
    
    switch(this._unit) {
    case Timeline.MILLISECOND:
        break;
    case Timeline.SECOND:
        minDate.setMilliseconds(0);
        minDate.setTime(minDate.getTime() + 1000);
        break;
    case Timeline.MINUTE:
        minDate.setMilliseconds(0);
        minDate.setSeconds(0);
        minDate.setTime(minDate.getTime() + Timeline.GregorianUnitLengths[Timeline.MINUTE]);
        break;
    case Timeline.HOUR:
        minDate.setMilliseconds(0);
        minDate.setSeconds(0);
        minDate.setMinutes(0);
        minDate.setTime(minDate.getTime() + Timeline.GregorianUnitLengths[Timeline.HOUR]);
        break;
    case Timeline.DAY:
        clearInDay(minDate);
        minDate.setDate(minDate.getDate() + 1);
        break;
    case Timeline.WEEK:
        // TODO: a week starts on different days in different locales.
        clearInDay(minDate);
        minDate.setDate(minDate.getDate() + (7 - minDate.getDay()));
        break;
    case Timeline.MONTH:
        clearInDay(minDate);
        minDate.setDate(1);
        minDate.setMonth(minDate.getMonth() + 1);
        break;
    case Timeline.YEAR:
        clearInYear(minDate);
        minDate.setFullYear(minDate.getFullYear() + 1);
        break;
    case Timeline.DECADE:
        clearInYear(minDate);
        minDate.setFullYear(Math.ceil(minDate.getFullYear() / 10) * 10);
        break;
    case Timeline.CENTURY:
        clearInYear(minDate);
        minDate.setFullYear(Math.ceil(minDate.getFullYear() / 100) * 100);
        break;
    case Timeline.MILLENNIUM:
        clearInYear(minDate);
        minDate.setFullYear(Math.ceil(minDate.getFullYear() / 1000) * 1000);
        break;
    }
    
    var newDivs = [];
    var newDates = [];
    
    var p = this;
    var incrementDate = function(date) {
        switch(p._unit) {
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
            date.setDate(date.getDate() + 1);
            break;
        case Timeline.WEEK:
            date.setDate(date.getDate() + 7);
            break;
        case Timeline.MONTH:
            date.setMonth(date.getMonth() + 1);
            break;
        case Timeline.YEAR:
            date.setFullYear(date.getFullYear() + 1);
            break;
        case Timeline.DECADE:
            date.setFullYear(date.getFullYear() + 10);
            break;
        case Timeline.CENTURY:
            date.setFullYear(date.getFullYear() + 100);
            break;
        case Timeline.MILLENNIUM:
            date.setFullYear(date.getFullYear() + 1000);
            break;
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
    var createDiv = function(date) {
        var div = p._timeline.getDocument().createElement("div");
        div.className = p._timeline.isHorizontal() ? 
            "timeline-ether-interval-label-horizontal" :
            "timeline-ether-interval-label-vertical";
        
        var text;
        switch(p._unit) {
        case Timeline.MILLISECOND:
            text = date.getMilliseconds();
            break;
        case Timeline.SECOND:
            text = date.getSeconds();
            break;
        case Timeline.MINUTE:
            text = date.getMinutes();
            break;
        case Timeline.HOUR:
            text = date.getHours() + ":00";
            break;
        case Timeline.DAY:
            text = Timeline.GregorianEtherPainter._monthNames[date.getMonth()] + " " + date.getDate();
            break;
        case Timeline.WEEK:
            text = Timeline.GregorianEtherPainter._monthNames[date.getMonth()] + " " + date.getDate();
            break;
        case Timeline.MONTH:
            var m = date.getMonth();
            if (m == 0) {
                text = date.getFullYear();
                div.className += "-emphasized";
            } else {
                text = Timeline.GregorianEtherPainter._monthNames[m];
            }
            break;
        case Timeline.YEAR:
            text = date.getFullYear();
            break;
        case Timeline.DECADE:
            text = date.getFullYear();
            break;
        case Timeline.CENTURY:
            text = date.getFullYear();
            break;
        case Timeline.MILLENNIUM:
            text = date.getFullYear();
            break;
        }
        div.innerHTML = text;
        
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
