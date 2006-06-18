/*==================================================
 *  Default Event Source
 *==================================================
 */


Timeline.DefaultEventSource = function() {
    this._events = new Timeline.EventIndex();
    this._listeners = [];
};

Timeline.DefaultEventSource.prototype.addListener = function(listener) {
    this._listeners.push(listener);
};

Timeline.DefaultEventSource.prototype.removeListener = function(listener) {
    for (var i = 0; i < this._listeners.length; i++) {
        if (this._listeners[i] == listener) {
            this._listeners.splice(i, 1);
            break;
        }
    }
};

Timeline.DefaultEventSource.prototype.loadXML = function(xml) {
    var node = xml.documentElement.firstChild;
    var added = false;
    while (node != null) {
        if (node.nodeType == 1) {
            var evt = new Timeline.DefaultEventSource.Event(
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("start")),
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("end")),
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("latestStart")),
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("earliestEnd")),
                node.getAttribute("isDuration") != "true",
                node.getAttribute("title"),
                node.getAttribute("description"),
                node.getAttribute("icon"),
                node.getAttribute("color"),
                node.getAttribute("textColor")
            );
            this._events.add(evt);
            
            added = true;
        }
        node = node.nextSibling;
    }

    if (added) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].onAddMany();
        }
    }
};

Timeline.DefaultEventSource.prototype.clear = function() {
    this._events.removeAll();
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i].onClear();
    }
};

Timeline.DefaultEventSource.prototype.getEventIterator = function(startDate, endDate) {
    return this._events.getIterator(startDate, endDate);
};

Timeline.DefaultEventSource.Event = function(start, end, latestStart, earliestEnd, instant, text, description, icon, color, textColor) {
    this._id = "e" + Math.floor(Math.random() * 1000000);
    
    this._instant = instant;
    
    this._start = start;
    this._end = (end != null) ? end : start;
    
    this._latestStart = (latestStart != null) ? latestStart : (instant ? this._end : this._start);
    this._earliestEnd = (earliestEnd != null) ? earliestEnd : (instant ? this._start : this._end);
    
    this._text = text;
    this._description = description;
    
    this._icon = (icon != null && icon != "") ? icon : null;
    this._color = (color != null && color != "") ? color : null;
    this._textColor = (textColor != null && textColor != "") ? textColor : null;
};

Timeline.DefaultEventSource.Event.prototype = {
    getID:          function() { return this._id; },
    
    isInstant:      function() { return this._instant; },
    isImprecise:    function() { return this._start != this._latestStart || this._end != this._earliestEnd; },
    
    getStart:       function() { return this._start; },
    getEnd:         function() { return this._end; },
    getLatestStart: function() { return this._latestStart; },
    getEarliestEnd: function() { return this._earliestEnd; },
    
    getText:        function() { return this._text; },
    getDescription: function() { return this._description; },
    
    getIcon:        function() { return this._icon; },
    getColor:       function() { return this._color; },
    getTextColor:   function() { return this._textColor; }
};