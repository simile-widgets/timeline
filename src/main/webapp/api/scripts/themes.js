/*==================================================
 *  Classic Theme
 *==================================================
 */


Timeline.ClassicTheme = new Object();

Timeline.ClassicTheme.implementations = [];

Timeline.ClassicTheme.create = function(locale) {
    var f = Timeline.ClassicTheme.implementations[locale];
    if (f == null) {
        f = Timeline.ClassicTheme._Impl;
    }
    return new f();
};

Timeline.ClassicTheme._Impl = function() {
    this.ether = {
        backgroundColors: [
            "#EEE",
            "#DDD",
            "#CCC",
            "#AAA"
        ],
        highlightColor:     "white",
        highlightOpacity:   50,
        interval: {
            line: {
                show:       true,
                color:      "white",
                opacity:    100
            },
            marker: {
                hAlign:     "Bottom",
                hBottomStyle:
                    "width: 5em; height: 1.5em; border-left: 1px solid #aaa; padding-left: 2px",
                hBottomEmphasizedStyle:
                    "width: 5em; height: 2em; border-left: 1px solid #aaa; padding-left: 2px; font-weight: bold",
                hTopStyle:
                    "width: 5em; height: 1.5em; border-left: 1px solid #aaa; padding-left: 2px",
                hTopEmphasizedStyle:
                    "width: 5em; height: 4em; border-left: 1px solid #aaa; padding-left: 2px; font-weight: bold",
                    
                vAlign:     "Right",
                vRightStyle:
                    "width: 5em; height: 1.5em; border-top: 1px solid #aaa",
                vRightEmphasizedStyle:
                    "width: 7em; height: 1.5em; border-top: 1px solid #aaa; font-weight: bold",
                vLeftStyle:
                    "width: 5em; height: 1.5em; border-top: 1px solid #aaa",
                vLeftEmphasizedStyle:
                    "width: 7em; height: 1.5em; border-top: 1px solid #aaa; font-weight: bold"
            }
        }
    };
    
    this.event = {
        instantIcon:        Timeline.urlPrefix + "images/red-pin.png",
        instantLineColor:   "red",
        spanColor:          "#2080D0",
        spanOpacity:        100,
        insideLabelColor:   "white",
        outsideLabelColor:  "black",
        labelLength:        "20em"
    };
};