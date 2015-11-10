'use strict';

/* Controllers */

angular.module('builder.controllers', ['LocalStorageModule'])
    .controller('ModelController', ['$scope', '$http', 'ModelFactory', 'FieldFactory', 'RelationshipFactory', 'localStorageService', 'MessageService', 'RenderFactory', 'TarballFactory',
        function ($scope, $http, model_factory, field_factory, relationship_factory, localStorageService, message_service, renderFactory, tarballFactory) {

            $ = jQuery();
            $scope.models = [];
            $scope.messageService = new message_service();
            $scope.field_factory = new field_factory();
            $scope.relationship_factory = new relationship_factory();
            $scope.render_factory = new renderFactory();
            $scope.editors = [];
            $scope.models_storage_key = 'local_models';
            $scope._app_name = 'app_name';

            $scope.create_tar_ball_url = function(){
                var README = 'Built with django_builder\n';
                var __init__ = '#';
                var models = $scope.render_factory.render_models_py($scope.app_name(), $scope.models);
                var views = $scope.render_factory.render_views_py($scope.app_name(), $scope.models);
                var admin = $scope.render_factory.render_admin_py($scope.app_name(), $scope.models);
                var urls = $scope.render_factory.render_urls_py($scope.app_name(), $scope.models);
                var tests = $scope.render_factory.render_tests_py($scope.app_name(), $scope.models);
                var forms = $scope.render_factory.render_forms_py($scope.app_name(), $scope.models);
                var api = $scope.render_factory.render_django_rest_framework_api_py($scope.app_name(), $scope.models);
                var serializers = $scope.render_factory.render_django_rest_framework_serializers_py($scope.app_name(), $scope.models);

                var templates = $scope.render_factory.render_templates_html($scope.app_name(), $scope.models);

                var tarfile = new tarballFactory();

                tarfile.append('README.txt', README);
                tarfile.append($scope.app_name()+'/__init__.py', __init__);
                tarfile.append($scope.app_name()+'/models.py', models);
                tarfile.append($scope.app_name()+'/views.py', views);
                tarfile.append($scope.app_name()+'/admin.py', admin);
                tarfile.append($scope.app_name()+'/urls.py', urls);
                tarfile.append($scope.app_name()+'/tests.py', tests);
                tarfile.append($scope.app_name()+'/forms.py', forms);
                tarfile.append($scope.app_name()+'/api.py', api);
                tarfile.append($scope.app_name()+'/serializers.py', serializers);
                tarfile.append($scope.app_name()+'/templates/base.html', $scope.render_factory.render_base_html($scope.app_name(), $scope.models));

                jQuery.each(templates, function(i, template){
                    tarfile.append($scope.app_name()+'/templates/'+$scope.app_name()+'/'+template[0], template[1]);
                });

                return tarfile.get_url();
            };

            $scope.create_tar_ball = function(){
                var download_iframe = document.getElementById("download_iframe");
                download_iframe.src = $scope.create_tar_ball_url();
                $scope.messageService.simple_info(
                    'Download info',
                    "Chrome can block downloads of the generated tarball, " +
                    "if this happens navigate to the <strong>Downloads<\/strong> section of chrome to accept the download." +
                    "<br>Window -> Downloads").modal('show');
            };

            $scope.aceLoad = function(_editor) {
                var _id = jQuery(_editor.container).attr("id");
                if(_id=="builder_models") {
                    _editor.setValue($scope.render_factory.render_models_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_views"){
                    _editor.setValue($scope.render_factory.render_views_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_admin"){
                    _editor.setValue($scope.render_factory.render_admin_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_urls"){
                    _editor.setValue($scope.render_factory.render_urls_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_tests"){
                    _editor.setValue($scope.render_factory.render_tests_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_forms"){
                    _editor.setValue($scope.render_factory.render_forms_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_django_rest_framework_api"){
                    _editor.setValue($scope.render_factory.render_django_rest_framework_api_py($scope.app_name(), $scope.models));
                }else if(_id=="builder_django_rest_framework_serializers"){
                    _editor.setValue($scope.render_factory.render_django_rest_framework_serializers_py($scope.app_name(), $scope.models));
                }
                _editor.session.selection.clearSelection();
            };

            $scope.reLoadAce = function() {
                Object.keys($scope.editors).map(function (k) {
                    $scope.aceLoad($scope.editors[k]);
                });
            };

            $scope.aceLoaded = function(_editor) {
                // Options
                _editor.setOptions({
                    readOnly: true,
                    highlightActiveLine: false,
                    highlightGutterLine: false,
                    maxLines: Infinity
                });
                _editor.renderer.$cursorLayer.element.style.opacity=0;
                $scope.aceLoad(_editor);
                $scope.editors.push(_editor);
            };

            $scope.$watch("[models,_app_name]", function() {
                $scope.reLoadAce();
                $scope.saveApp();
            }, true);

            $scope.aceChanged = function(e) {
                // console.log('aceChanged');
            };

            $scope.do_set_app_name = function (app_name) {
                $scope._app_name = app_name
            };
            $scope.set_app_name = function () {
                $scope.do_set_app_name(jQuery('input#appname').val());
                $scope.reLoadAce();
            };

            $scope.l_app_name = function () {
                return $scope._app_name.toLowerCase();
            };

            $scope.app_name = function () {
                return $scope._app_name.replace(' ', '_');
            };

            $scope.updateModel = function(model){
                var ind = $scope.models.indexOf(model);
                $scope.models[ind] = model;
                $scope.$apply();
            };

            $scope.serializeApp = function(){
                var config = {
                    'models': $scope.models,
                    'app_config': {
                        'app_name': $scope._app_name
                    }
                };
                return JSON.stringify(config);
            };

            $scope.saveApp = function(){
                localStorageService.set($scope.models_storage_key, $scope.serializeApp());
            };
            $scope.doClearModels = function () {
                localStorageService.set($scope.models_storage_key, '');
                $scope.loadModels();
                $scope.models = [];
                $scope.$apply();
            };

            $scope.clearModels = function () {
                var on_confirm = function () {
                    $scope.doClearModels();
                };
                return $scope.messageService.simple_confirm('Confirm', "Remove all models?", on_confirm).modal('show');
            };

            $scope.model_count = function() {
                return $scope.models.length;
            };

            $scope.add_model = function (model_name) {
                var model_opts = {"name": model_name};
                model_opts.fields = [
                    $scope.field_factory.make_field({
                        'name': 'name',
                        'type': 'django.db.models.CharField',
                        'opts': 'max_length=255'
                    }),
                    $scope.field_factory.make_field({
                        'name': 'slug',
                        'type': 'django_extensions.db.fields.AutoSlugField',
                        'opts': 'populate_from=\'name\', blank=True'
                    }),
                    $scope.field_factory.make_field({
                        'name': 'created',
                        'type': 'django.db.models.DateTimeField',
                        'opts': 'auto_now_add=True, editable=False'
                    }),
                    $scope.field_factory.make_field({
                        'name': 'last_updated',
                        'type': 'django.db.models.DateTimeField',
                        'opts': 'auto_now=True, editable=False'
                    })
                ];
                var model = model_factory(model_opts, $scope);
                $scope.models.push(model);
                $scope.saveApp();
                $scope.$apply();
            };
            $scope.existingModel = function (name) {
                var exists = false;
                jQuery.each($scope.models, function (i, model) {
                    if(name==model.name){
                        exists = true;
                    }
                });
                return exists;
            };
            $scope.addModel = function () {
                var add_model_callback = function(model_name){
                    if (model_name == undefined || model_name === '') {
                        $scope.messageService.simple_info('Model Name Required', "Enter a Model name").modal('show');
                    } else {
                        if($scope.existingModel(model_name)) {
                            $scope.messageService.simple_error('Error with Model Name', "There is already a model with the name "+model_name).modal('show');
                        }else{
                            $scope.add_model(model_name);
                        }
                    }
                };
                $scope.messageService.simple_input(
                    'Model Name Required', "Enter a Model name",
                    "Model1", add_model_callback, true).modal('show');
            };
            $scope.cleanModel = function(model){
                delete model['$$hashKey'];
                if(model.fields!=undefined) {
                    jQuery.each(model.fields, function (i, field) {
                        delete field['$$hashKey'];
                    });
                }
                if(model.relationships!=undefined) {
                    jQuery.each(model.relationships, function (i, relationship) {
                        delete relationship['$$hashKey'];
                    });
                }
            };

            $scope.loadModels = function(){
                var loaded_app = localStorageService.get($scope.models_storage_key) || {'models': [], 'app_config': {'app_name': 'app_name'}};
                if(typeof loaded_app == "string"){loaded_app = JSON.parse(loaded_app);}
                var loaded_models = loaded_app["models"] || [];
                var loaded_app_config = loaded_app['app_config'] || { 'app_name': 'app_name'};
                $scope._app_name = loaded_app_config['app_name'];
                jQuery.each(loaded_models, function(i, model){
                    $scope.cleanModel(model);
                });
                return loaded_models;
            };

            $scope.loadModel = function(model_opts){
                var model = model_factory(model_opts, $scope);
                $scope.models.push(model);
            };

            $scope.__init__ = function() {
                jQuery.each($scope.loadModels(), function (i, model_opts) {
                    $scope.loadModel(model_opts);
                });
            };

            $scope.__init__();

            $scope.debug = function(){
                //console.log(JSON.stringify($scope.serializeApp()));
            };
            $scope.rename_model = function(index){
                var model = $scope.models[index];
                console.log('rename', index);
                var rename_model_callback = function(new_model_name){
                    if (new_model_name == undefined || new_model_name === '') {
                        $scope.messageService.simple_info('Model Name Required', "Enter a Model name").modal('show');
                    } else {
                        if($scope.existingModel(new_model_name)) {
                            $scope.messageService.simple_error('Error with Model Name', "There is already a model with the name "+new_model_name).modal('show');
                        }else{
                            model.set_name(new_model_name);
                            $scope.updateModel(model);
                            $scope.$apply();
                        }
                    }
                };
                $scope.messageService.simple_input('Rename model', "Enter a new Model name", model.name, rename_model_callback, true).modal('show');
            };
            $scope.add_relationship = function (index) {
                var model = $scope.models[index];
                var on_input= function(output_form){
                    var name = output_form.find('input[name=name]').val();
                    if(name===undefined||name==='') {
                        output_form.find('div.form-group-name')
                            .addClass('has-error')
                            .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                            .find('.help-block').removeClass('hide').text('Field Required');
                    }else {
                        if(model.has_relationship(name)){
                            output_form.find('div.form-group-name')
                                .addClass('has-error')
                                .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                                .find('.help-block').removeClass('hide').text('Field \"'+name+'\" exists');
                        }else {
                            var type = output_form.find('select[name=type]').val();
                            var opts = output_form.find('input[name=opts]').val();
                            var to = output_form.find('select[name=to]').val();
                            var relationship = $scope.relationship_factory.make_relationship({
                                'name': name,
                                'type': type,
                                'opts': opts,
                                'to': to
                            });
                            model.relationships.push(relationship);
                            $scope.updateModel(model);
                            $scope.$apply();
                            jQuery('.modal').modal('hide');
                        }
                    }
                };
                // TODO make form factory
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control'));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));

                var to_select = jQuery('<select>').attr('name', 'to').addClass('form-control');

                jQuery.each($scope.models, function(i, model){
                    to_select.append(jQuery('<option>').attr('val', model.name).text(model.name));
                });

                form_div2.append(jQuery('<label>').text('Relationship to Model'));
                form_div2.append(to_select);

                var type_select = jQuery('<select>').attr('name', 'type').addClass('form-control');

                jQuery.each($scope.relationship_factory.relationship_types(), function(i, relationship_type){
                    type_select.append(jQuery('<option>').attr('val', relationship_type).text(relationship_type));
                });

                form_div2.append(jQuery('<label>').text('Relationship Type'));
                form_div2.append(type_select);
                form_div3.append(jQuery('<label>').text('Arguments'));
                form_div3.append(jQuery('<input>').attr('name', 'opts').attr('placeholder', 'options').addClass('form-control'));
                var identifier = 'add_rel_'+model['name']+'_'+index;
                $scope.messageService.simple_form_no_dismiss('Add Relationship', '', form, on_input).modal('show')
                    .attr('id', identifier).appendTo('body');
                return identifier;

            };
            $scope.add_field = function (index) {
                var model = $scope.models[index];
                var on_input= function(output_form){
                    var name = output_form.find('input[name=name]').val();
                    if(name===undefined||name==='') {
                        output_form.find('div.form-group-name')
                            .addClass('has-error')
                            .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                            .find('.help-block').removeClass('hide').text('Field Required');
                    }else {
                        if(model.has_field(name)){
                            output_form.find('div.form-group-name')
                                .addClass('has-error')
                                .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                                .find('.help-block').removeClass('hide').text('Field \"'+name+'\" exists');
                        }else {
                            var type = output_form.find('select[name=type]').val();
                            var opts = output_form.find('input[name=opts]').val();
                            var field = $scope.field_factory.make_field({
                                'name': name,
                                'type': type,
                                'opts': opts
                            });
                            model.fields.push(field);
                            $scope.updateModel(model);
                            $scope.$apply();
                            jQuery('.modal').modal('hide');
                        }
                    }
                };
                // TODO make form factory
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name  has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control'));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));

                var select = jQuery('<select>').attr('name', 'type').addClass('form-control');

                jQuery.each($scope.field_factory.field_types(), function(i, field_type){
                    select.append(jQuery('<option>').attr('val', field_type).text(field_type));
                });

                var options =  jQuery('<input>').attr('name', 'opts').attr('placeholder', 'options').addClass('form-control');

                form_div2.append(jQuery('<label>').text('Field Type'));
                form_div2.append(select);
                form_div3.append(jQuery('<label>').text('Arguments'));
                form_div3.append(options);

                select.change(function(){
                    options.val($scope.field_factory.default_field_args(select.val()));
                });
                options.val($scope.field_factory.default_field_args(select.val()));

                var identifier = 'add_field_'+model['name']+'_'+index;
                $scope.messageService.simple_form_no_dismiss('Add Field', '', form, on_input).modal('show')
                    .attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.edit_relationship = function (model_index, relationship_index) {
                var relationship = $scope.models[model_index].relationships[relationship_index];
                var on_confirm = function(form){
                    relationship.form_update(form);
                    $scope.$apply();
                };
                var identifier = relationship['$$hashKey'] || 'edit_relationship_'+relationship.name;
                $scope.messageService.simple_form("Edit Relationship '" + relationship.name+"'",
                    "", relationship.edit_form($scope),
                    on_confirm).modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.edit_field = function (model_index, field_index) {
                var field = $scope.models[model_index].fields[field_index];
                var on_confirm = function(form){
                    field.form_update(form);
                    $scope.$apply();
                };
                var identifier = field['$$hashKey'] || 'edit_field_'+field.name;
                $scope.messageService.simple_form("Edit field '" + field.name+"'",
                    "", field.edit_form($scope),
                    on_confirm).modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.remove_relationship = function (model_index, relationship_index) {
                var on_confirm = function(){
                    $scope.models[model_index].relationships.splice(relationship_index, 1);
                    $scope.$apply();
                };
                var relationship = $scope.models[model_index].relationships[relationship_index];
                var identifier = relationship['$$hashKey'] || 'remove_relationship_'+relationship.name;
                $scope.messageService.simple_confirm('Confirm',
                        "Remove the relationship '" + relationship.name+"'",
                    on_confirm).modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.remove_field = function (model_index, field_index) {
                var on_confirm = function(){
                    $scope.models[model_index].fields.splice(field_index, 1);
                    $scope.$apply();
                };
                var field = $scope.models[model_index].fields[field_index];
                var identifier = field['$$hashKey'] || 'remove_field_'+field.name;
                $scope.messageService.simple_confirm('Confirm',
                        "Remove the field '" + field.name+"'",
                    on_confirm).modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };

            $scope.remove_model = function (index) {
                var on_confirm = function(){
                    $scope.models.splice(index, 1);
                    $scope.$apply();
                };
                var model = $scope.models[index];
                var identifier = model['$$hashKey'] || 'remove_model_'+model.name;
                $scope.messageService.simple_confirm('Confirm',
                        "Remove the model '" + model.name +"'",
                    on_confirm).modal('show').modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.model_highlight = function (model_index, relationship_index) {
                var r = $scope.models[model_index].relationships[relationship_index];
                jQuery('.builder_model_'+ r.to).addClass('builder_model_highlight');
            };
            $scope.model_unhighlight = function () {
                jQuery('.builder_model').removeClass('builder_model_highlight');
            };
        }]
);
