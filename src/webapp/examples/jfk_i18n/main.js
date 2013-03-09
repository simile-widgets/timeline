require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;

            var eventSource = new Timeline.DefaultEventSource();
            
            var zones = [
                {   start:    "Fri Nov 22 1963 00:00:00 GMT-0600",
                    end:      "Mon Nov 25 1963 00:00:00 GMT-0600",
                    magnify:  10,
                    unit:     Timeline.DateTime.DAY
                },
                {   start:    "Fri Nov 22 1963 09:00:00 GMT-0600",
                    end:      "Sun Nov 24 1963 00:00:00 GMT-0600",
                    magnify:  5,
                    unit:     Timeline.DateTime.HOUR
                },
                {   start:    "Fri Nov 22 1963 11:00:00 GMT-0600",
                    end:      "Sat Nov 23 1963 00:00:00 GMT-0600",
                    magnify:  5,
                    unit:     Timeline.DateTime.MINUTE,
                    multiple: 10
                },
                {   start:    "Fri Nov 22 1963 12:00:00 GMT-0600",
                    end:      "Fri Nov 22 1963 14:00:00 GMT-0600",
                    magnify:  3,
                    unit:     Timeline.DateTime.MINUTE,
                    multiple: 5
                }
            ];
            var zones2 = [
                {   start:    "Fri Nov 22 1963 00:00:00 GMT-0600",
                    end:      "Mon Nov 25 1963 00:00:00 GMT-0600",
                    magnify:  10,
                    unit:     Timeline.DateTime.WEEK
                },
                {   start:    "Fri Nov 22 1963 09:00:00 GMT-0600",
                    end:      "Sun Nov 24 1963 00:00:00 GMT-0600",
                    magnify:  5,
                    unit:     Timeline.DateTime.DAY
                },
                {   start:    "Fri Nov 22 1963 11:00:00 GMT-0600",
                    end:      "Sat Nov 23 1963 00:00:00 GMT-0600",
                    magnify:  5,
                    unit:     Timeline.DateTime.MINUTE,
                    multiple: 60
                },
                {   start:    "Fri Nov 22 1963 12:00:00 GMT-0600",
                    end:      "Fri Nov 22 1963 14:00:00 GMT-0600",
                    magnify:  3,
                    unit:     Timeline.DateTime.MINUTE,
                    multiple: 15
                }
            ];
            
            var theme = Timeline.ClassicTheme.create();
            theme.event.bubble.width = 250;
            
            var date = "Fri Nov 22 1963 13:00:00 GMT-0600"
            var bandInfos = [
                Timeline.createHotZoneBandInfo({
                    width:          "80%", 
                    intervalUnit:   Timeline.DateTime.WEEK, 
                    intervalPixels: 220,
                    zones:          zones,
                    eventSource:    eventSource,
                    date:           date,
                    timeZone:       -6,
                    theme:          theme
                }),
                Timeline.createHotZoneBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.MONTH, 
                    intervalPixels: 200,
                    zones:          zones2, 
                    eventSource:    eventSource,
                    date:           date, 
                    timeZone:       -6,
                    overview:       true,
                    theme:          theme
                })
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[1].highlight = true;
            
            for (var i = 0; i < bandInfos.length; i++) {
                bandInfos[i].decorators = [
                    new Timeline.SpanHighlightDecorator({
                        startDate:  "Fri Nov 22 1963 12:30:00 GMT-0600",
                        endDate:    "Fri Nov 22 1963 13:00:00 GMT-0600",
                        color:      "#FFC080", // set color explicitly
                        opacity:    50,
                        startLabel: "shot",
                        endLabel:   "t.o.d.",
                        theme:      theme
                    }),
                    new Timeline.PointHighlightDecorator({
                        date:       "Fri Nov 22 1963 14:38:00 GMT-0600",
                        opacity:    50,
                        theme:      theme
                        // use the color from the css file
                    }),
                    new Timeline.PointHighlightDecorator({
                        date:       "Sun Nov 24 1963 13:00:00 GMT-0600",
                        opacity:    50,
                        theme:      theme
                        // use the color from the css file
                    })
                ];
            }
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            tl.loadXML("jfk.xml", function(xml, url) { eventSource.loadXML(xml, url); });
            
            setupFilterHighlightControls(document.getElementById("controls"), tl, [0,1], theme);

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
