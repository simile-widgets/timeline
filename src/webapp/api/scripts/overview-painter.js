/*==================================================
 *  Overview Event Painter
 *==================================================
 */
<<<<<<< HEAD

Timeline.OverviewEventPainter = function(params) {
=======
define(["simile-ajax"], function(SimileAjax) {
var OverviewEventPainter = function(params) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    this._params = params;
    this._onSelectListeners = [];
    
    this._filterMatcher = null;
    this._highlightMatcher = null;
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.initialize = function(band, timeline) {
=======
OverviewEventPainter.prototype.initialize = function(band, timeline) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    this._band = band;
    this._timeline = timeline;
    
    this._eventLayer = null;
    this._highlightLayer = null;
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.getType = function() {
    return 'overview';
};

Timeline.OverviewEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

Timeline.OverviewEventPainter.prototype.removeOnSelectListener = function(listener) {
=======
OverviewEventPainter.prototype.getType = function() {
    return 'overview';
};

OverviewEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

OverviewEventPainter.prototype.removeOnSelectListener = function(listener) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        if (this._onSelectListeners[i] == listener) {
            this._onSelectListeners.splice(i, 1);
            break;
        }
    }
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

Timeline.OverviewEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

Timeline.OverviewEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

Timeline.OverviewEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

Timeline.OverviewEventPainter.prototype.paint = function() {
=======
OverviewEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

OverviewEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

OverviewEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

OverviewEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

OverviewEventPainter.prototype.paint = function() {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    this._prepareForPainting();
    
    var eventTheme = this._params.theme.event;
    var metrics = {
        trackOffset:    eventTheme.overviewTrack.offset,
        trackHeight:    eventTheme.overviewTrack.height,
        trackGap:       eventTheme.overviewTrack.gap,
        trackIncrement: eventTheme.overviewTrack.height + eventTheme.overviewTrack.gap
    }
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var filterMatcher = (this._filterMatcher != null) ? 
        this._filterMatcher :
        function(evt) { return true; };
    var highlightMatcher = (this._highlightMatcher != null) ? 
        this._highlightMatcher :
        function(evt) { return -1; };
    
    var iterator = eventSource.getEventReverseIterator(minDate, maxDate);
    while (iterator.hasNext()) {
        var evt = iterator.next();
        if (filterMatcher(evt)) {
            this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
        }
    }
    
    this._highlightLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    // update the band object for max number of tracks in this section of the ether
    this._band.updateEventTrackInfo(this._tracks.length, metrics.trackIncrement); 
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.softPaint = function() {
};

Timeline.OverviewEventPainter.prototype._prepareForPainting = function() {
=======
OverviewEventPainter.prototype.softPaint = function() {
};

OverviewEventPainter.prototype._prepareForPainting = function() {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var band = this._band;
        
    this._tracks = [];
    
    if (this._highlightLayer != null) {
        band.removeLayerDiv(this._highlightLayer);
    }
    this._highlightLayer = band.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    
    if (this._eventLayer != null) {
        band.removeLayerDiv(this._eventLayer);
    }
    this._eventLayer = band.createLayerDiv(110, "timeline-band-events");
    this._eventLayer.style.display = "none";
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
=======
OverviewEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (evt.isInstant()) {
        this.paintInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintDurationEvent(evt, metrics, theme, highlightIndex);
    }
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
=======
OverviewEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var startDate = evt.getStart();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    
    var color = evt.getColor(),
        klassName = evt.getClassName();
    if (klassName) {
      color = null;
    } else {
      color = color != null ? color : theme.event.duration.color;
    }
    
    var tickElmtData = this._paintEventTick(evt, startPixel, color, 100, metrics, theme);
    
    this._createHighlightDiv(highlightIndex, tickElmtData, theme);
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
=======
OverviewEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var latestStartDate = evt.getLatestStart();
    var earliestEndDate = evt.getEarliestEnd();
    
    var latestStartPixel = Math.round(this._band.dateToPixelOffset(latestStartDate));
    var earliestEndPixel = Math.round(this._band.dateToPixelOffset(earliestEndDate));
    
    var tapeTrack = 0;
    for (; tapeTrack < this._tracks.length; tapeTrack++) {
        if (earliestEndPixel < this._tracks[tapeTrack]) {
            break;
        }
    }
    this._tracks[tapeTrack] = earliestEndPixel;
    
    var color = evt.getColor(),
        klassName = evt.getClassName();
    if (klassName) {
      color = null;
    } else {
      color = color != null ? color : theme.event.duration.color;
    }
    
    var tapeElmtData = this._paintEventTape(evt, tapeTrack, latestStartPixel, earliestEndPixel,
      color, 100, metrics, theme, klassName);
    
    this._createHighlightDiv(highlightIndex, tapeElmtData, theme);
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype._paintEventTape = function(
=======
OverviewEventPainter.prototype._paintEventTape = function(
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    evt, track, left, right, color, opacity, metrics, theme, klassName) {
    
    var top = metrics.trackOffset + track * metrics.trackIncrement;
    var width = right - left;
    var height = metrics.trackHeight;
    
    var tapeDiv = this._timeline.getDocument().createElement("div");
    tapeDiv.className = 'timeline-small-event-tape'
    if (klassName) {tapeDiv.className += ' small-' + klassName;}
    tapeDiv.style.left = left + "px";
    tapeDiv.style.width = width + "px";
    tapeDiv.style.top = top + "px";
    tapeDiv.style.height = height + "px";
    
    if (color) {
      tapeDiv.style.backgroundColor = color; // set color here if defined by event. Else use css
    }
 //   tapeDiv.style.overflow = "hidden";   // now set in css
 //   tapeDiv.style.position = "absolute";
    if(opacity<100) SimileAjax.Graphics.setOpacity(tapeDiv, opacity);
    
    this._eventLayer.appendChild(tapeDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   tapeDiv
    };
}

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype._paintEventTick = function(
=======
OverviewEventPainter.prototype._paintEventTick = function(
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    evt, left, color, opacity, metrics, theme) {
    
    var height = theme.event.overviewTrack.tickHeight;
    var top = metrics.trackOffset - height;
    var width = 1;
    
    var tickDiv = this._timeline.getDocument().createElement("div");
	  tickDiv.className = 'timeline-small-event-icon'
    tickDiv.style.left = left + "px";
    tickDiv.style.top = top + "px";
  //  tickDiv.style.width = width + "px";
  //  tickDiv.style.position = "absolute";
  //  tickDiv.style.height = height + "px";
  //  tickDiv.style.backgroundColor = color;
  //  tickDiv.style.overflow = "hidden";

    var klassName = evt.getClassName()
    if (klassName) {tickDiv.className +=' small-' + klassName};
	
    if(opacity<100) {SimileAjax.Graphics.setOpacity(tickDiv, opacity)};
    
    this._eventLayer.appendChild(tickDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   tickDiv
    };
}

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme) {
=======
OverviewEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (highlightIndex >= 0) {
        var doc = this._timeline.getDocument();
        var eventTheme = theme.event;
        
        var color = eventTheme.highlightColors[Math.min(highlightIndex, eventTheme.highlightColors.length - 1)];
        
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        div.style.left =    (dimensions.left - 1) + "px";
        div.style.width =   (dimensions.width + 2) + "px";
        div.style.top =     (dimensions.top - 1) + "px";
        div.style.height =  (dimensions.height + 2) + "px";
        div.style.background = color;
        
        this._highlightLayer.appendChild(div);
    }
};

<<<<<<< HEAD
Timeline.OverviewEventPainter.prototype.showBubble = function(evt) {
    // not implemented
};
=======
OverviewEventPainter.prototype.showBubble = function(evt) {
    // not implemented
};

    return OverviewEventPainter;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
