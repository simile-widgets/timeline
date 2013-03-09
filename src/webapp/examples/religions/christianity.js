require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;

            var eventSourceChristianity = new Timeline.DefaultEventSource(0);
            
            var theme = Timeline.ClassicTheme.create();
            theme.event.bubble.width = 320;
            
            var zones = [
                {   start:    "0",
                    end:      "2100",
                    magnify:  10,
                    unit:     Timeline.DateTime.DECADE
                },
                {   start:    "1800",
                    end:      "2100",
                    magnify:  3,
                    unit:     Timeline.DateTime.YEAR,
                    multiple: 5
                }
            ];
            var zones2 = [
                {   start:    "0",
                    end:      "2100",
                    magnify:  10,
                    unit:     Timeline.DateTime.DECADE
                },
                {   start:    "1800",
                    end:      "2100",
                    magnify:  3,
                    unit:     Timeline.DateTime.YEAR,
                    multiple: 10
                }
            ];
            
            var d = Timeline.DateTime.parseGregorianDateTime("0");
            var bandInfos = [
                Timeline.createHotZoneBandInfo({
                    width:          "85%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 250,
                    zones:          zones,
                    eventSource:    eventSourceChristianity,
                    date:           d,
                    timeZone:       -6,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "15%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 70,
                    zones:          zones2,
                    eventSource:    eventSourceChristianity,
                    date:           d,
                    overview:       true,
                    theme:          theme
                })
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[1].highlight = true;
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            tl.loadXML("christianity.xml", function(xml, url) {
                eventSourceChristianity.loadXML(xml, url);
            });
            
            setupFilterHighlightControls(document.getElementById("controls"), tl, [0,1], theme);

        window.centerTimeline = function(year) {
            tl.getBand(0).setCenterVisibleDate(new Date(year, 0, 1));
        };

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