(function() {
    'use strict';

    angular.module('chattapp')
        .controller('chatPageHeaderDirectiveController', chatPageHeaderDirectiveController);

    function chatPageHeaderDirectiveController($state, timeStorage, cameraService, profileImageFactory, $ionicPopover, $scope, $ionicModal, $stateParams, getRoomInfoFactory, socketService, $ionicActionSheet, tostService, $ionicHistory, $interval, chatsService, getUserProfileFactory, timeZoneService, sqliteService, $ionicLoading, $ionicScrollDelegate) {

        var self = this;
        self.leaveGroupSpinner = false;
        self.deleteGroupSpinner = false;
        var chatWithUserData = timeStorage.get('chatWithUserData');
        self.name = chatWithUserData.name;
        self.image = chatWithUserData.pic;
        self.id = chatWithUserData.id;
        if (!isNaN(chatWithUserData.lastSeen)) {
            self.lastSeen = moment.unix(chatWithUserData.lastSeen).tz(timeZoneService.getTimeZone()).format("hh:mm a");
        } else {
            self.lastSeen = chatWithUserData.lastSeen;
        }
        self.goBack = function() {
            $state.go('app.chats');
        };
        self.openModelWithSpinner = true;
        if (!chatWithUserData.id) {
            infoApi();
        } else {
            infoApiUser(self.id);
        }

        function infoApi() {
            var userData = timeStorage.get('userData');
            var query = getRoomInfoFactory.save({
                accessToken: userData.data.access_token,
                room_id: $stateParams.roomId,
                currentTimestamp: _.now()
            });
            query.$promise.then(function(data) {
                console.log(data);
                if (data.data.admin_friends_not_room_members) {
                    for (var i = 0; i < data.data.admin_friends_not_room_members.length; i++) {
                        data.data.admin_friends_not_room_members[i].last_seen = moment.unix(data.data.admin_friends_not_room_members[i].last_seen).tz(timeZoneService.getTimeZone()).format("Do MMMM hh:mm a");
                    }
                    self.admin_friends_not_room_members = data.data.admin_friends_not_room_members;
                }
                self.openModelWithSpinner = false;
                self.is_room_owner = data.data.room.is_room_owner;
                self.infoNameShort = data.data.room.short_room_name;
                self.infoName = data.data.room.room_name;
                self.infoId = data.data.room.id;
                if (data.data.room_notification_status == 1) {
                    self.muteNotifications = true;
                } else {
                    self.muteNotifications = false;
                }
                if (data.data.room.room_image == '') {
                    self.infoImage = 'lib/group.png';
                } else {
                    self.infoImage = data.data.room.room_image;
                }
                if (data.data.room.room_background == '') {
                    self.infoBackground = 'lib/group.png';
                } else {
                    self.infoBackground = data.data.room.room_image;
                }
                self.infoCreatedOn = moment(parseInt(data.data.room.registration_time)).format("Do MMMM hh:mm a");
                self.infoDescription = data.data.room.room_description;
                for (var i = 0; i < data.data.room.room_users.length; i++) {
                    if (data.data.room.room_users[i].id == data.data.room.room_owner.id) {
                        data.data.room.room_users[i].name = data.data.room.room_users[i].name + ' (owner)';
                        data.data.room.room_users[i].owner = true;
                    }
                    data.data.room.room_users[i].last_seen = moment.unix(data.data.room.room_users[i].last_seen).tz(timeZoneService.getTimeZone()).format("Do MMMM hh:mm a");
                }
                self.infoUserList = data.data.room.room_users;
            });
        }

        function infoApiUser(userId) {
            var userData = timeStorage.get('userData');
            var query = getUserProfileFactory.save({
                accessToken: userData.data.access_token,
                user_id: userId,
                currentTimestamp: _.now()
            });
            query.$promise.then(function(data) {
                self.displayUserProfileName = data.data.name;
                self.displayUserProfileId = data.data.user_id;
                self.displayUserProfileLastSeenInTimeStamp = data.data.last_seen;
                if (data.data.profile_image) {
                    self.displayUserProfileImage = data.data.profile_image;
                } else {
                    self.displayUserProfileImage = "img/user.png";
                }
                var lastOnline = (_.now() - data.data.last_seen) / 1000;
                if (lastOnline > 86400) {
                    self.displayUserProfileLastSeen = moment(parseInt(data.data.last_seen)).format("MMMM Do YYYY, h:mm a");
                } else {
                    self.displayUserProfileLastSeen = moment(parseInt(data.data.last_seen)).format("h:mm a");
                }
                self.displayUserProfilePrivateRooms = data.data.user_private_rooms;
                self.displayUserProfilePublicRooms = data.data.user_public_rooms;
                self.displayUserProfileStatus = data.data.profile_status;
            });
        }
        self.openInfo = function() {
            $ionicScrollDelegate.scrollTop();
            self.deleteIconRotate = -1;
            if (!chatWithUserData.id) {
                infoApi();
                $scope.infoModel.show();
            } else {
                infoApiUser(self.id);
                $scope.infoModelUser.show();
            }
        };
        var hideSheet;
        self.leaveGroup = function() {
            $scope.infoModel.hide();
            hideSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<p class="text-center">Yes</p>'
                }],
                titleText: 'Confirm to leave ' + self.infoName + ' !',
                cancelText: 'Cancel',
                cancel: function() {},
                buttonClicked: function(index) {
                    if (index == 0) {
                        self.leaveGroupSpinner = true;
                        socketService.leaveGroup($stateParams.roomId);
                    }
                }
            });
        }
        $scope.$on('leaved_public_group', function(event, data) {
            hideSheet();
            tostService.notify(data.data.data.message, 'top');
            $state.go('app.chats');
        });
        self.deleteUserFromGroup = function(userData, index) {
            $scope.infoModel.hide();
            var deleteUserFromGroupSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<p class="text-center">Yes</p>'
                }],
                titleText: 'Confirm to delete ' + userData.name + ' From ' + self.infoName + ' !',
                cancelText: 'Cancel',
                cancel: function() {},
                buttonClicked: function(index) {
                    if (index == 0) {
                        deleteUserFromGroupSheet();
                        $scope.infoModel.show();
                        socketService.removeUserFromGroup(userData, $stateParams.roomId);
                    }
                }
            });
        }
        $scope.$on('removed_public_room_member', function(event, data) {
            infoApi();
        });
        $scope.$on('got_user_profile_for_room', function(event, data) {
            self.lastSeen = moment.unix(data.data.data.last_seen).tz(timeZoneService.getTimeZone()).format("hh:mm a");
        });
        $ionicModal.fromTemplateUrl('infoModel.html', function($ionicModal) {
            $scope.infoModel = $ionicModal;
        }, {
            scope: $scope
        });
        $ionicModal.fromTemplateUrl('infoModelUser.html', function($ionicModal) {
            $scope.infoModelUser = $ionicModal;
        }, {
            scope: $scope
        });
        var getUserProfileForRoomInterval = $interval(function() {
            if ($ionicHistory.currentView().stateName != 'app.chatpage') {
                $interval.cancel(getUserProfileForRoomInterval);
            } else {
                if (self.id) {
                    socketService.getUserProfileForRoom($stateParams.roomId, self.id);
                }
            }
        }, 60000);
        self.deleteRoom = function() {
            $scope.infoModel.hide();
            var deleteRoomSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<p class="text-center">Yes</p>'
                }],
                titleText: 'Confirm to delete ' + self.infoName + ' !',
                cancelText: 'Cancel',
                cancel: function() {
                    $scope.infoModel.show();
                },
                buttonClicked: function(index) {
                    if (index == 0) {
                        self.deleteGroupSpinner = true;
                        deleteRoomSheet();
                        socketService.deleteRoom($stateParams.roomId);
                        $scope.infoModel.show();
                    }
                }
            });
        }
        $scope.$on('deleted_public_room', function(event, data) {
            $scope.infoModel.hide();
            chatsService.listMyRooms();
            tostService.notify(data.data.message, 'top');
            $state.go('app.chats');
        });
        $ionicModal.fromTemplateUrl('app/profile/template/imgCropModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.imageModal = modal;
        });
        self.infoUserClick = function(userData) {
            self.displayUserProfileName = '';
            self.displayUserProfileId = '';
            self.displayUserProfileLastSeenInTimeStamp = '';
            self.displayUserProfileImage = '';
            self.displayUserProfileLastSeen = '';
            self.displayUserProfilePrivateRooms = '';
            self.displayUserProfilePublicRooms = '';
            self.displayUserProfileStatus = '';
            infoApiUser(userData.id);
            $scope.infoModelUser.show();
        };
        self.editProfilePic = function() {
            $scope.myCroppedImage = '';
            cameraService.changePic().then(function(imageData) {
                $scope.imageModal.show();
                var img = "data:image/jpeg;base64," + imageData;
                $scope.myimage = img;
            }, function(err) {
                window.plugins.toast.showShortTop('Unable to retrieve image');
            });
        };
        $scope.result = function(image) {
            $scope.myCroppedImage = image;
        };

        function fixBinary(bin) {
            var length = bin.length;
            var buf = new ArrayBuffer(length);
            var arr = new Uint8Array(buf);
            for (var i = 0; i < length; i++) {
                arr[i] = bin.charCodeAt(i);
            }
            return buf;
        }
        $scope.imgChange = function() {
            if ($scope.myCroppedImage) {
                $scope.startLoading = true;
                var imageBase64 = $scope.myCroppedImage.replace(/^data:image\/(png|jpeg);base64,/, "");
                var binary = fixBinary(atob(imageBase64));
                var blob = new Blob([binary], {
                    type: 'image/png',
                    name: 'png'
                });
                blob.name = 'png';
                blob.$ngfName = 'png';
                var query = profileImageFactory.upload({
                    file: blob,
                    currentTimestamp: Date.now(),
                    append_data: {
                        room_id: self.infoId,
                        file_type: 'room_image',
                        accessToken: timeStorage.get('userData').data.access_token,
                    }
                });
                query.then(function(data) {

                    if (data.data.status == 1) {
                        self.infoImage = data.data.data.url;
                        $scope.startLoading = false;
                        $scope.imageModal.hide();
                    } else {
                        $scope.startLoading = false;
                        window.plugins.toast.showShortTop('Image not upload');
                    }
                });

            } else {
                window.plugins.toast.showShortTop('Please set your pic');
            }
        };
        $scope.imgCancel = function() {
            $scope.imageModal.hide();
        };
        $scope.stopLoading = function() {
            $scope.startLoading = false;
            $scope.start = false;
        };
        $ionicPopover.fromTemplateUrl('app/chatpage/templates/privateChatPopover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
        });
        self.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $ionicPopover.fromTemplateUrl('app/chatpage/templates/publicChatPopover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.openGroupPopover = popover;
        });
        self.openGroupPopover = function($event) {
            $scope.openGroupPopover.show($event);
        };
        self.leavePrivateChat = function() {
            var leaveChatSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<p class="text-center">Yes</p>'
                }],
                titleText: 'Confirm to Leave!',
                cancelText: 'Cancel',
                cancel: function() {},
                buttonClicked: function(index) {
                    if (index == 0) {
                        socketService.leavePrivateChat($stateParams.roomId);
                    }
                }
            });
        }
        $scope.$on('private_room_deleted', function(event, data) {
            sqliteService.leavePrivateChat($stateParams.roomId);
            $state.go('app.chats');
        });
        self.blockPrivateUser = function(){
            var blockPrivateUserSheet = $ionicActionSheet.show({
                buttons: [{
                        text: '<p class="text-center">Yes</p>'
                    }],
                titleText: 'Confirm to Block!',
                cancelText: 'Cancel',
                cancel: function() {
                },
                buttonClicked: function(index) {
                    if (index == 0) {
                        socketService.blockPrivateUser($stateParams.roomId);
                    }
                }
            });
        };
        $scope.$on('private_room_blocked', function(event, data) {
            sqliteService.leavePrivateChat($stateParams.roomId);
            $state.go('app.chats');
        });
        self.addInGroup = function(){
            $state.go('app.addInGroup');
            $scope.popover.hide();
        }
        $ionicPopover.fromTemplateUrl('app/chatpage/templates/attachfilepopover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.openAttachFilePopover = popover;
        });
        self.openAttachFilePopover = function($event) {
            $scope.openAttachFilePopover.show($event);
        };
        self.attachImage = function() {
            cameraService.changePic().then(function(imageData) {
                $ionicLoading.hide();
            }, function(err) {
                $ionicLoading.hide();
            });
        };
        self.inviteInGroup = function() {
            timeStorage.set('inviteInGroupId', $stateParams.roomId, 1);
        }
        self.mute = function() {
            if (self.muteNotifications == true) {
                socketService.unMuteGroup($stateParams.roomId);
            } else {
                socketService.muteGroup($stateParams.roomId);
            }

            $scope.$on('room_notification_muted', function(event, data) {
                tostService.notify(data.data.data.message, 'top');
            });
            $scope.$on('room_notification_unmuted', function(event, data) {
                tostService.notify(data.data.data.message, 'top');
            });
        }
    }
})();