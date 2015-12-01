function pageInit(){
	showFolders();
	showFiles('/');
	//alert(Request.QueryString('type'));
}

function getData(options){
  var _data;
  var defaults={
	    url: 'yesfinder.php',
		type: 'get',
		data: {action: 'folders', path: '/'},
		dataType: 'json'
      }
  var ob = $.extend({},defaults,options);
  $.ajax({  
    url : ob.url, 
    data: ob.data,
    type : ob.type,  
    cache: false,
	async: false, 
    dataType:ob.dataType,
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
}

function showFolders(){
	var data = getData();
	if(typeof(data.error)!='undefined'){
		$('$folders>ul').html('<p>'+data.error+'</p>');
	}else{
		$('#folders>ul').html(listFolders(data));
		$('#folders a').each(function(){
			$(this).click(function(e){
				showFiles($(this).attr('href'));
				$('#folder').val($(this).attr('href'));
				setActive($(this));
				e.preventDefault();
			});
		});
	}
}

function listFolders(data){
	var tpl='';
	$.each(data,function(k,v){
		tpl += '<li><a href="'+v.path+'">'+v.name+'</a>';
		if(typeof(v.son)=='object'){
		    tpl += '<ul>';
			tpl += listFolders(v.son);
		    tpl += '</ul>';
		}
		tpl += '</li>';
	});
	return tpl;
}

function showFiles(path){
	var tpl='',num=0; 
	var data = getData({data: {action: 'files', path: path}});
	if(typeof(data.error)!='undefined'){
		$('$files').html('<p>'+data.error+'</p>');
	}else if(data.length==0){
		tpl='<p>Nothing is found.</p>';
	}else{
	    $.each(data,function(i,v){
			tpl += '<a href="'+v.file+'" onDblClick="select(\''+v.file+'\');">';
			if('jpg,jpeg,png,gif,bmp'.indexOf(v.filetype)>-1){
	            tpl += '<img src="'+v.file+'"/>';
			}else{
				var iconlist='ai,avi,bmp,cs,dll,doc,docx,exe,fla,gif,jpg,js,mdb,mp3,ogg,pdf,ppt,pptx,rar,rdp,swf,swt,txt,vsd,xls,xlsx,xml,zip,';
				if(v.filetype.length==0)v.filetype='default.icon';
				else if(iconlist.indexOf(v.filetype+',')<0)v.filetype='default.icon';
				tpl += '<img src="skins/kama/images/icons/32/'+v.filetype+'.gif"/>';
			}
		    tpl += '<p>'+v.filename+'</p>';
		    tpl += '<p>'+v.filetime+'</p>';
		    tpl += '<p>'+v.filesize+'</p>';
			num++;
	    });
	}
	$('#files').html(tpl);
	$('#num').text(num);
	
	var menuData = [
  	  [{
        text: "Select",
	    func: function(){
			$(this).dblclick();
		  }
		/*
        data: [[{
   	            text: "5像素深蓝",
   	            func: function() {
                    $(this).css("border", "5px solid #34538b");
    	        }
            }, {
  	  	        text: "5像素浅蓝",
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
              var src = $(this).attr("href");
           	  window.open(src.replace("/s512", "")); 
    	   }
   	  }, {
    	 text: "Download",
     	 func: function() {
              download($(this).attr('href'));
    	   }
	  
  	  }],
      [{
    	 text: "Rename",
    	 func: function() {
			    alert("Not available yet.");
   	 	    }
	   }, {
    	 text: "Resize",
    	 func: function() {
           	    alert("Not available yet.");
   	 	    }
 	  }]
	  ,
      [{
         text: "Delete",
         func: function() {
                var filename = $(this).attr('href');
				del(filename);
            }
 	  }]
	];
	
	$('#files a').each(function(){
		$(this).smartMenu(menuData,{textLimit:18});
		$(this).click(function(e){
			e.preventDefault();
		});
	});
}

function select(filename){
	if(parent.callback){
		parent.callback(filename);
	}else{
		alert('You choose the file: '+filename);
	}
}

function del(path){
  if(!confirm('Are you sure that you want to delete this file?'))retrun;
  $.ajax({  
    url:'yesfinder.php',  
    data:{ 
           action : 'delete',
		   path: path
    },
    type:'get',  
    cache:false,
	success   : function(data) {
		refresh();
    },
    error     : function() {
        alert("Failed to connect to the server.");
	}
  });
}

function refresh(){
	var folder=$('#folder').val();
	showFiles(folder);
}

function upload(){
	var input = $('#upfile');
	input.change(function(){
		if($(this).val().length>0){
		    //form.submit();
			var cur_path = $('#folder').val();
			ajaxUpload(cur_path);
		}else{
			alert('Please choose a file to upload.');
		}
	});
	input.click();
}

function ajaxUpload(path){

$.ajaxFileUpload({
	url: 'yesfinder.php?action=upload&path='+path,
	fileElementId: 'upfile',
	dataType: 'json',
	success: function (data, status) {
		if(typeof(data.error)=='undefined'){
		    refresh();
			alert('Success: '+data.msg+' is uploaded.');
		}else{
			alert('Failed: '+data.error);
		}
	},
	error: function (data, status, e) {
		alert('Upload Failed. '+e);
	}
});
}

function download(filename){
	window.open('yesfinder.php?action=download&path='+filename);
}

function setActive(ob){
	$('#folders a').each(function(){
		$(this).removeClass('active');
	});
	ob.addClass('active');
}

Request = {
    QueryString : function(item){
        var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
        return svalue ? svalue[1] : svalue;
    }
}