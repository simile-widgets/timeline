/*==================================================
 *  Geochrono
 *==================================================
 */

Timeline.Geochrono = new Object();

Timeline.Geochrono.eons = [
];

Timeline.Geochrono.eras = [
    {   name:    "Eoarchean",
        start:   3800
    },
    {   name:    "Paleoarchean",
        start:   3600
    },
    {   name:    "Mesoarchean",
        start:   3200
    },
    {   name:    "Neoarchean",
        start:   2800
    },
    {   name:    "Paleoproterozoic",
        start:   2500
    },
    {   name:    "Mesoproterozoic",
        start:   1600
    },
    {   name:    "Neoproterozoic",
        start:   1000
    },
    {   name:    "Paleozoic",
        start:   542
    },
    {   name:    "Mesozoic",
        start:   252
    },
    {   name:    "Cenozoic",
        start:   66
    }
];

Timeline.Geochrono.periods = [
    {   name:    "Ediacaran",
        start:   630
    },
    {   name:    "Cambrian",
        start:   542
    },
    {   name:    "Ordovician",
        start:   488
    },
    {   name:    "Silurian",
        start:   444
    },
    {   name:    "Devonian",
        start:   416
    },
    {   name:    "Carboniferous",
        start:   359
    },
    {   name:    "Permian",
        start:   300
    },
    {   name:    "Triassic",
        start:   251
    },
    {   name:    "Jurassic",
        start:   200
    },
    {   name:    "Cretacous",
        start:   145.5
    },
    {   name:    "Paleogene",
        start:   65.5
    },
    {   name:    "Neogene",
        start:   23.0
    }
];

Timeline.Geochrono.epoches = [
];

Timeline.Geochrono.ages = [
];


Timeline.Geochrono.createBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();
    
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
    var ether = new Timeline.LinearEther({ 
        centersOn:          ("date" in params) ? params.date : Timeline.GeochronoUnit.makeDefaultValue(),
        interval:           1,
        pixelsPerInterval:  params.intervalPixels
    });
    
    var etherPainter = new Timeline.GeochronoEtherPainter({
        intervalUnit:       params.intervalUnit, 
        multiple:           ("multiple" in params) ? params.multiple : 1,
        theme:              theme 
    });
    
    var layout = new Timeline.StaticTrackBasedLayout({
        eventSource:    eventSource,
        ether:          ether,
        showText:       ("showEventText" in params) ? params.showEventText : true,
        theme:          theme
    });
    
    var eventPainterParams = {
        showText:   ("showEventText" in params) ? params.showEventText : true,
        layout:     layout,
        theme:      theme
    };
    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }
    var eventPainter = new Timeline.DurationEventPainter(eventPainterParams);
    
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter
    };
};