/*==================================================
 *  Classic Theme
 *==================================================
 */



Timeline.ClassicTheme = new Object();

Timeline.ClassicTheme.implementations = [];

Timeline.ClassicTheme.create = function(locale) {
    if (locale == null) {
        locale = Timeline.getDefaultLocale();
    }
    
    var f = Timeline.ClassicTheme.implementations[locale];
    if (f == null) {
        f = Timeline.ClassicTheme._Impl;
    }
    return new f();
};

Timeline.ClassicTheme._Impl = function() {
    this.firstDayOfWeek = 0; // Sunday
	
	  // Note: Many styles previously set here are now set using CSS
	  //       The comments indicate settings controlled by CSS, not
	  //       lines to be un-commented.
    this.ether = {
        backgroundColors: [
        //    "#EEE",
        //    "#DDD",
        //    "#CCC",
        //    "#AAA"
        ],
     //   highlightColor:     "white",
        highlightOpacity:   50,
        interval: {
            line: {
                show:       true,
                opacity:    25
               // color:      "#aaa",
            },
            weekend: {
                opacity:    30
              //  color:      "#FFFFE0",
            },
            marker: {
                hAlign:     "Bottom",
                vAlign:     "Right"
				/*
                hBottomStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom";
                },
                hBottomEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom-emphasized";
                },
                hTopStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top";
                },
                hTopEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top-emphasized";
                },
                */
				
                    
               /*
			    vRightStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right";
                },
                vRightEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right-emphasized";
                },
                vLeftStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-left";
                },
                vLeftEmphasizedStyler:function(elmt) {
                    elmt.className = "timeline-ether-marker-left-emphasized";
                }
                */
            }
        }
    };
    
    this.event = {
        track: {
            height:         10, // px
            gap:             2, // px
            autoWidthMargin: 1
            /* The autoWidthMargin setting is used to set how close the bottom of the
               lowest track is to the edge of the band's div. The units are total track
               width (tape + label + gap). A min of 0.5 is suggested. Use this setting to
               move the bottom track's tapes above the axis markers, if needed for your
               Timeline.
            */
        },
        overviewTrack: {
            offset:     20,     // px
            tickHeight: 6,      // px
            height:     2,      // px
            gap:        1,      // px
            autoWidthMargin: 15 // Min of 20 is needed due to width requirements of labels and spacing
        },
        tape: {
            height:         4 // px
        },
        instant: {
            icon:              Timeline.urlPrefix + "images/dull-blue-circle.png",
            iconWidth:         10,
            iconHeight:        10,
            impreciseOpacity:  20 // opacity of the bar when durationEvent is false
    //        color:             "#58A0DC",
    //        impreciseColor:    "#58A0DC",
        },
        duration: {
            impreciseOpacity: 20
      //      color:            "#58A0DC",
      //      impreciseColor:   "#58A0DC",
        },
        label: {
            backgroundOpacity: 50,
            offsetFromLine:    3 // px
      //      backgroundColor:   "white",
      //      lineColor:         "#58A0DC",
        },
        highlightColors: [
   //         "#FFFF00",
   //         "#FFC000",
   //         "#FF0000",
   //         "#0000FF"
        ],
        bubble: {
            width:          250, // px
            height:         125, // px
            titleStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-title";
            },
            bodyStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-body";
            },
            imageStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-image";
            },
            wikiStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-wiki";
            },
            timeStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-time";
            }
        }
    };
    
    this.mouseWheel = 'scroll'; // 'default', 'zoom', 'scroll'
};