'use strict';

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
    return function () {
        var _this = this;
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
            all_output+=_this.render_templates_html(app_name, models);
            return all_output;
        }
        _this.render_base_html = function(app_name, models){
            return '<html><head></head><body>{% block content %}Replace this.{% endblock %}</body>';
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
            tests_py += _this.new_lines(2);

            jQuery.each(models, function(i, model){
                tests_py += model.render_tests_helpers(app_name, _this);
            });

            jQuery.each(models, function(i, model){
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
            urls_py += 'urlpatterns = patterns(\'\')\n';
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
            var models_py =  'from django.db import models\n'+
                   'from django.core.urlresolvers import reverse\n';

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
                models_py += 'from '+field.module()+' import '+field.class_name()+'\n';
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
                templates.push([model.l_name()+'_form.html', model.render_form_html()]);
                templates.push([model.l_name()+'_detail.html', model.render_detail_html()]);
                templates.push([model.l_name()+'_list.html', model.render_list_html()]);
            });

            return templates;
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
            var modal_header_inner = jQuery('<h4>').addClass("modal-header-inner");
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
        _this.simple_input = function (title, message, callback, required) {
            var _callback = callback || jQuery.noop;
            var _required = required || false;
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            var label = jQuery('<label>').text(message);
            var input = jQuery('<input>').attr('type', 'text').attr('name', 'input').addClass('form-control');
            var input_help = jQuery('<span>').text('error message').addClass('help-block hide');
            var input_group = jQuery('<div>').addClass('form-group form-group-input has-feedback').append(label).append(input).append(input_help);
            var input_form = jQuery('<form>').append(input_group);
            simple_confirm.find(".modal-body").empty().append(input_form);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                var _input = input.val();
                if(_required && (_input=='' || input==undefined)){
                    input_group.addClass('has-error')
                        .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                        .find('.help-block').removeClass('hide').text('Field Required');
                }else{
                    simple_confirm.modal('hide');
                    _callback(_input);
                }
            });
            cancel_button.attr("data-dismiss", "modal");
            if(!_required){confirm_button.attr("data-dismiss", "modal");}
            simple_confirm.modal();
            return simple_confirm;
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
        function Relationship(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'];
            this.to = options['to'];
            this.class_name = function () {
                return this.type.split('.').reverse()[0]
            };
            this.form_update = function (form) {
                this.name = jQuery(form).find('input[name=name]').val();
                this.type = jQuery(form).find('select[name=type]').val();
                this.opts = jQuery(form).find('input[name=opts]').val();
                this.to = jQuery(form).find('input[name=to]').val();
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
                'django_extensions.db.fields.AutoSlugField': {},
                'django.db.models.BooleanField': {},
                'django.db.models.DateField': {},
                'django.db.models.DateTimeField': {},
                'django.db.models.DecimalField': {default_args: 'max_digits=10, decimal_places=2'},
                'django.db.models.FilePathField': {},
                'django.db.models.FloatField': {},
                'django.db.models.IntegerField': {},
                'django.db.models.IPAddressField': {},
                'django.db.models.GenericIPAddressField': {},
                'django.db.models.NullBooleanField': {},
                'django.db.models.TimeField': {},
                'django.db.models.BinaryField': {},
                'django.db.models.AutoField': {}
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
            this.name = options['name'];
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
            this.identifier = function () {
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
            this.get_initial_data = function(app_name, renderer){
                var initial = '{';
                initial += renderer.new_lines(1);
                jQuery.each(this.readable_fields(), function(i, field){
                    initial += renderer.spaces(12)+'\"'+field.name+'\": \"'+field.name+'\",';
                    initial += renderer.new_lines(1);
                });
                jQuery.each(this.relationships, function(i, relationship){
                    initial += renderer.spaces(12)+'\"'+relationship.name+'\": create_'+relationship.to.toLowerCase()+'().id,';
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
                    test_helpers += renderer.spaces(8)+'defaults[\"'+relationship.name+'\"] = create_'+relationship.to.toLowerCase()+'()\n';
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

                urls += 'urlpatterns += patterns(\'\',\n';
                urls += renderer.spaces(4)+'# urls for '+this.name+'\n';

                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/$\', '+this.name+'ListView.as_view(), name=\''+app_name+'_'+this.l_name()+'_list\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/create/$\', '+this.name+'CreateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_create\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/detail/(?P<'+this.identifier()+'>\\S+)/$\', '+this.name+'DetailView.as_view(), name=\''+app_name+'_'+this.l_name()+'_detail\'),\n';
                urls += renderer.spaces(4)+'url(r\'^'+app_name+'/'+this.l_name()+'/update/(?P<'+this.identifier()+'>\\S+)/$\', '+this.name+'UpdateView.as_view(), name=\''+app_name+'_'+this.l_name()+'_update\'),\n';

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
                cls += renderer.new_lines(2);
                if(this.fields.length>0) {
                    cls += renderer.spaces(4) + "# Fields";
                    cls += renderer.new_lines(1);
                }
                jQuery.each(this.fields, function(i, field){
                    cls += renderer.spaces(4)+field.name+' = '+field.class_name()+'('+field.opts+')';
                    cls += renderer.new_lines(1);
                });
                cls += renderer.new_lines(1);
                if(this.relationships.length>0) {
                    cls += renderer.spaces(4) + "# Relationship Fields";
                    cls += renderer.new_lines(1);
                }
                jQuery.each(this.relationships, function(i, relationship){
                    cls += renderer.spaces(4)+relationship.name+' = '+relationship.class_name()+'(\''+app_name+'.'+relationship.to+'\','+relationship.opts+')';
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
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_detail\', args=(self.'+this.identifier()+',))';
                cls += renderer.new_lines(1);

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4)+'def get_update_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8)+'return reverse(\''+app_name+'_'+this.l_name()+'_update\', args=(self.'+this.identifier()+',))';
                cls += renderer.new_lines(3);

                return cls;
            };
            this._template_header = function(){
                return  '{% extends "base.html" %}\n';
            };
            this._wrap_block = function(block, content){
                return '{% block '+block+' %}\n'+content+'\n{% endblock %}'
            };
            this.render_form_html = function(){
                var form_html = this._template_header();
                form_html += this._wrap_block('content', '{{form}}');
                return form_html;
            };
            this.render_list_html = function(){
                var list_html = this._template_header();
                var ul_html = '<ul>\n';
                ul_html += '{% for object in object_list %}\n';
                ul_html += '<li>{{object}}<\/li>\n';
                ul_html += '{% endfor %}\n';
                ul_html += '</ul>';
                list_html += this._wrap_block('content', ul_html);
                return list_html;

            };
            this.render_detail_html = function () {
                var detail_html = this._template_header();
                var table_html = '<table>';
                jQuery.each(this.fields, function(i, field){
                    table_html += '<tr><td>'+field.name+'<\/td><td>{{ object.'+field.name+' }}<\/td><\/tr>\n';
                });
                table_html += '<\/table>';
                detail_html += this._wrap_block('content', table_html);
                detail_html += '\n<a href="{{object.get_update_url}}">Edit ' + this.name + '</a>\n';
                return detail_html;
            };
            this.form_fields = function(){
                var readable_field_names = (this.readable_fields()).map(function(field){return field.name});
                var relationships = (this.relationships).map(function(relationship){return relationship.to.toLowerCase()});
                var all_fields = readable_field_names.concat(relationships);
                return '[\''+all_fields.join('\', \'')+'\']'
            };
            this.readable_fields = function(){
                var readable_fields = [];
                jQuery.each(this.fields, function(i, field){
                    if(field.opts.indexOf('readonly')==-1 && field.opts.indexOf('editable')==-1) {
                        readable_fields.push(field);
                    }
                });
                return readable_fields;
            };
            this.admin_fields = function(){
                return '[\''+this.field_names().join('\', \'')+'\']'
            };
            this.admin_read_only_fields = function(){
                return '[\''+this.field_names().join('\', \'')+'\']'
            };
        }
        return new Model(options);
    };
}

angular.module('builder.services', [])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('MessageService', [MessageServiceFactory])
    .factory('FieldFactory', [FieldFactory])
    .factory('RelationshipFactory', [RelationshipFactory])
    .factory('RenderFactory', [ModelRenderFactory])
    .factory('TarballFactory', [TarballFactory])
    .value('version', '0.1');
