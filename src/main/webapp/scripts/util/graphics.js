/*==================================================
 *  Graphics Utility Functions and Constants
 *==================================================
 */

Timeline.Graphics = new Object();
Timeline.Graphics.pngIsTranslucent = !(Timeline.Platform.isIE && Timeline.Platform.isWin32);

Timeline.Graphics.createTranslucentImage = function(doc, url, width, height, verticalAlign) {
    var elmt;
    if (Timeline.Graphics.pngIsTranslucent) {
        elmt = doc.createElement("img");
        elmt.setAttribute("src", url);
        elmt.style.verticalAlign = (verticalAlign != null) ? verticalAlign : "text-top";
    } else {
        elmt = doc.createElement("div");
        elmt.style.display = "inline";
        elmt.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + url +"', sizingMethod='scale')";
    }
    elmt.style.width = width + "px";
    elmt.style.height = height + "px";
    return elmt;
};

Timeline.Graphics.setOpacity = function(elmt, opacity) {
    if (Timeline.Graphics.isIE) {
        elmt.style.filter = "progid:DXImageTransform.Microsoft.Alpha(Style=0,Opacity=" + opacity + ")";
    } else {
        var o = (opacity / 100).toString();
        elmt.style.opacity = o;
        elmt.style.MozOpacity = o;
    }
};

