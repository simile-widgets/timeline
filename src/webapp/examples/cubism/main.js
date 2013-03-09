require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api"],
    function(Timeline) {
        var tl;

            var eventSource = new Timeline.DefaultEventSource(0);
            
            var theme = Timeline.ClassicTheme.create();
            theme.event.bubble.width = 350;
            theme.event.bubble.height = 300;
            var d = Timeline.DateTime.parseGregorianDateTime("1900")
            var bandInfos = [
                Timeline.createBandInfo({
                    width:          "100%", 
                    intervalUnit:   Timeline.DateTime.DECADE, 
                    intervalPixels: 200,
                    eventSource:    eventSource,
                    date:           d,
                    theme:          theme,
                    layout:         'original'  // original, overview, detailed
                })
            ];
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            // stop browser caching of data during testing...
            tl.loadJSON("cubism.js?"+ (new Date().getTime()), function(json, url) {
                eventSource.loadJSON(json, url);
            });

        Timeline.writeVersion('tl_ver');

        var resizeTimerID = null;
        var onResize = function() {
            if (resizeTimerID == null) {
                resizeTimerID = window.setTimeout(function() {
                    resizeTimerID = null;
                    tl.layout();
                }, 500);
            }
        };
        window.onresize = onResize;
    }
)});