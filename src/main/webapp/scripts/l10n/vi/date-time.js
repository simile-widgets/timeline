/*==================================================
 *  Localization of util/date-time.js
 *==================================================
 */

Timeline.DateTime.gregorianMonthNames["vi"] = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

Timeline.DateTime.labelIntervalFunctions["vi"] = function(date, intervalUnit, locale, timeZone) {
    var text;
    var emphasized = false;
    
    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, timeZone);
    
    switch(intervalUnit) {
    case Timeline.DateTime.DAY:
    case Timeline.DateTime.WEEK:
        text = date2.getUTCDate() + "/" + (date2.getUTCMonth() + 1);
        break;
    default:
        return Timeline.DateTime.defaultLabelInterval(date, intervalUnit, locale, timeZone);
    }
    
    return { text: text, emphasized: emphasized };
};
