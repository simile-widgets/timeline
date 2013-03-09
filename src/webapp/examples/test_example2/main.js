require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api"],
    function(Timeline) {
        var tl;

            var tl_el = document.getElementById("tl");
            var eventSource1 = new Timeline.DefaultEventSource();
            var eventSource2 = new Timeline.DefaultEventSource();
            
            var theme1 = Timeline.ClassicTheme.create();
            theme1.autoWidth = true; // Set the Timeline's "width" automatically.
                                     // Set autoWidth on the Timeline's first band's theme,
                                     // will affect all bands.
            theme1.timeline_start = new Date(Date.UTC(1850, 0, 1));
            theme1.timeline_stop  = new Date(Date.UTC(4480, 0, 1));
            
            // create a second theme for the second band because we want it to
            // have different settings
            var theme2 = Timeline.ClassicTheme.create();
            // increase tape height
            theme2.event.tape.height = 6; // px
            theme2.event.track.height = theme2.event.tape.height + 6;

            var d = Timeline.DateTime.parseGregorianDateTime("1900")
            var bandInfos = [
                Timeline.createBandInfo({
                    width:          145, // set to a minimum, autoWidth will then adjust
                    intervalUnit:   Timeline.DateTime.DECADE, 
                    intervalPixels: 200,
                    eventSource:    eventSource1,
                    date:           d,
                    theme:          theme1,
                    layout:         'original'  // original, overview, detailed
                }),
                Timeline.createBandInfo({
                    width:          45, // set to a minimum, autoWidth will then adjust
                    intervalUnit:   Timeline.DateTime.DECADE, 
                    intervalPixels: 40,
                    eventSource:    eventSource2,
                    date:           d,
                    theme:          theme2,
                    layout:         'original'  // original, overview, detailed
                }),
                Timeline.createBandInfo({
                    width:          25, // set to a minimum, autoWidth will then adjust
                    intervalUnit:   Timeline.DateTime.CENTURY, 
                    intervalPixels: 50,
                    eventSource:    eventSource2,
                    date:           d,
                    theme:          theme2,
                    layout:         'overview',  // original, overview, detailed
                    syncWith:       0,
                    highlight:      true
                })
            ];
            bandInfos[1].syncWith = 0;
            bandInfos[2].syncWith = 0;
            bandInfos[2].highlight = true;
            
            // For each of the bands, add a decorator at the start and end 
            // of the Timeline. The decorators have to extend quite a way into
            // the past and future since those times can be visible on the
            // low resolution band (the third band)
            for (var i = 0; i < bandInfos.length; i++) {
                bandInfos[i].decorators = [
                    new Timeline.SpanHighlightDecorator({
                        startDate:  "1", // The year 1 Common Era
                        endDate:    new Date(Date.UTC(1850, 0, 1)),
                        cssClass:   "timeline-ether-bg", // use same color as background
                        inFront:    true, // we want this decorator to be in front
                        theme:      theme1
                    }),
                    new Timeline.SpanHighlightDecorator({
                        startDate:  "Fri Jan 1 4480 00:00:00 GMT",
                        endDate:    "Fri Jan 1 8000 00:00:00 GMT",
                        cssClass:   "timeline-ether-bg",
                        inFront:    true, // we want this decorator to be in front
                        theme:      theme1
                    })
                ];
            }
            // Nota bena: The JS Date function interprets years of < 100 as 
            // being years since 1900. So Date(0, 0, 1) is the same as Date(1900, 0, 1)
                                    
            // Asynchronous Callback functions. Called after data arrives.
            function load_json1(json, url) {
              // Called with first json file from server
              // Also initiates loading of second Band
              
              eventSource1.loadJSON(json, url);
              // stop browser caching of data during testing by appending time
              tl.loadJSON("cubism2.js?"+ (new Date().getTime()), load_json2);
            };

            function load_json2(json, url) {
              // Called with second json file from server
              eventSource2.loadJSON(json, url);
              // Also (now that all events have been loaded), automatically re-size
              tl.finishedEventLoading(); // Automatically set new size of the div 
            };
            
            
            // create the Timeline
            // Strategy: Initiate Ajax call for first band's data, then have its callback
            // initiate Ajax call for second band's data. Then have its callback 
            // automagically resize the overall Timeline since we will then have all
            // the data.
            tl = Timeline.create(tl_el, bandInfos, Timeline.HORIZONTAL);
            
            // stop browser caching of data during testing by appending time
            tl.loadJSON("cubism1.js?"+ (new Date().getTime()), load_json1);

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
