'use strict';

/* Services */

function ModelRenderFactory() {
    return function () {
        var _this = this;
        _this.base_modal = function () {
            return base;
        };
        _this.spaces = function(n){
            var _n = n ||1;
            return new Array(_n+1).join(" ");
        };
        _this.model_names = function(models, suffix){
            var _suffix = suffix || '';
            return Object.keys(models).map(function (k) {
                return models[k].name+_suffix;
            });
        };
        _this.new_lines = function(n){
            var _n = n ||1;
            return new Array(_n+1).join("\n");
        };
        _this.render_forms_py = function (app_name, models) {
            var tests_py = 'from django import forms\n';

            tests_py += 'from .models import '+_this.model_names(models, '').join(', ')+'\n';
            tests_py += _this.new_lines(2);

            $.each(models, function(i, model){
                tests_py += model.render_forms(app_name, _this);
            });

            return tests_py;
        };
        _this.render_tests_py = function (app_name, models) {
            var tests_py = 'import unittest\nfrom django.core.urlresolvers import reverse\nfrom django.test import Client\n';

            tests_py += 'from .models import '+_this.model_names(models, '').join(', ')+'\n';
            tests_py += _this.new_lines(2);

            $.each(models, function(i, model){
                tests_py += model.render_tests(app_name, _this);
            });

            return tests_py;
        };
        _this.render_urls_py = function (app_name, models) {
            var urls_py = 'from django.conf.urls import patterns, url\n';
            urls_py += 'from .views import '+_this.model_names(models, 'ListView').join(', ')+'\n';
            urls_py += 'from .views import '+_this.model_names(models, 'DetailView').join(', ')+'\n';
            urls_py += 'from .views import '+_this.model_names(models, 'CreateView').join(', ')+'\n';
            urls_py += 'from .views import '+_this.model_names(models, 'UpdateView').join(', ')+'\n';
            urls_py += _this.new_lines(1);
            urls_py += 'urlpatterns = patterns()\n';
            urls_py += _this.new_lines(1);

            $.each(models, function(i, model){
                urls_py += model.render_urls(app_name, _this);
            });

            return urls_py;
        };
        _this.render_admin_py = function (app_name, models) {
            var views_py =  'from django.contrib import admin\nfrom django import forms\n';
            views_py += 'from .models import '+_this.model_names(models).join(', ');
            views_py += _this.new_lines(2);

            $.each(models, function(i, model){
                views_py += model.render_admin_classes(app_name, _this);
            });

            return views_py;
        };
        _this.render_views_py = function (app_name, models) {
            var views_py =  'from django.views.generic import DetailView, ListView, UpdateView, CreateView\n';
            views_py += 'from .models import '+_this.model_names(models).join(', ');
            views_py += _this.new_lines(1);
            views_py += 'from .forms import '+_this.model_names(models, 'Form').join(', ');
            views_py += _this.new_lines(2);

            $.each(models, function(i, model){
                views_py += model.render_view_classes(app_name, _this);
            });

            return views_py;
        };
        _this.render_models_py = function (app_name, models) {
            var models_py =  'from django.db import models\n'+
                   'from django.core.urlresolvers import reverse\n'+
                   'from django_extensions.db.fields import AutoSlugField\n';

            models_py += _this.new_lines(2);

            $.each(models, function(i, model){
                models_py += model.render_model_class(app_name, _this);
            });

            return models_py;
        };

    };
}
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
            this.guid = (function() {
              function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                           .toString(16)
                           .substring(1);
              }
              return function() {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                       s4() + '-' + s4() + s4() + s4();
              };
            })();
            console.log(this.guid);
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
            this.l_name = function () {
                return this.name.toLowerCase()
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
            this.render_forms = function(app_name, renderer){
                var urls = '';

                urls += 'class '+this.name+'Form(forms.ModelForm):\n';
                urls += renderer.spaces(4)+'class Meta:\n';
                urls += renderer.spaces(8)+'model = '+this.name+'\n';
                urls += renderer.spaces(8)+'fields = '+this.form_fields()+'\n';
                urls += renderer.new_lines(2);

                return urls;
            };
            this.render_tests = function(app_name, renderer){
                var tests = '';

                tests += 'class '+this.name+'ViewTest(unittest.TestCase):\n';
                tests += renderer.spaces(4)+'\'\'\'\n';
                tests += renderer.spaces(4)+'Tests for '+this.name+'\n';
                tests += renderer.spaces(4)+'\'\'\'\n';
                tests += renderer.spaces(4)+'def setUp(self):\n';

                tests += renderer.spaces(8)+'self.client = Client()\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_list_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_list\')\n';
                tests += renderer.spaces(8)+'response = self.client.get(url)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 200)\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_create_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_create\')\n';
                tests += renderer.spaces(8)+'data = {}\n';
                tests += renderer.spaces(8)+'response = self.client.post(url, data=data)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 302)\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_detail_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+this.l_name()+' = '+this.name+'()\n';
                tests += renderer.spaces(8)+this.l_name()+'.save()\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_detail\', args=['+this.l_name()+'.'+this.identifier()+',]))\n';
                tests += renderer.spaces(8)+'response = self.client.get(url)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 200)\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_update_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+this.l_name()+' = '+this.name+'()\n';
                tests += renderer.spaces(8)+this.l_name()+'.save()\n';
                tests += renderer.spaces(8)+'data = {}\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_update\', args=['+this.l_name()+'.'+this.identifier()+',]))\n';
                tests += renderer.spaces(8)+'response = self.client.get(url, data)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 302)\n';
                tests += renderer.new_lines(2);

                return tests;
            };
            this.render_urls = function(app_name, renderer){
                var urls = '';

                urls += 'urlpatterns += patterns(\'\',\n';
                urls += renderer.spaces(4)+'# urls for '+this.name+'\n';

                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/$\' '+this.name+'ListView.as_view(), name=\''+app_name+'_'+this.l_name()+'_list\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/create/$\' '+this.name+'CreateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_create\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/(?P<'+this.identifier()+'>\\S+)/$\' '+this.name+'UpdateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_update\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/(?P<'+this.identifier()+'>\\S+)/$\' '+this.name+'DetailView.as_view(), name=\''+app_name+'_'+this.l_name()+'_detail\'),\n';

                urls += ')\n';
                urls += renderer.new_lines(1);

                return urls;
            };
            this.render_admin_classes = function(app_name, renderer){
                var admin_classes = '';
                admin_classes += 'class '+this.name+'AdminForm(forms.ModelForm):\n';
                admin_classes += renderer.new_lines(1);
                admin_classes += renderer.spaces(4)+'class Meta:\n';
                admin_classes += renderer.spaces(8)+'model = '+this.name+'\n';
                admin_classes += renderer.new_lines(2);

                admin_classes += 'class '+this.name+'Admin(admin.ModelAdmin):\n';
                admin_classes += renderer.spaces(4)+'form = '+this.name+'AdminForm\n';
                admin_classes += renderer.spaces(4)+'list_display = '+this.admin_fields()+'\n';
                admin_classes += renderer.spaces(4)+'readonly_fields = '+this.admin_read_only_fields()+'\n';
                admin_classes += renderer.new_lines(1);
                admin_classes += 'admin.site.register('+this.name+', '+this.name+'Admin)\n';
                admin_classes += renderer.new_lines(2);

                return admin_classes;
            };
            this.render_view_classes = function(app_name, renderer){
                var view_classes = renderer.new_lines(1);
                view_classes += 'class '+this.name+'ListView(ListView):\n';
                view_classes += renderer.spaces(4)+'model = '+this.name+'\n';
                view_classes += renderer.new_lines(2);

                view_classes += 'class '+this.name+'CreateView(CreateView):\n';
                view_classes += renderer.spaces(4)+'model = '+this.name+'\n';
                view_classes += renderer.spaces(4)+'form_class = '+this.name+'Form\n';
                view_classes += renderer.new_lines(2);

                view_classes += 'class '+this.name+'DetailView(DetailView):\n';
                view_classes += renderer.spaces(4)+'model = '+this.name+'\n';
                view_classes += renderer.new_lines(2);

                view_classes += 'class '+this.name+'UpdateView(UpdateView):\n';
                view_classes += renderer.spaces(4)+'model = '+this.name+'\n';
                view_classes += renderer.spaces(4)+'form_class = '+this.name+'Form';
                view_classes += renderer.new_lines(2);

                return view_classes;
            };
            this.render_model_class = function(app_name, renderer){
                var cls =  'class '+this.name+'(models.Model):';
                cls += renderer.new_lines(1);
                $.each(this.fields, function(i, field){
                    cls += renderer.spaces(4)+field.name+' = '+field.type+'('+field.opts+')';
                    cls += renderer.new_lines(1);
                });
                cls += renderer.new_lines(1);
                cls += renderer.spaces(4)+'class Meta:';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'ordering = (\'-'+this.ordering_field()+'\',)';

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4)+'def __unicode__(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'return u\'%s\' % self.'+this.identifier();

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4)+'def get_absolute_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_detail\', args=(self.'+this.identifier()+'\', ))';
                cls += renderer.new_lines(1);

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4)+'def get_update_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_update\', args=(self.'+this.identifier()+'\', ))';
                cls += renderer.new_lines(3);

                return cls;
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

angular.module('builder.services', [])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('MessageService', [MessageServiceFactory])
    .factory('FieldFactory', [FieldServiceFactory])
    .factory('RenderFactory', [ModelRenderFactory])
    .value('version', '0.1');
