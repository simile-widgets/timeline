/*==================================================
 *
 *              Timeline API
 *              ------------
 *
 * This file will load all the Javascript files
 * necessary to make the standard timeline work.
 * It also detects the default locale.
 *
 * To run Timeline directly from the www.simile-widgets.org server
 * include this fragment in your HTML file as follows:
 *
 *   <script src="http://api.simile-widgets.org/timeline/2.3.1/timeline-api.js" 
 *    type="text/javascript"></script>
 *
 *
 * You can set the following global js variable used to send parameters to this script:
 *     var Timeline_urlPrefix -- URL for the *directory* that contains timeline-api.js 
 *                               on your web site (including the trailing slash!)
 *     Timeline_ajax_url is *deprecated* - the library is either included in
 *     the bundle or you'll be setting it through RequireJS.
 *      
 * eg your HTML page would include
 *
 *   <script>
 *     var Timeline_urlPrefix='http://YOUR_SERVER/apis/timeline/';       
 *   </script>
 *   <script src="http://YOUR_SERVER/javascripts/timeline/timeline-api.js"    
 *     type="text/javascript">
 *   </script>
 *
 * SCRIPT PARAMETERS
 *
 * To set parameters explicity, set js global variable Timeline_parameters or include as
 * parameters on the url using GET style. Eg the two next lines pass the same parameters:
 *     Timeline_parameters='bundle=true';                    // pass parameter via js variable
 *     <script src="http://....timeline-api.js?bundle=true"  // pass parameter via url
 * 
 * Parameters 
 *   bundle -- true: use the single js bundle file; false: load individual files (for debugging)
 * 
 * DEBUGGING
 *
 * If you have a problem with Timeline, use the RequireJS development version.
 * Bundled files are not appropriate for debugging.  See the README.md for how
 * to use RequireJS.
 *
 *================================================== 
 */

define([
    "./lib/domReady",
    "simile-ajax",
    "./scripts/timeline",
    "./scripts/timeline-impl",
    "./scripts/event-utils",
    "./scripts/labellers",
    "./scripts/themes",
    "./scripts/span-decorator",
    "./scripts/point-decorator",
    "./scripts/overview-painter",
    "./scripts/hot-zone-ether",
    "./scripts/linear-ether",
    "./scripts/sources",
    "./scripts/detailed-painter",
    "./scripts/compact-painter",
    "./scripts/ether-highlight",
    "./scripts/ether-interval-marker-layout",
    "./scripts/gregorian-ether-painter",
    "./scripts/hot-zone-gregorian-ether-painter",
    "./scripts/quarterly-ether-painter",
    "./scripts/year-count-ether-painter",
    "./scripts/original-painter",
    "./scripts/band"
], function(domReady, SimileAjax, Timeline, TimelineImpl, EventUtils, GregorianDateLabeller, ClassicTheme, SpanHighlightDecorator, PointHighlightDecorator, OverviewEventPainter, HotZoneEther, LinearEther, DefaultEventSource, DetailedEventPainter, CompactEventPainter, EtherHighlight, EtherIntervalMarkerLayout, GregorianEtherPainter, HotZoneGregorianEtherPainter, QuarterlyEtherPainter, YearCountEtherPainter, OriginalEventPainter, Band) {
    Timeline.DateTime = SimileAjax.DateTime;
    Timeline._Impl = TimelineImpl;
    Timeline.EventUtils = EventUtils;
    Timeline.GregorianDateLabeller = GregorianDateLabeller;
    Timeline.ClassicTheme = ClassicTheme;
    Timeline.SpanHighlightDecorator = SpanHighlightDecorator;
    Timeline.PointHighlightDecorator = PointHighlightDecorator;
    Timeline.OverviewEventPainter = OverviewEventPainter;
    Timeline.HotZoneEther = HotZoneEther;
    Timeline.LinearEther = LinearEther;
    Timeline.DefaultEventSource = DefaultEventSource;
    Timeline.DetailedEventPainter = DetailedEventPainter;
    Timeline.CompactEventPainter = CompactEventPainter;
    Timeline.EtherHighlight = EtherHighlight;
    Timeline.EtherIntervalMarkerLayout = EtherIntervalMarkerLayout;
    Timeline.GregorianEtherPainter = GregorianEtherPainter;
    Timeline.HotZoneGregorianEtherPainter = HotZoneGregorianEtherPainter;
    Timeline.QuarterlyEtherPainter = QuarterlyEtherPainter;
    Timeline.YearCountEtherPainter = YearCountEtherPainter;
    Timeline.OriginalEventPainter = OriginalEventPainter;
    Timeline._Band = Band;

    var handleDeprecated = function(parameter, explain) {
        var msg = parameter + " deprecated. " + explain;
        SimileAjax.Debug.warn(msg);
    };

    if (document.location.search.length > 0) {
        var params = document.location.search.substr(1).split("&");
        for (var i = 0; i < params.length; i++) {
            if (params[i] == "timeline-use-local-resources") {
                handleDeprecated("timeline-use-local-resources", "When bundled, Timeline does not need to use local resources.  For development, use RequireJS to locate local resources.");
            }
        }
    };

    Timeline.load = function() {
        var url = null;
        var cssFiles = ["main.css"];
        var bundledCssFile = "timeline-bundle.css";
        
        // ISO-639 language codes, ISO-3166 country codes (2 characters)
        var supportedLocales = [
            "cs",       // Czech
            "de",       // German
            "en",       // English
            "es",       // Spanish
            "fr",       // French
            "it",       // Italian
            "nl",       // Dutch (The Netherlands)
            "pl",       // Polish
            "ru",       // Russian
            "se",       // Swedish
            "tr",       // Turkish
            "vi",       // Vietnamese
            "zh"        // Chinese
        ];
        
        try {
            if (typeof Timeline_urlPrefix == "string") {
                Timeline.urlPrefix = Timeline_urlPrefix;
            } else {
                var targets = ["timeline-api.js", "timeline-bundle.js"];
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[i];
                    url = SimileAjax.findScript(document, target);
                    if (url !== null) {
                        Timeline.urlPrefix = url.substr(0, url.indexOf(target));
                        break;
                    }
                }
                if (url === null) {
                    throw new Error("Failed to derive URL prefix for Timeline API code files");
                    return;
                }
            }

            var params;
            if (typeof Timeline_parameters === "string") {
                params = SimileAjax.parseURLParameters("?" + Timeline_parameters, Timeline.params, Timeline.paramTypes);
            } else {
                params = SimileAjax.parseURLParameters(url, Timeline.params, Timeline.paramTypes);
            }

            if (Timeline.params.bundle) {
                SimileAjax.includeCssFile(document, Timeline.urlPrefix + "styles/" + bundledCssFile);
            } else {
                SimileAjax.includeCssFiles(document, Timeline.urlPrefix + "styles/", cssFiles);
            }

            var ajax = null;
            if (typeof Timeline_ajax_url === "string") {
                ajax = Timeline_ajax_url;
            } else if (params.ajax) {
                ajax = params.ajax
            } else {
                var current, base = null;
                var mount = "timeline";
                var targets = ["timeline-api.js", "timeline-bundle.js"];
                for (var t = 0; t < targets.length; t++) {
                    current = SimileAjax.findScript(document, targets[t]);
                    if (current !== null) {
                        base = current.substr(0, current.indexOf("/" + mount +"/"));
                        break;
                    }
                }
                if (base !== null) {
                    if (current.indexOf("/" + mount + "/api/") >= 0) {
                        ajax = base + "/ajax/api/";
                    } else {
                        ajax = base + "/ajax/" + SimileAjax.ajax_lib_version + "/";
                    }
                }
            }

            if (ajax !== null) {
                if (!SimileAjax.urlPrefix) {
                    SimileAjax.urlPrefix = ajax;
                }
                SimileAjax.loadCSS();
            }
            
            if (params.locales) {
                handleDeprecated("locales", "Timeline either includes all localizations when bundled or retrieves them at need, specifying them is unnecessary.  This performance shortcut is no longer available.");
            }

            if (params.forcedLocale) {
                handleDeprecated("forceLocale", "To test out a locale, use RequireJS and specify the locale in the i18n config settings.  This develpoment settings is no longer available.  If you must force one language, re-bundle Timeline with only that language included.");
            }

            if (params.defaultLocale) {
                handleDeprecated("defaultLocale", "Timeline either includes all localizations when bundled or retrieves them at need, specifying a baseline default is unnecessary.  This shortcut setting is no longer available.");
            }

            var tryExactLocale = function(locale) {
                for (var l = 0; l < supportedLocales.length; l++) {
                    if (locale == supportedLocales[l]) {
                        return true;
                    }
                }
                return false;
            }

            var tryLocale = function(locale) {
                if (tryExactLocale(locale)) {
                    return locale;
                }
                
                var dash = locale.indexOf("-");
                if (dash > 0 && tryExactLocale(locale.substr(0, dash))) {
                    return locale.substr(0, dash);
                }
                
                return null;
            }
            
            var defaultClientLocale = Timeline.params.defaultLocale;
            var defaultClientLocales = ("language" in navigator ? navigator.language : navigator.browserLanguage).split(";");
            for (var l = 0; l < defaultClientLocales.length; l++) {
                var locale = tryLocale(defaultClientLocales[l]);
                if (locale != null) {
                    defaultClientLocale = locale;
                    break;
                }
            }

            Timeline.clientLocale = defaultClientLocale;
        } catch (e) {
            SimileAjax.Debug.warn(e);
        }
    };
    
    domReady(Timeline.load);

    return Timeline;
});
