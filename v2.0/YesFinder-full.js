/*
 * YesFinder v2.0.3
 * Steven Ye
 * Email: steven_ye@foxmail.com
 * 依赖 YesModal 和 YesContextMenu 插件
 * Date: 2016-9-20
 * MIT License
 */
;(function($, window, document,undefined) {
    var defaults ={
        url: 'php/Connector.php',
        iconPath:'images/icons/64/',
        iconUnknown:'unknown.png',
        width:800,
        height:500,
        modal:false,
        delBtn:false,
        delBtnTxt: '&times',
        delBtnCss:{},
        delBtnClick:function(finder){},
        menu:'View,Upload,Refresh,Delete,Download,Settings,Help'
    };
    var TPL = '<div><table cellpadding="0" cellspacing="0" border="0" width="100%"><tbody>' +
        '<tr><td width="20%"><div class="fm-sidebar">'+
        '<h2>文件目录</h2><ul class="folders">'+
        '<li class="root"><a class="active" href=""> 根目录</a></li><ul></ul>'+
        '</ul></div></td><td width="80%">'+
        '<div class="fm-header"><ul class="fm-toolbar"></ul></div>'+
        '<div class="fm-body"><ul class="files"></ul></div></td></tr>' +
        '<tr><td colspan="2" align="center">' +
        '<div class="statusbar">本目录下共有 <span class="files_num">0</span> 个文件</div>' +
        '</td></tr></tbody></table></div>';

    var YesFinder = function(ele,opt,callback){
        this.version = '2.0.2';
        this.$ele = ele;
        this.options = $.extend({},defaults,$.fn.YesFinder.defaults, opt);
        this.callback = callback;
        this.$finder = $(TPL);
        this.folder='';
        this.file='';
        this.upfiles=[];
    };
    YesFinder.prototype = {
        init: function(){
            var that=this,options=this.options,$finder = this.$finder,$ele=this.$ele;
            $finder.addClass('YesFinder');
            this.load('menu');
            if(options.modal){
                if(!$.YesModal){
                    alert('缺少YesModal插件，YesFinder没有启动。');
                    return false;
                }
                $ele.click(function(e) {
                    e.preventDefault();
                    return false;
                });
                this.YesModal = $.YesModal({width:options.width,height:options.height});
                this.YesModal.title.html('YesFinder - Web File Manager');
                this.YesModal.body.html($finder);
                this.YesModal.footer.hide();
                $finder.find('.fm-sidebar').eq(0).css('height',options.height-42);
                $finder.find('.fm-body').eq(0).css('height',options.height-82);
                if(options.delBtn){
                    var delBtn = $('<a class="delBtn">').css(options.delBtnCss)
                        .html(options.delBtnTxt)
                        .click(function(e){
                            e.stopPropagation();
                            e.preventDefault();
                            options.delBtnClick.call(that.$ele,that);
                        }).appendTo(this.$ele);
                    $ele.hover(function(){
                        $(this).addClass('del-on');
                        delBtn.show();
                    },function(){
                        $(this).removeClass('del-on');
                        delBtn.hide();
                    });
                }
                $ele.click(function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    that.YesModal.show();
                });
            }else{
                var wh = $(window).height();
                $finder.find('.fm-sidebar').eq(0).css('height',wh-42);
                $finder.find('.fm-body').eq(0).css('height',wh-82);
                $ele.append($finder);
                if(!$.YesModal){
                    $finder.find('.files').html('<h3 class="text-center">缺少YesModal插件，YesFinder无法正常工作。</h3>');
                    return false;
                }
                $(window).resize(function(){
                    var wh = $(this).height();
                    $finder.find('.fm-sidebar').eq(0).css('height',wh-42);
                    $finder.find('.fm-body').eq(0).css('height',wh-82);
                });
            }
            this.modal= $.YesModal({},$finder);
            if(!$finder.YesContextMenu){
                $finder.find('.fm-body').prepend('<p class="text-center mute">YesFinder缺少YesContextMenu自定义右键插件，部分功能无法使用。</p>');
            }
            this.get('init').then(function(data){
                if(data.error){
                    $finder.find('.fm-body').html('<h3 class="text-center">'+data.error+'</h3>');
                }else{
                    that.baseUrl = that.options.baseUrl || data.baseUrl;
                    that.finderUrl = that.options.finderUrl || data.finderUrl;
                    that.iconPath = that.options.iconPath?that.finderUrl+that.options.iconPath:'';

                    $.get(that.iconPath+that.options.iconUnknown).then(function(){
                        that.iconUnknown = that.iconPath+that.options.iconUnknown;
                    },function(){
                        that.iconUnknown=null;
                    }).always(function(){
                        that.load('folders');
                    });
                }
            },function(data){
                that.modal.hide();
                $finder.find('.fm-body').html('<h3 class="text-center">服务器返回错误，请检查配置是否正确。</h3>');
            });
        },
        load: function(option){
            var that=this,$finder = this.$finder;
            switch(option){
                case 'menu':
                    var menuList={
                        View:{text:'查看',click:function(){that.view(that.file);}},
                        Upload:{text:'上传',click:function(){that.load('upload');}},
                        Refresh:{text:'刷新',click:function(){that.refresh();}},
                        Delete:{text:'删除',click:function(){that.delete(that.file);}},
                        Download:{text:'下载',click:function(){that.download(that.file);}},
                        Settings:{text:'设置',html:'<ul><li><label><input type="checkbox" name="filename" checked> Filename</label></li><li><label><input type="checkbox" name="filetime"> Filetime</label></li><li><label><input type="checkbox" name="filesize" checked> Filesize</label></li></ul>'},
                        Help:{text:'帮助',html:'<div>YesFinder 要求 PHP5.4+ <br/> 最好 JQuery 1.11.0+ <br> 因PHP原因，中文文件名可能会出现乱码，文件或目录名称请不要使用中文。</div>'}
                    };
                    var menuOption = this.options.menu.split(',');
                    var toolbar = $('.fm-toolbar',$finder).html('');
                    $.each(menuList,function(key,menu){
                        if(menuOption.indexOf(key)>=0){
                            var li=$('<li class="'+key.toLowerCase()+'">'+menu.text+'</li>').appendTo(toolbar);
                            if(menu.click){li.click(menu.click);}
                            if(menu.html){li.append(menu.html);}
                        }
                    });
                    $('.settings input:checkbox',toolbar).each(function(){
                        $(this).click(function(){
                            if($(this).is(':checked')){
                                $('.files .'+$(this).attr('name'),$finder).show();
                            }else{
                                $('.files .'+$(this).attr('name'),$finder).hide();
                            }
                        });
                    });
                    break;
                case 'folders':
                    var $folders =  $('.folders',$finder);
                    this.get('folders').then(function(data){
                        if(data.error){
                            return that.alert(data.error);
                            //return $folders.children('ul').html('<p>'+data.error+'</p>');
                        }

                        $folders.children('ul').html(list(data));

                        $('a',$folders).each(function(){
                            var $this=$(this),folder = $(this).attr('href');
                            $(this).click(function(e){
                                e.preventDefault();
                                that.folder = folder;
                                that.load('files');
                                $('a.active',$folders).removeClass('active');
                                $(this).addClass('active');
                            });
                            if(folder==that.folder)$(this).click();

                            $(this).dblclick(function(e){
                                if(folder==''||folder=='/'){
                                    that.alert('无权重命名根目录。')
                                    return false;
                                }
                                var self = $(this);
                                self.hide();
                                var old = folder.substr(folder.lastIndexOf('/')+1);
                                $('<input style="width:90%"/>').blur(function(e){
                                    var name = $(this).val();
                                    $(this).remove();
                                    self.show();
                                    if(name==''||name==old)return false;
                                    that.get('change',folder+'||'+name).done(function(data){
                                        if(data.error){
                                            that.alert(data.error);
                                        }else{
                                            that.refresh();
                                        }
                                    });
                                }).val(old).insertAfter($(this)).focus();
                            });

                            var menuData = [
                                {header:'目录操作'},
                                {text:'新建目录',action:function(e){that.newfolder(folder);}},
                                {text:'重 命 名',action:function(e){$this.dblclick();}},
                                {text:'删除目录',action:function(e){that.delete(folder);}},
                                {footer:'YesFinder v'+that.version}
                            ];
                            //if($(this).YesContextMenu)$(this).YesContextMenu(menuData);
                            if($.YesContextMenu)$.YesContextMenu($(this),menuData);
                        });

                        function list(data){
                            var tpl=''; var that=this;
                            $.each(data,function(k,v){
                                tpl += '<li><a href="'+v.path+'">'+v.name+'</a>';
                                if(typeof(v.son)=='object'){
                                    tpl += '<ul>';
                                    tpl += list(v.son);
                                    tpl += '</ul>';
                                }
                                tpl += '</li>';
                            });
                            return tpl;
                        }
                    });
                    break;
                case 'files':
                    var $yesfile=$finder.find('.files'),
                        fullpath = that.folder=='/' ? that.baseUrl:that.baseUrl+that.folder;
                    this.get('files',that.folder).then(function(data){
                        if(data.error){
                            //return $yesfile.html('<p>'+data.error+'</p>');
                            return that.alert(data.error);
                        }
                        if(!data.length){
                            $finder.find('.files_num').text('0');
                            $yesfile.html('<p class="mute text-center">没找到文件。</p>');
                        }else{
                            $finder.find('.files_num').text(data.length);
                            $yesfile.html('');
                            $.each(data,function(i,v){
                                var file = that.folder==''?v.filename:that.folder+'/'+v.filename,
                                    ext = v.filename.substr(v.filename.lastIndexOf('.')+1),
                                    img = $('<img>'),
                                    icon=that.iconPath+ext+'.png',
                                    li = $('<li>').appendTo($yesfile),
                                    fileicon = $('<p class="fileicon">').appendTo(li),
                                    filename = $('<p class="filename">').html(v.filename).appendTo(li),
                                    textarea = $('<textarea name="filename" style="width:90%;">');
                                li.append(
                                    '<p class="filetime">'+v.filetime+'</p>'+
                                    '<p class="filesize">'+v.filesize+'</p>'+
                                    '<span class="icon"></span>'
                                ).data('file',file);
                                if(['jpg','jpeg','png','gif','bmp'].indexOf(ext.toLowerCase())!==-1){
                                    img.attr('src',fullpath + '/' + v.filename);
                                }else{
                                    img.attr('src',icon);
                                    if(that.iconUnknown){
                                        img.on('error',function(){
                                            this.src = that.iconUnknown;
                                        });
                                    }
                                }
                                fileicon.append(img);
                                fileicon.click(function(e){
                                    that.file = file;
                                    $yesfile.find('li.active').removeClass();
                                    $(this).parent().addClass('active');
                                });
                                fileicon.dblclick(function(){
                                    that.select(file);
                                });

                                filename.dblclick(function(e){
                                    $(this).hide();
                                    var name = v.filename.substr(0,v.filename.lastIndexOf('.'));
                                    textarea.val(name);
                                    $(this).after(textarea);
                                    textarea.focus();
                                });
                                textarea.on('blur',function(e){
                                    $(this).detach();
                                    filename.show();
                                    var name = $(this).val().replace(/\.+$/,'');
                                    if(name==''||name+'.'+ext == v.filename)return true;
                                    name = name+'.'+ext;
                                    that.get('change',file+'||'+name).done(function(data){
                                        if(data.error){
                                            that.alert(data.error);
                                        }else{
                                            that.refresh();
                                        }
                                    });
                                });

                                $finder.find('.settings input:checkbox').each(function(){
                                    if($(this).is(':checked')){
                                        li.find('.'+$(this).attr('name')).show();
                                    }else{
                                        li.find('.'+$(this).attr('name')).hide();
                                    }
                                });


                                var menuData = [
                                    {header:'文件操作'},
                                    {text:'选择文件',action:function(e){fileicon.click();fileicon.dblclick();}},
                                    {text:'查看图片',action:function(e){that.view(file);}},
                                    {text:'下载文件',action:function(e){that.download(file);}},
                                    {divider:true},
                                    {text:'重 命 名',action:function(e){filename.dblclick();}},
                                    {text:'删除文件',action:function(e){that.delete(file);}},
                                    {footer:'YesFinder v'+that.version}
                                ];
                                if(li.YesContextMenu)li.YesContextMenu(menuData);
                            });
                        }
                    });
                    break;
                case 'upload':
                    var body = $('<table class="up-table" width="100%">' +
                            '<thead><tr><th width="50%" height="30">文件名称</th>' +
                            '<th width="30%">文件大小</th>' +
                            '<th width="20%">操作</th></tr></thead>' +
                            '<tbody><tr><td colspan="3">请选择文件。</td></tr></tbody></table>'),
                        footer = $('<div>'),
                        input = $('<input type="file" multiple/>');
                    this.modal.init(600,260);
                    this.modal.btnOkay.text('+ 添加文件').unbind().click(function(){input.click();});
                    this.modal.btnCancel.text('上 传').unbind().click(function(){
                        //that.modal.hide();
                        if(that.upfiles.length<=0){
                            return that.alert('请选择文件。');
                        }
                        that.fileUpload().done(function(data){
                            if(data.error){
                                that.alert(data.error);
                            }else{
                                that.refresh();
                                that.alert('<b>成功上传如下文件：</b><br><br>'+data.toString().replace(/,/g,'<br>'));
                            }
                        }).always(function(){
                            that.upfiles = [];
                        });
                    });
                    input.change(function(){
                        var files = this.files;
                        if(!that.upfiles.length){
                            body.find('tbody').empty();
                        }
                        $.each(this.files,function(i,file){
                            if($.inArray(file,that.upfiles)<0){
                                that.upfiles.push(file);
                                var tr = $('<tr>');
                                tr.append('<td>'+file.name+'</td>' +
                                    '<td>'+(file.size/1024).toFixed(2)+' KB</td>' +
                                    '<td><button type="button">删除</button></td>');
                                tr.find('button').click(function(){
                                    that.upfiles.splice(that.upfiles.indexOf(file),1);
                                    tr.remove();
                                });
                                body.find('tbody').append(tr);
                            }
                        });

                        var isIE = /msie/.test(navigator.userAgent.toLowerCase());
                        if(isIE) {
                            input.replaceWith(input.clone(true));
                        } else {
                            input.val('');
                        }
                    });

                    this.upfiles = [];//清空上传文件
                    //以下为弹窗
                    this.modal.title.html('文件上传');
                    this.modal.body.html(body).css({padding:'5px 10px'});
                    this.modal.footer.show();
                    this.modal.show();
                    break;
            }
        },
        view: function(file){
            if(!file){
                return this.alert('请选择文件。');
            }
            var ext = file.substr(file.lastIndexOf('.'));
            if('.jpg.jpeg.gif.png.bmp'.indexOf(ext.toLowerCase())===-1){
                return this.alert('只能查看图片文件。');
            }
            this.modal.init(500,300);
            this.modal.title.html('查看图片');
            var img = $('<img src="'+this.baseUrl+'/'+file+'"/>');
            img.css({maxHeight:300});
            this.modal.body.html(img);
            this.modal.footer.hide();
            this.modal.show();
        },
        newfolder:function(path){
            var that=this,
                body=$('<div></div>'),
                input = $('<input type="text"/>').appendTo(body);
            input.before('<br><br><label>目录名称：</label> ').after('<p class="red"></p>');
            this.modal.init(500,110);
            this.modal.title.html('新建目录');
            this.modal.body.html(body);
            this.modal.btnOkay.unbind().click(function(){
                var name = input.val();
                if(!name||!name.length){
                    input.next().html('请输入新目录名。');
                    input.focus();
                    return false;
                }
                that.get('newfolder', path+'/'+name).done(function(data){
                    if(data.error){
                        input.next().html(data.error);
                    }else{
                        that.refresh();
                        that.modal.hide();
                    }
                });
            });
            this.modal.footer.show();
            this.modal.show();
        },
        delete: function(file){
            var that = this;
            if(!file){return this.alert('请选择要删除的文件或目录。');}
            that.confirm('确认要删除此文件/目录: '+file+' ?',function(){
                that.get('delete',file).then(function(data){
                    if(data.error) return that.alert(data.error);
                    that.refresh();
                    that.modal.hide();
                });
            });

        },
        download: function(file){
            if(!file){return this.alert('请先选择要下载的文件。');}
            window.location = this.options.url+'?action=download&path='+file;
        },
        select: function(file){
            this.callback.call(this.$ele,file,this);
        },
        refresh: function(){
            this.load('folders');
        },
        get: function(action,path){
            var that = this;
            return $.ajax({
                url : this.options.url,
                data: {action: action, path: path, type: this.options.filetype},
                type : 'get',
                cache: false,
                dataType:'json'
            }).fail(function(jqXHR, textStatus, errorThrown){
                console.log(encodeURIComponent(jqXHR.responseText));
                console.log(jqXHR.status);
                console.log(jqXHR.readyState);
                console.log(jqXHR.statusText);
                /*打印其他两个参数的信息*/
                console.log(textStatus);
                console.log(errorThrown);

                that.alert('服务器返回错误，操作失败。');
            });
        },
        fileUpload: function(){
            var that=this,fd = new FormData();
            $.each(this.upfiles, function(i, file) {
                fd.append('file[]', file);
            });
            return $.ajax({
                url: this.options.url + '?action=upload&path=' + this.folder,
                data: fd,
                type: 'POST',
                cache: false,
                contentType: false,    //不可缺
                processData: false,    //不可缺
                dataType: 'json'
            }).fail(function(jqXHR, textStatus, errorThrown){
                console.log(encodeURIComponent(jqXHR.responseText));
                console.log(jqXHR.status);
                console.log(jqXHR.readyState);
                console.log(jqXHR.statusText);
                /*打印其他两个参数的信息*/
                console.log(textStatus);
                console.log(errorThrown);

                that.alert('服务器返回错误，操作失败。');
            });
        },
        alert: function(msg){
            this.modal.init(400,100);
            this.modal.title.html('Alert');
            this.modal.body.html($('<div>').css('padding','10px').html(msg));
            this.modal.btnCancel.hide();
            //this.modal.btnCancel.text('确认');
            this.modal.show();
            return false;
        },
        confirm: function(msg,okAction,cancelAction){
            this.modal.init(400,100);
            this.modal.title.html('Confirm');
            this.modal.body.html($('<div>').css('padding','10px').html(msg));
            this.modal.btnOkay.unbind().click(okAction);
            if(cancelAction)this.modal.btnCancel.unbind().click(cancelAction);
            this.modal.show();
        }
    };

    //在插件中使用对象YesFinder
    $.fn.YesFinder = function(options,callback) {
        if($.isFunction(options)){
            callback = options;
            options={};
        }
        return this.each(function(){
            //创建实体
            var finder = new YesFinder($(this), options, callback);
            //调用其方法
            finder.init();
        });
    };
    $.fn.yesFinder = $.fn.YesFinder;
    $.fn.YesFinder.defaults={};
    $.YesFinder = function(ele,options,callback){
        if($.isFunction(options)){
            callback = options;
            options={};
        }
        var finder = new YesFinder($(ele),options,callback);
        finder.init();
        return finder;
    };
})(jQuery, window, document);

/*
 * YesModal v1.1
 * Steven Ye
 * Email: steven_ye@foxmail.com
 * Date: 2016-9-20
 */

(function($, window, document,undefined) {
    var defaults = {
        width:600,
        height:300,
        title:'YesModal',
        movable: true,
        btnOkayTxt:'确认',
        btnCancelTxt:'取消',
        okayClick:function(e){this.hide();},
        cancelClick:function(e){this.hide();}
    };
    //YesModal对象
    var YesModal = function(ele,options) {
        this.$ele = ele;
        this.options = $.extend({},defaults,options);
        this.modal = $('<div>').addClass('YesModal').appendTo(this.$ele);
        this.cover = $('<div>').addClass('cover').appendTo(this.modal);
        this.dialog = $('<div class="modal-dialog">').appendTo(this.modal);
        this.header = $('<div class="modal-header"></div>').appendTo(this.dialog);
        this.body = $('<div class="modal-body"></div>').appendTo(this.dialog);
        this.footer = $('<div class="modal-footer">').appendTo(this.dialog);
        this.title = $('<b></b>').prependTo(this.header);
    };
    YesModal.prototype = {
        init: function(w,h){
            var that = this;
            $('<a class="close" title="close">&times;</a>').appendTo(this.header).click(function(){that.hide();});
            this.footer.html('');
            this.btnOkay = $('<button name="okay"></button>').appendTo(this.footer);
            this.btnCancel = $('<button name="cancel"></button>').appendTo(this.footer);
            this.btnOkay.text(this.options.btnOkayTxt).click(function(e){
                that.options.okayClick.call(that,arguments);
            });
            this.btnCancel.text(this.options.btnCancelTxt).click(function(e){
                that.options.cancelClick.call(that,arguments);
            });
            if(this.options.title)this.title.html(this.options.title);
            if(this.options.body)this.body.html(this.options.body);
            if(this.options.footer)this.footer.html(this.options.footer);
            this.resize(w,h);
            $(window).resize(function(){that.resize(w,h);});
            if(this.options.movable)this.move();
            return this;
        },
        resize: function(w,h){
            var $ele = this.$ele,W=$ele.width(),H=$ele.height();
            w = this.options.width = w||this.options.width;
            h = this.options.height = h||this.options.height;
            if($ele[0]==$('body')[0]){
                W = $(window).width();
                H = $(window).height();
                this.modal.css({position:'fixed'});
            }
            if(H>0) {
                this.body.css({height: h});
                this.dialog.css({width:w,left:(W-w)/2,top:(H-h)>86?(H-h-86)/2:0});
            }
            return this;
        },
        move:function(){
            var dialog = this.dialog,
                movable = false,
                ox,oy;
            this.header.css({cursor:'move'});
            this.header.mousedown(function(e){
                ox = e.pageX-parseInt(dialog.css('left'));
                oy = e.pageY-parseInt(dialog.css('top'));
                movable = true;
            }).mouseup(function(){
                moveable = false;
            });
            this.modal.mousemove(function(e){
                if(movable){
                    var x=e.pageX-ox,
                        y=e.pageY-oy;

                    if(y<0)
                        y=0;
                    else if(y>$(this).height()-10)
                        y=$(this).height()-10;
                    dialog.css({
                        left:x,
                        top:y
                    });
                }
            }).mouseup(function(e){
                movable = false;
            });
        },
        show: function (){
            this.$ele.addClass('YesModal-on');
            this.modal.fadeIn();
            return this;
        },
        hide: function hide(){
            this.modal.hide();
            this.$ele.removeClass('YesModal-on');
            return this;
        }
    };

    //在插件中使用对象YesModal
    $.fn.YesModal = function(options,ele){
        options = options ||{};
        ele = ele||'body';
        var modal = new YesModal($(ele),options);
        modal.init();
        this.click(function(e){
            e.preventDefault();
            if($(this).data('title'))modal.title.html($(this).data('title'));
            var target = $(this).attr('href')||$(this).data('target');
            if(target)modal.body.html($(target).show());
            modal.show();
        });
        return this;
    };
    $.YesModal = function(options,ele){
        options = options||{};
        ele = ele||'body';
        var modal = new YesModal($(ele),options);
        return modal.init();
    }

})(jQuery, window, document);

/*
 * YesContextMenu v1.0.1
 * Steven Ye
 * Email: steven_ye@foxmail.com
 * Date: 2016-9-20
 */

//自定义右键插件 YesContextMenu
(function($, window, document,undefined) {
    var defaults = {};

    $.fn.YesContextMenu = function(data,options){
        options = $.extend({},defaults,options);
        data  = data ||[];
        options = $.extend(defaults,options||{});
        $menu = $('<div class="contextmenu">');
        $menu.click(function(e){
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        this.on('contextmenu',function(e){
            e.stopPropagation();
            $menu.empty();
            createMenu($menu,data);
            $menu.css({left: e.pageX-window.scrollX,top: e.pageY-window.scrollY});
            $menu.appendTo('body').show();
            return false;
        });
        $(window).on('click blur',function(e){
            $menu.fadeOut();
        });
        function createMenu(obj,arr){
            if(!arr)return obj;
            var ul = $('<ul>').appendTo(obj);
            $.each(arr,function(i,v){
                var li = $('<li>').appendTo(ul),
                    a = $('<a>');
                if(v.header){
                    li.html(v.header).addClass('header');
                }
                if(v.divider){
                    li.html('<hr>');
                }
                if(v.text)a.appendTo(li).html(v.text);
                if(v.href){a.attr('href',v.href);}
                if(v.target){a.attr('target',v.target);}
                if(v.action)a.click(v.action);
                if(v.submenu&&$.isArray(v.submenu)){
                    li.append('<i class="triangle"></i>');
                    createMenu(li,v.submenu);
                }
                if(v.footer){
                    li.html(v.footer).addClass('footer');
                }
                a.click(function(){
                    $menu.fadeOut();
                });
            });
            return obj;
        }
        return this;
    };
    $.YesContextMenu = function(ele,data,options){
        return ele.YesContextMenu(data,options);
    };
})(jQuery, window, document);

