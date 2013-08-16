/* ==================================================
 *
 *              Timeline API
 *              ------------
 *
 * This is the base file for Timeline.  It handles front matter like
 * loading stylesheets.  In fact, that's all it really does besides
 * tie its supporting files together in a backwards-compatible fashion.
 *
 * To run Timeline directly from the www.simile-widgets.org server
 * include this fragment in your HTML file as follows:
 *
 * <script src="http://api.simile-widgets.org/timeline/x.x.x/timeline-api.js" 
 *    type="text/javascript"></script>
 *
 * where the 'x.x.x' is your preferred version.
 *
 * You can set the following global Javascript variable used to send parameters
 * to this script, though you should only use this as a last resort.  Globals
 * are evil; these are usually set automatically and correctly, so bother with
 * them only if chaos is attacking you from every side:
 *
 *     var Timeline_urlPrefix = ""; // URL for the *directory* that contains
 *                                  // timeline-api.js on your site; include
 *                                  // the trailing slash.
 *     var Timeline_ajax_url = "";  // URL for the *directory* that contains
 *                                  // simile-ajax-api.js on your site. Not
 *                                  // that it gets loaded here.  This is only
 *                                  // for SimileAjax stylesheets and images.
 *      
 * e.g., your HTML page would include:
 *
 *   <script>
 *     var Timeline_urlPrefix = "http://YOUR_SERVER/apis/timeline/api/";
 *     var Timeline_ajax_url = "http://YOUR_SERVER/apis/ajax/api/";
 *   </script>
 *   <script src="http://YOUR_SERVER/apis/timeline/api/timeline-api.js"
 *     type="text/javascript">
 *   </script>
 *
 *
 * Script Parameters
 * -----------------
 *
 * To set parameters explicity, you can provide parameters within the
 * script tag you use to include Timeline:
 *
 *  <script src="timeline-api.js?bundle=false&ajax=/ajax/"></script>
 *
 * If for some reason you can't use this method but you can set globals -
 * but remember what we established above: EVIL - you can also set the
 * parameters using the global variable:
 *
 * <script>
 *  var Timeline_parameters = "bundle=false&ajax=/ajax/";
 * </script>
 *
 * which is equivalent to the script tag.
 *
 * 
 * Available parameters:
 *
 *     bundle=(true|false) - whether the stylesheets are sent as one or many
 *
 *     ajax=<String> - the URL at which to find SimileAjax (for its CSS)
 *
 *
 * Debugging
 * ---------
 *
 * See the README.md in the root of this project for more, that's too much
 * to cover in head comments.  Suffice to say if you've resorted to reading
 * this far, good, but start somewhere else.
 *
 * ================================================== 
 */

define([
    "simile-ajax",
    "./scripts/timeline-core",
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
    "./scripts/band",
    "jquery",
    "module"
], function(SimileAjax, Timeline, TimelineImpl, EventUtils, GregorianDateLabeller, ClassicTheme, SpanHighlightDecorator, PointHighlightDecorator, OverviewEventPainter, HotZoneEther, LinearEther, DefaultEventSource, DetailedEventPainter, CompactEventPainter, EtherHighlight, EtherIntervalMarkerLayout, GregorianEtherPainter, HotZoneGregorianEtherPainter, QuarterlyEtherPainter, YearCountEtherPainter, OriginalEventPainter, Band, $, module) {
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
        if (Timeline.loaded) {
            return;
        } else {
            Timeline.loaded = true;
        }

        var ajax = null;
        var url = null;
        var conf = module.config();
        
        try {
            if (typeof Timeline_urlPrefix == "string") {
                Timeline.urlPrefix = Timeline_urlPrefix;
            } else if (conf.hasOwnProperty("prefix")) {
                Timeline.urlPrefix = conf.prefix;
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

            if (Timeline.urlPrefix.substr(-1) !== "/") {
                Timeline.urlPrefix += "/";
            }

            var params;
            if (typeof Timeline_parameters === "string") {
                params = SimileAjax.parseURLParameters("?" + Timeline_parameters, Timeline.params, Timeline.paramTypes);
            } else if (url !== null) {
                params = SimileAjax.parseURLParameters(url, Timeline.params, Timeline.paramTypes);
            } else {
                params = Timeline.params;
            }

            if (conf.hasOwnProperty("bundle")) {
                params.bundle = conf.bundle;
            }

            if (conf.hasOwnProperty("ajax")) {
                params.ajax = conf.ajax;
                ajax = conf.ajax;
            }
            
            if (params.bundle) {
                SimileAjax.includeCssFile(document, Timeline.urlPrefix + Timeline.bundledCssFile);
            } else {
                SimileAjax.includeCssFiles(document, Timeline.urlPrefix, Timeline.cssFiles);
            }

            if (typeof Timeline_ajax_url === "string") {
                ajax = Timeline_ajax_url;
            } else if (ajax === null) {
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
                params.ajax = ajax;
                SimileAjax.load();
                SimileAjax.setPrefix(ajax);
            } else {
                SimileAjax.load();
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

            Timeline.params = params;

            // All of this locale material is vestigial.  It is apparently
            // fundamental to the way themes work but shouldn't be.
            var tryExactLocale = function(locale) {
                for (var l = 0; l < Timeline.supportedLocales.length; l++) {
                    if (locale == Timeline.supportedLocales[l]) {
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

    $(document).ready(Timeline.load);
    
    return Timeline;
});
