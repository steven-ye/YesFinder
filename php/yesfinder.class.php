<?php
/*
* YesFinder v0.9
* Steven Ye
* Email: steven_ye@foxmail.com
*/
if(!defined('YESFINDER'))die('Illegal request.');
define( 'YESFINDER_DEFAULT_BASEPATH', './yesfinder' ) ;

class YesFinder{
	private $BaseUrl;
	private $fileType;
	private $allowType = 'jpg,gif,png,jpeg,bmp,ai,psd,eps,cdr,tiff,raw,rar,zip,gzip,7z,txt,rtf,pdf,css,doc,docx,xls,xlsx,ppt,pptx,pages,numbers,xml,rss,fla,flv,acc,aif,avi,mp3,mp4,mov,wav,wmv,atom,sql';
	private $path;
	
	function __construct($config=array()){
		extract($config);
		$this->BaseUrl = isset($root)?$root:YESFINDER_DEFAULT_BASEPATH;
		$this->fileType = isset($fileType)?$fileType:'';
		$this->allowType = empty($fileType)?$this->allowType:$fileType;
		if(!is_dir($this->BaseUrl))mkdir($this->BaseUrl,0777,true);
	}

	function files($path=''){
		$return =array();
		$path = trim($path,'/')?$this->BaseUrl.'/'.trim($path,'/'):$this->BaseUrl;
		if(!is_dir($path))return false;
		if(empty($this->fileType)||$this->fileType=='*'){
			$files = glob($path.'/*');
		}else{
		    $files = glob($path.'/*.{'.$this->fileType.'}',GLOB_BRACE);
		}
		$iconpath = 'skins/images/icons/64/';
		$iconlist=scandir($iconpath);
		$i=0;
		foreach($files as $file){
			if(is_dir($file))continue;
			$f = array();
			$f['file'] = iconv('GB2312','UTF-8',$file);
			$f['filetype'] = substr(strrchr($file, "."), 1);
			if(!empty($f['filetype'])&&in_array(strtolower($f['filetype']).'.png',$iconlist))
			    $f['fileicon'] = $iconpath.$f['filetype'].'.png';
			else
			    $f['fileicon'] = $iconpath.'unknown.png';
			$f['filename'] = substr(strrchr($f['file'], "/"), 1);
			$f['filesize'] = round(filesize($file)/1024,2).' KB';
			$f['filetime'] = date('Y-m-d H:i:s',filemtime($file));
			
			$return[$i]=$f;
			$i++;
		}
		return $return;
	}
	
	function folders($path='/'){
		$dir = $this->BaseUrl.'/'.trim($path,'/');
		$files = scandir($dir);
		$i=0; $return = array();
		foreach($files as $file){
			if($file=='.'||$file=='..'||!is_dir($dir.'/'.$file))continue;
			$return[$i]['name']=$file;
			$return[$i]['path']=rtrim($path,'/').'/'.$file;
			$return[$i]['son']=$this->folders(rtrim($path,'/').'/'.$file);
			$i++;
		}
		return $return;
	}
	
	function newfolder($path=''){
		$arr = explode('||',$path);
		$path= trim($arr[0],'/');
		$parent = empty($path)?$this->BaseUrl:$this->BaseUrl.'/'.$path;
		$newname = isset($arr[1])?$arr[1]:'';
		if(!is_dir($parent)){
			$return['error'] = "The folder '{$path}' isn\'t existed.";
		}elseif(is_dir($parent.'/'.$newname)){
			$return['error'] = "The folder '{$path}/{$newname}' is already existed.";
		}else{
			return @mkdir($parent.'/'.$newname,0777);
		}
		return $return;
	}
	function change($path=''){
		$arr = explode('||',$path);
		$oldpath = trim($arr[0]);
		$newname = isset($arr[1])?$arr[1]:'';
		$old = $this->BaseUrl.'/'.$oldpath;
		if(empty($newname)){
			$return['error'] = "A new name is required.";
		}elseif(empty($old)){
			$return['error'] = "Please choose a folder first.";
		}elseif(is_dir($old)){
			$new = dirname($old).'/'.$newname;
			return @rename($old,$new); 
		}else{
			$return['error'] = $oldpath." doesn't exist.";
		}
		return $return;
	}
	function delfolder($path=''){
		$dir = $this->BaseUrl.'/'.trim($path,'/');
		if(is_dir($dir)){
			return @rmdir($dir);
		}
		$return['error']="The folder '{$path}' isn't existed.";
		return $return;
	}
	function upload($path=''){
		$path = $this->BaseUrl.'/'.trim($path,'/');
		if(!is_dir($path)){
			$data['error']='Folder '.$path.' does not exist.';return $data;
		}
		
		$up = new FileUpload();
		//设置属性(上传的位置， 大小， 类型， 名是是否要随机生成)
		
		$up -> set("path", $path);
		$up -> set("maxsize", 8*1024*1024);
		if(!empty($this->allowType)&&$this->allowType!='*')
		$up -> set("allowtype", explode(',',$this->allowType));
		$up -> set("israndname", false);
		
		if($up -> upload("upfile")) {
			return $up->getFileName();
		}else{
			$data['error']= $up->getErrorMsg();
		}
		/**/
		return $data;
	}
	function download($path=''){
		if(empty($path)){return 'Please choose a file first.';}
		$file = $this->BaseUrl.'/'.trim($path,'/');
		if(!file_exists($file)){
			return "$path doesn't exist.";
		}else{
		$fileinfo = pathinfo($file);
		header('Content-type: application/x-'.$fileinfo['extension']);
		header('Content-Disposition: attachment; filename='.$fileinfo['basename']);
		header('Content-Length: '.filesize($file));
		readfile($file);
		}
	}
	function alter($path=''){
		$arr = explode('||',$path);
		$old = $this->BaseUrl.'/'.trim($arr[0],'/');
		$newname = isset($arr[1])?$arr[1]:'';
		if(empty($newname)){
			$return['error'] = "A new name is required.";
		}elseif(file_exists($old)){
			$inf = pathinfo($old);
			if(isset($inf['extension'])){
			    $new = str_replace($inf['basename'],$newname.'.'.$inf['extension'],$old);
			}else{
				$new = str_replace($inf['basename'],$newname,$old);
			}
			return @rename($old,$new); 
		}else{
			$return['error'] = basename($old)." doesn't exist.";
		}
		return $return;
	}
	function delete($path=''){
		if($this->check($path)){
			return @unlink($this->path);
		}else{
			$data['error']="$path doesn't exist.";
		}
		return $data;
	}
	function check($path=''){
		$this->path = $this->BaseUrl.'/'.trim($path,'/');
		return file_exists($this->path);
	}
	function baseurl(){
		return $this->BaseUrl;
	}
}
