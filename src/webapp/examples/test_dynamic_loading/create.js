var tl;

function createTimeline() {
    Timeline.writeVersion('tl_ver');
    
    var eventSource = new Timeline.DefaultEventSource(0);
    
    var theme = Timeline.ClassicTheme.create();
    theme.event.instant.icon = "no-image-40.png";
    theme.event.instant.iconWidth = 40;  // These are for the default stand-alone icon
    theme.event.instant.iconHeight = 40;
    
    var d = Timeline.DateTime.parseIso8601DateTime("2001-06-10");
    
    var bandInfos = [
        Timeline.createBandInfo({
            width:          "90%", 
            intervalUnit:   Timeline.DateTime.WEEK, 
            intervalPixels: 150,
            eventSource:    eventSource,
            date:           d,
            theme:          theme,
            eventPainter:   Timeline.CompactEventPainter,
            eventPainterParams: {
                iconLabelGap:     5,
                labelRightMargin: 20,
                
                iconWidth:        80, // These are for per-event custom icons
                iconHeight:       80,
                
                stackConcurrentPreciseInstantEvents: {
                    limit: 5,
                    moreMessageTemplate:    "%0 More Events",
                    icon:                   "no-image-80.png", // default icon in stacks
                    iconWidth:              80,
                    iconHeight:             80
                }
            }
        }),
        Timeline.createBandInfo({
            width:          "10%", 
            intervalUnit:   Timeline.DateTime.MONTH, 
            intervalPixels: 100,
            eventSource:    eventSource,
            date:           d,
            theme:          theme,
            layout:         'overview'  // original, overview, detailed
        })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    
    tl = Timeline.create(document.getElementById("tl"), bandInfos, Timeline.HORIZONTAL);
    tl.loadJSON("data.json?"+ (new Date().getTime()), function(json, url) { eventSource.loadJSON(json, url); });
}

var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            tl.layout();
        }, 500);
    }
}
