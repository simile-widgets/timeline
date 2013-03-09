require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api"],
    function(Timeline) {
        var tl;
        
          var eventSource = new Timeline.DefaultEventSource(0);
          
          var theme = Timeline.ClassicTheme.create();
          theme.event.instant.iconWidth += 4; // Add padding and borders
          theme.event.instant.iconHeight += 4;
          
          var d = Timeline.DateTime.parseGregorianDateTime("1900")
          var bandInfos = [
              Timeline.createBandInfo({
                  width:          "90%", 
                  intervalUnit:   Timeline.DateTime.DECADE, 
                  intervalPixels: 150,
                  eventSource:    eventSource,
                  date:           d,
                  theme:          theme,
                  eventPainter:   Timeline.CompactEventPainter,
                  eventPainterParams: {
                      iconWidth:      60,
                      iconHeight:     60,
                      iconLabelGap:   3
                  }
              }),
              Timeline.createBandInfo({
                  width:          "10%", 
                  intervalUnit:   Timeline.DateTime.CENTURY, 
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
          tl.loadJSON("data2.json?"+ (new Date().getTime()), function(json, url) { eventSource.loadJSON(json, url); });

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