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
 * To host the Timeline files on your own server:
 *
 * 1) Install the Timeline files onto your webserver using
 *    the minimal distribution "timeline_<version>_minimal.(zip|tar.gz)" found at
 *
 *        http://code.google.com/p/simile-widgets/downloads/list
 * 
 * 2) Set the following global js variable used to send parameters to this script:
 *     var Timeline_ajax_url  -- URL for simile-ajax-api.js
 *     var Timeline_urlPrefix -- URL for the *directory* that contains timeline-api.js 
 *                               on your web site (including the trailing slash!)
 *      
 * eg your HTML page would include
 *
 *   <script>
 *     var Timeline_ajax_url="http://YOUR_SERVER/apis/timeline/ajax/simile-ajax-api.js";
 *     var Timeline_urlPrefix='http://YOUR_SERVER/apis/timeline/';       
 *   </script>
 *   <script src="http://YOUR_SERVER/javascripts/timeline/timeline-api.js"    
 *     type="text/javascript">
 *   </script>
 *
 * SCRIPT PARAMETERS
 *
 * This script auto-magically figures out locale and has defaults for other parameters 
 * To set parameters explicity, set js global variable Timeline_parameters or include as
 * parameters on the url using GET style. Eg the two next lines pass the same parameters:
 *     Timeline_parameters='bundle=true';                    // pass parameter via js variable
 *     <script src="http://....timeline-api.js?bundle=true"  // pass parameter via url
 * 
 * Parameters 
 *   timeline-use-local-resources -- 
 *   bundle -- true: use the single js bundle file; false: load individual files (for debugging)
 *   locales -- 
 *   defaultLocale --
 *   forceLocale -- force locale to be a particular value--used for debugging. Normally locale is determined
 *                  by browser's and server's locale settings.
 * 
 * DEBUGGING
 *
 * If you have a problem with Timeline, the first step is to use the unbundled Javascript files. To do so:
 * To use the unbundled Timeline and Ajax libraries
 * Change
 *   <script src="http://api.simile-widgets.org/timeline/2.3.1/api/timeline-api.js?bundle=true" type="text/javascript"></script>
 * To
 *   <script>var Timeline_ajax_url = "http://api.simile-widgets.org/ajax/2.2.1/simile-ajax-api.js?bundle=false"</script>
 *   <script src="http://api.simile-widgets.org/timeline/2.3.1/api/timeline-api.js?bundle=false" type="text/javascript"></script>
 * 
 * Note that the Ajax version is usually NOT the same as the Timeline version.
 * See variable simile_ajax_ver below for the current version
 *
 *================================================== 
 */

define([
    "simile-ajax",
    "timeline",
    "event-utils",
    "labellers",
    "themes",
    "span-decorator",
    "point-decorator",
    "overview-painter",
    "hot-zone-ether",
    "linear-ether",
    "sources",
    "detailed-painter",
    "compact-painer",
    "ether-highlight",
    "ether-interval-marker-layout",
    "gregorian-ether-painter",
    "hot-zone-gregorian-ether-painter",
    "quarterly-ether-painter",
    "year-count-ether-painter",
    "original-event-painter",
    "band"
], function(SimileAjax, Timeline, EventUtils, GregorianDateLabeller, ClassicTheme, SpanHighlightDecorator, PointHighlightDecorator, OverviewEventPainter, HotZoneEther, LinearEther, DefaultEventSource, DetailedEventPainter, CompactEventPainter, EtherHighlight, EtherIntervalMarkerLayout, GregorianEtherPainter, HotZoneGregorianEtherPainter, QuarterlyEtherPainter, YearCountEtherPainter, OriginalEventPainter, Band) {
    Timeline.DateTime = SimileAjax.DateTime;
    Timeline.EventUtils = EventUtils;
    Timeline.GregorianDateLabeller = GregorianDateLabeller;
    Timeline.ClassicTheme = ClassicTheme;
    Timeline.SpanHighlightDecorator = SpanHighlightDecorator;
    Timeline.PointHighlightDecorator = PointHighlightDecorator;
    Timeilne.OverviewEventPainter = OverviewEventPainter;
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

    var useLocalResources = false;
    if (document.location.search.length > 0) {
        var params = document.location.search.substr(1).split("&");
        for (var i = 0; i < params.length; i++) {
            if (params[i] == "timeline-use-local-resources") {
                useLocalResources = true;
            }
        }
    };
    
    Timeline.load = function() {
        var cssFiles = [
            "timeline.css",
            "ethers.css",
            "events.css"
        ];
        
        var localizedCssFiles = [
        ];
        
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
            var desiredLocales = [ "en" ],
                defaultServerLocale = "en",
                forceLocale = null;
            
            var parseURLParameters = function(parameters) {
                var params = parameters.split("&");
                for (var p = 0; p < params.length; p++) {
                    var pair = params[p].split("=");
                    if (pair[0] == "locales") {
                        desiredLocales = desiredLocales.concat(pair[1].split(","));
                    } else if (pair[0] == "defaultLocale") {
                        defaultServerLocale = pair[1];
                    } else if (pair[0] == "forceLocale") {
                        forceLocale = pair[1];
                        desiredLocales = desiredLocales.concat(pair[1].split(","));                        
                    }
                }
            };
            
            (function() {
                if (typeof Timeline_urlPrefix == "string") {
                    Timeline.urlPrefix = Timeline_urlPrefix;
                    if (typeof Timeline_parameters == "string") {
                        parseURLParameters(Timeline_parameters);
                    }
                } else {
                    var heads = document.documentElement.getElementsByTagName("head");
                    for (var h = 0; h < heads.length; h++) {
                        var scripts = heads[h].getElementsByTagName("script");
                        for (var s = 0; s < scripts.length; s++) {
                            var url = scripts[s].src;
                            var i = url.indexOf("timeline-api.js");
                            if (i >= 0) {
                                Timeline.urlPrefix = url.substr(0, i);
                                var q = url.indexOf("?");
                                if (q > 0) {
                                    parseURLParameters(url.substr(q + 1));
                                }
                                return;
                            }
                        }
                    }
                    throw new Error("Failed to derive URL prefix for Timeline API code files");
                }
            })();
            
            var includeJavascriptFiles = function(urlPrefix, filenames) {
                SimileAjax.includeJavascriptFiles(document, urlPrefix, filenames);
            }
            var includeCssFiles = function(urlPrefix, filenames) {
                SimileAjax.includeCssFiles(document, urlPrefix, filenames);
            }
            
            /*
             *  Include non-localized files
             */
            includeCssFiles(Timeline.urlPrefix + "styles/", cssFiles);
            
            /*
             *  Include localized files
             */
            var loadLocale = [];
            loadLocale[defaultServerLocale] = true;
            
            var tryExactLocale = function(locale) {
                for (var l = 0; l < supportedLocales.length; l++) {
                    if (locale == supportedLocales[l]) {
                        loadLocale[locale] = true;
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
            
            for (var l = 0; l < desiredLocales.length; l++) {
                tryLocale(desiredLocales[l]);
            }
            
            var defaultClientLocale = defaultServerLocale;
            var defaultClientLocales = ("language" in navigator ? navigator.language : navigator.browserLanguage).split(";");
            for (var l = 0; l < defaultClientLocales.length; l++) {
                var locale = tryLocale(defaultClientLocales[l]);
                if (locale != null) {
                    defaultClientLocale = locale;
                    break;
                }
            }
            
            for (var l = 0; l < supportedLocales.length; l++) {
                var locale = supportedLocales[l];
                if (loadLocale[locale]) {
                    includeCssFiles(Timeline.urlPrefix + "styles/l10n/" + locale + "/", localizedCssFiles);
                }
            }
            
            if (forceLocale == null) {
              Timeline.serverLocale = defaultServerLocale;
              Timeline.clientLocale = defaultClientLocale;
            } else {
              Timeline.serverLocale = forceLocale;
              Timeline.clientLocale = forceLocale;
            }            	
        } catch (e) {
            alert(e);
        }
    };
    
    return Timeline;
});
