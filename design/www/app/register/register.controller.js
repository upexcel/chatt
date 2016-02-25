 (function() {
    'use strict';

    angular.module('starter')
        .controller('registerController', registerController);

    function registerController($scope, $state, registerFactory,  $localStorage, tostService, deviceService, timeStorage) {
            console.log('Register Controller');
            this.user={
                name:'',
                email:'',
                password:'',
                };
            var currentTimestamp = _.now();
            var deviceUUID = deviceService.getuuid();
            var devicePlatform = deviceService.platform();
            this.register = function() {
                $state.go('verification');
                this.registerSpinner = true;
                timeStorage.set('userEmail',this.user.email,1);
                delete $localStorage.fromLoginPage;
                var query = registerFactory.save({
                    action_type:'manual_register',
                    social_id:'',
                    platform:devicePlatform,
                    token:$localStorage.gcmToken,
                    action:'login_register',
                    device_id:deviceUUID,
                    email: this.user.email,
                    name: this.user.name,
                    password: this.user.password,
                    currentTimestamp:currentTimestamp
                });
                query.$promise.then(function(data) {
                    $scope.registerSpinner = false;
                    console.log(data);
                    tostService.notify(data.message, 'top');
                    if(data.data.show_verification == '1'){
                        $state.go('verification');
                    }
                });
        };
    }
})();