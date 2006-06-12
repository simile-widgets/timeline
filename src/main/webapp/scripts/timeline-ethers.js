/*==================================================
 *  Gregorian Ether
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

Timeline.LinearEther.prototype.getDuration = function() {
    return this._duration;
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
            text = date.toDateString();
            break;
        case Timeline.WEEK:
            text = date.toDateString();
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
