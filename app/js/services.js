/* Services */
function TarballFactory() {
    return function () {
        function Tarball() {
            var tf = this;
            var Tar = require('tar-js');
            var tarfile = new Tar();
            tf.uInt8ToString = function(buf) {
                var i, length, out = '';
                for (i = 0, length = buf.length; i < length; i += 1) {
                    out += String.fromCharCode(buf[i]);
                }
                return out;
            };
            tf.append = function (file_name, content) {
                tarfile.append(file_name, content)
            };
            tf.get_url = function (n) {
                var base64 = btoa(tf.uInt8ToString(tarfile.out));
                return "data:application/tar;base64," + base64;
            };
        }
        return new Tarball();
    };
}
function ModelRenderFactory() {
    return function (built_in_models) {
        var _this = this;
        _this.built_in_models = built_in_models;
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
        _this.render_all = function(app_name, models){
            // Primary used for testing
            var all_output = '';
            all_output+=_this.render_base_html(app_name, models);
            all_output+=_this.render_forms_py(app_name, models);
            all_output+=_this.render_urls_py(app_name, models);
            all_output+=_this.render_admin_py(app_name, models);
            all_output+=_this.render_views_py(app_name, models);
            all_output+=_this.render_models_py(app_name, models);
            all_output+=_this.render_django_rest_framework_api_py(app_name, models);
            all_output+=_this.render_django_rest_framework_serializers_py(app_name, models);
            all_output+=_this.render_templates_html(app_name, models);
            return all_output;
        };
        _this.render_base_html = function(app_name, models){
            return '<html><head></head><body>{% block content %}Replace this.{% endblock %}</body>';
        };
        _this.pre_imported_modules = function(n){
            return {
                // module, import as
                'django.contrib.auth.models': { as: 'auth_models'},
                'django.db.models': { as: 'models'},
                'django_extensions.db.fields': { as: 'extension_fields'}
            };
        };
        _this.pre_imported_modules_names = function(n){
            return Object.keys(_this.pre_imported_modules());
        };
        _this.render_forms_py = function (app_name, models) {
            var tests_py = 'from django import forms\n';

            tests_py += 'from .models import '+_this.model_names(models, '').join(', ')+'\n';
            tests_py += _this.new_lines(2);

            jQuery.each(models, function(i, model){
                tests_py += model.render_forms(app_name, _this);
            });

            return tests_py;
        };
        _this.render_tests_py = function (app_name, models) {
            var tests_py = 'import unittest\nfrom django.core.urlresolvers import reverse\nfrom django.test import Client\n';

            tests_py += 'from .models import '+_this.model_names(models, '').join(', ')+'\n';
            jQuery.each(_this.built_in_models, function(model, model_details){
                var model_split = model.split('.');
                var model_name = model_split.pop();
                var module_name = model_split.join('.');
                tests_py += 'from '+module_name+' import '+model_name;
                tests_py += _this.new_lines(1);
            });
            tests_py += _this.new_lines(2);

            jQuery.each(_this.built_in_models, function(model, model_details){
                var function_name = 'create_'+model.toLowerCase().replace(/\./g, '_');
                var model_name = model.split('.').pop();

                var test_helpers = '';
                test_helpers += 'def '+function_name+'(**kwargs):\n';
                test_helpers += _this.spaces(4)+'defaults = {}\n';
                jQuery.each(model_details.fields, function(field_name, field_options){
                    test_helpers += _this.spaces(4) + 'defaults[\"' + field_name + '\"] = \"'+field_options['default']+'\"\n';
                });
                test_helpers += _this.spaces(4)+'defaults.update(**kwargs)\n';
                test_helpers += _this.spaces(4)+'return '+model_name+'.objects.create(**defaults)\n';
                test_helpers += _this.new_lines(2);
                tests_py += test_helpers;

            });

            jQuery.each(models, function(i, model){
                tests_py += model.render_tests_helpers(app_name, _this);
            });

            jQuery.each(models, function(i, model){
                tests_py += model.render_tests(app_name, _this);
            });

            return tests_py;
        };
        _this.render_urls_py = function (app_name, models) {
            var urls_py = 'from django.conf.urls import url, include\n';
            urls_py += 'from rest_framework import routers'+_this.new_lines(1);
            urls_py += 'from . import api'+_this.new_lines(1);
            urls_py += 'from . import views'+_this.new_lines(2);

            urls_py +='router = routers.DefaultRouter()'+_this.new_lines(1);
            jQuery.each(models, function(i, model){
                urls_py +='router.register(r\''+model.l_name()+'\', api.'+model.name+'ViewSet)'+_this.new_lines(1);
            });
            urls_py += _this.new_lines(2);
            urls_py += 'urlpatterns = ('+_this.new_lines(1);
            urls_py += _this.spaces(4)+'# urls for Django Rest Framework API'+_this.new_lines(1);
            urls_py += _this.spaces(4)+'url(r\'^api/v1/\', include(router.urls)),'+_this.new_lines(1);
            urls_py += ')'+_this.new_lines(1);
            urls_py += _this.new_lines(1);

            jQuery.each(models, function(i, model){
                urls_py += model.render_urls(app_name, _this);
            });

            return urls_py;
        };
        _this.render_admin_py = function (app_name, models) {
            var views_py =  'from django.contrib import admin\nfrom django import forms\n';
            views_py += 'from .models import '+_this.model_names(models).join(', ');
            views_py += _this.new_lines(2);

            jQuery.each(models, function(i, model){
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

            jQuery.each(models, function(i, model){
                views_py += model.render_view_classes(app_name, _this);
            });

            return views_py;
        };
        _this.render_models_py = function (app_name, models) {
            var models_py =  'from django.core.urlresolvers import reverse\n';
            models_py += 'from django_extensions.db.fields import AutoSlugField\n';
            models_py += 'from django.db.models import *\n';
            models_py += 'from django.conf import settings\n';
            models_py += 'from django.contrib.contenttypes.fields import GenericForeignKey\n';
            models_py += 'from django.contrib.contenttypes.models import ContentType\n';
            models_py += 'from django.contrib.auth import get_user_model\n';

            jQuery.each(_this.pre_imported_modules(), function(_import, import_conf){
                var _import_split = _import.split('.');
                var tail = _import_split.pop();
                models_py += 'from '+_import_split.join('.')+' import '+tail+' as '+import_conf['as']+'\n';
            });

            var all_imports = {};
            jQuery.each(models, function(i, model){
                jQuery.each(model.fields, function(i, field){
                    all_imports[field.module()] = field.module();
                });
            });

            var all_fields = {};
            jQuery.each(models, function(i, model){
                jQuery.each(model.fields, function(i, field){
                    all_fields[field.type] = field;
                });
                jQuery.each(model.relationships, function(i, relationship){
                    all_fields[relationship.type] = relationship;
                });
            });
            jQuery.each(all_fields, function(i, field){
                //if(_this.pre_imported_modules_names().indexOf(field.module()) == -1) {
                //    models_py += 'from ' + field.module() + ' import ' + field.class_name() + '\n';
                //}
            });
            models_py += _this.new_lines(2);

            jQuery.each(models, function(i, model){
                models_py += model.render_model_class(app_name, _this);
            });

            return models_py;
        };
        _this.render_templates_html = function (app_name, models) {
            var templates = [];

            jQuery.each(models, function(i, model){
                templates.push([model.l_name()+'_form.html', model.render_form_html(app_name)]);
                templates.push([model.l_name()+'_detail.html', model.render_detail_html(app_name)]);
                templates.push([model.l_name()+'_list.html', model.render_list_html(app_name)]);
            });

            return templates;
        };
        _this.render_django_rest_framework_api_py = function (app_name, models) {
            var api_py = 'from . import models\n';
            api_py += 'from . import serializers\n';
            api_py += 'from rest_framework import viewsets, permissions\n';
            api_py += _this.new_lines(2);

            jQuery.each(models, function(i, model){
                api_py += model.render_model_api(app_name, _this);
            });

            return api_py;
        };
        _this.render_django_rest_framework_serializers_py = function (app_name, models) {
            var serializers_py = 'from . import models';
            serializers_py += _this.new_lines(2);
            serializers_py += 'from rest_framework import serializers';
            serializers_py += _this.new_lines(3);

            jQuery.each(models, function(i, model){
                serializers_py += model.render_model_serializer(app_name, _this);
            });

            return serializers_py;
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
            var base = jQuery('<div>').addClass("modal fade");
            base.attr("tabindex", "-1");
            base.attr("role", "dialog");
            base.css("display", "none");

            var modal_dialog = jQuery('<div>').addClass("modal-dialog");
            var modal_content = jQuery('<div>').addClass("modal-content").appendTo(modal_dialog);
            var modal_header_inner = jQuery('<h2>').addClass("modal-header-inner");
            jQuery('<div>').addClass("modal-header").appendTo(modal_content).append(modal_header_inner);
            jQuery('<div>').addClass("modal-body").appendTo(modal_content);
            jQuery('<div>').addClass("modal-footer").appendTo(modal_content);

            base.append(modal_dialog);

            return base;
        };
        _this.icon = function (icon_name) {
            return jQuery('<icon>').addClass('fa').addClass(icon_name);
        };
        _this.simple_error = function (title, message) {
            var simple_error = _this.base_modal().addClass("django_builder_simple_error");
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_error.find(".modal-header-inner").append(i).append(jQuery('<span>').text(title));
            simple_error.find(".modal-body").empty().append(message);
            var ok_button = jQuery('<button>').addClass('btn btn-default').text('Ok');
            simple_error.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_error.modal();
            return simple_error;
        };
        _this.simple_info = function (title, message) {
            var simple_info = _this.base_modal();
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_info.find(".modal-header-inner").append(i).append(jQuery('<span>').text(title));
            simple_info.find(".modal-body").empty().append(message);
            var ok_button = jQuery('<button>').addClass('btn btn-default').text('Ok');
            simple_info.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_info.modal();
            return simple_info;
        };
        _this.simple_confirm = function (title, message, callback) {
            var _callback = callback || jQuery.noop;
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                _callback();
            });
            cancel_button.attr("data-dismiss", "modal");
            confirm_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_choice = function (title, message, choices) {
            var simple_choice = _this.base_modal();
            simple_choice.find(".modal-header-inner").html(title);
            simple_choice.find(".modal-body").empty().append(message);
            jQuery.each(choices, function (i, choice) {
                var choice_button = jQuery('<button>').addClass('btn btn-primary').text(choice['text']);
                simple_choice.find(".modal-footer").append(choice_button);
                choice_button.click(function () {
                    choice['callback']();
                });
                choice_button.attr("data-dismiss", "modal");
            });
            simple_choice.modal();
            return simple_choice;
        };
        _this.simple_form = function (title, message, form, callback, no_dismiss) {
            var _callback = callback || jQuery.noop;
            var _no_dismiss = no_dismiss || true;
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message).append(form);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if(!_no_dismiss) {
                    simple_confirm.modal('hide');
                }
                _callback(form);
            });
            cancel_button.attr("data-dismiss", "modal");
            if(!_no_dismiss) {
                confirm_button.attr("data-dismiss", "modal");
            }
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_form_no_dismiss = function (title, message, form, callback) {
            return _this.simple_form(title, message, form, callback, true);
        };
        _this.simple_input = function (title, message, default_value, callback, required) {
            var _callback = callback || jQuery.noop;
            var _required = required || false;
            var simple_input = _this.base_modal();
            simple_input.find(".modal-header-inner").html(title);
            var label = jQuery('<label>').text(message);
            var input = jQuery('<input>').attr('type', 'text').attr('name', 'input').addClass('form-control').attr('value', default_value);
            var input_help = jQuery('<span>').text('error message').addClass('help-block hide');
            var input_group = jQuery('<div>').addClass('form-group form-group-input has-feedback').append(label).append(input).append(input_help);
            var submit_handler = function(){
                var _input = input.val();
                if(_required && (_input=='' || input==undefined)){
                    input_group.addClass('has-error')
                        .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                        .find('.help-block').removeClass('hide').text('Field Required');
                }else{
                    simple_input.modal('hide');
                    _callback(_input);
                }
            };
            var input_form = jQuery('<form>').append(input_group).submit(function( event ) {
                event.preventDefault();
                submit_handler();
            });
            simple_input.find(".modal-body").empty().append(input_form);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_input.find(".modal-footer").append(confirm_button).append(cancel_button);

            confirm_button.click(submit_handler);
            cancel_button.attr("data-dismiss", "modal");
            if(!_required){confirm_button.attr("data-dismiss", "modal");}
            simple_input.modal();
            return simple_input;
        };
    };
}
function RelationshipFactory() {
    return function (options) {
        var _this = this;
        _this.relationship_types = function () {
            return [
                'django.db.models.ForeignKey',
                'django.db.models.OneToOneField',
                'django.db.models.ManyToManyField'
            ];
        };
        _this.relationship_matches = function () {
            return _this.relationship_types + [
                'ForeignKey',
                'OneToOneField',
                'ManyToManyField',
                'models.ForeignKey',
                'models.OneToOneField',
                'models.ManyToManyField'
            ]
        };
        _this.relationship_match = function (rel) {
            return _this.relationship_matches().indexOf(rel) != -1;
        };
        function Relationship(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'];
            this.to = options['to'];
            this.external_app = options['external_app'] || false;
            this.class_name = function () {
                return this.type.split('.').reverse()[0]
            };
            this.form_update = function (form) {
                this.name = jQuery(form).find('input[name=name]').val();
                this.type = jQuery(form).find('select[name=type]').val();
                this.opts = jQuery(form).find('input[name=opts]').val();
                this.to = jQuery(form).find('input[name=to]').val();
            };
            this.to_clean = function () {
                return this.to.replace(/['"]+/g, '')
            };
            this.to_class = function () {
                return this.to.split('.').reverse().shift();
            };
            this.opts_args = function () {
                return this.opts.split(',').join(', ');
            };
            this.to_module = function () {
                var split = this.to.split('.');
                return split.slice(0, split.length-1).join('.');
            };
            this.module = function () {
                var split = this.type.split('.');
                return split.slice(0, split.length-1).join('.');
            };
            this.edit_form = function ($scope) {
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                var form_div4 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control').val(this.name));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));

                form_div2.append(jQuery('<label>').text('To'));
                form_div2.append(jQuery('<input>').attr('name', 'to')
                    .attr('placeholder', 'to').addClass('form-control').val(this.to));

                var select = jQuery('<select>').attr('name', 'type').addClass('form-control');
                var that = this;
                jQuery.each($scope.relationship_factory.relationship_types(), function(i, field_type){
                    var input = jQuery('<option>').attr('val', field_type).text(field_type);
                    if(field_type==that.type){
                        input.attr('selected', 'selected');
                    }
                    select.append(input);
                });
                form_div3.append(jQuery('<label>').text('Field Type'));
                form_div3.append(select);
                form_div4.append(jQuery('<label>').text('Arguments'));
                form_div4.append(jQuery('<input>').attr('name', 'opts')
                    .attr('placeholder', 'options').addClass('form-control').val(this.args));
                return form;
            };
        }
        _this.make_relationship = function (options) {
            return new Relationship(options);
        }
    };
}
function FieldFactory() {
    return function (options) {
        var _this = this;
        _this.fields = function () {
            return {
                'django.db.models.TextField': {default_args: 'max_length=100'},
                'django.db.models.CharField': {default_args: 'max_length=30'},
                'django.contrib.contenttypes.fields.GenericForeignKey': {default_args: '\"content_type\", \"object_id\"'},
                'django_extensions.db.fields.AutoSlugField': {},
                'django.db.models.CommaSeparatedIntegerField': {},
                'django.db.models.BigAutoField': {},
                'django.db.models.BigIntegerField': {},
                'django.db.models.BooleanField': {},
                'django.db.models.DateField': {},
                'django.db.models.DateTimeField': {},
                'django.db.models.DecimalField': {default_args: 'max_digits=10, decimal_places=2'},
                'django.db.models.DurationField': {},
                'django.db.models.FileField': {default_args: 'upload_to=\"/upload/files/\"'},
                'django.db.models.ImageField': {default_args: 'upload_to=\"/upload/images/\"'},
                'django.db.models.FilePathField': {},
                'django.db.models.FloatField': {},
                'django.db.models.IntegerField': {},
                'django.db.models.PositiveIntegerField': {},
                'django.db.models.PositiveSmallIntegerField': {},
                'django.db.models.SlugField': {},
                'django.db.models.IPAddressField': {},
                'django.db.models.GenericIPAddressField': {},
                'django.db.models.NullBooleanField': {},
                'django.db.models.TimeField': {},
                'django.db.models.BinaryField': {},
                'django.db.models.AutoField': {},
                'django.db.models.SmallIntegerField': {},
                'django.db.models.URLField': {},
                'django.db.models.UUIDField': {},
                'django.db.models.EmailField': {}
            };
        };
        _this.default_field_args = function (field_type) {
            var _field = _this.fields()[field_type];
            if(_field && _field['default_args']){ return _field['default_args']}
            return '';
        };
        _this.field_types = function () {
            return Object.keys(_this.fields());
        };
        function Field(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'] || '';
            this.class_name = function () {
                return this.type.split('.').reverse()[0]
            };
            this.opts_args = function () {
                return this.opts.split(',').join(', ');
            };
            this.to_clean = function () {
                return this.to.replace(/['"]+/g, '')
            };
            this.module = function () {
                var split = this.type.split('.');
                return split.slice(0, split.length-1).join('.');
            };
            this.form_update = function (form) {
                this.name = jQuery(form).find('input[name=name]').val();
                this.type = jQuery(form).find('select[name=type]').val();
                this.opts = jQuery(form).find('input[name=opts]').val();
            };
            this.edit_form = function ($scope) {
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control').val(this.name));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));
                var select = jQuery('<select>').attr('name', 'type').addClass('form-control');
                var that = this;
                jQuery.each($scope.field_factory.field_types(), function(i, field_type){
                    var input = jQuery('<option>').attr('val', field_type).text(field_type);
                    if(field_type==that.type){
                        input.attr('selected', 'selected');
                    }
                    select.append(input);
                });
                form_div2.append(jQuery('<label>').text('Field Type'));
                form_div2.append(select);
                form_div3.append(jQuery('<label>').text('Arguments'));
                form_div3.append(jQuery('<input>').attr('name', 'opts')
                    .attr('placeholder', 'options').addClass('form-control').val(this.opts));
                return form;
            };
        }
        _this.make_field = function (options) {
            return new Field(options);
        }
    };
}
function ModelServiceFactory() {
    return function (options, $scope) {
        function Model(options) {
            this.slugify = function(text) {
                return text.toString()
                    .replace(/\s+/g, '')            // Replace spaces with _
                    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
                    .replace(/\-\-+/g, '')          // Replace multiple - with single _
                    .replace(/^-+/, '')             // Trim - from start of text
                    .replace(/-+$/, '');            // Trim - from end of text
            };
            this.set_name = function(raw_name){
                this.name = this.slugify(raw_name);
            };
            this.set_name(options['name']);
            this.fields = [];
            var fields = options['fields'] || [];
            this.fields = (options['fields'] || []).map($scope.field_factory.make_field);
            this.relationships = (options['relationships'] || []).map($scope.relationship_factory.make_relationship);
            this.relationship_names = function(){
                var that = this;
                return Object.keys(that.relationships).map(function (k) {
                    return that.relationships[k].name
                });
            };
            this.field_names = function(){
                var that = this;
                return Object.keys(that.fields).map(function (k) {
                    return that.fields[k].name
                });
            };
            this.l_name = function () {
                return this.name.toLowerCase()
            };

            this.has_relationship = function (relationship_name) {
                return this.relationship_names().indexOf(relationship_name) != -1;
            };
            this.has_field = function (field_name) {
                return this.field_names().indexOf(field_name) != -1;
            };
            this.name_field = function () {
                // TODO - find another auto_add_now_field
                if(this.field_names().indexOf('name')!=-1){
                    return 'name';
                }else{
                    return 'pk';
                }
            };
            this.ordering_field = function () {
                // TODO - find another auto_add_now_field
                if(this.field_names().indexOf('created')!=-1){
                    return 'created';
                }else{
                    return 'pk';
                }
            };
            this.identifier = function () {
                // TODO - find another name AutoSlugField
                if(this.field_names().indexOf('slug')!=-1){
                    return 'slug';
                }else{
                    return 'pk';
                }
            };
            this.render_forms = function(app_name, renderer){
                var urls = '';

                urls += 'class '+this.name+'Form(forms.ModelForm):\n';
                urls += renderer.spaces(4)+'class Meta:\n';
                urls += renderer.spaces(8)+'model = '+this.name+'\n';
                if(this.form_fields()) {
                    urls += renderer.spaces(8) + 'fields = ' + this.form_fields() + '\n';
                }
                urls += renderer.new_lines(2);

                return urls;
            };
            this.get_initial_data = function(app_name, renderer){
                var initial = '{';
                initial += renderer.new_lines(1);
                jQuery.each(this.readable_fields(), function(i, field){
                    initial += renderer.spaces(12)+'\"'+field.name+'\": \"'+field.name+'\",';
                    initial += renderer.new_lines(1);
                });
                jQuery.each(this.relationships, function(i, relationship){
                    initial += renderer.spaces(12)+'\"'+relationship.name+'\": create_'+relationship.to.toLowerCase().replace(/\./g, '_')+'().pk,';
                    initial += renderer.new_lines(1);
                });
                initial += renderer.spaces(8)+'}';
                return initial;
            };
            this.render_tests_helpers = function(app_name, renderer) {
                var test_helpers = '';
                test_helpers += 'def create_'+this.l_name()+'(**kwargs):\n';
                test_helpers += renderer.spaces(4)+'defaults = {}\n';
                jQuery.each(this.readable_fields(), function(i, field){
                    test_helpers += renderer.spaces(4) + 'defaults[\"' + field.name + '\"] = \"'+field.name+'\"\n';
                });
                test_helpers += renderer.spaces(4)+'defaults.update(**kwargs)\n';
                jQuery.each(this.relationships, function(i, relationship){
                    test_helpers += renderer.spaces(4)+'if \"'+relationship.name+'\" not in defaults:\n';
                    var helper_create = 'create_'+relationship.to.toLowerCase().replace(/\./g, '_');

                    if(renderer.built_in_models[relationship.to]){
                        helper_create = 'create_'+relationship.to.toLowerCase().replace(/\./g, '_');
                    }

                    test_helpers += renderer.spaces(8)+'defaults[\"'+relationship.name+'\"] = '+helper_create+'()\n';
                });
                test_helpers += renderer.spaces(4)+'return '+this.name+'.objects.create(**defaults)\n';
                test_helpers += renderer.new_lines(2);
                return test_helpers;
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
                tests += renderer.spaces(8)+'data = '+this.get_initial_data(app_name, renderer)+'\n';
                tests += renderer.spaces(8)+'response = self.client.post(url, data=data)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 302)\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_detail_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+this.l_name()+' = create_'+this.l_name()+'()\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_detail\', args=['+this.l_name()+'.'+this.identifier()+',])\n';
                tests += renderer.spaces(8)+'response = self.client.get(url)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 200)\n';
                tests += renderer.new_lines(1);

                tests += renderer.spaces(4)+'def test_update_'+this.l_name()+'(self):\n';
                tests += renderer.spaces(8)+this.l_name()+' = create_'+this.l_name()+'()\n';
                tests += renderer.spaces(8)+'data = '+this.get_initial_data(app_name, renderer)+'\n';
                tests += renderer.spaces(8)+'url = reverse(\''+app_name+'_'+this.l_name()+'_update\', args=['+this.l_name()+'.'+this.identifier()+',])\n';
                tests += renderer.spaces(8)+'response = self.client.post(url, data)\n';
                tests += renderer.spaces(8)+'self.assertEqual(response.status_code, 302)\n';
                tests += renderer.new_lines(2);

                return tests;
            };
            this.render_urls = function(app_name, renderer){
                var urls = '';

                urls += 'urlpatterns += (\n';
                urls += renderer.spaces(4)+'# urls for '+this.name+'\n';

                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/$\', views.'+this.name+'ListView.as_view(), name=\''+app_name+'_'+this.l_name()+'_list\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/create/$\', views.'+this.name+'CreateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_create\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/detail/(?P<'+this.identifier()+'>\\S+)/$\', views.'+this.name+'DetailView.as_view(), name=\''+app_name+'_'+this.l_name()+'_detail\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/update/(?P<'+this.identifier()+'>\\S+)/$\', views.'+this.name+'UpdateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_update\'),\n';

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
                admin_classes += renderer.spaces(8)+'fields = \'__all__\'\n';
                admin_classes += renderer.new_lines(2);

                admin_classes += 'class '+this.name+'Admin(admin.ModelAdmin):\n';
                admin_classes += renderer.spaces(4)+'form = '+this.name+'AdminForm\n';
                var admin_fields = this.admin_fields();
                if(admin_fields.length>0) {
                    admin_classes += renderer.spaces(4) + 'list_display = ' + this.admin_fields() + '\n';
                    admin_classes += renderer.spaces(4) + 'readonly_fields = ' + this.admin_read_only_fields() + '\n';
                }else{
                    admin_classes += renderer.new_lines(1);
                }
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
            this.render_model_class_header = function(app_name, renderer) {
                var cls = 'class ' + this.name + '(models.Model):';
                return cls + renderer.new_lines(2);
            };
            this.render_model_class_fields = function(app_name, renderer){
                var cls = '';
                if (this.fields.length > 0) {
                    cls += renderer.spaces(4) + "# Fields";
                    cls += renderer.new_lines(1);
                }
                jQuery.each(this.fields, function (i, field) {
                    if (renderer.pre_imported_modules_names().indexOf(field.module()) == -1) {
                        cls += renderer.spaces(4) + field.name + ' = ' + field.class_name() + '(' + field.opts + ')';
                    } else {
                        var _as = renderer.pre_imported_modules()[field.module()]['as'];
                        cls += renderer.spaces(4) + field.name + ' = ' + _as + '.' + field.class_name() + '(' + field.opts + ')';
                    }
                    cls += renderer.new_lines(1);
                });
                cls += renderer.new_lines(1);
                return cls;
            };
            this.render_model_class_relationships = function(app_name, renderer){
                var cls = '';
                if (this.relationships.length > 0) {
                    cls += renderer.spaces(4) + "# Relationship Fields";
                    cls += renderer.new_lines(1);
                }
                jQuery.each(this.relationships, function (i, relationship) {
                    var module = '\''+ app_name + '.' + relationship.to_clean() +'\'';
                    if(relationship.external_app){
                        module = '\'' + relationship.to_clean() +'\'';
                    }

                    // If the to field of the module is a built in class then use that as the relationship
                    if(relationship.to == $scope.user_model){
                        module = $scope.user_model_setting;
                    }
                    else if (renderer.built_in_models[relationship.to]) {
                        module = relationship.to_class();
                    }

                    if (renderer.pre_imported_modules_names().indexOf(relationship.module()) == -1) {
                        cls += renderer.spaces(4) + relationship.name + ' = ' + relationship.class_name() + '(' + module + ', ' + relationship.opts + ')';
                    } else {
                        var _as = renderer.pre_imported_modules()[relationship.module()]['as'];
                        cls += renderer.spaces(4) + relationship.name + ' = ' + _as + '.' + relationship.class_name() + '(' + module + ', ' + relationship.opts + ')';
                    }
                    cls += renderer.new_lines(1);
                });
                return cls;
            };
            this.render_model_class = function(app_name, renderer){
                var cls = this.render_model_class_header(app_name, renderer);
                cls += this.render_model_class_fields(app_name, renderer);
                cls += this.render_model_class_relationships(app_name, renderer);
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
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_detail\', args=(self.'+this.identifier()+',))';
                cls += renderer.new_lines(1);

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4)+'def get_update_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_update\', args=(self.'+this.identifier()+',))';
                cls += renderer.new_lines(3);

                return cls;
            };
            this.render_model_class_fields_only = function(app_name, renderer){
                var cls = '';
                cls += this.render_model_class_header(app_name, renderer);
                cls += this.render_model_class_fields(app_name, renderer);
                return cls;
            };
            this.render_model_api = function(app_name, renderer){
                var api =  'class '+this.name+'ViewSet(viewsets.ModelViewSet):'+ renderer.new_lines(1);
                api += renderer.spaces(4)+'"""ViewSet for the '+this.name+' class"""';
                api += renderer.new_lines(2);
                api += renderer.spaces(4)+'queryset = models.'+this.name+'.objects.all()'+renderer.new_lines(1);
                api += renderer.spaces(4)+'serializer_class = serializers.'+this.name+'Serializer'+ renderer.new_lines(1);
                api += renderer.spaces(4)+'permission_classes = [permissions.IsAuthenticated]'+ renderer.new_lines(1);
                api += renderer.new_lines(2);
                return api;
            };
            this.render_model_serializer = function(app_name, renderer){
                var serializer =  'class '+this.name+'Serializer(serializers.ModelSerializer):';
                serializer += renderer.new_lines(2);
                serializer += renderer.spaces(4)+'class Meta:'+renderer.new_lines(1);
                serializer += renderer.spaces(8)+'model = models.'+this.name+renderer.new_lines(1);
                serializer += renderer.spaces(8)+'fields = ('+renderer.new_lines(1);
                serializer += renderer.spaces(12)+'\''+this.identifier()+'\', '+renderer.new_lines(1);
                var model = this;
                jQuery.each(this.fields, function(i, field){
                    if(field.name != model.identifier()) {
                        serializer += renderer.spaces(12) + '\'' + field.name + '\', ' + renderer.new_lines(1);
                    }
                });
                serializer += renderer.spaces(8)+')'+renderer.new_lines(3);
                return serializer;
            };
            this._template_header = function(){
                return '{% extends "base.html" %}\n{% load static %}\n';
            };
            this._template_links = function(app_name){
                var list_url = app_name+'_'+this.l_name()+'_list';
                return '<p><a class="btn btn-default" href="{% url \''+list_url+'\' %}">'+this.name+' Listing<\/a><\/p>\n';
            };
            this._wrap_block = function(block, content){
                return '{% block '+block+' %}\n'+content+'\n{% endblock %}'
            };
            this.render_form_html = function(app_name){
                var form_html = this._template_header();
                form_html += "{% load crispy_forms_tags %}\n";
                var form = this._template_links(app_name) + '<form method="post">\n';
                form += '{% csrf_token %}\n{{form|crispy}}\n';
                form += '<button class="btn btn-primary" type="submit">Submit</button>\n';
                form += '</form>';
                form_html += this._wrap_block('content', form);
                return form_html;
            };
            this.render_list_html = function(app_name){
                var create_url = app_name+'_'+this.l_name()+'_create';
                var list_html = this._template_header();
                var table_html = this._template_links(app_name) +'<table class="table">\n';
                table_html += '<tr>\n';
                table_html += '<td>ID<\/td><td>Link<\/td>\n';
                jQuery.each(this.fields, function(i, field){
                    table_html += '    <td>'+field.name+'<\/td>\n';
                });
                table_html += '<\/tr>\n';
                table_html += '{% for object in object_list %}\n';
                table_html += '<tr>\n';
                table_html += '    <td>{{object.pk}}</td>\n';
                table_html += '    <td><a href="{{object.get_absolute_url}}">{{object}}<\/a><\/td>\n';
                jQuery.each(this.fields, function(i, field){
                    table_html += '    <td>{{ object.'+field.name+' }}<\/td>\n';
                });
                table_html += '<\/tr>\n';
                table_html += '{% endfor %}\n';
                table_html += '<\/table>';
                table_html += '<a class="btn btn-primary" href="{% url \''+create_url+'\' %}">Create new '+this.name+'<\/a>';
                list_html += this._wrap_block('content', table_html);
                return list_html;
            };
            this.render_detail_html = function (app_name) {
                var detail_html = this._template_header();
                var table_html = this._template_links(app_name) + '<table class="table">\n';
                jQuery.each(this.fields, function(i, field){
                    table_html += '<tr><td>'+field.name+'<\/td><td>{{ object.'+field.name+' }}<\/td><\/tr>\n';
                });
                table_html += '</table>';
                table_html += '\n<a class="btn btn-primary" href="{{object.get_update_url}}">Edit ' + this.name + '</a>\n';
                detail_html += this._wrap_block('content', table_html);
                return detail_html;
            };
            this.form_fields = function(){
                var readable_field_names = (this.readable_fields()).map(function (field) {
                    return field.name
                });
                var relationships = (this.relationships).map(function (relationship) {
                    return relationship.name;
                });
                var all_fields = readable_field_names.concat(relationships);
                if(all_fields.length) {
                    return '[\'' + all_fields.join('\', \'') + '\']';
                }else{
                    return '\'__all__\'';
                }
            };
            this.readable_fields = function(){
                var readable_fields = [];
                jQuery.each(this.fields, function(i, field){
                    if(field.opts.indexOf('readonly')==-1
                        && field.opts.indexOf('editable')==-1
                        && field.opts.indexOf('auto_now_add')==-1
                        && field.type != 'django.contrib.contenttypes.fields.GenericForeignKey'
                        && field.type != 'django_extensions.db.fields.AutoSlugField') {
                        readable_fields.push(field);
                    }
                });
                return readable_fields;
            };
            this.admin_fields = function(){
                if(this.field_names().length>0) {
                    return '[\'' + this.field_names().join('\', \'') + '\']'
                }else{
                    return '';
                }
            };
            this.admin_read_only_fields = function(){
                if(this.field_names().length>0) {
                    return '[\'' + this.field_names().join('\', \'') + '\']'
                }else{
                    return '';
                }
            };
        }
        return new Model(options);
    };
}
function ModelParserFactory() {
    return function ($scope) {
        function Parser() {
            this.parse = function(file, callback) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var text = reader.result;
                    var lines = text.split('\n');
                    var model_definitions = [];
                    var current_model = null;
                    var multi_line = '';

                    var model_regex = new RegExp("class\ ([a-zA-Z_]*)[\(]([a-zA-Z._]*)[\)][\:]$");
                    var field_regex = new RegExp("^([a-zA-Z0-9_]+)\ \=\ ([a-zA-Z0-9._]+)[\(](.*)[\)]$");

                    jQuery.each(lines, function (i, line) {
                        line = line.trim();
                        var model_match = model_regex.exec(line);
                        if (model_match && model_match[2].match(/model/i)) {
                            current_model = {
                                'name': model_match[1],
                                'class': model_match[2],
                                'fields': [],
                                'relationships': []
                            };
                            model_definitions.push(current_model);
                            multi_line = '';
                        }
                        var matched_content;
                        var field_match = field_regex.exec(line);
                        if(field_match){
                            matched_content=field_match;
                        }
                        var multi_line_match = field_regex.exec(multi_line);
                        if (multi_line_match) {
                            matched_content=multi_line_match;
                        }
                        if (matched_content) {
                            if (current_model && matched_content[2] && (matched_content[2].match(/field/i) || $scope.relationship_factory.relationship_match(matched_content[2]))){
                                var is_relationship_field = $scope.relationship_factory.relationship_match(matched_content[2]);
                                if(is_relationship_field) {
                                    var rel_name = matched_content[1];
                                    var rel_type = matched_content[2];
                                    var raw_opts = matched_content[3].split(',');
                                    var rel_to = raw_opts.shift();
                                    var rel_opts = raw_opts.join(",").trim();
                                    console.log('Model:', current_model.name, 'Relationship:', rel_name, rel_type, rel_to, rel_opts );
                                    current_model.relationships.push($scope.relationship_factory.make_relationship({
                                        'name': rel_name, 'type': rel_type, 'opts': rel_opts, 'to': rel_to
                                    }));
                                }else{
                                    var f_name = matched_content[1];
                                    var f_type = matched_content[2];
                                    var f_opts = matched_content[3];
                                    console.log('Model:', current_model.name, 'Field:', f_name, f_type, f_opts);
                                    current_model.fields.push($scope.field_factory.make_field({
                                        'name': f_name, 'type': f_type, 'opts': f_opts
                                    }));
                                }
                            }
                            multi_line = '';
                        }else{
                            /*
                            There is no match for this line
                            Append to multi_line to try and match
                            if we are parsing a model
                            */
                            if(current_model) {
                                multi_line = multi_line + line;
                            }
                        }

                    });
                    var new_models = [];
                    jQuery.each(model_definitions, function (i, model_definition) {
                        var model = $scope.model_factory(model_definition, $scope);
                        new_models.push(model);
                    });

                    if(callback){
                        callback(new_models);
                    }

                };
                reader.readAsText(file);
            }
        }
        return new Parser();
    }
}
function ProjectFactory() {
    return function (http) {

        var _this = this;
        _this.http = http;
        _this.settings_py = '';
        _this.urls_py = '';
        _this.wsgi_py = '';
        _this.manage_py = '';
        _this.channels_py = '';

        _this.http.get('app/partials/py/settings.py').then(function(e){_this.settings_py=e.data});
        _this.http.get('app/partials/py/manage.py').then(function(e){_this.manage_py=e.data});
        _this.http.get('app/partials/py/urls.py').then(function(e){_this.urls_py=e.data});
        _this.http.get('app/partials/py/wsgi.py').then(function(e){_this.wsgi_py=e.data});
        _this.http.get('app/partials/py/channels.py').then(function(e){_this.channels_py=e.data});

        _this.load = function(py, project_name){
          return _this.http.get(py).then(function(e){
              return _this.replace_in_template(
                  e.data, [['___PROJECT_NAME___', project_name]]
              );
          })
        }

        _this.replace_in_template = function(template, replacements){
            jQuery.each(replacements, function(i, repl){
                template = template.replace(new RegExp(repl[0], 'g'), repl[1]);
            });
            return template;
        };
        _this.render_project_requirements = function(include_channels){
            var requirements = "Django==1.10.8\n";
            requirements += "django-crispy-forms==1.6.1\n";
            requirements += "django-extensions==1.7.5\n";
            requirements += "djangorestframework==3.5.3\n";
            if(include_channels){
              requirements += "channels==1.1.8\n";
            }
            return requirements;
        };
        _this.render_project_manage_py = function(project_name){
            return _this.replace_in_template(
                _this.manage_py,
                [
                    ['___PROJECT_NAME___', project_name]
                ]
            );
        };
        _this.render_project_settings_py = function(project_name, app_name, include_channels){
            var rendered_settings_py = _this.replace_in_template(
                _this.settings_py,
                [
                    ['___PROJECT_NAME___', project_name],
                    ['___APP_NAME___', app_name]
                ]
            );
            if(include_channels){
              var rendered_channels_py = _this.replace_in_template(
                  _this.channels_py,
                  [
                      ['___PROJECT_NAME___', project_name],
                  ]
              );
              rendered_settings_py += '\n' + rendered_channels_py;
            }
            return rendered_settings_py
        };
        _this.render_project_wsgi_py = function(project_name){
            return _this.replace_in_template(
                _this.wsgi_py,
                [
                    ['___PROJECT_NAME___', project_name]
                ]
            );
        };
        _this.render_project_urls_py = function(app_name){
            return _this.replace_in_template(
                _this.urls_py,
                [
                    ['___APP_NAME___', app_name]
                ]
            );
        };
        _this.render_project_asgi_py = function(app_name){
            return _this.replace_in_template(
                _this.asgi_py,
                [
                    ['___APP_NAME___', app_name]
                ]
            );
        };
    }
}
angular.module('builder.services', [])
    .factory('ProjectFactory', [ProjectFactory])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('ModelParser', [ModelParserFactory])
    .factory('MessageService', [MessageServiceFactory])
    .factory('FieldFactory', [FieldFactory])
    .factory('RelationshipFactory', [RelationshipFactory])
    .factory('RenderFactory', [ModelRenderFactory])
    .factory('TarballFactory', [TarballFactory])
    .value('version', '0.1');
