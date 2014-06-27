'use strict';

/* Services */

function MessageServiceFactory() {
    return function () {
        var _this = this;
        _this.base_modal = function () {
            /*
             <div class="modal fade">
             <div class="modal-dialog">
             <div class="modal-content">
             <div class="modal-header">
             <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
             <h4 class="modal-title">Modal title</h4>
             </div>
             <div class="modal-body">
             <p>One fine body&hellip;</p>
             </div>
             <div class="modal-footer">
             <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
             <button type="button" class="btn btn-primary">Save changes</button>
             </div>
             </div><!-- /.modal-content -->
             </div><!-- /.modal-dialog -->
             </div><!-- /.modal -->
             */
            var base = $('<div>').addClass("modal fade");
            base.attr("tabindex", "-1");
            base.attr("role", "dialog");
            base.css("display", "none");

            var modal_dialog = $('<div>').addClass("modal-dialog");
            var modal_content = $('<div>').addClass("modal-content").appendTo(modal_dialog);
            var modal_header_inner = $('<h4>').addClass("modal-header-inner");
            $('<div>').addClass("modal-header").appendTo(modal_content).append(modal_header_inner);
            $('<div>').addClass("modal-body").appendTo(modal_content);
            $('<div>').addClass("modal-footer").appendTo(modal_content);

            base.append(modal_dialog);

            return base;
        };
        _this.icon = function (icon_name) {
            return $('<icon>').addClass('fa').addClass(icon_name);
        };
        _this.simple_error = function (title, message) {
            var simple_info = _this.base_modal();
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_info.find(".modal-header-inner").append(i).append($('<span>').text(title));
            simple_info.find(".modal-body").empty().append(message);
            var ok_button = $('<button>').addClass('btn btn-default').text('Ok');
            simple_info.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_info.modal();
            return simple_info;
        };
        _this.simple_info = function (title, message) {
            var simple_info = _this.base_modal();
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_info.find(".modal-header-inner").append(i).append($('<span>').text(title));
            simple_info.find(".modal-body").empty().append(message);
            var ok_button = $('<button>').addClass('btn btn-default').text('Ok');
            simple_info.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_info.modal();
            return simple_info;
        };
        _this.simple_confirm = function (title, message, callback) {
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message);
            var confirm_button = $('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = $('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if (callback != undefined) {
                    callback();
                }
            });
            cancel_button.attr("data-dismiss", "modal");
            confirm_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_form = function (title, message, form, callback) {
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message).append(form);
            var confirm_button = $('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = $('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if (callback != undefined) {
                    callback(form);
                }
            });
            cancel_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_input = function (title, message, callback) {
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            var input = $('<input>').attr('type', 'text').addClass('form-control');
            simple_confirm.find(".modal-body").empty().append(message).append(input);
            var confirm_button = $('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = $('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if (callback != undefined) {
                    callback(input.val());
                }
            });
            cancel_button.attr("data-dismiss", "modal");
            confirm_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
    };
}
function FieldServiceFactory() {
    return function (options) {
        var _this = this;
        _this.field_types = function () {
            return [
                'TextField',
                'CharField',
                'AutoSlugField',
                'BooleanField',
                'DateField',
                'DateTimeField',
                'DecimalField',
                'FilePathField',
                'FloatField',
                'IntegerField',
                'IPAddressField',
                'GenericIPAddressField',
                'NullBooleanField',
                'TimeField',
                'BinaryField',
                'AutoField'
            ];
        };
        function Field(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'];
        }
        _this.make_field = function (options) {
            return new Field(options);
        }
    };
}
function ModelServiceFactory() {
    return function (options) {
        function Model(options) {
            this.name = options['name'];
            this.fields = options['fields'] || [];
            this.field_names = function(){
                var that = this;
                return Object.keys(that.fields).map(function (k) {
                    return that.fields[k].name
                });
            };
            this.has_field = function (field_name) {
                return this.field_names().indexOf(field_name) != -1;
            };
            this.name_field = function () {
                // TODO - find another auto_add_now_field
                if(this.field_names().indexOf('name')!=-1){
                    return 'name';
                }else{
                    return 'id';
                }
            };
            this.ordering_field = function () {
                // TODO - find another auto_add_now_field
                if(this.field_names().indexOf('created')!=-1){
                    return 'created';
                }else{
                    return 'id';
                }
            };
            this.identifier = function (field_name) {
                // TODO - find another name AutoSlugField
                if(this.field_names().indexOf('slug')!=-1){
                    return 'slug';
                }else{
                    return 'id';
                }
            };
            this.form_fields = function(){
                return '[\''+this.field_names().join('\', \'')+'\']'
            };
            this.admin_fields = function(){
                return '[\''+this.field_names().join('\', \'')+'\']'
            };
            this.admin_read_only_fields = function(){
                return '[\''+this.field_names().join('\', \'')+'\']'
            };
            this.detail = function () {
                var output = '{% extends "base.html" %}\n\n' +
                    '{% block content %}\n' +
                    '<table>';
                $.each(this.fields, function(i, field){
                    output += '<tr><td>'+field.name+'<\/td><td>{{ object.'+field.name+' }}<\/td><\/tr>\n';
                });
                output += '<\/table';
                output += '\n<a href="{{object.get_update_url}}">Edit ' + this.name + '</a>\n\{% endblock content %}\n';
                return output;
            }
        }
        return new Model(options);
    };
}

angular.module('myApp.services', [])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('MessageService', [MessageServiceFactory])
    .factory('FieldFactory', [FieldServiceFactory])
    .value('version', '0.1');
