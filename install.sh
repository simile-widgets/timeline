#!/bin/sh

# install.sh
# 
# Run from the timeline root directory to install the minimum 
# required files into your web server's javascript directory.
#
# The starting directory should have the following files in it:
#   src/webapp/api/timeline-bundle.js
#   src/ajax/api/simile-ajax-bundle.js
#
# 
# arguments: <dir> destination root directory for js.
#
timeline_api_dir="src/webapp/api/"
timeline_api_files="timeline-api.js timeline-bundle.js timeline-bundle.css"
timeline_subdirs='./images ./scripts/l10n'

ajax_api_dir="src/ajax/api/"
ajax_api_files="simile-ajax-api.js simile-ajax-bundle.js"
ajax_subdirs='./images ./scripts/signal.js'


if [ $# -eq 0 ]
then
  echo "usage: install.sh destination_directory"
  echo "       The destination_directory should already exist and"
  echo "       be served by your web server"
  exit
fi

# are we starting in the right place?
if [ ! -s src/webapp/api/timeline-bundle.js ]
then
  echo "problem: this command must be run in the directory that has the src/ subdirectory for Timeline. (src/webapp/api/timeline-bundle.js not found)"
  exit
fi

if [ ! -s src/ajax/api/simile-ajax-bundle.js ]
then
  echo "problem: this command must be run in the directory that has the src/ subdirectory for the Simile Ajax library. (src/ajax/api/simile-ajax-bundle.js not found)"
  exit
fi

# destination directory exists?
dest=$1  # dest -- destination directory

if [ ! -d $dest ]
then
  echo "problem: the destination $dest is not a vailid directory"
  exit
fi

# Good to go!
echo "Installing Timeline library to $dest"

timeline_src_dir=`pwd`

# create destination directories
cd $dest
if [ ! -d timeline_js ]
then
  mkdir timeline_js
fi

if [ ! -d timeline_ajax ]
then
  mkdir timeline_ajax
fi
 
cd timeline_js
dest_timeline=`pwd`
cd ../timeline_ajax
dest_ajax=`pwd`
cd $timeline_src_dir # back to source dir

# Timeline and supporting libraries
for t in $timeline_api_files
do
  cp -u "$timeline_api_dir$t" $dest_timeline
done 

  (
    cd $timeline_api_dir
    for t in $timeline_subdirs
    do
      tar -cf - --exclude .svn $t |(cd $dest_timeline; tar -xpf - --overwrite) 
    done
   )
  
# Ajax library
for t in $ajax_api_files
do
  cp -u "$ajax_api_dir$t" $dest_ajax
done 

  (
    cd $ajax_api_dir
    for t in $ajax_subdirs
    do
      tar -cf - --exclude .svn $t |(cd $dest_ajax; tar -xpf - --overwrite) 
    done
   )
   
echo "#####################################################################"
echo "#"
echo "#"
echo "# In your html files, include set the javascript variables to serve"
echo "# the files"
echo "#    $dest/timeline_js/simile-ajax-api.js "
echo "#    $dest/timeline_ajax/timeline-api.js"
echo "#"
echo "# See $dest/timeline_ajax/timeline-api.js for more information"
echo "#"
echo "#####################################################################"
echo ""
echo ""
