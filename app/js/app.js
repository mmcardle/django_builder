'use strict';

// Declare app level module which depends on filters, and services
angular.module('builder', [
    'ngRoute',
    'builder.filters',
    'builder.services',
    'builder.directives',
    'builder.controllers',
    'LocalStorageModule',
    'ui.ace',
    'angulartics',
    'angulartics.google.analytics'
]).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    // Angular
    $routeProvider.when('/models', {templateUrl: 'app/partials/models.html', controller: 'ModelController'});
    $routeProvider.when('/home', {templateUrl: 'app/partials/home.html', controller: 'ModelController'});
    $routeProvider.otherwise({redirectTo: '/home'});
}]);