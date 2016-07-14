/*=================================================
 *
 * Coding standards:
 *
 * We aim towards Douglas Crockford's Javascript conventions.
 * See:  http://javascript.crockford.com/code.html
 * See also: http://www.crockford.com/javascript/javascript.html
 *
 * That said, this JS code was written before some recent JS
 * support libraries became widely used or available.
 * In particular, the _ character is used to indicate a class function or
 * variable that should be considered private to the class.
 *
 * The code mostly uses accessor methods for getting/setting the private
 * class variables.
 *
 * Over time, we'd like to formalize the convention by using support libraries
 * which enforce privacy in objects.
 *
 * We also want to use jslint:  http://www.jslint.com/
 *
 *
 *==================================================
 */



/*==================================================
 *  Timeline VERSION     
 *==================================================
 */

/*==================================================
 *  Timeline
 *==================================================
 */
define([
    "simile-ajax",
    "./timeline-base",
    "./timeline-impl",
    "./linear-ether",
    "./gregorian-ether-painter",
    "./hot-zone-gregorian-ether-painter",
    "./overview-painter",
    "./detailed-painter",
    "./original-painter",
    "./hot-zone-ether",
    "./themes"
], function(SimileAjax, Timeline, TimelineImpl, LinearEther, GregorianEtherPainter, HotZoneGregorianEtherPainter, OverviewEventPainter, DetailedEventPainter, OriginalEventPainter, HotZoneEther, ClassicTheme) {
    Timeline.getDefaultLocale = function() {
        return Timeline.clientLocale;
    };

    Timeline.getTimelineFromID = function(timelineID) {
        return Timeline.timelines[timelineID];
    };

Timeline.create = function(elmt, bandInfos, orientation, unit) {
    if (Timeline.timelines == null) {
        Timeline.timelines = [];
        // Timeline.timelines array can have null members--Timelines that
        // once existed on the page, but were later disposed of.
    }
    
    var timelineID = Timeline.timelines.length;
    Timeline.timelines[timelineID] = null; // placeholder until we have the object
    var new_tl = new TimelineImpl(elmt, bandInfos, orientation, unit,
      timelineID);
    Timeline.timelines[timelineID] = new_tl;    
    return new_tl;
};

Timeline.createBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();

    var decorators = ("decorators" in params) ? params.decorators : [];
        
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
    var ether = new LinearEther({ 
        centersOn:          ("date" in params) ? params.date : new Date(),
        interval:           SimileAjax.DateTime.gregorianUnitLengths[params.intervalUnit],
        pixelsPerInterval:  params.intervalPixels,
        theme:              theme
    });
    
    var etherPainter = new GregorianEtherPainter({
        unit:       params.intervalUnit, 
        multiple:   ("multiple" in params) ? params.multiple : 1,
        theme:      theme,
        align:      ("align" in params) ? params.align : undefined
    });
    
    var eventPainterParams = {
        showText:   ("showEventText" in params) ? params.showEventText : true,
        theme:      theme
    };
    // pass in custom parameters for the event painter
    if ("eventPainterParams" in params) {
        for (var prop in params.eventPainterParams) {
            eventPainterParams[prop] = params.eventPainterParams[prop];
        }
    }
    
    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }
    
    var layout = ("overview" in params && params.overview) ? "overview" : ("layout" in params ? params.layout : "original");
    var eventPainter;
    if ("eventPainter" in params) {
        eventPainter = new params.eventPainter(eventPainterParams);
    } else {
        switch (layout) {
            case "overview" :
                eventPainter = new OverviewEventPainter(eventPainterParams);
                break;
            case "detailed" :
                eventPainter = new DetailedEventPainter(eventPainterParams);
                break;
            default:
                eventPainter = new OriginalEventPainter(eventPainterParams);
        }
    }
    
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter,
        theme:          theme,
        decorators:     decorators,
        zoomIndex:      ("zoomIndex" in params) ? params.zoomIndex : 0,
        zoomSteps:      ("zoomSteps" in params) ? params.zoomSteps : null
    };
};

Timeline.createHotZoneBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();
    
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
    var ether = new HotZoneEther({ 
        centersOn:          ("date" in params) ? params.date : new Date(),
        interval:           SimileAjax.DateTime.gregorianUnitLengths[params.intervalUnit],
        pixelsPerInterval:  params.intervalPixels,
        zones:              params.zones,
        theme:              theme
    });
    
    var etherPainter = new HotZoneGregorianEtherPainter({
        unit:       params.intervalUnit, 
        zones:      params.zones,
        theme:      theme,
        align:      ("align" in params) ? params.align : undefined
    });
    
    var eventPainterParams = {
        showText:   ("showEventText" in params) ? params.showEventText : true,
        theme:      theme
    };
    // pass in custom parameters for the event painter
    if ("eventPainterParams" in params) {
        for (var prop in params.eventPainterParams) {
            eventPainterParams[prop] = params.eventPainterParams[prop];
        }
    }
    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }
    
    var layout = ("overview" in params && params.overview) ? "overview" : ("layout" in params ? params.layout : "original");
    var eventPainter;
    if ("eventPainter" in params) {
        eventPainter = new params.eventPainter(eventPainterParams);
    } else {
        switch (layout) {
            case "overview" :
                eventPainter = new OverviewEventPainter(eventPainterParams);
                break;
            case "detailed" :
                eventPainter = new DetailedEventPainter(eventPainterParams);
                break;
            default:
                eventPainter = new OriginalEventPainter(eventPainterParams);
        }
    }   
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter,
        theme:          theme,
        zoomIndex:      ("zoomIndex" in params) ? params.zoomIndex : 0,
        zoomSteps:      ("zoomSteps" in params) ? params.zoomSteps : null
    };
};

Timeline.getDefaultTheme = function() {
    if (Timeline._defaultTheme == null) {
        Timeline._defaultTheme = ClassicTheme.create(Timeline.getDefaultLocale());
    }
    return Timeline._defaultTheme;
};

Timeline.setDefaultTheme = function(theme) {
    Timeline._defaultTheme = theme;
};

Timeline.loadXML = function(url, f) {
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load data xml from " + url + "\n" + statusText);
    };
    var fDone = function(xmlhttp) {
        var xml = xmlhttp.responseXML;
        if (!xml.documentElement && xmlhttp.responseStream) {
            xml.load(xmlhttp.responseStream);
        } 
        f(xml, url);
    };
    SimileAjax.XmlHttp.get(url, fError, fDone);
};


Timeline.loadJSON = function(url, f) {
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load json data from " + url + "\n" + statusText);
    };
    var fDone = function(xmlhttp) {
        f(eval('(' + xmlhttp.responseText + ')'), url);
    };
    SimileAjax.XmlHttp.get(url, fError, fDone);
};

// Write the current Timeline version as the contents of element with id el_id
Timeline.writeVersion = function(el_id) {
  document.getElementById(el_id).innerHTML = this.display_version;    
};
      
    return Timeline;
});
