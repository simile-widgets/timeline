T I M E L I N E
===============


What is this?
-------------

Timeline is a web widget for visualizing temporal data.


Running Timeline
----------------

Timeline consists entirely of static files (javascript libraries,
image files and css files). All you really need is to
serve those resources off a web server without having to install
any special server side functionality. Therefore any web server will do.

Two ways to access the library:

1. If you have a web server running your machine:
  1. Install the Java runtime from Sun if your OS doesn't have it already (get it for free at http://www.java.com)
  2. Install Apache Ant (get it for free at http://ant.apache.org)
  3. Open a shell or command prompt in the same directory of this file and type:

    ```sh
    ant
    ```
    Ant will use the `build.xml` configuration file to construct and the script will copy all the required files in the give path.
2. No web server? The timeline project includes a small webserver to get you started:
  1. Install the Java runtime from Sun if your OS doesn't have it already
    (get it for free at http://www.java.com)
  2. Open a shell or command prompt in the same directory of this file.
    In windows run:

    ```bat
    run
    ```
    In unix/macosx run:

    ```sh
    ./run
    ```
    and then point your browser to

    ```
    http://127.0.0.1:9999/timeline/
    ```


How do I customize Timeline?
----------------------------

Refer to the [Timeline web site](http://www.simile-widgets.org/timeline/).


Mailing List and Forum
----------------------

Join the community by joining the [SIMILE Widgets Google Group](http://groups.google.com/group/simile-widgets/).


Licensing and legal issues
--------------------------

Timeline is open source software and are licensed under the BSD license
located in the LICENSE.txt file located in the same directory as this very file
you are reading.


Credits
-------

This software was created by the SIMILE project and originally written
by the SIMILE development team (in alphabetical order):

 * David François Huynh `<dfhuynh at csail.mit.edu>`

---

Thanks for your interest.

[The SIMILE Widgets Project](http://www.simile-widgets.org/)
