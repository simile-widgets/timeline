require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;

            var eventSourceJewish = new Timeline.DefaultEventSource(0);
            var eventSourceChristianity = new Timeline.DefaultEventSource(0);
            
            var theme = Timeline.ClassicTheme.create();
            theme.event.bubble.width = 320;
            theme.ether.backgroundColors = [
                "#D1CECA",
                "#E7DFD6",
                "#E8E8F4",
                "#D0D0E8"
            ];
            
            var zones = [
                {   start:    "0",
                    end:      "2100",
                    magnify:  15,
                    unit:     Timeline.DateTime.DECADE
                },
                {   start:    "1800",
                    end:      "2100",
                    magnify:  3,
                    unit:     Timeline.DateTime.YEAR,
                    multiple: 1
                }
            ];
            var zones2 = [
                {   start:    "0",
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
            
            var d = Timeline.DateTime.parseGregorianDateTime("0");
            var bandInfos = [
                Timeline.createHotZoneBandInfo({
                    width:          "7%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 70,
                    zones:          zones2,
                    eventSource:    eventSourceJewish,
                    date:           d,
                    overview:       true,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "32%",
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 250,
                    zones:          zones,
                    eventSource:    eventSourceJewish,
                    date:           d,
                    timeZone:       -6,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "54%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 250,
                    zones:          zones,
                    eventSource:    eventSourceChristianity,
                    date:           d,
                    timeZone:       -6,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "7%", 
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 70,
                    zones:          zones2,
                    eventSource:    eventSourceChristianity,
                    date:           d,
                    overview:       true,
                    theme:          theme
                })
            ];
            bandInfos[0].syncWith = 1;
            bandInfos[0].highlight = true;
            
            bandInfos[2].syncWith = 1;
            bandInfos[3].syncWith = 2;
            bandInfos[3].highlight = true;
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            tl.loadXML("jewish.xml", function(xml, url) {
                eventSourceJewish.loadXML(xml, url);
                document.getElementById("jewish-event-count").innerHTML = eventSourceJewish.getCount();
            });
            tl.loadXML("christianity.xml", function(xml, url) {
                eventSourceChristianity.loadXML(xml, url);
                document.getElementById("christianity-event-count").innerHTML = eventSourceChristianity.getCount();
            });
            
            setupFilterHighlightControls(document.getElementById("jewish-controls"), tl, [0,1], theme);
            setupFilterHighlightControls(document.getElementById("christianity-controls"), tl, [2,3], theme);

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