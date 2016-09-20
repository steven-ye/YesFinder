/*
 * YesModal v1.0.1
 * Steven Ye
 * Email: steven_ye@foxmail.com
 * Date: 2016-9-19
 */

(function($, window, document,undefined) {
    var defaults = {
        width:600,
        height:300,
        title:'',
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
        this.cover = $('<div>').addClass('cover').appendTo(this.modal.empty());
        this.dialog = $('<div class="modal-dialog">').appendTo(this.modal);
        this.header = $('<div class="modal-header"><a class="close" title="close">&times;</a></div>').appendTo(this.dialog);
        this.body = $('<div class="modal-body"></div>').appendTo(this.dialog);
        this.footer = $('<div class="modal-footer">').appendTo(this.dialog);
        this.title = $('<b></b>').prependTo(this.header);
    };
    YesModal.prototype = {
        init: function(w,h){
            var that = this;
            this.header.find('.close').click(function(){that.hide();});
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
            return this;
        },
        resize: function(w,h){
            var $ele = this.$ele,W=$ele.width(),H=$ele.height();
            w = w||this.options.width;
            h = h||this.options.height;
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
    $.fn.YesModal = function(method,options){
        options = options||{};
        var modal = new YesModal(this,options);
        this.data['YesModal'] = modal.init();
        return this;
    };
    $.YesModal = function(ele,options){
        ele = ele||'body';
        var modal = new YesModal($(ele),options);
        return modal.init();
    }
})(jQuery, window, document);
