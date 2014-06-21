'use strict';

/* Controllers */

angular.module('myApp.controllers', ['LocalStorageModule'])
    .controller('ModelController', ['$scope', '$http', 'ModelFactory', 'localStorageService', 'MessageService',
        function ($scope, $http, $model_factory, localStorageService, messageService) {

            $scope.messageService = new messageService();

            $scope.$watch('localStorageDemo', function (value) {
                localStorageService.set('localStorageDemo', value);
                $scope.localStorageDemoValue = localStorageService.get('localStorageDemo');
            });

            $scope.storageType = 'Local storage';

            if (localStorageService.getStorageType().indexOf('session') >= 0) {
                $scope.storageType = 'Session storage';
            }

            if (!localStorageService.isSupported) {
                $scope.storageType = 'Cookie';
            }

            $scope.models = [];
            $scope.models_storage_key = 'local_models';
            $scope._app_name = 'MyApp';

            $scope.app_name = function () {
                return $scope._app_name;
            };

            $scope.saveModel = function(model_name){
                var loaded_models = $scope.loadModels();
                loaded_models.push(model_name);
                localStorageService.set($scope.models_storage_key, JSON.stringify(loaded_models));
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
                    var model = $model_factory(model_opts);
                    $scope.models.push(model);
                    $scope.saveModel(model_opts);
                    input.val('');
                }
            };

            $scope.loadModels = function(){
                var loaded_models = localStorageService.get($scope.models_storage_key);
                if(loaded_models==undefined){
                    return [];
                }else{
                    return loaded_models;
                }
            };

            $scope.loadModel = function(model_opts){
                var model = $model_factory(model_opts);
                $scope.models.push(model);
            };

            $scope.__init__ = function() {
                $.each($scope.loadModels(), function (i, model_opts) {
                    $scope.loadModel(model_opts);
                });
            };

            $scope.__init__();

            $scope.remove_model = function (index) {
                var on_confirm = function(){
                    $scope.models.splice(index, 1);
                    localStorageService.set($scope.models_storage_key, JSON.stringify($scope.models));
                    $scope.$apply();
                };
                $scope.messageService.simple_confirm('Confirm', "Remove " + $scope.models[index].name, on_confirm).modal('show');
            };

            var format_array = function (arr, s) {
                return Object.keys(arr).map(function (k) {
                    return arr[k].name + s
                });
            };
            $scope.import_views = function () {
                return 'from .views import ' + format_array($scope.models, 'View').join(', ');
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
