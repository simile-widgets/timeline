/*==================================================
 *  Span Highlight Decorator
 *==================================================
 */

Timeline.SpanHighlightDecorator = function(params) {
    this._startDate = Timeline.DateTime.parseGregorianDateTime(params.startDate);
    this._endDate = Timeline.DateTime.parseGregorianDateTime(params.endDate);
    this._startLabel = params.startLabel;
    this._endLabel = params.endLabel;
    this._styler = params.styler;
};

Timeline.SpanHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._layerDiv = null;
};

Timeline.SpanHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._startDate.getTime() < maxDate.getTime() && 
        this._endDate.getTime() > minDate.getTime()) {
        
        minDate = new Date(Math.max(minDate.getTime(), this._startDate.getTime()));
        maxDate = new Date(Math.min(maxDate.getTime(), this._endDate.getTime()));
        
        var minPixel = this._band.dateToPixelOffset(minDate);
        var maxPixel = this._band.dateToPixelOffset(maxDate);
        
        var doc = this._timeline.getDocument();
    
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        this._styler(div);
        this._layerDiv.appendChild(div);
            
        if (this._timeline.isHorizontal()) {
            div.style.left = minPixel + "px";
            div.style.width = (maxPixel - minPixel) + "px";
            div.style.top = "0px";
            div.style.height = "100%";
        } else {
            div.style.top = minPixel + "px";
            div.style.height = (maxPixel - minPixel) + "px";
            div.style.left = "0px";
            div.style.width = "100%";
        }
    }
    this._layerDiv.style.display = "block";
};

Timeline.SpanHighlightDecorator.prototype.softPaint = function() {
};

/*==================================================
 *  Point Highlight Decorator
 *==================================================
 */

Timeline.PointHighlightDecorator = function(params) {
    this._date = Timeline.DateTime.parseGregorianDateTime(params.date);
    this._width = ("width" in params) ? params.width : 10;
    this._styler = params.styler;
};

Timeline.PointHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._layerDiv = null;
};

Timeline.PointHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._date.getTime() < maxDate.getTime() && 
        this._date.getTime() > minDate.getTime()) {
        
        var pixel = this._band.dateToPixelOffset(this._date);
        var minPixel = pixel - Math.round(this._width / 2);
        
        var doc = this._timeline.getDocument();
    
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        this._styler(div);
        this._layerDiv.appendChild(div);
            
        if (this._timeline.isHorizontal()) {
            div.style.left = minPixel + "px";
            div.style.width = this._width + "px";
            div.style.top = "0px";
            div.style.height = "100%";
        } else {
            div.style.top = minPixel + "px";
            div.style.height = this._width + "px";
            div.style.left = "0px";
            div.style.width = "100%";
        }
    }
    this._layerDiv.style.display = "block";
};

Timeline.PointHighlightDecorator.prototype.softPaint = function() {
};
