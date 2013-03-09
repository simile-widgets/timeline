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

You once needed [Java](http://www.java.com/) and [Apache Ant](http://ant.apache.org) in order to work with Timeline.  This will probably change in the future, but this release does not include any bundling or compression mechanisms, so you can ignore it - you'll just need a web server and the supporting SimileAjax library to get started.  Familiarity with [RequireJS](http://requirejs.org/) is strongly suggested.

Mailing List and Forum
----------------------
  
Join the community by joining the [Google Group SIMILE Widgets](http://groups.google.com/group/simile-widgets/).

Licensing
---------

Timeline is open source software and is licensed under the modified BSD license in the LICENSE.txt file located in the same directory as this README.

This code contains libraries found in `lib/` and `tools/` that support development that are covered by their own licenses.

 * [Jetty](http://jetty.codehaus.org/) is covered by the [Apache 2.0 License](http://jetty.codehaus.org/jetty/license.html)
 * [JSMin Task](https://code.google.com/p/jsmin-ant-task/) is covered by the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0)

Latest Release - 3.0.0
----------------------

Released March 8, 2013.

 * Forked source to https://github.com/zepheira/timeline/
 * Uses SimileAjax 3.0.0.
 * Removed all files related to loading and original bundling / compression.
 * Bundling and compression are not currently available in this release.
 * Parameters cannot be provided through RequireJS as they were before, no parameters will be respected or used in this release.
 * Minor bug fixes.
 * See https://github.com/zepheira/timeline/compare/2.3.1...3.0.0 for all commits.

Credits
-------

This software was created by the SIMILE project and originally written by the SIMILE development team:

 * [David Huynh](http://davidhuynh.net/)
