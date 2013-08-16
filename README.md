Timeline
========

Timeline is a [SIMILE](http://simile-widgets.org/) web widget for visualizing temporal data.

Using Timeline
--------------

You should look over the examples in `src/webapp/examples/` for reference for now.  There may be more added to the project's [GitHub wiki](https://github.com/zepheira/timeline/wiki) later.  There are obsolete examples on the [Timeline web site](http://www.simile-widgets.org/timeline/).

Running Timeline Locally
------------------------

Timeline consists entirely of static files (Javascript libraries, image files, and CSS files).  All you really need is to serve those resources off a web server without having to install any special server-side functionality.  Any web server will do.

If you have a web server already running on your machine, you will need to obtain [SimileAjax](https://github.com/zepheira/simile-ajax/).  After acquiring the code for it, you will need to configure your web server to:

 * Serve `simile-ajax/src/webapp/` at `/ajax`
 * Serve `timeline/src/webapp/` at `/timeline`

You'll find the Timeline page with examples at `http://localhost/timeline/index.html`.

If you do not hvae a web server, this project also includes a mechanism for running one to serve Timeline.  You will again need to obtain [SimileAjax](https://github.com/zepheira/simile-ajax/).  You will also need to install [Java](http://www.java.com/).

 * You will have to copy (not link) `simile-ajax/src/webapp/` to `timeline/src/ajax/`
 * Open a shell or command prompt in the same directory of this file and type:

```
[win32]> run
[unix/macosx]> ./run
```

and then point your browser to ` http://127.0.0.1:9999/timeline/`

Developing Timeline
-------------------

You need [Java](http://www.java.com/) and [Apache Ant](http://ant.apache.org) and [Node.js](http://nodejs.org/) in order to work with Timeline.  You'll also need a web server (if you don't want to use the one bundled in this project) and a clone of the repository for the supporting SimileAjax library to get started.  Familiarity with [RequireJS](http://requirejs.org/) is strongly suggested.

You should symlink SimileAjax's `/src/webapp` into Timeline's `src/` as `src/ajax/` in order to build properly.  Run `ant` in SimileAjax to generate the built, concatenated bundles for it.

* dev/
 * simile-ajax/
  * src/
   * webapp/
 * timeline/
  * src/
   * ajax -> ../../simile-ajax/src/webapp/

Run `ant` in Timeline in order to generate its built, concatenated bundles.

Mailing List and Forum
----------------------

Join the community by joining the [Google Group SIMILE Widgets](http://groups.google.com/group/simile-widgets/).

Licensing
---------

Timeline is open source software and is licensed under the modified BSD license in the LICENSE.txt file located in the same directory as this README.

 * [RequireJS](http://requirejs.org/) is covered by the [modified BSD license](https://github.com/jrburke/requirejs/blob/master/LICENSE).
 * The RequireJS [i18n plugin](http://requirejs.org/docs/api.html#i18n) is covered by the [modified BSD license](https://github.com/requirejs/i18n/blob/master/LICENSE).
 * [almond](https://github.com/jrburke/almond) is covered by the [modified BSD license](https://github.com/jrburke/almond/blob/master/LICENSE).

This code contains libraries found in `lib/`, `tools/`, and `optimize/` that support development that are covered by their own licenses.

 * [Jetty](http://jetty.codehaus.org/) is covered by the [Apache 2.0 License](http://jetty.codehaus.org/jetty/license.html)
 * [JSMin Task](https://code.google.com/p/jsmin-ant-task/) is covered by the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0)
 * [r.js](http://requirejs.org/docs/optimization.html) is covered by the [modified BSD license](https://github.com/jrburke/r.js/blob/master/LICENSE).

Latest Release - 3.0.0
----------------------

Released August, 2013.

 * Forked source to https://github.com/zepheira/timeline/
 * Uses RequireJS.
 * Uses SimileAjax 3.0.0.
 * Removed all files related to loading and original bundling / compression, substituted with RequireJS optimizer builds.
 * Removed several parameters around locales (now handled by RequireJS); `defaultLocale`, `forceLocale`, and `locales` do not work; to simulate the behavior in development, use RequireJS to set the locale.
 * Added an `ajax` parameter to be set in order to find the SimileAjax stylesheet; it should be able to be located if Timeline and SimileAjax are deployed on the same server, but set if not.
 * General usage remains backwards compatible, but users should consider changing use-paradigm to RequireJS instead if any flexibility in loading or otherwise is needed.
 * Minor bug fixes.
 * See https://github.com/zepheira/timeline/compare/2.3.1...3.0.0 for all commits.

Credits
-------

This software was created by the SIMILE project and originally written by the SIMILE development team:

 * [David Huynh](http://davidhuynh.net/)
