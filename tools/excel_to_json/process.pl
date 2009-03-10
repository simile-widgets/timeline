#!/usr/bin/perl -wT
#
# This program enables the user to submit an excel file and have it
# returned as a json representation
#

# Datetime Perl resources http://datetime.perl.org/?Resources
#
use strict;
use warnings;
use CGI;
use CGI::Carp qw ( fatalsToBrowser ); 
use Carp qw(cluck );
use sigtrap;
use File::Basename;
use Spreadsheet::ParseExcel;
use Date::Format qw(time2str); # See http://search.cpan.org/~gbarr/TimeDate-1.16/lib/Date/Format.pm
use Spreadsheet::ParseExcel::Utility qw(ExcelFmt ExcelLocaltime LocaltimeExcel);
# use DateTime::Format::Excel; # See http://search.cpan.org/dist/DateTime-Format-Excel/lib/DateTime/Format/Excel.pm
use Captcha::reCAPTCHA; # See http://search.cpan.org/dist/Captcha-reCAPTCHA/lib/Captcha/reCAPTCHA.pm


$CGI::POST_MAX=1024 * 5000;  # max 5M posts
$CGI::DISABLE_UPLOADS = 0;   # uploads okay

use constant CAPTCHA_PRIVATE_KEY => 'xxx';

my $cgi = new CGI;
$cgi->charset('UTF-8');

# Here we go...

# 1) Check Captcha
if (! PassedCaptcha()) {exit;}

if ($cgi->param("Submit")) {Process();} # checking the button's value
  else {Feedback("No form information found");}
  
  


##################### End of Mainline #####################################
#
#
###########################################################################
#
#                    S U B R O U T I N E S
#
########################################################################### 

########################################################################### 
########################################################################### 
#
#    PassedCaptcha
#
########################################################################### 
########################################################################### 
sub PassedCaptcha {
  # returns 1 or 0
   
  my $challenge = $cgi->param('recaptcha_challenge_field');
  if ($challenge =~ /^([-\w. \!\@\#\$\%\^\&\*\(\)\+\=\;\:\'\"\\\,\.\?\<\>\~]+)$/) {
    $challenge = $1;
  } else { die "Bad challenge value in $challenge";}
  
  my $response = $cgi->param('recaptcha_response_field');
  if ($response eq "") {
    Feedback("Please enter the captcha words. Thank you.");
    return 0;
  }
  if ($response =~ /^([-\w. \!\@\#\$\%\^\&\*\(\)\+\=\;\:\'\"\\\,\.\?\<\>\~]+)$/) {
    $response = $1;
  } else { die "Bad response value in $response";}
  
  my $c = Captcha::reCAPTCHA->new;
  my $result = $c->check_answer(
    CAPTCHA_PRIVATE_KEY, $ENV{'REMOTE_ADDR'},
    $challenge, $response
  );

  if ($result->{is_valid}) {
    return 1; 
  } else {
    # Error
    Feedback("Problem: Your entry did not match the captcha words, please try again. Thank you.");
    return 0;
  }
}


########################################################################### 
########################################################################### 
#
#    Process Excel data
#
########################################################################### 
########################################################################### 
sub Process {
  my $excel_field = "excel";
  
  # ref: http://www.sitepoint.com/article/uploading-files-cgi-perl/
  
  my $safe_filename_characters = "a-zA-Z0-9_.-";
  my $filename = $cgi->param($excel_field);
  my $datefmt = 'yyyy-mm-dd';    # ISO 8601
  
  
  my $date_format = $cgi->param('date_format');
    # options: json
    #          iso8601
    #          gregorian
  if ($date_format =~ /(json|iso8601|gregorian)/) {
    $date_format = $1; # untaint
  } else { die "Bad data in date_format"; }

  my $parse_dates = $cgi->param('parse_dates'); 
   # 1 or 0 
  if ($parse_dates =~ /(0|1)/) {
    $parse_dates = $1; # untaint
  } else { die "Bad data in parse_dates"; }
  
  
  
  
  
  if ( !$filename ) {
    Feedback("There was a problem uploading your file. (Did you select a file? The maximum file size is 5M.)");
    exit;
  } 
  
  my ($name, $path, $extension) = fileparse ($filename, '\..*'); 
  $filename =~ tr/ /_/;
  $filename =~ s/[^$safe_filename_characters]//g;
  if ( $filename =~ /^([$safe_filename_characters]+)$/ ) {
    $filename = $1;
  } else {
    $filename = "json_data";
    # die "Filename contains invalid characters";
  }

  my $upload_filehandle = $cgi->upload($excel_field);
  
  my $oExcel = new Spreadsheet::ParseExcel;
  
  print $cgi->header();
  #Content-Type:application/octet-stream
  #Content-Disposition:attachment; filename=results.apl

my $oBook = $oExcel->Parse($upload_filehandle);
my($iR, $iC, $oWkS, $oWkC);

print "FILE  :", $oBook->{File} , "\n";
print "COUNT :", $oBook->{SheetCount} , "\n";

print "AUTHOR:", $oBook->{Author} , "\n"
 if defined $oBook->{Author};

for(my $iSheet=0; $iSheet < $oBook->{SheetCount} ; $iSheet++)
{
 $oWkS = $oBook->{Worksheet}[$iSheet];
 print "--------- SHEET:", $oWkS->{Name}, "\n";
 for(my $iR = $oWkS->{MinRow} ;
     defined $oWkS->{MaxRow} && $iR <= $oWkS->{MaxRow} ;
     $iR++)
 {
  for(my $iC = $oWkS->{MinCol} ;
      defined $oWkS->{MaxCol} && $iC <= $oWkS->{MaxCol} ;
      $iC++)
  {
   $oWkC = $oWkS->{Cells}[$iR][$iC];
   if($oWkC && $oWkC->{Type} ne 'Date') {
     print "( $iR , $iC ) =>", $oWkC->Value, "\n" ;
   }  elsif ($oWkC && $oWkC->{Type} eq 'Date') {
      print "( $iR , $iC ) =>",  ExcelFmt($datefmt, $oWkC->unformatted()), "\n" ;
   }
  }
 }
}

    
        
    
    
    
##        $fh = $form->field('last_year_excel');
##        $f_name = Store_file(\*$fh, {batch => $batch_key, section => $section});
##        $msg .= $section . " Excel file: ";
##        $status = Process_data ($dbh, $f_name, 'X', {verbose=>0, current_year=>$current_year,
##          batch_key=>$batch_key, section_name=>$section});      
##        $msg .= $status->{msg} . "<br>";
##        warn $status->{msg};


}; # end of Process

########################################################################### 
########################################################################### 
#
#    Process Excel data
#
########################################################################### 
########################################################################### 
sub Feedback {
  my $msg = shift;
   
  print $cgi->header();
  while (<DATA>) {print $_;}
  
  print "<h2>",$msg, "</h2>";
  
  print"<h2><a href='javascript:void(0);' onClick='history.back()'>Continue</h2>";
  
  print <<'MYEOF';
	   </div>
	 </div>
   <div id="ft" role="contentinfo">
   </div>
</div>

</body>
</html>
MYEOF

}; # end of Feedback


########################################################################### 
########################################################################### 
#
#    Store file
#
########################################################################### 
########################################################################### 
sub Store_file {
	my ($fh, $params) = @_;
	my ($buffer, $f_name);

##  $f_name = 'batch_' . $params->{batch} . '.' . $params->{section} . '.xls';
##  $f_name =~ s/ /_/;
##  $f_name = ${Prpt_config::file_storage_dir} . $f_name;
##  open F, ">$f_name" or die $!;
##  binmode F;
##  
##  #while (read($fh, $buffer, 16384)) {print F};  # doesn't work?!
##  while (<$fh>) {print F}; # works!
##
##  close F; 
##  return ($f_name);
}; # end of Store_file


########################################################################### 
########################################################################### 
#
#    Download_file
#
########################################################################### 
########################################################################### 
sub Download_file {
	# download either a crosstab or raw data file
	# 
	# get cgi parameters
## 	my ($batch_id, $request, $password);
## 
## 	$batch_id = $cgi->param('batch_id');
##   if ($batch_id) {$batch_id =~ tr/0-9a-zA-Z\-\_//cd} else {$batch_id = ''};
## 	$request = $cgi->param('request');
##   if ($request) {$request =~ tr/0-9a-zA-Z\-\_//cd} else {$request = ''};
## 	$password = $cgi->param('password');
##   if ($password) {$password =~ tr/0-9a-zA-Z\-\_//cd} else {$password = ''};
##   
##   if (Password_problem($request, $password)) {return()};
## 
##   # get batch's date
##   my $sql = "Select batch_date From R_batches Where batch_key = $batch_id";
##   my $batch_date = SelectOneRow($dbh, $sql, 'continue')->[0];
##   $batch_date =~ tr/-/./;
##     
##   # send header
##   my $fn = ($request eq 'xtab') ? "xtab.$batch_date.xls" : "$batch_date Campaign data.xls"; # filename
##   print $cgi->header( -type => "application/octet-stream",
##                       -attachment => $fn);
## 
##   if    ($request eq 'xtab') {	
## 	  my $params = {}; 
## 	  $params->{title} = "Pardes Campaign Report";
## 	  $params->{current_year} = $current_year;
##     $params->{batch_key} = $batch_id; 
##     $params->{format} = 'excel';
##     $params->{excel_name} = '-'; # STDOUT
##   
##     my $result = Create_crosstab ($dbh, $params);
##   }
##   elsif ($request eq 'raw')  {
##     my (@db_fields, $labels, $types, $values, $label_index, $param);
##     my $w; # widths arrayref
##     my $worksheet_name = 'Data';
##     my $heading = '';
##       
##     # Get values out of db.
##     @db_fields = (qw/name re_id div_name fund_name amount section_name/);
## 
##     $sql = <<"END_SQL";
## Select
##   name,
##   re_id,
##   R_divisions.div_name,
##   R_funds.fund_name, 
##   amount,
##   R_sections.section_name
## From R_maindata
##   Inner join R_divisions on (R_divisions.div_key = R_maindata.div_key)
##   Inner join R_funds on (R_funds.fund_key = R_maindata.fund_key)
##   Inner join R_sections on(R_sections.section_key = R_maindata.section_key) 
## Where batch_key = $batch_id
## END_SQL
## 
##     $values = SelectTable($dbh, $sql, 'continue'); # initial loading of values
## 
##     # fill in labels, w (widths), and types arrays -- same order as sql statement
##     $label_index = 0;
##     $labels->[$label_index] = 'Name'; $w->[$label_index] = 43; $types->[$label_index++] = 'string'; 
##     $labels->[$label_index] = 'ID'; $w->[$label_index] = 0; $types->[$label_index++] = 'number';
##     $labels->[$label_index] = 'Division'; $w->[$label_index] = 20; $types->[$label_index++] = 'string';
##     $labels->[$label_index] = 'Fund'; $w->[$label_index] = 22; $types->[$label_index++] = 'string';
##     $labels->[$label_index] = 'Amount'; $w->[$label_index] = 10; $types->[$label_index++] = 'number';
##     $labels->[$label_index] = 'Section'; $w->[$label_index] = 10; $types->[$label_index++] = 'string';
##     unless (($#db_fields + 1) == $label_index) {die}; # assertion
## 
##     # that's it! Create the Excel file
##     $param = {output => 'STDOUT',
##           worksheet_name => $worksheet_name,
##           heading => $heading,
##           };
##     MakeExcelFile ($param, $labels, $values, $types, $w);  
##   }
##   else  {die "unknown request type -- '$request'"};   
##   

}; # end of Download_file

########################################################################### 
########################################################################### 

# The following page is accessed using the DATA filehandle
__END__

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
 "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
   <!-- See http://developer.yahoo.com/yui/grids/ for info on the grid layout -->
   <title>Excel to JSON Converter</title>
   <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />

   <!-- See http://developer.yahoo.com/yui/ for info on the reset, font and base css -->
   <link rel="stylesheet" href="http://yui.yahooapis.com/2.7.0/build/reset-fonts-grids/reset-fonts-grids.css" type="text/css">
   <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/base/base-min.css"> 
 
   <link rel="stylesheet" href="css.css" type="text/css">
</head>
<body>
<div id="doc3" class="yui-t7">
   <div id="hd" role="banner">
     <h1>Excel to JSON Converter</h1>
   </div>
   <div id="bd" role="main">
	   <div class="yui-g">

