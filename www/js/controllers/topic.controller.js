(function() {
  'use strict';

  angular
    .module('app.controller')
    .controller('TopicController', TopicController);

  ////////////////////////////////////////////////////////////

  /* @ngInject */
  function TopicController($scope, $stateParams, $timeout, $ionicActionSheet,
    ionicMaterialInk, ionicMaterialMotion, $cordovaInAppBrowser,
    BaseService, AuthService, TopicService, CameraService) {
    var vm = this;
    vm.is_logined = false;
    vm.topic = {};
    vm.replies = [];
    vm.reply_content = "";

    // Functions
    vm.showReplyModal = showReplyModal;
    vm.closeReplyModal = closeReplyModal;
    vm.moreAction = moreAction;
    vm.createReply = createReply;

    activate();

    function activate() {
      $timeout(function() {
        ionicMaterialInk.displayEffect();
        ionicMaterialMotion.ripple();
      }, 0);

      vm.is_logined = AuthService.isAuthencated();
      vm.reply_content = "";
      BaseService.registModal('modals/reply.html', 'reply-modal', $scope);
      BaseService.showLoading('ios', '加载中...');
      return TopicService.getTopicWithReplies($stateParams.topic_id)
        .then(function(result) {
          BaseService.hideLoading();
          vm.topic = result.topic;
          vm.replies = result.replies;
          $timeout(function() {
            var exlinks = $('.ex-link');
            exlinks.click(function() {
              var url = $(this).attr('href');
              var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes'
              };
              $cordovaInAppBrowser.open(encodeURI(url), '_blank', options)
                .then(function(event) {
                  // success
                })
                .catch(function(event) {
                  // error
                });
              return false;
            });
          });
        });
    }

    function showReplyModal() {
      vm.is_logined = AuthService.isAuthencated();
      if (!vm.is_logined) {
        BaseService.showModal('login-modal');
      } else {
        BaseService.showModal('reply-modal');
      }
    }

    function closeReplyModal() {
      BaseService.hideModal('reply-modal');
    }

    function moreAction() {
      var options = {
        buttons: [{
          text: '<i class="mdi mdi-image-area"></i> 从相册添加图片'
        }, {
          text: '<i class="mdi mdi-camera"></i> 从相机添加图片'
        }],
        titleText: '更多',
        cancelText: '取消',
        buttonClicked: function(index) {
          document.addEventListener("deviceready", function() {
            var size = {
              width: 800,
              height: 600
            };
            return CameraService.getPicture(index, size, 0)
              .then(function(result) {
                BaseService.uploadPicture(result)
                  .then(function(img) {
                    var img_url = '![](' + img.image_url + ')';
                    var prev = vm.reply_content.length === 0 ? '' : vm.reply_content + "\r\n";
                    vm.reply_content = prev + img_url;
                  });
              });
          }, false);

          return true;
        }
      }
      return $ionicActionSheet.show(options);
    }


    // 提交回帖
    function createReply() {
      BaseService.showLoading('ios', '提交中...');
      TopicService.createReply($stateParams.topic_id, vm.reply_content)
        .then(function(result) {
          closeReplyModal();
          vm.replies.push(result.reply);
          vm.reply_content = "";
          BaseService.hideLoading();
        }).catch(function(err) {
          BaseService.hideLoading();
          BaseService.alert('提交回复', '', '提交失败！');
        })
    }

    $scope.$on('$ionicView.leave', function(viewInfo, state) {
      if (state.direction === "back") {
        BaseService.recycleModalById('reply-modal');
      }
    })
  }

})();