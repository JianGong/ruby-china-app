(function() {
  'use strict';

  angular
    .module('app.service')
    .factory('AuthService', AuthService);

  ////////////////////////////////////////////////////////////

  /* @ngInject */
  function AuthService($q, $http, $cookies, OAuth, rbchina_api) {
    var LOCAL_TOKEN_KEY;
    var authToken;
    var service = {
      login: login,
      logout: logout,
      getUserInfo: getUserInfo,
      getAccessToken: getAccessToken,
      isAuthencated: isAuthencated,
      getCurrentUser: getCurrentUser
    };

    // 载入用户登录信息
    loadUserCredentials();

    return service;

    // 加载用户验证信息
    function loadUserCredentials() {
      var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
      if (token) {
        useCredentials(token);
      }
    }

    // 存储用户验证信息
    function storeUserCredentials(token) {
      window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
      useCredentials(token);
    }

    // 激活用户验证
    function useCredentials(token) {
      authToken = token;
      $cookies.putObject('access_token', token);
      // Set the token as header for your requests!
      $http.defaults.headers.common['X-Auth-Token'] = token;
    }

    // 销毁用户验证
    function destroyUserCredentials() {
      authToken = undefined;
      $http.defaults.headers.common['X-Auth-Token'] = undefined;
      window.localStorage.removeItem(LOCAL_TOKEN_KEY);
      OAuth.revokeToken();
      setCurrentUser({});
    }

    function getUserInfo(login) {
      var q = $q.defer();
      var url = rbchina_api.url_prefix + '/users/' + login + '.json';
      $http.get(url)
        .success(function(result) {
          q.resolve(result);
        }).error(function(err) {
          q.reject(err);
        });
      return q.promise;
    }

    function setCurrentUser(user) {
      $cookies.putObject('current_user', user);
    }

    function getCurrentUser() {
      return $cookies.getObject('current_user');
    }

    function login(user) {
      var q = $q.defer();
      if (!user.username) {
        q.reject("请填写用户！");
        return q.promise;
      }
      if (user.username.match(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/)) {
        q.reject("暂不支持邮箱登录！");
        return q.promise;
      }
      if (!user.password) {
        q.reject("请填写密码！");
        return q.promise;
      }
      OAuth.getAccessToken(user)
        .then(function(result) {
          storeUserCredentials(result.data.access_token);
          // 获取用户信息并存储
          getUserInfo(user.username)
            .then(function(response) {
              // 输出用户信息
              setCurrentUser(response.user);
              q.resolve(response.user);
            }).catch(function(error) {
              q.reject(error);
            });
        }).catch(function(err) {
          q.reject("用户名或密码错误！");
        });
      return q.promise;
    }

    function logout() {
      destroyUserCredentials();
    }

    function isAuthencated() {
      return !!authToken && getCurrentUser();
    }

    function getAccessToken() {
      return authToken || $cookies.getObject('access_token');
    }
  }

})();