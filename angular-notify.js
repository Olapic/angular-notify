angular.module('cgNotify', []).factory('notify',['$timeout','$http','$compile','$templateCache','$rootScope',
    function($timeout,$http,$compile,$templateCache,$rootScope){

        var defaultDuration = 10000;
        var defaultAnimationDuration = 0;
        var defaultTemplateUrl = 'angular-notify.html';
        var position = 'center';
        var container = document.body;
        var maximumOpen = 0;

        var messageElements = [];
        var openNotificationsScope = [];

        var notify = function(args){

            if (typeof args !== 'object'){
                args = {message:args};
            }

            args.duration = args.duration ? args.duration : defaultDuration;
            args.animationDuration = args.animationDuration ? args.animationDuration : defaultAnimationDuration;
            args.templateUrl = args.templateUrl ? args.templateUrl : defaultTemplateUrl;
            args.container = args.container ? args.container : container;
            args.classes = args.classes ? args.classes : '';
            args.openAnimationClass = args.openAnimationClass ? args.openAnimationClass : '';
            args.closeAnimationClass = args.closeAnimationClass ? args.closeAnimationClass : '';

            var scope = args.scope ? args.scope.$new() : $rootScope.$new();
            scope.$position = args.position ? args.position : position;
            scope.$message = args.message;
            scope.$classes = args.classes;
            scope.$messageTemplate = args.messageTemplate;

            if (maximumOpen > 0) {
                var numToClose = (openNotificationsScope.length + 1) - maximumOpen;
                for (var i = 0; i < numToClose; i++) {
                    openNotificationsScope.pop().$close(true);
                }
            }

            $http.get(args.templateUrl,{cache: $templateCache}).success(function(template){

                var templateElement = $compile(template)(scope);

                if (args.messageTemplate){
                    var messageTemplateElement;
                    for (var i = 0; i < templateElement.children().length; i ++){
                        if (angular.element(templateElement.children()[i]).hasClass('cg-notify-message-template')){
                            messageTemplateElement = angular.element(templateElement.children()[i]);
                            break;
                        }
                    }
                    if (messageTemplateElement){
                        messageTemplateElement.append($compile(args.messageTemplate)(scope));
                    } else {
                        throw new Error('cgNotify could not find the .cg-notify-message-template element in '+args.templateUrl+'.');
                    }
                }

                angular.element(args.container).prepend(templateElement);
                messageElements.unshift(templateElement);

                if (scope.$position === 'center'){
                    $timeout(function(){
                        scope.$centerMargin = '-' + (templateElement[0].offsetWidth /2) + 'px';
                    });
                }

                var removeTemplateElement = function() {
                    templateElement.remove();
                    messageElements.splice(messageElements.indexOf(templateElement),1);
                };

                scope.$close = function(immediate){
                    if (immediate) {
                        removeTemplateElement();
                    } else {
                        templateElement
                            .removeClass(args.openAnimationClass)
                            .addClass(args.closeAnimationClass);

                        $timeout(function() {
                            removeTemplateElement();
                        }, args.animationDuration + 500);
                    }
                };

                $timeout(function() {
                    templateElement
                        .addClass(args.openAnimationClass)
                        .css('visibility', 'visible');
                }, 200);

                if (args.duration > 0){
                    $timeout(function(){
                        scope.$close();
                    }, args.duration + args.animationDuration + 500);
                }

            }).error(function(data){
                throw new Error('Template specified for cgNotify ('+args.templateUrl+') could not be loaded. ' + data);
            });

            var retVal = {};

            retVal.close = function(){
                if (scope.$close){
                    scope.$close();
                }
            };

            Object.defineProperty(retVal,'message',{
                get: function(){
                    return scope.$message;
                },
                set: function(val){
                    scope.$message = val;
                }
            });

            openNotificationsScope.unshift(scope);

            return retVal;

        };

        notify.config = function(args){
            defaultDuration = !angular.isUndefined(args.duration) ? args.duration : defaultDuration;
            defaultTemplateUrl = args.templateUrl ? args.templateUrl : defaultTemplateUrl;
            position = !angular.isUndefined(args.position) ? args.position : position;
            container = args.container ? args.container : container;
            maximumOpen = args.maximumOpen ? args.maximumOpen : maximumOpen;
        };

        notify.closeAll = function(){
            for(var i = 0; i < openNotificationsScope.length; i++){
                openNotificationsScope.pop().$close();
            }
        };

        return notify;
    }
]);
