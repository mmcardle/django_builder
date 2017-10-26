'use strict';

/* jasmine specs for services go here */

describe('service', function () {
    beforeEach(module('builder.services'));

    var $scope, $http, $rootScope, model_factory, field_factory, parserFactory,
        relationship_factory, message_service, renderFactory, tarballFactory;

    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $http = $injector.get('$http');
        model_factory = $injector.get('ModelFactory');
        field_factory = $injector.get('FieldFactory');
        relationship_factory = $injector.get('RelationshipFactory');
        message_service = $injector.get('MessageService');
        renderFactory = $injector.get('RenderFactory');
        tarballFactory = $injector.get('TarballFactory');
        parserFactory = $injector.get('ModelParser');
        $scope = $rootScope.$new();
        // Prepare $scope
        $scope.models = [];
        $scope.messageService = new message_service();
        $scope.field_factory = new field_factory();
        $scope.relationship_factory = new relationship_factory();
        $scope.render_factory = new renderFactory();
        $scope.model_factory = model_factory;
    }));

    it('parserFactory correctly parses a model', function (done) {
        const pfactory = parserFactory($scope)
        const model_text = "class MyModel(Model):\n";
        pfactory.parse(new Blob([model_text]), function(models){
            expect(models.length).toBe(1)
            expect(models[0].name).toBe('MyModel')
            expect(models[0].fields.length).toBe(0)
            done()
        })
    });

    it('parserFactory correctly parses a model with numbers', function (done) {
        const pfactory = parserFactory($scope)
        const model_text = "class MyModel01(Model):\n";
        pfactory.parse(new Blob([model_text]), function(models){
            expect(models.length).toBe(1)
            expect(models[0].name).toBe('MyModel01')
            expect(models[0].fields.length).toBe(0)
            done()
        })
    });

    it('parserFactory correctly parses a model with fields', function (done) {
        const pfactory = parserFactory($scope)
        const model_text = "class MyModelWithFields(Model):\n    name = models.CharField(max_length=255)\n";
        pfactory.parse(new Blob([model_text]), function(models){
            expect(models.length).toBe(1)
            expect(models[0].name).toBe('MyModelWithFields')
            expect(models[0].fields.length).toBe(1)
            expect(models[0].fields[0].name).toBe('name')
            done()
        })
    });

    it('have message service checks', function () {
        var ms = new message_service();

        // Test no callbacks
        ms.simple_info('', '');
        ms.simple_form('', '', undefined);
        ms.simple_input('', '');
        ms.simple_confirm('', '');

        var title = 'title';
        var message = 'message';
        var error = ms.simple_error(title, message);
        expect(error.find('.modal-header').text()).toBe(title);
        expect(error.find('.modal-body').text()).toBe(message);

        var info = ms.simple_info(title, message);
        expect(info.find('.modal-header').text()).toBe(title);
        expect(info.find('.modal-body').text()).toBe(message);

        var counter = 0;
        var confirm = ms.simple_confirm(title, message,  function(){counter+=1;});
        expect(confirm.find('.modal-header').text()).toBe(title);
        expect(confirm.find('.modal-body').text()).toBe(message);
        confirm.find('.btn-primary').click();
        expect(counter).toBe(1);

        var field_name = 'input';
        var field_val = 'val';
        var form_val = undefined;
        var input = jQuery('<input>').attr('name', field_name);
        var form = jQuery('<form>').append(input);

        var simple_form = ms.simple_form(title, message, form,
            function(return_form){form_val=return_form;}
        );
        expect(simple_form.find('.modal-header').text()).toBe(title);
        expect(simple_form.find('.modal-body').text()).toBe(message);
        simple_form.find('input').val(field_val);
        simple_form.find('.btn-primary').click();
        expect(jQuery(form_val).serialize()).toBe(field_name+'='+field_val);

        var simple_input_val = 'val';
        var returned_val = '';
        var simple_input_callback = function(callback_val){returned_val=callback_val};
        var simple_input = ms.simple_input(title, message, '', simple_input_callback);
        expect(simple_input.find('.modal-header').text()).toBe(title);
        expect(simple_input.find('.modal-body').text()).toBe(message+'error message');
        simple_input.find('input').val(simple_input_val);
        simple_input.find('.btn-primary').click();
        expect(returned_val).toBe(simple_input_val);

    });
    it('renders correctly', function () {
        expect($scope.render_factory.new_lines().length).toBe(1);
        expect($scope.render_factory.new_lines(1).length).toBe(1);
        expect($scope.render_factory.new_lines(2).length).toBe(2);

        expect($scope.render_factory.spaces().length).toBe(1);
        expect($scope.render_factory.spaces(1).length).toBe(1);
        expect($scope.render_factory.spaces(2).length).toBe(2);

        var render0 = $scope.render_factory.render_all('app_name', []);
        expect(render0.length).toBeGreaterThan(500);
        var model_name = 'Model';
        var model_opts = {"name": model_name};
        var model = model_factory(model_opts, $scope);
        var render1 = $scope.render_factory.render_all('app_name', [model]);
        expect(render1.length).toBeGreaterThan(2000);
        expect(render1.indexOf(model_name)).toBeGreaterThan(0);

    });
    it('has model factory tests', function () {
        var ff = new field_factory();
        var rf = new relationship_factory();

        // Model
        var model_opts = {"name": 'Model'};
        var model = model_factory(model_opts, $scope);

        expect(model.readable_fields().length).toBe(0);

        // Test Render no fields/relationships
        model.render_model_class('app_name', $scope.render_factory);

        // Field
        var field_name = 'Field';
        var field_opts = {"name": field_name, "type": 'FieldType'};
        var field = ff.make_field(field_opts, $scope);
        model.fields.push(field);

        expect(model.readable_fields().length).toBe(1);

        // Relationship
        var rel_name = 'Rel';
        var rel_opts = {"name": rel_name, "type": 'RelType', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);
        model.relationships.push(rel);
        $scope.models.push(model);

        expect(model.has_relationship(rel_name)).toBe(true);
        expect(model.has_field(field_name)).toBe(true);
        expect(model.name_field()).toBe('pk');
        expect(model.ordering_field()).toBe('pk');
        expect(model.identifier()).toBe('pk');

        // unreadable Field
        var un_field_name = 'Unreadable';
        var un_field_opts = {"name": un_field_name, "type": 'FieldType', 'opts': 'readonly=true'};
        var un_field = ff.make_field(un_field_opts, $scope);
        model.fields.push(un_field);

        expect(model.readable_fields().length).toBe(1);

        // auto_now_add Field
        var auto_add_field_name = 'Unreadable';
        var auto_add_field_opts = {"name": un_field_name, "type": 'FieldType', 'opts': 'auto_now_add=true'};
        var auto_add_field = ff.make_field(un_field_opts, $scope);
        model.fields.push(auto_add_field);

        expect(model.readable_fields().length).toBe(1);

        // Name Field
        var field_name_2 = 'name';
        var field_opts_2 = {"name": field_name_2, "type": 'FieldType'};
        var field_2 = ff.make_field(field_opts_2, $scope);
        model.fields.push(field_2);
        expect(model.name_field()).toBe(field_name_2);

        // Created Field
        var field_name_3 = 'created';
        var field_opts_3 = {"name": field_name_3, "type": 'FieldType'};
        var field_3 = ff.make_field(field_opts_3, $scope);
        model.fields.push(field_3);
        expect(model.ordering_field()).toBe(field_name_3);

        // Slug Field
        var field_name_4 = 'slug';
        var field_opts_4 = {"name": field_name_4, "type": 'FieldType'};
        var field_4 = ff.make_field(field_opts_4, $scope);
        model.fields.push(field_4);
        expect(model.identifier()).toBe(field_name_4);
        
    });
    it('have field factory checks', function () {
        var ff = new field_factory();

        var field_opts = {"name": 'Field', "type": 'django.db.models.TextField'};
        var field = ff.make_field(field_opts, $scope);

        var edit_form = field.edit_form($scope);

        edit_form.find('input[name=name]').val('name');
        edit_form.find('select[name=type]').val('type');
        edit_form.find('input[name=opts]').val('opts');
        field.form_update(edit_form);
    });

    it('have relationship factory checks', function () {
        var rf = new relationship_factory();
        var rel_opts = {"name": 'Rel', "type": 'django.db.models.ForeignKey', "to": 'RelTo'};
        var rel = rf.make_relationship(rel_opts);

        var rel_edit_form = rel.edit_form($scope);
        rel_edit_form.find('input[name=name]').val('name');
        rel_edit_form.find('select[name=type]').val('RelType');
        rel_edit_form.find('input[name=opts]').val('opts');
        rel_edit_form.find('input[name=to]').val('to');
        rel.form_update(rel_edit_form);
    });
});
