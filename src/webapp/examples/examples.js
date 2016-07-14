<<<<<<< HEAD
function centerSimileAjax(date) {
    tl.getBand(0).setCenterVisibleDate(SimileAjax.DateTime.parseGregorianDateTime(date));
}

function setupFilterHighlightControls(div, timeline, bandIndices, theme) {
=======
define(["simile-ajax"], function(SimileAjax) {
    var Helpers = {};

Helpers.centerSimileAjax = function(date) {
    tl.getBand(0).setCenterVisibleDate(SimileAjax.DateTime.parseGregorianDateTime(date));
};

Helpers.setupFilterHighlightControls = function(div, timeline, bandIndices, theme) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var table = document.createElement("table");
    var tr = table.insertRow(0);
    
    var td = tr.insertCell(0);
    td.innerHTML = "Filter:";
    
    td = tr.insertCell(1);
    td.innerHTML = "Highlight:";
    
    var handler = function(elmt, evt, target) {
<<<<<<< HEAD
        onKeyPress(timeline, bandIndices, table);
=======
        Helpers.onKeyPress(timeline, bandIndices, table);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    };
    
    tr = table.insertRow(1);
    tr.style.verticalAlign = "top";
    
    td = tr.insertCell(0);
    
    var input = document.createElement("input");
    input.type = "text";
    SimileAjax.DOM.registerEvent(input, "keypress", handler);
    td.appendChild(input);
    
    for (var i = 0; i < theme.event.highlightColors.length; i++) {
        td = tr.insertCell(i + 1);
        
        input = document.createElement("input");
        input.type = "text";
        SimileAjax.DOM.registerEvent(input, "keypress", handler);
        td.appendChild(input);
        
        var divColor = document.createElement("div");
        divColor.style.height = "0.5em";
        divColor.style.background = theme.event.highlightColors[i];
        td.appendChild(divColor);
    }
    
    td = tr.insertCell(tr.cells.length);
    var button = document.createElement("button");
    button.innerHTML = "Clear All";
    SimileAjax.DOM.registerEvent(button, "click", function() {
<<<<<<< HEAD
        clearAll(timeline, bandIndices, table);
=======
        Helpers.clearAll(timeline, bandIndices, table);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    });
    td.appendChild(button);
    
    div.appendChild(table);
<<<<<<< HEAD
}

var timerID = null;
function onKeyPress(timeline, bandIndices, table) {
=======
};

var timerID = null;
Helpers.onKeyPress = function(timeline, bandIndices, table) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    if (timerID != null) {
        window.clearTimeout(timerID);
    }
    timerID = window.setTimeout(function() {
<<<<<<< HEAD
        performFiltering(timeline, bandIndices, table);
    }, 300);
}
function cleanString(s) {
    return s.replace(/^\s+/, '').replace(/\s+$/, '');
}
function performFiltering(timeline, bandIndices, table) {
    timerID = null;
    
    var tr = table.rows[1];
    var text = cleanString(tr.cells[0].firstChild.value);
=======
        Helpers.performFiltering(timeline, bandIndices, table);
    }, 300);
};

Helpers.cleanString = function(s) {
    return s.replace(/^\s+/, '').replace(/\s+$/, '');
};

Helpers.performFiltering = function(timeline, bandIndices, table) {
    timerID = null;
    
    var tr = table.rows[1];
    var text = Helpers.cleanString(tr.cells[0].firstChild.value);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    
    var filterMatcher = null;
    if (text.length > 0) {
        var regex = new RegExp(text, "i");
        filterMatcher = function(evt) {
            return regex.test(evt.getText()) || regex.test(evt.getDescription());
        };
    }
    
    var regexes = [];
    var hasHighlights = false;
    for (var x = 1; x < tr.cells.length - 1; x++) {
        var input = tr.cells[x].firstChild;
<<<<<<< HEAD
        var text2 = cleanString(input.value);
=======
        var text2 = Helpers.cleanString(input.value);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
        if (text2.length > 0) {
            hasHighlights = true;
            regexes.push(new RegExp(text2, "i"));
        } else {
            regexes.push(null);
        }
    }
    var highlightMatcher = hasHighlights ? function(evt) {
        var text = evt.getText();
        var description = evt.getDescription();
        for (var x = 0; x < regexes.length; x++) {
            var regex = regexes[x];
            if (regex != null && (regex.test(text) || regex.test(description))) {
                return x;
            }
        }
        return -1;
    } : null;
    
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(filterMatcher);
        timeline.getBand(bandIndex).getEventPainter().setHighlightMatcher(highlightMatcher);
    }
    timeline.paint();
<<<<<<< HEAD
}
function clearAll(timeline, bandIndices, table) {
=======
};

Helpers.clearAll = function(timeline, bandIndices, table) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var tr = table.rows[1];
    for (var x = 0; x < tr.cells.length - 1; x++) {
        tr.cells[x].firstChild.value = "";
    }
    
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(null);
        timeline.getBand(bandIndex).getEventPainter().setHighlightMatcher(null);
    }
    timeline.paint();
<<<<<<< HEAD
}
=======
};

    return Helpers;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
