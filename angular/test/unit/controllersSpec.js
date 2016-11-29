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
        project_factory, model_factory, field_factory, relationship_factory, message_service, renderFactory, tarballFactory;

    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $http = $injector.get('$http');
        localStorageService = $injector.get('localStorageService');
        project_factory = $injector.get('ProjectFactory');
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
        expect($scope.create_tar_ball_url().length).toBeGreaterThan(512);

        // Test download app
        var expected_tar_ball_url_app = $scope.create_tar_ball_url(false);
        var download_modal_id_app = $scope.create_download_modal_app();
        var download_modal_app = jQuery('#'+download_modal_id_app);
        var download_a_app = download_modal_app.find('#django_builder_download_a');
        expect(download_a_app.attr('href')).toBe(expected_tar_ball_url_app);

        // Test download project
        var expected_tar_ball_url_project = $scope.create_tar_ball_url(true);
        var download_modal_id_project = $scope.create_download_modal_project();
        var download_modal_project = jQuery('#'+download_modal_id_project);
        var download_a_project = download_modal_project.find('#django_builder_download_a');
        expect(download_a_project.attr('href')).toBe(expected_tar_ball_url_project);

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

        expect(ff.field_types().length).toBe(30);
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

        // New model
        var new_model = model_factory(model_opts, $scope);
        new_model.fields.push(field);
        new_model.relationships.push(rel);
        $scope.new_models.push(new_model);

        $scope.model_highlight(0, 0);
        $scope.model_unhighlight();

        $scope.new_model_highlight(0, 0);
        $scope.new_model_unhighlight();

        expect(model.has_relationship('Rel')).toBe(true);
        expect(model.name_field()).toBe('id');

        expect(new_model.has_relationship('Rel')).toBe(true);
        expect(new_model.name_field()).toBe('id');

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
    it('should have ability to add new Models', function () {
        // Models
        var model1 = model_factory({"name": 'Model1'}, $scope);
        var model2 = model_factory({"name": 'Model2'}, $scope);
        var add_new_models_id = $scope.add_new_models([model1, model2]);
        var add_new_modal = jQuery('#'+add_new_models_id);
        add_new_modal.find('.btn-primary').click();
        expect($scope.model_count()).toBe(2);
    });
    it('should have ability to add new Models adding uniques', function () {
        // Models
        var model1 = model_factory({"name": 'Model1'}, $scope);
        var model2 = model_factory({"name": 'Model2'}, $scope);

        $scope.add_model('Model1');
        $scope.add_model('Model2');
        expect($scope.model_count()).toBe(2);

        // Models
        var duplicate1 = model_factory({"name": 'Model1'}, $scope);
        var duplicate2 = model_factory({"name": 'Model2'}, $scope);
        var new1 = model_factory({"name": 'Model3'}, $scope);

        expect($scope.model_count()).toBe(2);
        $scope.add_new_models([duplicate1, duplicate2, new1]);

        // Manual callback
        $scope.add_unique();

        expect($scope.models.length).toBe(3);
        expect($scope.models[0].name).toBe(duplicate1.name);
        expect($scope.models[1].name).toBe(duplicate2.name);
    });

    it('should have ability to add new Models overwriting duplicates', function () {
        // Models
        $scope.add_model('Model1');
        $scope.add_model('Model2');
        expect($scope.model_count()).toBe(2);

        // Models
        var duplicate1 = model_factory({"name": 'Model1'}, $scope);
        var duplicate2 = model_factory({"name": 'Model2'}, $scope);
        var new1 = model_factory({"name": 'Model3'}, $scope);

        expect($scope.model_count()).toBe(2);
        $scope.add_new_models([duplicate1, duplicate2, new1]);

        // Manual callback
        $scope.merge_models();
        expect($scope.models.length).toBe(3);
        expect($scope.models[0].name).toBe(duplicate1.name);
        expect($scope.models[1].name).toBe(duplicate2.name);
        expect($scope.models[2].name).toBe(new1.name);
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
    it('should have ability to add/remove a Model via modal', function () {
        var add_id = $scope.addModel();
        var add_modal = jQuery('#'+add_id);
        add_modal.find('.btn-primary').click();
    });
    it('should have ability to clear Models', function () {
        expect($scope.model_count()).toBe(0);
        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);
        $scope.models.push(model);

        expect($scope.model_count()).toBe(1);

        var clear_modal_id = $scope.clearModels();
        var clear_modal = jQuery('#'+clear_modal_id);
        clear_modal.find('.btn-primary').click();

        expect($scope.model_count()).toBe(0);

    });
    it('should have ability to remove new models', function () {
        var model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        var new_model = model_factory(model_opts, $scope);
        $scope.new_models = [new_model];
        expect($scope.new_models.length).toBe(1);
        // Call UI method for coverage
        $scope.remove_new_model(0);
        $scope.do_remove_new_model(0);
        expect($scope.new_models.length).toBe(0);
    });
    it('should have ability to remove model relationships', function () {
        var rf = new relationship_factory();

        // Relationship
        var rel_name = 'Rel';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);

        var model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        var new_model = model_factory(model_opts, $scope);
        new_model.relationships.push(rel);

        $scope.new_models = [new_model];
        expect($scope.new_models.length).toBe(1);
        // Call UI method for coverage
        $scope.remove_new_relationship(0, 0);

        $scope.do_remove_new_relationship(0, 0);
        expect($scope.new_models.length).toBe(1);
        expect($scope.new_models[0].relationships.length).toBe(0);
    });
    it('should have ability to add relationships to internal app models', function () {
        var rf = new relationship_factory();
        var rel_name = 'Rel';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);
        expect(rel.external_app).toBe(false);
    });
    it('should have ability to add relationships to external app models', function () {
        var rf = new relationship_factory();
        var rel_name = 'Rel';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo', external_app: true};
        var rel = rf.make_relationship(rel_opts);
        expect(rel.external_app).toBe(true);
    });
    it('should have ability to remove model fields', function () {
        var ff = new field_factory();
        var field_name = 'Field';
        var field_opts = {"name": field_name, "type": 'FieldType'};
        var field = ff.make_field(field_opts, $scope);

        var model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        var new_model = model_factory(model_opts, $scope);
        new_model.fields.push(field);

        $scope.new_models = [new_model];
        expect($scope.new_models.length).toBe(1);

        // Call UI method for coverage
        $scope.remove_new_field(0, 0);

        $scope.do_remove_new_field(0, 0);
        expect($scope.new_models.length).toBe(1);
        expect($scope.new_models[0].relationships.length).toBe(0);

    });
    it('should have ability to rename Models', function () {
        var name = 'model1';
        var new_name = 'model2';
        $scope.add_model(name);
        var rename_id = $scope.rename_model(0);
        var rename_modal = jQuery('#'+rename_id);
        rename_modal.find('input').val(new_name);
        rename_modal.find('.btn-primary').click();
        expect($scope.models[0].name).toBe(new_name);
    });
    it('should not rename a model to be blank', function () {
        var name = 'model1';
        $scope.add_model(name);
        var rename_id = $scope.rename_model(0);
        var rename_modal = jQuery('#'+rename_id);
        rename_modal.find('input').val('');
        rename_modal.find('.btn-primary').click();
        expect($scope.models[0].name).toBe(name);
    });
    it('should not rename a model to be another model name', function () {
        var name1 = 'model1';
        var name2 = 'existing_model2';
        expect($scope.model_count()).toBe(0);
        $scope.add_model(name1);
        expect($scope.model_count()).toBe(1);
        $scope.add_model(name2);
        expect($scope.model_count()).toBe(2);
        $scope.do_rename_model(0, name2);
        expect($scope.models[0].name).toBe(name1);
        expect($scope.models[1].name).toBe(name2);
        var rename_existing_id = 'rename_model_existing';
        var rename_existing_modal = jQuery('#'+rename_existing_id);
        expect(rename_existing_modal.length).toBe(1);
    });
    it('should have ability to find existing Models', function () {
        var name1 = 'model1';
        var name2 = 'model2';
        $scope.add_model('modelX');
        $scope.add_model(name1);
        $scope.add_model('modelY');
        $scope.add_model(name2);
        $scope.add_model('modelZ');
        expect($scope.existingModel(name1)).toBe(true);
        expect($scope.existingModel('another_name')).toBe(false);
        expect($scope.existingModel(name2)).toBe(true);
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
