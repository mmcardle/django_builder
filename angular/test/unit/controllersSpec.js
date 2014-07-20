'use strict';

/* jasmine specs for controllers go here */

describe('ModelController', function() {
    beforeEach(module('builder.controllers'));
    beforeEach(module('builder.services'));

    var $scope, $http, $rootScope, createController, localStorageService,
        model_factory, field_factory, relationship_factory, message_service, renderFactory, tarballFactory;

    beforeEach(inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $http = $injector.get('$http');
        localStorageService = $injector.get('localStorageService');
        model_factory = $injector.get('ModelFactory');
        field_factory = $injector.get('FieldFactory');
        relationship_factory = $injector.get('RelationshipFactory');
        message_service = $injector.get('MessageService');
        renderFactory = $injector.get('RenderFactory');
        tarballFactory = $injector.get('TarballFactory');
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
                'renderFactory': renderFactory,
                'tarballFactory': tarballFactory
            });
        };
    }));
    it('should have basic model checks', function() {
        var controller = createController();
        expect($scope.model_count()).toBe(0);
        expect($scope.create_tar_ball_url().length).toBe(13684);

        // Factories
        var ff = new field_factory();
        var rf = new relationship_factory();

        expect(ff.field_types().length).toBe(16);
        expect(rf.relationship_types().length).toBe(2);

        // Field
        var field_opts = {"name": 'Field', "type": 'FieldType'};
        var field = ff.make_field(field_opts, $scope);

        // Relationship
        var rel_opts = {"name": 'Rel', "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);

        // Model
        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect(model.has_relationship('Rel')).toBe(true);
        expect(model.name_field()).toBe('id');

        expect($scope.model_count()).toBe(1);
        expect($scope.create_tar_ball_url().length).toBe(27336);

        expect($scope.l_app_name()).toBe('app_name');
        $scope.serializeApp();
        $scope.saveApp();
        $scope.reLoadAce();
        $scope.doClearModels();
        expect($scope.model_count()).toBe(0);

        // TODO = Move to services spec
        var edit_form = field.edit_form($scope);
        edit_form.find('input[name=name]').val('name');
        edit_form.find('select[name=type]').val('type');
        edit_form.find('input[name=opts]').val('opts');
        field.form_update(edit_form);

        // TODO = Move to services spec
        var rel_edit_form = rel.edit_form($scope);
        rel_edit_form.find('input[name=name]').val('name');
        rel_edit_form.find('select[name=type]').val('type');
        rel_edit_form.find('input[name=opts]').val('opts');
        rel_edit_form.find('input[name=to]').val('to');
        rel.form_update(rel_edit_form);

    });
});
