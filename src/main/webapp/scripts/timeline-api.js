/*==================================================
 *  Timeline API
 *
 *  This file will load all the Javascript files
 *  necessary to make the standard timeline work.
 *
 *  Include this file in your HTML file as follows:
 *
 *    <script src="http://simile.mit.edu.nyud.net:8080/timeline/api/scripts/timeline-api.js" type="text/javascript"></script>
 *
 *  Note that we are using Coral CND to reduce the
 *  load on our server.
 *    http://coralcdn.org/
 *
 *==================================================
 */
 
(function() {
    var files = [
        "timeline.js",
        
        "util/platform.js",
        "util/debug.js",
        "util/xmlhttp.js",
        "util/dom.js",
        "util/graphics.js",
        "util/date-time.js",
        "util/data-structure.js",
        
        "ethers.js",
        "sources.js",
        "painters.js"
    ];
    
    var getUrlPrefix = function() {
        var heads = document.documentElement.getElementsByTagName("head");
        for (var h = 0; h < heads.length; h++) {
            var scripts = heads[h].getElementsByTagName("script");
            for (var s = 0; s < scripts.length; s++) {
                var url = scripts[s].src;
                var i = url.indexOf("timeline-api.js");
                if (i >= 0) {
                    return url.substr(0, i);
                }
            }
        }
        throw new Error("Failed to derive URL prefix for Timeline API code files");
    }
    
    try {
        var urlPrefix = getUrlPrefix();
        for (var i = 0; i < files.length; i++) {
            document.write("<script src='" + urlPrefix + files[i] + "' type='text/javascript'></script>");
        }
    } catch (e) {
        alert(e);
    }
})();