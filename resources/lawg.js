"use strict";

var app = angular.module('lawg', ['luegg.directives', 'angucomplete-alt']);

app.controller('LawgRootController', ['$http', '$scope', '$timeout', function($http, $scope, $timeout) {
    $scope.lawg_formatter = function(str) {
      return { partial : str , key : $scope.lawg_key };
    };

    $scope.lawg_selection = function(selection) {
      if(selection) {
        $timeout.cancel($scope.tout_promise);
        $scope.lawg_content = '';
        $scope.lawgd_offset = 0;
        $scope.tout_promise = $timeout($scope.lawg_update, 1000, true, selection.title);
      }
    };

    $scope.lawg_update = function(filename) {
      var mydata = { key : $scope.lawg_key, filename : filename, offset : $scope.lawgd_offset };
      $http.get('/retrieve', { params : mydata }).success(function(results) {
        console.log(results);
        $scope.lawg_content += results.data;
        $scope.lawgd_offset = results.offset;

        $scope.tout_promise = $timeout($scope.lawg_update, 1000, true, filename);
      });
    };

    $scope.lawg_key = 'bef3h27sh27s472g36dgjmdh';
    $scope.lawgd_offset = 0;
    $scope.lawg_content = 'Output will be shown here';
}]);
