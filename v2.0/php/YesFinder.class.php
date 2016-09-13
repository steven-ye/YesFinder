<?php
/*
* YesFinder v2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-6-12
*/

if(!defined('YESFINDER'))die('Illegal request.');

class YesFinder{
    private $config;
    private $allType;
    private $allowType;
    private $path;

    function __construct($config){
        $allType = 'jpg,gif,png,jpeg,bmp,ai,psd,eps,cdr,tiff,raw,rar,zip,gzip,7z,txt,rtf,pdf,'
            .'css,doc,docx,xls,xlsx,ppt,pptx,pages,numbers,xml,rss,fla,flv,acc,aif,'
            .'avi,mp3,mp4,mov,wav,wmv,atom,sql';
        $this->config = $config;
        extract($config);
        $this->BasePath = isset($BasePath)?$BasePath:'../uploads/';
        $this->BaseUrl = isset($BaseUrl)?$BaseUrl:dirname($_SERVER['PHP_SELF']).'/'.$this->BasePath;
        $this->finderUrl = isset($finderUrl)?$finderUrl:'../../';
        $this->allowType = isset($fileType)?$fileType:'*';
        $this->allType = $allType;
        if(!is_dir($this->BasePath)) {
            throw new Exception('主文件夹没找到，请重新配置connector.php.');
            //mkdir($this->BasePath, 0777, true);
        }
    }
    function init(){
        $data['baseUrl']=$this->BaseUrl;
        $data['basePath']=$this->BasePath;
        $data['finderUrl']=$this->finderUrl;
        return $data;
    }
    function files($path=''){
        $data =array();
        $realpath = $path=='/'?$this->BasePath:$this->BasePath.$path;
        $realpath = trim($realpath,'/');
        if(!is_dir($realpath)){
            throw new Exception("文件夹 $path 不存在。");
        }
        if(empty($this->allowType)||$this->allowType=='*'){
            $files = glob($realpath.'/*');
        }else{
            $files = glob($realpath.'/*.{'.$this->allowType.'}',GLOB_BRACE);
        }

        $i=0;
        foreach($files as $file){
            if(is_dir($file))continue;
            $f = [];
            //$f['filename'] = basename($file); /* 对中文不支持，弃用 */
            $f['filename'] = substr(strrchr($file, '/'), 1);
            //$f['filetype'] = strtolower(substr(strrchr($file, '.'), 1));
            $f['filesize'] = $this->format_bytes(filesize($file));
            $f['filetime'] = date('Y-m-d H:i:s',filemtime($file));

            $data[$i]=$f;
            $i++;
        }
        return $data;
    }

    function folders($path=''){
        if($path=='/')$path='';
        $dir = $this->BasePath.$path;
        $folders = glob($dir.'/*',GLOB_ONLYDIR);
        $i=0; $data = array();

        foreach($folders as $folder){
            if($folder=='.'||$folder=='..')continue;
            //$name = basename($folder); /* 对中文不支持，弃用 */
            $name = substr(strrchr($folder, '/'), 1);
            $data[$i]['name']=$name;
            $fullpath = $path==''?$name:$path.'/'.$name;
            $data[$i]['path']=$fullpath;
            $data[$i]['son']=$this->folders($fullpath);
            $i++;
        }
        return $data;
    }

    function newfolder($path=''){
        $newname = substr(strrchr($path, '/'), 1);
        $parent = preg_replace('/\/'.$newname.'$/','',$path);

        $parent = $parent=='/'?$this->BasePath:$this->BasePath.$parent;

        if(!is_dir($parent)){
            if(is_gb2312($path)){
                $path = iconv('gb2312','utf-8',$path);
            }
            throw new Exception("文件夹 '".dirname($path)."' 不存在。");
        }
        if(file_exists($parent.'/'.$newname)){
            if(is_gb2312($newname)){
                $newname = iconv('gb2312','utf-8',$newname);
            }
            throw new Exception("文件夹 '{$newname}' 已经存在。");
        }
        if(false === @mkdir($parent.'/'.$newname)){
            throw new Exception('新建文件夹失败，请检查权限。');
        }
        return $path;
    }
    function change($old,$newname=''){
        if(empty($newname)){
            throw new Exception("改名失败，没有新的名称。");
        }
        if(empty($old)||$old=='/'){
            throw new Exception("禁止更改根目录。");
        }
        if(!file_exists($this->BasePath.$old)){
            throw new Exception("原文件（目录）不存在。");
        }
        $new = dirname($old).'/'.$newname;

        if($new==$old){
            if(is_gb2312($newname)){
                $newname = iconv('gb2312','utf-8',$newname);
            }
            throw new Exception("'$newname' 与原文件（目录）相同。");
        }
        if(file_exists($this->BasePath.$new)){
            if(is_gb2312($newname)){
                $newname = iconv('gb2312','utf-8',$newname);
            }
            throw new Exception("'$newname' 文件（目录）已经存在。");
        }

        if(false === rename($this->BasePath.$old,$this->BasePath.$new)){
            throw new Exception("文件（目录）改名失败。");
        }
        return true;
    }
    function upload($path=''){
        $path = trim($path,'/');
        $folder = $this->BasePath.$path;
        if(!is_dir($folder)){
            if(is_gb2312($path)){
                $path = iconv('gb2312','utf-8',$path);
            }
            throw new Exception("文件夹 '$path' 不存在。");
        }
        if(!file_exists('fileupload.class.php')){
            throw new Exception("没找到文件'fileupload.class.php, 无法上传文件。");
        }
        require_once('fileupload.class.php');

        $up = new FileUpload();
        //设置属性(上传的位置， 大小， 类型， 名是是否要随机生成)

        $up -> set("path", $folder);
        $up -> set("maxsize", 8*1024*1024);
        if(empty($this->allowType)||$this->allowType=='*'){
            $up -> set("allowtype", explode(',',$this->allType));
        }else{
            $up -> set("allowtype", explode(',',$this->allowType));
        }
        $up -> set("israndname", false);

        if(!$up -> upload("file")) {
            $errors = $up->getErrorMsg();
            if(is_array($errors)){
                $errors = implode("\n",$errors);
            }
            throw new Exception($errors);
        }else{
            $filenames = $up->getFileName();
            if(is_string($filenames))$filenames[]=$filenames;
            foreach($filenames as $key=>$value){
                $filename = iconv('utf-8','gb2312',$value);
                if(true === @rename($folder.'/'.$value,$folder.'/'.$filename)){
                    $filenames[$key] = $filename;
                }
            }
        }

        return $up->getFileName();
    }
    function download($path=''){
        if(empty($path)){throw new Exception('Please choose a file first.');}
        $file = $this->BasePath.trim($path,'/');
        if(!is_file($file)){
            throw new Exception("$path doesn't exist.");
        }
        $fileinfo = pathinfo($file);
        header('Content-type: application/x-'.$fileinfo['extension']);
        header('Content-Disposition: attachment; filename='.$fileinfo['basename']);
        header('Content-Length: '.filesize($file));
        readfile($file);
    }
    function delete($path=''){
        if($path==''||$path=='/'){
            throw new Exception("根目录不能被删除。");
        }
        $realpath = $this->BasePath.trim($path,'/');
        if(!file_exists($realpath)){
            throw new Exception("$path 不存在。");
        }
        if(is_file($realpath)){
            if(false === @unlink($realpath))
                throw new Exception("删除文件 $path 失败。");
        }else{
            if(false == @rmdir($realpath)){
                throw new Exception("删除目录 $path 失败。");
            }
        }
        return $path;
    }
    private function format_bytes($size) {
        $units = array(' B', ' KB', ' MB', ' GB', ' TB');
        for ($i = 0; $size >= 1024 && $i < 4; $i++) $size /= 1024;
        return round($size, 2).$units[$i];
    }
}
