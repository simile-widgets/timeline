/*==================================================
 *  Planning
 *==================================================
 */

<<<<<<< HEAD
Timeline.Planning = new Object();

Timeline.Planning.createBandInfo = function(params) {
=======
define([
    "../../../scripts/timeline-base",
    "../../../scripts/linear-ether",
    "../../../scripts/overview-painter",
    "../../../scripts/detailed-painter",
    "./units",
    "./ether-painters"
], function(Timeline, LinearEther, OverviewPainter, DetailedPainter, PlanningUnit, PlanningEtherPainter) {
var Planning = new Object();

Planning.createBandInfo = function(params) {
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();
    
    var eventSource = ("eventSource" in params) ? params.eventSource : null;
    
<<<<<<< HEAD
    var ether = new Timeline.LinearEther({ 
        centersOn:          ("date" in params) ? params.date : Timeline.PlanningUnit.makeDefaultValue(),
=======
    var ether = new LinearEther({ 
        centersOn:          ("date" in params) ? params.date : PlanningUnit.makeDefaultValue(),
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
        interval:           1,
        pixelsPerInterval:  params.intervalPixels
    });
    
<<<<<<< HEAD
    var etherPainter = new Timeline.PlanningEtherPainter({
=======
    var etherPainter = new PlanningEtherPainter({
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
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
<<<<<<< HEAD
        new Timeline.OverviewEventPainter(eventPainterParams) :
        new Timeline.DetailedEventPainter(eventPainterParams);
=======
        new OverviewEventPainter(eventPainterParams) :
        new DetailedEventPainter(eventPainterParams);
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
    
    return {   
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter
    };
<<<<<<< HEAD
};
=======
};

    return Planning;
});
>>>>>>> d280ccdd141023d4ce634db7280d2108f103046e
