/*==================================================
 *  Ether Highlight Layout
 *==================================================
 */

define(["simile-ajax"], function(SimileAjax) {
var EtherHighlight = function(timeline, band, theme, backgroundLayer) {
    var horizontal = timeline.isHorizontal();
    
    this._highlightDiv = null;
    this._createHighlightDiv = function() {
        if (this._highlightDiv == null) {
            this._highlightDiv = timeline.getDocument().createElement("div");
            this._highlightDiv.setAttribute("name", "ether-highlight"); // for debugging
            this._highlightDiv.className = 'timeline-ether-highlight'            
            
            var opacity = theme.ether.highlightOpacity;
            if (opacity < 100) {
                SimileAjax.Graphics.setOpacity(this._highlightDiv, opacity);
            }
            
            backgroundLayer.appendChild(this._highlightDiv);
        }
    }
    
    this.position = function(startDate, endDate, orthogonalOffset, orthogonalExtent) {
        orthogonalOffset = orthogonalOffset || 0;
        orthogonalExtent = orthogonalExtent || 1.0;
        
        this._createHighlightDiv();
        
        var startPixel = Math.round(band.dateToPixelOffset(startDate));
        var endPixel = Math.round(band.dateToPixelOffset(endDate));
        var length = Math.max(endPixel - startPixel, 3);
        var totalWidth = band.getViewWidth() - 4;
        if (horizontal) {
            this._highlightDiv.style.left = startPixel + "px";
            this._highlightDiv.style.width = length + "px";
            this._highlightDiv.style.top = Math.round(orthogonalOffset * totalWidth) + "px";
            this._highlightDiv.style.height = Math.round(orthogonalExtent * totalWidth) + "px";
        } else {
            this._highlightDiv.style.top = startPixel + "px";
            this._highlightDiv.style.height = length + "px";
            this._highlightDiv.style.left = Math.round(orthogonalOffset * totalWidth) + "px";
            this._highlightDiv.style.width = Math.round(orthogonalExtent * totalWidth) + "px";
        }
    }
};

    return EtherHighlight;
});
