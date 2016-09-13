<?php
/*
* YesFinder v2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-6-12
*/
if(!defined('YESFINDER'))die('Illegal request.');
class Connector{
    private $action;
    private $params;
	function __construct(){
		$this->action = isset($_GET['action'])?$_GET['action']:'';
		$params = isset($_GET['path'])?$_GET['path']:'';
        $params = iconv('utf-8','gb2312',$params);
		$this->params = explode('||',$params);
	}
	function run($config){
        try{
            //session设置，控制访问
            if(isset($config['session'])&&!empty($config['session'])){
                if(is_string($config['session'])){
                    session_save_path(__DIR__.'/'.$config['session']);
                }
                if(!isset($_SESSION))session_start();

                if(!isset($_SESSION['admin'])) {
                    throw new Exception('你没有文件管理权限.');
                }
            }

            if(!file_exists('YesFinder.class.php')){
                throw new Exception('主文件YesFinder.class.php丢失了.');
            }
            require('YesFinder.class.php');
            $app = new YesFinder($config);
            if(!method_exists($app,$this->action)){
                throw new Exception("请求无效，".$this->action." 不存在");
            }
            $data = call_user_func_array(array($app,$this->action),$this->params);
        }
        catch(Exception $e){
            $data['error'] = $e->getMessage();
        }
		$this->output($data);
	}
	function output($data){
        header('Content-type: application/json');
        $data = gb2utf8($data);
		echo json_encode($data);
	}

}


function gb2utf8($data){
    if(is_string($data)&&$data!=''){
        if(is_gb2312($data)){
            $data = iconv('gb2312','utf-8',$data);
        }
    }elseif(is_array($data)){
        foreach($data as $key=>$value){
            $data[$key] = gb2utf8($value);
        }
    }
    return $data;
}
function is_gb2312($str){
    for($i=0; $i<strlen($str); $i++) {
        $v = ord( $str[$i] );
        if( $v > 127) {
            if( ($v >= 228) && ($v <= 233) )
            {
                if(($i+2) >= (strlen($str)- 1)) return true;  // not enough characters
                $v1 = ord( $str[$i+1] );
                $v2 = ord( $str[$i+2] );
                if( ($v1 >= 128) && ($v1 <=191) && ($v2 >=128) && ($v2 <= 191) ) // utf编码
                    return false;
                else
                    return true;
            }
        }
    }
    return true;
}

function catch_fatal_error(){
    // Getting Last Error
    $last_error =  error_get_last();

    // Check if Last error is of type FATAL
    if(isset($last_error['type']) && $last_error['type']==E_ERROR){
        echo json_encode($last_error['message']);
    }
}
register_shutdown_function('catch_fatal_error');
