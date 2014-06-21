'use strict';

/* Services */

function MessageServiceFactory() {
    return function () {
        var _this = this;
        _this.base_modal = function () {
            /*
             <div class="modal fade">
             <div class="modal-dialog">
             <div class="modal-content">
             <div class="modal-header">
             <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
             <h4 class="modal-title">Modal title</h4>
             </div>
             <div class="modal-body">
             <p>One fine body&hellip;</p>
             </div>
             <div class="modal-footer">
             <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
             <button type="button" class="btn btn-primary">Save changes</button>
             </div>
             </div><!-- /.modal-content -->
             </div><!-- /.modal-dialog -->
             </div><!-- /.modal -->
             */
            var base = $('<div>').addClass("modal fade");
            base.attr("tabindex", "-1");
            base.attr("role", "dialog");
            base.css("display", "none");

            var modal_dialog = $('<div>').addClass("modal-dialog");
            var modal_content = $('<div>').addClass("modal-content").appendTo(modal_dialog);
            var modal_header_inner = $('<h4>').addClass("modal-header-inner");
            $('<div>').addClass("modal-header").appendTo(modal_content).append(modal_header_inner);
            $('<div>').addClass("modal-body").appendTo(modal_content);
            $('<div>').addClass("modal-footer").appendTo(modal_content);

            base.append(modal_dialog);

            return base;
        };
        _this.icon = function (icon_name) {
            return $('<icon>').addClass('fa').addClass(icon_name);
        };
        _this.simple_info = function (title, message) {
            var simple_info = _this.base_modal();
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_info.find(".modal-header-inner").append(i).append($('<span>').text(title));
            simple_info.find(".modal-body").empty().append(message);
            var ok_button = $('<button>').addClass('btn btn-default').text('Ok');
            simple_info.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_info.modal();
            return simple_info;
        };
        _this.simple_confirm = function (title, message, callback) {
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message);
            var confirm_button = $('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = $('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if (callback != undefined) {
                    callback();
                }
            });
            cancel_button.attr("data-dismiss", "modal");
            confirm_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
    };
}
function ModelServiceFactory() {
    return function (options) {
        function Model(options) {
            this.name = options['name'];
            this.getInfo = function () {
                return this.name;
            };
            this.detail = function () {
                return '{% extends "base.html" %}\n\n' +
                    '{% block content %}\n' +
                    '<p>{{ object.name }} - {{ object.created}} - {{ object.last_updated}}</p>\n' +
                    '<a href="{{object.get_update_url}}">Edit ' + this.name + '</a>\n' +
                    '<hr/>\n' +
                    '{% endblock content %}\n';
            }
        }

        return new Model(options);
    };
}

angular.module('myApp.services', [])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('MessageService', [MessageServiceFactory])
    .value('version', '0.1');
