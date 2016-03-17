 (function() {
     'use strict';

     angular.module('chattapp')
         .controller('chatPageFooterDirectiveController', chatPageFooterDirectiveController);

     function chatPageFooterDirectiveController($rootScope, $state, $timeout, $ionicScrollDelegate, chatPageFactory, $ionicLoading, $ionicHistory, timeStorage, socketService, $stateParams, sqliteService, chatpageService) { 
        var self = this;
        var userData = timeStorage.get('userData');
        self.image = userData.data.profile_image;
        self.name = userData.data.name;
        self.user_id = userData.data.user_id;
        self.sendMessage = function() {
            sqliteService.messageToBeSend(self.message, userData.data.user_id, $stateParams.roomId, _.now()).then(function(lastInsertId){
                socketService.room_message(lastInsertId, $stateParams.roomId, self.message);
                var currentMessage = {
                 "id": lastInsertId,
                 "image": userData.data.profile_image,
                 "message": self.message,
                 "messageTime": moment(_.now()).format("hh:mm a"),
                 "timeStamp": _.now(),
                 "name": userData.data.name,
                 "user_id":userData.data.user_id,
                 "message_status":'post'
                }
                $rootScope.$broadcast('displayChatMessages', { data: currentMessage });
                $ionicScrollDelegate.scrollBottom(false);
                self.message = '';
            })
             $ionicScrollDelegate.scrollBottom(false);
         }
         self.inputUp = function() {
            console.log('inputUp');
             $timeout(function() {
                 $ionicScrollDelegate.scrollBottom(false);
             }, 300);
         };
         self.inputDown = function() {
            console.log('inputDown');
             $ionicScrollDelegate.resize();
         };
     }
 })();