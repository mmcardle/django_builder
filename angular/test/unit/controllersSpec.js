'use strict';

/* jasmine specs for controllers go here */

describe('ModelController', function() {
    beforeEach(module('builder.controllers'));
    beforeEach(module('builder.services'));

    var $scope, $http, $rootScope, createController, localStorageService,
        model_factory, field_factory, relationship_factory, message_service, renderFactory;

    beforeEach(inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $http = $injector.get('$http');
        localStorageService = $injector.get('localStorageService');
        model_factory = $injector.get('ModelFactory');
        field_factory = $injector.get('FieldFactory');
        relationship_factory = $injector.get('RelationshipFactory');
        message_service = $injector.get('MessageService');
        renderFactory = $injector.get('RenderFactory');
        $scope = $rootScope.$new();

        var $controller = $injector.get('$controller');

        createController = function() {
            return $controller('ModelController', {
                '$scope': $scope,
                '$http': $http,
                'model_factory': model_factory,
                'field_factory': field_factory,
                'relationship_factory': relationship_factory,
                'localStorageService': localStorageService,
                'message_service': message_service,
                'renderFactory': $scope
            });
        };
    }));

    it('should have basic model checks', function() {
        var controller = createController();
        expect($scope.model_count()).toBe(0);
        expect($scope.create_tar_ball_url().length).toBe(13684);
        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);
        expect($scope.model_count()).toBe(1);
        expect($scope.create_tar_ball_url().length).toBe(27336);
    });
});
