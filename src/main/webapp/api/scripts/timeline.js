/*==================================================
 *  Timeline
 *==================================================
 */
Timeline.create = function(elmt, bandInfos, orientation) {
    return new Timeline._Impl(elmt, bandInfos, orientation);
};

Timeline.HORIZONTAL = 0;
Timeline.VERTICAL = 1;

Timeline._defaultTheme = null;

Timeline.createSimpleBandInfo = function(
    width, 
    intervalUnit, 
    intervalCount, 
    eventSource, 
    date, 
    showEventText,
    theme
    ) {
    theme = (theme != null) ? theme : Timeline.getDefaultTheme();
    
    return {   
        width:          width,
        eventSource:    eventSource,
        etherParams: { 
            duration: intervalCount * Timeline.DateTime.gregorianUnitLengths[intervalUnit], 
            centersOn: date 
        },
        etherPainterParams: { unit: intervalUnit, theme: theme },
        eventPainterParams: { theme: theme, showText: showEventText }
    };
};

Timeline.getDefaultTheme = function() {
    if (Timeline._defaultTheme == null) {
        Timeline._defaultTheme = Timeline.ClassicTheme.create(Timeline.Platform.getDefaultLocale());
    }
    return Timeline._defaultTheme;
};

Timeline.setDefaultTheme = function(theme) {
    Timeline._defaultTheme = theme;
};

Timeline.loadXML = function(url, f) {
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load data xml from " + url + "\n" + statusText);
    };
    var fDone = function(xmlhttp) {
        f(xmlhttp.responseXML);
    };
    Timeline.XmlHttp.get(url, fError, fDone);
};

Timeline._Impl = function(elmt, bandInfos, orientation) {
    this._containerDiv = elmt;
    this._orientation = orientation == null ? Timeline.HORIZONTAL : orientation;
    this._bandInfos = bandInfos;
    
    this._initialize();
};

Timeline._Impl.prototype.layout = function() {
    this._distributeWidths();
};

Timeline._Impl.prototype.getDocument = function() {
    return this._containerDiv.ownerDocument;
};

Timeline._Impl.prototype.addDiv = function(div) {
    this._containerDiv.appendChild(div);
};

Timeline._Impl.prototype.removeDiv = function(div) {
    this._containerDiv.removeChild(div);
};

Timeline._Impl.prototype.isHorizontal = function() {
    return this._orientation == Timeline.HORIZONTAL;
};

Timeline._Impl.prototype.isVertical = function() {
    return this._orientation == Timeline.VERTICAL;
};

Timeline._Impl.prototype.getPixelLength = function() {
    return this._orientation == Timeline.HORIZONTAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

Timeline._Impl.prototype.getPixelWidth = function() {
    return this._orientation == Timeline.VERTICAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

Timeline._Impl.prototype._initialize = function() {
    var containerDiv = this._containerDiv;
    var doc = containerDiv.ownerDocument;
    
    containerDiv.className = 
        containerDiv.className.split(" ").concat("timeline-container").join(" ");
        
    while (containerDiv.firstChild) {
        containerDiv.removeChild(containerDiv.firstChild);
    }
    
    this._bands = [];
    for (var i = 0; i < this._bandInfos.length; i++) {
        var band = new Timeline._Band(this, this._bandInfos[i], i);
        this._bands.push(band);
    }
    this._distributeWidths();
    
    for (var i = 0; i < this._bandInfos.length; i++) {
        var bandInfo = this._bandInfos[i];
        if ("syncWith" in bandInfo) {
            this._bands[i].setSyncWithBand(this._bands[bandInfo.syncWith], (bandInfo.highlight));
        }
    }
};

Timeline._Impl.prototype._distributeWidths = function() {
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

/*==================================================
 *  Band
 *==================================================
 */
Timeline._Band = function(timeline, bandInfo, index) {
    this._timeline = timeline;
    this._bandInfo = bandInfo;
    this._index = index;
    
    this._locale = ("locale" in bandInfo) ? bandInfo.locale : Timeline.Platform.getDefaultLocale();
    this._timeZone = ("timeZone" in bandInfo) ? bandInfo.timeZone : 0;
    this._labeller = ("labeller" in bandInfo) ? bandInfo.labeller : 
        new Timeline.GregorianDateLabeller.create(this._locale, this._timeZone);
    
    this._dragging = false;
    this._changing = false;
    this._onScrollListeners = [];
    
    var b = this;
    this._syncWithBand = null;
    this._syncWithBandHandler = function(band) {
        b._onHighlightBandScroll();
    };
    this._selectorListener = function(band) {
        b._onHighlightBandScroll();
    };
    
    this._div = this._timeline.getDocument().createElement("div");
    this._div.className = "timeline-band";
    this._timeline.addDiv(this._div);
    
    Timeline.DOM.registerEventWithObject(this._div, "mousedown", this, this._onMouseDown);
    Timeline.DOM.registerEventWithObject(this._div, "mousemove", this, this._onMouseMove);
    Timeline.DOM.registerEventWithObject(this._div, "mouseup", this, this._onMouseUp);
    
    this._innerDiv = this._timeline.getDocument().createElement("div");
    this._innerDiv.className = "timeline-band-inner";
    this._div.appendChild(this._innerDiv);
    
    var etherConstructor = ("ether" in bandInfo) ? bandInfo.ether : Timeline.LinearEther;
    this._ether = new etherConstructor(bandInfo.etherParams, timeline);
        
    var etherPainterConstructor = ("etherPainter" in bandInfo) ? bandInfo.etherPainter : etherConstructor.getDefaultEtherPainter();
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
        
    this._bubble = null;
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

Timeline._Band.prototype.setSyncWithBand = function(band, highlight) {
    if (this._syncWithBand) {
        this._syncWithBand.removeOnScrollListener(this._syncWithBandHandler);
    }
    
    this._syncWithBand = band;
    this._syncWithBand.addOnScrollListener(this._syncWithBandHandler);
    this._highlight = highlight;
    this._positionHighlight();
};

Timeline._Band.prototype.getLocale = function() {
    return this._locale;
};

Timeline._Band.prototype.getTimeZone = function() {
    return this._timeZone;
};

Timeline._Band.prototype.getLabeller = function() {
    return this._labeller;
};

Timeline._Band.prototype.getIndex = function() {
    return this._index;
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

Timeline._Band.prototype.closeBubble = function() {
    if (this._bubble != null) {
        this._bubble.close();
        this._bubble = null;
    }
};

Timeline._Band.prototype.openBubbleForPoint = function(pageX, pageY, width, height) {
    this.closeBubble();
    
    this._bubble = Timeline.Graphics.createBubbleForPoint(
        this._timeline.getDocument(), pageX, pageY, width, height);
        
    return this._bubble.content;
};

Timeline._Band.prototype._onMouseDown = function(innerFrame, evt, target) {
    this.closeBubble();
    
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
    this.closeBubble();
    
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
    this._setSyncWithBandDate();
    
    this._changing = false;
};

Timeline._Band.prototype._fireOnScroll = function() {
    for (var i = 0; i < this._onScrollListeners.length; i++) {
        this._onScrollListeners[i](this);
    }
};

Timeline._Band.prototype._setSyncWithBandDate = function() {
    if (this._syncWithBand) {
        var centerDate = this._ether.pixelOffsetToDate(this.getViewLength() / 2);
        this._syncWithBand.setCenterVisibleDate(centerDate);
    }
};

Timeline._Band.prototype._onHighlightBandScroll = function() {
    if (this._syncWithBand) {
        var centerDate = this._syncWithBand.getCenterVisibleDate();
        var centerPixelOffset = this._ether.dateToPixelOffset(centerDate);
        
        this._moveEther(Math.round(this._viewLength / 2 - centerPixelOffset));
        
        if (this._highlight) {
            this._etherPainter.setHighlight(
                this._syncWithBand.getMinVisibleDate(), 
                this._syncWithBand.getMaxVisibleDate());
        }
    }
};

Timeline._Band.prototype._onAddMany = function() {
    this._paintEvents();
};

Timeline._Band.prototype._onClear = function() {
    this._paintEvents();
};

Timeline._Band.prototype._positionHighlight = function() {
    if (this._syncWithBand) {
        var startDate = this._syncWithBand.getMinVisibleDate();
        var endDate = this._syncWithBand.getMaxVisibleDate();
        
        if (this._highlight) {
            this._etherPainter.setHighlight(startDate, endDate);
        }
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

