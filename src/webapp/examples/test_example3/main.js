require(["require", "../../api/local-config"], function(require, config) {
    require(["timeline-api", "../examples.js"],
    function(Timeline) {
        var tl;

            //in php you can get this 1so8601 date using date("c",$you_date_variable);
            var startProj = SimileAjax.DateTime.parseIso8601DateTime("2009-03-10T00:00:00");
            var endProj = SimileAjax.DateTime.parseIso8601DateTime("2009-04-30T00:00:00");
            
            var event_data = 
              {
              "dateTimeFormat": "iso8601",
              "events":[
                        {     "start": "2009-03-10T06:00:00+00:00",
                                "end": "2009-03-31T22:00:00+00:00",
                            "instant": false,
                              "title": "1",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                            "caption": "1",
                           "trackNum": 1,
                          "classname": "special_event2 aquamarine",
                        "description": "bar 1"},
                                       
                             {"start": "2009-03-10T08:00:00+00:00",
                                "end": "2009-03-17T20:00:00+00:00",
                            "instant": false,
                              "title": "1.1",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 2,
                        "description": "bar 1.1"},
                                                      
                             {"start": "2009-03-12T10:00:00+00:00",
                                "end": "2009-03-13T17:00:00+00:00",
                            "instant": false,
                              "title": "1.1.1",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 3,
                        "description": "bar 1.1.1"},
                                                      
                             {"start": "2009-03-14T10:00:00+00:00",
                                "end": "2009-03-16T17:00:00+00:00",
                            "instant": false,
                              "title": "1.1.2",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 4,
                        "description": "bar 1.1.2"},
                                                      
                             {"start": "2009-03-17T10:00:00+00:00",
                                "end": "2009-03-17T17:00:00+00:00",
                            "instant": false,
                              "title": "1.1.3",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 5,
                        "description": "bar 1.1.3"},
                                                      
                             {"start": "2009-03-15T08:00:00+00:00",
                                "end": "2009-03-18T20:00:00+00:00",
                            "instant": false,
                              "title": "1.2",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 6,
                          "classname": "special_event2",
                        "description": "bar 1.2"},
                                                      
                             {"start": "2009-03-15T10:00:00+00:00",
                                "end": "2009-03-18T17:00:00+00:00",
                            "instant": false,
                              "title": "1.2.1",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 7,
                          "classname": "backimage",
                        "description": "bar 1.2.1"},
                                                    
                             {"start": "2009-03-16T10:00:00+00:00",
                                "end": "2009-03-17T17:00:00+00:00",
                            "instant": false,
                              "title": "1.2.2",
                              "color": "#7FFFD4",
                          "textColor": "#000000",
                           "trackNum": 8,
                        "description": "bar 1.2.2"},
                                                    
                             {"start": "2009-04-01T06:00:00+00:00",
                                "end": "2009-04-20T22:00:00+00:00",
                            "instant": false,
                              "title": "2",
                              "color": "#000000",
                          "textColor": "#000000",
                           "trackNum": 9,
                        "description": "bar 2"},
                                                     
                             {"start": "2009-03-10T06:00:00+00:00",
                                "end": "2009-03-12T20:00:00+00:00",
                            "instant": false,
                              "title": "3",
                          "textColor": "#000000",
                           "trackNum": 10,
                          "classname": "dashed aquamarine",
                        "description": "bar 3"},
                                                
                             {"start": "2009-03-11T10:00:00+00:00",
                                "end": "2009-03-12T17:00:00+00:00",
                            "instant": false,
                              "title": "3.1",
                          "textColor": "#000000",
                           "trackNum": 11,
                          "classname": "dotted brown",
                        "description": "bar 3.1"}
                     ]
              };

                var tl_el = document.getElementById("tl");
                var eventSource = new Timeline.DefaultEventSource();
                var theme = Timeline.ClassicTheme.create();
                theme.autoWidth = false; // Set the Timeline's "width" automatically.
                theme.autoWidthMargin=10;
                theme.event.bubble.width = 220;
                theme.event.bubble.height = 120;

                theme.ether.backgroundColors = ["#E6E6E6","#F7F7F7"];

                theme.timeline_start = startProj;
                theme.timeline_stop  = endProj;

                theme.event.track.height = "20";
                theme.event.tape.height = 10; // px
                theme.event.track.height = theme.event.tape.height + 6;

                var d = SimileAjax.DateTime.parseIso8601DateTime("2009-03-15T00:00:00");
                var bandInfos = [

                    Timeline.createBandInfo({
                        layout:         'original',// original, overview, detailed
                        eventSource:    eventSource,
                        date:           d,
                        width:          350,
                        intervalUnit:   Timeline.DateTime.DAY,
                        intervalPixels: 100,
                        //trackHeight: 10,
                        theme :theme

                    }),
                    Timeline.createBandInfo({
                        layout:         'overview',
                        date:           d,
                        trackHeight:    0.5,
                        trackGap:       0.2,
                        eventSource:    eventSource,
                        width:          50,
                        intervalUnit:   Timeline.DateTime.MONTH,
                        //    showEventText:  false,
                        intervalPixels: 200,
                        theme :theme
                    })

                ];

                bandInfos[1].highlight = true;
                bandInfos[1].syncWith = 0;



                bandInfos[1].decorators = [
                    new Timeline.SpanHighlightDecorator({
                        startDate:  startProj,
                        endDate:    endProj,
                        inFront:    false,
                        color:      "#FFC080",
                        opacity:    30,
                        startLabel: "Begin",
                        endLabel:   "End",
                        theme:      theme
                    })
                ];


                tl = Timeline.create(tl_el, bandInfos, Timeline.HORIZONTAL);
                // show loading message
                tl.showLoadingMessage();

                eventSource.loadJSON(event_data, document.location.href);

                // dismiss loading message
                tl.hideLoadingMessage();

                // setup highlight filters
                setupFilterHighlightControls(document.getElementById("controls"), tl, [0,1], theme);


            window.centerProjStart = function() {
                tl.getBand(1).setCenterVisibleDate(startProj);
            };
            
            window.centerProjEnd = function() {
                tl.getBand(1).setCenterVisibleDate(endProj);
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
