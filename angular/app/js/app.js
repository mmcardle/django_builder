'use strict';

// Declare app level module which depends on filters, and services
angular.module('builder', [
    'ngRoute',
    'builder.filters',
    'builder.services',
    'builder.directives',
    'builder.controllers',
    'LocalStorageModule',
    'ui.ace'
]).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.when('/models', {templateUrl: '/site_media/static/partials/models.html', controller: 'ModelController'});
    $routeProvider.when('/', {templateUrl: '/site_media/static/partials/models.html', controller: 'ModelController'});
    $routeProvider.otherwise({redirectTo: '/models'});

}]);
