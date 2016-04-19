angular.module('chattapp')
        .directive('input', function($timeout) {
            return {
                restrict: 'E',
                scope: {
                    'returnClose': '=',
                    'onReturn': '&',
                    'onFocus': '&',
                    'onClick': '&',
                    'onBlur': '&',
                    'trigger': '@isFocused'
                },
                link: function(scope, element, attr) {
                    element.bind('focus', function(e) {
                        if (scope.onFocus) {
                            $timeout(function() {
                                scope.onFocus();
                            });
                        }
                    });
                    element.bind('blur', function(e) {
                        if (scope.onBlur) {
                            $timeout(function() {
                                scope.onBlur();
                                // element[0].focus();
                            });
                        }
                    });
                    element.bind('keydown', function(e) {
                        if (e.which == 13) {
                            if (scope.returnClose)
                                element[0].blur();
                            if (scope.onReturn) {
                                $timeout(function() {
                                    scope.onReturn();
                                });
                            }
                        }
                    });

                    scope.$watch('trigger', function(value) {
                        if (value === "true") {
                            $timeout(function() {
                                element[0].focus();

                                element.on('blur', function() {
                                    element[0].focus();
                                });
                            });
                        }

                    });
                }
            };
        });