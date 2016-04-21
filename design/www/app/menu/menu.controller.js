(function() {
    'use strict';

    angular.module('chattapp')
            .controller('menuController', menuController);

    function menuController($scope, $ionicPopover,$ionicPlatform,$ionicHistory, tostService, $localStorage, Onsuccess, $state, timeStorage, $rootScope) {
        console.log('menuController');
        var self = this;
        self.chattab = true;
        $ionicPopover.fromTemplateUrl('templates/popover.html', {
            scope: $scope,
        }).then(function(popover) {
            self.popover = popover;
        });
        self.search = function(state) {
            if (timeStorage.get('network')) {
                window.plugins.toast.showShortTop('You need to online to access this');
            }
            else
            {
                $state.go(state);
            }
        };
        Onsuccess.footerTab(function(a, b, c, d) {
            self.chattab = a;
            self.searchb = b;
            self.setting = c;
            self.group = d;
        });
        var count = 0;
        $ionicPlatform.registerBackButtonAction(function() {
            var view = $ionicHistory.currentView();
            if (view.stateId == 'login' && count == 0 || view.stateId == 'app.chats' && count == 0) {
                tostService.notify('Press Back Button Again To Exit The App!', 'Bottom');
                count++;
                $timeout(function() {
                    count = 0;
                }, 3000);
            } else if (view.stateId == 'login' && count == 1 || view.stateId == 'app.chats' && count == 1) {
                navigator.app.exitApp();
                count = 0;
            } else {
                $ionicHistory.goBack();
                count = 0;
            }
        }, 100);
    }
})();