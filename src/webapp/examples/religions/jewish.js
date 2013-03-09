require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;

            var eventSource = new Timeline.DefaultEventSource(0);
            
            var theme = Timeline.ClassicTheme.create();
            // demonstrate highlighting of labels (in addition to icons and tapes)
            theme.event.highlightLabelBackground = true;
            theme.event.bubble.width = 320;
            
            var zones = [
                {   start:    "1700",
                    end:      "2100",
                    magnify:  5,
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
                {   start:    "1700",
                    end:      "2100",
                    magnify:  5,
                    unit:     Timeline.DateTime.DECADE
                },
                {   start:    "1800",
                    end:      "2100",
                    magnify:  3,
                    unit:     Timeline.DateTime.YEAR,
                    multiple: 10
                }
            ];
            
            var d = Timeline.DateTime.parseGregorianDateTime("1000");
            var bandInfos = [
                Timeline.createHotZoneBandInfo({
                    width:          "75%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 250,
                    zones:          zones,
                    eventSource:    eventSource,
                    date:           d,
                    timeZone:       -6,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "25%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 70,
                    zones:          zones2,
                    eventSource:    eventSource,
                    date:           d,
                    overview:       true,
                    theme:          theme
                })
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[1].highlight = true;
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            tl.loadXML("jewish.xml", function(xml, url) {
                eventSource.loadXML(xml, url);
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