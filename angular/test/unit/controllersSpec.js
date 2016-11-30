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

    var $scope, $httpBackend, $rootScope, createController, localStorageService,
        project_factory, model_factory, field_factory, relationship_factory, message_service, renderFactory, tarballFactory;

    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $httpBackend = $injector.get('$httpBackend');
        localStorageService = $injector.get('localStorageService');

        model_factory = $injector.get('ModelFactory');
        field_factory = $injector.get('FieldFactory');
        relationship_factory = $injector.get('RelationshipFactory');
        message_service = $injector.get('MessageService');
        renderFactory = $injector.get('RenderFactory');
        tarballFactory = $injector.get('TarballFactory');

        // backend definition common for all tests
        $httpBackend.when('GET', 'partials/py/settings.py').respond('');
        $httpBackend.when('GET', 'partials/py/manage.py').respond('');
        $httpBackend.when('GET', 'partials/py/urls.py').respond('');
        $httpBackend.when('GET', 'partials/py/wsgi.py').respond('');

        project_factory = $injector.get('ProjectFactory');

        $scope = $rootScope.$new();
        $scope._app_name = 'app_name';

        var $controller = $injector.get('$controller');

        createController = function () {
            return $controller('ModelController', {
                '$scope': $scope,
                'project_factory': project_factory,
                'model_factory': model_factory,
                'field_factory': field_factory,
                'relationship_factory': relationship_factory,
                'localStorageService': localStorageService,
                'message_service': message_service,
                'renderFactory': renderFactory,
                'tarballFactory': tarballFactory
            });
        };
        createController();
        localStorageService.storageType = 'session';
    }));

    afterEach(inject(function ($injector) {
        $scope.doClearModels();
        //jQuery(".modal").remove();
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

        const user_app_name = 'App Name';
        const expected_app_name = 'App_Name';
        const expected_app_name_l = 'app name';
        const user_project_name = 'Project Name';
        const expected_project_name = 'Project_Name';
        const expected_project_name_l = 'project name';

        // Test app name input
        jQuery('<input>').attr('id', 'appname').val(user_app_name).appendTo('body');
        jQuery('<input>').attr('id', 'projectname').val(user_project_name).appendTo('body');

        $scope.set_app_name();
        $scope.set_project_name('project_name');
        expect($scope.app_name()).toBe(expected_app_name);
        expect($scope.project_name()).toBe(expected_project_name);
        expect($scope.l_app_name()).toBe(expected_app_name_l);
        expect($scope.l_project_name()).toBe(expected_project_name_l);
        expect($scope.model_count()).toBe(0);
        expect($scope.create_tar_ball_url().length).toBeGreaterThan(512);

        // Test download app
        const expected_tar_ball_url_app = $scope.create_tar_ball_url(false);
        let download_modal_id_app = $scope.create_download_modal_app();
        let download_modal_app = jQuery('#'+download_modal_id_app);
        let download_a_app = download_modal_app.find('#django_builder_download_a');
        expect(download_a_app.attr('href')).toBe(expected_tar_ball_url_app);

        // Test download project
        let expected_tar_ball_url_project = $scope.create_tar_ball_url(true);
        let download_modal_id_project = $scope.create_download_modal_project();
        let download_modal_project = jQuery('#'+download_modal_id_project);
        let download_a_project = download_modal_project.find('#django_builder_download_a');
        expect(download_a_project.attr('href')).toBe(expected_tar_ball_url_project);

        // Test ACE
        let ace_types = [
            'builder_NONE',
            'builder_models',
            'builder_views',
            'builder_admin',
            'builder_urls',
            'builder_tests',
            'builder_forms'
        ];

        for (let i = 0; i < ace_types.length; i++) {
            let ace_type = ace_types[i];
            let ace_div = jQuery('<div>').attr('id', ace_type).appendTo('body');
            let editor = ace.edit(ace_type);
            $scope.aceLoaded(editor);
            $scope.aceLoad(editor);
        }
        $scope.reLoadAce();
        expect($scope.editors.length).toBe(ace_types.length);

        // Factories
        let ff = $scope.field_factory;
        let rf = $scope.relationship_factory;

        expect(ff.field_types().length).toBe(30);
        expect(rf.relationship_types().length).toBe(3);

        // Field
        let field_opts = {"name": 'Field', "type": 'FieldType'};
        let field = ff.make_field(field_opts, $scope);

        // Relationship
        let rel_opts = {"name": 'Rel', "type": 'RelType', "to": 'RelTo'};
        let rel = rf.make_relationship(rel_opts);

        // Model
        let model_opts = {"name": 'Model'};
        let model = $scope.model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        // New model
        let new_model = $scope.model_factory(model_opts, $scope);
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
        let model_data1 = {
            '$$hashKey': 'key'
        };
        $scope.cleanModel(model_data1);
        expect(model_data1['$$hashKey']).toBe(undefined);
        let model_data2 = {
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
        // Model
        let model_opts = {"name": 'Model1'};
        let model = $scope.model_factory(model_opts, $scope);
        $scope.models.push(model);
        $scope.localStorageService.set($scope.models_storage_key, $scope.serializeApp());
        expect($scope.model_count()).toBe(1);
        expect($scope.models[0].name).toBe('Model1');
    });
    it('should have ability to load Models', function () {

        $scope.__init__();
        expect($scope.model_count()).toBe(0);

        // Model
        let model_opts = {"name": 'Model1'};
        let model = $scope.model_factory(model_opts, $scope);
        $scope.models.push(model);
        $scope.localStorageService.set($scope.models_storage_key, '{}');
        $scope.loadModels();
        $scope.localStorageService.set($scope.models_storage_key, $scope.serializeApp());
        $scope.loadModels();
        expect($scope.model_count()).toBe(1);
        expect($scope.models[0].name).toBe('Model1');
    });
    it('should have ability to add new Models', function () {
        // Models
        let model1 = $scope.model_factory({"name": 'Model1'}, $scope);
        let model2 = $scope.model_factory({"name": 'Model2'}, $scope);
        let add_new_models_id = $scope.add_new_models([model1, model2]);
        let add_new_modal = jQuery('#'+add_new_models_id);
        add_new_modal.find('.btn-primary').click();
        expect($scope.model_count()).toBe(2);
    });
    it('should have ability to add new Models adding uniques', function () {
        // Models
        let model1 = $scope.model_factory({"name": 'Model1'}, $scope);
        let model2 = $scope.model_factory({"name": 'Model2'}, $scope);

        $scope.add_model('Model1');
        $scope.add_model('Model2');
        expect($scope.model_count()).toBe(2);

        // Models
        let duplicate1 = $scope.model_factory({"name": 'Model1'}, $scope);
        let duplicate2 = $scope.model_factory({"name": 'Model2'}, $scope);
        let new1 = $scope.model_factory({"name": 'Model3'}, $scope);

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
        let duplicate1 = $scope.model_factory({"name": 'Model1'}, $scope);
        let duplicate2 = $scope.model_factory({"name": 'Model2'}, $scope);
        let new1 = $scope.model_factory({"name": 'Model3'}, $scope);

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

        let remove_model_id = $scope.remove_model(0);
        let remove_model = jQuery('#'+remove_model_id);
        remove_model.find('.btn-primary').click();
        expect($scope.model_count()).toBe(1);
    });
    it('should have ability to add/remove a Model via modal', function () {
        let add_id = $scope.addModel();
        let add_modal = jQuery('#'+add_id);
        add_modal.find('.btn-primary').click();
    });
    it('should have ability to clear Models', function () {
        expect($scope.model_count()).toBe(0);
        let model_opts = {"name": 'Model'};
        let model = $scope.model_factory(model_opts, $scope);
        $scope.models.push(model);

        expect($scope.model_count()).toBe(1);

        let clear_modal_id = $scope.clearModels();
        let clear_modal = jQuery('#'+clear_modal_id);
        clear_modal.find('.btn-primary').click();

        expect($scope.model_count()).toBe(0);

    });
    it('should have ability to remove new models', function () {
        let model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        let new_model = $scope.model_factory(model_opts, $scope);
        $scope.new_models = [new_model];
        expect($scope.new_models.length).toBe(1);
        // Call UI method for coverage
        $scope.remove_new_model(0);
        $scope.do_remove_new_model(0);
        expect($scope.new_models.length).toBe(0);
    });
    it('should have ability to remove model relationships', function () {
        let rf = $scope.relationship_factory;

        // Relationship
        let rel_name = 'Rel';
        let rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        let rel = rf.make_relationship(rel_opts);

        let model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        let new_model = $scope.model_factory(model_opts, $scope);
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
        let rf = $scope.relationship_factory;
        let rel_name = 'Rel';
        let rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        let rel = rf.make_relationship(rel_opts);
        expect(rel.external_app).toBe(false);
    });
    it('should have ability to add relationships to external app models', function () {
        let rf = $scope.relationship_factory;
        let rel_name = 'Rel';
        let rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo', external_app: true};
        let rel = rf.make_relationship(rel_opts);
        expect(rel.external_app).toBe(true);
    });
    it('should have ability to remove model fields', function () {
        let ff = $scope.field_factory;
        let field_name = 'Field';
        let field_opts = {"name": field_name, "type": 'FieldType'};
        let field = ff.make_field(field_opts, $scope);

        let model_opts = {"name": 'Model'};
        expect($scope.new_models.length).toBe(0);
        let new_model = $scope.model_factory(model_opts, $scope);
        new_model.fields.push(field);

        $scope.new_models = [new_model];
        expect($scope.new_models.length).toBe(1);

        // Call UI method for coverage
        $scope.remove_new_field(0, 0);

        $scope.do_remove_new_field(0, 0);
        expect($scope.new_models.length).toBe(1);
        expect($scope.new_models[0].relationships.length).toBe(0);

    });

    describe('should have ability to rename Models', function () {

        beforeEach(function(done) {
            let name = 'model1';
            let new_name = 'model2';
            $scope.doClearModels();
            $scope.add_model(name);
            let rename_id = $scope.rename_model(0);
            let rename_modal = jQuery('#'+rename_id);
            rename_modal.find('input').val(new_name);
            rename_modal.find('.btn-primary').click();
            done();
        });

        afterEach(inject(function ($injector) {
            $scope.doClearModels();
            jQuery(".modal").remove();
        }));

        it('should rename the model', function(){
            expect($scope.models[0].name).toBe('model2');
        })
    });

    it('should not rename a model to be blank', function () {
        let name = 'model1';
        $scope.add_model(name);
        let rename_id = $scope.rename_model(0);
        let rename_modal = jQuery('#'+rename_id);
        rename_modal.find('input').val('');
        rename_modal.find('.btn-primary').click();
        expect($scope.models[0].name).toBe(name);
    });
    it('should be able to import', function () {
        const model_text = "class MyModel(Model):\n";
        let process_ret = $scope.process_models_py([new Blob([model_text])]);
        expect(process_ret).toBe(true)
    });
    it('should not rename a model to be another model name', function () {
        let name1 = 'model1';
        let name2 = 'existing_model2';
        expect($scope.model_count()).toBe(0);
        $scope.add_model(name1);
        expect($scope.model_count()).toBe(1);
        $scope.add_model(name2);
        expect($scope.model_count()).toBe(2);
        let rename_res = $scope.do_rename_model(0, name2);
        expect(rename_res).toBe(false);
        expect($scope.models[0].name).toBe(name1);
        expect($scope.models[1].name).toBe(name2);
    });

    it('should have ability to find existing Models', function () {
        let name1 = 'model1';
        let name2 = 'model2';
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
        let ff = $scope.field_factory;
        let rf = $scope.relationship_factory;

        // Field
        let field_name = 'Field';
        let field_opts = {"name": field_name, "type": 'FieldType'};
        let field = ff.make_field(field_opts, $scope);

        // Relationship
        let rel_name = 'Rel';
        let rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        let rel = rf.make_relationship(rel_opts);

        let model_opts = {"name": 'Model'};
        let model = $scope.model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect($scope.models[0].fields.length).toBe(1);
        let add_field_model_id = $scope.add_field(0);
        let add_field_model = jQuery('#'+add_field_model_id);
        add_field_model.find('input[name=name]').val(field_name);
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(1);

        expect($scope.models[0].relationships.length).toBe(1);
        let add_rel_model_id = $scope.add_relationship(0);
        let add_rel_model = jQuery('#'+add_rel_model_id);
        add_rel_model.find('.btn-primary').click();
        add_rel_model.find('input[name=name]').val(rel_name);
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(1);
    });
    it('should allow ability to edit/remove relationships and fields', function () {

        // Factories
        let ff = $scope.field_factory;
        let rf = $scope.relationship_factory;

        // Field
        let field_name = 'Field';
        let new_field_name = 'Field2';
        let field_opts = {"name": field_name, "type": 'FieldType'};
        let field = ff.make_field(field_opts, $scope);

        // Relationship
        let rel_name = 'Rel';
        let new_rel_name = 'Rel2';
        let rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        let rel = rf.make_relationship(rel_opts);

        let model_opts = {"name": 'ModelAddRelAndField'};
        let model = $scope.model_factory(model_opts, $scope);
        model.fields.push(field);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect($scope.models[0].fields[0].name).toBe(field_name);
        let edit_field_model_id = $scope.edit_field(0, 0);
        let edit_field_model = jQuery('#'+edit_field_model_id);
        edit_field_model.find('input[name=name]').val(new_field_name);
        edit_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields[0].name).toBe(new_field_name);

        let remove_field_model_id = $scope.remove_field(0, 0);
        let remove_field_model = jQuery('#'+remove_field_model_id);
        remove_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(0);
        expect($scope.models[0].relationships[0].name).toBe(rel_name);

        let edit_rel_model_id = $scope.edit_relationship(0, 0);
        let edit_rel_model = jQuery('#'+edit_rel_model_id);
        edit_rel_model.find('.btn-primary').click();
        edit_rel_model.find('input[name=name]').val(new_rel_name);
        edit_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships[0].name).toBe(new_rel_name);

        let remove_rel_model_id = $scope.remove_relationship(0, 0);
        let remove_rel_model = jQuery('#'+remove_rel_model_id);
        remove_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(0);
    });
    it('should have ability to add fields', function () {
        let model_opts = {"name": 'ModelAddField'};
        let model = $scope.model_factory(model_opts, $scope);
        $scope.models.push(model);
        expect($scope.models[0].fields.length).toBe(0);

        let add_field_model_id = $scope.add_field(0);
        let add_field_model = jQuery('#'+add_field_model_id);
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(0);
        add_field_model.find('input[name=name]').val('field');
        add_field_model.find('.btn-primary').click();
        expect($scope.models[0].fields.length).toBe(1);
    });
    it('should have ability to add relationships', function () {
        let model_opts = {"name": 'ModelAddRel'};
        let model = $scope.model_factory(model_opts, $scope);
        $scope.models.push(model);
        expect($scope.models[0].relationships.length).toBe(0);
        let add_rel_model_id = $scope.add_relationship(0);
        let add_rel_model = jQuery('#'+add_rel_model_id);
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(0);
        add_rel_model.find('input[name=name]').val('field');
        add_rel_model.find('.btn-primary').click();
        expect($scope.models[0].relationships.length).toBe(1);
    });
});
