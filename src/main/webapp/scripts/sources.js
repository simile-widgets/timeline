/*==================================================
 *  The All Selector
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
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("starts")),
                Timeline.DateTime.parseGregorianDateTime(node.getAttribute("ends")),
                node.getAttribute("title"),
                node.getAttribute("description")
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

Timeline.DefaultEventSource.Event = function(start, end, text, description) {
    this._start = start;
    this._end = (end != null) ? end : start;
    this._text = text;
    this._description = description;
    this._id = "e" + Math.floor(Math.random() * 1000000);
};

Timeline.DefaultEventSource.Event.prototype = {
    getStart:       function() { return this._start; },
    getEnd:         function() { return this._end; },
    getText:        function() { return this._text; },
    getDescription: function() { return this._description; },
    getID:          function() { return this._id; }
};