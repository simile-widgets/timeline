/*==================================================
 *  Sorted Array
 *==================================================
 */

Timeline.SortedArray = function(compare) {
    this._a = [];
    this._compare = compare;
};

Timeline.SortedArray.prototype.add = function(elmt) {
    var sa = this;
    var index = this.find(function(elmt2) {
        return sa._compare(elmt2, elmt);
    });
    
    if (index < this._a.length) {
        this._a.splice(index, 0, elmt);
    } else {
        this._a.push(elmt);
    }
};

Timeline.SortedArray.prototype.remove = function(elmt) {
    var sa = this;
    var index = this.find(function(elmt2) {
        return sa._compare(elmt2, elmt);
    });
    
    while (index < this._a.length && this._compare(this._a[index], elmt) == 0) {
        if (this._a[index] == elmt) {
            this._a.splice(index, 1);
            return true;
        } else {
            index++;
        }
    }
    return false;
};

Timeline.SortedArray.prototype.removeAll = function() {
    this._a = [];
};

Timeline.SortedArray.prototype.elementAt = function(index) {
    return this._a[index];
};

Timeline.SortedArray.prototype.length = function() {
    return this._a.length;
};

Timeline.SortedArray.prototype.find = function(compare) {
    var a = 0;
    var b = this._a.length;
    
    while (a < b) {
        var mid = Math.floor((a + b) / 2);
        var c = compare(this._a[mid]);
        if (mid == a) {
            return c < 0 ? a+1 : a;
        } else if (c < 0) {
            a = mid;
        } else {
            b = mid;
        }
    }
    return a;
};

/*==================================================
 *  The All Selector
 *==================================================
 */


Timeline.DefaultEventSource = function(timeZoneOffset) {
    this._events = new Timeline.SortedArray(Timeline.DefaultEventSource.compare);
    this._listeners = [];
    if (timeZoneOffset) {
        this._timeZoneShift = timeZoneOffset * Timeline.GregorianUnitLengths[Timeline.HOUR];
    } else {
        this._timeZoneShift = 0;
    }
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
    while (node) {
        if (node.nodeType == 1) {
            var evt = new Timeline.DefaultEventSource.Event(
                Timeline.parseGregorianDateTime(node.getAttribute("starts")),
                Timeline.parseGregorianDateTime(node.getAttribute("ends")),
                node.getAttribute("title"),
                node.getAttribute("description"),
                this._timeZoneShift
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
    return new Timeline.DefaultEventSource._Iterator(this._events, startDate, endDate);
};

Timeline.DefaultEventSource._Iterator = function(events, startDate, endDate) {
    this._events = events;
    this._startDate = startDate;
    this._endDate = endDate;
    
    this._maxIndex = events.find(function(evt) {
        return evt.getStart().getTime() - endDate.getTime();
    });    
    this._currentIndex = -1;
    
    this._hasNext = false;
    this._next = null;
    this._findNext();
};

Timeline.DefaultEventSource._Iterator.prototype = {
    hasNext: function() { return this._hasNext; },
    next: function() {
        if (this._hasNext) {
            var next = this._next;
            this._findNext();
            
            return next;
        } else {
            return null;
        }
    },
    _findNext: function() {
        while ((++this._currentIndex) < this._maxIndex) {
            var evt = this._events.elementAt(this._currentIndex);
            if (evt.getStart().getTime() < this._endDate.getTime() &&
                evt.getEnd().getTime() > this._startDate.getTime()) {
                
                this._next = evt;
                this._hasNext = true;
                return;
            }
        }
        this._next = null;
        this._hasNext = false;
    }
};

Timeline.DefaultEventSource.compare = function(event1, event2) {
    return event1.getStart().getTime() - event2.getStart().getTime();
};

Timeline.DefaultEventSource.Event = function(start, end, text, description, timeZoneShift) {
    this._start = start;
    this._end = (end != null) ? end : start;
    this._text = text;
    this._description = description;
    this._id = "e" + Math.floor(Math.random() * 1000000);
    
    if (timeZoneShift != 0) {
        this._start = new Date(this._start.getTime() + timeZoneShift);
        this._end = new Date(this._end.getTime() + timeZoneShift);
    }
};

Timeline.DefaultEventSource.Event.prototype = {
    getStart:       function() { return this._start; },
    getEnd:         function() { return this._end; },
    getText:        function() { return this._text; },
    getDescription: function() { return this._description; },
    getID:          function() { return this._id; }
};