require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "ext/geochrono/scripts/geochrono", "./painters.js", "../examples.js"],
        function(Timeline, Geochrono, ThumbnailEventPainter) {
        var tl;
            var theme = Timeline.ClassicTheme.create();
            theme.event.label.width = 150; // px
            theme.event.bubble.width = 250;
            theme.event.bubble.height = 200;
            theme.ether.backgroundColors.unshift("white");
            
            var eventSource = new Timeline.DefaultEventSource(new SimileAjax.EventIndex(Geochrono.Unit));
            
            var d = Geochrono.Unit.wrapMA(80);
            var bandInfos = [
                Geochrono.createBandInfo({
                    eventSource:    eventSource,
                    date:           d,
                    width:          "86%", 
                    intervalUnit:   Geochrono.Unit.MA, 
                    intervalPixels: 100,
                    trackGap:       0.2,
                    trackHeight:    1.3,
                    theme:          theme
                }),
                Geochrono.createBandInfo({
                    date:           d,
                    width:          "6%", 
                    intervalUnit:   Geochrono.Unit.EPOCH, 
                    intervalPixels: 15,
                    showEventText:  false,
                    align:          "Top",
                    theme:          theme
                }),
                Geochrono.createBandInfo({
                    date:           d,
                    width:          "4%", 
                    intervalUnit:   Geochrono.Unit.PERIOD, 
                    intervalPixels: 8,
                    showEventText:  false,
                    theme:          theme
                }),
                Geochrono.createBandInfo({
                    date:           d,
                    width:          "4%", 
                    intervalUnit:   Geochrono.Unit.ERA, 
                    intervalPixels: 2,
                    showEventText:  false,
                    theme:          theme
                })
            ];
            bandInfos[0].eventPainter = new ThumbnailEventPainter({
                theme:              theme,
                trackHeight:        15,
                trackOffset:        10,
                labelWidth:         100,
                thumbnailWidth:     80,
                thumbnailHeight:    26
            });
            bandInfos[1].syncWith = 0;
            bandInfos[1].highlight = true;
            bandInfos[2].syncWith = 0;
            bandInfos[2].highlight = true;
            bandInfos[3].syncWith = 0;
            bandInfos[3].highlight = true;
            bandInfos[0].decorators = [
                new Timeline.SpanHighlightDecorator({
                    unit:       Geochrono.Unit,
                    startDate:  Geochrono.Unit.wrapMA(65.1),
                    endDate:    Geochrono.Unit.wrapMA(64.9),
                    startLabel: "",
                    endLabel:   "K/T Extinction",
                    color:      "#FFC080",
                    opacity:    50,
                    theme:      theme
                })
            ];
            for (var i = 1; i < bandInfos.length; i++) {
                bandInfos[i].decorators = [
                    new Timeline.PointHighlightDecorator({
                        unit:       Geochrono.Unit,
                        date:       Geochrono.Unit.wrapMA(65),
                        color:      "#FFC080",
                        opacity:    50,
                        theme:      theme
                    })
                ];
            }
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL, Geochrono.Unit);
            tl.loadXML("dinosaurs.xml", function(xml, url) {
                eventSource.loadXML(xml, url);
            });
            
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
