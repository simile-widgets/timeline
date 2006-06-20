/*==================================================
 *  Duration Event Painter
 *==================================================
 */

Timeline.DurationEventPainter = function(params, band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._theme = params.theme;
    this._showText = params.showText;
    this._showLineForNoText = ("showLineForNoText" in params) ? 
        params.showLineForNoText : params.theme.event.instant.showLineForNoText;
    
    this._layerDiv = null;
};

Timeline.DurationEventPainter.prototype.paint = function() {
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    if (this._layerDiv) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(110);
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var streams = [ Number.NEGATIVE_INFINITY ];
    var doc = this._timeline.getDocument();
    
    var p = this;
    var layerDiv = this._layerDiv;
    var showText = this._showText;
    var theme = this._theme;
    var eventTheme = theme.event;
    
    //if (this._timeline.isHorizontal()) {
        var appendIcon = function(evt, div) {
            var icon = evt.getIcon();
            var img = Timeline.Graphics.createTranslucentImage(
                doc, icon != null ? icon : eventTheme.instant.icon
            );
            div.appendChild(img);
            div.style.cursor = "pointer";
            
            Timeline.DOM.registerEvent(div, "mousedown", function(elmt, domEvt, target) {
                p._onClickInstantEvent(img, domEvt, evt);
            });
        };
        var createInstantDiv = function(evt, startPixel, endPixel, streamOffset) {
            var finalPixel = startPixel - 1;
            if (evt.isImprecise()) { // imprecise time
                var length = Math.max(endPixel - startPixel, 1);
            
                var divImprecise = doc.createElement("div");
                divImprecise.style.position = "absolute";
                
                divImprecise.style.top = streamOffset;
                divImprecise.style.height = eventTheme.track.height + "em";
                divImprecise.style.left = startPixel + "px";
                divImprecise.style.width = length + "px";
                
                divImprecise.style.background = eventTheme.instant.impreciseColor;
                if (eventTheme.instant.impreciseOpacity < 100) {
                    Timeline.Graphics.setOpacity(divImprecise, eventTheme.instant.impreciseOpacity);
                }
                
                layerDiv.appendChild(divImprecise);
                
                finalPixel = endPixel;
            }
            
            var div = doc.createElement("div");
            div.style.position = "absolute";
            div.style.overflow = "hidden";
            layerDiv.appendChild(div);
            
            var foreground = evt.getTextColor();
            var background = evt.getColor();
            
            var realign = -8; // shift left so that icon is centered on startPixel
            if (showText) {
                div.style.width = eventTheme.label.width + "px";
                div.style.color = foreground != null ? foreground : eventTheme.label.outsideColor;
                
                appendIcon(evt, div);
                div.appendChild(doc.createTextNode(evt.getText()));
                
                finalPixel = Math.max(finalPixel, startPixel + eventTheme.label.width);
            } else {
                if (p._showLineForNoText) {
                    div.style.width = "1px";
                    div.style.borderLeft = "1px solid " + (background != null ? background : eventTheme.instant.lineColor);
                    realign = 0; // no shift
                } else {
                    appendIcon(evt, div);
                }
            }
            
            div.style.top = streamOffset;
            div.style.height = eventTheme.track.height + "em";
            div.style.left = (startPixel + realign) + "px";
            
            return finalPixel;
        };
        var createDurationDiv = function(evt, startPixel, endPixel, streamOffset) {
            var attachClickEvent = function(elmt) {
                elmt.style.cursor = "pointer";
                Timeline.DOM.registerEvent(elmt, "mousedown", function(elmt, domEvt, target) {
                    p._onClickDurationEvent(domEvt, evt);
                });
            };
            
            if (evt.isImprecise()) { // imprecise time
                var length = Math.max(endPixel - startPixel, 1);
            
                var div = doc.createElement("div");
                div.style.position = "absolute";
                
                div.style.top = streamOffset;
                div.style.height = eventTheme.track.height + "em";
                div.style.left = startPixel + "px";
                div.style.width = length + "px";
                
                div.style.background = eventTheme.duration.impreciseColor;
                if (eventTheme.duration.impreciseOpacity < 100) {
                    Timeline.Graphics.setOpacity(div, eventTheme.duration.impreciseOpacity);
                }
                
                layerDiv.appendChild(div);
                
                var startDate = evt.getStart();
                var endDate = evt.getEnd();
                
                var startPixel2 = Math.round(p._band.dateToPixelOffset(startDate));
                var endPixel2 = Math.round(p._band.dateToPixelOffset(endDate));
            } else {
                var startPixel2 = startPixel;
                var endPixel2 = endPixel;
            }
            
            var finalPixel = endPixel;
            var foreground = evt.getTextColor();
            
            if (startPixel2 <= endPixel2) {
                length = Math.max(endPixel2 - startPixel2, 1);
                
                div = doc.createElement("div");
                div.style.position = "absolute";
                
                div.style.top = streamOffset;
                div.style.height = eventTheme.track.height + "em";
                div.style.left = startPixel2 + "px";
                div.style.width = length + "px";
                
                var background = evt.getColor();
                
                div.style.background = background != null ? background : eventTheme.duration.color;
                if (eventTheme.duration.opacity < 100) {
                    Timeline.Graphics.setOpacity(div, eventTheme.duration.opacity);
                }
                
                layerDiv.appendChild(div);
            }
            attachClickEvent(div);
                
            if (showText) {
                if (length > 100) {
                    div.style.color = foreground != null ? foreground : eventTheme.label.insideColor;
                    div.style.overflow = "hidden";
                    div.appendChild(doc.createTextNode(evt.getText()));
                } else {
                    var divLabel = doc.createElement("div");
                    divLabel.style.position = "absolute";
                    
                    divLabel.style.top = streamOffset;
                    divLabel.style.height = eventTheme.track.height + "em";
                    divLabel.style.left = endPixel2 + "px";
                    divLabel.style.width = eventTheme.label.width + "px";
                    divLabel.style.color = foreground != null ? foreground : eventTheme.label.outsideColor;
                    divLabel.style.overflow = "hidden";
                    divLabel.appendChild(doc.createTextNode(evt.getText()));
                    
                    layerDiv.appendChild(divLabel);
                    
                    finalPixel = endPixel2 + eventTheme.label.width;
                }
            }
            
            return finalPixel;
        };
    //}
    var createEventDiv = function(evt) {
        var startDate = evt.getStart();
        var endDate = evt.getEnd();
        
        var startPixel = Math.round(p._band.dateToPixelOffset(startDate));
        var endPixel = Math.round(p._band.dateToPixelOffset(endDate));
        
        var streamIndex = 0;
        for (; streamIndex < streams.length; streamIndex++) {
            if (streams[streamIndex] < startPixel) {
                break;
            }
        }
        if (streamIndex >= streams.length) {
            streams.push(Number.NEGATIVE_INFINITY);
        }
        
        var streamOffset = (eventTheme.track.offset + 
            streamIndex * (eventTheme.track.height + eventTheme.track.gap)) + "em";
        
        if (evt.isInstant()) {
            streams[streamIndex] = createInstantDiv(evt, startPixel, endPixel, streamOffset);
        } else {
            streams[streamIndex] = createDurationDiv(evt, startPixel, endPixel, streamOffset);
        }
    };
    
    var iterator = eventSource.getEventIterator(minDate, maxDate);
    while (iterator.hasNext()) {
        var evt = iterator.next();
        createEventDiv(evt);
    }
    this._layerDiv.style.display = "block";
};

Timeline.DurationEventPainter.prototype.softPaint = function() {
};

Timeline.DurationEventPainter.prototype._onClickInstantEvent = function(icon, domEvt, evt) {
    domEvt.cancelBubble = true;
    
    var c = Timeline.DOM.getPageCoordinates(icon);
    this._showBubble(
        c.left + Math.ceil(icon.offsetWidth / 2), 
        c.top + Math.ceil(icon.offsetHeight / 2),
        evt
    );
};

Timeline.DurationEventPainter.prototype._onClickDurationEvent = function(domEvt, evt) {
    domEvt.cancelBubble = true;
    this._showBubble(
        domEvt.clientX,
        domEvt.clientY,
        evt
    );
};

Timeline.DurationEventPainter.prototype._showBubble = function(x, y, evt) {
    var div = this._band.openBubbleForPoint(
        x, y,
        this._theme.event.bubble.width,
        this._theme.event.bubble.height
    );
    
    var doc = this._timeline.getDocument();
    
    var title = evt.getText();
    var link = evt.getLink();
    var image = evt.getImage();
    
    if (image != null) {
        var img = doc.createElement("img");
        img.src = image;
        
        this._theme.event.bubble.imageStyler(img);
        div.appendChild(img);
    }
    
    var divTitle = doc.createElement("div");
    var textTitle = doc.createTextNode(title);
    if (link != null) {
        var a = doc.createElement("a");
        a.href = link;
        a.appendChild(textTitle);
        divTitle.appendChild(a);
    } else {
        divTitle.appendChild(textTitle);
    }
    this._theme.event.bubble.titleStyler(divTitle);
    div.appendChild(divTitle);
    
    var divBody = doc.createElement("div");
    evt.fillDescription(divBody);
    this._theme.event.bubble.bodyStyler(divBody);
    div.appendChild(divBody);
    
    var divTime = doc.createElement("div");
    evt.fillTime(divTime, this._band.getLabeller());
    this._theme.event.bubble.timeStyler(divTime);
    div.appendChild(divTime);
};