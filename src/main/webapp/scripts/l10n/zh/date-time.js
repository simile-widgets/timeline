/*==================================================
 *  Localization of util/date-time.js
 *==================================================
 */

Timeline.DateTime.gregorianMonthNames["zh"] = [
    "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"
];

Timeline.DateTime.labelIntervalFunctions["zh"] = function(date, intervalUnit, locale, timeZone) {
    var text;
    var emphasized = false;
    
    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, timeZone);
    
    switch(intervalUnit) {
    case Timeline.DateTime.DAY:
    case Timeline.DateTime.WEEK:
        text = Timeline.DateTime.getGregorianMonthName(date2.getUTCMonth(), locale) + date2.getUTCDate() + "日";
        break;
    default:
        return Timeline.DateTime.defaultLabelInterval(date, intervalUnit, locale, timeZone);
    }
    
    return { text: text, emphasized: emphasized };
};