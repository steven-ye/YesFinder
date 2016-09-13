<?php
/*
* YesFinder v2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-6-12
*/
define('YESFINDER','2.0');
if(!file_exists('Connector.class.php')){
	$data['error']="文件 Connector.class.php 丢失了。";
	die(json_encode($data));
}
require('Connector.class.php');

$config=array(
    //'session'=>'data/session',
    //'fileType'=>'jpg,gif,png,jpeg',
    //'fileType' = 'jpg,gif,png,jpeg,bmp,ai,psd,eps,cdr,tiff,raw,rar,zip,gzip,7z,txt,rtf,pdf,'
    //    .'css,doc,docx,xls,xlsx,ppt,pptx,pages,numbers,xml,rss,fla,flv,acc,aif,'
    //    .'avi,mp3,mp4,mov,wav,wmv,atom,sql';
    'finderUrl'=>'./',
    'BaseUrl' =>'uploads/',
    'BasePath'=>'../uploads/'
);

$connector = new Connector();
$connector->run($config);

