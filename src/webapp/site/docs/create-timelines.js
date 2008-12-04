var timelines = [];
function createBandInfos() {
    return [
        Timeline.createBandInfo({
            width:          "70%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100
        }),
        Timeline.createBandInfo({
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200
        })
    ];
}
function createBandInfos2(eventSource) {
    var bandInfos = [
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "70%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100,
            eventSource:    eventSource
        }),
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200,
            eventSource:    eventSource,
            overview:       true
        })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function createBandInfos3(eventSource) {
    var bandInfos = [
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "70%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100,
            eventSource:    eventSource
        }),
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200,
            showEventText:  false, 
            trackHeight:    0.5,
            trackGap:       0.2,
            eventSource:    eventSource,
            overview:       true
        })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function createBandInfos4(eventSource) {
    var bandInfos = createBandInfos3(eventSource);
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function createBandInfos5(eventSource) {
    var bandInfos = [
        Timeline.createHotZoneBandInfo({
            timeZone:       -5,
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "70%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100,
            eventSource:    eventSource,
            zones: [
                {   start:    "Aug 01 2006 00:00:00 GMT-0500",
                    end:      "Sep 01 2006 00:00:00 GMT-0500",
                    magnify:  10,
                    unit:     Timeline.DateTime.WEEK
                },
                {   start:    "Aug 02 2006 00:00:00 GMT-0500",
                    end:      "Aug 04 2006 00:00:00 GMT-0500",
                    magnify:  7,
                    unit:     Timeline.DateTime.DAY
                },
                {   start:    "Aug 02 2006 06:00:00 GMT-0500",
                    end:      "Aug 02 2006 12:00:00 GMT-0500",
                    magnify:  5,
                    unit:     Timeline.DateTime.HOUR
                }
            ]
        }),
        Timeline.createBandInfo({
            timeZone:       -5,
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200,
            showEventText:  false, 
            trackHeight:    0.5,
            trackGap:       0.2,
            eventSource:    eventSource,
            overview:       true
        })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function createBandInfos6(eventSource) {
    var bandInfos = createBandInfos5(eventSource);
    bandInfos[1] = 
        Timeline.createHotZoneBandInfo({
            timeZone:       -5,
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200,
            showEventText:  false, 
            trackHeight:    0.5,
            trackGap:       0.2,
            eventSource:    eventSource,
            zones: [
                {   start:    "Aug 01 2006 00:00:00 GMT-0500",
                    end:      "Sep 01 2006 00:00:00 GMT-0500",
                    magnify:  20,
                    unit:     Timeline.DateTime.WEEK
                }
            ],
            overview:       true
        });
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function createBandInfos7(eventSource) {
    var bandInfos = [
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "70%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100,
            eventSource:    eventSource,
            zoomIndex:      10,
            zoomSteps:      new Array(
              {pixelsPerInterval: 280,  unit: Timeline.DateTime.HOUR},
              {pixelsPerInterval: 140,  unit: Timeline.DateTime.HOUR},
              {pixelsPerInterval:  70,  unit: Timeline.DateTime.HOUR},
              {pixelsPerInterval:  35,  unit: Timeline.DateTime.HOUR},
              {pixelsPerInterval: 400,  unit: Timeline.DateTime.DAY},
              {pixelsPerInterval: 200,  unit: Timeline.DateTime.DAY},
              {pixelsPerInterval: 100,  unit: Timeline.DateTime.DAY},
              {pixelsPerInterval:  50,  unit: Timeline.DateTime.DAY},
              {pixelsPerInterval: 400,  unit: Timeline.DateTime.MONTH},
              {pixelsPerInterval: 200,  unit: Timeline.DateTime.MONTH},
              {pixelsPerInterval: 100,  unit: Timeline.DateTime.MONTH}
            )            
        }),
        Timeline.createBandInfo({
            date:           "Jun 28 2006 00:00:00 GMT",
            width:          "30%", 
            intervalUnit:   Timeline.DateTime.YEAR, 
            intervalPixels: 200,
            showEventText:  false, 
            trackHeight:    0.5,
            trackGap:       0.2,
            eventSource:    eventSource,
            overview:       true
        })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    return bandInfos;
}
function onLoad() {
    var bandInfos0 = createBandInfos();
    timelines[0] = Timeline.create(document.getElementById("tl0"), bandInfos0);
        
    var bandInfos1 = createBandInfos();
    bandInfos1[1].syncWith = 0;
    bandInfos1[1].highlight = true;
    timelines[1] = Timeline.create(document.getElementById("tl1"), bandInfos1);
    
    var eventSource1 = new Timeline.DefaultEventSource();
    var eventSource2 = new Timeline.DefaultEventSource();
    
    var bandInfos2 = createBandInfos2(eventSource1);
    timelines[2] = Timeline.create(document.getElementById("tl2"), bandInfos2);
    
    var bandInfos3 = createBandInfos3(eventSource1);
    timelines[3] = Timeline.create(document.getElementById("tl3"), bandInfos3);
    
    var bandInfos4 = createBandInfos4(eventSource2);
    timelines[4] = Timeline.create(document.getElementById("tl4"), bandInfos4);
    
    var bandInfos5 = createBandInfos5(eventSource2);
    timelines[5] = Timeline.create(document.getElementById("tl5"), bandInfos5);
    
    var bandInfos6 = createBandInfos6(eventSource2);
    timelines[6] = Timeline.create(document.getElementById("tl6"), bandInfos6);
    
    var bandInfos7 = createBandInfos7(eventSource2);
    timelines[7] = Timeline.create(document.getElementById("tl7"), bandInfos7);
    
    Timeline.loadXML("example1.xml", 
        function(xml, url) { eventSource1.loadXML(xml, url); });
    Timeline.loadXML("example2.xml", 
        function(xml, url) { eventSource2.loadXML(xml, url); });
}

var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            for (var i = 0; i < timelines.length; i++) {
                timelines[i].layout();
            }
        }, 500);
    }
}
