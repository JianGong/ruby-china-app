(function() {
  'use strict';

  angular
    .module('app.service')
    .factory('UserService', UserService);

  ////////////////////////////////////////////////////////////

  /* @ngInject */
  function UserService($q, $http, AuthService, rbchina_api) {
    var service = {
      getUserTopics: getUserTopics,
      getUserNotifications: getUserNotifications
    };

    return service;


    // 获取用户创建列表
    function getUserTopics(login) {
      var q = $q.defer();
      var url = rbchina_api.url_prefix + '/users/' + login + '/topics.json';
      $http.get(url)
        .success(function(result) {
          q.resolve(result);
        }).error(function(err) {
          q.reject(err);
        });
      return q.promise;
    }

    // 获取用户通知列表
    function getUserNotifications() {
      var q = $q.defer();
      var url = rbchina_api.url_prefix + '/notifications.json';
      url = url.concat('?access_token=' + AuthService.getAccessToken());
      $http.get(url)
        .success(function(result) {
          q.resolve(result.notifications);
        }).error(function(err) {
          q.reject(err);
        });
      return q.promise;
    }
  }

})();