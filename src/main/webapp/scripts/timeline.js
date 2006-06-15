/*==================================================
 *  Timeline
 *==================================================
 */
function Timeline(elmt, bandInfos, orientation) {
    this._containerDiv = elmt;
    this._orientation = orientation == null ? Timeline.HORIZONTAL : orientation;
    this._bandInfos = bandInfos;
    
    this._initialize();
};

Timeline.HORIZONTAL = 0;
Timeline.VERTICAL = 1;

/*
 *  Interval Units
 */
Timeline.MILLISECOND    = 0;
Timeline.SECOND         = 1;
Timeline.MINUTE         = 2;
Timeline.HOUR           = 3;
Timeline.DAY            = 4;
Timeline.WEEK           = 5;
Timeline.MONTH          = 6;
Timeline.YEAR           = 7;
Timeline.DECADE         = 8;
Timeline.CENTURY        = 9;
Timeline.MILLENNIUM     = 10;

Timeline.GregorianUnitLengths = [];
Timeline.GregorianUnitLengths[Timeline.MILLISECOND] = 1;
Timeline.GregorianUnitLengths[Timeline.SECOND]      = 1000;
Timeline.GregorianUnitLengths[Timeline.MINUTE]      = Timeline.GregorianUnitLengths[Timeline.SECOND] * 60;
Timeline.GregorianUnitLengths[Timeline.HOUR]        = Timeline.GregorianUnitLengths[Timeline.MINUTE] * 60;
Timeline.GregorianUnitLengths[Timeline.DAY]         = Timeline.GregorianUnitLengths[Timeline.HOUR] * 24;
Timeline.GregorianUnitLengths[Timeline.WEEK]        = Timeline.GregorianUnitLengths[Timeline.DAY] * 7;
Timeline.GregorianUnitLengths[Timeline.MONTH]       = Timeline.GregorianUnitLengths[Timeline.DAY] * 31;
Timeline.GregorianUnitLengths[Timeline.YEAR]        = Timeline.GregorianUnitLengths[Timeline.DAY] * 365;
Timeline.GregorianUnitLengths[Timeline.DECADE]      = Timeline.GregorianUnitLengths[Timeline.YEAR] * 10;
Timeline.GregorianUnitLengths[Timeline.CENTURY]     = Timeline.GregorianUnitLengths[Timeline.YEAR] * 100;
Timeline.GregorianUnitLengths[Timeline.MILLENNIUM]  = Timeline.GregorianUnitLengths[Timeline.YEAR] * 1000;

Timeline.parseGregorianDateTime = function(o) {
    if (o == null) {
        return null;
    } else if (o instanceof Date) {
        return o;
    } else {
        try {
            return new Date(Date.parse(o));
        } catch (e) {
            return null;
        }
    }
}

Timeline.createSimpleBandInfo = function(width, intervalUnit, intervalCount, eventSource, date, etherCssClass, showEventText) {
    return {   
        width:          width,
        eventSource:    eventSource,
        etherParams: { 
            duration: intervalCount * Timeline.GregorianUnitLengths[intervalUnit], 
            centersOn: date 
        },
        etherPainterParams: { unit: intervalUnit, cssClass: etherCssClass },
        eventPainterParams: { showText: showEventText }
    };
};

Timeline.isIE = false;
Timeline.isWin = false;
Timeline.isWin32 = false;
Timeline.pngIsTranslucent = true;
(function() {
    Timeline.isIE= (navigator.appName.indexOf("Microsoft") != -1);
    
	var ua = navigator.userAgent.toLowerCase(); 
	Timeline.isWin = (ua.indexOf('win') != -1);
	Timeline.isWin32 = Timeline.isWin && (   
        ua.indexOf('95') != -1 || 
        ua.indexOf('98') != -1 || 
        ua.indexOf('nt') != -1 || 
        ua.indexOf('win32') != -1 || 
        ua.indexOf('32bit') != -1
    );
    Timeline.pngIsTranslucent = !(Timeline.isIE && Timeline.isWin32);
})();

Timeline.createTranslucentImage = function(doc, url, width, height, verticalAlign) {
    var elmt;
    if (Timeline.pngIsTranslucent) {
        elmt = doc.createElement("img");
        elmt.setAttribute("src", url);
        elmt.style.verticalAlign = (verticalAlign != null) ? verticalAlign : "text-top";
    } else {
        elmt = doc.createElement("div");
        elmt.style.display = "inline";
        elmt.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + url +"', sizingMethod='scale')";
    }
    elmt.style.width = width + "px";
    elmt.style.height = height + "px";
    return elmt;
};

Timeline.prototype.layout = function() {
    this._distributeWidths();
};

Timeline.prototype.getDocument = function() {
    return this._containerDiv.ownerDocument;
};

Timeline.prototype.addDiv = function(div) {
    this._containerDiv.appendChild(div);
};

Timeline.prototype.removeDiv = function(div) {
    this._containerDiv.removeChild(div);
};

Timeline.prototype.isHorizontal = function() {
    return this._orientation == Timeline.HORIZONTAL;
};

Timeline.prototype.isVertical = function() {
    return this._orientation == Timeline.VERTICAL;
};

Timeline.prototype.getPixelLength = function() {
    return this._orientation == Timeline.HORIZONTAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

Timeline.prototype.getPixelWidth = function() {
    return this._orientation == Timeline.VERTICAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

Timeline.prototype._initialize = function() {
    var containerDiv = this._containerDiv;
    var doc = containerDiv.ownerDocument;
    
    containerDiv.className = 
        containerDiv.className.split(" ").concat("timeline-container").join(" ");
        
    while (containerDiv.firstChild) {
        containerDiv.removeChild(containerDiv.firstChild);
    }
    
    this._bands = [];
    for (var i = 0; i < this._bandInfos.length; i++) {
        var band = new Timeline._Band(this, this._bandInfos[i]);
        this._bands.push(band);
    }
    this._distributeWidths();
    
    for (var i = 0; i < this._bandInfos.length; i++) {
        var bandInfo = this._bandInfos[i];
        if ("highlight" in bandInfo) {
            this._bands[i].setHighlightBand(this._bands[bandInfo.highlight]);
        }
    }
};

Timeline.prototype._distributeWidths = function() {
    var length = this.getPixelLength();
    var width = this.getPixelWidth();
    var cumulativeWidth = 0;
    
    for (var i = 0; i < this._bands.length; i++) {
        var band = this._bands[i];
        var bandInfos = this._bandInfos[i];
        var widthString = bandInfos.width;
        
        var x = widthString.indexOf("%");
        if (x > 0) {
            var percent = parseInt(widthString.substr(0, x));
            var bandWidth = percent * width / 100;
        } else {
            var bandWidth = parseInt(widthString);
        }
        
        band.setBandShiftAndWidth(cumulativeWidth, bandWidth);
        band.setViewLength(length);
        
        cumulativeWidth += bandWidth;
    }
};

Timeline.registerEventWithObject = function(elmt, eventName, obj, handler) {
    Timeline.registerEvent(elmt, eventName, function(elmt2, evt, target) {
        return handler.call(obj, elmt2, evt, target);
    });
};

Timeline.registerEvent = function(elmt, eventName, handler) {
    var handler2 = function(evt) {
        evt = (evt) ? evt : ((event) ? event : null);
        if (evt) {
            var target = (evt.target) ? 
                evt.target : ((evt.srcElement) ? evt.srcElement : null);
            if (target) {
                target = (target.nodeType == 1 || target.nodeType == 9) ? 
                    target : target.parentNode;
            }
            
            return handler(elmt, evt, target);
        }
        return true;
    }
    
    if (Timeline.isIE) {
        elmt.attachEvent("on" + eventName, handler2);
    } else {
        elmt.addEventListener(eventName, handler2, true);
    }
};

/*==================================================
 *  Band
 *==================================================
 */
Timeline._Band = function(timeline, bandInfo) {
    this._timeline = timeline;
    this._bandInfo = bandInfo;
    
    this._dragging = false;
    this._changing = false;
    this._onScrollListeners = [];
    
    var b = this;
    this._highlightBand = null;
    this._highlightBandHandler = function(band) {
        b._onHighlightBandScroll();
    };
    this._selectorListener = function(band) {
        b._onHighlightBandScroll();
    };
    
    this._div = this._timeline.getDocument().createElement("div");
    this._div.className = "timeline-band";
    this._timeline.addDiv(this._div);
    
    Timeline.registerEventWithObject(this._div, "mousedown", this, this._onMouseDown);
    Timeline.registerEventWithObject(this._div, "mousemove", this, this._onMouseMove);
    Timeline.registerEventWithObject(this._div, "mouseup", this, this._onMouseUp);
    
    this._innerDiv = this._timeline.getDocument().createElement("div");
    this._innerDiv.className = "timeline-band-inner";
    this._div.appendChild(this._innerDiv);
    
    var etherConstructor = (bandInfo.ether) ? bandInfo.ether : Timeline.LinearEther;
    this._ether = new etherConstructor(bandInfo.etherParams, timeline);
        
    var etherPainterConstructor = (bandInfo.etherPainter)? bandInfo.etherPainter : etherConstructor.getDefaultEtherPainter();
    this._etherPainter = new etherPainterConstructor(bandInfo.etherPainterParams, this, timeline);
        
    this._eventSource = bandInfo.eventSource;
    if (this._eventSource) {
        this._eventSource.addListener({
            onAddMany: function() { b._onAddMany(); },
            onClear:   function() { b._onClear(); }
        });
    }
    
    this._eventPainter = (bandInfo.eventPainter) ? 
        new bandInfo.eventPainter(bandInfo.eventPainterParams, this, timeline) : 
        new Timeline.DurationEventPainter(bandInfo.eventPainterParams, this, timeline);
};

Timeline._Band.SCROLL_MULTIPLES = 5;

Timeline._Band.prototype.addOnScrollListener = function(listener) {
    this._onScrollListeners.push(listener);
};

Timeline._Band.prototype.removeOnScrollListener = function(listener) {
    for (var i = 0; i < this._onScrollListeners.length; i++) {
        if (this._onScrollListeners[i] == listener) {
            this._onScrollListeners.splice(i, 1);
            break;
        }
    }
};

Timeline._Band.prototype.setHighlightBand = function(band) {
    if (this._highlightBand) {
        this._highlightBand.removeOnScrollListener(this._highlightBandHandler);
    }
    
    this._highlightBand = band;
    this._highlightBand.addOnScrollListener(this._highlightBandHandler);
    this._positionHighlight();
};

Timeline._Band.prototype.getEther = function() {
    return this._ether;
};

Timeline._Band.prototype.getEventSource = function() {
    return this._eventSource;
};

Timeline._Band.prototype.layout = function() {
    this._etherPainter.paint();
    this._paintEvents();
};

Timeline._Band.prototype.softLayout = function() {
    this._etherPainter.softPaint();
    this._softPaintEvents();
};

Timeline._Band.prototype.setBandShiftAndWidth = function(shift, width) {
    if (this._timeline.isHorizontal()) {
        this._div.style.top = shift + "px";
        this._div.style.height = width + "px";
    } else {
        this._div.style.left = shift + "px";
        this._div.style.width = width + "px";
    }
};

Timeline._Band.prototype.getViewWidth = function() {
    if (this._timeline.isHorizontal()) {
        return this._div.offsetHeight;
    } else {
        return this._div.offsetWidth;
    }
};

Timeline._Band.prototype.setViewLength = function(length) {
    this._viewLength = length;
    this._recenterDiv();
    this._onChanging();
};

Timeline._Band.prototype.getViewLength = function() {
    return this._viewLength;
};

Timeline._Band.prototype.getViewOffset = function() {
    return this._viewOffset;
};

Timeline._Band.prototype.getMinDate = function() {
    return this._ether.pixelOffsetToDate(this._viewOffset);
};

Timeline._Band.prototype.getMaxDate = function() {
    return this._ether.pixelOffsetToDate(this._viewOffset + Timeline._Band.SCROLL_MULTIPLES * this._viewLength);
};

Timeline._Band.prototype.getMinVisibleDate = function() {
    return this._ether.pixelOffsetToDate(0);
};

Timeline._Band.prototype.getMaxVisibleDate = function() {
    return this._ether.pixelOffsetToDate(this._viewLength);
};

Timeline._Band.prototype.getCenterVisibleDate = function() {
    return this._ether.pixelOffsetToDate(this._viewLength / 2);
};

Timeline._Band.prototype.setMinVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(-this._ether.dateToPixelOffset(date)));
    }
};

Timeline._Band.prototype.setMaxVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength - this._ether.dateToPixelOffset(date)));
    }
};

Timeline._Band.prototype.setCenterVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength / 2 - this._ether.dateToPixelOffset(date)));
    }
};

Timeline._Band.prototype.dateToPixelOffset = function(date) {
    return this._ether.dateToPixelOffset(date) - this._viewOffset;
};

Timeline._Band.prototype.pixelOffsetToDate = function(pixels) {
    return this._ether.pixelOffsetToDate(pixels + this._viewOffset);
};

Timeline._Band.prototype.createLayerDiv = function(zIndex) {
    var div = this._timeline.getDocument().createElement("div");
    div.className = "timeline-band-layer";
    div.style.zIndex = zIndex;
    this._innerDiv.appendChild(div);
    
    var innerDiv = this._timeline.getDocument().createElement("div");
    innerDiv.className = "timeline-band-layer-inner";
    div.appendChild(innerDiv);
    
    return innerDiv;
};

Timeline._Band.prototype.removeLayerDiv = function(div) {
    this._innerDiv.removeChild(div.parentNode);
};

Timeline._Band.prototype._onMouseDown = function(innerFrame, evt, target) {
    this._dragging = true;
    this._dragX = evt.clientX;
    this._dragY = evt.clientY;
};

Timeline._Band.prototype._onMouseMove = function(innerFrame, evt, target) {
    if (this._dragging) {
        var diffX = evt.clientX - this._dragX;
        var diffY = evt.clientY - this._dragY;
        
        this._dragX = evt.clientX;
        this._dragY = evt.clientY;
        
        this._moveEther(this._timeline.isHorizontal() ? diffX : diffY);
        this._positionHighlight();
    }
};

Timeline._Band.prototype._onMouseUp = function(innerFrame, evt, target) {
    this._dragging = false;
};

Timeline._Band.prototype._moveEther = function(shift) {
    this._viewOffset += shift;
    this._ether.shiftPixels(-shift);
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
    }
    
    if (this._viewOffset > -this._viewLength * 0.5 ||
        this._viewOffset < -this._viewLength * (Timeline._Band.SCROLL_MULTIPLES - 1.5)) {
        
        this._recenterDiv();
    } else {
        this.softLayout();
    }
    
    this._onChanging();
}

Timeline._Band.prototype._onChanging = function() {
    this._changing = true;

    this._fireOnScroll();
    this._setHighlightBandDate();
    
    this._changing = false;
};

Timeline._Band.prototype._fireOnScroll = function() {
    for (var i = 0; i < this._onScrollListeners.length; i++) {
        this._onScrollListeners[i](this);
    }
};

Timeline._Band.prototype._setHighlightBandDate = function() {
    if (this._highlightBand) {
        var centerDate = this._ether.pixelOffsetToDate(this.getViewLength() / 2);
        this._highlightBand.setCenterVisibleDate(centerDate);
    }
};

Timeline._Band.prototype._onHighlightBandScroll = function() {
    if (this._highlightBand) {
        var centerDate = this._highlightBand.getCenterVisibleDate();
        var centerPixelOffset = this._ether.dateToPixelOffset(centerDate);
        
        this._moveEther(Math.round(this._viewLength / 2 - centerPixelOffset));
        this._etherPainter.setHighlight(
            this._highlightBand.getMinVisibleDate(), 
            this._highlightBand.getMaxVisibleDate());
    }
};

Timeline._Band.prototype._onAddMany = function() {
    this._paintEvents();
};

Timeline._Band.prototype._onClear = function() {
    this._paintEvents();
};

Timeline._Band.prototype._positionHighlight = function() {
    if (this._highlightBand) {
        var startDate = this._highlightBand.getMinVisibleDate();
        var endDate = this._highlightBand.getMaxVisibleDate();
        
        this._etherPainter.setHighlight(startDate, endDate);
    }
};

Timeline._Band.prototype._recenterDiv = function() {
    this._viewOffset = -this._viewLength * (Timeline._Band.SCROLL_MULTIPLES - 1) / 2;
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
        this._div.style.width = (Timeline._Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
        this._div.style.height = (Timeline._Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    }
    this.layout();
};

Timeline._Band.prototype._paintEvents = function() {
    this._eventPainter.paint();
};

Timeline._Band.prototype._softPaintEvents = function() {
    this._eventPainter.softPaint();
};

/*==================================================
 *  Utilities
 *==================================================
 */

Timeline.handleCaughtException = function(e) {
    alert("Caught exception: " + e);
};

Timeline.loadXML = function(url, f) {
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load data xml from " + url + "\n" + statusText);
    };
    var fDone = function(xmlhttp) {
        f(xmlhttp.responseXML);
    };
    Timeline.xmlHttpGet(url, fError, fDone);
};

/**
 *  Callback for XMLHttp onRequestStateChange.
 */
Timeline._xmlHttpRequest_onReadyStateChange = function(xmlhttp, fError, fDone) {
    switch (xmlhttp.readyState) {
    // 1: Request not yet made
    // 2: Contact established with server but nothing downloaded yet
    // 3: Called multiple while downloading in progress
    
    // Download complete
    case 4:
        try {
            if (xmlhttp.status == 200) {
                if (fDone) {
                    fDone(xmlhttp);
                }
            } else {
                if (fError) {
                    fError(
                        xmlhttp.statusText,
                        xmlhttp.status,
                        xmlhttp
                    );
                }
            }
        } catch (e) {
            Timeline.handleCaughtException(e);
        }
        break;
    }
};

/**
 *  Creates an XMLHttpRequest object. On the first run, this
 *  function creates a platform-specific function for
 *  instantiating an XMLHttpRequest object and then replaces
 *  itself with that function.
 */
Timeline._createXmlHttpRequest = function() {
    if (Timeline.isIE) {
        var programIDs = [
        "Msxml2.XMLHTTP",
        "Microsoft.XMLHTTP",
        "Msxml2.XMLHTTP.4.0"
        ];
        for (var i = 0; i < programIDs.length; i++) {
            try {
                var programID = programIDs[i];
                var f = function() {
                    return new ActiveXObject(programID);
                };
                var o = f();
                
                // We are replacing the Timeline._createXmlHttpRequest
                // function with this inner function as we've
                // found out that it works. This is so that we
                // don't have to do all the testing over again
                // on subsequent calls.
                Timeline._createXmlHttpRequest = f;
                
                return o;
            } catch (e) {
                // silent
            }
        }
        throw new Error("Failed to create an XMLHttpRequest object");
    } else {
        try {
            var f = function() {
                return new XMLHttpRequest();
            };
            var o = f();
            
            // We are replacing the Timeline._createXmlHttpRequest
            // function with this inner function as we've
            // found out that it works. This is so that we
            // don't have to do all the testing over again
            // on subsequent calls.
            Timeline._createXmlHttpRequest = f;
            
            return o;
        } catch (e) {
            throw new Error("Failed to create an XMLHttpRequest object");
        }
    }
};

/**
 *  Performs an asynchronous HTTP GET.
 *  fError is of the form function(statusText, statusCode, xmlhttp).
 *  fDone is of the form function(xmlhttp).
 */
Timeline.xmlHttpGet = function(url, fError, fDone) {
    var xmlhttp = Timeline._createXmlHttpRequest();
    
    xmlhttp.open("GET", url, true);
    //xmlhttp.overrideMimeType("text/xml");
    xmlhttp.onreadystatechange = function() {
        Timeline._xmlHttpRequest_onReadyStateChange(xmlhttp, fError, fDone);
    };
    xmlhttp.send(null);
};

/**
 *  Performs an asynchronous HTTP POST.
 *  fError is of the form function(statusText, statusCode, xmlhttp).
 *  fDone is of the form function(xmlhttp).
 */
Timeline.xmlHttpPost = function(url, body, fError, fDone) {
    var xmlhttp = Timeline._createXmlHttpRequest();
    
    xmlhttp.open("POST", url, true);
    //xmlhttp.overrideMimeType("text/xml");
    xmlhttp.onreadystatechange = function() {
        Timeline._xmlHttpRequest_onReadyStateChange(xmlhttp, fError, fDone);
    };
    xmlhttp.send(body);
}
