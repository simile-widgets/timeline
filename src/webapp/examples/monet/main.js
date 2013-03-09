require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api"],
    function(Timeline) {
        var tl;

            var eventSource = new Timeline.DefaultEventSource(0);
            
            var theme = Timeline.ClassicTheme.create();
            theme.event.bubble.width = 320;
            theme.event.bubble.height = 220;
            theme.ether.backgroundColors[1] = theme.ether.backgroundColors[0];
            var d = Timeline.DateTime.parseGregorianDateTime("1870")
            var bandInfos = [
                Timeline.createBandInfo({
                    width:          "10%", 
                    intervalUnit:   Timeline.DateTime.DECADE, 
                    intervalPixels: 200,
                    date:           d,
                    showEventText:  false,
                    theme:          theme
                }),
                Timeline.createBandInfo({
                    width:          "90%", 
                    intervalUnit:   Timeline.DateTime.DECADE, 
                    intervalPixels: 200,
                    eventSource:    eventSource,
                    date:           d,
                    theme:          theme
                })
            ];
            bandInfos[0].etherPainter = new Timeline.YearCountEtherPainter({
                startDate:  "Nov 14 1840 00:00:00 GMT",
                multiple:   5,
                theme:      theme
            });
            bandInfos[0].syncWith = 1;
            bandInfos[0].highlight = false;
            bandInfos[0].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  "Nov 14 1840 00:00:00 GMT",
                    endDate:    "Dec 05 1926 00:00:00 GMT",
                    startLabel: "birth",
                    endLabel:   "death",
                    color:      "#FFC080",
                    opacity:    50,
                    theme:      theme
                })
            ];
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            tl.loadXML("monet.xml", function(xml, url) {
                eventSource.loadXML(xml, url);
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
