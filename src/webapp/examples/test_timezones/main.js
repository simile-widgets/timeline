require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;
            var date = SimileAjax.DateTime.parseIso8601DateTime("2009-03-18T00:00:00Z"); // GMT midnight
            var date2 = SimileAjax.DateTime.parseIso8601DateTime("2009-03-18T12:00:00Z"); // GMT noon
            var eventSource = new Timeline.DefaultEventSource();
            
            var bandInfos = [
                Timeline.createBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.HOUR, 
                    intervalPixels: 40,
                    eventSource:    eventSource,
                    date:           date
                }),
                Timeline.createBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.HOUR, 
                    intervalPixels: 40,
                    eventSource:    eventSource,
                    date:           date,
                    timeZone:       -SimileAjax.DateTime.timezoneOffset / 60
                }),
                Timeline.createBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.HOUR, 
                    intervalPixels: 40,
                    eventSource:    eventSource,
                    date:           date,
                    timeZone:       -8
                }),
                Timeline.createBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.HOUR, 
                    intervalPixels: 40,
                    eventSource:    eventSource,
                    date:           date,
                    timeZone:       -5
                }),
                Timeline.createBandInfo({
                    width:          "20%", 
                    intervalUnit:   Timeline.DateTime.HOUR, 
                    intervalPixels: 40,
                    eventSource:    eventSource,
                    date:           date,
                    timeZone:       0
                }),
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[2].syncWith = 0;
            bandInfos[3].syncWith = 0;
            bandInfos[4].syncWith = 0;
            
            bandInfos[0].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  date,
                    endDate:    date2,
                    color:      "#FFC080", // set color explicitly
                    opacity:    30,
                    startLabel: "Band 0",
                    endLabel:   "no timezone"
                })
            ];
            bandInfos[1].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  date,
                    endDate:    date2,
                    color:      "#FFC080", // set color explicitly
                    opacity:    30,
                    startLabel: "Band 1",
                    endLabel:   "browser's timezone"
                })
            ];
            bandInfos[2].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  date,
                    endDate:    date2,
                    color:      "#FFC080", // set color explicitly
                    opacity:    30,
                    startLabel: "Band 2",
                    endLabel:   "-08:00"
                })
            ];
            bandInfos[3].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  date,
                    endDate:    date2,
                    color:      "#FFC080", // set color explicitly
                    opacity:    30,
                    startLabel: "Band 3",
                    endLabel:   "-05:00"
                })
            ];
            bandInfos[4].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  date,
                    endDate:    date2,
                    color:      "#FFC080", // set color explicitly
                    opacity:    30,
                    startLabel: "Band 4",
                    endLabel:   "00:00"
                })
            ];
            
            tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
            eventSource.loadJSON(
                {
                    'dateTimeFormat': 'iso8601',
                    'events': [
                        {   'start': '2009-03-18',
                            'title': 'A: 2009-03-18'
                        },
                        {   'start': '2009-03-18T00:00:00',
                            'title': 'B: 2009-03-18T00:00:00'
                        },
                        {   'start': '2009-03-18T00:00:00Z',
                            'title': 'C: 2009-03-18T00:00:00Z'
                        },
                        {   'start': '2009-03-18T00:00:00-08:00',
                            'title': 'D: 2009-03-18T00:00:00-08:00'
                        }
                    ]
                }, 
                document.location.href
            );
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
