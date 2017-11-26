angular.module('zeroApp', [
    'ngRoute',
    'security.service',
    'security.interceptor',
    'security.authorization',
    'ui.bootstrap',
    'ui.select2',
    'ui.router'
])
.factory('stateService', function() {
  return {
    stateParams : null,
    state : null
  }
})
.config(['$interpolateProvider','$httpProvider','$routeProvider','$stateProvider','$urlRouterProvider','securityAuthorizationProvider','$sceProvider',
  function($interpolateProvider, $httpProvider, $routeProvider,$stateProvider, $urlRouterProvider, securityAuthorizationProvider,$sceProvider) {

    var stateService = function(state_string) {
      return function($q,$stateParams,stateService){
        var defer = $q.defer();
        stateService.stateParams = $stateParams || "";
        stateService.state = state_string;
        defer.resolve();
        return defer.promise;
      }
    }

    var getFormData = function ($q, $http, select2Data) {
      var defer = $q.defer();
      $http.get('getTicketSupplements',{cache:false})
      .success(function(data) {

        //var additional_modality_tags = ["CR", "DF", "IDEAL_LAB","MG","MR","XA CVIR","XA NIR"];
        //var additional_site_tags     = ["HOSPITAL","Cardiology (CATH-EP LABS)","LMH","GE GLOBAL","IC GLOBAL","Radiology IT"];
        //select2Data.tags_object['modality_tags']  = data.modality_list;
        //select2Data.tags_object['modality_tags'].splice(10,1); // removing MRI
        select2Data.tags_object['modality_tags']  = data['MODALITY'];//select2Data.tags_object['modality_tags'];
        select2Data.tags_object['modality_tags'].sort();
        select2Data.tags_object['location_tags']  = data['LOCATION'];//select2Data.tags_object['location_tags'];
        select2Data.tags_object['location_tags'].sort();
        select2Data.tags_object['issue_tags']     = data['ISSUE'];
        select2Data.tags_object['issue_tags'].sort();
        select2Data.tags_object['section_tags']   = data.service_list.sort();
        select2Data.tags_object['sitegroup_tags'] = data.sitegroup_list.sort();
      
        defer.resolve();
      })
      .error(function() {
        defer.reject();
      });

      return defer.promise;
    }

    $urlRouterProvider.otherwise('/');
    $sceProvider.enabled(false);

    $stateProvider
      .state('content', {
          url: "/",
          templateUrl: "zero_contentView.html",
          controller: "contentViewCtrl"
      });
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
    // THIS IS IMPORTANT TO WORK WITH DJANGO
    // THIS WAS REMOVED AFTER ANGULARJS Version 1.1.0
    //$locationProvider.html5Mode(true).hashPrefix('!');
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  }
])
.directive('responseMessages', function() {
  return {
    template: '<div>' +
          '<div class="alert alert-danger alert-dismissable" ng-if="error">' +
          '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" ng-click="reset_error()">&times;</button>' +
          '<strong>Alert!</strong> {{ msg }}' +
            '</div>' +
            '<div class="alert alert-success alert-dismissable" ng-if="success">' +
          '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" ng-click="reset_success()">&times;</button>' +
          '<strong>Success!</strong> {{ msg }}' +
          '</div>' +
          '</div>',
    restrict : 'E',
    replace : true,
    scope : {
      'error' : '=',
      'msg' : '=',
      'success' : '='
    },
    link: function(scope, element, attrs) {

      scope.reset_error = function() {
        scope.error = false;
        scope.msg = "";
      };

      scope.reset_success = function() {
        scope.success = false;
        scope.msg = "";
      };
    }
  };
})
.controller('contentViewCtrl', function($scope,$state,$http,$location,$window) {
  var getOrderedOutputObject = function(data) {
    var temp_output = {
      'firstName'   : '',
      'lastName'    : '',
      'middleName'  : '',
      'NPI'         : '',
      'contactPreference' : '',
      'email'       : [],
      'faxNum'      : [],
      'officePhone' : [],
      'mobilePhone' : [],
      'pagerNum'    : [],
      'addresses'   : []
    };

    angular.forEach(data,function(value,key) {
      temp_output[key] = value;
    });
    delete temp_output['NPI'];

    return temp_output;
  }

  function getQuery() {
    var query = "?"
    var count = 0

    angular.forEach($location.search(), function(value,key) {
      query += String(key) + "=" + String(value) + "&";
      count++;
    });

    if (count > 1) {
      query = query.slice(0,query.length -1)
    }

    return query;
  }

  $scope.$watch(function(){ return $location.search() }, function(params){
    //console.log('location changed?');
    //console.log(params);
    $http.get('/new/zero/getProvider' + getQuery())
    .success(function(data) {
      $scope.content['referring_md_provider_output'] = getOrderedOutputObject(data['referring_md_provider_output']);
      //$scope.content['referring_md_provider_output'] = data['referring_md_provider_output']
      //$scope.content['match_metrix_provider_output'] = data['match_metrix_provider_output']
      $scope.content['match_metrix_provider_output'] = getOrderedOutputObject(data['match_metrix_provider_output'])
      $scope.content['hybridized_provider_output']   = getOrderedOutputObject(data['hybridized_provider_output'])
    });
  });

  $scope.isSelectedObject = {
    'referring_md_provider_output':false,
    'match_metrix_provider_output':false,
    'hybridized_provider_output'  :false
  }

  $scope.userSelect = function(choice) {
    console.log(choice);
    $scope.isSelectedObject[choice] = !$scope.isSelectedObject[choice];
    console.log($scope.isSelectedObject[choice])
    console.log($scope.isSelectedObject);
  }

  //$http.get('/new/zero/getProvider?accession=1&institution=cornell')


  /*
  var queryStringObject = $location.search();
  if (queryStringObject) {
    if queryStringObject.hasOwnProperty('accession') && queryStringObject.hasOwnProperty('institution') {
    }
  }
  */

  $scope.content = {
    'match_metrix_provider_output'    : null,//temp_output, 
    'match_metrix_radiologist_output' : null,//temp_output, 
    'referring_md_provider_output'    : null,//temp_output, 
    'referring_md_attending_output'   : null,//temp_output
    'hybridized_provider_output'      : null
  }
  //pass
});