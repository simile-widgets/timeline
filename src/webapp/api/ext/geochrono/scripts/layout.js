/*==================================================
 *  Geochrono Ether Marker Layout
 *==================================================
 */
define(["simile-ajax"], function(SimileAjax) { 
var GeochronoEtherMarkerLayout = function(timeline, band, theme, align, showLine) {
    var horizontal = timeline.isHorizontal();
    if (horizontal) {
        if (align == "Top") {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.top = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.bottom = "0px";
            };
        }
    } else {
        if (align == "Left") {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.left = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.right = "0px";
            };
        }
    }
    
    var markerTheme = theme.ether.interval.marker;
    var lineTheme = theme.ether.interval.line;
    
    var stylePrefix = (horizontal ? "h" : "v") + align;
    var labelStyler = markerTheme[stylePrefix + "Styler"];
    var emphasizedLabelStyler = markerTheme[stylePrefix + "EmphasizedStyler"];
    
    this.createIntervalMarker = function(date, labeller, unit, markerDiv, lineDiv) {
        var offset = Math.round(band.dateToPixelOffset(date));

        if (showLine) {
            var divLine = timeline.getDocument().createElement("div");
            divLine.style.position = "absolute";
            
            if (lineTheme.opacity < 100) {
                SimileAjax.Graphics.setOpacity(divLine, lineTheme.opacity);
            }
            
            if (horizontal) {
                divLine.style.borderLeft = "1px solid " + lineTheme.color;
                divLine.style.left = offset + "px";
                divLine.style.width = "1px";
                divLine.style.top = "0px";
                divLine.style.height = "100%";
            } else {
                divLine.style.borderTop = "1px solid " + lineTheme.color;
                divLine.style.top = offset + "px";
                divLine.style.height = "1px";
                divLine.style.left = "0px";
                divLine.style.width = "100%";
            }
            lineDiv.appendChild(divLine);
        }
        
        var label = labeller.labelInterval(date, unit);
        
        var div = timeline.getDocument().createElement("div");
        div.innerHTML = label.text;
        div.style.position = "absolute";
        //(label.emphasized ? emphasizedLabelStyler : labelStyler)(div);
        
        this.positionDiv(div, offset);
        markerDiv.appendChild(div);
        
        return div;
    };
};

    return GeochronoEtherMarkerLayout;
});
