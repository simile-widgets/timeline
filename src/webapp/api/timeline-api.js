(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        root.Timeline = factory();
    }
}(this, function() {

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("lib/almond", function(){});

define('nls/cs/days',{
    "0": "Ne",
    "1": "Po",
    "2": "�t",
    "3": "St",
    "4": "�t",
    "5": "P�",
    "6": "So"
});

define('nls/cs/months',{
    "0": "Leden",
    "1": "�nor",
    "2": "B�ezen",
    "3": "Duben",
    "4": "Kv�ten",
    "5": "�erven",
    "6": "�ervenec",
    "7": "Srpen",
    "8": "Z���",
    "9": "��jen",
    "10": "Listopad",
    "11": "Prosinec"
});

define('nls/cs/timeline',{
    "dateStyle": "cs",
    "wikiLinkLabel": "Diskuze"
});

define('nls/days',{
    "root": true,
    "cs": true,
    "fr": true,
    "it": true,
    "pt-br": true,
    "se": true,
    "zh": true
});

define('nls/de/months',{
    "0": "Jan",
    "1": "Feb",
    "2": "Mrz",
    "3": "Apr",
    "4": "Mai",
    "5": "Jun",
    "6": "Jul",
    "7": "Aug",
    "8": "Sep",
    "9": "Okt",
    "10": "Nov",
    "11": "Dez"
});

define('nls/de/timeline',{
    "dateStyle": "de",
    "wikiLinkLabel": "Diskutieren"
});

define('nls/es/months',{
    "0": "Ene",
    "1": "Feb",
    "2": "Mar",
    "3": "Abr",
    "4": "May",
    "5": "Jun",
    "6": "Jul",
    "7": "Ago",
    "8": "Sep",
    "9": "Oct",
    "10": "Nov",
    "11": "Dic"
});

define('nls/es/timeline',{
    "wikiLinkLabel": "Discute"
});

define('nls/fr/days',{
    "0": "Dimanche",
    "1": "Lundi",
    "2": "Mardi",
    "3": "Mercredi",
    "4": "Jeudi",
    "5": "Vendredi",
    "6": "Samedi"
});

define('nls/fr/months',{
    "0": "jan",
    "1": "fev",
    "2": "mar",
    "3": "avr",
    "4": "mai",
    "5": "jui",
    "6": "jui",
    "7": "aou",
    "8": "sep",
    "9": "oct",
    "10": "nov",
    "11": "dec"
});

define('nls/fr/timeline',{
    "wikiLinkLabel": "Discute"
});

define('nls/it/months',{
    "0": "Gen",
    "1": "Feb",
    "2": "Mar",
    "3": "Apr",
    "4": "Mag",
    "5": "Giu",
    "6": "Lug",
    "7": "Ago",
    "8": "Set",
    "9": "Ott",
    "10": "Nov",
    "11": "Dic"
});

define('nls/it/timeline',{
    "wikiLinkLabel": "Discuti"
});

define('nls/months',{
    "root": true,
    "cs": true,
    "de": true,
    "es": true,
    "fr": true,
    "it": true,
    "nl": true,
    "pl": true,
    "pt-br": true,
    "ru": true,
    "se": true,
    "tr": true,
    "vi": true,
    "zh": true
});

define('nls/nl/months',{
    "0": "jan",
    "1": "feb",
    "2": "mrt",
    "3": "apr",
    "4": "mei",
    "5": "jun",
    "6": "jul",
    "7": "aug",
    "8": "sep",
    "9": "okt",
    "10": "nov",
    "11": "dec"
});

define('nls/nl/timeline',{
    "wikiLinkLabel": "Discussieer"
});

define('nls/pl/days',{
    "0": "Niedziela",
    "1": "Poniedziałek",
    "2": "Wtorek",
    "3": "Środa",
    "4": "Czwartek",
    "5": "Piątek",
    "6": "Sobota"
});

define('nls/pl/timeline',{
    "wikiLinkLabel": "Dyskusja"
});

define('nls/pt-br/days',{
    "0": "Domingo",
    "1": "Segunda",
    "2": "Terça",
    "3": "Quarta",
    "4": "Quinta",
    "5": "Sexta",
    "6": "Sábado"
});

define('nls/pt-br/months',{
    "0": "Jan",
    "1": "Fev",
    "2": "Mar",
    "3": "Abr",
    "4": "Mai",
    "5": "Jun",
    "6": "Jul",
    "7": "Ago",
    "8": "Set",
    "9": "Out",
    "10": "Nov",
    "11": "Dez"
});

define('nls/pt-br/timeline',{
    "wikiLinkLabel": "Discutir"
});

define('nls/ru/months',{
    "0": "Янв",
    "1": "Фев",
    "2": "Мар",
    "3": "Апр",
    "4": "Май",
    "5": "Июн",
    "6": "Июл",
    "7": "Авг",
    "8": "Сен",
    "9": "Окт",
    "10": "Ноя",
    "11": "Дек"
});

define('nls/ru/timeline',{
    "wikiLinkLabel": "обсудите"
});



define('nls/se/days',{
    "0": "Sön",
    "1": "Mån",
    "2": "Tis",
    "3": "Ons",
    "4": "Tors",
    "5": "Fre",
    "6": "Lör"
});

define('nls/se/months',{
    "0": "Jan",
    "1": "Feb",
    "2": "Mar",
    "3": "Apr",
    "4": "Maj",
    "5": "Jun",
    "6": "Jul",
    "7": "Aug",
    "8": "Sep",
    "9": "Okt",
    "10": "Nov",
    "11": "Dec"
});

define('nls/se/timeline',{
    "wikiLinkLabel":  "Discuss"
});

define('nls/timeline',{
    "root": true,
    "cs": true,
    "de": true,
    "es": true,
    "fr": true,
    "it": true,
    "nl": true,
    "pl": true,
    "pt-br": true,
    "ru": true,
    "se": true,
    "tr": true,
    "vi": true,
    "zh": true
});

define('nls/tr/months',{
    "0": "Ock",
    "1": "Şbt",
    "2": "Mrt",
    "3": "Nsn",
    "4": "Mys",
    "5": "Hzr",
    "6": "Tem",
    "7": "Ağs",
    "8": "Eyl",
    "9": "Ekm",
    "10": "Ksm",
    "11": "Arl"
});

define('nls/tr/timeline',{
    "wikiLinkLabel": "Tartış"
});

define('nls/vi/months',{
    "0": "Th�ng 1",
    "1": "Th�ng 2",
    "2": "Th�ng 3",
    "3": "Th�ng 4",
    "4": "Th�ng 5",
    "5": "Th�ng 6",
    "6": "Th�ng 7",
    "7": "Th�ng 8",
    "8": "Th�ng 9",
    "9": "Th�ng 10",
    "10": "Th�ng 11",
    "11": "Th�ng 12"
});

define('nls/vi/timeline',{
    "dateStyle": "vi",
    "wikiLinkLabel": "Bàn lu"
});

define('nls/zh/days',{
    "0": "星期天",
    "1": "星期1",
    "2": "星期2",
    "3": "星期3",
    "4": "星期4",
    "5": "星期5",
    "6": "星期6"
});

define('nls/zh/months',{
    "0": "1月",
    "1": "2月",
    "2": "3月",
    "3": "4月",
    "4": "5月",
    "5": "6月",
    "6": "7月",
    "7": "8月",
    "8": "9月",
    "9": "10月",
    "10": "11月",
    "11": "12月"
});

define('nls/zh/timeline',{
    "dateStyle": "zh",
    "wikiLinkLabel": "讨论"
});

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('lib/domReady',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});

/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */

(function(e,t){typeof define=="function"&&define.amd?define('simile-ajax',t):e.SimileAjax=t()})(this,function(){var e,t,r;return function(n){function d(e,t){return h.call(e,t)}function v(e,t){var n,r,i,s,o,u,a,f,c,h,p=t&&t.split("/"),d=l.map,v=d&&d["*"]||{};if(e&&e.charAt(0)===".")if(t){p=p.slice(0,p.length-1),e=p.concat(e.split("/"));for(f=0;f<e.length;f+=1){h=e[f];if(h===".")e.splice(f,1),f-=1;else if(h===".."){if(f===1&&(e[2]===".."||e[0]===".."))break;f>0&&(e.splice(f-1,2),f-=2)}}e=e.join("/")}else e.indexOf("./")===0&&(e=e.substring(2));if((p||v)&&d){n=e.split("/");for(f=n.length;f>0;f-=1){r=n.slice(0,f).join("/");if(p)for(c=p.length;c>0;c-=1){i=d[p.slice(0,c).join("/")];if(i){i=i[r];if(i){s=i,o=f;break}}}if(s)break;!u&&v&&v[r]&&(u=v[r],a=f)}!s&&u&&(s=u,o=a),s&&(n.splice(0,o,s),e=n.join("/"))}return e}function m(e,t){return function(){return s.apply(n,p.call(arguments,0).concat([e,t]))}}function g(e){return function(t){return v(t,e)}}function y(e){return function(t){a[e]=t}}function b(e){if(d(f,e)){var t=f[e];delete f[e],c[e]=!0,i.apply(n,t)}if(!d(a,e)&&!d(c,e))throw new Error("No "+e);return a[e]}function w(e){var t,n=e?e.indexOf("!"):-1;return n>-1&&(t=e.substring(0,n),e=e.substring(n+1,e.length)),[t,e]}function E(e){return function(){return l&&l.config&&l.config[e]||{}}}var i,s,o,u,a={},f={},l={},c={},h=Object.prototype.hasOwnProperty,p=[].slice;o=function(e,t){var n,r=w(e),i=r[0];return e=r[1],i&&(i=v(i,t),n=b(i)),i?n&&n.normalize?e=n.normalize(e,g(t)):e=v(e,t):(e=v(e,t),r=w(e),i=r[0],e=r[1],i&&(n=b(i))),{f:i?i+"!"+e:e,n:e,pr:i,p:n}},u={require:function(e){return m(e)},exports:function(e){var t=a[e];return typeof t!="undefined"?t:a[e]={}},module:function(e){return{id:e,uri:"",exports:a[e],config:E(e)}}},i=function(e,t,r,i){var s,l,h,p,v,g=[],w;i=i||e;if(typeof r=="function"){t=!t.length&&r.length?["require","exports","module"]:t;for(v=0;v<t.length;v+=1){p=o(t[v],i),l=p.f;if(l==="require")g[v]=u.require(e);else if(l==="exports")g[v]=u.exports(e),w=!0;else if(l==="module")s=g[v]=u.module(e);else if(d(a,l)||d(f,l)||d(c,l))g[v]=b(l);else{if(!p.p)throw new Error(e+" missing "+l);p.p.load(p.n,m(i,!0),y(l),{}),g[v]=a[l]}}h=r.apply(a[e],g);if(e)if(s&&s.exports!==n&&s.exports!==a[e])a[e]=s.exports;else if(h!==n||!w)a[e]=h}else e&&(a[e]=r)},e=t=s=function(e,t,r,a,f){return typeof e=="string"?u[e]?u[e](t):b(o(e,t).f):(e.splice||(l=e,t.splice?(e=t,t=r,r=null):e=n),t=t||function(){},typeof r=="function"&&(r=a,a=f),a?i(n,e,t,r):setTimeout(function(){i(n,e,t,r)},4),s)},s.config=function(e){return l=e,l.deps&&s(l.deps,l.callback),s},r=function(e,t,n){t.splice||(n=t,t=[]),!d(a,e)&&!d(f,e)&&(f[e]=[e,t,n])},r.amd={jQuery:!0}}(),r("lib/almond",function(){}),r("lib/domReady",[],function(){function u(e){var t;for(t=0;t<e.length;t+=1)e[t](s)}function a(){var e=o;i&&e.length&&(o=[],u(e))}function f(){i||(i=!0,n&&clearInterval(n),a())}function c(e){return i?e(s):o.push(e),c}var e,t,n,r=typeof window!="undefined"&&window.document,i=!r,s=r?document:null,o=[];if(r){if(document.addEventListener)document.addEventListener("DOMContentLoaded",f,!1),window.addEventListener("load",f,!1);else if(window.attachEvent){window.attachEvent("onload",f),t=document.createElement("div");try{e=window.frameElement===null}catch(l){}t.doScroll&&e&&window.external&&(n=setInterval(function(){try{t.doScroll(),f()}catch(e){}},30))}document.readyState==="complete"&&f()}return c.version="2.0.1",c.load=function(e,t,n,r){r.isBuild?n(null):c(n)},c}),r("scripts/base",[],function(){var e={loaded:!1,loadingScriptsCount:0,error:null,params:{bundle:!0},paramTypes:{bundle:Boolean},version:"3.0.0",jQuery:null,urlPrefix:null};return e}),r("scripts/platform",[],function(){var e={};return e.os={isMac:!1,isWin:!1,isWin32:!1,isUnix:!1},e.browser={isIE:!1,isNetscape:!1,isMozilla:!1,isFirefox:!1,isOpera:!1,isSafari:!1,majorVersion:0,minorVersion:0},function(){var t=navigator.appName.toLowerCase(),n=navigator.userAgent.toLowerCase();e.os.isMac=n.indexOf("mac")!=-1,e.os.isWin=n.indexOf("win")!=-1,e.os.isWin32=e.isWin&&(n.indexOf("95")!=-1||n.indexOf("98")!=-1||n.indexOf("nt")!=-1||n.indexOf("win32")!=-1||n.indexOf("32bit")!=-1),e.os.isUnix=n.indexOf("x11")!=-1,e.browser.isIE=t.indexOf("microsoft")!=-1,e.browser.isNetscape=t.indexOf("netscape")!=-1,e.browser.isMozilla=n.indexOf("mozilla")!=-1,e.browser.isFirefox=n.indexOf("firefox")!=-1,e.browser.isOpera=t.indexOf("opera")!=-1,e.browser.isSafari=t.indexOf("safari")!=-1;var r=function(t){var n=t.split(".");e.browser.majorVersion=parseInt(n[0]),e.browser.minorVersion=parseInt(n[1])},i=function(e,t,n){var r=e.indexOf(t,n);return r>=0?r:e.length};if(e.browser.isMozilla){var s=n.indexOf("mozilla/");s>=0&&r(n.substring(s+8,i(n," ",s)))}if(e.browser.isIE){var s=n.indexOf("msie ");s>=0&&r(n.substring(s+5,i(n,";",s)))}if(e.browser.isNetscape){var s=n.indexOf("rv:");s>=0&&r(n.substring(s+3,i(n,")",s)))}if(e.browser.isFirefox){var s=n.indexOf("firefox/");s>=0&&r(n.substring(s+8,i(n," ",s)))}"localeCompare"in String.prototype||(String.prototype.localeCompare=function(e){return this<e?-1:this>e?1:0})}(),e.getDefaultLocale=function(){return e.clientLocale},e}),r("scripts/debug",["./base"],function(e){var t={silent:!1};return t.log=function(e){var n;"console"in window&&"log"in window.console?n=function(e){console.log(e)}:n=function(e){t.silent||alert(e)},t.log=n,n(e)},t.warn=function(e){var n;"console"in window&&"warn"in window.console?n=function(e){console.warn(e)}:n=function(e){t.silent||alert(e)},t.warn=n,n(e)},t.exception=function(n,r){var i,s=e.parseURLParameters();s.errors=="throw"||e.params.errors=="throw"?i=function(e,t){throw e}:"console"in window&&"error"in window.console?i=function(e,t){throw t!=null?console.error(t+" %o",e):console.error(e),e}:i=function(e,n){throw t.silent||alert("Caught exception: "+n+"\n\nDetails: "+("description"in e?e.description:e)),e},t.exception=i,i(n,r)},t.objectToString=function(e){return t._objectToString(e,"")},t._objectToString=function(e,n){var r=n+" ";if(typeof e=="object"){var i="{";for(s in e)i+=r+s+": "+t._objectToString(e[s],r)+"\n";return i+=n+"}",i}if(typeof e=="array"){var i="[";for(var s=0;s<e.length;s++)i+=t._objectToString(e[s],r)+"\n";return i+=n+"]",i}return e},t}),r("scripts/xmlhttp",["./debug","./platform"],function(e,t){var n=new Object;return n._onReadyStateChange=function(t,n,r){switch(t.readyState){case 4:try{t.status==0||t.status==200?r&&r(t):n&&n(t.statusText,t.status,t)}catch(i){e.exception("XmlHttp: Error handling onReadyStateChange",i)}}},n._createRequest=function(){if(t.browser.isIE){var e=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"];for(var r=0;r<e.length;r++)try{var i=e[r],s=function(){return new ActiveXObject(i)},o=s();return n._createRequest=s,o}catch(u){}}try{var s=function(){return new XMLHttpRequest},o=s();return n._createRequest=s,o}catch(u){throw new Error("Failed to create an XMLHttpRequest object")}},n.get=function(e,t,r){var i=n._createRequest();i.open("GET",e,!0),i.onreadystatechange=function(){n._onReadyStateChange(i,t,r)},i.send(null)},n.post=function(e,t,r,i){var s=n._createRequest();s.open("POST",e,!0),s.onreadystatechange=function(){n._onReadyStateChange(s,r,i)},s.send(t)},n._forceXML=function(e){try{e.overrideMimeType("text/xml")}catch(t){e.setrequestheader("Content-Type","text/xml")}},n}),r("scripts/dom",["./platform"],function(e){var t=new Object;return t.registerEventWithObject=function(e,n,r,i){t.registerEvent(e,n,function(e,t,n){return r[i].call(r,e,t,n)})},t.registerEvent=function(t,n,r){var i=function(e){e=e?e:event?event:null;if(e){var n=e.target?e.target:e.srcElement?e.srcElement:null;return n&&(n=n.nodeType==1||n.nodeType==9?n:n.parentNode),r(t,e,n)}return!0};e.browser.isIE?t.attachEvent("on"+n,i):t.addEventListener(n,i,!1)},t.getPageCoordinates=function(e){var t=0,n=0;e.nodeType!=1&&(e=e.parentNode);var r=e;while(r!=null)t+=r.offsetLeft,n+=r.offsetTop,r=r.offsetParent;var i=document.body;while(e!=null&&e!=i)"scrollLeft"in e&&(t-=e.scrollLeft,n-=e.scrollTop),e=e.parentNode;return{left:t,top:n}},t.getSize=function(e){var t=this.getStyle(e,"width"),n=this.getStyle(e,"height");return t.indexOf("px")>-1&&(t=t.replace("px","")),n.indexOf("px")>-1&&(n=n.replace("px","")),{w:t,h:n}},t.getStyle=function(e,t){if(e.currentStyle)var n=e.currentStyle[t];else if(window.getComputedStyle)var n=document.defaultView.getComputedStyle(e,null).getPropertyValue(t);else var n="";return n},t.getEventRelativeCoordinates=function(n,r){if(e.browser.isIE){if(n.type=="mousewheel"){var i=t.getPageCoordinates(r);return{x:n.clientX-i.left,y:n.clientY-i.top}}return{x:n.offsetX,y:n.offsetY}}var i=t.getPageCoordinates(r);return n.type=="DOMMouseScroll"&&e.browser.isFirefox&&e.browser.majorVersion==2?{x:n.screenX-i.left,y:n.screenY-i.top}:{x:n.pageX-i.left,y:n.pageY-i.top}},t.getEventPageCoordinates=function(t){if(e.browser.isIE){var n=0,r=0;return document.body&&(document.body.scrollLeft||document.body.scrollTop)?(n=document.body.scrollTop,r=document.body.scrollLeft):document.documentElement&&(document.documentElement.scrollLeft||document.documentElement.scrollTop)&&(n=document.documentElement.scrollTop,r=document.documentElement.scrollLeft),{x:t.clientX+r,y:t.clientY+n}}return{x:t.pageX,y:t.pageY}},t.hittest=function(e,n,r){return t._hittest(document.body,e,n,r)},t._hittest=function(e,n,r,i){var s=e.childNodes;e:for(var o=0;o<s.length;o++){var u=s[o];for(var a=0;a<i.length;a++)if(u==i[a])continue e;if(u.offsetWidth==0&&u.offsetHeight==0){var f=t._hittest(u,n,r,i);if(f!=u)return f}else{var l=0,c=0,h=u;while(h)l+=h.offsetTop,c+=h.offsetLeft,h=h.offsetParent;if(c<=n&&l<=r&&n-c<u.offsetWidth&&r-l<u.offsetHeight)return t._hittest(u,n,r,i);if(u.nodeType==1&&u.tagName=="TR"){var p=t._hittest(u,n,r,i);if(p!=u)return p}}}return e},t.cancelEvent=function(e){e.returnValue=!1,e.cancelBubble=!0,"preventDefault"in e&&e.preventDefault()},t.appendClassName=function(e,t){var n=e.className.split(" ");for(var r=0;r<n.length;r++)if(n[r]==t)return;n.push(t),e.className=n.join(" ")},t.createInputElement=function(e){var t=document.createElement("div");return t.innerHTML="<input type='"+e+"' />",t.firstChild},t.createDOMFromTemplate=function(e){var n={};return n.elmt=t._createDOMFromTemplate(e,n,null),n},t._createDOMFromTemplate=function(r,i,s){if(r==null)return null;if(typeof r!="object"){var o=document.createTextNode(r);return s!=null&&s.appendChild(o),o}var u=null;if("tag"in r){var a=r.tag;s!=null&&(a=="tr"?u=s.insertRow(s.rows.length):a=="td"&&(u=s.insertCell(s.cells.length))),u==null&&(u=a=="input"?t.createInputElement(r.type):document.createElement(a),s!=null&&s.appendChild(u))}else u=r.elmt,s!=null&&s.appendChild(u);for(var f in r){var l=r[f];if(f=="field")i[l]=u;else if(f=="className")u.className=l;else if(f=="id")u.id=l;else if(f=="title")u.title=l;else if(f!="type"||u.tagName!="input")if(f=="style")for(n in l){var c=l[n];n=="float"&&(n=e.browser.isIE?"styleFloat":"cssFloat"),u.style[n]=c}else if(f=="children")for(var h=0;h<l.length;h++)t._createDOMFromTemplate(l[h],i,u);else f!="tag"&&f!="elmt"&&u.setAttribute(f,l)}return u},t._cachedParent=null,t.createElementFromString=function(e){return t._cachedParent==null&&(t._cachedParent=document.createElement("div")),t._cachedParent.innerHTML=e,t._cachedParent.firstChild},t.createDOMFromString=function(e,n,r){var i=typeof e=="string"?document.createElement(e):e;i.innerHTML=n;var s={elmt:i};return t._processDOMChildrenConstructedFromString(s,i,r!=null?r:{}),s},t._processDOMConstructedFromString=function(e,n,r){var i=n.id;if(i!=null&&i.length>0){n.removeAttribute("id");if(i in r){var s=n.parentNode;s.insertBefore(r[i],n),s.removeChild(n),e[i]=r[i];return}e[i]=n}n.hasChildNodes()&&t._processDOMChildrenConstructedFromString(e,n,r)},t._processDOMChildrenConstructedFromString=function(e,n,r){var i=n.firstChild;while(i!=null){var s=i.nextSibling;i.nodeType==1&&t._processDOMConstructedFromString(e,i,r),i=s}},t}),r("scripts/graphics",["./base","./platform"],function(e,t){var n=new Object;return n.pngIsTranslucent=!t.browser.isIE||t.browser.majorVersion>6,n.pngIsTranslucent||includeCssFile(document,e.urlPrefix+"styles/graphics-ie6.css"),n._createTranslucentImage1=function(e,t){var n=document.createElement("img");return n.setAttribute("src",e),t!=null&&(n.style.verticalAlign=t),n},n._createTranslucentImage2=function(e,t){var n=document.createElement("img");return n.style.width="1px",n.style.height="1px",n.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+e+"', sizingMethod='image')",n.style.verticalAlign=t!=null?t:"middle",n},n.createTranslucentImage=n.pngIsTranslucent?n._createTranslucentImage1:n._createTranslucentImage2,n._createTranslucentImageHTML1=function(e,t){return'<img src="'+e+'"'+(t!=null?' style="vertical-align: '+t+';"':"")+" />"},n._createTranslucentImageHTML2=function(e,t){var n="width: 1px; height: 1px; filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+e+"', sizingMethod='image');"+(t!=null?" vertical-align: "+t+";":"");return"<img src='"+e+"' style=\""+n+'" />'},n.createTranslucentImageHTML=n.pngIsTranslucent?n._createTranslucentImageHTML1:n._createTranslucentImageHTML2,n.setOpacity=function(e,n){if(t.browser.isIE)e.style.filter="progid:DXImageTransform.Microsoft.Alpha(Style=0,Opacity="+n+")";else{var r=(n/100).toString();e.style.opacity=r,e.style.MozOpacity=r}},n.bubbleConfig={containerCSSClass:"simileAjax-bubble-container",innerContainerCSSClass:"simileAjax-bubble-innerContainer",contentContainerCSSClass:"simileAjax-bubble-contentContainer",borderGraphicSize:50,borderGraphicCSSClassPrefix:"simileAjax-bubble-border-",arrowGraphicTargetOffset:33,arrowGraphicLength:100,arrowGraphicWidth:49,arrowGraphicCSSClassPrefix:"simileAjax-bubble-arrow-",closeGraphicCSSClass:"simileAjax-bubble-close",extraPadding:20},n.getWindowDimensions=function(){if(typeof window.innerHeight=="number")return{w:window.innerWidth,h:window.innerHeight};if(document.documentElement&&document.documentElement.clientHeight)return{w:document.documentElement.clientWidth,h:document.documentElement.clientHeight};if(document.body&&document.body.clientHeight)return{w:document.body.clientWidth,h:document.body.clientHeight}},n.createMessageBubble=function(e){var t=e.createElement("div"),r="simileAjax-messageBubble";if(n.pngIsTranslucent){var i=e.createElement("div");i.className=r+"-top",t.appendChild(i);var s=e.createElement("div");s.className=r+"-top-right",i.appendChild(s);var o=e.createElement("div");o.className=r+"-middle",t.appendChild(o);var u=e.createElement("div");u.className=r+"-middle-right",o.appendChild(u);var a=e.createElement("div");u.appendChild(a);var f=e.createElement("div");f.className=r+"-bottom",t.appendChild(f);var l=e.createElement("div");l.className=r+"-bottom-right",f.appendChild(l)}else{t.style.border="2px solid #7777AA",t.style.padding="20px",t.style.background="white",n.setOpacity(t,90);var a=e.createElement("div");t.appendChild(a)}return{containerDiv:t,contentDiv:a}},n.createAnimation=function(e,t,r,i,s){return new n._Animation(e,t,r,i,s)},n._Animation=function(e,t,n,r,i){this.f=e,this.cont=typeof i=="function"?i:function(){},this.from=t,this.to=n,this.current=t,this.duration=r,this.start=(new Date).getTime(),this.timePassed=0},n._Animation.prototype.run=function(){var e=this;window.setTimeout(function(){e.step()},50)},n._Animation.prototype.step=function(){this.timePassed+=50;var e=this.timePassed/this.duration,t=-Math.cos(e*Math.PI)/2+.5,n=t*(this.to-this.from)+this.from;try{this.f(n,n-this.current)}catch(r){}this.current=n,this.timePassed<this.duration?this.run():(this.f(this.to,0),this.cont())},n.createStructuredDataCopyButton=function(e,r,i,s){var o=document.createElement("div");o.style.position="relative",o.style.display="inline",o.style.width=r+"px",o.style.height=i+"px",o.style.overflow="hidden",o.style.margin="2px",n.pngIsTranslucent?o.style.background="url("+e+") no-repeat":o.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+e+"', sizingMethod='image')";var u;t.browser.isIE?u="filter:alpha(opacity=0)":u="opacity: 0",o.innerHTML="<textarea rows='1' autocomplete='off' value='none' style='"+u+"' />";var a=o.firstChild;return a.style.width=r+"px",a.style.height=i+"px",a.onmousedown=function(e){e=e?e:event?event:null,e.button==2&&(a.value=s(),a.select())},o},n.getWidthHeight=function(e){var t,n;if(e.getBoundingClientRect==null)t=e.offsetWidth,n=e.offsetHeight;else{var r=e.getBoundingClientRect();t=Math.ceil(r.right-r.left),n=Math.ceil(r.bottom-r.top)}return{width:t,height:n}},n.getFontRenderingContext=function(e,t){return new n._FontRenderingContext(e,t)},n._FontRenderingContext=function(e,t){this._elmt=e,this._elmt.style.visibility="hidden",typeof t=="string"?this._elmt.style.width=t:typeof t=="number"&&(this._elmt.style.width=t+"px")},n._FontRenderingContext.prototype.dispose=function(){this._elmt=null},n._FontRenderingContext.prototype.update=function(){this._elmt.innerHTML="A",this._lineHeight=this._elmt.offsetHeight},n._FontRenderingContext.prototype.computeSize=function(e,t){var r=this._elmt;r.innerHTML=e,r.className=t===undefined?"":t;var i=n.getWidthHeight(r);return r.className="",i},n._FontRenderingContext.prototype.getLineHeight=function(){return this._lineHeight},n}),r("scripts/window-manager",["./dom","./debug","./graphics","./base"],function(e,t,n,r){var i={_initialized:!1,_listeners:[],_draggedElement:null,_draggedElementCallback:null,_dropTargetHighlightElement:null,_lastCoords:null,_ghostCoords:null,_draggingMode:"",_dragging:!1,_layers:[]};return i.initialize=function(){if(i._initialized)return;e.registerEvent(document.body,"mousedown",i._onBodyMouseDown),e.registerEvent(document.body,"mousemove",i._onBodyMouseMove),e.registerEvent(document.body,"mouseup",i._onBodyMouseUp),e.registerEvent(document,"keydown",i._onBodyKeyDown),e.registerEvent(document,"keyup",i._onBodyKeyUp),i._layers.push({index:0}),i._initialized=!0},i.getBaseLayer=function(){return i._layers[0]},i.getHighestLayer=function(){return i._layers[i._layers.length-1]},i.registerEventWithObject=function(e,t,n,r,s){i.registerEvent(e,t,function(e,t,i){return n[r].call(n,e,t,i)},s)},i.registerEvent=function(n,r,s,o){o==null&&(o=i.getHighestLayer());var u=function(n,r,u){if(i._canProcessEventAtLayer(o)){i._popToLayer(o.index);try{s(n,r,u)}catch(a){t.exception(a)}}return e.cancelEvent(r),!1};e.registerEvent(n,r,u)},i.pushLayer=function(e,t,n){var r={onPop:e,index:i._layers.length,ephemeral:t,elmt:n};return i._layers.push(r),r},i.popLayer=function(e){for(var t=1;t<i._layers.length;t++)if(i._layers[t]==e){i._popToLayer(t-1);break}},i.popAllLayers=function(){i._popToLayer(0)},i.registerForDragging=function(e,t,n){i.registerEvent(e,"mousedown",function(e,n,r){i._handleMouseDown(e,n,t)},n)},i._popToLayer=function(e){while(e+1<i._layers.length)try{var t=i._layers.pop();t.onPop!=null&&t.onPop()}catch(n){}},i._canProcessEventAtLayer=function(e){if(e.index==i._layers.length-1)return!0;for(var t=e.index+1;t<i._layers.length;t++)if(!i._layers[t].ephemeral)return!1;return!0},i.cancelPopups=function(t){var n=t?e.getEventPageCoordinates(t):{x:-1,y:-1},r=i._layers.length-1;while(r>0&&i._layers[r].ephemeral){var s=i._layers[r];if(s.elmt!=null){var o=s.elmt,u=e.getPageCoordinates(o);if(n.x>=u.left&&n.x<u.left+o.offsetWidth&&n.y>=u.top&&n.y<u.top+o.offsetHeight)break}r--}i._popToLayer(r)},i._onBodyMouseDown=function(e,t,n){(!("eventPhase"in t)||t.eventPhase==t.BUBBLING_PHASE)&&i.cancelPopups(t)},i._handleMouseDown=function(t,n,r){return i._draggedElement=t,i._draggedElementCallback=r,i._lastCoords={x:n.clientX,y:n.clientY},e.cancelEvent(n),!1},i._onBodyKeyDown=function(e,t,s){if(i._dragging)if(t.keyCode==27)i._cancelDragging();else if((t.keyCode==17||t.keyCode==16)&&i._draggingMode!="copy"){i._draggingMode="copy";var o=n.createTranslucentImage(r.urlPrefix+"images/copy.png");o.style.position="absolute",o.style.left=i._ghostCoords.left-16+"px",o.style.top=i._ghostCoords.top+"px",document.body.appendChild(o),i._draggingModeIndicatorElmt=o}},i._onBodyKeyUp=function(e,t,n){i._dragging&&(t.keyCode==17||t.keyCode==16)&&(i._draggingMode="",i._draggingModeIndicatorElmt!=null&&(document.body.removeChild(i._draggingModeIndicatorElmt),i._draggingModeIndicatorElmt=null))},i._onBodyMouseMove=function(r,s,o){if(i._draggedElement!=null){var u=i._draggedElementCallback,a=i._lastCoords,f=s.clientX-a.x,l=s.clientY-a.y;if(!i._dragging){if(Math.abs(f)>5||Math.abs(l)>5)try{"onDragStart"in u&&u.onDragStart();if("ghost"in u&&u.ghost){var c=i._draggedElement;i._ghostCoords=e.getPageCoordinates(c),i._ghostCoords.left+=f,i._ghostCoords.top+=l;var h=c.cloneNode(!0);h.style.position="absolute",h.style.left=i._ghostCoords.left+"px",h.style.top=i._ghostCoords.top+"px",h.style.zIndex=1e3,n.setOpacity(h,50),document.body.appendChild(h),u._ghostElmt=h}i._dragging=!0,i._lastCoords={x:s.clientX,y:s.clientY},document.body.focus()}catch(p){t.exception("WindowManager: Error handling mouse down",p),i._cancelDragging()}}else try{i._lastCoords={x:s.clientX,y:s.clientY},"onDragBy"in u&&u.onDragBy(f,l);if("_ghostElmt"in u){var h=u._ghostElmt;i._ghostCoords.left+=f,i._ghostCoords.top+=l,h.style.left=i._ghostCoords.left+"px",h.style.top=i._ghostCoords.top+"px";if(i._draggingModeIndicatorElmt!=null){var d=i._draggingModeIndicatorElmt;d.style.left=i._ghostCoords.left-16+"px",d.style.top=i._ghostCoords.top+"px"}if("droppable"in u&&u.droppable){var v=e.getEventPageCoordinates(s),o=e.hittest(v.x,v.y,[i._ghostElmt,i._dropTargetHighlightElement]);o=i._findDropTarget(o);if(o!=i._potentialDropTarget){i._dropTargetHighlightElement!=null&&(document.body.removeChild(i._dropTargetHighlightElement),i._dropTargetHighlightElement=null,i._potentialDropTarget=null);var m=!1;o!=null&&(!("canDropOn"in u)||u.canDropOn(o))&&(!("canDrop"in o)||o.canDrop(i._draggedElement))&&(m=!0);if(m){var g=4,y=e.getPageCoordinates(o),b=document.createElement("div");b.style.border=g+"px solid yellow",b.style.backgroundColor="yellow",b.style.position="absolute",b.style.left=y.left+"px",b.style.top=y.top+"px",b.style.width=o.offsetWidth-g*2+"px",b.style.height=o.offsetHeight-g*2+"px",n.setOpacity(b,30),document.body.appendChild(b),i._potentialDropTarget=o,i._dropTargetHighlightElement=b}}}}}catch(p){t.exception("WindowManager: Error handling mouse move",p),i._cancelDragging()}return e.cancelEvent(s),!1}},i._onBodyMouseUp=function(t,n,r){if(i._draggedElement!=null){try{if(i._dragging){var s=i._draggedElementCallback;"onDragEnd"in s&&s.onDragEnd();if("droppable"in s&&s.droppable){var o=!1,r=i._potentialDropTarget;r!=null&&(!("canDropOn"in s)||s.canDropOn(r))&&(!("canDrop"in r)||r.canDrop(i._draggedElement))&&("onDropOn"in s&&s.onDropOn(r),r.ondrop(i._draggedElement,i._draggingMode),o=!0),!o}}}finally{i._cancelDragging()}return e.cancelEvent(n),!1}},i._cancelDragging=function(){var e=i._draggedElementCallback;if("_ghostElmt"in e){var t=e._ghostElmt;document.body.removeChild(t),delete e._ghostElmt}i._dropTargetHighlightElement!=null&&(document.body.removeChild(i._dropTargetHighlightElement),i._dropTargetHighlightElement=null),i._draggingModeIndicatorElmt!=null&&(document.body.removeChild(i._draggingModeIndicatorElmt),i._draggingModeIndicatorElmt=null),i._draggedElement=null,i._draggedElementCallback=null,i._potentialDropTarget=null,i._dropTargetHighlightElement=null,i._lastCoords=null,i._ghostCoords=null,i._draggingMode="",i._dragging=!1},i._findDropTarget=function(e){while(e!=null){if("ondrop"in e&&typeof e.ondrop=="function")break;e=e.parentNode}return e},i}),r("scripts/bubble",["./graphics","./window-manager"],function(e,t){return e.createBubbleForPoint=function(n,r,i,s,o){i=parseInt(i,10),s=parseInt(s,10);var u=e.bubbleConfig,a=e.pngIsTranslucent?"pngTranslucent":"pngNotTranslucent",f=i+2*u.borderGraphicSize,l=s+2*u.borderGraphicSize,c=function(e){return e+" "+e+"-"+a},h=document.createElement("div");h.className=c(u.containerCSSClass),h.style.width=i+"px",h.style.height=s+"px";var p=document.createElement("div");p.className=c(u.innerContainerCSSClass),h.appendChild(p);var d=function(){v._closed||(document.body.removeChild(v._div),v._doc=null,v._div=null,v._content=null,v._closed=!0)},v={_closed:!1},m=t.pushLayer(d,!0,h);v._div=h,v.close=function(){t.popLayer(m)};var g=function(e){var t=document.createElement("div");t.className=c(u.borderGraphicCSSClassPrefix+e),p.appendChild(t)};g("top-left"),g("top-right"),g("bottom-left"),g("bottom-right"),g("left"),g("right"),g("top"),g("bottom");var y=document.createElement("div");y.className=c(u.contentContainerCSSClass),p.appendChild(y),v.content=y;var b=document.createElement("div");return b.className=c(u.closeGraphicCSSClass),p.appendChild(b),t.registerEventWithObject(b,"click",v,"close"),function(){var t=e.getWindowDimensions(),a=t.w,f=t.h,l=Math.ceil(u.arrowGraphicWidth/2),d=function(e){var t=document.createElement("div");return t.className=c(u.arrowGraphicCSSClassPrefix+"point-"+e),p.appendChild(t),t};if(n-l-u.borderGraphicSize-u.extraPadding>0&&n+l+u.borderGraphicSize+u.extraPadding<a){var v=n-Math.round(i/2);v=n<a/2?Math.max(v,u.extraPadding+u.borderGraphicSize):Math.min(v,a-u.extraPadding-u.borderGraphicSize-i);if(o&&o=="top"||!o&&r-u.arrowGraphicTargetOffset-s-u.borderGraphicSize-u.extraPadding>0){var m=d("down");m.style.left=n-l-v+"px",h.style.left=v+"px",h.style.top=r-u.arrowGraphicTargetOffset-s+"px";return}if(o&&o=="bottom"||!o&&r+u.arrowGraphicTargetOffset+s+u.borderGraphicSize+u.extraPadding<f){var m=d("up");m.style.left=n-l-v+"px",h.style.left=v+"px",h.style.top=r+u.arrowGraphicTargetOffset+"px";return}}var g=r-Math.round(s/2);g=r<f/2?Math.max(g,u.extraPadding+u.borderGraphicSize):Math.min(g,f-u.extraPadding-u.borderGraphicSize-s);if(o&&o=="left"||!o&&n-u.arrowGraphicTargetOffset-i-u.borderGraphicSize-u.extraPadding>0){var m=d("right");m.style.top=r-l-g+"px",h.style.top=g+"px",h.style.left=n-u.arrowGraphicTargetOffset-i+"px"}else{var m=d("left");m.style.top=r-l-g+"px",h.style.top=g+"px",h.style.left=n+u.arrowGraphicTargetOffset+"px"}}(),document.body.appendChild(h),v},e.createBubbleForContentAndPoint=function(t,n,r,i,s,o){typeof i!="number"&&(i=300),typeof o!="number"&&(o=0),t.style.position="absolute",t.style.left="-5000px",t.style.top="0px",t.style.width=i+"px",document.body.appendChild(t),window.setTimeout(function(){var i=t.scrollWidth+10,u=t.scrollHeight+10,a=0;o>0&&u>o&&(u=o,a=i-25);var f=e.createBubbleForPoint(n,r,i,u,s);document.body.removeChild(t),t.style.position="static",t.style.left="",t.style.top="";if(a>0){var l=document.createElement("div");t.style.width="",l.style.width=a+"px",l.appendChild(t),f.content.appendChild(l)}else t.style.width=i+"px",f.content.appendChild(t)},200)},e}),r("scripts/date-time",["./debug"],function(e){var t=new Object;return t.MILLISECOND=0,t.SECOND=1,t.MINUTE=2,t.HOUR=3,t.DAY=4,t.WEEK=5,t.MONTH=6,t.YEAR=7,t.DECADE=8,t.CENTURY=9,t.MILLENNIUM=10,t.EPOCH=-1,t.ERA=-2,t.gregorianUnitLengths=[],function(){var e=t,n=e.gregorianUnitLengths;n[e.MILLISECOND]=1,n[e.SECOND]=1e3,n[e.MINUTE]=n[e.SECOND]*60,n[e.HOUR]=n[e.MINUTE]*60,n[e.DAY]=n[e.HOUR]*24,n[e.WEEK]=n[e.DAY]*7,n[e.MONTH]=n[e.DAY]*31,n[e.YEAR]=n[e.DAY]*365,n[e.DECADE]=n[e.YEAR]*10,n[e.CENTURY]=n[e.YEAR]*100,n[e.MILLENNIUM]=n[e.YEAR]*1e3}(),t._dateRegexp=new RegExp("^(-?)([0-9]{4})("+["(-?([0-9]{2})(-?([0-9]{2}))?)","(-?([0-9]{3}))","(-?W([0-9]{2})(-?([1-7]))?)"].join("|")+")?$"),t._timezoneRegexp=new RegExp("Z|(([-+])([0-9]{2})(:?([0-9]{2}))?)$"),t._timeRegexp=new RegExp("^([0-9]{2})(:?([0-9]{2})(:?([0-9]{2})(.([0-9]+))?)?)?$"),t.setIso8601Date=function(e,n){var r=n.match(t._dateRegexp);if(!r)throw new Error("Invalid date string: "+n);var i=r[1]=="-"?-1:1,s=i*r[2],o=r[5],u=r[7],a=r[9],f=r[11],l=r[13]?r[13]:1;e.setUTCFullYear(s);if(a)e.setUTCMonth(0),e.setUTCDate(Number(a));else if(f){e.setUTCMonth(0),e.setUTCDate(1);var c=e.getUTCDay(),h=c?c:7,p=Number(l)+7*Number(f);h<=4?e.setUTCDate(p+1-h):e.setUTCDate(p+8-h)}else o&&(e.setUTCDate(1),e.setUTCMonth(o-1)),u&&e.setUTCDate(u);return e},t.setIso8601Time=function(n,r){var i=r.match(t._timeRegexp);if(!i)return e.warn("Invalid time string: "+r),!1;var s=i[1],o=Number(i[3]?i[3]:0),u=i[5]?i[5]:0,a=i[7]?Number("0."+i[7])*1e3:0;return n.setUTCHours(s),n.setUTCMinutes(o),n.setUTCSeconds(u),n.setUTCMilliseconds(a),n},t.timezoneOffset=(new Date).getTimezoneOffset(),t.setIso8601=function(e,n){var r=null,i=n.indexOf("T")==-1?n.split(" "):n.split("T");t.setIso8601Date(e,i[0]);if(i.length==2){var s=i[1].match(t._timezoneRegexp);s&&(s[0]=="Z"?r=0:(r=Number(s[3])*60+Number(s[5]),r*=s[2]=="-"?1:-1),i[1]=i[1].substr(0,i[1].length-s[0].length)),t.setIso8601Time(e,i[1])}return r==null&&(r=e.getTimezoneOffset()),e.setTime(e.getTime()+r*6e4),e},t.parseIso8601DateTime=function(e){try{return t.setIso8601(new Date(0),e)}catch(n){return null}},t.parseGregorianDateTime=function(e){if(e==null)return null;if(e instanceof Date)return e;var t=e.toString();if(t.length>0&&t.length<8){var n=t.indexOf(" ");if(n>0){var r=parseInt(t.substr(0,n)),i=t.substr(n+1);i.toLowerCase()=="bc"&&(r=1-r)}else var r=parseInt(t);var s=new Date(0);return s.setUTCFullYear(r),s}try{return new Date(Date.parse(t))}catch(o){return null}},t.roundDownToInterval=function(e,n,r,i,s){var o=r*t.gregorianUnitLengths[t.HOUR],u=new Date(e.getTime()+o),a=function(e){e.setUTCMilliseconds(0),e.setUTCSeconds(0),e.setUTCMinutes(0),e.setUTCHours(0)},f=function(e){a(e),e.setUTCDate(1),e.setUTCMonth(0)};switch(n){case t.MILLISECOND:var l=u.getUTCMilliseconds();u.setUTCMilliseconds(l-l%i);break;case t.SECOND:u.setUTCMilliseconds(0);var l=u.getUTCSeconds();u.setUTCSeconds(l-l%i);break;case t.MINUTE:u.setUTCMilliseconds(0),u.setUTCSeconds(0);var l=u.getUTCMinutes();u.setTime(u.getTime()-l%i*t.gregorianUnitLengths[t.MINUTE]);break;case t.HOUR:u.setUTCMilliseconds(0),u.setUTCSeconds(0),u.setUTCMinutes(0);var l=u.getUTCHours();u.setUTCHours(l-l%i);break;case t.DAY:a(u);break;case t.WEEK:a(u);var c=(u.getUTCDay()+7-s)%7;u.setTime(u.getTime()-c*t.gregorianUnitLengths[t.DAY]);break;case t.MONTH:a(u),u.setUTCDate(1);var l=u.getUTCMonth();u.setUTCMonth(l-l%i);break;case t.YEAR:f(u);var l=u.getUTCFullYear();u.setUTCFullYear(l-l%i);break;case t.DECADE:f(u),u.setUTCFullYear(Math.floor(u.getUTCFullYear()/10)*10);break;case t.CENTURY:f(u),u.setUTCFullYear(Math.floor(u.getUTCFullYear()/100)*100);break;case t.MILLENNIUM:f(u),u.setUTCFullYear(Math.floor(u.getUTCFullYear()/1e3)*1e3)}e.setTime(u.getTime()-o)},t.roundUpToInterval=function(e,n,r,i,s){var o=e.getTime();t.roundDownToInterval(e,n,r,i,s),e.getTime()<o&&e.setTime(e.getTime()+t.gregorianUnitLengths[n]*i)},t.incrementByInterval=function(e,n,r){r=typeof r=="undefined"?0:r;var i=r*t.gregorianUnitLengths[t.HOUR],s=new Date(e.getTime()+i);switch(n){case t.MILLISECOND:s.setTime(s.getTime()+1);break;case t.SECOND:s.setTime(s.getTime()+1e3);break;case t.MINUTE:s.setTime(s.getTime()+t.gregorianUnitLengths[t.MINUTE]);break;case t.HOUR:s.setTime(s.getTime()+t.gregorianUnitLengths[t.HOUR]);break;case t.DAY:s.setUTCDate(s.getUTCDate()+1);break;case t.WEEK:s.setUTCDate(s.getUTCDate()+7);break;case t.MONTH:s.setUTCMonth(s.getUTCMonth()+1);break;case t.YEAR:s.setUTCFullYear(s.getUTCFullYear()+1);break;case t.DECADE:s.setUTCFullYear(s.getUTCFullYear()+10);break;case t.CENTURY:s.setUTCFullYear(s.getUTCFullYear()+100);break;case t.MILLENNIUM:s.setUTCFullYear(s.getUTCFullYear()+1e3)}e.setTime(s.getTime()-i)},t.removeTimeZoneOffset=function(e,n){return new Date(e.getTime()+n*t.gregorianUnitLengths[t.HOUR])},t.getTimezone=function(){var e=(new Date).getTimezoneOffset();return e/-60},t}),r("scripts/string",[],function(){var e={};return e.trim=function(e){return e.replace(/^\s+|\s+$/g,"")},e.startsWith=function(e,t){return e.length>=t.length&&e.substr(0,t.length)===t},e.endsWith=function(e,t){return e.length>=t.length&&e.substr(e.length-t.length)===t},e.substitute=function(e,t){var n,r,i,s;n="",r=0;while(r<e.length-1){i=e.indexOf("%",r);if(i<0||i===e.length-1)break;i>r&&e.charAt(i-1)==="\\"?(n+=e.substring(r,i-1)+"%",r=i+1):(s=parseInt(e.charAt(i+1)),isNaN(s)||s>=t.length?n+=e.substring(r,i+2):n+=e.substring(r,i)+t[s].toString(),r=i+2)}return r<e.length&&(n+=e.substring(r)),n},e}),r("scripts/html",[],function(){var e=new Object;return e._e2uHash={},function(){var t=e._e2uHash;t.nbsp=" ",t.iexcl="¡",t.cent="¢",t.pound="£",t.curren="¤",t.yen="¥",t.brvbar="¦",t.sect="§",t.uml="¨",t.copy="©",t.ordf="ª",t.laquo="«",t.not="¬",t.shy="­",t.reg="®",t.macr="¯",t.deg="°",t.plusmn="±",t.sup2="²",t.sup3="³",t.acute="´",t.micro="µ",t.para="¶",t.middot="·",t.cedil="¸",t.sup1="¹",t.ordm="º",t.raquo="»",t.frac14="¼",t.frac12="½",t.frac34="¾",t.iquest="¿",t.Agrave="À",t.Aacute="Á",t.Acirc="Â",t.Atilde="Ã",t.Auml="Ä",t.Aring="Å",t.AElig="Æ",t.Ccedil="Ç",t.Egrave="È",t.Eacute="É",t.Ecirc="Ê",t.Euml="Ë",t.Igrave="Ì",t.Iacute="Í",t.Icirc="Î",t.Iuml="Ï",t.ETH="Ð",t.Ntilde="Ñ",t.Ograve="Ò",t.Oacute="Ó",t.Ocirc="Ô",t.Otilde="Õ",t.Ouml="Ö",t.times="×",t.Oslash="Ø",t.Ugrave="Ù",t.Uacute="Ú",t.Ucirc="Û",t.Uuml="Ü",t.Yacute="Ý",t.THORN="Þ",t.szlig="ß",t.agrave="à",t.aacute="á",t.acirc="â",t.atilde="ã",t.auml="ä",t.aring="å",t.aelig="æ",t.ccedil="ç",t.egrave="è",t.eacute="é",t.ecirc="ê",t.euml="ë",t.igrave="ì",t.iacute="í",t.icirc="î",t.iuml="ï",t.eth="ð",t.ntilde="ñ",t.ograve="ò",t.oacute="ó",t.ocirc="ô",t.otilde="õ",t.ouml="ö",t.divide="÷",t.oslash="ø",t.ugrave="ù",t.uacute="ú",t.ucirc="û",t.uuml="ü",t.yacute="ý",t.thorn="þ",t.yuml="ÿ",t.quot='"',t.amp="&",t.lt="<",t.gt=">",t.OElig="",t.oelig="œ",t.Scaron="Š",t.scaron="š",t.Yuml="Ÿ",t.circ="ˆ",t.tilde="˜",t.ensp=" ",t.emsp=" ",t.thinsp=" ",t.zwnj="‌",t.zwj="‍",t.lrm="‎",t.rlm="‏",t.ndash="–",t.mdash="—",t.lsquo="‘",t.rsquo="’",t.sbquo="‚",t.ldquo="“",t.rdquo="”",t.bdquo="„",t.dagger="†",t.Dagger="‡",t.permil="‰",t.lsaquo="‹",t.rsaquo="›",t.euro="€",t.fnof="ƒ",t.Alpha="Α",t.Beta="Β",t.Gamma="Γ",t.Delta="Δ",t.Epsilon="Ε",t.Zeta="Ζ",t.Eta="Η",t.Theta="Θ",t.Iota="Ι",t.Kappa="Κ",t.Lambda="Λ",t.Mu="Μ",t.Nu="Ν",t.Xi="Ξ",t.Omicron="Ο",t.Pi="Π",t.Rho="Ρ",t.Sigma="Σ",t.Tau="Τ",t.Upsilon="Υ",t.Phi="Φ",t.Chi="Χ",t.Psi="Ψ",t.Omega="Ω",t.alpha="α",t.beta="β",t.gamma="γ",t.delta="δ",t.epsilon="ε",t.zeta="ζ",t.eta="η",t.theta="θ",t.iota="ι",t.kappa="κ",t.lambda="λ",t.mu="μ",t.nu="ν",t.xi="ξ",t.omicron="ο",t.pi="π",t.rho="ρ",t.sigmaf="ς",t.sigma="σ",t.tau="τ",t.upsilon="υ",t.phi="φ",t.chi="χ",t.psi="ψ",t.omega="ω",t.thetasym="ϑ",t.upsih="ϒ",t.piv="ϖ",t.bull="•",t.hellip="…",t.prime="′",t.Prime="″",t.oline="‾",t.frasl="⁄",t.weierp="℘",t.image="ℑ",t.real="ℜ",t.trade="™",t.alefsym="ℵ",t.larr="←",t.uarr="↑",t.rarr="→",t.darr="↓",t.harr="↔",t.crarr="↵",t.lArr="⇐",t.uArr="⇑",t.rArr="⇒",t.dArr="⇓",t.hArr="⇔",t.forall="∀",t.part="∂",t.exist="∃",t.empty="∅",t.nabla="∇",t.isin="∈",t.notin="∉",t.ni="∋",t.prod="∏",t.sum="∑",t.minus="−",t.lowast="∗",t.radic="√",t.prop="∝",t.infin="∞",t.ang="∠",t.and="∧",t.or="∨",t.cap="∩",t.cup="∪",t["int"]="∫",t.there4="∴",t.sim="∼",t.cong="≅",t.asymp="≈",t.ne="≠",t.equiv="≡",t.le="≤",t.ge="≥",t.sub="⊂",t.sup="⊃",t.nsub="⊄",t.sube="⊆",t.supe="⊇",t.oplus="⊕",t.otimes="⊗",t.perp="⊥",t.sdot="⋅",t.lceil="⌈",t.rceil="⌉",t.lfloor="⌊",t.rfloor="⌋",t.lang="〈",t.rang="〉",t.loz="◊",t.spades="♠",t.clubs="♣",t.hearts="♥",t.diams="♦"}(),e.deEntify=function(t){var n=e._e2uHash,r=/&(\w+?);/;while(r.test(t)){var i=t.match(r);t=t.replace(r,n[i[1]])}return t},e}),r("scripts/set",[],function(){var e=function(t){this._hash={},this._count=0;if(t instanceof Array)for(var n=0;n<t.length;n++)this.add(t[n]);else t instanceof e&&this.addSet(t)};return e.prototype.add=function(e){return e in this._hash?!1:(this._hash[e]=!0,this._count++,!0)},e.prototype.addSet=function(e){for(var t in e._hash)this.add(t)},e.prototype.remove=function(e){return e in this._hash?(delete this._hash[e],this._count--,!0):!1},e.prototype.removeSet=function(e){for(var t in e._hash)this.remove(t)},e.prototype.retainSet=function(e){for(var t in this._hash)e.contains(t)||(delete this._hash[t],this._count--)},e.prototype.contains=function(e){return e in this._hash},e.prototype.size=function(){return this._count},e.prototype.toArray=function(){var e=[];for(var t in this._hash)e.push(t);return e},e.prototype.visit=function(e){for(var t in this._hash)if(e(t)==1)break},e}),r("scripts/sorted-array",[],function(){var e=function(e,t){this._a=t instanceof Array?t:[],this._compare=e};return e.prototype.add=function(e){var t=this,n=this.find(function(n){return t._compare(n,e)});n<this._a.length?this._a.splice(n,0,e):this._a.push(e)},e.prototype.remove=function(e){var t=this,n=this.find(function(n){return t._compare(n,e)});while(n<this._a.length&&this._compare(this._a[n],e)==0){if(this._a[n]==e)return this._a.splice(n,1),!0;n++}return!1},e.prototype.removeAll=function(){this._a=[]},e.prototype.elementAt=function(e){return this._a[e]},e.prototype.length=function(){return this._a.length},e.prototype.find=function(e){var t=0,n=this._a.length;while(t<n){var r=Math.floor((t+n)/2),i=e(this._a[r]);if(r==t)return i<0?t+1:t;i<0?t=r:n=r}return t},e.prototype.getFirst=function(){return this._a.length>0?this._a[0]:null},e.prototype.getLast=function(){return this._a.length>0?this._a[this._a.length-1]:null},e}),r("scripts/units",["./date-time"],function(e){var t=new Object;return t.makeDefaultValue=function(){return new Date},t.cloneValue=function(e){return new Date(e.getTime())},t.getParser=function(t){typeof t=="string"&&(t=t.toLowerCase());var n=t=="iso8601"||t=="iso 8601"?e.parseIso8601DateTime:e.parseGregorianDateTime;return function(e){return typeof e!="undefined"&&e!==null&&typeof e.toUTCString=="function"?e:n(e)}},t.parseFromObject=function(t){return e.parseGregorianDateTime(t)},t.toNumber=function(e){return e.getTime()},t.fromNumber=function(e){return new Date(e)},t.compare=function(e,t){var n,r;return typeof e=="object"?n=e.getTime():n=Number(e),typeof t=="object"?r=t.getTime():r=Number(t),n-r},t.earlier=function(e,n){return t.compare(e,n)<0?e:n},t.later=function(e,n){return t.compare(e,n)>0?e:n},t.change=function(e,t){return new Date(e.getTime()+t)},t}),r("scripts/event-index",["./units","./sorted-array"],function(e,t){var n=function(n){var r=this;this._unit=n!=null?n:e,this._events=new t(function(e,t){return r._unit.compare(e.getStart(),t.getStart())}),this._idToEvent={},this._indexed=!0};return n.prototype.getUnit=function(){return this._unit},n.prototype.getEvent=function(e){return this._idToEvent[e]},n.prototype.add=function(e){this._events.add(e),this._idToEvent[e.getID()]=e,this._indexed=!1},n.prototype.removeAll=function(){this._events.removeAll(),this._idToEvent={},this._indexed=!1},n.prototype.getCount=function(){return this._events.length()},n.prototype.getIterator=function(e,t){return this._indexed||this._index(),new n._Iterator(this._events,e,t,this._unit)},n.prototype.getReverseIterator=function(e,t){return this._indexed||this._index(),new n._ReverseIterator(this._events,e,t,this._unit)},n.prototype.getAllIterator=function(){return new n._AllIterator(this._events)},n.prototype.getEarliestDate=function(){var e=this._events.getFirst();return e==null?null:e.getStart()},n.prototype.getLatestDate=function(){var e=this._events.getLast();if(e==null)return null;this._indexed||this._index();var t=e._earliestOverlapIndex,n=this._events.elementAt(t).getEnd();for(var r=t+1;r<this._events.length();r++)n=this._unit.later(n,this._events.elementAt(r).getEnd());return n},n.prototype._index=function(){var e=this._events.length();for(var t=0;t<e;t++){var n=this._events.elementAt(t);n._earliestOverlapIndex=t}var r=1;for(var t=0;t<e;t++){var n=this._events.elementAt(t),i=n.getEnd();r=Math.max(r,t+1);while(r<e){var s=this._events.elementAt(r),o=s.getStart();if(!(this._unit.compare(o,i)<0))break;s._earliestOverlapIndex=t,r++}}this._indexed=!0},n._Iterator=function(e,t,n,r){this._events=e,this._startDate=t,this._endDate=n,this._unit=r,this._currentIndex=e.find(function(e){return r.compare(e.getStart(),t)}),this._currentIndex-1>=0&&(this._currentIndex=this._events.elementAt(this._currentIndex-1)._earliestOverlapIndex),this._currentIndex--,this._maxIndex=e.find(function(e){return r.compare(e.getStart(),n)}),this._hasNext=!1,this._next=null,this._findNext()},n._Iterator.prototype={hasNext:function(){return this._hasNext},next:function(){if(this._hasNext){var e=this._next;return this._findNext(),e}return null},_findNext:function(){var e=this._unit;while(++this._currentIndex<this._maxIndex){var t=this._events.elementAt(this._currentIndex);if(e.compare(t.getStart(),this._endDate)<0&&e.compare(t.getEnd(),this._startDate)>0){this._next=t,this._hasNext=!0;return}}this._next=null,this._hasNext=!1}},n._ReverseIterator=function(e,t,n,r){this._events=e,this._startDate=t,this._endDate=n,this._unit=r,this._minIndex=e.find(function(e){return r.compare(e.getStart(),t)}),this._minIndex-1>=0&&(this._minIndex=this._events.elementAt(this._minIndex-1)._earliestOverlapIndex),this._maxIndex=e.find(function(e){return r.compare(e.getStart(),n)}),this._currentIndex=this._maxIndex,this._hasNext=!1,this._next=null,this._findNext()},n._ReverseIterator.prototype={hasNext:function(){return this._hasNext},next:function(){if(this._hasNext){var e=this._next;return this._findNext(),e}return null},_findNext:function(){var e=this._unit;while(--this._currentIndex>=this._minIndex){var t=this._events.elementAt(this._currentIndex);if(e.compare(t.getStart(),this._endDate)<0&&e.compare(t.getEnd(),this._startDate)>0){this._next=t,this._hasNext=!0;return}}this._next=null,this._hasNext=!1}},n._AllIterator=function(e){this._events=e,this._index=0},n._AllIterator.prototype={hasNext:function(){return this._index<this._events.length()},next:function(){return this._index<this._events.length()?this._events.elementAt(this._index++):null}},n}),r("scripts/ajax",["./debug"],function(e){var t=function(e){this._listeners=[],this._wildcardHandlerName=e};return t.prototype.add=function(e){this._listeners.push(e)},t.prototype.remove=function(e){var t=this._listeners;for(var n=0;n<t.length;n++)if(t[n]==e){t.splice(n,1);break}},t.prototype.fire=function(t,n){var r=[].concat(this._listeners);for(var i=0;i<r.length;i++){var s=r[i];if(t in s)try{s[t].apply(s,n)}catch(o){e.exception("Error firing event of name "+t,o)}else if(this._wildcardHandlerName!=null&&this._wildcardHandlerName in s)try{s[this._wildcardHandlerName].apply(s,[t])}catch(o){e.exception("Error firing event of name "+t+" to wildcard handler",o)}}},t}),r("scripts/history",["./ajax","./dom","./debug","./window-manager"],function(e,t,n,r){var i={maxHistoryLength:10,historyFile:"__history__.html",enabled:!0,_initialized:!1,_listeners:new e,_actions:[],_baseIndex:0,_currentIndex:0,_plainDocumentTitle:document.title};return i.formatHistoryEntryTitle=function(e){return i._plainDocumentTitle+" {"+e+"}"},i.initialize=function(){if(i._initialized)return;if(i.enabled){var e=document.createElement("iframe");e.id="simile-ajax-history",e.style.position="absolute",e.style.width="10px",e.style.height="10px",e.style.top="0px",e.style.left="0px",e.style.visibility="hidden",e.src=i.historyFile+"?0",document.body.appendChild(e),t.registerEvent(e,"load",i._handleIFrameOnLoad),i._iframe=e}i._initialized=!0},i.addListener=function(e){i._listeners.add(e)},i.removeListener=function(e){i._listeners.remove(e)},i.addAction=function(e){i._listeners.fire("onBeforePerform",[e]),window.setTimeout(function(){try{e.perform(),i._listeners.fire("onAfterPerform",[e]);if(i.enabled){i._actions=i._actions.slice(0,i._currentIndex-i._baseIndex),i._actions.push(e),i._currentIndex++;var t=i._actions.length-i.maxHistoryLength;t>0&&(i._actions=i._actions.slice(t),i._baseIndex+=t);try{i._iframe.contentWindow.location.search="?"+i._currentIndex}catch(r){var s=i.formatHistoryEntryTitle(e.label);document.title=s}}}catch(r){n.exception(r,"Error adding action {"+e.label+"} to history")}},0)},i.addLengthyAction=function(e,t,n){i.addAction({perform:e,undo:t,label:n,uiLayer:r.getBaseLayer(),lengthy:!0})},i._handleIFrameOnLoad=function(){try{var e=i._iframe.contentWindow.location.search,t=e.length==0?0:Math.max(0,parseInt(e.substr(1))),r=function(){var e=t-i._currentIndex;i._currentIndex+=e,i._baseIndex+=e,i._iframe.contentWindow.location.search="?"+t};if(t<i._currentIndex)i._listeners.fire("onBeforeUndoSeveral",[]),window.setTimeout(function(){while(i._currentIndex>t&&i._currentIndex>i._baseIndex){i._currentIndex--;var e=i._actions[i._currentIndex-i._baseIndex];try{e.undo()}catch(s){n.exception(s,"History: Failed to undo action {"+e.label+"}")}}i._listeners.fire("onAfterUndoSeveral",[]),r()},0);else if(t>i._currentIndex)i._listeners.fire("onBeforeRedoSeveral",[]),window.setTimeout(function(){while(i._currentIndex<t&&i._currentIndex-i._baseIndex<i._actions.length){var e=i._actions[i._currentIndex-i._baseIndex];try{e.perform()}catch(s){n.exception(s,"History: Failed to redo action {"+e.label+"}")}i._currentIndex++}i._listeners.fire("onAfterRedoSeveral",[]),r()},0);else{var s=i._currentIndex-i._baseIndex-1,o=s>=0&&s<i._actions.length?i.formatHistoryEntryTitle(i._actions[s].label):i._plainDocumentTitle;i._iframe.contentWindow.document.title=o,document.title=o}}catch(u){}},i.getNextUndoAction=function(){try{var e=i._currentIndex-i._baseIndex-1;return i._actions[e]}catch(t){return null}},i.getNextRedoAction=function(){try{var e=i._currentIndex-i._baseIndex;return i._actions[e]}catch(t){return null}},i}),r("simile-ajax",["./lib/domReady","./scripts/base","./scripts/platform","./scripts/debug","./scripts/xmlhttp","./scripts/dom","./scripts/bubble","./scripts/date-time","./scripts/string","./scripts/html","./scripts/set","./scripts/sorted-array","./scripts/event-index","./scripts/units","./scripts/ajax","./scripts/history","./scripts/window-manager"],function(e,t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m){t.Platform=n,t.Debug=r,t.XmlHttp=i,t.DOM=s,t.Graphics=o,t.DateTime=u,t.StringUtils=a,t.HTML=f,t.Set=l,t.SortedArray=c,t.EventIndex=h,t.NativeDateUnit=p,t.ListenerQueue=d,t.History=v,t.WindowManager=m;var g=function(e){return e.getElementsByTagName("head")[0]};return t.findScript=function(e,t){var n,r,i,s;n=e.documentElement.getElementsByTagName("script");for(r=0;r<n.length;r++){i=n[r].src,s=i.indexOf(t);if(s>=0)return i}return null},t.parseURLParameters=function(e,t,n){t=t||{},n=n||{},typeof e=="undefined"&&(e=location.href);var r=e.indexOf("?");if(r<0)return t;e=(e+"#").slice(r+1,e.indexOf("#"));var i=e.split("&"),s,o={},u=window.decodeURIComponent||unescape;for(var a=0;s=i[a];a++){var f=s.indexOf("="),l=u(s.slice(0,f)),c=o[l],h=u(s.slice(f+1));typeof c=="undefined"?c=[]:c instanceof Array||(c=[c]),o[l]=c.concat(h)}for(var a in o){if(!o.hasOwnProperty(a))continue;var p=n[a]||String,d=o[a];d instanceof Array||(d=[d]),p===Boolean&&d[0]=="false"?t[a]=!1:t[a]=p.apply(this,d)}return t},t.includeJavascriptFile=function(e,n,r,i,s){t.Debug.warn("Loading scripts is no longer a feature of SimileAjax. Use RequireJS instead.");return},t.includeJavascriptFiles=function(e,n,r){t.Debug.warn("Loading scripts is no longer a feature of SimileAjax. Use RequireJS instead.");return},t.includeCssFile=function(e,t){if(e.body==null)try{e.write("<link rel='stylesheet' href='"+t+"' type='text/css'/>");return}catch(n){}var r=e.createElement("link");r.setAttribute("rel","stylesheet"),r.setAttribute("type","text/css"),r.setAttribute("href",t),g(e).appendChild(r)},t.includeCssFiles=function(e,n,r){for(var i=0;i<r.length;i++)t.includeCssFile(e,n+r[i])},t.prefixURLs=function(e,t,n){for(var r=0;r<n.length;r++)e.push(t+n[r])},t.loadCSS=function(e){var n=["main.css"],r="simile-ajax-bundle.css";e=e||!0,e?t.includeCssFile(document,t.urlPrefix+"styles/"+r):t.includeCssFiles(document,t.urlPrefix+"styles/",n)},t.load=function(){if(typeof SimileAjax_urlPrefix=="string")t.urlPrefix=SimileAjax_urlPrefix;else{var e=null,n=["simile-ajax-api.js","simile-ajax-bundle.js"];for(var r=0;r<n.length;r++){var i=n[r];e=t.findScript(document,i);if(e!=null){t.urlPrefix=e.substr(0,e.indexOf(i));break}}if(e==null){t.error=new Error("Failed to derive URL prefix for Simile Ajax API code files");return}params=t.parseURLParameters(e,t.params,t.paramTypes)}t.loadCSS(),t.loaded=!0,t.History.initialize(),t.WindowManager.initialize()},e(t.load),t}),t("simile-ajax")});
define('scripts/base',["simile-ajax"], function(SimileAjax) {
    var Timeline = {
        // Note: version is also stored in the build.xml file
        "version": "3.0.0",  // use format 'pre 1.2.3' for trunk versions
        "ajax_lib_version": "3.0.0",
        "display_version": null,
        "HORIZONTAL": 0,
        "VERTICAL": 1,
        "_defaultTheme": null,
        "urlPrefix": null,
        "serverLocale": null,
        "clientLocale": null,
        "timelines": null,
        "params": {
            "bundle": true,
            "ajax": null
        },
        "paramTypes": {
            "bundle": Boolean,
            "ajax": String
        }
    };

    // cf method Timeline.writeVersion
    Timeline.display_version = Timeline.version + ' (with Ajax lib ' + Timeline.ajax_lib_version + ')';

    return Timeline;
});


/*! jQuery v1.10.2 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery-1.10.2.min.map
*/
(function(e,t){var n,r,i=typeof t,o=e.location,a=e.document,s=a.documentElement,l=e.jQuery,u=e.$,c={},p=[],f="1.10.2",d=p.concat,h=p.push,g=p.slice,m=p.indexOf,y=c.toString,v=c.hasOwnProperty,b=f.trim,x=function(e,t){return new x.fn.init(e,t,r)},w=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=/\S+/g,C=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,k=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,E=/^[\],:{}\s]*$/,S=/(?:^|:|,)(?:\s*\[)+/g,A=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,j=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,D=/^-ms-/,L=/-([\da-z])/gi,H=function(e,t){return t.toUpperCase()},q=function(e){(a.addEventListener||"load"===e.type||"complete"===a.readyState)&&(_(),x.ready())},_=function(){a.addEventListener?(a.removeEventListener("DOMContentLoaded",q,!1),e.removeEventListener("load",q,!1)):(a.detachEvent("onreadystatechange",q),e.detachEvent("onload",q))};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,n,r){var i,o;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof x?n[0]:n,x.merge(this,x.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:a,!0)),k.test(i[1])&&x.isPlainObject(n))for(i in n)x.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(o=a.getElementById(i[2]),o&&o.parentNode){if(o.id!==i[2])return r.find(e);this.length=1,this[0]=o}return this.context=a,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return g.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(g.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},l=1,u=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},l=2),"object"==typeof s||x.isFunction(s)||(s={}),u===l&&(s=this,--l);u>l;l++)if(null!=(o=arguments[l]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(x.isPlainObject(r)||(n=x.isArray(r)))?(n?(n=!1,a=e&&x.isArray(e)?e:[]):a=e&&x.isPlainObject(e)?e:{},s[i]=x.extend(c,a,r)):r!==t&&(s[i]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=l),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){if(e===!0?!--x.readyWait:!x.isReady){if(!a.body)return setTimeout(x.ready);x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(a,[x]),x.fn.trigger&&x(a).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray||function(e){return"array"===x.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?c[y.call(e)]||"object":typeof e},isPlainObject:function(e){var n;if(!e||"object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!v.call(e,"constructor")&&!v.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(r){return!1}if(x.support.ownLast)for(n in e)return v.call(e,n);for(n in e);return n===t||v.call(e,n)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||a;var r=k.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=x.trim(n),n&&E.test(n.replace(A,"@").replace(j,"]").replace(S,"")))?Function("return "+n)():(x.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||x.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&x.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(D,"ms-").replace(L,H)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:b&&!b.call("\ufeff\u00a0")?function(e){return null==e?"":b.call(e)}:function(e){return null==e?"":(e+"").replace(C,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(m)return m.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return d.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),x.isFunction(e)?(r=g.call(arguments,2),i=function(){return e.apply(n||this,r.concat(g.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):t},access:function(e,n,r,i,o,a,s){var l=0,u=e.length,c=null==r;if("object"===x.type(r)){o=!0;for(l in r)x.access(e,n,l,r[l],!0,a,s)}else if(i!==t&&(o=!0,x.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(x(e),n)})),n))for(;u>l;l++)n(e[l],r,s?i:i.call(e[l],l,n(e[l],r)));return o?e:c?n.call(e):u?n(e[0],r):a},now:function(){return(new Date).getTime()},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),x.ready.promise=function(t){if(!n)if(n=x.Deferred(),"complete"===a.readyState)setTimeout(x.ready);else if(a.addEventListener)a.addEventListener("DOMContentLoaded",q,!1),e.addEventListener("load",q,!1);else{a.attachEvent("onreadystatechange",q),e.attachEvent("onload",q);var r=!1;try{r=null==e.frameElement&&a.documentElement}catch(i){}r&&r.doScroll&&function o(){if(!x.isReady){try{r.doScroll("left")}catch(e){return setTimeout(o,50)}_(),x.ready()}}()}return n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){c["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=x(a),function(e,t){var n,r,i,o,a,s,l,u,c,p,f,d,h,g,m,y,v,b="sizzle"+-new Date,w=e.document,T=0,C=0,N=st(),k=st(),E=st(),S=!1,A=function(e,t){return e===t?(S=!0,0):0},j=typeof t,D=1<<31,L={}.hasOwnProperty,H=[],q=H.pop,_=H.push,M=H.push,O=H.slice,F=H.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},B="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",P="[\\x20\\t\\r\\n\\f]",R="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=R.replace("w","w#"),$="\\["+P+"*("+R+")"+P+"*(?:([*^$|!~]?=)"+P+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+P+"*\\]",I=":("+R+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+P+"+|((?:^|[^\\\\])(?:\\\\.)*)"+P+"+$","g"),X=RegExp("^"+P+"*,"+P+"*"),U=RegExp("^"+P+"*([>+~]|"+P+")"+P+"*"),V=RegExp(P+"*[+~]"),Y=RegExp("="+P+"*([^\\]'\"]*)"+P+"*\\]","g"),J=RegExp(I),G=RegExp("^"+W+"$"),Q={ID:RegExp("^#("+R+")"),CLASS:RegExp("^\\.("+R+")"),TAG:RegExp("^("+R.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+P+"*(even|odd|(([+-]|)(\\d*)n|)"+P+"*(?:([+-]|)"+P+"*(\\d+)|))"+P+"*\\)|)","i"),bool:RegExp("^(?:"+B+")$","i"),needsContext:RegExp("^"+P+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+P+"*((?:-\\d)?\\d*)"+P+"*\\)|)(?=[^-]|$)","i")},K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,et=/^(?:input|select|textarea|button)$/i,tt=/^h\d$/i,nt=/'|\\/g,rt=RegExp("\\\\([\\da-f]{1,6}"+P+"?|("+P+")|.)","ig"),it=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{M.apply(H=O.call(w.childNodes),w.childNodes),H[w.childNodes.length].nodeType}catch(ot){M={apply:H.length?function(e,t){_.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function at(e,t,n,i){var o,a,s,l,u,c,d,m,y,x;if((t?t.ownerDocument||t:w)!==f&&p(t),t=t||f,n=n||[],!e||"string"!=typeof e)return n;if(1!==(l=t.nodeType)&&9!==l)return[];if(h&&!i){if(o=Z.exec(e))if(s=o[1]){if(9===l){if(a=t.getElementById(s),!a||!a.parentNode)return n;if(a.id===s)return n.push(a),n}else if(t.ownerDocument&&(a=t.ownerDocument.getElementById(s))&&v(t,a)&&a.id===s)return n.push(a),n}else{if(o[2])return M.apply(n,t.getElementsByTagName(e)),n;if((s=o[3])&&r.getElementsByClassName&&t.getElementsByClassName)return M.apply(n,t.getElementsByClassName(s)),n}if(r.qsa&&(!g||!g.test(e))){if(m=d=b,y=t,x=9===l&&e,1===l&&"object"!==t.nodeName.toLowerCase()){c=mt(e),(d=t.getAttribute("id"))?m=d.replace(nt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",u=c.length;while(u--)c[u]=m+yt(c[u]);y=V.test(e)&&t.parentNode||t,x=c.join(",")}if(x)try{return M.apply(n,y.querySelectorAll(x)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return kt(e.replace(z,"$1"),t,n,i)}function st(){var e=[];function t(n,r){return e.push(n+=" ")>o.cacheLength&&delete t[e.shift()],t[n]=r}return t}function lt(e){return e[b]=!0,e}function ut(e){var t=f.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function ct(e,t){var n=e.split("|"),r=e.length;while(r--)o.attrHandle[n[r]]=t}function pt(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function ft(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function dt(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function ht(e){return lt(function(t){return t=+t,lt(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}s=at.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},r=at.support={},p=at.setDocument=function(e){var n=e?e.ownerDocument||e:w,i=n.defaultView;return n!==f&&9===n.nodeType&&n.documentElement?(f=n,d=n.documentElement,h=!s(n),i&&i.attachEvent&&i!==i.top&&i.attachEvent("onbeforeunload",function(){p()}),r.attributes=ut(function(e){return e.className="i",!e.getAttribute("className")}),r.getElementsByTagName=ut(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),r.getElementsByClassName=ut(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),r.getById=ut(function(e){return d.appendChild(e).id=b,!n.getElementsByName||!n.getElementsByName(b).length}),r.getById?(o.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){return e.getAttribute("id")===t}}):(delete o.find.ID,o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),o.find.TAG=r.getElementsByTagName?function(e,n){return typeof n.getElementsByTagName!==j?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},o.find.CLASS=r.getElementsByClassName&&function(e,n){return typeof n.getElementsByClassName!==j&&h?n.getElementsByClassName(e):t},m=[],g=[],(r.qsa=K.test(n.querySelectorAll))&&(ut(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||g.push("\\["+P+"*(?:value|"+B+")"),e.querySelectorAll(":checked").length||g.push(":checked")}),ut(function(e){var t=n.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&g.push("[*^$]="+P+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||g.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),g.push(",.*:")})),(r.matchesSelector=K.test(y=d.webkitMatchesSelector||d.mozMatchesSelector||d.oMatchesSelector||d.msMatchesSelector))&&ut(function(e){r.disconnectedMatch=y.call(e,"div"),y.call(e,"[s!='']:x"),m.push("!=",I)}),g=g.length&&RegExp(g.join("|")),m=m.length&&RegExp(m.join("|")),v=K.test(d.contains)||d.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},A=d.compareDocumentPosition?function(e,t){if(e===t)return S=!0,0;var i=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t);return i?1&i||!r.sortDetached&&t.compareDocumentPosition(e)===i?e===n||v(w,e)?-1:t===n||v(w,t)?1:c?F.call(c,e)-F.call(c,t):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return S=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:c?F.call(c,e)-F.call(c,t):0;if(o===a)return pt(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?pt(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},n):f},at.matches=function(e,t){return at(e,null,null,t)},at.matchesSelector=function(e,t){if((e.ownerDocument||e)!==f&&p(e),t=t.replace(Y,"='$1']"),!(!r.matchesSelector||!h||m&&m.test(t)||g&&g.test(t)))try{var n=y.call(e,t);if(n||r.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(i){}return at(t,f,null,[e]).length>0},at.contains=function(e,t){return(e.ownerDocument||e)!==f&&p(e),v(e,t)},at.attr=function(e,n){(e.ownerDocument||e)!==f&&p(e);var i=o.attrHandle[n.toLowerCase()],a=i&&L.call(o.attrHandle,n.toLowerCase())?i(e,n,!h):t;return a===t?r.attributes||!h?e.getAttribute(n):(a=e.getAttributeNode(n))&&a.specified?a.value:null:a},at.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},at.uniqueSort=function(e){var t,n=[],i=0,o=0;if(S=!r.detectDuplicates,c=!r.sortStable&&e.slice(0),e.sort(A),S){while(t=e[o++])t===e[o]&&(i=n.push(o));while(i--)e.splice(n[i],1)}return e},a=at.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=a(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=a(t);return n},o=at.selectors={cacheLength:50,createPseudo:lt,match:Q,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(rt,it),e[3]=(e[4]||e[5]||"").replace(rt,it),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||at.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&at.error(e[0]),e},PSEUDO:function(e){var n,r=!e[5]&&e[2];return Q.CHILD.test(e[0])?null:(e[3]&&e[4]!==t?e[2]=e[4]:r&&J.test(r)&&(n=mt(r,!0))&&(n=r.indexOf(")",r.length-n)-r.length)&&(e[0]=e[0].slice(0,n),e[2]=r.slice(0,n)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(rt,it).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=N[e+" "];return t||(t=RegExp("(^|"+P+")"+e+"("+P+"|$)"))&&N(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=at.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,l){var u,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!l&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[b]||(m[b]={}),u=c[e]||[],d=u[0]===T&&u[1],f=u[0]===T&&u[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[T,d,f];break}}else if(v&&(u=(t[b]||(t[b]={}))[e])&&u[0]===T)f=u[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[b]||(p[b]={}))[e]=[T,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=o.pseudos[e]||o.setFilters[e.toLowerCase()]||at.error("unsupported pseudo: "+e);return r[b]?r(t):r.length>1?(n=[e,e,"",t],o.setFilters.hasOwnProperty(e.toLowerCase())?lt(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=F.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:lt(function(e){var t=[],n=[],r=l(e.replace(z,"$1"));return r[b]?lt(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:lt(function(e){return function(t){return at(e,t).length>0}}),contains:lt(function(e){return function(t){return(t.textContent||t.innerText||a(t)).indexOf(e)>-1}}),lang:lt(function(e){return G.test(e||"")||at.error("unsupported lang: "+e),e=e.replace(rt,it).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===d},focus:function(e){return e===f.activeElement&&(!f.hasFocus||f.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!o.pseudos.empty(e)},header:function(e){return tt.test(e.nodeName)},input:function(e){return et.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:ht(function(){return[0]}),last:ht(function(e,t){return[t-1]}),eq:ht(function(e,t,n){return[0>n?n+t:n]}),even:ht(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:ht(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:ht(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:ht(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}},o.pseudos.nth=o.pseudos.eq;for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})o.pseudos[n]=ft(n);for(n in{submit:!0,reset:!0})o.pseudos[n]=dt(n);function gt(){}gt.prototype=o.filters=o.pseudos,o.setFilters=new gt;function mt(e,t){var n,r,i,a,s,l,u,c=k[e+" "];if(c)return t?0:c.slice(0);s=e,l=[],u=o.preFilter;while(s){(!n||(r=X.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),l.push(i=[])),n=!1,(r=U.exec(s))&&(n=r.shift(),i.push({value:n,type:r[0].replace(z," ")}),s=s.slice(n.length));for(a in o.filter)!(r=Q[a].exec(s))||u[a]&&!(r=u[a](r))||(n=r.shift(),i.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?at.error(e):k(e,l).slice(0)}function yt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function vt(e,t,n){var r=t.dir,o=n&&"parentNode"===r,a=C++;return t.first?function(t,n,i){while(t=t[r])if(1===t.nodeType||o)return e(t,n,i)}:function(t,n,s){var l,u,c,p=T+" "+a;if(s){while(t=t[r])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[r])if(1===t.nodeType||o)if(c=t[b]||(t[b]={}),(u=c[r])&&u[0]===p){if((l=u[1])===!0||l===i)return l===!0}else if(u=c[r]=[p],u[1]=e(t,n,s)||i,u[1]===!0)return!0}}function bt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,a=[],s=0,l=e.length,u=null!=t;for(;l>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),u&&t.push(s));return a}function wt(e,t,n,r,i,o){return r&&!r[b]&&(r=wt(r)),i&&!i[b]&&(i=wt(i,o)),lt(function(o,a,s,l){var u,c,p,f=[],d=[],h=a.length,g=o||Nt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:xt(g,f,e,s,l),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,l),r){u=xt(y,d),r(u,[],s,l),c=u.length;while(c--)(p=u[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){u=[],c=y.length;while(c--)(p=y[c])&&u.push(m[c]=p);i(null,y=[],u,l)}c=y.length;while(c--)(p=y[c])&&(u=i?F.call(o,p):f[c])>-1&&(o[u]=!(a[u]=p))}}else y=xt(y===a?y.splice(h,y.length):y),i?i(null,a,y,l):M.apply(a,y)})}function Tt(e){var t,n,r,i=e.length,a=o.relative[e[0].type],s=a||o.relative[" "],l=a?1:0,c=vt(function(e){return e===t},s,!0),p=vt(function(e){return F.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;i>l;l++)if(n=o.relative[e[l].type])f=[vt(bt(f),n)];else{if(n=o.filter[e[l].type].apply(null,e[l].matches),n[b]){for(r=++l;i>r;r++)if(o.relative[e[r].type])break;return wt(l>1&&bt(f),l>1&&yt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&Tt(e.slice(l,r)),i>r&&Tt(e=e.slice(r)),i>r&&yt(e))}f.push(n)}return bt(f)}function Ct(e,t){var n=0,r=t.length>0,a=e.length>0,s=function(s,l,c,p,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,C=u,N=s||a&&o.find.TAG("*",d&&l.parentNode||l),k=T+=null==C?1:Math.random()||.1;for(w&&(u=l!==f&&l,i=n);null!=(h=N[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,l,c)){p.push(h);break}w&&(T=k,i=++n)}r&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,r&&b!==v){g=0;while(m=t[g++])m(x,y,l,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=q.call(p));y=xt(y)}M.apply(p,y),w&&!s&&y.length>0&&v+t.length>1&&at.uniqueSort(p)}return w&&(T=k,u=C),x};return r?lt(s):s}l=at.compile=function(e,t){var n,r=[],i=[],o=E[e+" "];if(!o){t||(t=mt(e)),n=t.length;while(n--)o=Tt(t[n]),o[b]?r.push(o):i.push(o);o=E(e,Ct(i,r))}return o};function Nt(e,t,n){var r=0,i=t.length;for(;i>r;r++)at(e,t[r],n);return n}function kt(e,t,n,i){var a,s,u,c,p,f=mt(e);if(!i&&1===f.length){if(s=f[0]=f[0].slice(0),s.length>2&&"ID"===(u=s[0]).type&&r.getById&&9===t.nodeType&&h&&o.relative[s[1].type]){if(t=(o.find.ID(u.matches[0].replace(rt,it),t)||[])[0],!t)return n;e=e.slice(s.shift().value.length)}a=Q.needsContext.test(e)?0:s.length;while(a--){if(u=s[a],o.relative[c=u.type])break;if((p=o.find[c])&&(i=p(u.matches[0].replace(rt,it),V.test(s[0].type)&&t.parentNode||t))){if(s.splice(a,1),e=i.length&&yt(s),!e)return M.apply(n,i),n;break}}}return l(e,f)(i,t,!h,n,V.test(e)),n}r.sortStable=b.split("").sort(A).join("")===b,r.detectDuplicates=S,p(),r.sortDetached=ut(function(e){return 1&e.compareDocumentPosition(f.createElement("div"))}),ut(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||ct("type|href|height|width",function(e,n,r){return r?t:e.getAttribute(n,"type"===n.toLowerCase()?1:2)}),r.attributes&&ut(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||ct("value",function(e,n,r){return r||"input"!==e.nodeName.toLowerCase()?t:e.defaultValue}),ut(function(e){return null==e.getAttribute("disabled")})||ct(B,function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&i.specified?i.value:e[n]===!0?n.toLowerCase():null}),x.find=at,x.expr=at.selectors,x.expr[":"]=x.expr.pseudos,x.unique=at.uniqueSort,x.text=at.getText,x.isXMLDoc=at.isXML,x.contains=at.contains}(e);var O={};function F(e){var t=O[e]={};return x.each(e.match(T)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?O[e]||F(e):x.extend({},e);var n,r,i,o,a,s,l=[],u=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=l.length,n=!0;l&&o>a;a++)if(l[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,l&&(u?u.length&&c(u.shift()):r?l=[]:p.disable())},p={add:function(){if(l){var t=l.length;(function i(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&p.has(n)||l.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=l.length:r&&(s=t,c(r))}return this},remove:function(){return l&&x.each(arguments,function(e,t){var r;while((r=x.inArray(t,l,r))>-1)l.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?x.inArray(e,l)>-1:!(!l||!l.length)},empty:function(){return l=[],o=0,this},disable:function(){return l=u=r=t,this},disabled:function(){return!l},lock:function(){return u=t,r||p.disable(),this},locked:function(){return!u},fireWith:function(e,t){return!l||i&&!u||(t=t||[],t=[e,t.slice?t.slice():t],n?u.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var a=o[0],s=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=g.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?g.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,l,u;if(r>1)for(s=Array(r),l=Array(r),u=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(a(t,u,n)).fail(o.reject).progress(a(t,l,s)):--i;return i||o.resolveWith(u,n),o.promise()}}),x.support=function(t){var n,r,o,s,l,u,c,p,f,d=a.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*")||[],r=d.getElementsByTagName("a")[0],!r||!r.style||!n.length)return t;s=a.createElement("select"),u=s.appendChild(a.createElement("option")),o=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t.getSetAttribute="t"!==d.className,t.leadingWhitespace=3===d.firstChild.nodeType,t.tbody=!d.getElementsByTagName("tbody").length,t.htmlSerialize=!!d.getElementsByTagName("link").length,t.style=/top/.test(r.getAttribute("style")),t.hrefNormalized="/a"===r.getAttribute("href"),t.opacity=/^0.5/.test(r.style.opacity),t.cssFloat=!!r.style.cssFloat,t.checkOn=!!o.value,t.optSelected=u.selected,t.enctype=!!a.createElement("form").enctype,t.html5Clone="<:nav></:nav>"!==a.createElement("nav").cloneNode(!0).outerHTML,t.inlineBlockNeedsLayout=!1,t.shrinkWrapBlocks=!1,t.pixelPosition=!1,t.deleteExpando=!0,t.noCloneEvent=!0,t.reliableMarginRight=!0,t.boxSizingReliable=!0,o.checked=!0,t.noCloneChecked=o.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!u.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}o=a.createElement("input"),o.setAttribute("value",""),t.input=""===o.getAttribute("value"),o.value="t",o.setAttribute("type","radio"),t.radioValue="t"===o.value,o.setAttribute("checked","t"),o.setAttribute("name","t"),l=a.createDocumentFragment(),l.appendChild(o),t.appendChecked=o.checked,t.checkClone=l.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip;for(f in x(t))break;return t.ownLast="0"!==f,x(function(){var n,r,o,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",l=a.getElementsByTagName("body")[0];l&&(n=a.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",l.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",o=d.getElementsByTagName("td"),o[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===o[0].offsetHeight,o[0].style.display="",o[1].style.display="none",t.reliableHiddenOffsets=p&&0===o[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",x.swap(l,null!=l.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===d.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(a.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(l.style.zoom=1)),l.removeChild(n),n=d=o=r=null)}),n=s=l=u=r=o=null,t
}({});var B=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;function R(e,n,r,i){if(x.acceptData(e)){var o,a,s=x.expando,l=e.nodeType,u=l?x.cache:e,c=l?e[s]:e[s]&&s;if(c&&u[c]&&(i||u[c].data)||r!==t||"string"!=typeof n)return c||(c=l?e[s]=p.pop()||x.guid++:s),u[c]||(u[c]=l?{}:{toJSON:x.noop}),("object"==typeof n||"function"==typeof n)&&(i?u[c]=x.extend(u[c],n):u[c].data=x.extend(u[c].data,n)),a=u[c],i||(a.data||(a.data={}),a=a.data),r!==t&&(a[x.camelCase(n)]=r),"string"==typeof n?(o=a[n],null==o&&(o=a[x.camelCase(n)])):o=a,o}}function W(e,t,n){if(x.acceptData(e)){var r,i,o=e.nodeType,a=o?x.cache:e,s=o?e[x.expando]:x.expando;if(a[s]){if(t&&(r=n?a[s]:a[s].data)){x.isArray(t)?t=t.concat(x.map(t,x.camelCase)):t in r?t=[t]:(t=x.camelCase(t),t=t in r?[t]:t.split(" ")),i=t.length;while(i--)delete r[t[i]];if(n?!I(r):!x.isEmptyObject(r))return}(n||(delete a[s].data,I(a[s])))&&(o?x.cleanData([e],!0):x.support.deleteExpando||a!=a.window?delete a[s]:a[s]=null)}}}x.extend({cache:{},noData:{applet:!0,embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(e){return e=e.nodeType?x.cache[e[x.expando]]:e[x.expando],!!e&&!I(e)},data:function(e,t,n){return R(e,t,n)},removeData:function(e,t){return W(e,t)},_data:function(e,t,n){return R(e,t,n,!0)},_removeData:function(e,t){return W(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&x.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),x.fn.extend({data:function(e,n){var r,i,o=null,a=0,s=this[0];if(e===t){if(this.length&&(o=x.data(s),1===s.nodeType&&!x._data(s,"parsedAttrs"))){for(r=s.attributes;r.length>a;a++)i=r[a].name,0===i.indexOf("data-")&&(i=x.camelCase(i.slice(5)),$(s,i,o[i]));x._data(s,"parsedAttrs",!0)}return o}return"object"==typeof e?this.each(function(){x.data(this,e)}):arguments.length>1?this.each(function(){x.data(this,e,n)}):s?$(s,e,x.data(s,e)):null},removeData:function(e){return this.each(function(){x.removeData(this,e)})}});function $(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(P,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:B.test(r)?x.parseJSON(r):r}catch(o){}x.data(e,n,r)}else r=t}return r}function I(e){var t;for(t in e)if(("data"!==t||!x.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}x.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=x._data(e,n),r&&(!i||x.isArray(r)?i=x._data(e,n,x.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),a=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return x._data(e,n)||x._data(e,n,{empty:x.Callbacks("once memory").add(function(){x._removeData(e,t+"queue"),x._removeData(e,n)})})}}),x.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?x.queue(this[0],e):n===t?this:this.each(function(){var t=x.queue(this,e,n);x._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=x.Deferred(),a=this,s=this.length,l=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=x._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(l));return l(),o.promise(n)}});var z,X,U=/[\t\r\n\f]/g,V=/\r/g,Y=/^(?:input|select|textarea|button|object)$/i,J=/^(?:a|area)$/i,G=/^(?:checked|selected)$/i,Q=x.support.getSetAttribute,K=x.support.input;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return e=x.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,l="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,l=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e;return"boolean"==typeof t&&"string"===n?t?this.addClass(e):this.removeClass(e):x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var t,r=0,o=x(this),a=e.match(T)||[];while(t=a[r++])o.hasClass(t)?o.removeClass(t):o.addClass(t)}else(n===i||"boolean"===n)&&(this.className&&x._data(this,"__className__",this.className),this.className=this.className||e===!1?"":x._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(U," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=x.isFunction(e),this.each(function(n){var o;1===this.nodeType&&(o=i?e.call(this,n,x(this).val()):e,null==o?o="":"number"==typeof o?o+="":x.isArray(o)&&(o=x.map(o,function(e){return null==e?"":e+""})),r=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=x.valHooks[o.type]||x.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(V,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=x.find.attr(e,"value");return null!=t?t:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,l=0>i?s:o?i:0;for(;s>l;l++)if(n=r[l],!(!n.selected&&l!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),a=i.length;while(a--)r=i[a],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,n,r){var o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===i?x.prop(e,n,r):(1===s&&x.isXMLDoc(e)||(n=n.toLowerCase(),o=x.attrHooks[n]||(x.expr.match.bool.test(n)?X:z)),r===t?o&&"get"in o&&null!==(a=o.get(e,n))?a:(a=x.find.attr(e,n),null==a?t:a):null!==r?o&&"set"in o&&(a=o.set(e,r,n))!==t?a:(e.setAttribute(n,r+""),r):(x.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(T);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)?K&&Q||!G.test(n)?e[r]=!1:e[x.camelCase("default-"+n)]=e[r]=!1:x.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!x.isXMLDoc(e),a&&(n=x.propFix[n]||n,o=x.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var t=x.find.attr(e,"tabindex");return t?parseInt(t,10):Y.test(e.nodeName)||J.test(e.nodeName)&&e.href?0:-1}}}}),X={set:function(e,t,n){return t===!1?x.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&x.propFix[n]||n,n):e[x.camelCase("default-"+n)]=e[n]=!0,n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,n){var r=x.expr.attrHandle[n]||x.find.attr;x.expr.attrHandle[n]=K&&Q||!G.test(n)?function(e,n,i){var o=x.expr.attrHandle[n],a=i?t:(x.expr.attrHandle[n]=t)!=r(e,n,i)?n.toLowerCase():null;return x.expr.attrHandle[n]=o,a}:function(e,n,r){return r?t:e[x.camelCase("default-"+n)]?n.toLowerCase():null}}),K&&Q||(x.attrHooks.value={set:function(e,n,r){return x.nodeName(e,"input")?(e.defaultValue=n,t):z&&z.set(e,n,r)}}),Q||(z={set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},x.expr.attrHandle.id=x.expr.attrHandle.name=x.expr.attrHandle.coords=function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&""!==i.value?i.value:null},x.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&r.specified?r.value:t},set:z.set},x.attrHooks.contenteditable={set:function(e,t,n){z.set(e,""===t?!1:t,n)}},x.each(["width","height"],function(e,n){x.attrHooks[n]={set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}}})),x.support.hrefNormalized||x.each(["href","src"],function(e,t){x.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}}),x.support.style||(x.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.support.enctype||(x.propFix.enctype="encoding"),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,n){return x.isArray(n)?e.checked=x.inArray(x(e).val(),n)>=0:t}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}function at(){try{return a.activeElement}catch(e){}}x.event={global:{},add:function(e,n,r,o,a){var s,l,u,c,p,f,d,h,g,m,y,v=x._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=x.guid++),(l=v.events)||(l=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof x===i||e&&x.event.triggered===e.type?t:x.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(T)||[""],u=n.length;while(u--)s=rt.exec(n[u])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),g&&(p=x.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=x.event.special[g]||{},d=x.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&x.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=l[g])||(h=l[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),x.event.global[g]=!0);e=null}},remove:function(e,t,n,r,i){var o,a,s,l,u,c,p,f,d,h,g,m=x.hasData(e)&&x._data(e);if(m&&(c=m.events)){t=(t||"").match(T)||[""],u=t.length;while(u--)if(s=rt.exec(t[u])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=x.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),l=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));l&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||x.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)x.event.remove(e,d+t[u],n,r,!0);x.isEmptyObject(c)&&(delete m.handle,x._removeData(e,"events"))}},trigger:function(n,r,i,o){var s,l,u,c,p,f,d,h=[i||a],g=v.call(n,"type")?n.type:n,m=v.call(n,"namespace")?n.namespace.split("."):[];if(u=f=i=i||a,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+x.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),l=0>g.indexOf(":")&&"on"+g,n=n[x.expando]?n:new x.Event(g,"object"==typeof n&&n),n.isTrigger=o?2:3,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:x.makeArray(r,[n]),p=x.event.special[g]||{},o||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!o&&!p.noBubble&&!x.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(u=u.parentNode);u;u=u.parentNode)h.push(u),f=u;f===(i.ownerDocument||a)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((u=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(x._data(u,"events")||{})[n.type]&&x._data(u,"handle"),s&&s.apply(u,r),s=l&&u[l],s&&x.acceptData(u)&&s.apply&&s.apply(u,r)===!1&&n.preventDefault();if(n.type=g,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(h.pop(),r)===!1)&&x.acceptData(i)&&l&&i[g]&&!x.isWindow(i)){f=i[l],f&&(i[l]=null),x.event.triggered=g;try{i[g]()}catch(y){}x.event.triggered=t,f&&(i[l]=f)}return n.result}},dispatch:function(e){e=x.event.fix(e);var n,r,i,o,a,s=[],l=g.call(arguments),u=(x._data(this,"events")||{})[e.type]||[],c=x.event.special[e.type]||{};if(l[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((x.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,l),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],l=n.delegateCount,u=e.target;if(l&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!=this;u=u.parentNode||this)if(1===u.nodeType&&(u.disabled!==!0||"click"!==e.type)){for(o=[],a=0;l>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?x(r,this).index(u)>=0:x.find(r,this,null,[u]).length),o[r]&&o.push(i);o.length&&s.push({elem:u,handlers:o})}return n.length>l&&s.push({elem:this,handlers:n.slice(l)}),s},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return e.target||(e.target=o.srcElement||a),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,o):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,o,s=n.button,l=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||a,o=i.documentElement,r=i.body,e.pageX=n.clientX+(o&&o.scrollLeft||r&&r.scrollLeft||0)-(o&&o.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(o&&o.scrollTop||r&&r.scrollTop||0)-(o&&o.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&l&&(e.relatedTarget=l===e.target?n.toElement:l),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==at()&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===at()&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},click:{trigger:function(){return x.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=a.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},x.Event=function(e,n){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&x.extend(this,n),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,t):new x.Event(e,n)},x.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.submitBubbles||(x.event.special.submit={setup:function(){return x.nodeName(this,"form")?!1:(x.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=x.nodeName(n,"input")||x.nodeName(n,"button")?n.form:t;r&&!x._data(r,"submitBubbles")&&(x.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),x._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&x.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return x.nodeName(this,"form")?!1:(x.event.remove(this,"._submit"),t)}}),x.support.changeBubbles||(x.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(x.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),x.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),x.event.simulate("change",this,e,!0)})),!1):(x.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!x._data(t,"changeBubbles")&&(x.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||x.event.simulate("change",this.parentNode,e,!0)}),x._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return x.event.remove(this,"._change"),!Z.test(this.nodeName)}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&a.addEventListener(e,r,!0)},teardown:function(){0===--n&&a.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return x().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=x.guid++)),this.each(function(){x.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,x(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){x.event.remove(this,e,r,n)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?x.event.trigger(e,n,r,!0):t}});var st=/^.[^:#\[\.,]*$/,lt=/^(?:parents|prev(?:Until|All))/,ut=x.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t,n=x(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(x.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e||[],!0))},filter:function(e){return this.pushStack(ft(this,e||[],!1))},is:function(e){return!!ft(this,"string"==typeof e&&ut.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],a=ut.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(a?a.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?x.inArray(this[0],x(e)):x.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(ct[e]||(i=x.unique(i)),lt.test(e)&&(i=i.reverse())),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!x(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(st.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return x.inArray(e,t)>=0!==n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Ct=/^(?:checkbox|radio)$/i,Nt=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:x.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(a),Dt=jt.appendChild(a.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===t?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||a).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(Ft(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&_t(Ft(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&x.cleanData(Ft(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&x.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!x.support.htmlSerialize&&mt.test(e)||!x.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(x.cleanData(Ft(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=d.apply([],e);var r,i,o,a,s,l,u=0,c=this.length,p=this,f=c-1,h=e[0],g=x.isFunction(h);if(g||!(1>=c||"string"!=typeof h||x.support.checkClone)&&Nt.test(h))return this.each(function(r){var i=p.eq(r);g&&(e[0]=h.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(l=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),r=l.firstChild,1===l.childNodes.length&&(l=r),r)){for(a=x.map(Ft(l,"script"),Ht),o=a.length;c>u;u++)i=l,u!==f&&(i=x.clone(i,!0,!0),o&&x.merge(a,Ft(i,"script"))),t.call(this[u],i,u);if(o)for(s=a[a.length-1].ownerDocument,x.map(a,qt),u=0;o>u;u++)i=a[u],kt.test(i.type||"")&&!x._data(i,"globalEval")&&x.contains(s,i)&&(i.src?x._evalUrl(i.src):x.globalEval((i.text||i.textContent||i.innerHTML||"").replace(St,"")));l=r=null}return this}});function Lt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function Ht(e){return e.type=(null!==x.find.attr(e,"type"))+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function _t(e,t){var n,r=0;for(;null!=(n=e[r]);r++)x._data(n,"globalEval",!t||x._data(t[r],"globalEval"))}function Mt(e,t){if(1===t.nodeType&&x.hasData(e)){var n,r,i,o=x._data(e),a=x._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)x.event.add(t,n,s[n][r])}a.data&&(a.data=x.extend({},a.data))}}function Ot(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!x.support.noCloneEvent&&t[x.expando]){i=x._data(t);for(r in i.events)x.removeEvent(t,r,i.handle);t.removeAttribute(x.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),x.support.html5Clone&&e.innerHTML&&!x.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Ct.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=0,i=[],o=x(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),x(o[r])[t](n),h.apply(i,n.get());return this.pushStack(i)}});function Ft(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||x.nodeName(o,n)?s.push(o):x.merge(s,Ft(o,n));return n===t||n&&x.nodeName(e,n)?x.merge([e],s):s}function Bt(e){Ct.test(e.type)&&(e.defaultChecked=e.checked)}x.extend({clone:function(e,t,n){var r,i,o,a,s,l=x.contains(e.ownerDocument,e);if(x.support.html5Clone||x.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(x.support.noCloneEvent&&x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(r=Ft(o),s=Ft(e),a=0;null!=(i=s[a]);++a)r[a]&&Ot(i,r[a]);if(t)if(n)for(s=s||Ft(e),r=r||Ft(o),a=0;null!=(i=s[a]);a++)Mt(i,r[a]);else Mt(e,o);return r=Ft(o,"script"),r.length>0&&_t(r,!l&&Ft(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,l,u,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===x.type(o))x.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),l=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[l]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!x.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!x.support.tbody){o="table"!==l||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)x.nodeName(u=o.childNodes[i],"tbody")&&!u.childNodes.length&&o.removeChild(u)}x.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),x.support.appendChecked||x.grep(Ft(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===x.inArray(o,r))&&(a=x.contains(o.ownerDocument,o),s=Ft(f.appendChild(o),"script"),a&&_t(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,l=x.expando,u=x.cache,c=x.support.deleteExpando,f=x.event.special;for(;null!=(n=e[s]);s++)if((t||x.acceptData(n))&&(o=n[l],a=o&&u[o])){if(a.events)for(r in a.events)f[r]?x.event.remove(n,r):x.removeEvent(n,r,a.handle);
u[o]&&(delete u[o],c?delete n[l]:typeof n.removeAttribute!==i?n.removeAttribute(l):n[l]=null,p.push(o))}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}}),x.fn.extend({wrapAll:function(e){if(x.isFunction(e))return this.each(function(t){x(this).wrapAll(e.call(this,t))});if(this[0]){var t=x(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+w+")(.*)$","i"),Yt=RegExp("^("+w+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+w+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=x._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=x._data(r,"olddisplay",ln(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&x._data(r,"olddisplay",i?n:x.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}x.fn.extend({css:function(e,n){return x.access(this,function(e,n,r){var i,o,a={},s=0;if(x.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=x.css(e,n[s],!1,o);return a}return r!==t?x.style(e,n,r):x.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){nn(this)?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":x.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,l=x.camelCase(n),u=e.style;if(n=x.cssProps[l]||(x.cssProps[l]=tn(u,l)),s=x.cssHooks[n]||x.cssHooks[l],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:u[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(x.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||x.cssNumber[l]||(r+="px"),x.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(u[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{u[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,l=x.camelCase(n);return n=x.cssProps[l]||(x.cssProps[l]=tn(e.style,l)),s=x.cssHooks[n]||x.cssHooks[l],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||x.isNumeric(o)?o||0:a):a}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s.getPropertyValue(n)||s[n]:t,u=e.style;return s&&(""!==l||x.contains(e.ownerDocument,e)||(l=x.style(e,n)),Yt.test(l)&&Ut.test(n)&&(i=u.width,o=u.minWidth,a=u.maxWidth,u.minWidth=u.maxWidth=u.width=l,l=s.width,u.width=i,u.minWidth=o,u.maxWidth=a)),l}):a.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s[n]:t,u=e.style;return null==l&&u&&u[n]&&(l=u[n]),Yt.test(l)&&!zt.test(n)&&(i=u.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),u.left="fontSize"===n?"1em":l,l=u.pixelLeft+"px",u.left=i,a&&(o.left=a)),""===l?"auto":l});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=x.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=x.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=x.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=x.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=x.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function ln(e){var t=a,n=Gt[e];return n||(n=un(e,t),"none"!==n&&n||(Pt=(Pt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=un(e,t),Pt.detach()),Gt[e]=n),n}function un(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,n){x.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(x.css(e,"display"))?x.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x.support.opacity||(x.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=x.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===x.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,n){return n?x.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,n){x.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?x(e).position()[n]+"px":r):t}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!x.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||x.css(e,"display"))},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(x.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Ct.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),x.param=function(e,n){var r,i=[],o=function(e,t){t=x.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var mn,yn,vn=x.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Cn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Nn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=x.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=o.href}catch(Ln){yn=a.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(T)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(l){var u;return o[l]=!0,x.each(e[l]||[],function(e,l){var c=l(n,r,i);return"string"!=typeof c||a||o[c]?a?!(u=c):t:(n.dataTypes.unshift(c),s(c),!1)}),u}return s(n.dataTypes[0])||!o["*"]&&s("*")}function _n(e,n){var r,i,o=x.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,l=e.indexOf(" ");return l>=0&&(i=e.slice(l,e.length),e=e.slice(0,l)),x.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&x.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?x("<div>").append(x.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Cn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?_n(_n(e,x.ajaxSettings),t):_n(x.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,l,u,c,p=x.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),g=x.Callbacks("once memory"),m=p.statusCode||{},y={},v={},b=0,w="canceled",C={readyState:0,getResponseHeader:function(e){var t;if(2===b){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===b?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return b||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return b||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>b)for(t in e)m[t]=[m[t],e[t]];else C.always(e[C.status]);return this},abort:function(e){var t=e||w;return u&&u.abort(t),k(0,t),this}};if(h.promise(C).complete=g.add,C.success=C.done,C.error=C.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=x.trim(p.dataType||"*").toLowerCase().match(T)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?"80":"443"))===(mn[3]||("http:"===mn[1]?"80":"443")))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=x.param(p.data,p.traditional)),qn(An,p,n,C),2===b)return C;l=p.global,l&&0===x.active++&&x.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Nn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(x.lastModified[o]&&C.setRequestHeader("If-Modified-Since",x.lastModified[o]),x.etag[o]&&C.setRequestHeader("If-None-Match",x.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&C.setRequestHeader("Content-Type",p.contentType),C.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)C.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,C,p)===!1||2===b))return C.abort();w="abort";for(i in{success:1,error:1,complete:1})C[i](p[i]);if(u=qn(jn,p,n,C)){C.readyState=1,l&&d.trigger("ajaxSend",[C,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){C.abort("timeout")},p.timeout));try{b=1,u.send(y,k)}catch(N){if(!(2>b))throw N;k(-1,N)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,N=n;2!==b&&(b=2,s&&clearTimeout(s),u=t,a=i||"",C.readyState=e>0?4:0,c=e>=200&&300>e||304===e,r&&(w=Mn(p,C,r)),w=On(p,w,C,c),c?(p.ifModified&&(T=C.getResponseHeader("Last-Modified"),T&&(x.lastModified[o]=T),T=C.getResponseHeader("etag"),T&&(x.etag[o]=T)),204===e||"HEAD"===p.type?N="nocontent":304===e?N="notmodified":(N=w.state,y=w.data,v=w.error,c=!v)):(v=N,(e||!N)&&(N="error",0>e&&(e=0))),C.status=e,C.statusText=(n||N)+"",c?h.resolveWith(f,[y,N,C]):h.rejectWith(f,[C,N,v]),C.statusCode(m),m=t,l&&d.trigger(c?"ajaxSuccess":"ajaxError",[C,p,c?y:v]),g.fireWith(f,[C,N]),l&&(d.trigger("ajaxComplete",[C,p]),--x.active||x.event.trigger("ajaxStop")))}return C},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,n){return x.get(e,t,n,"script")}}),x.each(["get","post"],function(e,n){x[n]=function(e,r,i,o){return x.isFunction(r)&&(o=o||i,i=r,r=t),x.ajax({url:e,type:n,dataType:o,data:r,success:i})}});function Mn(e,n,r){var i,o,a,s,l=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in l)if(l[s]&&l[s].test(o)){u.unshift(s);break}if(u[0]in r)a=u[0];else{for(s in r){if(!u[0]||e.converters[s+" "+u[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==u[0]&&u.unshift(a),r[a]):t}function On(e,t,n,r){var i,o,a,s,l,u={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)u[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!l&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),l=o,o=c.shift())if("*"===o)o=l;else if("*"!==l&&l!==o){if(a=u[l+" "+o]||u["* "+o],!a)for(i in u)if(s=i.split(" "),s[1]===o&&(a=u[l+" "+s[0]]||u["* "+s[0]])){a===!0?a=u[i]:u[i]!==!0&&(o=s[0],c.unshift(s[1]));break}if(a!==!0)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(p){return{state:"parsererror",error:a?p:"No conversion from "+l+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),x.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=a.head||x("head")[0]||a.documentElement;return{send:function(t,i){n=a.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var Fn=[],Bn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Fn.pop()||x.expando+"_"+vn++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,l=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return l||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=x.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,l?n[l]=n[l].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||x.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,Fn.push(o)),s&&x.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}x.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=x.ajaxSettings.xhr(),x.support.cors=!!Rn&&"withCredentials"in Rn,Rn=x.support.ajax=!!Rn,Rn&&x.ajaxTransport(function(n){if(!n.crossDomain||x.support.cors){var r;return{send:function(i,o){var a,s,l=n.xhr();if(n.username?l.open(n.type,n.url,n.async,n.username,n.password):l.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)l[s]=n.xhrFields[s];n.mimeType&&l.overrideMimeType&&l.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)l.setRequestHeader(s,i[s])}catch(u){}l.send(n.hasContent&&n.data||null),r=function(e,i){var s,u,c,p;try{if(r&&(i||4===l.readyState))if(r=t,a&&(l.onreadystatechange=x.noop,$n&&delete Pn[a]),i)4!==l.readyState&&l.abort();else{p={},s=l.status,u=l.getAllResponseHeaders(),"string"==typeof l.responseText&&(p.text=l.responseText);try{c=l.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,u)},n.async?4===l.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},x(e).unload($n)),Pn[a]=r),l.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+w+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Yn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),a=(x.cssNumber[e]||"px"!==o&&+r)&&Yn.exec(x.css(n.elem,e)),s=1,l=20;if(a&&a[3]!==o){o=o||a[3],i=i||[],a=+r||1;do s=s||".5",a/=s,x.style(n.elem,e,a+o);while(s!==(s=n.cur()/r)&&1!==s&&--l)}return i&&(a=n.start=+a||+r||0,n.unit=o,n.end=i[1]?a+(i[1]+1)*i[2]:+i[2]),n}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=x.now()}function Zn(e,t,n){var r,i=(Qn[t]||[]).concat(Qn["*"]),o=0,a=i.length;for(;a>o;o++)if(r=i[o].call(n,t,e))return r}function er(e,t,n){var r,i,o=0,a=Gn.length,s=x.Deferred().always(function(){delete l.elem}),l=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,u.startTime+u.duration-t),r=n/u.duration||0,o=1-r,a=0,l=u.tweens.length;for(;l>a;a++)u.tweens[a].run(o);return s.notifyWith(e,[u,o,n]),1>o&&l?n:(s.resolveWith(e,[u]),!1)},u=s.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,u.opts,t,n,u.opts.specialEasing[t]||u.opts.easing);return u.tweens.push(r),r},stop:function(t){var n=0,r=t?u.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)u.tweens[n].run(1);return t?s.resolveWith(e,[u,t]):s.rejectWith(e,[u,t]),this}}),c=u.props;for(tr(c,u.opts.specialEasing);a>o;o++)if(r=Gn[o].call(u,e,c,u.opts))return r;return x.map(c,Zn,u),x.isFunction(u.opts.start)&&u.opts.start.call(e,u),x.fx.timer(x.extend(l,{elem:e,anim:u,queue:u.opts.queue})),u.progress(u.opts.progress).done(u.opts.done,u.opts.complete).fail(u.opts.fail).always(u.opts.always)}function tr(e,t){var n,r,i,o,a;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),a=x.cssHooks[r],a&&"expand"in a){o=a.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(er,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,l,u=this,c={},p=e.style,f=e.nodeType&&nn(e),d=x._data(e,"fxshow");n.queue||(s=x._queueHooks(e,"fx"),null==s.unqueued&&(s.unqueued=0,l=s.empty.fire,s.empty.fire=function(){s.unqueued||l()}),s.unqueued++,u.always(function(){u.always(function(){s.unqueued--,x.queue(e,"fx").length||s.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(x.support.inlineBlockNeedsLayout&&"inline"!==ln(e.nodeName)?p.zoom=1:p.display="inline-block")),n.overflow&&(p.overflow="hidden",x.support.shrinkWrapBlocks||u.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],Vn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show"))continue;c[r]=d&&d[r]||x.style(e,r)}if(!x.isEmptyObject(c)){d?"hidden"in d&&(f=d.hidden):d=x._data(e,"fxshow",{}),o&&(d.hidden=!f),f?x(e).show():u.done(function(){x(e).hide()}),u.done(function(){var t;x._removeData(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)a=Zn(f?d[r]:0,r,u),r in d||(d[r]=a.start,f&&(a.end=a.start,a.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}x.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),a=function(){var t=er(this,x.extend({},e),o);(i||x._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=x.timers,a=x._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=x._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,a=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=rr.prototype.init,x.fx.tick=function(){var e,n=x.timers,r=0;for(Xn=x.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||x.fx.stop(),Xn=t},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){Un||(Un=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(Un),Un=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){x.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,x.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},x.offset={setOffset:function(e,t,n){var r=x.css(e,"position");"static"===r&&(e.style.position="relative");var i=x(e),o=i.offset(),a=x.css(e,"top"),s=x.css(e,"left"),l=("absolute"===r||"fixed"===r)&&x.inArray("auto",[a,s])>-1,u={},c={},p,f;l?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),x.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(u.top=t.top-o.top+p),null!=t.left&&(u.left=t.left-o.left+f),"using"in t?t.using.call(e,u):i.css(u)}},x.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===x.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(n=e.offset()),n.top+=x.css(e[0],"borderTopWidth",!0),n.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-x.css(r,"marginTop",!0),left:t.left-n.left-x.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);x.fn[e]=function(i){return x.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?x(a).scrollLeft():o,r?o:x(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return x.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}x.each({Height:"height",Width:"width"},function(e,n){x.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){x.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return x.access(this,function(n,r,i){var o;return x.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?x.css(n,r,s):x.style(n,r,i,s)},n,a?i:t,a,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:(e.jQuery=e.$=x,"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}))})(window);

/**
 * @license RequireJS i18n 2.0.3 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/i18n for details
 */
/*jslint regexp: true */
/*global require: false, navigator: false, define: false */

/**
 * This plugin handles i18n! prefixed modules. It does the following:
 *
 * 1) A regular module can have a dependency on an i18n bundle, but the regular
 * module does not want to specify what locale to load. So it just specifies
 * the top-level bundle, like "i18n!nls/colors".
 *
 * This plugin will load the i18n bundle at nls/colors, see that it is a root/master
 * bundle since it does not have a locale in its name. It will then try to find
 * the best match locale available in that master bundle, then request all the
 * locale pieces for that best match locale. For instance, if the locale is "en-us",
 * then the plugin will ask for the "en-us", "en" and "root" bundles to be loaded
 * (but only if they are specified on the master bundle).
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/colors bundle to be that mixed in locale.
 *
 * 2) A regular module specifies a specific locale to load. For instance,
 * i18n!nls/fr-fr/colors. In this case, the plugin needs to load the master bundle
 * first, at nls/colors, then figure out what the best match locale is for fr-fr,
 * since maybe only fr or just root is defined for that locale. Once that best
 * fit is found, all of its locale pieces need to have their bundles loaded.
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/fr-fr/colors bundle to be that mixed in locale.
 */
(function () {
    

    //regexp for reconstructing the master bundle name from parts of the regexp match
    //nlsRegExp.exec("foo/bar/baz/nls/en-ca/foo") gives:
    //["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
    //nlsRegExp.exec("foo/bar/baz/nls/foo") gives:
    //["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
    //so, if match[5] is blank, it means this is the top bundle definition.
    var nlsRegExp = /(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/;

    //Helper function to avoid repeating code. Lots of arguments in the
    //desire to stay functional and support RequireJS contexts without having
    //to know about the RequireJS contexts.
    function addPart(locale, master, needed, toLoad, prefix, suffix) {
        if (master[locale]) {
            needed.push(locale);
            if (master[locale] === true || master[locale] === 1) {
                toLoad.push(prefix + locale + '/' + suffix);
            }
        }
    }

    function addIfExists(req, locale, toLoad, prefix, suffix) {
        var fullName = prefix + locale + '/' + suffix;
        if (require._fileExists(req.toUrl(fullName + '.js'))) {
            toLoad.push(fullName);
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force) {
        var prop;
        for (prop in source) {
            if (source.hasOwnProperty(prop) && (!target.hasOwnProperty(prop) || force)) {
                target[prop] = source[prop];
            } else if (typeof source[prop] === 'object') {
                if (!target[prop]) {
                    target[prop] = {};
                }
                mixin(target[prop], source[prop], force);
            }
        }
    }

    define('i18n',['module'], function (module) {
        var masterConfig = module.config ? module.config() : {};

        return {
            version: '2.0.3',
            /**
             * Called when a dependency needs to be loaded.
             */
            load: function (name, req, onLoad, config) {
                config = config || {};

                if (config.locale) {
                    masterConfig.locale = config.locale;
                }

                var masterName,
                    match = nlsRegExp.exec(name),
                    prefix = match[1],
                    locale = match[4],
                    suffix = match[5],
                    parts = locale.split("-"),
                    toLoad = [],
                    value = {},
                    i, part, current = "";

                //If match[5] is blank, it means this is the top bundle definition,
                //so it does not have to be handled. Locale-specific requests
                //will have a match[4] value but no match[5]
                if (match[5]) {
                    //locale-specific bundle
                    prefix = match[1];
                    masterName = prefix + suffix;
                } else {
                    //Top-level bundle.
                    masterName = name;
                    suffix = match[4];
                    locale = masterConfig.locale;
                    if (!locale) {
                        locale = masterConfig.locale =
                            typeof navigator === "undefined" ? "root" :
                            (navigator.language ||
                             navigator.userLanguage || "root").toLowerCase();
                    }
                    parts = locale.split("-");
                }

                if (config.isBuild) {
                    //Check for existence of all locale possible files and
                    //require them if exist.
                    toLoad.push(masterName);
                    addIfExists(req, "root", toLoad, prefix, suffix);
                    for (i = 0; i < parts.length; i++) {
                        part = parts[i];
                        current += (current ? "-" : "") + part;
                        addIfExists(req, current, toLoad, prefix, suffix);
                    }

                    req(toLoad, function () {
                        onLoad();
                    });
                } else {
                    //First, fetch the master bundle, it knows what locales are available.
                    req([masterName], function (master) {
                        //Figure out the best fit
                        var needed = [],
                            part;

                        //Always allow for root, then do the rest of the locale parts.
                        addPart("root", master, needed, toLoad, prefix, suffix);
                        for (i = 0; i < parts.length; i++) {
                            part = parts[i];
                            current += (current ? "-" : "") + part;
                            addPart(current, master, needed, toLoad, prefix, suffix);
                        }

                        //Load all the parts missing.
                        req(toLoad, function () {
                            var i, partBundle, part;
                            for (i = needed.length - 1; i > -1 && needed[i]; i--) {
                                part = needed[i];
                                partBundle = master[part];
                                if (partBundle === true || partBundle === 1) {
                                    partBundle = req(prefix + part + '/' + suffix);
                                }
                                mixin(value, partBundle);
                            }

                            //All done, notify the loader.
                            onLoad(value);
                        });
                    });
                }
            }
        };
    });
}());

define('nls/root/months',{
    "0": "Jan",
    "1": "Feb",
    "2": "Mar",
    "3": "Apr",
    "4": "May",
    "5": "Jun",
    "6": "Jul",
    "7": "Aug",
    "8": "Sep",
    "9": "Oct",
    "10": "Nov",
    "11": "Dec"
});

define('nls/root/timeline',{
    "dateStyle": "en",
    "wikiLinkLabel": "Discuss"
});


/*==================================================
 *  Gregorian Date Labeller
 *==================================================
 */
define('scripts/labellers',[
    "simile-ajax",
    "i18n!nls/months",
    "i18n!nls/timeline"
], function(SimileAjax, Months, Locale) {
var GregorianDateLabeller = function(locale, timeZone) {
    this._locale = locale;
    this._timeZone = timeZone;
};

GregorianDateLabeller.monthNames = [];
GregorianDateLabeller.dayNames = [];
GregorianDateLabeller.labelIntervalFunctions = [];

// @@@ With a switch to RequireJS i18n, this will exclusively
//     return the user agent's localization.  Should this change?
//     The rest of the structure outside of string localizing is
//     still in place if this feature needs to be restored.
GregorianDateLabeller.getMonthName = function(month, locale) {
    return Months[month.toString()];
};

GregorianDateLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var f = GregorianDateLabeller.labelIntervalFunctions[this._locale];
    if (f == null) {
        f = GregorianDateLabeller.prototype.defaultLabelInterval;
    }
    return f.call(this, date, intervalUnit);
};

GregorianDateLabeller.prototype.labelPrecise = function(date) {
    return SimileAjax.DateTime.removeTimeZoneOffset(
        date, 
        this._timeZone //+ (new Date().getTimezoneOffset() / 60)
    ).toUTCString();
};

GregorianDateLabeller.prototype.defaultLabelInterval = function(date, intervalUnit) {
    var text;
    var emphasized = false;
    
    date = SimileAjax.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    case SimileAjax.DateTime.MILLISECOND:
        text = date.getUTCMilliseconds();
        break;
    case SimileAjax.DateTime.SECOND:
        text = date.getUTCSeconds();
        break;
    case SimileAjax.DateTime.MINUTE:
        var m = date.getUTCMinutes();
        if (m == 0) {
            text = date.getUTCHours() + ":00";
            emphasized = true;
        } else {
            text = m;
        }
        break;
    case SimileAjax.DateTime.HOUR:
        text = date.getUTCHours() + "hr";
        break;
    case SimileAjax.DateTime.DAY:
        if (Locale.dateStyle === "cs") {
            text = date.getUTCDate() + ". " + (date.getUTCMonth() + 1) + ".";
        } else if (Locale.dateStyle === "vi") {
            text = date.getUTCDate() + "/" + (date.getUTCMonth() + 1);
        } else if (Locale.dateStyle === "de") {
            text = date.getUTCDate() + ". " + GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale);
        } else if (Locale.dateStyle === "zh") {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + date.getUTCDate() + "日";
        } else {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
        }
        break;
    case SimileAjax.DateTime.WEEK:
        if (Locale.dateStyle === "cs") {
            text = date.getUTCDate() + ". " + (date.getUTCMonth() + 1) + ".";
        } else if (Locale.dateStyle === "vi") {
            text = date.getUTCDate() + "/" + (date.getUTCMonth() + 1);
        } else if (Locale.dateStyle === "de") {
            text = date.getUTCDate() + ". " + GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale);
        } else if (Locale.dateStyle === "zh") {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + date.getUTCDate() + "日";
        } else {
            text = GregorianDateLabeller.getMonthName(date.getUTCMonth(), this._locale) + " " + date.getUTCDate();
        }
        break;
    case SimileAjax.DateTime.MONTH:
        var m = date.getUTCMonth();
        if (m != 0) {
            text = GregorianDateLabeller.getMonthName(m, this._locale);
            break;
        } // else, fall through
    case SimileAjax.DateTime.YEAR:
    case SimileAjax.DateTime.DECADE:
    case SimileAjax.DateTime.CENTURY:
    case SimileAjax.DateTime.MILLENNIUM:
        var y = date.getUTCFullYear();
        if (y > 0) {
            text = date.getUTCFullYear();
        } else {
            text = (1 - y) + "BC";
        }
        emphasized = 
            (intervalUnit == SimileAjax.DateTime.MONTH) ||
            (intervalUnit == SimileAjax.DateTime.DECADE && y % 100 == 0) || 
            (intervalUnit == SimileAjax.DateTime.CENTURY && y % 1000 == 0);
        break;
    default:
        text = date.toUTCString();
    }
    return { text: text, emphasized: emphasized };
};

    return GregorianDateLabeller;
});

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
 *  Band
 *==================================================
 */
define('scripts/band',[
    "simile-ajax",
    "./base",
    "./labellers"
], function(SimileAjax, Timeline, GregorianDateLabeller) {
var Band = function(timeline, bandInfo, index) {
    // Set up the band's object
    
    // Munge params: If autoWidth is on for the Timeline, then ensure that
    // bandInfo.width is an integer     
    if (timeline.autoWidth && typeof bandInfo.width == 'string') {
        bandInfo.width = bandInfo.width.indexOf("%") > -1 ? 0 : parseInt(bandInfo.width);
    }

    this._timeline = timeline;
    this._bandInfo = bandInfo;
    
    this._index = index;
    
    this._locale = ("locale" in bandInfo) ? bandInfo.locale : Timeline.getDefaultLocale();
    this._timeZone = ("timeZone" in bandInfo) ? bandInfo.timeZone : 0;
    this._labeller = ("labeller" in bandInfo) ? bandInfo.labeller : 
        (("createLabeller" in timeline.getUnit()) ?
            timeline.getUnit().createLabeller(this._locale, this._timeZone) :
            new GregorianDateLabeller(this._locale, this._timeZone));
    this._theme = bandInfo.theme;
    this._zoomIndex = ("zoomIndex" in bandInfo) ? bandInfo.zoomIndex : 0;
    this._zoomSteps = ("zoomSteps" in bandInfo) ? bandInfo.zoomSteps : null;

    this._dragging = false;
    this._changing = false;
    this._originalScrollSpeed = 5; // pixels
    this._scrollSpeed = this._originalScrollSpeed;
    this._onScrollListeners = [];
    
    this._orthogonalDragging = false;
    this._viewOrthogonalOffset = 0; // vertical offset if the timeline is horizontal, and vice versa
    this._onOrthogonalScrollListeners = [];
    
    var b = this;
    this._syncWithBand = null;
    this._syncWithBandHandler = function(band) {
        b._onHighlightBandScroll();
    };
    this._syncWithBandOrthogonalScrollHandler = function(band) {
        b._onHighlightBandOrthogonalScroll();
    };
    this._selectorListener = function(band) {
        b._onHighlightBandScroll();
    };
    
    /*
     *  Install a textbox to capture keyboard events
     */
    var inputDiv = this._timeline.getDocument().createElement("div");
    inputDiv.className = "timeline-band-input";
    this._timeline.addDiv(inputDiv);
    
    this._keyboardInput = document.createElement("input");
    this._keyboardInput.type = "text";
    inputDiv.appendChild(this._keyboardInput);
    SimileAjax.DOM.registerEventWithObject(this._keyboardInput, "keydown", this, "_onKeyDown");
    SimileAjax.DOM.registerEventWithObject(this._keyboardInput, "keyup", this, "_onKeyUp");
    
    /*
     *  The band's outer most div that slides with respect to the timeline's div
     */
    this._div = this._timeline.getDocument().createElement("div");
    this._div.id = "timeline-band-" + index;
    this._div.className = "timeline-band timeline-band-" + index;
    this._timeline.addDiv(this._div);
    
    SimileAjax.DOM.registerEventWithObject(this._div, "dblclick", this, "_onDblClick");
    SimileAjax.DOM.registerEventWithObject(this._div, "mousedown", this, "_onMouseDown");
    SimileAjax.DOM.registerEventWithObject(document.body, "mousemove", this, "_onMouseMove");
    SimileAjax.DOM.registerEventWithObject(document.body, "mouseup", this, "_onMouseUp");
    SimileAjax.DOM.registerEventWithObject(document.body, "mouseout", this, "_onMouseOut");
    
    var mouseWheel = this._theme!= null ? this._theme.mouseWheel : 'scroll'; // theme is not always defined
    if (mouseWheel === 'zoom' || mouseWheel === 'scroll' || this._zoomSteps) {
        // capture mouse scroll
        if (SimileAjax.Platform.browser.isFirefox) {
            SimileAjax.DOM.registerEventWithObject(this._div, "DOMMouseScroll", this, "_onMouseScroll");
        } else {
            SimileAjax.DOM.registerEventWithObject(this._div, "mousewheel", this, "_onMouseScroll");
        }
    }    
    
    /*
     *  The inner div that contains layers
     */
    this._innerDiv = this._timeline.getDocument().createElement("div");
    this._innerDiv.className = "timeline-band-inner";
    this._div.appendChild(this._innerDiv);
    
    /*
     *  Initialize parts of the band
     */
    this._ether = bandInfo.ether;
    bandInfo.ether.initialize(this, timeline);
        
    this._etherPainter = bandInfo.etherPainter;
    bandInfo.etherPainter.initialize(this, timeline);
    
    this._eventSource = bandInfo.eventSource;
    if (this._eventSource) {
        this._eventListener = {
            onAddMany: function() { b._onAddMany(); },
            onClear:   function() { b._onClear(); }
        }
        this._eventSource.addListener(this._eventListener);
    }
        
    this._eventPainter = bandInfo.eventPainter;
    this._eventTracksNeeded = 0;   // set by painter via updateEventTrackInfo
    this._eventTrackIncrement = 0; 
    bandInfo.eventPainter.initialize(this, timeline);
    
    this._decorators = ("decorators" in bandInfo) ? bandInfo.decorators : [];
    for (var i = 0; i < this._decorators.length; i++) {
        this._decorators[i].initialize(this, timeline);
    }
    
    this._supportsOrthogonalScrolling = ("supportsOrthogonalScrolling" in this._eventPainter) &&
        this._eventPainter.supportsOrthogonalScrolling();
        
    if (this._supportsOrthogonalScrolling) {
        this._scrollBar = this._timeline.getDocument().createElement("div");
        this._scrollBar.id = "timeline-band-scrollbar-" + index;
        this._scrollBar.className = "timeline-band-scrollbar";
        this._timeline.addDiv(this._scrollBar);
        
        this._scrollBar.innerHTML = '<div class="timeline-band-scrollbar-thumb"> </div>'
        
        var scrollbarThumb = this._scrollBar.firstChild;
        if (SimileAjax.Platform.browser.isIE) {
            scrollbarThumb.style.cursor = "move";
        } else {
            scrollbarThumb.style.cursor = "-moz-grab";
        }
        SimileAjax.DOM.registerEventWithObject(scrollbarThumb, "mousedown", this, "_onScrollBarMouseDown");
    }
};

Band.SCROLL_MULTIPLES = 5;

Band.prototype.dispose = function() {
    this.closeBubble();
    
    if (this._eventSource) {
        this._eventSource.removeListener(this._eventListener);
        this._eventListener = null;
        this._eventSource = null;
    }
    
    this._timeline = null;
    this._bandInfo = null;
    
    this._labeller = null;
    this._ether = null;
    this._etherPainter = null;
    this._eventPainter = null;
    this._decorators = null;
    
    this._onScrollListeners = null;
    this._syncWithBandHandler = null;
    this._syncWithBandOrthogonalScrollHandler = null;
    this._selectorListener = null;
    
    this._div = null;
    this._innerDiv = null;
    this._keyboardInput = null;
    this._scrollBar = null;
};

Band.prototype.addOnScrollListener = function(listener) {
    this._onScrollListeners.push(listener);
};

Band.prototype.removeOnScrollListener = function(listener) {
    for (var i = 0; i < this._onScrollListeners.length; i++) {
        if (this._onScrollListeners[i] == listener) {
            this._onScrollListeners.splice(i, 1);
            break;
        }
    }
};

Band.prototype.addOnOrthogonalScrollListener = function(listener) {
    this._onOrthogonalScrollListeners.push(listener);
};

Band.prototype.removeOnOrthogonalScrollListener = function(listener) {
    for (var i = 0; i < this._onOrthogonalScrollListeners.length; i++) {
        if (this._onOrthogonalScrollListeners[i] == listener) {
            this._onOrthogonalScrollListeners.splice(i, 1);
            break;
        }
    }
};

Band.prototype.setSyncWithBand = function(band, highlight) {
    if (this._syncWithBand) {
        this._syncWithBand.removeOnScrollListener(this._syncWithBandHandler);
        this._syncWithBand.removeOnOrthogonalScrollListener(this._syncWithBandOrthogonalScrollHandler);
    }
    
    this._syncWithBand = band;
    this._syncWithBand.addOnScrollListener(this._syncWithBandHandler);
    this._syncWithBand.addOnOrthogonalScrollListener(this._syncWithBandOrthogonalScrollHandler);
    this._highlight = highlight;
    this._positionHighlight();
};

Band.prototype.getLocale = function() {
    return this._locale;
};

Band.prototype.getTimeZone = function() {
    return this._timeZone;
};

Band.prototype.getLabeller = function() {
    return this._labeller;
};

Band.prototype.getIndex = function() {
    return this._index;
};

Band.prototype.getEther = function() {
    return this._ether;
};

Band.prototype.getEtherPainter = function() {
    return this._etherPainter;
};

Band.prototype.getEventSource = function() {
    return this._eventSource;
};

Band.prototype.getEventPainter = function() {
    return this._eventPainter;
};

Band.prototype.getTimeline = function() {
    return this._timeline;
};

// Autowidth support
Band.prototype.updateEventTrackInfo = function(tracks, increment) {
    this._eventTrackIncrement = increment; // doesn't vary for a specific band

    if (tracks > this._eventTracksNeeded) {
        this._eventTracksNeeded = tracks;
    }
};

// Autowidth support
Band.prototype.checkAutoWidth = function() {
    // if a new (larger) width is needed by the band
    // then: a) updates the band's bandInfo.width
    //
    // desiredWidth for the band is 
    //   (number of tracks + margin) * track increment
    if (! this._timeline.autoWidth) {
      return; // early return
    }
    
    var overviewBand = this._eventPainter.getType() == 'overview';
    var margin = overviewBand ? 
       this._theme.event.overviewTrack.autoWidthMargin : 
       this._theme.event.track.autoWidthMargin;
    var desiredWidth = Math.ceil((this._eventTracksNeeded + margin) *
                       this._eventTrackIncrement);
    // add offset amount (additional margin)
    desiredWidth += overviewBand ? this._theme.event.overviewTrack.offset : 
                                   this._theme.event.track.offset;
    var bandInfo = this._bandInfo;
    
    if (desiredWidth != bandInfo.width) {
        bandInfo.width = desiredWidth;
    }
};

Band.prototype.layout = function() {
    this.paint();
};

Band.prototype.paint = function() {
    this._etherPainter.paint();
    this._paintDecorators();
    this._paintEvents();
};

Band.prototype.softLayout = function() {
    this.softPaint();
};

Band.prototype.softPaint = function() {
    this._etherPainter.softPaint();
    this._softPaintDecorators();
    this._softPaintEvents();
};

Band.prototype.setBandShiftAndWidth = function(shift, width) {
    var inputDiv = this._keyboardInput.parentNode;
    var middle = shift + Math.floor(width / 2);
    if (this._timeline.isHorizontal()) {
        this._div.style.top = shift + "px";
        this._div.style.height = width + "px";
        
        inputDiv.style.top = middle + "px";
        inputDiv.style.left = "-1em";
    } else {
        this._div.style.left = shift + "px";
        this._div.style.width = width + "px";
        
        inputDiv.style.left = middle + "px";
        inputDiv.style.top = "-1em";
    }
};

Band.prototype.getViewWidth = function() {
    if (this._timeline.isHorizontal()) {
        return this._div.offsetHeight;
    } else {
        return this._div.offsetWidth;
    }
};

Band.prototype.setViewLength = function(length) {
    this._viewLength = length;
    this._recenterDiv();
    this._onChanging();
};

Band.prototype.getViewLength = function() {
    return this._viewLength;
};

Band.prototype.getTotalViewLength = function() {
    return Band.SCROLL_MULTIPLES * this._viewLength;
};

Band.prototype.getViewOffset = function() {
    return this._viewOffset;
};

Band.prototype.getMinDate = function() {
    return this._ether.pixelOffsetToDate(this._viewOffset);
};

Band.prototype.getMaxDate = function() {
    return this._ether.pixelOffsetToDate(this._viewOffset + Band.SCROLL_MULTIPLES * this._viewLength);
};

Band.prototype.getMinVisibleDate = function() {
    return this._ether.pixelOffsetToDate(0);
};

Band.prototype.getMinVisibleDateAfterDelta = function(delta) {
    return this._ether.pixelOffsetToDate(delta);
};

Band.prototype.getMaxVisibleDate = function() {
    // Max date currently visible on band
    return this._ether.pixelOffsetToDate(this._viewLength);
};

Band.prototype.getMaxVisibleDateAfterDelta = function(delta) {
    // Max date visible on band after delta px view change is applied 
    return this._ether.pixelOffsetToDate(this._viewLength + delta);
};

Band.prototype.getCenterVisibleDate = function() {
    return this._ether.pixelOffsetToDate(this._viewLength / 2);
};

Band.prototype.setMinVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(-this._ether.dateToPixelOffset(date)));
    }
};

Band.prototype.setMaxVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength - this._ether.dateToPixelOffset(date)));
    }
};

Band.prototype.setCenterVisibleDate = function(date) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength / 2 - this._ether.dateToPixelOffset(date)));
    }
};

Band.prototype.dateToPixelOffset = function(date) {
    return this._ether.dateToPixelOffset(date) - this._viewOffset;
};

Band.prototype.pixelOffsetToDate = function(pixels) {
    return this._ether.pixelOffsetToDate(pixels + this._viewOffset);
};

Band.prototype.getViewOrthogonalOffset = function() {
    return this._viewOrthogonalOffset;
};

Band.prototype.setViewOrthogonalOffset = function(offset) {
    this._viewOrthogonalOffset = Math.max(0, offset);
};

Band.prototype.createLayerDiv = function(zIndex, className) {
    var div = this._timeline.getDocument().createElement("div");
    div.className = "timeline-band-layer" + (typeof className == "string" ? (" " + className) : "");
    div.style.zIndex = zIndex;
    this._innerDiv.appendChild(div);
    
    var innerDiv = this._timeline.getDocument().createElement("div");
    innerDiv.className = "timeline-band-layer-inner";
    if (SimileAjax.Platform.browser.isIE) {
        innerDiv.style.cursor = "move";
    } else {
        innerDiv.style.cursor = "-moz-grab";
    }
    div.appendChild(innerDiv);
    
    return innerDiv;
};

Band.prototype.removeLayerDiv = function(div) {
    this._innerDiv.removeChild(div.parentNode);
};

Band.prototype.scrollToCenter = function(date, f) {
    var pixelOffset = this._ether.dateToPixelOffset(date);
    if (pixelOffset < -this._viewLength / 2) {
        this.setCenterVisibleDate(this.pixelOffsetToDate(pixelOffset + this._viewLength));
    } else if (pixelOffset > 3 * this._viewLength / 2) {
        this.setCenterVisibleDate(this.pixelOffsetToDate(pixelOffset - this._viewLength));
    }
    this._autoScroll(Math.round(this._viewLength / 2 - this._ether.dateToPixelOffset(date)), f);
};

Band.prototype.showBubbleForEvent = function(eventID) {
    var evt = this.getEventSource().getEvent(eventID);
    if (evt) {
        var self = this;
        this.scrollToCenter(evt.getStart(), function() {
            self._eventPainter.showBubble(evt);
        });
    }
};

Band.prototype.zoom = function(zoomIn, x, y, target) {
  if (!this._zoomSteps) {
    // zoom disabled
    return;
  }
  
  // shift the x value by our offset
  x += this._viewOffset;

  var zoomDate = this._ether.pixelOffsetToDate(x);
  var netIntervalChange = this._ether.zoom(zoomIn);
  this._etherPainter.zoom(netIntervalChange);

  // shift our zoom date to the far left
  this._moveEther(Math.round(-this._ether.dateToPixelOffset(zoomDate)));
  // then shift it back to where the mouse was
  this._moveEther(x);
};

Band.prototype._onMouseDown = function(elmt, evt, target) {
    if (!this._dragging) {
        this.closeBubble();
    
        this._dragging = true;
        this._dragX = evt.clientX;
        this._dragY = evt.clientY;
    
        return this._cancelEvent(evt);
    }
};

Band.prototype._onMouseMove = function(elmt, evt, target) {
    if (this._dragging || this._orthogonalDragging) {
        var diffX = evt.clientX - this._dragX;
        var diffY = evt.clientY - this._dragY;
        
        this._dragX = evt.clientX;
        this._dragY = evt.clientY;
    }
    
    if (this._dragging) {
        if (this._timeline.isHorizontal()) {
            this._moveEther(diffX, diffY);
        } else {
            this._moveEther(diffY, diffX);
        }
    } else if (this._orthogonalDragging) {
        var viewWidth = this.getViewWidth();
        var scrollbarThumb = this._scrollBar.firstChild;
        if (this._timeline.isHorizontal()) {
            this._moveEther(0, -diffY * viewWidth / scrollbarThumb.offsetHeight);
        } else {
            this._moveEther(0, -diffX * viewWidth / scrollbarThumb.offsetWidth);
        }
    } else {
        return;
    }
    
    this._positionHighlight();
    this._showScrollbar();
    
    return this._cancelEvent(evt);
};

Band.prototype._onMouseUp = function(elmt, evt, target) {
    if (this._dragging) {
        this._dragging = false;
    } else if (this._orthogonalDragging) {
        this._orthogonalDragging = false;
    } else {
        return;
    }
    this._keyboardInput.focus();
    this._bounceBack();
    
    return this._cancelEvent(evt);
};

Band.prototype._onMouseOut = function(elmt, evt, target) {
    if (target == document.body) {
        if (this._dragging) {
            this._dragging = false;
        } else if (this._orthogonalDragging) {
            this._orthogonalDragging = false;
        } else {
            return;
        }
        this._bounceBack();
        
        return this._cancelEvent(evt);
    }
};

Band.prototype._onScrollBarMouseDown = function(elmt, evt, target) {
    if (!this._orthogonalDragging) {
        this.closeBubble();
    
        this._orthogonalDragging = true;
        this._dragX = evt.clientX;
        this._dragY = evt.clientY;
    
        return this._cancelEvent(evt);
    }
};

Band.prototype._onMouseScroll = function(innerFrame, evt, target) {
  var now = new Date();
  now = now.getTime();

  if (!this._lastScrollTime || ((now - this._lastScrollTime) > 50)) {
    // limit 1 scroll per 200ms due to FF3 sending multiple events back to back
    this._lastScrollTime = now;

    var delta = 0;
    if (evt.wheelDelta) {
      delta = evt.wheelDelta/120;
    } else if (evt.detail) {
      delta = -evt.detail/3;
    }
    
    // either scroll or zoom
    var mouseWheel = this._theme.mouseWheel;
    
    if (this._zoomSteps || mouseWheel === 'zoom') {
      var loc = SimileAjax.DOM.getEventRelativeCoordinates(evt, innerFrame);
      if (delta != 0) {
        var zoomIn;
        if (delta > 0)
          zoomIn = true;
        if (delta < 0)
          zoomIn = false;
        // call zoom on the timeline so we could zoom multiple bands if desired
        this._timeline.zoom(zoomIn, loc.x, loc.y, innerFrame);
      }
    }
    else if (mouseWheel === 'scroll') {
    	var move_amt = 50 * (delta < 0 ? -1 : 1);
      this._moveEther(move_amt);
    }
  }

  // prevent bubble
  if (evt.stopPropagation) {
    evt.stopPropagation();
  }
  evt.cancelBubble = true;

  // prevent the default action
  if (evt.preventDefault) {
    evt.preventDefault();
  }
  evt.returnValue = false;
};

Band.prototype._onDblClick = function(innerFrame, evt, target) {
    var coords = SimileAjax.DOM.getEventRelativeCoordinates(evt, innerFrame);
    var distance = coords.x - (this._viewLength / 2 - this._viewOffset);
    
    this._autoScroll(-distance);
};

Band.prototype._onKeyDown = function(keyboardInput, evt, target) {
    if (!this._dragging) {
        switch (evt.keyCode) {
        case 27: // ESC
            break;
        case 37: // left arrow
        case 38: // up arrow
            this._scrollSpeed = Math.min(50, Math.abs(this._scrollSpeed * 1.05));
            this._moveEther(this._scrollSpeed);
            break;
        case 39: // right arrow
        case 40: // down arrow
            this._scrollSpeed = -Math.min(50, Math.abs(this._scrollSpeed * 1.05));
            this._moveEther(this._scrollSpeed);
            break;
        default:
            return true;
        }
        this.closeBubble();
        
        SimileAjax.DOM.cancelEvent(evt);
        return false;
    }
    return true;
};

Band.prototype._onKeyUp = function(keyboardInput, evt, target) {
    if (!this._dragging) {
        this._scrollSpeed = this._originalScrollSpeed;
        
        switch (evt.keyCode) {
        case 35: // end
            this.setCenterVisibleDate(this._eventSource.getLatestDate());
            break;
        case 36: // home
            this.setCenterVisibleDate(this._eventSource.getEarliestDate());
            break;
        case 33: // page up
            this._autoScroll(this._timeline.getPixelLength());
            break;
        case 34: // page down
            this._autoScroll(-this._timeline.getPixelLength());
            break;
        default:
            return true;
        }
        
        this.closeBubble();
        
        SimileAjax.DOM.cancelEvent(evt);
        return false;
    }
    return true;
};

Band.prototype._autoScroll = function(distance, f) {
    var b = this;
    var a = SimileAjax.Graphics.createAnimation(
        function(abs, diff) {
            b._moveEther(diff);
        }, 
        0, 
        distance, 
        1000, 
        f
    );
    a.run();
};

Band.prototype._moveEther = function(shift, orthogonalShift) {
    if (orthogonalShift === undefined) {
        orthogonalShift = 0;
    }
    
    this.closeBubble();
    
    // A positive shift means back in time
    // Check that we're not moving beyond Timeline's limits
    if (!this._timeline.shiftOK(this._index, shift)) {
        return; // early return
    }

    this._viewOffset += shift;
    this._ether.shiftPixels(-shift);
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
    }
    
    if (this._supportsOrthogonalScrolling) {
        if (this._eventPainter.getOrthogonalExtent() <= this.getViewWidth()) {
            this._viewOrthogonalOffset = 0;
        } else {
            this._viewOrthogonalOffset = this._viewOrthogonalOffset + orthogonalShift;
        }
    }
    
    if (this._viewOffset > -this._viewLength * 0.5 ||
        this._viewOffset < -this._viewLength * (Band.SCROLL_MULTIPLES - 1.5)) {
        
        this._recenterDiv();
    } else {
        this.softLayout();
    }    
    
    this._onChanging();
}

Band.prototype._onChanging = function() {
    this._changing = true;

    this._fireOnScroll();
    this._setSyncWithBandDate();
    
    this._changing = false;
};

Band.prototype.busy = function() {
    // Is this band busy changing other bands?
    return(this._changing);
};

Band.prototype._fireOnScroll = function() {
    for (var i = 0; i < this._onScrollListeners.length; i++) {
        this._onScrollListeners[i](this);
    }
};

Band.prototype._fireOnOrthogonalScroll = function() {
    for (var i = 0; i < this._onOrthogonalScrollListeners.length; i++) {
        this._onOrthogonalScrollListeners[i](this);
    }
};

Band.prototype._setSyncWithBandDate = function() {
    if (this._syncWithBand) {
        var centerDate = this._ether.pixelOffsetToDate(this.getViewLength() / 2);
        this._syncWithBand.setCenterVisibleDate(centerDate);
    }
};

Band.prototype._onHighlightBandScroll = function() {
    if (this._syncWithBand) {
        var centerDate = this._syncWithBand.getCenterVisibleDate();
        var centerPixelOffset = this._ether.dateToPixelOffset(centerDate);
        
        this._moveEther(Math.round(this._viewLength / 2 - centerPixelOffset));
        this._positionHighlight();
    }
};

Band.prototype._onHighlightBandOrthogonalScroll = function() {
    if (this._syncWithBand) {
        this._positionHighlight();
    }
};

Band.prototype._onAddMany = function() {
    this._paintEvents();
};

Band.prototype._onClear = function() {
    this._paintEvents();
};

Band.prototype._positionHighlight = function() {
    if (this._syncWithBand) {
        var startDate = this._syncWithBand.getMinVisibleDate();
        var endDate = this._syncWithBand.getMaxVisibleDate();
        
        if (this._highlight) {
            var offset = 0; // percent
            var extent = 1.0; // percent
            var syncEventPainter = this._syncWithBand.getEventPainter();
            if ("supportsOrthogonalScrolling" in syncEventPainter && 
                syncEventPainter.supportsOrthogonalScrolling()) {

                var orthogonalExtent = syncEventPainter.getOrthogonalExtent();
                var visibleWidth = this._syncWithBand.getViewWidth();
                var totalWidth = Math.max(visibleWidth, orthogonalExtent);
                extent = visibleWidth / totalWidth;
                offset = -this._syncWithBand.getViewOrthogonalOffset() / totalWidth;
            }
            
            this._etherPainter.setHighlight(startDate, endDate, offset, extent);
        }
    }
};

Band.prototype._recenterDiv = function() {
    this._viewOffset = -this._viewLength * (Band.SCROLL_MULTIPLES - 1) / 2;
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
        this._div.style.width = (Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
        this._div.style.height = (Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    }
    this.layout();
};

Band.prototype._paintEvents = function() {
    this._eventPainter.paint();
    this._showScrollbar();
    this._fireOnOrthogonalScroll();
};

Band.prototype._softPaintEvents = function() {
    this._eventPainter.softPaint();
};

Band.prototype._paintDecorators = function() {
    for (var i = 0; i < this._decorators.length; i++) {
        this._decorators[i].paint();
    }
};

Band.prototype._softPaintDecorators = function() {
    for (var i = 0; i < this._decorators.length; i++) {
        this._decorators[i].softPaint();
    }
};

Band.prototype.closeBubble = function() {
    SimileAjax.WindowManager.cancelPopups();
};

Band.prototype._bounceBack = function(f) {
    if (!this._supportsOrthogonalScrolling) {
        return;
    }
    
    var target = 0;
    if (this._viewOrthogonalOffset < 0) {
        var orthogonalExtent = this._eventPainter.getOrthogonalExtent();
        if (this._viewOrthogonalOffset + orthogonalExtent >= this.getViewWidth()) {
            target = this._viewOrthogonalOffset;
        } else {    
            target = Math.min(0, this.getViewWidth() - orthogonalExtent);
        }
    }
    
    if (target != this._viewOrthogonalOffset) {
        var self = this;
        SimileAjax.Graphics.createAnimation(
            function(abs, diff) {
                self._viewOrthogonalOffset = abs;
                self._eventPainter.softPaint();
                self._showScrollbar();
                self._fireOnOrthogonalScroll();
            }, 
            this._viewOrthogonalOffset, 
            target, 
            300, 
            function() {
                self._hideScrollbar();
            }
        ).run();
    } else {
        this._hideScrollbar();
    }
};

Band.prototype._showScrollbar = function() {
    if (!this._supportsOrthogonalScrolling) {
        return;
    }
    
    var orthogonalExtent = this._eventPainter.getOrthogonalExtent();
    var visibleWidth = this.getViewWidth();
    var totalWidth = Math.max(visibleWidth, orthogonalExtent);
    var ratio = (visibleWidth / totalWidth);
    var thumbWidth = Math.round(visibleWidth * ratio) + "px";
    var thumbOffset = Math.round(-this._viewOrthogonalOffset * ratio) + "px";
    var thumbThickness = 12;
    
    var thumb = this._scrollBar.firstChild;
    if (this._timeline.isHorizontal()) {
        this._scrollBar.style.top = this._div.style.top;
        this._scrollBar.style.height = this._div.style.height;
        
        this._scrollBar.style.right = "0px";
        this._scrollBar.style.width = thumbThickness + "px";
        
        thumb.style.top = thumbOffset;
        thumb.style.height = thumbWidth;
    } else {
        this._scrollBar.style.left = this._div.style.left;
        this._scrollBar.style.width = this._div.style.width;
        
        this._scrollBar.style.bottom = "0px";
        this._scrollBar.style.height = thumbThickness + "px";
        
        thumb.style.left = thumbOffset;
        thumb.style.width = thumbWidth;
    }
    
    if (ratio >= 1 && this._viewOrthogonalOffset == 0) {
        this._scrollBar.style.display = "none";
    } else {
        this._scrollBar.style.display = "block";
    }
};

Band.prototype._hideScrollbar = function() {
    if (!this._supportsOrthogonalScrolling) {
        return;
    }
    //this._scrollBar.style.display = "none";
};

Band.prototype._cancelEvent = function(evt) {
    SimileAjax.DOM.cancelEvent(evt);
    return false;
};

    return Band;
});

/*==================================================
 *  Timeline Implementation object
 *==================================================
 */
define('scripts/timeline-impl',[
    "jquery",
    "simile-ajax",
    "./base",
    "./band"
], function($, SimileAjax, Timeline, Band) {
var TimelineImpl = function(elmt, bandInfos, orientation, unit, timelineID) {
    SimileAjax.WindowManager.initialize();
    
    this._containerDiv = elmt;
    
    this._bandInfos = bandInfos;
    this._orientation = orientation == null ? Timeline.HORIZONTAL : orientation;
    this._unit = (unit != null) ? unit : SimileAjax.NativeDateUnit;
    this._starting = true; // is the Timeline being created? Used by autoWidth
                           // functions
    this._autoResizing = false;
    
    // autoWidth is a "public" property of the Timeline object
    this.autoWidth = bandInfos && bandInfos[0] && bandInfos[0].theme && 
                     bandInfos[0].theme.autoWidth;
    this.autoWidthAnimationTime = bandInfos && bandInfos[0] && bandInfos[0].theme && 
                     bandInfos[0].theme.autoWidthAnimationTime;
    this.timelineID = timelineID; // also public attribute
    this.timeline_start = bandInfos && bandInfos[0] && bandInfos[0].theme && 
                     bandInfos[0].theme.timeline_start;
    this.timeline_stop  = bandInfos && bandInfos[0] && bandInfos[0].theme && 
                     bandInfos[0].theme.timeline_stop;
    this.timeline_at_start = false; // already at start or stop? Then won't 
    this.timeline_at_stop = false;  // try to move further in the wrong direction
    
    this._initialize();
};

//
// Public functions used by client sw
//
TimelineImpl.prototype.dispose = function() {
    for (var i = 0; i < this._bands.length; i++) {
        this._bands[i].dispose();
    }
    this._bands = null;
    this._bandInfos = null;
    this._containerDiv.innerHTML = "";
    // remove from array of Timelines
    Timeline.timelines[this.timelineID] = null;
};

TimelineImpl.prototype.getBandCount = function() {
    return this._bands.length;
};

TimelineImpl.prototype.getBand = function(index) {
    return this._bands[index];
};

TimelineImpl.prototype.finishedEventLoading = function() {
    // Called by client after events have been loaded into Timeline
    // Only used if the client has set autoWidth
    // Sets width to Timeline's requested amount and will shrink down the div if
    // need be.
    this._autoWidthCheck(true);
    this._starting = false;
};

TimelineImpl.prototype.layout = function() {
    // called by client when browser is resized
    this._autoWidthCheck(true);
    this._distributeWidths();
};

TimelineImpl.prototype.paint = function() {
    for (var i = 0; i < this._bands.length; i++) {
        this._bands[i].paint();
    }
};

TimelineImpl.prototype.getDocument = function() {
    return this._containerDiv.ownerDocument;
};

TimelineImpl.prototype.addDiv = function(div) {
    this._containerDiv.appendChild(div);
};

TimelineImpl.prototype.removeDiv = function(div) {
    this._containerDiv.removeChild(div);
};

TimelineImpl.prototype.isHorizontal = function() {
    return this._orientation == Timeline.HORIZONTAL;
};

TimelineImpl.prototype.isVertical = function() {
    return this._orientation == Timeline.VERTICAL;
};

TimelineImpl.prototype.getPixelLength = function() {
    return this._orientation == Timeline.HORIZONTAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

TimelineImpl.prototype.getPixelWidth = function() {
    return this._orientation == Timeline.VERTICAL ? 
        this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};

TimelineImpl.prototype.getUnit = function() {
    return this._unit;
};

TimelineImpl.prototype.getWidthStyle = function() {
    // which element.style attribute should be changed to affect Timeline's "width"
    return this._orientation == Timeline.HORIZONTAL ? 'height' : 'width';
};

TimelineImpl.prototype.loadXML = function(url, f) {
    var tl = this;
    
    
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load data xml from " + url + "\n" + statusText);
        tl.hideLoadingMessage();
    };
    var fDone = function(xmlhttp) {
        try {
            var xml = xmlhttp.responseXML;
            if (!xml.documentElement && xmlhttp.responseStream) {
                xml.load(xmlhttp.responseStream);
            } 
            f(xml, url);
        } finally {
            tl.hideLoadingMessage();
        }
    };
    
    this.showLoadingMessage();
    window.setTimeout(function() { SimileAjax.XmlHttp.get(url, fError, fDone); }, 0);
};

TimelineImpl.prototype.loadJSON = function(url, f) {
    var tl = this;
    
    var fError = function(statusText, status, xmlhttp) {
        alert("Failed to load json data from " + url + "\n" + statusText);
        tl.hideLoadingMessage();
    };
    var fDone = function(xmlhttp) {
        try {
            f(eval('(' + xmlhttp.responseText + ')'), url);
        } finally {
            tl.hideLoadingMessage();
        }
    };
    
    this.showLoadingMessage();
    window.setTimeout(function() { SimileAjax.XmlHttp.get(url, fError, fDone); }, 0);
};


//
// Private functions used by Timeline object functions
//

TimelineImpl.prototype._autoWidthScrollListener = function(band) {	
    band.getTimeline()._autoWidthCheck(false);
};

// called to re-calculate auto width and adjust the overall Timeline div if needed
TimelineImpl.prototype._autoWidthCheck = function(okToShrink) {	
    var timeline = this; // this Timeline
    var immediateChange = timeline._starting;
    var newWidth = 0;
    
    function changeTimelineWidth() {        
        var widthStyle = timeline.getWidthStyle();
        if (immediateChange) {
            timeline._containerDiv.style[widthStyle] = newWidth + 'px';
        } else {
        	  // animate change
        	  timeline._autoResizing = true;
        	  var animateParam ={};
        	  animateParam[widthStyle] = newWidth + 'px';
        	  $(timeline._containerDiv).animate(
        	      animateParam, timeline.autoWidthAnimationTime,
        	      'linear', function(){timeline._autoResizing = false;});
        }
    }
        	
    function checkTimelineWidth() {
        var targetWidth = 0; // the new desired width
        var currentWidth = timeline.getPixelWidth();
        
        if (timeline._autoResizing) {
        	return; // early return
        }

        // compute targetWidth
        for (var i = 0; i < timeline._bands.length; i++) {
            timeline._bands[i].checkAutoWidth();
            targetWidth += timeline._bandInfos[i].width;
        }
        
        if (targetWidth > currentWidth || okToShrink) {
            // yes, let's change the size
            newWidth = targetWidth;
            changeTimelineWidth();
            timeline._distributeWidths();
        }
    }
    
    // function's mainline
    if (!timeline.autoWidth) {
        return; // early return
    }

    checkTimelineWidth();
};

TimelineImpl.prototype._initialize = function() {
    var containerDiv = this._containerDiv;
    var doc = containerDiv.ownerDocument;
    
    containerDiv.className = 
        containerDiv.className.split(" ").concat("timeline-container").join(" ");
    
	/*
	 * Set css-class on container div that will define orientation
	 */
	var orientation = (this.isHorizontal()) ? 'horizontal' : 'vertical'
	containerDiv.className +=' timeline-'+orientation;
	
	
    while (containerDiv.firstChild) {
        containerDiv.removeChild(containerDiv.firstChild);
    }
    
    /*
     *  inserting copyright and link
     */
    var elmtCopyright = SimileAjax.Graphics.createTranslucentImage(Timeline.urlPrefix + (this.isHorizontal() ? "images/copyright-vertical.png" : "images/copyright.png"));
    elmtCopyright.className = "timeline-copyright";
    elmtCopyright.title = "SIMILE Timeline - http://www.simile-widgets.org/";
    SimileAjax.DOM.registerEvent(elmtCopyright, "click", function() { window.location = "http://www.simile-widgets.org/"; });
    containerDiv.appendChild(elmtCopyright);
    
    /*
     *  creating bands
     */
    this._bands = [];
    for (var i = 0; i < this._bandInfos.length; i++) {
        var band = new Band(this, this._bandInfos[i], i);
        this._bands.push(band);
    }
    this._distributeWidths();
    
    /*
     *  sync'ing bands
     */
    for (var i = 0; i < this._bandInfos.length; i++) {
        var bandInfo = this._bandInfos[i];
        if ("syncWith" in bandInfo) {
            this._bands[i].setSyncWithBand(
                this._bands[bandInfo.syncWith], 
                ("highlight" in bandInfo) ? bandInfo.highlight : false
            );
        }
    }
    
    
    if (this.autoWidth) {
        for (var i = 0; i < this._bands.length; i++) {
            this._bands[i].addOnScrollListener(this._autoWidthScrollListener);
        }
    }
    
    
    /*
     *  creating loading UI
     */
    var message = SimileAjax.Graphics.createMessageBubble(doc);
    message.containerDiv.className = "timeline-message-container";
    containerDiv.appendChild(message.containerDiv);
    
    message.contentDiv.className = "timeline-message";
    message.contentDiv.innerHTML = "<img src='" + Timeline.urlPrefix + "images/progress-running.gif' /> Loading...";
    
    this.showLoadingMessage = function() { message.containerDiv.style.display = "block"; };
    this.hideLoadingMessage = function() { message.containerDiv.style.display = "none"; };
};

TimelineImpl.prototype._distributeWidths = function() {
    var length = this.getPixelLength();
    var width = this.getPixelWidth();
    var cumulativeWidth = 0;
    
    for (var i = 0; i < this._bands.length; i++) {
        var band = this._bands[i];
        var bandInfos = this._bandInfos[i];
        var widthString = bandInfos.width;
        var bandWidth;
        
        if (typeof widthString == 'string') {
          var x =  widthString.indexOf("%");
          if (x > 0) {
              var percent = parseInt(widthString.substr(0, x));
              bandWidth = Math.round(percent * width / 100);
          } else {
              bandWidth = parseInt(widthString);
          }
        } else {
        	// was given an integer
        	bandWidth = widthString;
        }
        	 
        band.setBandShiftAndWidth(cumulativeWidth, bandWidth);
        band.setViewLength(length);
        
        cumulativeWidth += bandWidth;
    }
};

TimelineImpl.prototype.shiftOK = function(index, shift) {
    // Returns true if the proposed shift is ok
    //
    // Positive shift means going back in time
    var going_back = shift > 0,
        going_forward = shift < 0;
    
    // Is there an edge?
    if ((going_back    && this.timeline_start == null) ||
        (going_forward && this.timeline_stop  == null) ||
        (shift == 0)) {
        return (true);  // early return
    }
    
    // If any of the bands has noted that it is changing the others,
    // then this shift is a secondary shift in reaction to the real shift,
    // which already happened. In such cases, ignore it. (The issue is
    // that a positive original shift can cause a negative secondary shift, 
    // as the bands adjust.)
    var secondary_shift = false;
    for (var i = 0; i < this._bands.length && !secondary_shift; i++) {
       secondary_shift = this._bands[i].busy();
    }
    if (secondary_shift) {
        return(true); // early return
    }
    
    // If we are already at an edge, then don't even think about going any further
    if ((going_back    && this.timeline_at_start) ||
        (going_forward && this.timeline_at_stop)) {
        return (false);  // early return
    }
    
    // Need to check all the bands
    var ok = false; // return value
    // If any of the bands will be or are showing an ok date, then let the shift proceed.
    for (var i = 0; i < this._bands.length && !ok; i++) {
       var band = this._bands[i];
       if (going_back) {
           ok = (i == index ? band.getMinVisibleDateAfterDelta(shift) : band.getMinVisibleDate())
                >= this.timeline_start;
       } else {
           ok = (i == index ? band.getMaxVisibleDateAfterDelta(shift) : band.getMaxVisibleDate())
                <= this.timeline_stop;
       }	
    }
    
    // process results
    if (going_back) {
       this.timeline_at_start = !ok;
       this.timeline_at_stop = false;
    } else {
       this.timeline_at_stop = !ok;
       this.timeline_at_start = false;
    }
    // This is where you could have an effect once per hitting an
    // edge of the Timeline. Eg jitter the Timeline
    //if (!ok) {
        //alert(going_back ? "At beginning" : "At end");
    //}
    return (ok);
};

TimelineImpl.prototype.zoom = function (zoomIn, x, y, target) {
  var matcher = new RegExp("^timeline-band-([0-9]+)$");
  var bandIndex = null;
  
  var result = matcher.exec(target.id);
  if (result) {
    bandIndex = parseInt(result[1]);
  }

  if (bandIndex != null) {
    this._bands[bandIndex].zoom(zoomIn, x, y, target);
  }   

  this.paint();
};

    return TimelineImpl;
});

/*==================================================
 *  An "ether" is a object that maps date/time to pixel coordinates.
 *==================================================
 */

/*==================================================
 *  Linear Ether
 *==================================================
 */

define('scripts/linear-ether',["simile-ajax"], function(SimileAjax) { 
var LinearEther = function(params) {
    this._params = params;
    this._interval = params.interval;
    this._pixelsPerInterval = params.pixelsPerInterval;
};

LinearEther.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    this._unit = timeline.getUnit();
    
    if ("startsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.startsOn);
    } else if ("endsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.endsOn);
        this.shiftPixels(-this._timeline.getPixelLength());
    } else if ("centersOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.centersOn);
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    } else {
        this._start = this._unit.makeDefaultValue();
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    }
};

LinearEther.prototype.setDate = function(date) {
    this._start = this._unit.cloneValue(date);
};

LinearEther.prototype.shiftPixels = function(pixels) {
    var numeric = this._interval * pixels / this._pixelsPerInterval;
    this._start = this._unit.change(this._start, numeric);
};

LinearEther.prototype.dateToPixelOffset = function(date) {
    var numeric = this._unit.compare(date, this._start);
    return this._pixelsPerInterval * numeric / this._interval;
};

LinearEther.prototype.pixelOffsetToDate = function(pixels) {
    var numeric = pixels * this._interval / this._pixelsPerInterval;
    return this._unit.change(this._start, numeric);
};

LinearEther.prototype.zoom = function(zoomIn) {
  var netIntervalChange = 0;
  var currentZoomIndex = this._band._zoomIndex;
  var newZoomIndex = currentZoomIndex;

  if (zoomIn && (currentZoomIndex > 0)) {
    newZoomIndex = currentZoomIndex - 1;
  }
  
  if (!zoomIn && (currentZoomIndex < (this._band._zoomSteps.length - 1))) {
    newZoomIndex = currentZoomIndex + 1;
  }

  this._band._zoomIndex = newZoomIndex;  
  this._interval = 
    SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[newZoomIndex].unit];
  this._pixelsPerInterval = this._band._zoomSteps[newZoomIndex].pixelsPerInterval;
  netIntervalChange = this._band._zoomSteps[newZoomIndex].unit - 
    this._band._zoomSteps[currentZoomIndex].unit;

  return netIntervalChange;
};

    return LinearEther;
});

/*==================================================
 *  Ether Interval Marker Layout
 *==================================================
 */

define('scripts/ether-interval-marker-layout',["simile-ajax"], function(SimileAjax) { 
var EtherIntervalMarkerLayout = function(timeline, band, theme, align, showLine) {
    var horizontal = timeline.isHorizontal();
    if (horizontal) {
        if (align == "Top") {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.top = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.bottom = "0px";
            };
        }
    } else {
        if (align == "Left") {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.left = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.right = "0px";
            };
        }
    }
    
    var markerTheme = theme.ether.interval.marker;
    var lineTheme = theme.ether.interval.line;
    var weekendTheme = theme.ether.interval.weekend;
    
    var stylePrefix = (horizontal ? "h" : "v") + align;
    var labelStyler = markerTheme[stylePrefix + "Styler"];
    var emphasizedLabelStyler = markerTheme[stylePrefix + "EmphasizedStyler"];
    var day = SimileAjax.DateTime.gregorianUnitLengths[SimileAjax.DateTime.DAY];
    
    this.createIntervalMarker = function(date, labeller, unit, markerDiv, lineDiv) {
        var offset = Math.round(band.dateToPixelOffset(date));

        if (showLine && unit != SimileAjax.DateTime.WEEK) {
            var divLine = timeline.getDocument().createElement("div");
            divLine.className = "timeline-ether-lines";

            if (lineTheme.opacity < 100) {
                SimileAjax.Graphics.setOpacity(divLine, lineTheme.opacity);
            }
            
            if (horizontal) {
				//divLine.className += " timeline-ether-lines-vertical";
				divLine.style.left = offset + "px";
            } else {
				//divLine.className += " timeline-ether-lines-horizontal";
                divLine.style.top = offset + "px";
            }
            lineDiv.appendChild(divLine);
        }
        if (unit == SimileAjax.DateTime.WEEK) {
            var firstDayOfWeek = theme.firstDayOfWeek;
            
            var saturday = new Date(date.getTime() + (6 - firstDayOfWeek - 7) * day);
            var monday = new Date(saturday.getTime() + 2 * day);
            
            var saturdayPixel = Math.round(band.dateToPixelOffset(saturday));
            var mondayPixel = Math.round(band.dateToPixelOffset(monday));
            var length = Math.max(1, mondayPixel - saturdayPixel);
            
            var divWeekend = timeline.getDocument().createElement("div");            
			divWeekend.className = 'timeline-ether-weekends'

            if (weekendTheme.opacity < 100) {
                SimileAjax.Graphics.setOpacity(divWeekend, weekendTheme.opacity);
            }
            
            if (horizontal) {				
                divWeekend.style.left = saturdayPixel + "px";
                divWeekend.style.width = length + "px";                
            } else {				
                divWeekend.style.top = saturdayPixel + "px";
                divWeekend.style.height = length + "px";                
            }
            lineDiv.appendChild(divWeekend);
        }
        
        var label = labeller.labelInterval(date, unit);
        
        var div = timeline.getDocument().createElement("div");
        div.innerHTML = label.text;
        
        
        
		div.className = 'timeline-date-label'
		if(label.emphasized) div.className += ' timeline-date-label-em'
		
        this.positionDiv(div, offset);
        markerDiv.appendChild(div);
        
        return div;
    };
};

    return EtherIntervalMarkerLayout;
});

/*==================================================
 *  Ether Highlight Layout
 *==================================================
 */

define('scripts/ether-highlight',["simile-ajax"], function(SimileAjax) {
var EtherHighlight = function(timeline, band, theme, backgroundLayer) {
    var horizontal = timeline.isHorizontal();
    
    this._highlightDiv = null;
    this._createHighlightDiv = function() {
        if (this._highlightDiv == null) {
            this._highlightDiv = timeline.getDocument().createElement("div");
            this._highlightDiv.setAttribute("name", "ether-highlight"); // for debugging
            this._highlightDiv.className = 'timeline-ether-highlight'            
            
            var opacity = theme.ether.highlightOpacity;
            if (opacity < 100) {
                SimileAjax.Graphics.setOpacity(this._highlightDiv, opacity);
            }
            
            backgroundLayer.appendChild(this._highlightDiv);
        }
    }
    
    this.position = function(startDate, endDate, orthogonalOffset, orthogonalExtent) {
        orthogonalOffset = orthogonalOffset || 0;
        orthogonalExtent = orthogonalExtent || 1.0;
        
        this._createHighlightDiv();
        
        var startPixel = Math.round(band.dateToPixelOffset(startDate));
        var endPixel = Math.round(band.dateToPixelOffset(endDate));
        var length = Math.max(endPixel - startPixel, 3);
        var totalWidth = band.getViewWidth() - 4;
        if (horizontal) {
            this._highlightDiv.style.left = startPixel + "px";
            this._highlightDiv.style.width = length + "px";
            this._highlightDiv.style.top = Math.round(orthogonalOffset * totalWidth) + "px";
            this._highlightDiv.style.height = Math.round(orthogonalExtent * totalWidth) + "px";
        } else {
            this._highlightDiv.style.top = startPixel + "px";
            this._highlightDiv.style.height = length + "px";
            this._highlightDiv.style.left = Math.round(orthogonalOffset * totalWidth) + "px";
            this._highlightDiv.style.width = Math.round(orthogonalExtent * totalWidth) + "px";
        }
    }
};

    return EtherHighlight;
});

/*==================================================
 *  Gregorian Ether Painter
 *==================================================
 */
 
define('scripts/gregorian-ether-painter',[
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var GregorianEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    this._unit = params.unit;
    this._multiple = ("multiple" in params) ? params.multiple : 1;
};

GregorianEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className = 'timeline-ether-bg';
  //  this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];

    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params && this._params.align != undefined) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

GregorianEtherPainter.prototype.setHighlight = function(startDate, endDate, orthogonalOffset, orthogonalExtent) {
    this._highlight.position(startDate, endDate, orthogonalOffset, orthogonalExtent);
}

GregorianEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var timeZone = this._band.getTimeZone();
    var labeller = this._band.getLabeller();
    
    SimileAjax.DateTime.roundDownToInterval(minDate, this._unit, timeZone, this._multiple, this._theme.firstDayOfWeek);
    
    var p = this;
    var incrementDate = function(date) {
        for (var i = 0; i < p._multiple; i++) {
            SimileAjax.DateTime.incrementByInterval(date, p._unit);
        }
    };
    
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(
            minDate, labeller, this._unit, this._markerLayer, this._lineLayer);
            
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

GregorianEtherPainter.prototype.softPaint = function() {
};

GregorianEtherPainter.prototype.zoom = function(netIntervalChange) {
  if (netIntervalChange != 0) {
    this._unit += netIntervalChange;
  }
};

    return GregorianEtherPainter;
});

/*==================================================
 *  Hot Zone Gregorian Ether Painter
 *==================================================
 */

define('scripts/hot-zone-gregorian-ether-painter',[
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var HotZoneGregorianEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    
    this._zones = [{
        startTime:  Number.NEGATIVE_INFINITY,
        endTime:    Number.POSITIVE_INFINITY,
        unit:       params.unit,
        multiple:   1
    }];
    for (var i = 0; i < params.zones.length; i++) {
        var zone = params.zones[i];
        var zoneStart = SimileAjax.DateTime.parseGregorianDateTime(zone.start).getTime();
        var zoneEnd = SimileAjax.DateTime.parseGregorianDateTime(zone.end).getTime();
        
        for (var j = 0; j < this._zones.length && zoneEnd > zoneStart; j++) {
            var zone2 = this._zones[j];
            
            if (zoneStart < zone2.endTime) {
                if (zoneStart > zone2.startTime) {
                    this._zones.splice(j, 0, {
                        startTime:   zone2.startTime,
                        endTime:     zoneStart,
                        unit:        zone2.unit,
                        multiple:    zone2.multiple
                    });
                    j++;
                    
                    zone2.startTime = zoneStart;
                }
                
                if (zoneEnd < zone2.endTime) {
                    this._zones.splice(j, 0, {
                        startTime:  zoneStart,
                        endTime:    zoneEnd,
                        unit:       zone.unit,
                        multiple:   (zone.multiple) ? zone.multiple : 1
                    });
                    j++;
                    
                    zone2.startTime = zoneEnd;
                    zoneStart = zoneEnd;
                } else {
                    zone2.multiple = zone.multiple;
                    zone2.unit = zone.unit;
                    zoneStart = zone2.endTime;
                }
            } // else, try the next existing zone
        }
    }
};

HotZoneGregorianEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className ='timeline-ether-bg';
    //this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params && this._params.align != undefined) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

HotZoneGregorianEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

HotZoneGregorianEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var timeZone = this._band.getTimeZone();
    var labeller = this._band.getLabeller();
    
    var p = this;
    var incrementDate = function(date, zone) {
        for (var i = 0; i < zone.multiple; i++) {
            SimileAjax.DateTime.incrementByInterval(date, zone.unit);
        }
    };
    
    var zStart = 0;
    while (zStart < this._zones.length) {
        if (minDate.getTime() < this._zones[zStart].endTime) {
            break;
        }
        zStart++;
    }
    var zEnd = this._zones.length - 1;
    while (zEnd >= 0) {
        if (maxDate.getTime() > this._zones[zEnd].startTime) {
            break;
        }
        zEnd--;
    }
    
    for (var z = zStart; z <= zEnd; z++) {
        var zone = this._zones[z];
        
        var minDate2 = new Date(Math.max(minDate.getTime(), zone.startTime));
        var maxDate2 = new Date(Math.min(maxDate.getTime(), zone.endTime));
        
        SimileAjax.DateTime.roundDownToInterval(minDate2, zone.unit, timeZone, zone.multiple, this._theme.firstDayOfWeek);
        SimileAjax.DateTime.roundUpToInterval(maxDate2, zone.unit, timeZone, zone.multiple, this._theme.firstDayOfWeek);
        
        while (minDate2.getTime() < maxDate2.getTime()) {
            this._intervalMarkerLayout.createIntervalMarker(
                minDate2, labeller, zone.unit, this._markerLayer, this._lineLayer);
                
            incrementDate(minDate2, zone);
        }
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

HotZoneGregorianEtherPainter.prototype.softPaint = function() {
};

HotZoneGregorianEtherPainter.prototype.zoom = function(netIntervalChange) {
  if (netIntervalChange != 0) {
    for (var i = 0; i < this._zones.length; ++i) {
      if (this._zones[i]) {
        this._zones[i].unit += netIntervalChange;
      }
    }
  }
};

    return HotZoneGregorianEtherPainter;
});

/*==================================================
 *  Overview Event Painter
 *==================================================
 */
define('scripts/overview-painter',["simile-ajax"], function(SimileAjax) {
var OverviewEventPainter = function(params) {
    this._params = params;
    this._onSelectListeners = [];
    
    this._filterMatcher = null;
    this._highlightMatcher = null;
};

OverviewEventPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._eventLayer = null;
    this._highlightLayer = null;
};

OverviewEventPainter.prototype.getType = function() {
    return 'overview';
};

OverviewEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

OverviewEventPainter.prototype.removeOnSelectListener = function(listener) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        if (this._onSelectListeners[i] == listener) {
            this._onSelectListeners.splice(i, 1);
            break;
        }
    }
};

OverviewEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

OverviewEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

OverviewEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

OverviewEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

OverviewEventPainter.prototype.paint = function() {
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    this._prepareForPainting();
    
    var eventTheme = this._params.theme.event;
    var metrics = {
        trackOffset:    eventTheme.overviewTrack.offset,
        trackHeight:    eventTheme.overviewTrack.height,
        trackGap:       eventTheme.overviewTrack.gap,
        trackIncrement: eventTheme.overviewTrack.height + eventTheme.overviewTrack.gap
    }
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var filterMatcher = (this._filterMatcher != null) ? 
        this._filterMatcher :
        function(evt) { return true; };
    var highlightMatcher = (this._highlightMatcher != null) ? 
        this._highlightMatcher :
        function(evt) { return -1; };
    
    var iterator = eventSource.getEventReverseIterator(minDate, maxDate);
    while (iterator.hasNext()) {
        var evt = iterator.next();
        if (filterMatcher(evt)) {
            this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
        }
    }
    
    this._highlightLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    // update the band object for max number of tracks in this section of the ether
    this._band.updateEventTrackInfo(this._tracks.length, metrics.trackIncrement); 
};

OverviewEventPainter.prototype.softPaint = function() {
};

OverviewEventPainter.prototype._prepareForPainting = function() {
    var band = this._band;
        
    this._tracks = [];
    
    if (this._highlightLayer != null) {
        band.removeLayerDiv(this._highlightLayer);
    }
    this._highlightLayer = band.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    
    if (this._eventLayer != null) {
        band.removeLayerDiv(this._eventLayer);
    }
    this._eventLayer = band.createLayerDiv(110, "timeline-band-events");
    this._eventLayer.style.display = "none";
};

OverviewEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isInstant()) {
        this.paintInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintDurationEvent(evt, metrics, theme, highlightIndex);
    }
};

OverviewEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var startDate = evt.getStart();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    
    var color = evt.getColor(),
        klassName = evt.getClassName();
    if (klassName) {
      color = null;
    } else {
      color = color != null ? color : theme.event.duration.color;
    }
    
    var tickElmtData = this._paintEventTick(evt, startPixel, color, 100, metrics, theme);
    
    this._createHighlightDiv(highlightIndex, tickElmtData, theme);
};

OverviewEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var latestStartDate = evt.getLatestStart();
    var earliestEndDate = evt.getEarliestEnd();
    
    var latestStartPixel = Math.round(this._band.dateToPixelOffset(latestStartDate));
    var earliestEndPixel = Math.round(this._band.dateToPixelOffset(earliestEndDate));
    
    var tapeTrack = 0;
    for (; tapeTrack < this._tracks.length; tapeTrack++) {
        if (earliestEndPixel < this._tracks[tapeTrack]) {
            break;
        }
    }
    this._tracks[tapeTrack] = earliestEndPixel;
    
    var color = evt.getColor(),
        klassName = evt.getClassName();
    if (klassName) {
      color = null;
    } else {
      color = color != null ? color : theme.event.duration.color;
    }
    
    var tapeElmtData = this._paintEventTape(evt, tapeTrack, latestStartPixel, earliestEndPixel,
      color, 100, metrics, theme, klassName);
    
    this._createHighlightDiv(highlightIndex, tapeElmtData, theme);
};

OverviewEventPainter.prototype._paintEventTape = function(
    evt, track, left, right, color, opacity, metrics, theme, klassName) {
    
    var top = metrics.trackOffset + track * metrics.trackIncrement;
    var width = right - left;
    var height = metrics.trackHeight;
    
    var tapeDiv = this._timeline.getDocument().createElement("div");
    tapeDiv.className = 'timeline-small-event-tape'
    if (klassName) {tapeDiv.className += ' small-' + klassName;}
    tapeDiv.style.left = left + "px";
    tapeDiv.style.width = width + "px";
    tapeDiv.style.top = top + "px";
    tapeDiv.style.height = height + "px";
    
    if (color) {
      tapeDiv.style.backgroundColor = color; // set color here if defined by event. Else use css
    }
 //   tapeDiv.style.overflow = "hidden";   // now set in css
 //   tapeDiv.style.position = "absolute";
    if(opacity<100) SimileAjax.Graphics.setOpacity(tapeDiv, opacity);
    
    this._eventLayer.appendChild(tapeDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   tapeDiv
    };
}

OverviewEventPainter.prototype._paintEventTick = function(
    evt, left, color, opacity, metrics, theme) {
    
    var height = theme.event.overviewTrack.tickHeight;
    var top = metrics.trackOffset - height;
    var width = 1;
    
    var tickDiv = this._timeline.getDocument().createElement("div");
	  tickDiv.className = 'timeline-small-event-icon'
    tickDiv.style.left = left + "px";
    tickDiv.style.top = top + "px";
  //  tickDiv.style.width = width + "px";
  //  tickDiv.style.position = "absolute";
  //  tickDiv.style.height = height + "px";
  //  tickDiv.style.backgroundColor = color;
  //  tickDiv.style.overflow = "hidden";

    var klassName = evt.getClassName()
    if (klassName) {tickDiv.className +=' small-' + klassName};
	
    if(opacity<100) {SimileAjax.Graphics.setOpacity(tickDiv, opacity)};
    
    this._eventLayer.appendChild(tickDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   tickDiv
    };
}

OverviewEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme) {
    if (highlightIndex >= 0) {
        var doc = this._timeline.getDocument();
        var eventTheme = theme.event;
        
        var color = eventTheme.highlightColors[Math.min(highlightIndex, eventTheme.highlightColors.length - 1)];
        
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        div.style.left =    (dimensions.left - 1) + "px";
        div.style.width =   (dimensions.width + 2) + "px";
        div.style.top =     (dimensions.top - 1) + "px";
        div.style.height =  (dimensions.height + 2) + "px";
        div.style.background = color;
        
        this._highlightLayer.appendChild(div);
    }
};

OverviewEventPainter.prototype.showBubble = function(evt) {
    // not implemented
};

    return OverviewEventPainter;
});

/*==================================================
 *  Detailed Event Painter
 *==================================================
 */

// Note: a number of features from original-painter 
//       are not yet implemented in detailed painter.
//       Eg classname, id attributes for icons, labels, tapes

define('scripts/detailed-painter',["simile-ajax"], function(SimileAjax) {
var DetailedEventPainter = function(params) {
    this._params = params;
    this._onSelectListeners = [];
    
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    
    this._eventIdToElmt = {};
};

DetailedEventPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    
    this._eventIdToElmt = null;
};

DetailedEventPainter.prototype.getType = function() {
    return 'detailed';
};

DetailedEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

DetailedEventPainter.prototype.removeOnSelectListener = function(listener) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        if (this._onSelectListeners[i] == listener) {
            this._onSelectListeners.splice(i, 1);
            break;
        }
    }
};

DetailedEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

DetailedEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

DetailedEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

DetailedEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

DetailedEventPainter.prototype.paint = function() {
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    this._eventIdToElmt = {};
    this._prepareForPainting();
    
    var eventTheme = this._params.theme.event;
    var trackHeight = Math.max(eventTheme.track.height, this._frc.getLineHeight());
    var metrics = {
        trackOffset:    Math.round(this._band.getViewWidth() / 2 - trackHeight / 2),
        trackHeight:    trackHeight,
        trackGap:       eventTheme.track.gap,
        trackIncrement: trackHeight + eventTheme.track.gap,
        icon:           eventTheme.instant.icon,
        iconWidth:      eventTheme.instant.iconWidth,
        iconHeight:     eventTheme.instant.iconHeight,
        labelWidth:     eventTheme.label.width
    }
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var filterMatcher = (this._filterMatcher != null) ? 
        this._filterMatcher :
        function(evt) { return true; };
    var highlightMatcher = (this._highlightMatcher != null) ? 
        this._highlightMatcher :
        function(evt) { return -1; };
    
    var iterator = eventSource.getEventReverseIterator(minDate, maxDate);
    while (iterator.hasNext()) {
        var evt = iterator.next();
        if (filterMatcher(evt)) {
            this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
        }
    }
    
    this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    // update the band object for max number of tracks in this section of the ether
    this._band.updateEventTrackInfo(this._lowerTracks.length + this._upperTracks.length,
                                 metrics.trackIncrement); 
};

DetailedEventPainter.prototype.softPaint = function() {
};

DetailedEventPainter.prototype._prepareForPainting = function() {
    var band = this._band;
        
    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        
        var eventLabelPrototype = document.createElement("span");
        eventLabelPrototype.className = "timeline-event-label";
        this._backLayer.appendChild(eventLabelPrototype);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(eventLabelPrototype);
    }
    this._frc.update();
    this._lowerTracks = [];
    this._upperTracks = [];
    
    if (this._highlightLayer != null) {
        band.removeLayerDiv(this._highlightLayer);
    }
    this._highlightLayer = band.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    
    if (this._lineLayer != null) {
        band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = band.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    
    if (this._eventLayer != null) {
        band.removeLayerDiv(this._eventLayer);
    }
    this._eventLayer = band.createLayerDiv(110, "timeline-band-events");
    this._eventLayer.style.display = "none";
};

DetailedEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isInstant()) {
        this.paintInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintDurationEvent(evt, metrics, theme, highlightIndex);
    }
};
    
DetailedEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseInstantEvent(evt, metrics, theme, highlightIndex);
    }
}

DetailedEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseDurationEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseDurationEvent(evt, metrics, theme, highlightIndex);
    }
}
    
DetailedEventPainter.prototype.paintPreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var iconRightEdge = Math.round(startPixel + metrics.iconWidth / 2);
    var iconLeftEdge = Math.round(startPixel - metrics.iconWidth / 2);
    
    var labelSize = this._frc.computeSize(text);
    var iconTrack = this._findFreeTrackForSolid(iconRightEdge, startPixel);
    var iconElmtData = this._paintEventIcon(evt, iconTrack, iconLeftEdge, metrics, theme);
    
    var labelLeft = iconRightEdge + theme.event.label.offsetFromLine;
    var labelTrack = iconTrack;
    
    var iconTrackData = this._getTrackData(iconTrack);
    if (Math.min(iconTrackData.solid, iconTrackData.text) >= labelLeft + labelSize.width) { // label on the same track, to the right of icon
        iconTrackData.solid = iconLeftEdge;
        iconTrackData.text = labelLeft;
    } else { // label on a different track, below icon
        iconTrackData.solid = iconLeftEdge;
        
        labelLeft = startPixel + theme.event.label.offsetFromLine;
        labelTrack = this._findFreeTrackForText(iconTrack, labelLeft + labelSize.width, function(t) { t.line = startPixel - 2; });
        this._getTrackData(labelTrack).text = iconLeftEdge;
        
        this._paintEventLine(evt, startPixel, iconTrack, labelTrack, metrics, theme);
    }
    
    var labelTop = Math.round(
        metrics.trackOffset + labelTrack * metrics.trackIncrement + 
        metrics.trackHeight / 2 - labelSize.height / 2);
        
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width, labelSize.height, theme);

    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickInstantEvent(iconElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    this._createHighlightDiv(highlightIndex, iconElmtData, theme);
    
    this._eventIdToElmt[evt.getID()] = iconElmtData.elmt;
};

DetailedEventPainter.prototype.paintImpreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var endDate = evt.getEnd();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    
    var iconRightEdge = Math.round(startPixel + metrics.iconWidth / 2);
    var iconLeftEdge = Math.round(startPixel - metrics.iconWidth / 2);
    
    var labelSize = this._frc.computeSize(text);
    var iconTrack = this._findFreeTrackForSolid(endPixel, startPixel);
    
    var tapeElmtData = this._paintEventTape(evt, iconTrack, startPixel, endPixel, 
        theme.event.instant.impreciseColor, theme.event.instant.impreciseOpacity, metrics, theme);
    var iconElmtData = this._paintEventIcon(evt, iconTrack, iconLeftEdge, metrics, theme);
    
    var iconTrackData = this._getTrackData(iconTrack);
    iconTrackData.solid = iconLeftEdge;
    
    var labelLeft = iconRightEdge + theme.event.label.offsetFromLine;
    var labelRight = labelLeft + labelSize.width;
    var labelTrack;
    if (labelRight < endPixel) {
        labelTrack = iconTrack;
    } else {
        labelLeft = startPixel + theme.event.label.offsetFromLine;
        labelRight = labelLeft + labelSize.width;
    
        labelTrack = this._findFreeTrackForText(iconTrack, labelRight, function(t) { t.line = startPixel - 2; });
        this._getTrackData(labelTrack).text = iconLeftEdge;
        
        this._paintEventLine(evt, startPixel, iconTrack, labelTrack, metrics, theme);
    }
    var labelTop = Math.round(
        metrics.trackOffset + labelTrack * metrics.trackIncrement + 
        metrics.trackHeight / 2 - labelSize.height / 2);
        
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width, labelSize.height, theme);
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickInstantEvent(iconElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    this._createHighlightDiv(highlightIndex, iconElmtData, theme);
    
    this._eventIdToElmt[evt.getID()] = iconElmtData.elmt;
};

DetailedEventPainter.prototype.paintPreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var endDate = evt.getEnd();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    
    var labelSize = this._frc.computeSize(text);
    var tapeTrack = this._findFreeTrackForSolid(endPixel);
    var color = evt.getColor();
    color = color != null ? color : theme.event.duration.color;
    
    var tapeElmtData = this._paintEventTape(evt, tapeTrack, startPixel, endPixel, color, 100, metrics, theme);
    
    var tapeTrackData = this._getTrackData(tapeTrack);
    tapeTrackData.solid = startPixel;
    
    var labelLeft = startPixel + theme.event.label.offsetFromLine;
    var labelTrack = this._findFreeTrackForText(tapeTrack, labelLeft + labelSize.width, function(t) { t.line = startPixel - 2; });
    this._getTrackData(labelTrack).text = startPixel - 2;
    
    this._paintEventLine(evt, startPixel, tapeTrack, labelTrack, metrics, theme);
    
    var labelTop = Math.round(
        metrics.trackOffset + labelTrack * metrics.trackIncrement + 
        metrics.trackHeight / 2 - labelSize.height / 2);
        
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width, labelSize.height, theme);

    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickDurationEvent(tapeElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    this._createHighlightDiv(highlightIndex, tapeElmtData, theme);
    
    this._eventIdToElmt[evt.getID()] = tapeElmtData.elmt;
};

DetailedEventPainter.prototype.paintImpreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var latestStartDate = evt.getLatestStart();
    var endDate = evt.getEnd();
    var earliestEndDate = evt.getEarliestEnd();
    
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var latestStartPixel = Math.round(this._band.dateToPixelOffset(latestStartDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    var earliestEndPixel = Math.round(this._band.dateToPixelOffset(earliestEndDate));
    
    var labelSize = this._frc.computeSize(text);
    var tapeTrack = this._findFreeTrackForSolid(endPixel);
    var color = evt.getColor();
    color = color != null ? color : theme.event.duration.color;
    
    var impreciseTapeElmtData = this._paintEventTape(evt, tapeTrack, startPixel, endPixel, 
        theme.event.duration.impreciseColor, theme.event.duration.impreciseOpacity, metrics, theme);
    var tapeElmtData = this._paintEventTape(evt, tapeTrack, latestStartPixel, earliestEndPixel, color, 100, metrics, theme);
    
    var tapeTrackData = this._getTrackData(tapeTrack);
    tapeTrackData.solid = startPixel;
    
    var labelLeft = latestStartPixel + theme.event.label.offsetFromLine;
    var labelTrack = this._findFreeTrackForText(tapeTrack, labelLeft + labelSize.width, function(t) { t.line = latestStartPixel - 2; });
    this._getTrackData(labelTrack).text = latestStartPixel - 2;
    
    this._paintEventLine(evt, latestStartPixel, tapeTrack, labelTrack, metrics, theme);
    
    var labelTop = Math.round(
        metrics.trackOffset + labelTrack * metrics.trackIncrement + 
        metrics.trackHeight / 2 - labelSize.height / 2);
        
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width, labelSize.height, theme);
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickDurationEvent(tapeElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    this._createHighlightDiv(highlightIndex, tapeElmtData, theme);
    
    this._eventIdToElmt[evt.getID()] = tapeElmtData.elmt;
};

DetailedEventPainter.prototype._findFreeTrackForSolid = function(solidEdge, softEdge) {
    for (var i = 0; true; i++) {
        if (i < this._lowerTracks.length) {
            var t = this._lowerTracks[i];
            if (Math.min(t.solid, t.text) > solidEdge && (!(softEdge) || t.line > softEdge)) {
                return i;
            }
        } else {
            this._lowerTracks.push({
                solid:  Number.POSITIVE_INFINITY,
                text:   Number.POSITIVE_INFINITY,
                line:   Number.POSITIVE_INFINITY
            });
            
            return i;
        }
        
        if (i < this._upperTracks.length) {
            var t = this._upperTracks[i];
            if (Math.min(t.solid, t.text) > solidEdge && (!(softEdge) || t.line > softEdge)) {
                return -1 - i;
            }
        } else {
            this._upperTracks.push({
                solid:  Number.POSITIVE_INFINITY,
                text:   Number.POSITIVE_INFINITY,
                line:   Number.POSITIVE_INFINITY
            });
            
            return -1 - i;
        }
    }
};

DetailedEventPainter.prototype._findFreeTrackForText = function(fromTrack, edge, occupiedTrackVisitor) {
    var extendUp;
    var index;
    var firstIndex;
    var result;
    
    if (fromTrack < 0) {
        extendUp = true;
        firstIndex = -fromTrack;
        
        index = this._findFreeUpperTrackForText(firstIndex, edge);
        result = -1 - index;
    } else if (fromTrack > 0) {
        extendUp = false;
        firstIndex = fromTrack + 1;
        
        index = this._findFreeLowerTrackForText(firstIndex, edge);
        result = index;
    } else {
        var upIndex = this._findFreeUpperTrackForText(0, edge);
        var downIndex = this._findFreeLowerTrackForText(1, edge);
        
        if (downIndex - 1 <= upIndex) {
            extendUp = false;
            firstIndex = 1;
            index = downIndex;
            result = index;
        } else {
            extendUp = true;
            firstIndex = 0;
            index = upIndex;
            result = -1 - index;
        }
    }
    
    if (extendUp) {
        if (index == this._upperTracks.length) {
            this._upperTracks.push({
                solid:  Number.POSITIVE_INFINITY,
                text:   Number.POSITIVE_INFINITY,
                line:   Number.POSITIVE_INFINITY
            });
        }
        for (var i = firstIndex; i < index; i++) {
            occupiedTrackVisitor(this._upperTracks[i]);
        }
    } else {
        if (index == this._lowerTracks.length) {
            this._lowerTracks.push({
                solid:  Number.POSITIVE_INFINITY,
                text:   Number.POSITIVE_INFINITY,
                line:   Number.POSITIVE_INFINITY
            });
        }
        for (var i = firstIndex; i < index; i++) {
            occupiedTrackVisitor(this._lowerTracks[i]);
        }
    }
    return result;
};

DetailedEventPainter.prototype._findFreeLowerTrackForText = function(index, edge) {
    for (; index < this._lowerTracks.length; index++) {
        var t = this._lowerTracks[index];
        if (Math.min(t.solid, t.text) >= edge) {
            break;
        }
    }
    return index;
};

DetailedEventPainter.prototype._findFreeUpperTrackForText = function(index, edge) {
    for (; index < this._upperTracks.length; index++) {
        var t = this._upperTracks[index];
        if (Math.min(t.solid, t.text) >= edge) {
            break;
        }
    }
    return index;
};

DetailedEventPainter.prototype._getTrackData = function(index) {
    return (index < 0) ? this._upperTracks[-index - 1] : this._lowerTracks[index];
};

DetailedEventPainter.prototype._paintEventLine = function(evt, left, startTrack, endTrack, metrics, theme) {
    var top = Math.round(metrics.trackOffset + startTrack * metrics.trackIncrement + metrics.trackHeight / 2);
    var height = Math.round(Math.abs(endTrack - startTrack) * metrics.trackIncrement);
    
    var lineStyle = "1px solid " + theme.event.label.lineColor;
    var lineDiv = this._timeline.getDocument().createElement("div");
	lineDiv.style.position = "absolute";
    lineDiv.style.left = left + "px";
    lineDiv.style.width = theme.event.label.offsetFromLine + "px";
    lineDiv.style.height = height + "px";
    if (startTrack > endTrack) {
        lineDiv.style.top = (top - height) + "px";
        lineDiv.style.borderTop = lineStyle;
    } else {
        lineDiv.style.top = top + "px";
        lineDiv.style.borderBottom = lineStyle;
    }
    lineDiv.style.borderLeft = lineStyle;
    this._lineLayer.appendChild(lineDiv);
};

DetailedEventPainter.prototype._paintEventIcon = function(evt, iconTrack, left, metrics, theme) {
    var icon = evt.getIcon();
    icon = icon != null ? icon : metrics.icon;
    
    var middle = metrics.trackOffset + iconTrack * metrics.trackIncrement + metrics.trackHeight / 2;
    var top = Math.round(middle - metrics.iconHeight / 2);

    var img = SimileAjax.Graphics.createTranslucentImage(icon);
    var iconDiv = this._timeline.getDocument().createElement("div");
    iconDiv.style.position = "absolute";
    iconDiv.style.left = left + "px";
    iconDiv.style.top = top + "px";
    iconDiv.appendChild(img);
    iconDiv.style.cursor = "pointer";

    if(evt._title != null)
        iconDiv.title = evt._title

    this._eventLayer.appendChild(iconDiv);
    
    return {
        left:   left,
        top:    top,
        width:  metrics.iconWidth,
        height: metrics.iconHeight,
        elmt:   iconDiv
    };
};

DetailedEventPainter.prototype._paintEventLabel = function(evt, text, left, top, width, height, theme) {
    var doc = this._timeline.getDocument();
    
    var labelBackgroundDiv = doc.createElement("div");
    labelBackgroundDiv.style.position = "absolute";
    labelBackgroundDiv.style.left = left + "px";
    labelBackgroundDiv.style.width = width + "px";
    labelBackgroundDiv.style.top = top + "px";
    labelBackgroundDiv.style.height = height + "px";
    labelBackgroundDiv.style.backgroundColor = theme.event.label.backgroundColor;
    SimileAjax.Graphics.setOpacity(labelBackgroundDiv, theme.event.label.backgroundOpacity);
    this._eventLayer.appendChild(labelBackgroundDiv);
    
    var labelDiv = doc.createElement("div");
    labelDiv.style.position = "absolute";
    labelDiv.style.left = left + "px";
    labelDiv.style.width = width + "px";
    labelDiv.style.top = top + "px";
    labelDiv.innerHTML = text;
    labelDiv.style.cursor = "pointer";

    if(evt._title != null)
        labelDiv.title = evt._title;
    
    var color = evt.getTextColor();
    if (color == null) {
        color = evt.getColor();
    }
    if (color != null) {
        labelDiv.style.color = color;
    }
    
    this._eventLayer.appendChild(labelDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   labelDiv
    };
};

DetailedEventPainter.prototype._paintEventTape = function(
    evt, iconTrack, startPixel, endPixel, color, opacity, metrics, theme) {
    
    var tapeWidth = endPixel - startPixel;
    var tapeHeight = theme.event.tape.height;
    var middle = metrics.trackOffset + iconTrack * metrics.trackIncrement + metrics.trackHeight / 2;
    var top = Math.round(middle - tapeHeight / 2);
    
    var tapeDiv = this._timeline.getDocument().createElement("div");
    tapeDiv.style.position = "absolute";
    tapeDiv.style.left = startPixel + "px";
    tapeDiv.style.width = tapeWidth + "px";
    tapeDiv.style.top = top + "px";
    tapeDiv.style.height = tapeHeight + "px";
    tapeDiv.style.backgroundColor = color;
    tapeDiv.style.overflow = "hidden";
    tapeDiv.style.cursor = "pointer";

    if(evt._title != null)
        tapeDiv.title = evt._title;

    SimileAjax.Graphics.setOpacity(tapeDiv, opacity);
    
    this._eventLayer.appendChild(tapeDiv);
    
    return {
        left:   startPixel,
        top:    top,
        width:  tapeWidth,
        height: tapeHeight,
        elmt:   tapeDiv
    };
}

DetailedEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme) {
    if (highlightIndex >= 0) {
        var doc = this._timeline.getDocument();
        var eventTheme = theme.event;
        
        var color = eventTheme.highlightColors[Math.min(highlightIndex, eventTheme.highlightColors.length - 1)];
        
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        div.style.left =    (dimensions.left - 2) + "px";
        div.style.width =   (dimensions.width + 4) + "px";
        div.style.top =     (dimensions.top - 2) + "px";
        div.style.height =  (dimensions.height + 4) + "px";
        div.style.background = color;
        
        this._highlightLayer.appendChild(div);
    }
};

DetailedEventPainter.prototype._onClickInstantEvent = function(icon, domEvt, evt) {
    var c = SimileAjax.DOM.getPageCoordinates(icon);
    this._showBubble(
        c.left + Math.ceil(icon.offsetWidth / 2), 
        c.top + Math.ceil(icon.offsetHeight / 2),
        evt
    );
    this._fireOnSelect(evt.getID());
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

DetailedEventPainter.prototype._onClickDurationEvent = function(target, domEvt, evt) {
    if ("pageX" in domEvt) {
        var x = domEvt.pageX;
        var y = domEvt.pageY;
    } else {
        var c = SimileAjax.DOM.getPageCoordinates(target);
        var x = domEvt.offsetX + c.left;
        var y = domEvt.offsetY + c.top;
    }
    this._showBubble(x, y, evt);
    this._fireOnSelect(evt.getID());
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

DetailedEventPainter.prototype.showBubble = function(evt) {
    var elmt = this._eventIdToElmt[evt.getID()];
    if (elmt) {
        var c = SimileAjax.DOM.getPageCoordinates(elmt);
        this._showBubble(c.left + elmt.offsetWidth / 2, c.top + elmt.offsetHeight / 2, evt);
    }
};

DetailedEventPainter.prototype._showBubble = function(x, y, evt) {
    var div = document.createElement("div");
    var themeBubble = this._params.theme.event.bubble;
    evt.fillInfoBubble(div, this._params.theme, this._band.getLabeller());
    
    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(div, x, y, 
       themeBubble.width, null, themeBubble.maxHeight);
};

DetailedEventPainter.prototype._fireOnSelect = function(eventID) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        this._onSelectListeners[i](eventID);
    }
};

    return DetailedEventPainter;
});

/*==================================================
 *  Event Utils
 *==================================================
 */
define('scripts/event-utils',["./base"], function(Timeline) {
var EventUtils = {};

EventUtils.getNewEventID = function() {
    // global across page
    if (this._lastEventID == null) {
        this._lastEventID = 0;
    }
    
    this._lastEventID += 1;
    return "e" + this._lastEventID;
};

EventUtils.decodeEventElID = function(elementID) {
    /*==================================================
     * 
     * Use this function to decode an event element's id on a band (label div,
     * tape div or icon img).
     *
     * Returns {band: <bandObj>, evt: <eventObj>} 
     *
     * To enable a single event listener to monitor everything
     * on a Timeline, a set format is used for the id's of the 
     * elements on the Timeline--
     * 
     * element id format for labels, icons, tapes:
     *   labels: label-tl-<timelineID>-<band_index>-<evt.id>
     *    icons: icon-tl-<timelineID>-<band_index>-<evt.id>
     *    tapes: tape1-tl-<timelineID>-<band_index>-<evt.id>
     *           tape2-tl-<timelineID>-<band_index>-<evt.id>
     *           // some events have more than one tape
     *    highlight: highlight1-tl-<timelineID>-<band_index>-<evt.id>
     *               highlight2-tl-<timelineID>-<band_index>-<evt.id>
     *           // some events have more than one highlight div (future) 
     * Note: use split('-') to get array of the format's parts
     * 
     * You can then retrieve the timeline object and event object
     * by using Timeline.getTimeline, Timeline.getBand, or
     * Timeline.getEvent and passing in the element's id
     *
     *==================================================
     */
    
    var parts = elementID.split('-');
    if (parts[1] != 'tl') {
        alert("Internal Timeline problem 101, please consult support");
        return {band: null, evt: null}; // early return
    }
    
    var timeline = Timeline.getTimelineFromID(parts[2]);
    var band = timeline.getBand(parts[3]);
    var evt = band.getEventSource.getEvent(parts[4]);
    
    return {band: band, evt: evt};
};

EventUtils.encodeEventElID = function(timeline, band, elType, evt) {
    // elType should be one of {label | icon | tapeN | highlightN}
    return elType + "-tl-" + timeline.timelineID + 
       "-" + band.getIndex() + "-" + evt.getID();
};

    return EventUtils;
});

/*==================================================
 *  Original Event Painter
 *==================================================
 */

/*==================================================
 * 
 * To enable a single event listener to monitor everything
 * on a Timeline, we need a way to map from an event's icon,
 * label or tape element to the associated timeline, band and
 * specific event.
 *
 * Thus a set format is used for the id's of the 
 * events' elements on the Timeline--
 * 
 * element id format for labels, icons, tapes:
 *   labels: label-tl-<timelineID>-<band_index>-<evt.id>
 *    icons: icon-tl-<timelineID>-<band_index>-<evt.id>
 *    tapes: tape1-tl-<timelineID>-<band_index>-<evt.id>
 *           tape2-tl-<timelineID>-<band_index>-<evt.id>
 *           // some events have more than one tape
 *    highlight: highlight1-tl-<timelineID>-<band_index>-<evt.id>
 *               highlight2-tl-<timelineID>-<band_index>-<evt.id>
 *           // some events have more than one highlight div (future) 
 * You can then retrieve the band/timeline objects and event object
 * by using Timeline.EventUtils.decodeEventElID
 *
 *==================================================
 */
 
/* 
 *    eventPaintListener functions receive calls about painting.
 *    function(band, op, evt, els)
 *       context: 'this' will be an OriginalEventPainter object.
 *                It has properties and methods for obtaining
 *                the relevant band, timeline, etc    
 *       band = the band being painted
 *       op = 'paintStarting' // the painter is about to remove
 *            all previously painted events, if any. It will
 *            then start painting all of the visible events that
 *            pass the filter. 
 *            evt = null, els = null
 *       op = 'paintEnded' // the painter has finished painting
 *            all of the visible events that passed the filter
 *            evt = null, els = null
 *       op = 'paintedEvent' // the painter just finished painting an event
 *            evt = event just painted
 *            els = array of painted elements' divs. Depending on the event,
 *                  the array could be just a tape or icon (if no label).
 *                  Or could include label, multiple tape divs (imprecise event),
 *                  highlight divs. The array is not ordered. The meaning of
 *                  each el is available by decoding the el's id 
 *      Note that there may be no paintedEvent calls if no events were visible
 *      or passed the filter.
 */

define('scripts/original-painter',[
    "simile-ajax",
    "./event-utils"
], function(SimileAjax, EventUtils) {
var OriginalEventPainter = function(params) {
    this._params = params;
    this._onSelectListeners = [];
    this._eventPaintListeners = [];
    this._tracks = [];
    
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    
    this._eventIdToElmt = {};
};

OriginalEventPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    
    this._eventIdToElmt = null;

    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        
        var eventLabelPrototype = document.createElement("span");
        eventLabelPrototype.className = "timeline-event-label";
        this._backLayer.appendChild(eventLabelPrototype);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(eventLabelPrototype);
    }
    this._frc.update();
};

OriginalEventPainter.prototype.getType = function() {
    return 'original';
};

OriginalEventPainter.prototype.supportsOrthogonalScrolling = function() {
    return true;
};

OriginalEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

OriginalEventPainter.prototype.removeOnSelectListener = function(listener) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        if (this._onSelectListeners[i] == listener) {
            this._onSelectListeners.splice(i, 1);
            break;
        }
    }
};

OriginalEventPainter.prototype.addEventPaintListener = function(listener) {
    this._eventPaintListeners.push(listener);
};

OriginalEventPainter.prototype.removeEventPaintListener = function(listener) {
    for (var i = 0; i < this._eventPaintListeners.length; i++) {
        if (this._eventPaintListeners[i] == listener) {
            this._eventPaintListeners.splice(i, 1);
            break;
        }
    }
};

OriginalEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

OriginalEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

OriginalEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

OriginalEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

OriginalEventPainter.prototype.paint = function() {
    // Paints the events for a given section of the band--what is
    // visible on screen and some extra.
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    this._eventIdToElmt = {};
    this._fireEventPaintListeners('paintStarting', null, null);
    this._prepareForPainting();

    var metrics = this._computeMetrics();
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var filterMatcher = (this._filterMatcher != null) ? 
        this._filterMatcher :
        function(evt) { return true; };
    var highlightMatcher = (this._highlightMatcher != null) ? 
        this._highlightMatcher :
        function(evt) { return -1; };
    
    var iterator = eventSource.getEventReverseIterator(minDate, maxDate);
    while (iterator.hasNext()) {
        var evt = iterator.next();
        if (filterMatcher(evt)) {
            this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
        }
    }
    
    this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    // update the band object for max number of tracks in this section of the ether
    this._band.updateEventTrackInfo(this._tracks.length, metrics.trackIncrement); 
    this._fireEventPaintListeners('paintEnded', null, null);
    
    this._setOrthogonalOffset(metrics);
};

OriginalEventPainter.prototype.softPaint = function() {
    this._setOrthogonalOffset(this._computeMetrics());
};

OriginalEventPainter.prototype.getOrthogonalExtent = function() {
    var metrics = this._computeMetrics();
    return 2 * metrics.trackOffset + this._tracks.length * metrics.trackIncrement;
};

OriginalEventPainter.prototype._setOrthogonalOffset = function(metrics) {
    var orthogonalOffset = this._band.getViewOrthogonalOffset();
    var layers = ["_highlightLayer", "_lineLayer", "_eventLayer"], j, layer;
    for (j = 0; j < layers.length; j++) {
        layer = this[layers[j]];
        if (layer !== null) {
            layer.style.top = orthogonalOffset + "px";
        }
    }
};

OriginalEventPainter.prototype._computeMetrics = function() {
     var eventTheme = this._params.theme.event;
     var trackHeight = Math.max(eventTheme.track.height, eventTheme.tape.height + 
                         this._frc.getLineHeight());
     var metrics = {
            trackOffset: eventTheme.track.offset,
            trackHeight: trackHeight,
               trackGap: eventTheme.track.gap,
         trackIncrement: trackHeight + eventTheme.track.gap,
                   icon: eventTheme.instant.icon,
              iconWidth: eventTheme.instant.iconWidth,
             iconHeight: eventTheme.instant.iconHeight,
             labelWidth: eventTheme.label.width,
           maxLabelChar: eventTheme.label.maxLabelChar,
    impreciseIconMargin: eventTheme.instant.impreciseIconMargin
     };
     
     return metrics;
};

OriginalEventPainter.prototype._prepareForPainting = function() {
    // Remove everything previously painted: highlight, line and event layers.
    // Prepare blank layers for painting. 
    var band = this._band;
        
    this._tracks = [];
    
    if (this._highlightLayer != null) {
        band.removeLayerDiv(this._highlightLayer);
    }
    this._highlightLayer = band.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    
    if (this._lineLayer != null) {
        band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = band.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    
    if (this._eventLayer != null) {
        band.removeLayerDiv(this._eventLayer);
    }
    this._eventLayer = band.createLayerDiv(115, "timeline-band-events");
    this._eventLayer.style.display = "none";
};

OriginalEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isInstant()) {
        this.paintInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintDurationEvent(evt, metrics, theme, highlightIndex);
    }
};
    
OriginalEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseInstantEvent(evt, metrics, theme, highlightIndex);
    }
}

OriginalEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseDurationEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseDurationEvent(evt, metrics, theme, highlightIndex);
    }
}
    
OriginalEventPainter.prototype.paintPreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var iconRightEdge = Math.round(startPixel + metrics.iconWidth / 2);
    var iconLeftEdge = Math.round(startPixel - metrics.iconWidth / 2);

    var labelDivClassName = this._getLabelDivClassName(evt);
    var labelSize = this._frc.computeSize(text, labelDivClassName);
    var labelLeft = iconRightEdge + theme.event.label.offsetFromLine;
    var labelRight = labelLeft + labelSize.width;
    
    var rightEdge = labelRight;
    var track = this._findFreeTrack(evt, rightEdge);
    
    var labelTop = Math.round(
        metrics.trackOffset + track * metrics.trackIncrement + 
        metrics.trackHeight / 2 - labelSize.height / 2);
        
    var iconElmtData = this._paintEventIcon(evt, track, iconLeftEdge, metrics, theme, 0);
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width,
        labelSize.height, theme, labelDivClassName, highlightIndex);
    var els = [iconElmtData.elmt, labelElmtData.elmt];

    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickInstantEvent(iconElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    var hDiv = this._createHighlightDiv(highlightIndex, iconElmtData, theme, evt);
    if (hDiv != null) {els.push(hDiv);}
    this._fireEventPaintListeners('paintedEvent', evt, els);

    
    this._eventIdToElmt[evt.getID()] = iconElmtData.elmt;
    this._tracks[track] = iconLeftEdge;
};

OriginalEventPainter.prototype.paintImpreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var endDate = evt.getEnd();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    
    var iconRightEdge = Math.round(startPixel + metrics.iconWidth / 2);
    var iconLeftEdge = Math.round(startPixel - metrics.iconWidth / 2);
    
    var labelDivClassName = this._getLabelDivClassName(evt);
    var labelSize = this._frc.computeSize(text, labelDivClassName);
    var labelLeft = iconRightEdge + theme.event.label.offsetFromLine;
    var labelRight = labelLeft + labelSize.width;
    
    var rightEdge = Math.max(labelRight, endPixel);
    var track = this._findFreeTrack(evt, rightEdge);
    var tapeHeight = theme.event.tape.height;
    var labelTop = Math.round(
        metrics.trackOffset + track * metrics.trackIncrement + tapeHeight);

    var iconElmtData = this._paintEventIcon(evt, track, iconLeftEdge, metrics, theme, tapeHeight);
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width,
                        labelSize.height, theme, labelDivClassName, highlightIndex);

    var color = evt.getColor();
    color = color != null ? color : theme.event.instant.impreciseColor;

    var tapeElmtData = this._paintEventTape(evt, track, startPixel, endPixel, 
        color, theme.event.instant.impreciseOpacity, metrics, theme, 0);
    var els = [iconElmtData.elmt, labelElmtData.elmt, tapeElmtData.elmt];    
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickInstantEvent(iconElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    var hDiv = this._createHighlightDiv(highlightIndex, iconElmtData, theme, evt);
    if (hDiv != null) {els.push(hDiv);}
    this._fireEventPaintListeners('paintedEvent', evt, els);

    this._eventIdToElmt[evt.getID()] = iconElmtData.elmt;
    this._tracks[track] = iconLeftEdge;
};

OriginalEventPainter.prototype.paintPreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var endDate = evt.getEnd();
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    
    var labelDivClassName = this._getLabelDivClassName(evt);
    var labelSize = this._frc.computeSize(text, labelDivClassName);
    var labelLeft = startPixel;
    var labelRight = labelLeft + labelSize.width;
    
    var rightEdge = Math.max(labelRight, endPixel);
    var track = this._findFreeTrack(evt, rightEdge);
    var labelTop = Math.round(
        metrics.trackOffset + track * metrics.trackIncrement + theme.event.tape.height);
    
    var color = evt.getColor();
    color = color != null ? color : theme.event.duration.color;
    
    var tapeElmtData = this._paintEventTape(evt, track, startPixel, endPixel, color, 100, metrics, theme, 0);
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width,
      labelSize.height, theme, labelDivClassName, highlightIndex);
    var els = [tapeElmtData.elmt, labelElmtData.elmt];
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickDurationEvent(tapeElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    var hDiv = this._createHighlightDiv(highlightIndex, tapeElmtData, theme, evt);
    if (hDiv != null) {els.push(hDiv);}
    this._fireEventPaintListeners('paintedEvent', evt, els);
    
    this._eventIdToElmt[evt.getID()] = tapeElmtData.elmt;
    this._tracks[track] = startPixel;
};

OriginalEventPainter.prototype.paintImpreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var doc = this._timeline.getDocument();
    var text = evt.getText();
    
    var startDate = evt.getStart();
    var latestStartDate = evt.getLatestStart();
    var endDate = evt.getEnd();
    var earliestEndDate = evt.getEarliestEnd();
    
    var startPixel = Math.round(this._band.dateToPixelOffset(startDate));
    var latestStartPixel = Math.round(this._band.dateToPixelOffset(latestStartDate));
    var endPixel = Math.round(this._band.dateToPixelOffset(endDate));
    var earliestEndPixel = Math.round(this._band.dateToPixelOffset(earliestEndDate));
    
    var labelDivClassName = this._getLabelDivClassName(evt);
    var labelSize = this._frc.computeSize(text, labelDivClassName);
    var labelLeft = latestStartPixel;
    var labelRight = labelLeft + labelSize.width;
    
    var rightEdge = Math.max(labelRight, endPixel);
    var track = this._findFreeTrack(evt, rightEdge);
    var labelTop = Math.round(
        metrics.trackOffset + track * metrics.trackIncrement + theme.event.tape.height);
    
    var color = evt.getColor();
    color = color != null ? color : theme.event.duration.color;
    
    // Imprecise events can have two event tapes
    // The imprecise dates tape, uses opacity to be dimmer than precise dates
    var impreciseTapeElmtData = this._paintEventTape(evt, track, startPixel, endPixel, 
        theme.event.duration.impreciseColor,
        theme.event.duration.impreciseOpacity, metrics, theme, 0);
    // The precise dates tape, regular (100%) opacity
    var tapeElmtData = this._paintEventTape(evt, track, latestStartPixel,
        earliestEndPixel, color, 100, metrics, theme, 1);
    
    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop,
        labelSize.width, labelSize.height, theme, labelDivClassName, highlightIndex);
    var els = [impreciseTapeElmtData.elmt, tapeElmtData.elmt, labelElmtData.elmt];
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickDurationEvent(tapeElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
    
    var hDiv = this._createHighlightDiv(highlightIndex, tapeElmtData, theme, evt);
    if (hDiv != null) {els.push(hDiv);}
    this._fireEventPaintListeners('paintedEvent', evt, els);
    
    this._eventIdToElmt[evt.getID()] = tapeElmtData.elmt;
    this._tracks[track] = startPixel;
};

OriginalEventPainter.prototype._encodeEventElID = function(elType, evt) {
    return EventUtils.encodeEventElID(this._timeline, this._band, elType, evt);
};

OriginalEventPainter.prototype._findFreeTrack = function(event, rightEdge) {
    var trackAttribute = event.getTrackNum();
    if (trackAttribute != null) {
        return trackAttribute; // early return since event includes track number
    }
    
    // normal case: find an open track
    for (var i = 0; i < this._tracks.length; i++) {
        var t = this._tracks[i];
        if (t > rightEdge) {
            break;
        }
    }
    return i;
};

OriginalEventPainter.prototype._paintEventIcon = function(evt, iconTrack, left, metrics, theme, tapeHeight) {
    // If no tape, then paint the icon in the middle of the track.
    // If there is a tape, paint the icon below the tape + impreciseIconMargin
    var icon = evt.getIcon();
    icon = icon != null ? icon : metrics.icon;
    
    var top; // top of the icon
    if (tapeHeight > 0) {
        top = metrics.trackOffset + iconTrack * metrics.trackIncrement + 
              tapeHeight + metrics.impreciseIconMargin;
    } else {
        var middle = metrics.trackOffset + iconTrack * metrics.trackIncrement +
                     metrics.trackHeight / 2;
        top = Math.round(middle - metrics.iconHeight / 2);
    }
    var img = SimileAjax.Graphics.createTranslucentImage(icon);
    var iconDiv = this._timeline.getDocument().createElement("div");
    iconDiv.className = this._getElClassName('timeline-event-icon', evt, 'icon');
    iconDiv.id = this._encodeEventElID('icon', evt);
    iconDiv.style.left = left + "px";
    iconDiv.style.top = top + "px";
    iconDiv.appendChild(img);

    if(evt._title != null)
        iconDiv.title = evt._title;

    this._eventLayer.appendChild(iconDiv);
    
    return {
        left:   left,
        top:    top,
        width:  metrics.iconWidth,
        height: metrics.iconHeight,
        elmt:   iconDiv
    };
};

OriginalEventPainter.prototype._paintEventLabel = function(evt, text, left, top, width,
    height, theme, labelDivClassName, highlightIndex) {
    var doc = this._timeline.getDocument();
    
    var labelDiv = doc.createElement("div");
    labelDiv.className = labelDivClassName;
    labelDiv.id = this._encodeEventElID('label', evt);
    labelDiv.style.left = left + "px";
    labelDiv.style.width = width + "px";
    labelDiv.style.top = top + "px";
    labelDiv.innerHTML = text;

    if(evt._title != null)
        labelDiv.title = evt._title;    

    var color = evt.getTextColor();
    if (color == null) {
        color = evt.getColor();
    }
    if (color != null) {
        labelDiv.style.color = color;
    }
    if (theme.event.highlightLabelBackground && highlightIndex >= 0) {
        labelDiv.style.background = this._getHighlightColor(highlightIndex, theme);
    }
    
    this._eventLayer.appendChild(labelDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   labelDiv
    };
};

OriginalEventPainter.prototype._paintEventTape = function(
    evt, iconTrack, startPixel, endPixel, color, opacity, metrics, theme, tape_index) {
    
    var tapeWidth = endPixel - startPixel;
    var tapeHeight = theme.event.tape.height;
    var top = metrics.trackOffset + iconTrack * metrics.trackIncrement;
    
    var tapeDiv = this._timeline.getDocument().createElement("div");
    tapeDiv.className = this._getElClassName('timeline-event-tape', evt, 'tape');
    tapeDiv.id = this._encodeEventElID('tape' + tape_index, evt);
    tapeDiv.style.left = startPixel + "px";
    tapeDiv.style.width = tapeWidth + "px";
    tapeDiv.style.height = tapeHeight + "px";
    tapeDiv.style.top = top + "px";

    if(evt._title != null)
        tapeDiv.title = evt._title;   
   
    if(color != null) {
        tapeDiv.style.backgroundColor = color;
    }
    
    var backgroundImage = evt.getTapeImage();
    var backgroundRepeat = evt.getTapeRepeat();
    backgroundRepeat = backgroundRepeat != null ? backgroundRepeat : 'repeat';
    if(backgroundImage != null) {
      tapeDiv.style.backgroundImage = "url(" + backgroundImage + ")";
      tapeDiv.style.backgroundRepeat = backgroundRepeat;
    } 	
    
    SimileAjax.Graphics.setOpacity(tapeDiv, opacity);
        
    this._eventLayer.appendChild(tapeDiv);
    
    return {
        left:   startPixel,
        top:    top,
        width:  tapeWidth,
        height: tapeHeight,
        elmt:   tapeDiv
    };
}

OriginalEventPainter.prototype._getLabelDivClassName = function(evt) {
    return this._getElClassName('timeline-event-label', evt, 'label');
};

OriginalEventPainter.prototype._getElClassName = function(elClassName, evt, prefix) {
    // Prefix and '_' is added to the event's classname. Set to null for no prefix
    var evt_classname = evt.getClassName(),
        pieces = [];

    if (evt_classname) {
      if (prefix) {pieces.push(prefix + '-' + evt_classname + ' ');}
      pieces.push(evt_classname + ' ');
    }
    pieces.push(elClassName);
    return(pieces.join(''));
};

OriginalEventPainter.prototype._getHighlightColor = function(highlightIndex, theme) {
    var highlightColors = theme.event.highlightColors;    
    return highlightColors[Math.min(highlightIndex, highlightColors.length - 1)];
};

OriginalEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme, evt) {
    var div = null;
    if (highlightIndex >= 0) {
        var doc = this._timeline.getDocument();        
        var color = this._getHighlightColor(highlightIndex, theme);
        
        div = doc.createElement("div");
        div.className = this._getElClassName('timeline-event-highlight', evt, 'highlight');
        div.id = this._encodeEventElID('highlight0', evt); // in future will have other
                                                           // highlight divs for tapes + icons
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        div.style.left =    (dimensions.left - 2) + "px";
        div.style.width =   (dimensions.width + 4) + "px";
        div.style.top =     (dimensions.top - 2) + "px";
        div.style.height =  (dimensions.height + 4) + "px";
        div.style.background = color;
        
        this._highlightLayer.appendChild(div);
    }
    return div;
};

OriginalEventPainter.prototype._onClickInstantEvent = function(icon, domEvt, evt) {
    var c = SimileAjax.DOM.getPageCoordinates(icon);
    this._showBubble(
        c.left + Math.ceil(icon.offsetWidth / 2), 
        c.top + Math.ceil(icon.offsetHeight / 2),
        evt
    );
    this._fireOnSelect(evt.getID());
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

OriginalEventPainter.prototype._onClickDurationEvent = function(target, domEvt, evt) {
    if ("pageX" in domEvt) {
        var x = domEvt.pageX;
        var y = domEvt.pageY;
    } else {
        var c = SimileAjax.DOM.getPageCoordinates(target);
        var x = domEvt.offsetX + c.left;
        var y = domEvt.offsetY + c.top;
    }
    this._showBubble(x, y, evt);
    this._fireOnSelect(evt.getID());
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

OriginalEventPainter.prototype.showBubble = function(evt) {
    var elmt = this._eventIdToElmt[evt.getID()];
    if (elmt) {
        var c = SimileAjax.DOM.getPageCoordinates(elmt);
        this._showBubble(c.left + elmt.offsetWidth / 2, c.top + elmt.offsetHeight / 2, evt);
    }
};

OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
    var div = document.createElement("div");
    var themeBubble = this._params.theme.event.bubble;
    evt.fillInfoBubble(div, this._params.theme, this._band.getLabeller());
    
    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(div, x, y,
        themeBubble.width, null, themeBubble.maxHeight);
};

OriginalEventPainter.prototype._fireOnSelect = function(eventID) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        this._onSelectListeners[i](eventID);
    }
};

OriginalEventPainter.prototype._fireEventPaintListeners = function(op, evt, els) {
    for (var i = 0; i < this._eventPaintListeners.length; i++) {
        this._eventPaintListeners[i](this._band, op, evt, els);
    }
};

    return OriginalEventPainter;
});

/*==================================================
 *  Hot Zone Ether
 *==================================================
 */

define('scripts/hot-zone-ether',["simile-ajax"], function(SimileAjax) { 
var HotZoneEther = function(params) {
    this._params = params;
    this._interval = params.interval;
    this._pixelsPerInterval = params.pixelsPerInterval;
    this._theme = params.theme;
};

HotZoneEther.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    this._unit = timeline.getUnit();
    
    this._zones = [{
        startTime:  Number.NEGATIVE_INFINITY,
        endTime:    Number.POSITIVE_INFINITY,
        magnify:    1
    }];
    var params = this._params;
    for (var i = 0; i < params.zones.length; i++) {
        var zone = params.zones[i];
        var zoneStart = this._unit.parseFromObject(zone.start);
        var zoneEnd =   this._unit.parseFromObject(zone.end);
        
        for (var j = 0; j < this._zones.length && this._unit.compare(zoneEnd, zoneStart) > 0; j++) {
            var zone2 = this._zones[j];
            
            if (this._unit.compare(zoneStart, zone2.endTime) < 0) {
                if (this._unit.compare(zoneStart, zone2.startTime) > 0) {
                    this._zones.splice(j, 0, {
                        startTime:   zone2.startTime,
                        endTime:     zoneStart,
                        magnify:     zone2.magnify
                    });
                    j++;
                    
                    zone2.startTime = zoneStart;
                }
                
                if (this._unit.compare(zoneEnd, zone2.endTime) < 0) {
                    this._zones.splice(j, 0, {
                        startTime:  zoneStart,
                        endTime:    zoneEnd,
                        magnify:    zone.magnify * zone2.magnify
                    });
                    j++;
                    
                    zone2.startTime = zoneEnd;
                    zoneStart = zoneEnd;
                } else {
                    zone2.magnify *= zone.magnify;
                    zoneStart = zone2.endTime;
                }
            } // else, try the next existing zone
        }
    }

    if ("startsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.startsOn);
    } else if ("endsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.endsOn);
        this.shiftPixels(-this._timeline.getPixelLength());
    } else if ("centersOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.centersOn);
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    } else {
        this._start = this._unit.makeDefaultValue();
        this.shiftPixels(-this._timeline.getPixelLength() / 2);
    }
};

HotZoneEther.prototype.setDate = function(date) {
    this._start = this._unit.cloneValue(date);
};

HotZoneEther.prototype.shiftPixels = function(pixels) {
    this._start = this.pixelOffsetToDate(pixels);
};

HotZoneEther.prototype.dateToPixelOffset = function(date) {
    return this._dateDiffToPixelOffset(this._start, date);
};

HotZoneEther.prototype.pixelOffsetToDate = function(pixels) {
    return this._pixelOffsetToDate(pixels, this._start);
};

HotZoneEther.prototype.zoom = function(zoomIn) {
  var netIntervalChange = 0;
  var currentZoomIndex = this._band._zoomIndex;
  var newZoomIndex = currentZoomIndex;

  if (zoomIn && (currentZoomIndex > 0)) {
    newZoomIndex = currentZoomIndex - 1;
  }
  
  if (!zoomIn && (currentZoomIndex < (this._band._zoomSteps.length - 1))) {
    newZoomIndex = currentZoomIndex + 1;
  }

  this._band._zoomIndex = newZoomIndex;  
  this._interval = 
    SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[newZoomIndex].unit];
  this._pixelsPerInterval = this._band._zoomSteps[newZoomIndex].pixelsPerInterval;
  netIntervalChange = this._band._zoomSteps[newZoomIndex].unit - 
    this._band._zoomSteps[currentZoomIndex].unit;

  return netIntervalChange;
};

HotZoneEther.prototype._dateDiffToPixelOffset = function(fromDate, toDate) {
    var scale = this._getScale();
    var fromTime = fromDate;
    var toTime = toDate;
    
    var pixels = 0;
    if (this._unit.compare(fromTime, toTime) < 0) {
        var z = 0;
        while (z < this._zones.length) {
            if (this._unit.compare(fromTime, this._zones[z].endTime) < 0) {
                break;
            }
            z++;
        }
        
        while (this._unit.compare(fromTime, toTime) < 0) {
            var zone = this._zones[z];
            var toTime2 = this._unit.earlier(toTime, zone.endTime);
            
            pixels += (this._unit.compare(toTime2, fromTime) / (scale / zone.magnify));
            
            fromTime = toTime2;
            z++;
        }
    } else {
        var z = this._zones.length - 1;
        while (z >= 0) {
            if (this._unit.compare(fromTime, this._zones[z].startTime) > 0) {
                break;
            }
            z--;
        }
        
        while (this._unit.compare(fromTime, toTime) > 0) {
            var zone = this._zones[z];
            var toTime2 = this._unit.later(toTime, zone.startTime);
            
            pixels += (this._unit.compare(toTime2, fromTime) / (scale / zone.magnify));
            
            fromTime = toTime2;
            z--;
        }
    }
    return pixels;
};

HotZoneEther.prototype._pixelOffsetToDate = function(pixels, fromDate) {
    var scale = this._getScale();
    var time = fromDate;
    if (pixels > 0) {
        var z = 0;
        while (z < this._zones.length) {
            if (this._unit.compare(time, this._zones[z].endTime) < 0) {
                break;
            }
            z++;
        }
        
        while (pixels > 0) {
            var zone = this._zones[z];
            var scale2 = scale / zone.magnify;
            
            if (zone.endTime == Number.POSITIVE_INFINITY) {
                time = this._unit.change(time, pixels * scale2);
                pixels = 0;
            } else {
                var pixels2 = this._unit.compare(zone.endTime, time) / scale2;
                if (pixels2 > pixels) {
                    time = this._unit.change(time, pixels * scale2);
                    pixels = 0;
                } else {
                    time = zone.endTime;
                    pixels -= pixels2;
                }
            }
            z++;
        }
    } else {
        var z = this._zones.length - 1;
        while (z >= 0) {
            if (this._unit.compare(time, this._zones[z].startTime) > 0) {
                break;
            }
            z--;
        }
        
        pixels = -pixels;
        while (pixels > 0) {
            var zone = this._zones[z];
            var scale2 = scale / zone.magnify;
            
            if (zone.startTime == Number.NEGATIVE_INFINITY) {
                time = this._unit.change(time, -pixels * scale2);
                pixels = 0;
            } else {
                var pixels2 = this._unit.compare(time, zone.startTime) / scale2;
                if (pixels2 > pixels) {
                    time = this._unit.change(time, -pixels * scale2);
                    pixels = 0;
                } else {
                    time = zone.startTime;
                    pixels -= pixels2;
                }
            }
            z--;
        }
    }
    return time;
};

HotZoneEther.prototype._getScale = function() {
    return this._interval / this._pixelsPerInterval;
};

    return HotZoneEther;
});

/*==================================================
 *  Classic Theme
 *==================================================
 */
define('scripts/themes',["./base"], function(Timeline) {
var ClassicTheme = new Object();

ClassicTheme.implementations = [];

ClassicTheme.create = function(locale) {
    if (locale == null) {
        locale = Timeline.getDefaultLocale();
    }
    
    var f = ClassicTheme.implementations[locale];
    if (f == null) {
        f = ClassicTheme._Impl;
    }
    return new f();
};

ClassicTheme._Impl = function() {
    this.firstDayOfWeek = 0; // Sunday
          
    // Note: Many styles previously set here are now set using CSS
    //       The comments indicate settings controlled by CSS, not
    //       lines to be un-commented.
    //
    //
    // Attributes autoWidth, autoWidthAnimationTime, timeline_start 
    // and timeline_stop must be set on the first band's theme.
    // The other attributes can be set differently for each 
    // band by using different themes for the bands.
    this.autoWidth = false; // Should the Timeline automatically grow itself, as
                            // needed when too many events for the available width
                            // are painted on the visible part of the Timeline?
    this.autoWidthAnimationTime = 500; // mSec
    this.timeline_start = null; // Setting a date, eg new Date(Date.UTC(2008,0,17,20,00,00,0)) will prevent the
                                // Timeline from being moved to anytime before the date.
    this.timeline_stop = null;  // Use for setting a maximum date. The Timeline will not be able 
                                // to be moved to anytime after this date.
    this.ether = {
        backgroundColors: [
        //    "#EEE",
        //    "#DDD",
        //    "#CCC",
        //    "#AAA"
        ],
     //   highlightColor:     "white",
        highlightOpacity:   50,
        interval: {
            line: {
                show:       true,
                opacity:    25
               // color:      "#aaa",
            },
            weekend: {
                opacity:    30
              //  color:      "#FFFFE0",
            },
            marker: {
                hAlign:     "Bottom",
                vAlign:     "Right"
                                        /*
                hBottomStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom";
                },
                hBottomEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-bottom-emphasized";
                },
                hTopStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top";
                },
                hTopEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-top-emphasized";
                },
                */
                                        
                    
               /*
                                  vRightStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right";
                },
                vRightEmphasizedStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-right-emphasized";
                },
                vLeftStyler: function(elmt) {
                    elmt.className = "timeline-ether-marker-left";
                },
                vLeftEmphasizedStyler:function(elmt) {
                    elmt.className = "timeline-ether-marker-left-emphasized";
                }
                */
            }
        }
    };
    
    this.event = {
        track: {
                   height: 10, // px. You will need to change the track
                               //     height if you change the tape height.
                      gap:  2, // px. Gap between tracks
                   offset:  2, // px. top margin above tapes
          autoWidthMargin:  1.5
          /* autoWidthMargin is only used if autoWidth (see above) is true.
             The autoWidthMargin setting is used to set how close the bottom of the
             lowest track is to the edge of the band's div. The units are total track
             width (tape + label + gap). A min of 0.5 is suggested. Use this setting to
             move the bottom track's tapes above the axis markers, if needed for your
             Timeline.
          */
        },
        overviewTrack: {
                  offset: 20, // px -- top margin above tapes 
              tickHeight:  6, // px
                  height:  2, // px
                     gap:  1, // px
         autoWidthMargin:  5 // This attribute is only used if autoWidth (see above) is true.
        },
        tape: {
            height:         4 // px. For thicker tapes, remember to change track height too.
        },
        instant: {
                           icon: Timeline.urlPrefix + "images/dull-blue-circle.png", 
                                 // default icon. Icon can also be specified per event
                      iconWidth: 10,
                     iconHeight: 10,
               impreciseOpacity: 20, // opacity of the tape when durationEvent is false
            impreciseIconMargin: 3   // A tape and an icon are painted for imprecise instant
                                     // events. This attribute is the margin between the
                                     // bottom of the tape and the top of the icon in that
                                     // case.
    //        color:             "#58A0DC",
    //        impreciseColor:    "#58A0DC",
        },
        duration: {
            impreciseOpacity: 20 // tape opacity for imprecise part of duration events
      //      color:            "#58A0DC",
      //      impreciseColor:   "#58A0DC",
        },
        label: {
            backgroundOpacity: 50,// only used in detailed painter
               offsetFromLine:  3 // px left margin amount from icon's right edge
      //      backgroundColor:   "white",
      //      lineColor:         "#58A0DC",
        },
        highlightColors: [  // Use with getEventPainter().setHighlightMatcher
                            // See webapp/examples/examples.js
            "#FFFF00",
            "#FFC000",
            "#FF0000",
            "#0000FF"
        ],
        highlightLabelBackground: false, // When highlighting an event, also change the event's label background?
        bubble: {
            width:          250, // px
            maxHeight:        0, // px Maximum height of bubbles. 0 means no max height. 
                                 // scrollbar will be added for taller bubbles
            titleStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-title";
            },
            bodyStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-body";
            },
            imageStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-image";
            },
            wikiStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-wiki";
            },
            timeStyler: function(elmt) {
                elmt.className = "timeline-event-bubble-time";
            }
        }
    };
    
    this.mouseWheel = 'scroll'; // 'default', 'zoom', 'scroll'
};

    return ClassicTheme;
});
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
define('scripts/timeline',[
    "simile-ajax",
    "./base",
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

/*==================================================
 *  Span Highlight Decorator
 *==================================================
 */

define('scripts/span-decorator',["simile-ajax"], function(SimileAjax) {
var SpanHighlightDecorator = function(params) {
    // When evaluating params, test against null. Not "p in params". Testing against
    // null enables caller to explicitly request the default. Testing against "in" means
    // that the param has to be ommitted to get the default.
    this._unit = params.unit != null ? params.unit : SimileAjax.NativeDateUnit;
    this._startDate = (typeof params.startDate == "string") ? 
        this._unit.parseFromObject(params.startDate) : params.startDate;
    this._endDate = (typeof params.endDate == "string") ?
        this._unit.parseFromObject(params.endDate) : params.endDate;
    this._startLabel = params.startLabel != null ? params.startLabel : ""; // not null!
    this._endLabel   = params.endLabel   != null ? params.endLabel   : ""; // not null!
    this._color = params.color;
    this._cssClass = params.cssClass != null ? params.cssClass : null;
    this._opacity = params.opacity != null ? params.opacity : 100;
         // Default z is 10, behind everything but background grid.
         // If inFront, then place just behind events, in front of everything else
    this._zIndex = (params.inFront != null && params.inFront) ? 113 : 10;
};

SpanHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._layerDiv = null;
};

SpanHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(this._zIndex);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._unit.compare(this._startDate, maxDate) < 0 &&
        this._unit.compare(this._endDate, minDate) > 0) {
        
        minDate = this._unit.later(minDate, this._startDate);
        maxDate = this._unit.earlier(maxDate, this._endDate);
        
        var minPixel = this._band.dateToPixelOffset(minDate);
        var maxPixel = this._band.dateToPixelOffset(maxDate);
        
        var doc = this._timeline.getDocument();
        
        var createTable = function() {
            var table = doc.createElement("table");
            table.insertRow(0).insertCell(0);
            return table;
        };
    
        var div = doc.createElement("div");
        div.className='timeline-highlight-decorator'
        if(this._cssClass) {
        	  div.className += ' ' + this._cssClass;
        }
        if(this._color != null) {
        	  div.style.backgroundColor = this._color;
        }                      
        if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(div, this._opacity);
        }
        this._layerDiv.appendChild(div);
            
        var tableStartLabel = createTable();
        tableStartLabel.className = 'timeline-highlight-label timeline-highlight-label-start'
        var tdStart =  tableStartLabel.rows[0].cells[0]
        tdStart.innerHTML = this._startLabel;
        if (this._cssClass) {
        	  tdStart.className = 'label_' + this._cssClass;
        }
        this._layerDiv.appendChild(tableStartLabel);
                    
        var tableEndLabel = createTable();
        tableEndLabel.className = 'timeline-highlight-label timeline-highlight-label-end'
        var tdEnd = tableEndLabel.rows[0].cells[0]
        tdEnd.innerHTML = this._endLabel;
        if (this._cssClass) {
        	   tdEnd.className = 'label_' + this._cssClass;
        }
        this._layerDiv.appendChild(tableEndLabel);
        
        if (this._timeline.isHorizontal()){
            div.style.left = minPixel + "px";
            div.style.width = (maxPixel - minPixel) + "px";
                              
            tableStartLabel.style.right = (this._band.getTotalViewLength() - minPixel) + "px";
            tableStartLabel.style.width = (this._startLabel.length) + "em";       
                                          
            tableEndLabel.style.left = maxPixel + "px";
            tableEndLabel.style.width = (this._endLabel.length) + "em";
            
        } else {
            div.style.top = minPixel + "px";
            div.style.height = (maxPixel - minPixel) + "px";
            
            tableStartLabel.style.bottom = minPixel + "px";
            tableStartLabel.style.height = "1.5px";
            
            tableEndLabel.style.top = maxPixel + "px";
            tableEndLabel.style.height = "1.5px";        
        }
    }
    this._layerDiv.style.display = "block";
};

SpanHighlightDecorator.prototype.softPaint = function() {
};

    return SpanHighlightDecorator;
});

/*==================================================
 *  Point Highlight Decorator
 *==================================================
 */

define('scripts/point-decorator',["simile-ajax"], function(SimileAjax) {
var PointHighlightDecorator = function(params) {
    this._unit = params.unit != null ? params.unit : SimileAjax.NativeDateUnit;
    this._date = (typeof params.date == "string") ? 
        this._unit.parseFromObject(params.date) : params.date;
    this._width = params.width != null ? params.width : 10;
      // Since the width is used to calculate placements (see minPixel, below), we
      // specify width here, not in css.
    this._color = params.color;
    this._cssClass = params.cssClass != null ? params.cssClass : '';
    this._opacity = params.opacity != null ? params.opacity : 100;
};

PointHighlightDecorator.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;    
    this._layerDiv = null;
};

PointHighlightDecorator.prototype.paint = function() {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    }
    this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator"); // for debugging
    this._layerDiv.style.display = "none";
    
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    if (this._unit.compare(this._date, maxDate) < 0 &&
        this._unit.compare(this._date, minDate) > 0) {
        
        var pixel = this._band.dateToPixelOffset(this._date);
        var minPixel = pixel - Math.round(this._width / 2);
        
        var doc = this._timeline.getDocument();
    
        var div = doc.createElement("div");
        div.className='timeline-highlight-point-decorator';
        div.className += ' ' + this._cssClass;
                    
        if(this._color != null) {
        	  div.style.backgroundColor = this._color;
        }
        if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(div, this._opacity);
        }
        this._layerDiv.appendChild(div);
            
        if (this._timeline.isHorizontal()) {
            div.style.left = minPixel + "px";
            div.style.width = this._width + "px";
        } else {
            div.style.top = minPixel + "px";
            div.style.height = this._width + "px";
        }
    }
    this._layerDiv.style.display = "block";
};

PointHighlightDecorator.prototype.softPaint = function() {
};

    return PointHighlightDecorator;
});

/*==================================================
 *  Default Event Source
 *==================================================
 */

define('scripts/sources',[
    "simile-ajax",
    "./base",
    "./event-utils",
    "i18n!nls/timeline"
], function(SimileAjax, Timeline, EventUtils, Locale) {
DefaultEventSource = function(eventIndex) {
    this._events = (eventIndex instanceof Object) ? eventIndex : new SimileAjax.EventIndex();
    this._listeners = [];
};

DefaultEventSource.prototype.addListener = function(listener) {
    this._listeners.push(listener);
};

DefaultEventSource.prototype.removeListener = function(listener) {
    for (var i = 0; i < this._listeners.length; i++) {
        if (this._listeners[i] == listener) {
            this._listeners.splice(i, 1);
            break;
        }
    }
};

DefaultEventSource.prototype.loadXML = function(xml, url) {
    var base = this._getBaseURL(url);
    
    var wikiURL = xml.documentElement.getAttribute("wiki-url");
    var wikiSection = xml.documentElement.getAttribute("wiki-section");

    var dateTimeFormat = xml.documentElement.getAttribute("date-time-format");
    var parseDateTimeFunction = this._events.getUnit().getParser(dateTimeFormat);

    var node = xml.documentElement.firstChild;
    var added = false;
    while (node != null) {
        if (node.nodeType == 1) {
            var description = "";
            if (node.firstChild != null && node.firstChild.nodeType == 3) {
                description = node.firstChild.nodeValue;
            }
            // instant event: default is true. Or use values from isDuration or durationEvent
            var instant = (node.getAttribute("isDuration")    === null &&
                           node.getAttribute("durationEvent") === null) ||
                          node.getAttribute("isDuration") == "false" ||
                          node.getAttribute("durationEvent") == "false";
            
            var evt = new DefaultEventSource.Event( {
                          id: node.getAttribute("id"),
                       start: parseDateTimeFunction(node.getAttribute("start")),
                         end: parseDateTimeFunction(node.getAttribute("end")),
                 latestStart: parseDateTimeFunction(node.getAttribute("latestStart")),
                 earliestEnd: parseDateTimeFunction(node.getAttribute("earliestEnd")),
                     instant: instant,
                        text: node.getAttribute("title"),
                 description: description,
                       image: this._resolveRelativeURL(node.getAttribute("image"), base),
                        link: this._resolveRelativeURL(node.getAttribute("link") , base),
                        icon: this._resolveRelativeURL(node.getAttribute("icon") , base),
                       color: node.getAttribute("color"),
                   textColor: node.getAttribute("textColor"),
                   hoverText: node.getAttribute("hoverText"),
                   classname: node.getAttribute("classname"),
                   tapeImage: node.getAttribute("tapeImage"),
                  tapeRepeat: node.getAttribute("tapeRepeat"),
                     caption: node.getAttribute("caption"),
                     eventID: node.getAttribute("eventID"),
                    trackNum: node.getAttribute("trackNum")
            });

            evt._node = node;
            evt.getProperty = function(name) {
                return this._node.getAttribute(name);
            };
            evt.setWikiInfo(wikiURL, wikiSection);
            
            this._events.add(evt);
            
            added = true;
        }
        node = node.nextSibling;
    }

    if (added) {
        this._fire("onAddMany", []);
    }
};


DefaultEventSource.prototype.loadJSON = function(data, url) {
    var base = this._getBaseURL(url);
    var added = false;  
    if (data && data.events){
        var wikiURL = ("wikiURL" in data) ? data.wikiURL : null;
        var wikiSection = ("wikiSection" in data) ? data.wikiSection : null;
    
        var dateTimeFormat = ("dateTimeFormat" in data) ? data.dateTimeFormat : null;
        var parseDateTimeFunction = this._events.getUnit().getParser(dateTimeFormat);
       
        for (var i=0; i < data.events.length; i++){
            var evnt = data.events[i];
            
            // New feature: attribute synonyms. The following attribute names are interchangable.
            // The shorter names enable smaller load files.
            //    eid -- eventID
            //      s -- start
            //      e -- end
            //     ls -- latestStart
            //     ee -- earliestEnd
            //      d -- description
            //     de -- durationEvent
            //      t -- title,
            //      c -- classname

            // Fixing issue 33:
            // instant event: default (for JSON only) is false. Or use values from isDuration or durationEvent
            // isDuration was negated (see issue 33, so keep that interpretation
            var instant = evnt.isDuration ||
                          (('durationEvent' in evnt) && !evnt.durationEvent) ||
                          (('de' in evnt) && !evnt.de);
            var evt = new DefaultEventSource.Event({
                          id: ("id" in evnt) ? evnt.id : undefined,
                       start: parseDateTimeFunction(evnt.start || evnt.s),
                         end: parseDateTimeFunction(evnt.end || evnt.e),
                 latestStart: parseDateTimeFunction(evnt.latestStart || evnt.ls),
                 earliestEnd: parseDateTimeFunction(evnt.earliestEnd || evnt.ee),
                     instant: instant,
                        text: evnt.title || evnt.t,
                 description: evnt.description || evnt.d,
                       image: this._resolveRelativeURL(evnt.image, base),
                        link: this._resolveRelativeURL(evnt.link , base),
                        icon: this._resolveRelativeURL(evnt.icon , base),
                       color: evnt.color,                                      
                   textColor: evnt.textColor,
                   hoverText: evnt.hoverText,
                   classname: evnt.classname || evnt.c,
                   tapeImage: evnt.tapeImage,
                  tapeRepeat: evnt.tapeRepeat,
                     caption: evnt.caption,
                     eventID: evnt.eventID  || evnt.eid,
                    trackNum: evnt.trackNum
            });
            evt._obj = evnt;
            evt.getProperty = function(name) {
                return this._obj[name];
            };
            evt.setWikiInfo(wikiURL, wikiSection);

            this._events.add(evt);
            added = true;
        }
    }
   
    if (added) {
        this._fire("onAddMany", []);
    }
};

/*
 *  Contributed by Morten Frederiksen, http://www.wasab.dk/morten/
 */
DefaultEventSource.prototype.loadSPARQL = function(xml, url) {
    var base = this._getBaseURL(url);
    
    var dateTimeFormat = 'iso8601';
    var parseDateTimeFunction = this._events.getUnit().getParser(dateTimeFormat);

    if (xml == null) {
        return;
    }
    
    /*
     *  Find <results> tag
     */
    var node = xml.documentElement.firstChild;
    while (node != null && (node.nodeType != 1 || node.nodeName != 'results')) {
        node = node.nextSibling;
    }
    
    var wikiURL = null;
    var wikiSection = null;
    if (node != null) {
        wikiURL = node.getAttribute("wiki-url");
        wikiSection = node.getAttribute("wiki-section");
        
        node = node.firstChild;
    }
    
    var added = false;
    while (node != null) {
        if (node.nodeType == 1) {
            var bindings = { };
            var binding = node.firstChild;
            while (binding != null) {
                if (binding.nodeType == 1 && 
                    binding.firstChild != null && 
                    binding.firstChild.nodeType == 1 && 
                    binding.firstChild.firstChild != null && 
                    binding.firstChild.firstChild.nodeType == 3) {
                    bindings[binding.getAttribute('name')] = binding.firstChild.firstChild.nodeValue;
                }
                binding = binding.nextSibling;
            }
            
            if (bindings["start"] == null && bindings["date"] != null) {
                bindings["start"] = bindings["date"];
            }
            
            // instant event: default is true. Or use values from isDuration or durationEvent
            var instant = (bindings["isDuration"]    === null &&
                           bindings["durationEvent"] === null) ||
                          bindings["isDuration"] == "false" ||
                          bindings["durationEvent"] == "false";

            var evt = new DefaultEventSource.Event({
                          id: bindings["id"],
                       start: parseDateTimeFunction(bindings["start"]),
                         end: parseDateTimeFunction(bindings["end"]),
                 latestStart: parseDateTimeFunction(bindings["latestStart"]),
                 earliestEnd: parseDateTimeFunction(bindings["earliestEnd"]),
                     instant: instant, // instant
                        text: bindings["title"], // text
                 description: bindings["description"],
                       image: this._resolveRelativeURL(bindings["image"], base),
                        link: this._resolveRelativeURL(bindings["link"] , base),
                        icon: this._resolveRelativeURL(bindings["icon"] , base),
                       color: bindings["color"],                                
                   textColor: bindings["textColor"],
                   hoverText: bindings["hoverText"],
                     caption: bindings["caption"],
                   classname: bindings["classname"],
                   tapeImage: bindings["tapeImage"],
                  tapeRepeat: bindings["tapeRepeat"],
                     eventID: bindings["eventID"],
                    trackNum: bindings["trackNum"]
            });
            evt._bindings = bindings;
            evt.getProperty = function(name) {
                return this._bindings[name];
            };
            evt.setWikiInfo(wikiURL, wikiSection);
            
            this._events.add(evt);
            added = true;
        }
        node = node.nextSibling;
    }

    if (added) {
        this._fire("onAddMany", []);
    }
};

DefaultEventSource.prototype.add = function(evt) {
    this._events.add(evt);
    this._fire("onAddOne", [evt]);
};

DefaultEventSource.prototype.addMany = function(events) {
    for (var i = 0; i < events.length; i++) {
        this._events.add(events[i]);
    }
    this._fire("onAddMany", []);
};

DefaultEventSource.prototype.clear = function() {
    this._events.removeAll();
    this._fire("onClear", []);
};

DefaultEventSource.prototype.getEvent = function(id) {
    return this._events.getEvent(id);
};

DefaultEventSource.prototype.getEventIterator = function(startDate, endDate) {
    return this._events.getIterator(startDate, endDate);
};

DefaultEventSource.prototype.getEventReverseIterator = function(startDate, endDate) {
    return this._events.getReverseIterator(startDate, endDate);
};

DefaultEventSource.prototype.getAllEventIterator = function() {
    return this._events.getAllIterator();
};

DefaultEventSource.prototype.getCount = function() {
    return this._events.getCount();
};

DefaultEventSource.prototype.getEarliestDate = function() {
    return this._events.getEarliestDate();
};

DefaultEventSource.prototype.getLatestDate = function() {
    return this._events.getLatestDate();
};

DefaultEventSource.prototype._fire = function(handlerName, args) {
    for (var i = 0; i < this._listeners.length; i++) {
        var listener = this._listeners[i];
        if (handlerName in listener) {
            try {
                listener[handlerName].apply(listener, args);
            } catch (e) {
                SimileAjax.Debug.exception(e);
            }
        }
    }
};

DefaultEventSource.prototype._getBaseURL = function(url) {
    if (url.indexOf("://") < 0) {
        var url2 = this._getBaseURL(document.location.href);
        if (url.substr(0,1) == "/") {
            url = url2.substr(0, url2.indexOf("/", url2.indexOf("://") + 3)) + url;
        } else {
            url = url2 + url;
        }
    }
    
    var i = url.lastIndexOf("/");
    if (i < 0) {
        return "";
    } else {
        return url.substr(0, i+1);
    }
};

DefaultEventSource.prototype._resolveRelativeURL = function(url, base) {
    if (url == null || url == "") {
        return url;
    } else if (url.indexOf("://") > 0) {
        return url;
    } else if (url.substr(0,1) == "/") {
        return base.substr(0, base.indexOf("/", base.indexOf("://") + 3)) + url;
    } else {
        return base + url;
    }
};


DefaultEventSource.Event = function(args) {
  //
  // Attention developers!
  // If you add a new event attribute, please be sure to add it to
  // all three load functions: loadXML, loadSPARCL, loadJSON. 
  // Thanks!
  //
  // args is a hash/object. It supports the following keys. Most are optional
  //   id            -- an internal id. Really shouldn't be used by events.
  //                    Timeline library clients should use eventID
  //   eventID       -- For use by library client when writing custom painters or
  //                    custom fillInfoBubble    
  //   start
  //   end
  //   latestStart
  //   earliestEnd
  //   instant      -- boolean. Controls precise/non-precise logic & duration/instant issues
  //   text         -- event source attribute 'title' -- used as the label on Timelines and in bubbles.
  //   description  -- used in bubbles   
  //   image        -- used in bubbles
  //   link         -- used in bubbles
  //   icon         -- on the Timeline
  //   color        -- Timeline label and tape color
  //   textColor    -- Timeline label color, overrides color attribute
  //   hoverText    -- deprecated, here for backwards compatibility.
  //                   Superceeded by caption
  //   caption      -- tooltip-like caption on the Timeline. Uses HTML title attribute 
  //   classname    -- used to set classname in Timeline. Enables better CSS selector rules
  //   tapeImage    -- background image of the duration event's tape div on the Timeline
  //   tapeRepeat   -- repeat attribute for tapeImage. {repeat | repeat-x | repeat-y }
       
  function cleanArg(arg) {
      // clean up an arg
      return (args[arg] != null && args[arg] != "") ? args[arg] : null;
  }
   
  var id = args.id ? args.id.trim() : "";
  this._id = id.length > 0 ? id : EventUtils.getNewEventID();
  
  this._instant = args.instant || (args.end == null);
  
  this._start = args.start;
  this._end = (args.end != null) ? args.end : args.start;
  
  this._latestStart = (args.latestStart != null) ?
                       args.latestStart : (args.instant ? this._end : this._start);
  this._earliestEnd = (args.earliestEnd != null) ? args.earliestEnd : this._end;
  
  // check sanity of dates since incorrect dates will later cause calculation errors
  // when painting
  var err=[];
  if (this._start > this._latestStart) {
          this._latestStart = this._start;
          err.push("start is > latestStart");}
  if (this._start > this._earliestEnd) {
          this._earliestEnd = this._latestStart;
          err.push("start is > earliestEnd");}
  if (this._start > this._end) {
          this._end = this._earliestEnd;
          err.push("start is > end");}
  if (this._latestStart > this._earliestEnd) {
          this._earliestEnd = this._latestStart;
          err.push("latestStart is > earliestEnd");}
  if (this._latestStart > this._end) {
          this._end = this._earliestEnd;
          err.push("latestStart is > end");}
  if (this._earliestEnd > this._end) {
          this._end = this._earliestEnd;
          err.push("earliestEnd is > end");}  
  
  this._eventID = cleanArg('eventID');
  this._text = (args.text != null) ? SimileAjax.HTML.deEntify(args.text) : ""; // Change blank titles to ""
  if (err.length > 0) {
          this._text += " PROBLEM: " + err.join(", ");
  }

  this._description = SimileAjax.HTML.deEntify(args.description);
  this._image = cleanArg('image');
  this._link =  cleanArg('link');
  this._title = cleanArg('hoverText');
  this._title = cleanArg('caption');
  
  this._icon = cleanArg('icon');
  this._color = cleanArg('color');      
  this._textColor = cleanArg('textColor');
  this._classname = cleanArg('classname');
  this._tapeImage = cleanArg('tapeImage');
  this._tapeRepeat = cleanArg('tapeRepeat');
  this._trackNum = cleanArg('trackNum');
  if (this._trackNum != null) {
      this._trackNum = parseInt(this._trackNum);
  }
    
  this._wikiURL = null;
  this._wikiSection = null;
};

DefaultEventSource.Event.prototype = {
    getID:          function() { return this._id; },
    
    isInstant:      function() { return this._instant; },
    isImprecise:    function() { return this._start != this._latestStart || this._end != this._earliestEnd; },
    
    getStart:       function() { return this._start; },
    getEnd:         function() { return this._end; },
    getLatestStart: function() { return this._latestStart; },
    getEarliestEnd: function() { return this._earliestEnd; },
    
    getEventID:     function() { return this._eventID; },
    getText:        function() { return this._text; }, // title
    getDescription: function() { return this._description; },
    getImage:       function() { return this._image; },
    getLink:        function() { return this._link; },
    
    getIcon:        function() { return this._icon; },
    getColor:       function() { return this._color; },
    getTextColor:   function() { return this._textColor; },
    getClassName:   function() { return this._classname; },
    getTapeImage:   function() { return this._tapeImage; },
    getTapeRepeat:  function() { return this._tapeRepeat; },
    getTrackNum:    function() { return this._trackNum; },
    
    getProperty:    function(name) { return null; },
    
    getWikiURL:     function() { return this._wikiURL; },
    getWikiSection: function() { return this._wikiSection; },
    setWikiInfo: function(wikiURL, wikiSection) {
        this._wikiURL = wikiURL;
        this._wikiSection = wikiSection;
    },
    
    fillDescription: function(elmt) {
        if (this._description) {
            elmt.innerHTML = this._description;
        }
    },
    fillWikiInfo: function(elmt) {
        // Many bubbles will not support a wiki link. 
        // 
        // Strategy: assume no wiki link. If we do have
        // enough parameters for one, then create it.
        elmt.style.display = "none"; // default
        
        if (this._wikiURL == null || this._wikiSection == null) {
          return; // EARLY RETURN
        }

        // create the wikiID from the property or from the event text (the title)      
        var wikiID = this.getProperty("wikiID");
        if (wikiID == null || wikiID.length == 0) {
            wikiID = this.getText(); // use the title as the backup wiki id
        }
        
        if (wikiID == null || wikiID.length == 0) {
          return; // No wikiID. Thus EARLY RETURN
        }
          
        // ready to go...
        elmt.style.display = "inline";
        wikiID = wikiID.replace(/\s/g, "_");
        var url = this._wikiURL + this._wikiSection.replace(/\s/g, "_") + "/" + wikiID;
        var a = document.createElement("a");
        a.href = url;
        a.target = "new";
        a.innerHTML = Locale.wikiLinkLabel;
        
        elmt.appendChild(document.createTextNode("["));
        elmt.appendChild(a);
        elmt.appendChild(document.createTextNode("]"));
    },
    
    fillTime: function(elmt, labeller) {
        if (this._instant) {
            if (this.isImprecise()) {
                elmt.appendChild(elmt.ownerDocument.createTextNode(labeller.labelPrecise(this._start)));
                elmt.appendChild(elmt.ownerDocument.createElement("br"));
                elmt.appendChild(elmt.ownerDocument.createTextNode(labeller.labelPrecise(this._end)));
            } else {
                elmt.appendChild(elmt.ownerDocument.createTextNode(labeller.labelPrecise(this._start)));
            }
        } else {
            if (this.isImprecise()) {
                elmt.appendChild(elmt.ownerDocument.createTextNode(
                    labeller.labelPrecise(this._start) + " ~ " + labeller.labelPrecise(this._latestStart)));
                elmt.appendChild(elmt.ownerDocument.createElement("br"));
                elmt.appendChild(elmt.ownerDocument.createTextNode(
                    labeller.labelPrecise(this._earliestEnd) + " ~ " + labeller.labelPrecise(this._end)));
            } else {
                elmt.appendChild(elmt.ownerDocument.createTextNode(labeller.labelPrecise(this._start)));
                elmt.appendChild(elmt.ownerDocument.createElement("br"));
                elmt.appendChild(elmt.ownerDocument.createTextNode(labeller.labelPrecise(this._end)));
            }
        }
    },
    
    fillInfoBubble: function(elmt, theme, labeller) {
        var doc = elmt.ownerDocument;
        
        var title = this.getText();
        var link = this.getLink();
        var image = this.getImage();
        
        if (image != null) {
            var img = doc.createElement("img");
            img.src = image;
            
            theme.event.bubble.imageStyler(img);
            elmt.appendChild(img);
        }
        
        var divTitle = doc.createElement("div");
        var textTitle = doc.createTextNode(title);
        if (link != null) {
            var a = doc.createElement("a");
            a.href = link;
            a.appendChild(textTitle);
            divTitle.appendChild(a);
        } else {
            divTitle.appendChild(textTitle);
        }
        theme.event.bubble.titleStyler(divTitle);
        elmt.appendChild(divTitle);
        
        var divBody = doc.createElement("div");
        this.fillDescription(divBody);
        theme.event.bubble.bodyStyler(divBody);
        elmt.appendChild(divBody);
        
        var divTime = doc.createElement("div");
        this.fillTime(divTime, labeller);
        theme.event.bubble.timeStyler(divTime);
        elmt.appendChild(divTime);
        
        var divWiki = doc.createElement("div");
        this.fillWikiInfo(divWiki);
        theme.event.bubble.wikiStyler(divWiki);
        elmt.appendChild(divWiki);
    }
};

    return DefaultEventSource;
});

/*==================================================
 *  Compact Event Painter
 *==================================================
 */

define('scripts/compact-painter',["simile-ajax"], function(SimileAjax) {
var CompactEventPainter = function(params) {
    this._params = params;
    this._onSelectListeners = [];
    
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    
    this._eventIdToElmt = {};
};

CompactEventPainter.prototype.getType = function() {
    return 'compact';
};

CompactEventPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    
    this._eventIdToElmt = null;
};

CompactEventPainter.prototype.supportsOrthogonalScrolling = function() {
    return true;
};

CompactEventPainter.prototype.addOnSelectListener = function(listener) {
    this._onSelectListeners.push(listener);
};

CompactEventPainter.prototype.removeOnSelectListener = function(listener) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        if (this._onSelectListeners[i] == listener) {
            this._onSelectListeners.splice(i, 1);
            break;
        }
    }
};

CompactEventPainter.prototype.getFilterMatcher = function() {
    return this._filterMatcher;
};

CompactEventPainter.prototype.setFilterMatcher = function(filterMatcher) {
    this._filterMatcher = filterMatcher;
};

CompactEventPainter.prototype.getHighlightMatcher = function() {
    return this._highlightMatcher;
};

CompactEventPainter.prototype.setHighlightMatcher = function(highlightMatcher) {
    this._highlightMatcher = highlightMatcher;
};

CompactEventPainter.prototype.paint = function() {
    var eventSource = this._band.getEventSource();
    if (eventSource == null) {
        return;
    }
    
    this._eventIdToElmt = {};
    this._prepareForPainting();
    
    var metrics = this._computeMetrics();
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    
    var filterMatcher = (this._filterMatcher != null) ? 
        this._filterMatcher :
        function(evt) { return true; };
        
    var highlightMatcher = (this._highlightMatcher != null) ? 
        this._highlightMatcher :
        function(evt) { return -1; };
    
    var iterator = eventSource.getEventIterator(minDate, maxDate);
    
    var stackConcurrentPreciseInstantEvents = "stackConcurrentPreciseInstantEvents" in this._params && typeof this._params.stackConcurrentPreciseInstantEvents == "object";
    var collapseConcurrentPreciseInstantEvents = "collapseConcurrentPreciseInstantEvents" in this._params && this._params.collapseConcurrentPreciseInstantEvents;
    if (collapseConcurrentPreciseInstantEvents || stackConcurrentPreciseInstantEvents) {
        var bufferedEvents = [];
        var previousInstantEvent = null;
        
        while (iterator.hasNext()) {
            var evt = iterator.next();
            if (filterMatcher(evt)) {
                if (!evt.isInstant() || evt.isImprecise()) {
                    this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
                } else if (previousInstantEvent != null &&
                        previousInstantEvent.getStart().getTime() == evt.getStart().getTime()) {
                    bufferedEvents[bufferedEvents.length - 1].push(evt);
                } else {
                    bufferedEvents.push([ evt ]);
                    previousInstantEvent = evt;
                }
            }
        }
        
        for (var i = 0; i < bufferedEvents.length; i++) {
            var compositeEvents = bufferedEvents[i];
            if (compositeEvents.length == 1) {
                this.paintEvent(compositeEvents[0], metrics, this._params.theme, highlightMatcher(evt)); 
            } else {
                var match = -1;
                for (var j = 0; match < 0 && j < compositeEvents.length; j++) {
                    match = highlightMatcher(compositeEvents[j]);
                }
                
                if (stackConcurrentPreciseInstantEvents) {
                    this.paintStackedPreciseInstantEvents(compositeEvents, metrics, this._params.theme, match);
                } else {
                    this.paintCompositePreciseInstantEvents(compositeEvents, metrics, this._params.theme, match);
                }
            }
        }
    } else {
        while (iterator.hasNext()) {
            var evt = iterator.next();
            if (filterMatcher(evt)) {
                this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
            }
        }
    }
    
    this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    
    this._setOrthogonalOffset(metrics);
};

CompactEventPainter.prototype.softPaint = function() {
    this._setOrthogonalOffset(this._computeMetrics());
};

CompactEventPainter.prototype.getOrthogonalExtent = function() {
    var metrics = this._computeMetrics();
    return 2 * metrics.trackOffset + this._tracks.length * metrics.trackHeight;
};

CompactEventPainter.prototype._setOrthogonalOffset = function(metrics) {
    var orthogonalOffset = this._band.getViewOrthogonalOffset();
    
    this._highlightLayer.style.top = 
        this._lineLayer.style.top = 
            this._eventLayer.style.top = 
                orthogonalOffset + "px";
};

CompactEventPainter.prototype._computeMetrics = function() {
    var theme = this._params.theme;
    var eventTheme = theme.event;
    
    var metrics = {
        trackOffset:            "trackOffset" in this._params ? this._params.trackOffset : 10,
        trackHeight:            "trackHeight" in this._params ? this._params.trackHeight : 10,
        
        tapeHeight:             theme.event.tape.height,
        tapeBottomMargin:       "tapeBottomMargin" in this._params ? this._params.tapeBottomMargin : 2,
        
        labelBottomMargin:      "labelBottomMargin" in this._params ? this._params.labelBottomMargin : 5,
        labelRightMargin:       "labelRightMargin" in this._params ? this._params.labelRightMargin : 5,
        
        defaultIcon:            eventTheme.instant.icon,
        defaultIconWidth:       eventTheme.instant.iconWidth,
        defaultIconHeight:      eventTheme.instant.iconHeight,
        
        customIconWidth:        "iconWidth" in this._params ? this._params.iconWidth : eventTheme.instant.iconWidth,
        customIconHeight:       "iconHeight" in this._params ? this._params.iconHeight : eventTheme.instant.iconHeight,
        
        iconLabelGap:           "iconLabelGap" in this._params ? this._params.iconLabelGap : 2,
        iconBottomMargin:       "iconBottomMargin" in this._params ? this._params.iconBottomMargin : 2
    };
    if ("compositeIcon" in this._params) {
        metrics.compositeIcon = this._params.compositeIcon;
        metrics.compositeIconWidth = this._params.compositeIconWidth || metrics.customIconWidth;
        metrics.compositeIconHeight = this._params.compositeIconHeight || metrics.customIconHeight;
    } else {
        metrics.compositeIcon = metrics.defaultIcon;
        metrics.compositeIconWidth = metrics.defaultIconWidth;
        metrics.compositeIconHeight = metrics.defaultIconHeight;
    }
    metrics.defaultStackIcon = ("stackConcurrentPreciseInstantEvents" in this._params && "icon" in this._params.stackConcurrentPreciseInstantEvents) ?
        this._params.stackConcurrentPreciseInstantEvents.icon : metrics.defaultIcon;
    metrics.defaultStackIconWidth = ("stackConcurrentPreciseInstantEvents" in this._params && "iconWidth" in this._params.stackConcurrentPreciseInstantEvents) ?
        this._params.stackConcurrentPreciseInstantEvents.iconWidth : metrics.defaultIconWidth;
    metrics.defaultStackIconHeight = ("stackConcurrentPreciseInstantEvents" in this._params && "iconHeight" in this._params.stackConcurrentPreciseInstantEvents) ?
        this._params.stackConcurrentPreciseInstantEvents.iconHeight : metrics.defaultIconHeight;
    
    return metrics;
};

CompactEventPainter.prototype._prepareForPainting = function() {
    var band = this._band;
        
    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        
        var eventLabelPrototype = document.createElement("span");
        eventLabelPrototype.className = "timeline-event-label";
        this._backLayer.appendChild(eventLabelPrototype);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(eventLabelPrototype);
    }
    this._frc.update();
    this._tracks = [];
    
    if (this._highlightLayer != null) {
        band.removeLayerDiv(this._highlightLayer);
    }
    this._highlightLayer = band.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    
    if (this._lineLayer != null) {
        band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = band.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    
    if (this._eventLayer != null) {
        band.removeLayerDiv(this._eventLayer);
    }
    this._eventLayer = band.createLayerDiv(115, "timeline-band-events");
    this._eventLayer.style.display = "none";
};

CompactEventPainter.prototype.paintEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isInstant()) {
        this.paintInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintDurationEvent(evt, metrics, theme, highlightIndex);
    }
};
    
CompactEventPainter.prototype.paintInstantEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseInstantEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseInstantEvent(evt, metrics, theme, highlightIndex);
    }
}

CompactEventPainter.prototype.paintDurationEvent = function(evt, metrics, theme, highlightIndex) {
    if (evt.isImprecise()) {
        this.paintImpreciseDurationEvent(evt, metrics, theme, highlightIndex);
    } else {
        this.paintPreciseDurationEvent(evt, metrics, theme, highlightIndex);
    }
}
    
CompactEventPainter.prototype.paintPreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var commonData = {
        tooltip: evt.getProperty("tooltip") || evt.getText()
    };
    
    var iconData = {
        url: evt.getIcon()
    };
    if (iconData.url == null) {
        iconData.url = metrics.defaultIcon;
        iconData.width = metrics.defaultIconWidth;
        iconData.height = metrics.defaultIconHeight;
        iconData.className = "timeline-event-icon-default";
    } else {
        iconData.width = evt.getProperty("iconWidth") || metrics.customIconWidth;
        iconData.height = evt.getProperty("iconHeight") || metrics.customIconHeight;
    }
    
    var labelData = {
        text:       evt.getText(),
        color:      evt.getTextColor() || evt.getColor(),
        className:  evt.getClassName()
    };
    
    var result = this.paintTapeIconLabel(
        evt.getStart(),
        commonData,
        null, // no tape data
        iconData,
        labelData,
        metrics,
        theme,
        highlightIndex
    );

    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickInstantEvent(result.iconElmtData.elmt, domEvt, evt);
    };
    SimileAjax.DOM.registerEvent(result.iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(result.labelElmtData.elmt, "mousedown", clickHandler);
    
    this._eventIdToElmt[evt.getID()] = result.iconElmtData.elmt;
};

CompactEventPainter.prototype.paintCompositePreciseInstantEvents = function(events, metrics, theme, highlightIndex) {
    var evt = events[0];
    
    var tooltips = [];
    for (var i = 0; i < events.length; i++) {
        tooltips.push(events[i].getProperty("tooltip") || events[i].getText());
    }
    var commonData = {
        tooltip: tooltips.join("; ")
    };
    
    var iconData = {
        url: metrics.compositeIcon,
        width: metrics.compositeIconWidth,
        height: metrics.compositeIconHeight,
        className: "timeline-event-icon-composite"
    };
    
    var labelData = {
        text: SimileAjax.StringUtils.substitute(this._params.compositeEventLabelTemplate, [ events.length ])
    };
    
    var result = this.paintTapeIconLabel(
        evt.getStart(),
        commonData,
        null, // no tape data
        iconData,
        labelData,
        metrics,
        theme,
        highlightIndex
    );
    
    var self = this;
    var clickHandler = function(elmt, domEvt, target) {
        return self._onClickMultiplePreciseInstantEvent(result.iconElmtData.elmt, domEvt, events);
    };
    
    SimileAjax.DOM.registerEvent(result.iconElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(result.labelElmtData.elmt, "mousedown", clickHandler);
    
    for (var i = 0; i < events.length; i++) {
        this._eventIdToElmt[events[i].getID()] = result.iconElmtData.elmt;
    }
};

CompactEventPainter.prototype.paintStackedPreciseInstantEvents = function(events, metrics, theme, highlightIndex) {
    var limit = "limit" in this._params.stackConcurrentPreciseInstantEvents ? 
        this._params.stackConcurrentPreciseInstantEvents.limit : 10;
    var moreMessageTemplate = "moreMessageTemplate" in this._params.stackConcurrentPreciseInstantEvents ? 
        this._params.stackConcurrentPreciseInstantEvents.moreMessageTemplate : "%0 More Events";
    var showMoreMessage = limit <= events.length - 2; // We want at least 2 more events above the limit.
                                                      // Otherwise we'd need the singular case of "1 More Event"

    var band = this._band;
    var getPixelOffset = function(date) {
        return Math.round(band.dateToPixelOffset(date));
    };
    var getIconData = function(evt) {
        var iconData = {
            url: evt.getIcon()
        };
        if (iconData.url == null) {
            iconData.url = metrics.defaultStackIcon;
            iconData.width = metrics.defaultStackIconWidth;
            iconData.height = metrics.defaultStackIconHeight;
            iconData.className = "timeline-event-icon-stack timeline-event-icon-default";
        } else {
            iconData.width = evt.getProperty("iconWidth") || metrics.customIconWidth;
            iconData.height = evt.getProperty("iconHeight") || metrics.customIconHeight;
            iconData.className = "timeline-event-icon-stack";
        }
        return iconData;
    };
    
    var firstIconData = getIconData(events[0]);
    var horizontalIncrement = 5;
    var leftIconEdge = 0;
    var totalLabelWidth = 0;
    var totalLabelHeight = 0;
    var totalIconHeight = 0;
    
    var records = [];
    for (var i = 0; i < events.length && (!showMoreMessage || i < limit); i++) {
        var evt = events[i];
        var text = evt.getText();
        var iconData = getIconData(evt);
        var labelSize = this._frc.computeSize(text);
        var record = {
            text:       text,
            iconData:   iconData,
            labelSize:  labelSize,
            iconLeft:   firstIconData.width + i * horizontalIncrement - iconData.width
        };
        record.labelLeft = firstIconData.width + i * horizontalIncrement + metrics.iconLabelGap;
        record.top = totalLabelHeight;
        records.push(record);
        
        leftIconEdge = Math.min(leftIconEdge, record.iconLeft);
        totalLabelHeight += labelSize.height;
        totalLabelWidth = Math.max(totalLabelWidth, record.labelLeft + labelSize.width);
        totalIconHeight = Math.max(totalIconHeight, record.top + iconData.height);
    }
    if (showMoreMessage) {
        var moreMessage = SimileAjax.StringUtils.substitute(moreMessageTemplate, [ events.length - limit ]);
    
        var moreMessageLabelSize = this._frc.computeSize(moreMessage);
        var moreMessageLabelLeft = firstIconData.width + (limit - 1) * horizontalIncrement + metrics.iconLabelGap;
        var moreMessageLabelTop = totalLabelHeight;
        
        totalLabelHeight += moreMessageLabelSize.height;
        totalLabelWidth = Math.max(totalLabelWidth, moreMessageLabelLeft + moreMessageLabelSize.width);
    }
    totalLabelWidth += metrics.labelRightMargin;
    totalLabelHeight += metrics.labelBottomMargin;
    totalIconHeight += metrics.iconBottomMargin;
    
    var anchorPixel = getPixelOffset(events[0].getStart());
    var newTracks = [];
    
    var trackCount = Math.ceil(Math.max(totalIconHeight, totalLabelHeight) / metrics.trackHeight);
    var rightIconEdge = firstIconData.width + (events.length - 1) * horizontalIncrement;
    for (var i = 0; i < trackCount; i++) {
        newTracks.push({ start: leftIconEdge, end: rightIconEdge });
    }
    var labelTrackCount = Math.ceil(totalLabelHeight / metrics.trackHeight);
    for (var i = 0; i < labelTrackCount; i++) {
        var track = newTracks[i];
        track.end = Math.max(track.end, totalLabelWidth);
    }

    var firstTrack = this._fitTracks(anchorPixel, newTracks);
    var verticalPixelOffset = firstTrack * metrics.trackHeight + metrics.trackOffset;
    
    var iconStackDiv = this._timeline.getDocument().createElement("div");
    iconStackDiv.className = 'timeline-event-icon-stack';
    iconStackDiv.style.position = "absolute";
    iconStackDiv.style.overflow = "visible";
    iconStackDiv.style.left = anchorPixel + "px";
    iconStackDiv.style.top = verticalPixelOffset + "px";
    iconStackDiv.style.width = rightIconEdge + "px";
    iconStackDiv.style.height = totalIconHeight + "px";
    iconStackDiv.innerHTML = "<div style='position: relative'></div>";
    this._eventLayer.appendChild(iconStackDiv);
    
    var self = this;
    var onMouseOver = function(domEvt) {
        try {
            var n = parseInt(this.getAttribute("index"));
            var childNodes = iconStackDiv.firstChild.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                if (i == n) {
                    child.style.zIndex = childNodes.length;
                } else {
                    child.style.zIndex = childNodes.length - i;
                }
            }
        } catch (e) {
        }
    };
    var paintEvent = function(index) {
        var record = records[index];
        var evt = events[index];
        var tooltip = evt.getProperty("tooltip") || evt.getText();
        
        var labelElmtData = self._paintEventLabel(
            { tooltip: tooltip },
            { text: record.text },
            anchorPixel + record.labelLeft,
            verticalPixelOffset + record.top,
            record.labelSize.width, 
            record.labelSize.height, 
            theme
        );
        labelElmtData.elmt.setAttribute("index", index);
        labelElmtData.elmt.onmouseover = onMouseOver;
        
        var img = SimileAjax.Graphics.createTranslucentImage(record.iconData.url);
        var iconDiv = self._timeline.getDocument().createElement("div");
        iconDiv.className = 'timeline-event-icon' + ("className" in record.iconData ? (" " + record.iconData.className) : "");
        iconDiv.style.left = record.iconLeft + "px";
        iconDiv.style.top = record.top + "px";
        iconDiv.style.zIndex = (records.length - index);
        iconDiv.appendChild(img);
        iconDiv.setAttribute("index", index);
        iconDiv.onmouseover = onMouseOver;
        
        iconStackDiv.firstChild.appendChild(iconDiv);
        
        var clickHandler = function(elmt, domEvt, target) {
            return self._onClickInstantEvent(labelElmtData.elmt, domEvt, evt);
        };
        
        SimileAjax.DOM.registerEvent(iconDiv, "mousedown", clickHandler);
        SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
        
        self._eventIdToElmt[evt.getID()] = iconDiv;
    };
    for (var i = 0; i < records.length; i++) {
        paintEvent(i);
    }
    
    if (showMoreMessage) {
        var moreEvents = events.slice(limit);
        var moreMessageLabelElmtData = this._paintEventLabel(
            { tooltip: moreMessage },
            { text: moreMessage },
            anchorPixel + moreMessageLabelLeft,
            verticalPixelOffset + moreMessageLabelTop,
            moreMessageLabelSize.width, 
            moreMessageLabelSize.height, 
            theme
        );
        
        var moreMessageClickHandler = function(elmt, domEvt, target) {
            return self._onClickMultiplePreciseInstantEvent(moreMessageLabelElmtData.elmt, domEvt, moreEvents);
        };
        SimileAjax.DOM.registerEvent(moreMessageLabelElmtData.elmt, "mousedown", moreMessageClickHandler);
        
        for (var i = 0; i < moreEvents.length; i++) {
            this._eventIdToElmt[moreEvents[i].getID()] = moreMessageLabelElmtData.elmt;
        }
    }
    //this._createHighlightDiv(highlightIndex, iconElmtData, theme);
};

CompactEventPainter.prototype.paintImpreciseInstantEvent = function(evt, metrics, theme, highlightIndex) {
    var commonData = {
        tooltip: evt.getProperty("tooltip") || evt.getText()
    };
    
    var tapeData = {
        start:          evt.getStart(),
        end:            evt.getEnd(),
        latestStart:    evt.getLatestStart(),
        earliestEnd:    evt.getEarliestEnd(),
        color:          evt.getColor() || evt.getTextColor(),
        isInstant:      true
    };
    
    var iconData = {
        url: evt.getIcon()
    };
    if (iconData.url == null) {
        iconData = null;
    } else {
        iconData.width = evt.getProperty("iconWidth") || metrics.customIconWidth;
        iconData.height = evt.getProperty("iconHeight") || metrics.customIconHeight;
    }
    
    var labelData = {
        text:       evt.getText(),
        color:      evt.getTextColor() || evt.getColor(),
        className:  evt.getClassName()
    };
    
    var result = this.paintTapeIconLabel(
        evt.getStart(),
        commonData,
        tapeData,
        iconData,
        labelData,
        metrics,
        theme,
        highlightIndex
    );

    var self = this;
    var clickHandler = iconData != null ? 
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.iconElmtData.elmt, domEvt, evt);
        } :
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.labelElmtData.elmt, domEvt, evt);
        };
        
    SimileAjax.DOM.registerEvent(result.labelElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(result.impreciseTapeElmtData.elmt, "mousedown", clickHandler);
    
    if (iconData != null) {
        SimileAjax.DOM.registerEvent(result.iconElmtData.elmt, "mousedown", clickHandler);
        this._eventIdToElmt[evt.getID()] = result.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[evt.getID()] = result.labelElmtData.elmt;
    }
};

CompactEventPainter.prototype.paintPreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var commonData = {
        tooltip: evt.getProperty("tooltip") || evt.getText()
    };
    
    var tapeData = {
        start:          evt.getStart(),
        end:            evt.getEnd(),
        color:          evt.getColor() || evt.getTextColor(),
        isInstant:      false
    };
    
    var iconData = {
        url: evt.getIcon()
    };
    if (iconData.url == null) {
        iconData = null;
    } else {
        iconData.width = evt.getProperty("iconWidth") || metrics.customIconWidth;
        iconData.height = evt.getProperty("iconHeight") || metrics.customIconHeight;
    }
    
    var labelData = {
        text:       evt.getText(),
        color:      evt.getTextColor() || evt.getColor(),
        className:  evt.getClassName()
    };
    
    var result = this.paintTapeIconLabel(
        evt.getLatestStart(),
        commonData,
        tapeData,
        iconData,
        labelData,
        metrics,
        theme,
        highlightIndex
    );

    var self = this;
    var clickHandler = iconData != null ? 
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.iconElmtData.elmt, domEvt, evt);
        } :
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.labelElmtData.elmt, domEvt, evt);
        };
        
    SimileAjax.DOM.registerEvent(result.labelElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(result.tapeElmtData.elmt, "mousedown", clickHandler);
    
    if (iconData != null) {
        SimileAjax.DOM.registerEvent(result.iconElmtData.elmt, "mousedown", clickHandler);
        this._eventIdToElmt[evt.getID()] = result.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[evt.getID()] = result.labelElmtData.elmt;
    }
};

CompactEventPainter.prototype.paintImpreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
    var commonData = {
        tooltip: evt.getProperty("tooltip") || evt.getText()
    };
    
    var tapeData = {
        start:          evt.getStart(),
        end:            evt.getEnd(),
        latestStart:    evt.getLatestStart(),
        earliestEnd:    evt.getEarliestEnd(),
        color:          evt.getColor() || evt.getTextColor(),
        isInstant:      false
    };
    
    var iconData = {
        url: evt.getIcon()
    };
    if (iconData.url == null) {
        iconData = null;
    } else {
        iconData.width = evt.getProperty("iconWidth") || metrics.customIconWidth;
        iconData.height = evt.getProperty("iconHeight") || metrics.customIconHeight;
    }
    
    var labelData = {
        text:       evt.getText(),
        color:      evt.getTextColor() || evt.getColor(),
        className:  evt.getClassName()
    };
    
    var result = this.paintTapeIconLabel(
        evt.getLatestStart(),
        commonData,
        tapeData,
        iconData,
        labelData,
        metrics,
        theme,
        highlightIndex
    );

    var self = this;
    var clickHandler = iconData != null ? 
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.iconElmtData.elmt, domEvt, evt);
        } :
        function(elmt, domEvt, target) {
            return self._onClickInstantEvent(result.labelElmtData.elmt, domEvt, evt);
        };
        
    SimileAjax.DOM.registerEvent(result.labelElmtData.elmt, "mousedown", clickHandler);
    SimileAjax.DOM.registerEvent(result.tapeElmtData.elmt, "mousedown", clickHandler);
    
    if (iconData != null) {
        SimileAjax.DOM.registerEvent(result.iconElmtData.elmt, "mousedown", clickHandler);
        this._eventIdToElmt[evt.getID()] = result.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[evt.getID()] = result.labelElmtData.elmt;
    }
};

CompactEventPainter.prototype.paintTapeIconLabel = function(
    anchorDate, 
    commonData,
    tapeData, 
    iconData, 
    labelData, 
    metrics, 
    theme, 
    highlightIndex
) {
    var band = this._band;
    var getPixelOffset = function(date) {
        return Math.round(band.dateToPixelOffset(date));
    };
    
    var anchorPixel = getPixelOffset(anchorDate);
    var newTracks = [];
    
    var tapeHeightOccupied = 0;         // how many pixels (vertically) the tape occupies, including bottom margin
    var tapeTrackCount = 0;             // how many tracks the tape takes up, usually just 1
    var tapeLastTrackExtraSpace = 0;    // on the last track that the tape occupies, how many pixels are left (for icon and label to occupy as well)
    if (tapeData != null) {
        tapeHeightOccupied = metrics.tapeHeight + metrics.tapeBottomMargin;
        tapeTrackCount = Math.ceil(metrics.tapeHeight / metrics.trackHeight);
        
        var tapeEndPixelOffset = getPixelOffset(tapeData.end) - anchorPixel;
        var tapeStartPixelOffset = getPixelOffset(tapeData.start) - anchorPixel;
        
        for (var t = 0; t < tapeTrackCount; t++) {
            newTracks.push({ start: tapeStartPixelOffset, end: tapeEndPixelOffset });
        }
        
        tapeLastTrackExtraSpace = metrics.trackHeight - (tapeHeightOccupied % metrics.tapeHeight);
    }
    
    var iconStartPixelOffset = 0;        // where the icon starts compared to the anchor pixel; 
                                         // this can be negative if the icon is center-aligned around the anchor
    var iconHorizontalSpaceOccupied = 0; // how many pixels the icon take up from the anchor pixel, 
                                         // including the gap between the icon and the label
    if (iconData != null) {
        if ("iconAlign" in iconData && iconData.iconAlign == "center") {
            iconStartPixelOffset = -Math.floor(iconData.width / 2);
        }
        iconHorizontalSpaceOccupied = iconStartPixelOffset + iconData.width + metrics.iconLabelGap;
        
        if (tapeTrackCount > 0) {
            newTracks[tapeTrackCount - 1].end = Math.max(newTracks[tapeTrackCount - 1].end, iconHorizontalSpaceOccupied);
        }
        
        var iconHeight = iconData.height + metrics.iconBottomMargin + tapeLastTrackExtraSpace;
        while (iconHeight > 0) {
            newTracks.push({ start: iconStartPixelOffset, end: iconHorizontalSpaceOccupied });
            iconHeight -= metrics.trackHeight;
        }
    }
    
    var text = labelData.text;
    var labelSize = this._frc.computeSize(text);
    var labelHeight = labelSize.height + metrics.labelBottomMargin + tapeLastTrackExtraSpace;
    var labelEndPixelOffset = iconHorizontalSpaceOccupied + labelSize.width + metrics.labelRightMargin;
    if (tapeTrackCount > 0) {
        newTracks[tapeTrackCount - 1].end = Math.max(newTracks[tapeTrackCount - 1].end, labelEndPixelOffset);
    }
    for (var i = 0; labelHeight > 0; i++) {
        if (tapeTrackCount + i < newTracks.length) {
            var track = newTracks[tapeTrackCount + i];
            track.end = labelEndPixelOffset;
        } else {
            newTracks.push({ start: 0, end: labelEndPixelOffset });
        }
        labelHeight -= metrics.trackHeight;
    }
    
    /*
     *  Try to fit the new track on top of the existing tracks, then
     *  render the various elements.
     */
    var firstTrack = this._fitTracks(anchorPixel, newTracks);
    var verticalPixelOffset = firstTrack * metrics.trackHeight + metrics.trackOffset;
    var result = {};
    
    result.labelElmtData = this._paintEventLabel(
        commonData,
        labelData,
        anchorPixel + iconHorizontalSpaceOccupied,
        verticalPixelOffset + tapeHeightOccupied,
        labelSize.width, 
        labelSize.height, 
        theme
    );
    
    if (tapeData != null) {
        if ("latestStart" in tapeData || "earliestEnd" in tapeData) {
            result.impreciseTapeElmtData = this._paintEventTape(
                commonData,
                tapeData,
                metrics.tapeHeight,
                verticalPixelOffset, 
                getPixelOffset(tapeData.start),
                getPixelOffset(tapeData.end),
                theme.event.duration.impreciseColor,
                theme.event.duration.impreciseOpacity, 
                metrics, 
                theme
            );
        }
        if (!tapeData.isInstant && "start" in tapeData && "end" in tapeData) {
            result.tapeElmtData = this._paintEventTape(
                commonData,
                tapeData,
                metrics.tapeHeight,
                verticalPixelOffset,
                anchorPixel,
                getPixelOffset("earliestEnd" in tapeData ? tapeData.earliestEnd : tapeData.end), 
                tapeData.color, 
                100, 
                metrics, 
                theme
            );
        }
    }
    
    if (iconData != null) {
        result.iconElmtData = this._paintEventIcon(
            commonData,
            iconData,
            verticalPixelOffset + tapeHeightOccupied,
            anchorPixel + iconStartPixelOffset,
            metrics, 
            theme
        );
    }
    //this._createHighlightDiv(highlightIndex, iconElmtData, theme);
    
    return result;
};

CompactEventPainter.prototype._fitTracks = function(anchorPixel, newTracks) {
    var firstTrack;
    for (firstTrack = 0; firstTrack < this._tracks.length; firstTrack++) {
        var fit = true;
        for (var j = 0; j < newTracks.length && (firstTrack + j) < this._tracks.length; j++) {
            var existingTrack = this._tracks[firstTrack + j];
            var newTrack = newTracks[j];
            if (anchorPixel + newTrack.start < existingTrack) {
                fit = false;
                break;
            }
        }
        
        if (fit) {
            break;
        }
    }
    for (var i = 0; i < newTracks.length; i++) {
        this._tracks[firstTrack + i] = anchorPixel + newTracks[i].end;
    }
    
    return firstTrack;
};


CompactEventPainter.prototype._paintEventIcon = function(commonData, iconData, top, left, metrics, theme) {
    var img = SimileAjax.Graphics.createTranslucentImage(iconData.url);
    var iconDiv = this._timeline.getDocument().createElement("div");
    iconDiv.className = 'timeline-event-icon' + ("className" in iconData ? (" " + iconData.className) : "");
    iconDiv.style.left = left + "px";
    iconDiv.style.top = top + "px";
    iconDiv.appendChild(img);
    
    if ("tooltip" in commonData && typeof commonData.tooltip == "string") {
        iconDiv.title = commonData.tooltip;
    }
    
    this._eventLayer.appendChild(iconDiv);
    
    return {
        left:   left,
        top:    top,
        width:  metrics.iconWidth,
        height: metrics.iconHeight,
        elmt:   iconDiv
    };
};

CompactEventPainter.prototype._paintEventLabel = function(commonData, labelData, left, top, width, height, theme) {
    var doc = this._timeline.getDocument();
    
    var labelDiv = doc.createElement("div");
    labelDiv.className = 'timeline-event-label';

    labelDiv.style.left = left + "px";
    labelDiv.style.width = (width + 1) + "px";
    labelDiv.style.top = top + "px";
    labelDiv.innerHTML = labelData.text;

    if ("tooltip" in commonData && typeof commonData.tooltip == "string") {
        labelDiv.title = commonData.tooltip;
    }
    if ("color" in labelData && typeof labelData.color == "string") {
        labelDiv.style.color = labelData.color;
    }
    if ("className" in labelData && typeof labelData.className == "string") {
        labelDiv.className += ' ' + labelData.className;
    }
    
    this._eventLayer.appendChild(labelDiv);
    
    return {
        left:   left,
        top:    top,
        width:  width,
        height: height,
        elmt:   labelDiv
    };
};

CompactEventPainter.prototype._paintEventTape = function(
    commonData, tapeData, height, top, startPixel, endPixel, color, opacity, metrics, theme) {
    
    var width = endPixel - startPixel;
    
    var tapeDiv = this._timeline.getDocument().createElement("div");
    tapeDiv.className = "timeline-event-tape"

    tapeDiv.style.left = startPixel + "px";
    tapeDiv.style.top = top + "px";
    tapeDiv.style.width = width + "px";
    tapeDiv.style.height = height + "px";

    if ("tooltip" in commonData && typeof commonData.tooltip == "string") {
        tapeDiv.title = commonData.tooltip;
    }
    if (color != null && typeof tapeData.color == "string") {
        tapeDiv.style.backgroundColor = color;
    }
    
    if ("backgroundImage" in tapeData && typeof tapeData.backgroundImage == "string") {
        tapeDiv.style.backgroundImage = "url(" + backgroundImage + ")";
        tapeDiv.style.backgroundRepeat = 
            ("backgroundRepeat" in tapeData && typeof tapeData.backgroundRepeat == "string") 
                ? tapeData.backgroundRepeat : 'repeat';
    }
    
    SimileAjax.Graphics.setOpacity(tapeDiv, opacity);
    
    if ("className" in tapeData && typeof tapeData.className == "string") {
        tapeDiv.className += ' ' + tapeData.className;
    }

    this._eventLayer.appendChild(tapeDiv);
    
    return {
        left:   startPixel,
        top:    top,
        width:  width,
        height: height,
        elmt:   tapeDiv
    };
}

CompactEventPainter.prototype._createHighlightDiv = function(highlightIndex, dimensions, theme) {
    if (highlightIndex >= 0) {
        var doc = this._timeline.getDocument();
        var eventTheme = theme.event;
        
        var color = eventTheme.highlightColors[Math.min(highlightIndex, eventTheme.highlightColors.length - 1)];
        
        var div = doc.createElement("div");
        div.style.position = "absolute";
        div.style.overflow = "hidden";
        div.style.left =    (dimensions.left - 2) + "px";
        div.style.width =   (dimensions.width + 4) + "px";
        div.style.top =     (dimensions.top - 2) + "px";
        div.style.height =  (dimensions.height + 4) + "px";
//        div.style.background = color;
        
        this._highlightLayer.appendChild(div);
    }
};

CompactEventPainter.prototype._onClickMultiplePreciseInstantEvent = function(icon, domEvt, events) {
    var c = SimileAjax.DOM.getPageCoordinates(icon);
    this._showBubble(
        c.left + Math.ceil(icon.offsetWidth / 2), 
        c.top + Math.ceil(icon.offsetHeight / 2),
        events
    );
    
    var ids = [];
    for (var i = 0; i < events.length; i++) {
        ids.push(events[i].getID());
    }
    this._fireOnSelect(ids);
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    
    return false;
};

CompactEventPainter.prototype._onClickInstantEvent = function(icon, domEvt, evt) {
    var c = SimileAjax.DOM.getPageCoordinates(icon);
    this._showBubble(
        c.left + Math.ceil(icon.offsetWidth / 2), 
        c.top + Math.ceil(icon.offsetHeight / 2),
        [evt]
    );
    this._fireOnSelect([evt.getID()]);
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

CompactEventPainter.prototype._onClickDurationEvent = function(target, domEvt, evt) {
    if ("pageX" in domEvt) {
        var x = domEvt.pageX;
        var y = domEvt.pageY;
    } else {
        var c = SimileAjax.DOM.getPageCoordinates(target);
        var x = domEvt.offsetX + c.left;
        var y = domEvt.offsetY + c.top;
    }
    this._showBubble(x, y, [evt]);
    this._fireOnSelect([evt.getID()]);
    
    domEvt.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(domEvt);
    return false;
};

CompactEventPainter.prototype.showBubble = function(evt) {
    var elmt = this._eventIdToElmt[evt.getID()];
    if (elmt) {
        var c = SimileAjax.DOM.getPageCoordinates(elmt);
        this._showBubble(c.left + elmt.offsetWidth / 2, c.top + elmt.offsetHeight / 2, [evt]);
    }
};

CompactEventPainter.prototype._showBubble = function(x, y, evts) {
    var div = document.createElement("div");
    
    evts = ("fillInfoBubble" in evts) ? [evts] : evts;
    for (var i = 0; i < evts.length; i++) {
        var div2 = document.createElement("div");
        div.appendChild(div2);
        
        evts[i].fillInfoBubble(div2, this._params.theme, this._band.getLabeller());
    }
    
    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(div, x, y, this._params.theme.event.bubble.width);
};

CompactEventPainter.prototype._fireOnSelect = function(eventIDs) {
    for (var i = 0; i < this._onSelectListeners.length; i++) {
        this._onSelectListeners[i](eventIDs);
    }
};

    return CompactEventPainter;
});

/*==================================================
 *  Quarterly Ether Painter
 *==================================================
 */
 
define('scripts/quarterly-ether-painter',[
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var QuarterlyEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    this._startDate = SimileAjax.DateTime.parseGregorianDateTime(params.startDate);
};

QuarterlyEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className = 'timeline-ether-bg';
 //   this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
};

QuarterlyEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
};

QuarterlyEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = new Date(0);
    var maxDate = this._band.getMaxDate();
    
    minDate.setUTCFullYear(Math.max(this._startDate.getUTCFullYear(), this._band.getMinDate().getUTCFullYear()));
    minDate.setUTCMonth(this._startDate.getUTCMonth());
    
    var p = this;
    var incrementDate = function(date) {
        date.setUTCMonth(date.getUTCMonth() + 3);
    };
    var labeller = {
        labelInterval: function(date, intervalUnit) {
            var quarters = (4 + (date.getUTCMonth() - p._startDate.getUTCMonth()) / 3) % 4;
            if (quarters != 0) {
                return { text: "Q" + (quarters + 1), emphasized: false };
            } else {
                return { text: "Y" + (date.getUTCFullYear() - p._startDate.getUTCFullYear() + 1), emphasized: true };
            }
        }
    };
    
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(
            minDate, labeller, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
            
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

QuarterlyEtherPainter.prototype.softPaint = function() {
};

    return QuarterlyEtherPainter;
});

/*==================================================
 *  Year Count Ether Painter
 *==================================================
 */

define('scripts/year-count-ether-painter',[
    "simile-ajax",
    "./ether-interval-marker-layout",
    "./ether-highlight"
], function(SimileAjax, EtherIntervalMarkerLayout, EtherHighlight) {
var YearCountEtherPainter = function(params) {
    this._params = params;
    this._theme = params.theme;
    this._startDate = SimileAjax.DateTime.parseGregorianDateTime(params.startDate);
    this._multiple = ("multiple" in params) ? params.multiple : 1;
};

YearCountEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.className = 'timeline-ether-bg';
   // this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
};

YearCountEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
};

YearCountEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minDate = new Date(this._startDate.getTime());
    var maxDate = this._band.getMaxDate();
    var yearDiff = this._band.getMinDate().getUTCFullYear() - this._startDate.getUTCFullYear();
    minDate.setUTCFullYear(this._band.getMinDate().getUTCFullYear() - yearDiff % this._multiple);
    
    var p = this;
    var incrementDate = function(date) {
        for (var i = 0; i < p._multiple; i++) {
            SimileAjax.DateTime.incrementByInterval(date, SimileAjax.DateTime.YEAR);
        }
    };
    var labeller = {
        labelInterval: function(date, intervalUnit) {
            var diff = date.getUTCFullYear() - p._startDate.getUTCFullYear();
            return {
                text: diff,
                emphasized: diff == 0
            };
        }
    };
    
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(
            minDate, labeller, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
            
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

YearCountEtherPainter.prototype.softPaint = function() {
};

    return YearCountEtherPainter;
});

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

define('timeline',[
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
    return require("timeline");
}));
