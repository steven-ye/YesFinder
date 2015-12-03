/*
* YesFinder v0.9
* Steven Ye
* Email: steven_ye@foxmail.com
* Date : 2015-12-02
*/
;(function($, window, document,undefined) {
    //定义构造函数
    var YesFinder = function(ele, opt, func) {
		var that = this;
		this.$ele = ele,
        this.defaults = {
            url: 'yesfinder.php',
			filetype:'',
			menu:'View,Upload,Refresh,Delete,Download,Settings,Help'
        },
		this.folder = '/',
		this.file='',
        this.options = $.extend({}, this.defaults, opt)
		this.callback = func;
    }
    //定义方法
    YesFinder.prototype = {
        init: function() {
			this.loadTpl();
			this.loadMenu();
			this.loadFolders(); 
			return this;
        },
		loadTpl:function (){
			var that=this;
			var tpl ='<table cellpadding="0" cellspacing="0" border="0" width="100%">';
            tpl +='<tr><td width="20%"><div class="fm-sidebar">';
            tpl +='<h2>Folders</h2><ul class="yes_folders">';
            tpl +='<li class="root"><a class="active" href="/"> Home</a></li>';
            tpl +='<ul></ul>';
            tpl +='</ul></div></td><td width="80%">';
            tpl +='<div class="fm-header">';
            tpl +='   <ul class="fm-toolbar"></ul>';
            tpl +='   <p>Total <span class="files_num">0</span> File(s).</p>';
            tpl +='</div>';
            tpl +='<div class="fm-body">';
            tpl +='   <div id="loading"></div><input type="file" id="upfile" name="upfile" />';
			tpl +='   <div class="yes_input_div">New Name: <input type="text" class="yes_target"/> ';
			tpl +='     <span class="yes_ext"></span>';
			tpl +='     &nbsp; <input type="button" class="yes_btn_ok" value="Add"/>';
			tpl +='  	<input type="hidden" class="yes_origin" />';
			tpl +='   </div><div class="yes_files"></div>';
            tpl +='</div></td></tr></table>';
			
			this.$ele.addClass('yesFinder').html(tpl);
			$('.yesFinder .fm-sidebar').css('height',$(window).height()-30+'px');
			$('.yesFinder .fm-body').css('height',$(window).height()-95+'px');
			$(window).resize(function(e) {
                $('.yesFinder .fm-sidebar').css('height',$(this).height()-30+'px');
				$('.yesFinder .fm-body').css('height',$(this).height()-95+'px');
            });
			
			this.$ele.find('.fm-body').smartMenu([
			      [{text:'Upload',func:function(){that.upload();}},
			       {text:'Refresh',func:function(){that.refresh();}}
				   ]],{name:'fm-body',textLimit:18}
			);
		},
		loadMenu: function(){
			var that=this;
			var menu={
				  View:function(){that.view(that.file);},
			      Upload:function(){that.upload();},
				  Refresh:function(){that.refresh();},
				  Delete:function(){that.delete(that.file);},
				  Download:function(){that.download(that.file);},
			      Settings:'<ul><li><label><input type="checkbox" name="filename" checked> File Name</label></li><li><label><input type="checkbox" name="filetime" checked> File Time</label></li><li><label><input type="checkbox" name="filesize" checked> File Size</label></li></ul>',
				  Help:'<div>YesFinder need PHP5.4+ <bt\> And JQuery 1.11.1+</div>'
			}
			var menuList = this.options.menu.split(',');
			var toolbar = $('.fm-toolbar',this.$ele).html('');
			$.each(menu,function(key,value){
				if($.inArray(key,menuList)>=0){
				    var li=$('<li class="'+key.toLowerCase()+'">'+key+'</li>').appendTo(toolbar);
				    if(typeof(value)=='function'){
						li.click(function(e){value();});
				    }else{
						li.append(value);
					}
				}
			});
			$('.settings input:checkbox',toolbar).each(function(){
				$(this).click(function(){
					if($(this).is(':checked')){
						$('.yes_files a p.'+$(this).attr('name'),this.$ele).show();
					}else{
						$('.yes_files a p.'+$(this).attr('name'),this.$ele).hide();
					}
				});
			});
		},
		loadFolders: function(){
			var that=this,data = this.getData('folders','/');
			
			if(data.error){
				$('.yes_folders>ul',this.$ele).html('<p>'+data.error+'</p>');
			}else{
				$('.yes_folders>ul',this.$ele).html(this.listFolders(data));
				
				var menuData=[
				  [{
                    text: "New Folder",
	                func: function(){
			            $('.yes_origin',this.$ele).val($(this).attr('href'));
						$('.yes_target',this.$ele).val('');
						$('.yes_ext',this.$ele).text('');
				        $('.yes_btn_ok',this.$ele).val('New Folder');
				        $('.yes_input_div',this.$ele).show();
						$('.yes_btn_ok',this.$ele).unbind();
			            $('.yes_btn_ok',this.$ele).click(function(){
							var path = $('.yes_origin',this.$ele).val();
				            var newname = $('.yes_target',this.$ele).val();
				            if(!newname)return alert('Please input a newname.');
				            if(!path)return alert('Please choose a folder first.');
							$('.yes_input_div',this.$ele).hide();
				            that.newFolder(path,newname);
			            });
						
					}
		          },{
					text: "Rename",
	                func: function(){
			            if($(this).attr('href')==='/')return;
						var oldname=$(this).attr('href');
				        var name = oldname.substr(oldname.lastIndexOf("/")).replace('/','');
				        $('.yes_target',this.$ele).val(name);
				        $('.yes_ext',this.$ele).text('');
				        $('.yes_btn_ok',this.$ele).val('Rename Folder');
				        $('.yes_input_div',this.$ele).show();
						$('.yes_btn_ok',this.$ele).unbind();
			            $('.yes_btn_ok',this.$ele).click(function(){
				            //var oldname = $('.yes_origin',this.$ele).val();
				            var newname = $('.yes_target',this.$ele).val();
				            if(!newname)return alert('Please input a newname.');
				            if(!oldname)return alert('Please choose a folder first.');
				            $('.yes_input_div',this.$ele).hide();
							that.rename(oldname,newname,1);
			            });
					}
				  },{
					text: "Delete",
	                func: function(){
			            that.delFolder($(this).attr('href'));
					}
				  }]
				];
				
				$('.yes_folders a',this.$ele).each(function(){
					$(this).click(function(e){
						that.folder = $(this).attr('href');
						that.loadFiles();
						that.file='';
						$('.yes_folders a.active',this.$ele).removeClass('active');
	    				$(this).addClass('active');
						e.preventDefault();
					});
					$(this).smartMenu(menuData,{name:'folders',textLimit:18}); //自定义右键
					if($(this).attr('href')===that.folder)$(this).click();
				});
				
			}
		},
		loadFiles: function(){
			var tpl='',num=0,that=this; 
			var data = this.getData('files',this.folder); 
			if(this.folder&&this.folder!='/')path=this.folder+'/';
			else path='/';
			if(data.error){
				$('.yes_files',this.$ele).html('<p>'+data.error+'</p>');
			}else if(!data.length){
				tpl='<p>Nothing is found.</p>';
			}else{
			    $.each(data,function(i,v){
					tpl += '<a href="'+path+v.filename+'">';
					if('jpg,jpeg,png,gif,bmp,'.indexOf(v.filetype+',')>-1){
	                    tpl += '<img src="'+v.file+'"/>';
					}else{
						tpl += '<img src="'+v.fileicon+'"/>';
					}
				    tpl += '<p class="filename">'+v.filename+'</p>';
				    tpl += '<p class="filetime">'+v.filetime+'</p>';
				    tpl += '<p class="filesize">'+v.filesize+'</p>';
					tpl += '</a>';
					num++;
	  		  });
			}
			$('.yes_files',this.$ele).html(tpl);
			$('.files_num',this.$ele).text(num);
			this.file='';
			$('.settings input:checkbox',this.$ele).each(function(){
				if($(this).is(':checked')){
					$('.yes_files a p.'+$(this).attr('name'),this.$ele).show();
				}else{
					$('.yes_files a p.'+$(this).attr('name'),this.$ele).hide();
				}
			});
			
			var menuData = [ //设置右键菜单
  	    	  [{
         	    text: "Select",
	     	    func: function(){
				    that.select($(this).attr('href'));
				    //$(this).dblclick();
		    	 }
		 	     /*
         	    data: [[{
   	                text: "Level 2",
   	                func: function() {
                        $(this).css("border", "5px solid #34538b");
    	            }
           	    }, {
  	  	            text: "Level 2",
   	   	            func: function() {
  	                    $(this).css("border", "5px solid #a0b3d6");
        	        }
   	   	        }, {
                    text: "5像素淡蓝",
    	            func: function() {
    	                $(this).css("border", "5px solid #cad5eb");
    	            }
  	             }]]
		         */
                }, {
    	           text: "View",
     	           func: function() {
                       that.view($(this).attr("href"));
    	           }
   	            }, {
    	           text: "Download",
     	           func: function() {
                       that.download($(this).attr('href'));
    	           }
  	            }],
                [{
    	           text: "Rename",
    	           func: function() {
			           var oldname = $(this).attr('href');
				       var origin = oldname.substr(oldname.lastIndexOf("/")).replace('/','');
				       var name = origin.replace(/\..+$/i,'');
				       var ext = origin.substr(origin.lastIndexOf("."));
				       if(!ext)ext='';
				       $('.yes_target',this.$ele).val(name);
				       $('.yes_ext',this.$ele).text(ext);
				       $('.yes_btn_ok',this.$ele).val('Rename');
				       $('.yes_input_div',this.$ele).show();
				       $('.yes_btn_ok',this.$ele).unbind();
			           $('.yes_btn_ok',this.$ele).click(function(){
				           $('.yes_input_div',this.$ele).hide();
				           var newname = $('.yes_target',this.$ele).val();
				           if(!oldname){alert('Please choose a file first.');}
						   else if(!newname){alert('Please input a new name.');}
						   else if(newname==name){alert('The name is same');}
						   else {that.rename(oldname,newname);}
			           });
   	 	            }
	            }, {
    	            text: "Resize",
    	            func: function() {
           	            //alert("Not available yet.");
						$(this).css("border", "5px solid #cad5eb");
   	 	            }
 	            }],
                [{
                    text: "Delete",
                    func: function() {
			              that.delete($(this).attr('href'));
                    }
 	            }]
	        ];
			$('.yes_files a',this.$ele).each(function(){
				$(this).click(function(e){
					that.file = $(this).attr('href');
					$('.yes_files a.active',that.$ele).removeClass('active');
					$(this).addClass('active');
					e.preventDefault();
				});
				$(this).dblclick(function(){
					that.select($(this).attr('href'));
				});
				$(this).smartMenu(menuData,{name:'files',textLimit:18}); //自定义右键
			});
		},
		listFolders: function(data){
			var tpl=''; var that=this;
			$.each(data,function(k,v){
				tpl += '<li><a href="'+v.path+'">'+v.name+'</a>';
				if(typeof(v.son)=='object'){
					tpl += '<ul>';
					tpl += that.listFolders(v.son);
					tpl += '</ul>';
				}
				tpl += '</li>';
			});
			return tpl;
		},
		newFolder:function(path,name){
			if(!name)return alert('Please give a folder name first.');
			var data = this.getData('newfolder', path+'||'+name);
			if(data.error){
				alert(data.error);
			}else if(data){
				this.loadFolders();
				alert('The new folder is done.');
			}else{
				alert('Failed to make the new folder.');
			}
		},
		delFolder:function(path){
			if(!path)return alert('Please choose a folder first.');
			if(!confirm('Are you sure to delete this folder "'+path+'"?'))return;
			
			var data = this.getData('delfolder', path);
			if(data.error){
				alert(data.error);
			}else if(data){
				this.loadFolders();
				alert('The folder is deleted.');
			}else{
				alert('Failed to delete the folder.\nThere may be some files and/or folders in it.');
			}
		},
		view: function(path){
			if(!path)return alert('Please choose a file first.');
			var data = this.getData('baseurl');
			if(data.error){
				alert(data.error);
			}else{
				path = data+path;
				window.open(path);
			}
		},
		upload: function(){
			var that=this, input = $('#upfile');
			input.change(function(){
				if($(this).val().length>0){
					that.ajaxUpload();
				}else{
					alert('Please choose a file to upload.');
				}
			});
			input.click();
		},
		delete: function(path){
			if(!path){return alert('Please choose a file first.');}
			if(!confirm('Are you sure to delete this file: '+path+' ?'))return;
			var data = this.getData('delete',path);
			if(data.error){
				alert(data.error);
			}else{
				this.refresh();
			}
		},
		rename: function(oldname,newname,folder){
			var action = folder ? 'change':'alter';
			var data=this.getData(action,oldname+'||'+newname);
			if(data.error){
				alert(data.error);
			}else if(data){
				action = folder ? this.loadFolders():this.refresh();
				alert("Rename is done");
			}else{
				alert('Failed to rename it');
			}
		},
		download: function(path){
			if(!path){return alert('Please choose a file first.');}
			var data = this.getData('check', path);
			if(data)
			    window.location = this.options.url+'?action=download&path='+path;
			else
			    alert("The file '"+path+" doesn't exist.");
		},
		refresh : function(){
			this.loadFiles();
			$('#yes_input_div').hide();
			$('#yes_origin').val('');
		},
		select : function(path){
			if(this.callback){
				this.callback(path);
			}else if(yesfinder&&typeof(yesfinder)==='function'){
			    yesfinder(path);
			}else if(parent.yesfinder&&typeof(parent.yesfinder)==='function'){
				parent.yesfinder(path);
			}
		},
		getData: function(action,path){
            var _data,that = this,settings = this.options;
            
            $.ajax({  
                url : settings.url, 
                data: {action: action, path: path, type: settings.filetype},
                type : 'get',  
                cache: false,
	            async: false, 
                dataType:'json',
	            beforeSend: function(){},
	            complete: function(){},
                success:function(data){
	            	_data=data;
                 },
                 error:function() {   
                    _data.error="ERROR: failed to get any data.";
                 }
            });
            return _data;
		},
		ajaxUpload: function(){
			var that=this;
			$.ajaxFileUpload({
			    url: that.options.url+'?action=upload&path='+that.folder,
			    fileElementId: 'upfile',
		    	dataType: 'json',
		    	success: function (data, status) {
			    	if(data.error){
				        alert('Failed: '+data.error);
				    }else{
				    	that.refresh();
				    	alert('Success: '+data+' is uploaded.');
				    }
			    },
			    error: function (data, status, e) {
					alert('Error： '+e);
			    }
		    });
		}
    }
    //在插件中使用对象
    $.fn.yesFinder = function(options,callback) {
        //创建实体
		if(typeof(options)==="function"){
			callback = options;
			options={};
		}
        var yesFinder = new YesFinder(this, options, callback);
        //调用其方法
        return yesFinder.init();
    }
})(jQuery, window, document);


var Request = {
    QueryString : function(item){
        var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
        return svalue ? svalue[1] : svalue;
    }
}