/*==================================================
 *  Graphics Utility Functions and Constants
 *==================================================
 */

Timeline.Graphics = new Object();
Timeline.Graphics.pngIsTranslucent = !(Timeline.Platform.isIE && Timeline.Platform.isWin32);

Timeline.Graphics.createTranslucentImage = function(doc, url, verticalAlign) {
    var elmt;
    if (Timeline.Graphics.pngIsTranslucent) {
        elmt = doc.createElement("img");
        elmt.setAttribute("src", url);
    } else {
        elmt = doc.createElement("div");
        elmt.style.display = "inline";
        elmt.style.width = "1px";  // just so that IE will calculate the size property
        elmt.style.height = "1px";
        elmt.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + url +"', sizingMethod='image')";
    }
    elmt.style.verticalAlign = (verticalAlign != null) ? verticalAlign : "middle";
    return elmt;
};

Timeline.Graphics.setOpacity = function(elmt, opacity) {
    if (Timeline.Platform.isIE) {
        elmt.style.filter = "progid:DXImageTransform.Microsoft.Alpha(Style=0,Opacity=" + opacity + ")";
    } else {
        var o = (opacity / 100).toString();
        elmt.style.opacity = o;
        elmt.style.MozOpacity = o;
    }
};

