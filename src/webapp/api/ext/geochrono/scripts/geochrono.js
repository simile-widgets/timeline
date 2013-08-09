/*==================================================
 *  Geochrono
 *==================================================
 */
define([
    "../../../scripts/timeline-base",
    "../../../scripts/linear-ether",
    "../../../scripts/overview-painter",
    "../../../scripts/detailed-painter",
    "./timespans",
    "./units",
    "./ether-painters",
    "./labellers"
], function(Timeline, LinearEther, OverviewEventPainter, DetailedEventPainter, Timespans, GeochronoUnit, GeochronoEtherPainter, GeochronoLabeller) {
var Geochrono = new Object();

    Geochrono.eons = GeochronoLabeller.eons;
    Geochrono.eras = GeochronoLabeller.eras;
    Geochrono.periods = GeochronoLabeller.periods;
    Geochrono.epochs = GeochronoLabeller.epochs;
    Geochrono.epoches = Geochrono.epochs; // compatibility
    Geochrono.ages = GeochronoLabeller.ages;
    Geochrono.Unit = GeochronoUnit;

Geochrono.createBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();
    
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
    var ether = new LinearEther({ 
        centersOn:          ("date" in params) ? params.date : GeochronoUnit.makeDefaultValue(),
        interval:           1,
        pixelsPerInterval:  params.intervalPixels
    });
    
    var etherPainter = new GeochronoEtherPainter({
        intervalUnit:       params.intervalUnit, 
        multiple:           ("multiple" in params) ? params.multiple : 1,
        align:              params.align,
        theme:              theme 
    });
    
    var eventPainterParams = {
        theme:      theme
    };
    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }
    var eventPainter = ("overview" in params && params.overview) ?
        new OverviewEventPainter(eventPainterParams) :
        new DetailedEventPainter(eventPainterParams);
    
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter
    };
};

    return Geochrono;
});
