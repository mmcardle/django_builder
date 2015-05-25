'use strict';

/* jasmine specs for controllers go here */
describe('Testing routes', function() {
    beforeEach(module('builder'));

    it('should map routes to controllers', function() {
      inject(function($route) {
          expect($route.routes['/models'].controller).toBe('ModelController');
          expect($route.routes['/home'].controller).toBe('ModelController');
      });
    });
});

describe('Testing ModelController', function () {
    beforeEach(module('builder.controllers'));
    beforeEach(module('builder.services'));

    var $scope, $http, $rootScope, createController, localStorageService,
        model_factory, field_factory, relationship_factory, message_service, renderFactory, tarballFactory;

    beforeEach(inject(function ($injector) {
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
        $scope._app_name = 'app_name';

        var $controller = $injector.get('$controller');

        createController = function () {
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
        var controller = createController();
        localStorageService.storageType = 'session';
    }));

    afterEach(inject(function ($injector) {
        $scope.doClearModels();
    }));

    it('should have basic model checks', function () {
        // Coverage calls
        $scope.debug();
        $scope.aceChanged();

        expect($scope.model_count()).toBe(0);
        // App name
        expect($scope.app_name()).toBe('app_name');
        $scope.do_set_app_name('Other Name');
        expect($scope.app_name()).toBe('Other_Name');
        expect($scope.l_app_name()).toBe('other name');

        // Test app name input
        jQuery('<input>').attr('id', 'appname').val('New Name').appendTo('body');
        $scope.set_app_name();
        expect($scope.app_name()).toBe('New_Name');
        expect($scope.l_app_name()).toBe('new name');
        expect($scope.model_count()).toBe(0);
        expect($scope.create_tar_ball_url().length).toBe(13684);

        // Fake iframe with an img tag so we don't try to download during tests
        var fake_iframe = jQuery('<img>').attr('id', 'download_iframe').appendTo('body');
        $scope.create_tar_ball();
        expect(fake_iframe.attr('src')).toBe($scope.create_tar_ball_url());

        // Test ACE
        var ace_types = [
            'builder_NONE',
            'builder_models',
            'builder_views',
            'builder_admin',
            'builder_urls',
            'builder_tests',
            'builder_forms'
        ];

        for (var i = 0; i < ace_types.length; i++) {
            var ace_type = ace_types[i];
            var ace_div = jQuery('<div>').attr('id', ace_type).appendTo('body');
            var editor = ace.edit(ace_type);
            $scope.aceLoaded(editor);
            $scope.aceLoad(editor);
        }
        $scope.reLoadAce();
        expect($scope.editors.length).toBe(ace_types.length);

        // Factories
        var ff = new field_factory();
        var rf = new relationship_factory();

        expect(ff.field_types().length).toBe(16);
        expect(rf.relationship_types().length).toBe(3);

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

        $scope.model_highlight(0, 0);
        $scope.model_unhighlight();

        expect(model.has_relationship('Rel')).toBe(true);
        expect(model.name_field()).toBe('id');

        expect($scope.model_count()).toBe(1);
        expect($scope.create_tar_ball_url().length).toBe(27336);

        $scope.updateModel(model);
        $scope.serializeApp();
        $scope.saveApp();
        $scope.reLoadAce();
        $scope.doClearModels();
        expect($scope.model_count()).toBe(0);
    });
    it('should have ability to clean Models', function () {
        createController();
        var model_data1 = {
            '$$hashKey': 'key'
        };
        $scope.cleanModel(model_data1);
        expect(model_data1['$$hashKey']).toBe(undefined);
        var model_data2 = {
            '$$hashKey': 'key',
            'fields' :[
                {'$$hashKey': 'key'}
            ],
            'relationships' :[
                {'$$hashKey': 'key'}
            ]
        };
        $scope.cleanModel(model_data2);
        expect(model_data2['$$hashKey']).toBe(undefined);
        expect(model_data2.fields[0]['$$hashKey']).toBe(undefined);
        expect(model_data2.relationships[0]['$$hashKey']).toBe(undefined);
    });

    it('should have ability to __init__', function () {
        createController();
        // Model
        var model_opts = {"name": 'Model1'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);
        localStorageService.set($scope.models_storage_key, $scope.serializeApp());
        $scope.__init__();
        expect($scope.model_count()).toBe(1);
        expect($scope.models[0].name).toBe('Model1');
    });
    it('should have ability to load Models', function () {

        $scope.__init__();
        expect($scope.model_count()).toBe(0);

        // Model
        var model_opts = {"name": 'Model1'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);
        localStorageService.set($scope.models_storage_key, '{}');
        $scope.loadModels();
        localStorageService.set($scope.models_storage_key, $scope.serializeApp());
        $scope.loadModels();
        expect($scope.model_count()).toBe(1);
        expect($scope.models[0].name).toBe('Model1');
    });
    it('should have ability to add/remove a Model', function () {
        expect($scope.model_count()).toBe(0);
        $scope.add_model('model1');
        expect($scope.model_count()).toBe(1);
        $scope.add_model('model2');
        expect($scope.model_count()).toBe(2);

        var remove_model_id = $scope.remove_model(0);
        var remove_model = jQuery('#'+remove_model_id);
        remove_model.find('.btn-primary').click();
        expect($scope.model_count()).toBe(1);
    });
    it('should have ability to clear Models', function () {
        expect($scope.model_count()).toBe(0);
        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);

        expect($scope.model_count()).toBe(1);

        var clear_modal = $scope.clearModels();
        clear_modal.find('.btn-primary').click();

        expect($scope.model_count()).toBe(0);

    });
    it('should not allow duplicated relationships and fields', function () {

        // Factories
        var ff = new field_factory();
        var rf = new relationship_factory();

        // Field
        var field_name = 'Field';
        var field_opts = {"name": field_name, "type": 'FieldType'};
        var field = ff.make_field(field_opts, $scope);

        // Relationship
        var rel_name = 'Rel';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);

        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect($scope.models[0].fields.length).toBe(1);
        var add_field_model_id = $scope.add_field(0);
        var add_field_model = jQuery('#'+add_field_model_id);
        add_field_model.find('input[name=name]').val(field_name);
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(1);

        expect($scope.models[0].relationships.length).toBe(1);
        var add_rel_model_id = $scope.add_relationship(0);
        var add_rel_model = jQuery('#'+add_rel_model_id);
        add_rel_model.find('.btn-primary').click();
        add_rel_model.find('input[name=name]').val(rel_name);
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(1);
    });
    it('should allow ability to edit/remove relationships and fields', function () {

        // Factories
        var ff = new field_factory();
        var rf = new relationship_factory();

        // Field
        var field_name = 'Field';
        var new_field_name = 'Field2';
        var field_opts = {"name": field_name, "type": 'FieldType'};
        var field = ff.make_field(field_opts, $scope);

        // Relationship
        var rel_name = 'Rel';
        var new_rel_name = 'Rel2';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);

        var model_opts = {"name": 'ModelAddRelAndField'};
        var model = model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect($scope.models[0].fields[0].name).toBe(field_name);
        var edit_field_model_id = $scope.edit_field(0, 0);
        var edit_field_model = jQuery('#'+edit_field_model_id);
        edit_field_model.find('input[name=name]').val(new_field_name);
        edit_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields[0].name).toBe(new_field_name);

        var remove_field_model_id = $scope.remove_field(0, 0);
        var remove_field_model = jQuery('#'+remove_field_model_id);
        remove_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(0);
        expect($scope.models[0].relationships[0].name).toBe(rel_name);

        var edit_rel_model_id = $scope.edit_relationship(0, 0);
        var edit_rel_model = jQuery('#'+edit_rel_model_id);
        edit_rel_model.find('.btn-primary').click();
        edit_rel_model.find('input[name=name]').val(new_rel_name);
        edit_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships[0].name).toBe(new_rel_name);

        var remove_rel_model_id = $scope.remove_relationship(0, 0);
        var remove_rel_model = jQuery('#'+remove_rel_model_id);
        remove_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(0);
    });
    it('should have ability to add fields', function () {
        var model_opts = {"name": 'ModelAddField'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);
        expect($scope.models[0].fields.length).toBe(0);

        var add_field_model_id = $scope.add_field(0);
        var add_field_model = jQuery('#'+add_field_model_id);
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(0);
        add_field_model.find('input[name=name]').val('field');
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(1);
    });
    it('should have ability to add relationships', function () {
        var model_opts = {"name": 'ModelAddRel'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);
        expect($scope.models[0].relationships.length).toBe(0);
        var add_rel_model_id = $scope.add_relationship(0);
        var add_rel_model = jQuery('#'+add_rel_model_id);
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(0);
        add_rel_model.find('input[name=name]').val('field');
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(1);
    });
});
