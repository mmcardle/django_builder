'use strict';

/* Controllers */

angular.module('builder.controllers', ['LocalStorageModule'])
    .controller('ModelController', ['$scope', '$http', 'ModelFactory', 'FieldFactory', 'localStorageService', 'MessageService', 'RenderFactory',
        function ($scope, $http, model_factory, field_factory, localStorageService, messageService, renderFactory) {

            $scope.models = [];
            $scope.messageService = new messageService();
            $scope.field_factory = new field_factory();
            $scope.render_factory = new renderFactory();
            $scope.editors = [];
            $scope.models_storage_key = 'local_models';
            $scope._app_name = 'bestapp';
            $scope.storageType = 'Local storage';

            $scope.aceLoad = function(_editor) {
                var _id = $(_editor.container).attr("id");
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
                }
                _editor.session.selection.clearSelection();
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
                if(_editor!=undefined) {
                    $scope.aceLoad(_editor);
                }
                $scope.editors.push(_editor);
            };

            $scope.$watch("models", function() {
                $.each($scope.editors, function(i, editor){
                    $scope.aceLoad(editor);
                });
            }, true);

            $scope.aceChanged = function(e) {
                // console.log('aceChanged');
            };

            $scope.$watch('localStorageDemo', function (value) {
                localStorageService.set('localStorageDemo', value);
                $scope.localStorageDemoValue = localStorageService.get('localStorageDemo');
            });


            if (localStorageService.getStorageType().indexOf('session') >= 0) {
                $scope.storageType = 'Session storage';
            }

            if (!localStorageService.isSupported) {
                $scope.storageType = 'Cookie';
            }

            $scope.app_name = function () {
                return $scope._app_name;
            };

            $scope.updateModel = function(model){
                var ind = $scope.models.indexOf(model);
                $scope.models[ind] = model;
                localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
            };

            $scope.saveModels = function(){
                localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
            };

            $scope.clearModels = function () {
                var on_confirm = function () {
                    localStorageService.set($scope.models_storage_key, '');
                    $scope.loadModels();
                    $scope.models = [];
                    $scope.$apply();
                };
                $scope.messageService.simple_confirm('Confirm', "Remove all models?", on_confirm).modal('show');
            };

            $scope.addModel = function () {
                var input = $('input#builder_model_name');
                var model_name = input.val();
                if (model_name == undefined || model_name === '') {
                    $scope.messageService.simple_info('Input Required', "No model name entered").modal('show');
                } else {
                    var model_opts = {"name": model_name};
                    model_opts.fields = [
                        $scope.field_factory.make_field({
                            'name': 'name',
                            'type': 'CharField',
                            'opts': 'max_length=255'
                        }),
                        $scope.field_factory.make_field({
                            'name': 'slug',
                            'type': 'AutoSlugField',
                            'opts': 'populate_from=\'name\', blank=True, editable=True'
                        }),
                        $scope.field_factory.make_field({
                            'name': 'created',
                            'type': 'DateTimeField',
                            'opts': 'auto_now_add=True, editable=False'
                        }),
                        $scope.field_factory.make_field({
                            'name': 'last_updated',
                            'type': 'DateTimeField',
                            'opts': 'auto_now=True, editable=False'
                        })
                    ];
                    var model = model_factory(model_opts);
                    $scope.models.push(model);
                    $scope.saveModels();
                    input.val('');
                }
            };

            $scope.cleanModel = function(model){
                delete model['$$hashKey'];
                $.each(model.fields, function(i, field){
                    delete field['$$hashKey'];
                });
            }

            $scope.loadModels = function(){
                var loaded_models = localStorageService.get($scope.models_storage_key);
                console.log(loaded_models);
                if(loaded_models==undefined){
                    return [];
                }else{
                    $.each(loaded_models, function(i, model){
                        $scope.cleanModel(model)
                    });
                    return loaded_models;
                }
            };

            $scope.loadModel = function(model_opts){
                var model = model_factory(model_opts);
                $scope.models.push(model);
            };

            $scope.__init__ = function() {
                $.each($scope.loadModels(), function (i, model_opts) {
                    $scope.loadModel(model_opts);
                });
            };

            $scope.__init__();

            $scope.debug = function(){
                console.log(JSON.stringify($scope.models))
            };

            $scope.add_field = function (index) {
                var modal;
                var on_input= function(output_form){
                    var name = output_form.find('input[name=name]').val();
                    if(name===undefined||name==='') {
                        output_form.find('div.form-group-name')
                            .addClass('has-error')
                            .append($('<span>').addClass("glyphicon glyphicon-remove form-control-feedback"))
                            .find('.help-block').removeClass('hide').text('Field Required');
                    }else {
                        var model = $scope.models[index];
                        if(model.has_field(name)){
                            output_form.find('div.form-group-name')
                                .addClass('has-error')
                                .append($('<span>').addClass("glyphicon glyphicon-remove form-control-feedback"))
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
                            modal.modal('hide');
                        }

                    }

                };
                // TODO make form factory
                var form = $('<form>');
                var form_div1 = $('<div>').addClass('form-group form-group-name  has-feedback').appendTo(form);
                var form_div2 = $('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = $('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append($('<label>').text('Name'));
                form_div1.append($('<input>').attr('name', 'name').addClass('form-control'));
                form_div1.append($('<span>').text('error message').addClass('help-block hide'));

                var select = $('<select>').attr('name', 'type').addClass('form-control');

                $.each($scope.field_factory.field_types(), function(i, field_type){
                    select.append($('<option>').attr('val', field_type).text(field_type));
                });

                form_div2.append($('<label>').text('Field Type'));
                form_div2.append(select);
                form_div3.append($('<label>').text('Arguments'));
                form_div3.append($('<input>').attr('name', 'opts').attr('placeholder', 'options').addClass('form-control'));

                modal = $scope.messageService.simple_form('Add Field', '', form, on_input ).modal('show');
            };
            $scope.rename_field = function (model_index, field_index) {
                var on_confirm = function(input_val){
                    $scope.models[model_index].fields[field_index].name = input_val;
                    localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
                    $scope.$apply();
                };
                $scope.messageService.simple_input('Rename',
                        "Rename the field '" + $scope.models[model_index].fields[field_index].name+"'",
                    on_confirm).modal('show');
            };
            $scope.remove_field = function (model_index, field_index) {
                console.log(model_index, field_index);
                var on_confirm = function(){
                    $scope.models[model_index].fields.splice(field_index, 1);
                    localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
                    $scope.$apply();
                };
                $scope.messageService.simple_confirm('Confirm',
                        "Remove the field '" + $scope.models[model_index].fields[field_index].name+"'",
                    on_confirm).modal('show');
            };

            $scope.remove_model = function (index) {
                var on_confirm = function(){
                    $scope.models.splice(index, 1);
                    localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
                    $scope.$apply();
                };
                $scope.messageService.simple_confirm('Confirm',
                        "Remove the model '" + $scope.models[index].name +"'",
                    on_confirm).modal('show');
            };

            var format_array = function (arr, s) {
                return Object.keys(arr).map(function (k) {
                    return arr[k].name + s
                });
            };
            $scope.import_views = function () {
                return 'from .views import '
                    + format_array($scope.models, 'ListView').join(', ') + ', '
                    + format_array($scope.models, 'DetailView').join(', ') + ', '
                    + format_array($scope.models, 'UpdateView').join(', ') + ', '
                    + format_array($scope.models, 'CreateView').join(', ');
            };
            $scope.import_models = function () {
                return 'from .models import ' + format_array($scope.models, 'Model').join(', ');
            };
            $scope.import_forms = function () {
                return 'from .forms import ' + format_array($scope.models, 'Form').join(', ');
            };

            // Load from api
            /*$http({method: 'GET', url: '/builder/amodel'}).
                success(function (data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.models = data;
                    $scope.models = Object.keys(data).map(function (k) {
                        return $model_factory(data[k]);
                    });
                }).
                error(function (data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
            });*/


        }]
);
