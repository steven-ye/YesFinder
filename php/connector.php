<?php
/*
* YesFinder v0.9
* Steven Ye
* Email: steven_ye@foxmail.com
*/
define('YESFINDER','1.0');
require(__DIR__.'/../config.php');
require(__DIR__.'/fileupload.class.php');
require(__DIR__.'/yesfinder.class.php');

$action=isset($_GET['action']) ?  $_GET['action'] : '';
$path=isset($_GET['path']) ?  $_GET['path'] : '';

$YesFinder = new YesFinder($config);
if(method_exists($YesFinder,$action)){
    //$data = $YesFinder->$action($path);
	$data = call_user_func(array($YesFinder,$action),$path);
}else{
    $data['error']='Invalid request.';	
}
echo json_encode($data);