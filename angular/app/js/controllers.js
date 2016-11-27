'use strict';

/* Controllers */

angular.module('builder.controllers', ['LocalStorageModule'])
    .controller('ModelController', ['$scope', '$http', 'ModelFactory', 'ModelParser', 'FieldFactory', 'RelationshipFactory', 'localStorageService', 'MessageService', 'RenderFactory', 'TarballFactory',
        function ($scope, $http, model_factory, ModelParser, field_factory, relationship_factory, localStorageService, message_service, renderFactory, tarballFactory) {
            $scope.models = [];
            $scope.new_models = [];
            $scope.user_model = 'django.contrib.auth.models.User';
            $scope.user_model_setting = 'settings.AUTH_USER_MODEL';
            $scope.built_in_models = {
                'django.contrib.auth.models.User': {
                    fields: {
                        'username': {default:'username'},
                        'email': {default:'username@tempurl.com'}
                    }
                },
                'django.contrib.auth.models.Group': {
                    fields: {
                        'name': {default:'group'}
                    }
                },
                'django.contrib.contenttypes.models.ContentType': {
                    fields: {}
                }
            };
            $scope.messageService = new message_service();
            $scope.field_factory = new field_factory();
            $scope.model_factory = model_factory;
            $scope.relationship_factory = new relationship_factory();
            $scope.render_factory = new renderFactory($scope.built_in_models);
            $scope.editors = [];
            $scope.models_storage_key = 'local_models';
            $scope._app_name = 'app_name';
            $scope._project_name = 'project_name';

            $scope.create_tar_ball_url = function(include_project){
                var README = 'Built with django_builder\n';
                var __init__ = '#';

                const project_name = $scope.project_name();
                const app_name = $scope.app_name();

                var models = $scope.render_factory.render_models_py(app_name, $scope.models);
                var views = $scope.render_factory.render_views_py(app_name, $scope.models);
                var admin = $scope.render_factory.render_admin_py(app_name, $scope.models);
                var urls = $scope.render_factory.render_urls_py(app_name, $scope.models);
                var tests = $scope.render_factory.render_tests_py(app_name, $scope.models);
                var forms = $scope.render_factory.render_forms_py(app_name, $scope.models);
                var api = $scope.render_factory.render_django_rest_framework_api_py(app_name, $scope.models);
                var serializers = $scope.render_factory.render_django_rest_framework_serializers_py(app_name, $scope.models);

                var templates = $scope.render_factory.render_templates_html(app_name, $scope.models);

                var tarfile = new tarballFactory();
                
                var root_folder = app_name;
                if(include_project){
                    root_folder = project_name+'/'+app_name
                }

                if(include_project) {
                    var project_settings = $scope.render_factory.render_project_settings_py(project_name);
                    var project_urls = $scope.render_factory.render_project_urls_py(project_name);
                    var project_manage = $scope.render_factory.render_project_urls_py(project_name);
                    var project_wsgi = $scope.render_factory.render_project_wsgi_py(project_name);

                    tarfile.append(project_name + '/manage.py', project_manage);
                    tarfile.append(project_name + '/' + project_name + '/settings.py', project_settings);
                    tarfile.append(project_name + '/' + project_name + '/urls.py', project_urls);
                    tarfile.append(project_name + '/' + project_name + '/wsgi.py', project_wsgi);
                    tarfile.append(project_name + '/' + project_name + '/__init__.py', __init__);
                }

                tarfile.append(root_folder+'/README.txt', README);
                tarfile.append(root_folder+'/__init__.py', __init__);
                tarfile.append(root_folder+'/models.py', models);
                tarfile.append(root_folder+'/views.py', views);
                tarfile.append(root_folder+'/admin.py', admin);
                tarfile.append(root_folder+'/urls.py', urls);
                tarfile.append(root_folder+'/tests.py', tests);
                tarfile.append(root_folder+'/forms.py', forms);
                tarfile.append(root_folder+'/api.py', api);
                tarfile.append(root_folder+'/serializers.py', serializers);
                tarfile.append(root_folder+'/templates/base.html', $scope.render_factory.render_base_html(app_name, $scope.models));

                jQuery.each(templates, function(i, template){
                    tarfile.append(root_folder+'/templates/'+app_name+'/'+template[0], template[1]);
                });

                return tarfile.get_url();
            };
            $scope.create_download_modal_app = function(){
                var download_url = $scope.create_tar_ball_url(false);
                var filename = $scope.app_name() + '.tar';
                return $scope.create_download_modal(download_url, filename)
            };
            $scope.create_download_modal_project = function(){
                var download_url = $scope.create_tar_ball_url(true);
                var filename = $scope.project_name() + '.tar';

                var extra_message = jQuery('<p>');
                extra_message.text('The project download includes the following files:');
                var extra_ul = jQuery('<div>').addClass('well well-sm');
                extra_ul.append(jQuery("<p>").text('manage.py'));
                extra_ul.append(jQuery("<p>").text($scope.project_name()+'/settings.py'));
                extra_ul.append(jQuery("<p>").text($scope.project_name()+'/urls.py'));
                extra_ul.append(jQuery("<p>").text($scope.project_name()+'/wsgi.py'));
                extra_message.append(jQuery("<br><br>"))
                extra_message.append(extra_ul)

                return $scope.create_download_modal(download_url, filename, extra_message)
            };
            $scope.create_download_modal = function(download_url, filename, extra_message){

                var download_a = jQuery('<a>').attr('href', download_url).attr('id', 'django_builder_download_a');
                download_a.addClass('btn btn-success btn-lg').css('text-transform', 'none');
                download_a.text('Click here to download '+ filename);
                download_a.attr('download', filename);

                var download_button = jQuery('<div>').addClass('text-center').append(download_a);
                var download_message = jQuery('<div>');
                download_message.append(jQuery("<br>"));
                download_message.append("Chrome can block downloads of the generated tarball, if this happens navigate to the ");
                download_message.append(jQuery('<strong>').text('Downloads'));
                download_message.append(" section of chrome to accept the download")
                download_message.append(jQuery("<br>"));
                download_message.append("Window -> Downloads");

                var download_div = jQuery('<div>');
                if(extra_message!=undefined){
                    download_div.append(extra_message)
                }
                download_div.append(download_button)
                download_div.append(download_message)

                var identifier = 'django_builder_download_modal';
                $scope.messageService.simple_info('Download info', download_div).modal('show').attr('id', identifier);
                return identifier;
            };
            $scope.render_model_class_fields_only = function (model) {
                return model.render_model_class_fields_only($scope._app_name, $scope.render_factory);
            };
            $scope.upload_input = function(){
                return jQuery('<input type="file" />');
            };
            $scope.upload_drop_target = function(input){
                var dnd = jQuery('<div>').addClass("builder_dnd_target text-center");
                var icon = jQuery('<i>').addClass("fa fa-upload fa-4x builder_dnd_icon");
                dnd.append(jQuery("<div>").text("Drag and Drop files here!"));
                dnd.append(icon)
                return dnd;
            };
            $scope.upload_form = function(input, dnd){
                var form = jQuery('<form>');
                var input_holder = jQuery('<span>').addClass("btn btn-default btn-file center-block builder_upload_models_py");
                input_holder.append("Browse");
                input_holder.append(input);
                form.append(input_holder);
                form.append(dnd);
                return form;
            };
            $scope.save_new_models = function(models){
                $scope.new_models = [];
                $scope.models = models;
                $scope.saveApp();
                $scope.$apply();
            },
            $scope.merge_models = function() {
                var merged_models = $scope.models.concat($scope.new_models);
                for(var i=0; i<merged_models.length; ++i) {
                    for(var j=i+1; j<merged_models.length; ++j) {
                        if(merged_models[i].name === merged_models[j].name) {
                            merged_models.splice(j--, 1);
                        }
                    }
                }
                return $scope.save_new_models(merged_models);
            },
            $scope.add_unique = function(){
                jQuery.each($scope.new_models, function (i, new_model) {
                    if(!$scope.existingModel(new_model.name)) {
                        $scope.models.push(new_model);
                    }
                });
                $scope.save_new_models($scope.models);
            },
            $scope.add_new_models = function(new_models){
                $scope.new_models = new_models;
                $scope.$apply();

                var add = function(){
                    console.log('Adding all models');
                    $scope.merge_models();
                }

                var overwrite_existing = function(){
                    console.log('Overwriting existing models');
                    $scope.merge_models();
                }

                var on_confirm = function () {
                    var are_duplicates = false;
                    var duplicates = [];

                    var duplicate_warning = jQuery('<p>').text('The following models are duplicates:');
                    jQuery.each($scope.new_models, function (i, new_model) {
                        if($scope.existingModel(new_model.name)){
                            are_duplicates = true;
                            duplicates.push(new_model);
                            duplicate_warning.append(jQuery('<div>').text(new_model.name));
                        };
                    });

                    var all_duplicates = duplicates.length == $scope.new_models.length;
                    if(are_duplicates){
                        var choices = [{text: 'Overwrite existing models', callback: overwrite_existing}]
                        if(!all_duplicates){
                            choices.push({text: 'Add unique', callback: $scope.add_unique})
                        }
                        choices.push({text: 'Cancel', callback: function(){}})
                        var duplicate_models_id = 'duplicate_models'
                        $scope.messageService.simple_choice(
                            'Add duplicate models?', duplicate_warning, choices
                        ).modal('show').attr('id', duplicate_models_id);
                    }else{
                        $scope.merge_models();
                    }
                };

                var model_rep = jQuery("<div>");

                jQuery.each($scope.new_models, function (i, new_model) {
                    model_rep.append(jQuery("<hr>"));
                    model_rep.append(jQuery("<pre>").html(new_model.render_model_class_fields_only($scope._app_name, $scope.render_factory)));
                    var remove_button = jQuery('<button class="btn btn-danger pull-right">').text('Remove');
                    model_rep.append(remove_button);
                    model_rep.append(jQuery("<div>").addClass('clearfix'));
                });

                var add_new_models_id = 'add_new_models'
                $scope.messageService.simple_confirm(
                    'Add the following models?', jQuery("#builder_new_models"), on_confirm
                ).modal('show').find('.modal-dialog').css('width', '50%').attr('id', add_new_models_id);
                return add_new_models_id;
            };

            $scope.process_models_py = function(files){
                if(files.length==0) {
                    $scope.messageService.simple_error('Sorry', "You didn't seem to choose any files.").modal('show');
                } else if(files.length>1){
                    $scope.messageService.simple_error('Sorry', "Multiple files not yet supported, please choose a single file.").modal('show');
                }else {
                    var parser = ModelParser($scope);
                    parser.parse(files[0], function(models){
                        $scope.add_new_models(models);
                    });
                }
            };
            $scope.upload_models_py = function(){
                var input =  $scope.upload_input();
                var drop_target = $scope.upload_drop_target();
                var form = $scope.upload_form(input, drop_target);

                var modal = $scope.messageService.simple_form(
                    'Upload models.py', 'Choose a models.py file to analyse',
                    form, function(){
                        $scope.process_models_py(jQuery(input)[0].files);
                        modal.modal('hide');
                    }
                ).modal('show');

                input.change(function(){
                    $scope.process_models_py(jQuery(input)[0].files);
                    modal.modal('hide');
                });

                form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }).on('dragover dragenter', function() {
                    drop_target.addClass('is-drag-over');
                }).on('dragleave dragend drop', function() {
                    drop_target.removeClass('is-drag-over');
                }).on('drop', function(e) {
                    var droppedFiles = e.originalEvent.dataTransfer.files;
                    modal.modal('hide');
                    $scope.process_models_py(droppedFiles);
                });
            };

             jQuery('html body').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                 // pass
            }).on('dragover dragenter', function() {
                // pass
            }).on('drop', function(e) {
                // pass
            });

            jQuery('#builder_models_content').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            }).on('dragover dragenter', function() {
                jQuery(".builder_dnd_target").addClass("is-drag-over")
            }).on('drop', function(e) {
                jQuery(".builder_dnd_target").removeClass("is-drag-over")
                var droppedFiles = e.originalEvent.dataTransfer.files;
                $scope.process_models_py(droppedFiles);
            });

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
            $scope.do_set_project_name = function (project_name) {
                $scope._project_name = project_name
            };
            $scope.set_project_name = function () {
                $scope.do_set_project_name(jQuery('input#projectname').val());
                $scope.reLoadAce();
            };
            $scope.l_app_name = function () {
                return $scope._app_name.toLowerCase();
            };

            $scope.app_name = function () {
                return $scope._app_name.replace(new RegExp(' ', 'g'), '_');
            };

            $scope.project_name = function () {
                return $scope._project_name.replace(new RegExp(' ', 'g'), '_');
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
                var identifier = 'clear_all';
                $scope.messageService.simple_confirm('Confirm', "Remove all models?", on_confirm).modal('show').attr('id', identifier);
                return identifier;
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
                var identifier = 'add_model';
                $scope.messageService.simple_input(
                    'Model Name Required', "Enter a Model name",
                    "Model1", add_model_callback, true).modal('show').attr('id', identifier);
                return identifier;
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
            $scope.do_rename_model = function(index, new_model_name) {
                var rename_model_existing_id = 'rename_model_existing';
                var model = $scope.models[index];
                if($scope.existingModel(new_model_name)) {
                    $scope.messageService.simple_error(
                        'Error with Model Name',
                        "There is already a model with the name "+new_model_name
                    ).modal('show').attr('id', rename_model_existing_id);
                }else{
                    model.set_name(new_model_name);
                    $scope.updateModel(model);
                    $scope.$apply();
                }
            }
            $scope.rename_model = function(index){
                var model = $scope.models[index];
                var rename_model_id = 'rename_model';
                var rename_model_callback = function(new_model_name){
                    $scope.do_rename_model(index, new_model_name)
                };
                $scope.messageService.simple_input(
                    'Rename model', "Enter a new Model name", model.name, rename_model_callback, true
                ).modal('show').attr('id', rename_model_id);
                return rename_model_id
            };
            $scope.add_relationship = function (index) {
                const model = $scope.models[index];
                const on_input = function(output_form){
                    var name = output_form.find('input[name=name]').val().trim();
                    var to = output_form.find('select[name=to]').val().trim();
                    var external_app = true;
                    jQuery.each($scope.built_in_models, function(model_name, built_in_model){
                        if(to==model_name){
                            external_app = false;
                        }
                    });
                    jQuery.each($scope.models, function(i, model){
                        if(to==model.name){
                            external_app = false;
                        }
                    });

                    output_form.find('div.form-group-name').removeClass('has-error');
                    output_form.find('div.form-group-to').removeClass('has-error');
                    if(name===undefined||name==='') {
                        output_form.find('div.form-group-name').addClass('has-error')
                            .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                            .find('.help-block').removeClass('hide').text('Field Required');
                    } else if (to===undefined||to==='') {
                        output_form.find('div.form-group-to')
                            .addClass('has-error')
                            .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                            .find('.help-block').removeClass('hide').text('Field Required');
                    } else {
                        if(model.has_relationship(name)){
                            output_form.find('div.form-group-name')
                                .addClass('has-error')
                                .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                                .find('.help-block').removeClass('hide').text('Field \"'+name+'\" exists');
                        }else {
                            var _type = output_form.find('select[name=type]').val();
                            var opts = output_form.find('input[name=opts]').val();
                            var relationship = $scope.relationship_factory.make_relationship({
                                'name': name,
                                'type': _type,
                                'opts': opts,
                                'to': to,
                                'external_app': external_app
                            });
                            model.relationships.push(relationship);
                            $scope.updateModel(model);
                            $scope.$apply();
                            jQuery('.modal').modal('hide');
                        }
                    }
                };
                // TODO make form factory
                const form = jQuery('<form>');
                const form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                const form_div2 = jQuery('<div>').addClass('form-group form-group-to').appendTo(form);
                const form_div3 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                const form_div4 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control'));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));

                const to_select = jQuery('<select>').attr('name', 'to').addClass('form-control');

                /* include built in models */
                const _opt_builtin = jQuery('<optgroup>').attr('label', 'Django models');
                jQuery.each($scope.built_in_models, function(model_name, built_in_model){
                    _opt_builtin.append(jQuery('<option>').attr('val', model_name).text(model_name));
                });
                to_select.append(_opt_builtin);

                /* include application models */
                const _opt_models = jQuery('<optgroup>').attr('label', 'Your App models');
                jQuery.each($scope.models, function(i, model){
                    _opt_models.append(jQuery('<option>').attr('val', model.name).text(model.name));
                });

                to_select.append(_opt_models);

                form_div2.append(jQuery('<label>').text('Relationship to Model'));
                form_div2.append(to_select);
                form_div2.append(jQuery('<p>').addClass("text-primary small clearfix").text('You can add external models (otherapp.models.Model1)').css('margin', '4px'));

                const type_select = jQuery('<select>').attr('name', 'type');

                jQuery.each($scope.relationship_factory.relationship_types(), function(i, relationship_type){
                    type_select.append(jQuery('<option>').attr('val', relationship_type).text(relationship_type));
                });

                form_div3.append(jQuery('<label>').text('Relationship Type'));
                form_div3.append(type_select);
                form_div4.append(jQuery('<label>').text('Arguments'));
                form_div4.append(jQuery('<input>').attr('name', 'opts').attr('placeholder', 'options').addClass('form-control'));

                // Setup select after adding to form
                to_select.select2({theme: "bootstrap", allowClear: true, placeholder: "Select a model.", tags: true, selectOnClose: true});
                type_select.select2({theme: "bootstrap"});

                const identifier = 'add_rel_'+model['name']+'_'+index;
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
                    jQuery('.modal').modal('hide');
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
                    jQuery('.modal').modal('hide');
                };
                var identifier = field['$$hashKey'] || 'edit_field_'+field.name;
                $scope.messageService.simple_form("Edit field '" + field.name+"'",
                    "", field.edit_form($scope),
                    on_confirm).modal('show').attr('id', identifier).appendTo('body');
                return identifier;
            };
            $scope.do_remove_new_model = function (model_index) {
                $scope.new_models.splice(model_index, 1)
                $scope.$apply();
            };
            $scope.remove_new_model = function (model_index) {
                setTimeout(function(){
                    $scope.do_remove_new_model(model_index);
                })
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
            $scope.do_remove_new_relationship = function (model_index, relationship_index) {
                $scope.new_models[model_index].relationships.splice(relationship_index, 1);
            };
            $scope.remove_new_relationship = function (model_index, relationship_index) {
                setTimeout(function(){
                    $scope.do_remove_new_relationship(model_index, relationship_index);
                })
            };
            $scope.do_remove_new_field = function (model_index, field_index) {
                $scope.new_models[model_index].fields.splice(field_index, 1);
                $scope.$apply();
            };
            $scope.remove_new_field = function (model_index, field_index) {
                setTimeout(function(){
                    $scope.do_remove_new_field(model_index, field_index);
                })
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
                jQuery('.builder_model_'+ r.to_clean()).addClass('builder_model_highlight');
            };
            $scope.model_unhighlight = function () {
                jQuery('.builder_model').removeClass('builder_model_highlight');
            };
            $scope.new_model_highlight = function (model_index, relationship_index) {
                var r = $scope.new_models[model_index].relationships[relationship_index];
                jQuery('.builder_model_'+ r.to_clean()).addClass('builder_model_highlight');
            };
            $scope.new_model_unhighlight = function () {
                jQuery('.builder_model').removeClass('builder_model_highlight');
            };
        }]
);
