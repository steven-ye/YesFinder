#YesFinder - Web File Manager V2.0

###从界面到功能进行了全面升级，V2.0使用更方便，更安全。详见DEMO。



1. ####功能上的主要改进是可以双击改文件/目录名称，还有就是选项增加了

    modal:true, 
    delBtn:true,
    delBtn:function(){
      //do something
    }

 这使用使用方式更加多样，方便用于不同场景。

 具体用法：
 
		$(function(){
			$('#normal').YesFinder({modal:true},function(file,finder){
				finder.alert('你选择的文件是 "'+file+'"');
			});
    		$('#modal').YesFinder({modal:true,width:900,height:600},function(file,finder){
        		file = finder.baseUrl + file;
        		console.log(file);
        		this.find('img')[0].src = file;
        		finder.YesModal.hide();
    		});
    		$('#delBtn').YesFinder({
        		modal:true,
        		delBtn:true,
        		delBtnClick:function(finder){
            		this.find('img').attr('src','nopic.gif');
        		}
    		},function(file,finder){
        		file = finder.baseUrl + file;
        		this.find('img')[0].src = file;
        		finder.YesModal.hide();
    		});
    	});
 
2. ####界面及交互更加人性化。
    为此，专门写了YesModal（模态框）和YesContextMenu（右键菜单）2个插件，这2个插件可以单独使用。

3. ####全部改为了中文。


==========================================================

##YesFinder v2.0.2

**主要改动如下：**

1. 对YesModal插件进行了优化升级，相应的YesFinder也做更改；

2. 对YesContextMeny 右键插件进行了升级，修复了右键菜单容易被挡住的问题。


2016.09.19
