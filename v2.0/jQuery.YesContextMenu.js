/*
 * YesContextMenu v1.0.1
 * Steven Ye
 * Email: steven_ye@foxmail.com
 * Date: 2016-9-19
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
