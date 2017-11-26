angular.module('reportTemplatesApp', [
  'ngRoute',
  'ngMockE2E',
  'ui.bootstrap',
  'ngSanitize',
  'ui.select2',
  'ui.router',
  'ngIdle',
  'security.service',
  'security.interceptor',
  'security.authorization'
])
.factory('stateService', function() {
  return {
    stateParams : null,
    state : null
  }
})
.factory('fileUploadResponseData', function() {
  return {
    datablock_dictionary: null
  }
})
.service('fileUpload', ['$http',function ($http) {
  this.uploadFileToUrl = function(file, uploadUrl){
    var fd = new FormData();
    fd.append('file', file);

    $http.post(uploadUrl, fd, {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    })
    .success(function(data){
      //console.log(data);
      fileUploadResponseData.datablock_dictionary = data;
    })
    .error(function(){
    });
  }
}])
.directive('fileModel', ['$parse', function ($parse) {
  return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        
        element.bind('change', function(){
          $parse(attrs.fileModel).
          assign(scope, element[0].files[0])
          scope.$apply();
        });
      }
  };
}])
.config(['$interpolateProvider','$httpProvider','$routeProvider','$stateProvider','$urlRouterProvider','$sceProvider','IdleProvider','KeepaliveProvider',
  function($interpolateProvider, $httpProvider, $routeProvider,$stateProvider, $urlRouterProvider, $sceProvider,IdleProvider, KeepaliveProvider) {

    var stateService = function(state_string) {
      return function($q,$stateParams,stateService){
        var defer = $q.defer();
        stateService.stateParams = $stateParams || "";
        stateService.state = state_string;
        defer.resolve();
        return defer.promise;
      }
    }

    $urlRouterProvider.otherwise('/one_upload');
    $sceProvider.enabled(false);

    $stateProvider
      .state('login', {
          url: "/{accession:[0-9]{0,16}}",
          templateUrl: "report_template_loginView.html",
          controller: "loginViewCtrl"
      })
      .state('report_templates_one_upload', {
          //abstract: true,
          url: "/one_upload",
          templateUrl: "report_templates_one_uploadView.html",
          controller: "report_templates_one_uploadViewCtrl",
      })
      .state('report_templates_two_verify', {
          url: "/two_verify/:file_name/:datablock_dictionary/:user_dictionary/:patient_dictionary",
          templateUrl: "report_templates_two_verifyView.html",
          controller: "report_templates_two_verifyViewCtrl",
          /*
          resolve: {
            user_auth : securityAuthorizationProvider.requireAuthenticatedUser
          }
          */
      })
      .state('report_templates_three_powerscribe', {
          url: "/three_powerscribe/:template_name/:file_name/:datablock_dictionary/:user_dictionary/:patient_dictionary/:selected_order_from_mrn",
          templateUrl: "report_templates_three_powerscribeView.html",
          controller: "report_templates_three_powerscribeViewCtrl",
          /*
          resolve: {
            user_auth : securityAuthorizationProvider.requireAuthenticatedUser
          }
          */
      });
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
    // configure Idle settings
    IdleProvider.idle(3600); // in seconds
    IdleProvider.timeout(2); // in seconds
    //KeepaliveProvider.interval(2); // in seconds:w
    // THIS IS IMPORTANT TO WORK WITH DJANGO
    // THIS WAS REMOVED AFTER ANGULARJS Version 1.1.0
    //$locationProvider.html5Mode(true).hashPrefix('!');
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  }
])
.run(function($httpBackend,Idle){
    // start watching when the app runs. also starts the Keepalive service by default.
    Idle.watch();
    $httpBackend.whenPOST('fileUpload').passThrough();
    $httpBackend.whenPOST('submitToPowerscribe').passThrough();
    $httpBackend.whenGET('getTemplateNames').passThrough();
    $httpBackend.whenGET(/getOrderByAccession.*/).passThrough();
    $httpBackend.whenGET(/getOrdersByMRN.*/).passThrough();
    $httpBackend.whenGET(/getTemplate.*/).passThrough();
    $httpBackend.whenGET(/getTaskResult.*/).passThrough();
    $httpBackend.whenGET(/getGeneratedReport.*/).passThrough();
    $httpBackend.whenGET('report_templates_one_uploadView.html').passThrough();
    $httpBackend.whenGET('report_templates_two_verifyView.html').passThrough();
    $httpBackend.whenGET('report_templates_three_powerscribeView.html').passThrough();
})
.directive('responseMessages', function() {
  return {
    template:'<div>' +
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
      'error'   : '=',
      'msg'     : '=',
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
.controller('mainViewCtrl', function($scope,$state) {
  $scope.$state = $state;
})
.controller('report_templates_one_uploadViewCtrl',function($scope,fileUpload,fileUploadResponseData,$timeout,$state,$stateParams,$http,$location,$q,Idle,stateService) {
  $scope.$state       = $state;
  //console.log($state);
  $scope.accession    = "";
  $scope.datablock_dictionary = null;

  $scope.uploadError = false;
  $scope.uploadMsg = null;

  $scope.uploadFile = function() {
    //var file = $scope.xmlFile;
    //var uploadUrl = "fileUpload";
    var fd = new FormData();

    fd.append('file', $scope.xmlFile);
    var file_name = $scope.xmlFile.name;
    console.log(file_name);
    console.log($scope.xmlFile);

    $http.post("fileUpload", fd, {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    })
    .success(function(data){
      console.log(data);
      $scope.datablock_dictionary = angular.fromJson(data.datablock_dictionary);
      $scope.uploadError = data.error;
      $scope.uploadSuccess = !data.error;
      $scope.uploadMsg = data.msg;
      $timeout(function() {
        $state.go('report_templates_two_verify', {
          "datablock_dictionary": angular.toJson(data.datablock_dictionary),
          "user_dictionary": angular.toJson(data.user_dictionary),
          "patient_dictionary": angular.toJson(data.patient_dictionary),
          "file_name": file_name 
        });
      }, 1000);
    })
    .error(function(){
    });
  }
})
.controller('report_templates_two_verifyViewCtrl',function($scope,fileUpload,fileUploadResponseData,$timeout,$state,$stateParams,$http,$location,$q,Idle,stateService) {
  console.log($state.params);
  $scope.datablock_dictionary = angular.fromJson($state.params.datablock_dictionary);
  $scope.user_dictionary = angular.fromJson($state.params.user_dictionary);
  $scope.patient_dictionary = angular.fromJson($state.params.patient_dictionary);
  $scope.file_name = $state.params.file_name;
  $scope.templateNames = [];
  $scope.report_template = "";
  $scope.templateName = "";

  $scope.selected_order_from_mrn = null;
  $scope.orders_from_mrn = [];

  $http.get('getTemplateNames')
  .success(function(data) {
    $scope.templateNames = data;
  });

  var timeoutPromise = null;

  var cancelNextLoad = function() {
    $timeout.cancel(timeoutPromise);
  }

  var nextLoad = function (polling_method) {
    cancelNextLoad();
    timeoutPromise = $timeout(polling_method,3000);
  }

  $scope.getTaskResult = function(task_id,task_method, evaluation_method, set_data_method) {
    var polling_method = function() {
      if (evaluation_method()) {
        $http({
          url: 'getTaskResult',
          method: "GET",
          params: {
            task_id : task_id,
            task_method : task_method
          },
          headers: {
          'Content-Type': 'application/json'
          }
          }).then(function (success_response) {
            console.log('in getTaskResult');
            console.log(success_response);
            if (success_response.data.result) {
              set_data_method(success_response.data.result);
              cancelNextLoad();
              //desired_scope_data = success_response.data;
            } else {
              nextLoad(polling_method);
              //$scope.getTaskResult(task_id,task_method,evaluation_method, set_data_method);
            }
          });
        }
      }

      polling_method();
    //timeoutPromise = $timeout(polling_method,3000)
  };

  $scope.$on('$destroy', function() {
    cancelNextLoad();
  });

  if ($scope.patient_dictionary != null) {
    $http.get('getOrdersByMRN', {
      params: {
        mrn: $scope.patient_dictionary['mrn']
      }
    })
    .success(function(data) {
      console.log("in getOrdersFromMRN");
      console.log(data)

      // reset the currently selected order
      $scope.selected_order_from_mrn = null;
      // reset the orders associated with the mrn
      $scope.orders_from_mrn.length = 0;

      var obtained_orders_by_mrn = function() {
        return $scope.orders_from_mrn.length == 0;
      }

      var set_orders_by_mrn = function(data) {
        console.log(data);
        for (var i = 0; i < data.OrderData.length;i++){
          data.OrderData[i].selected = false;
          $scope.orders_from_mrn.push(data.OrderData[i]);
        }
      }

      if (data) {
        $scope.getTaskResult(data.task_id, data.task_method, obtained_orders_by_mrn, set_orders_by_mrn);
      }
    });

  }
  
  $scope.go_back = function() {
    $state.go('report_templates_one_upload');
  }

  $scope.select_order = function(order,order_index) {
    console.log(order);
    console.log(order_index);
    order.selected = true;
    $scope.selected_order_from_mrn = order;

    for (var i = 0; i < $scope.orders_from_mrn.length;i++) {
      if (i != order_index) {
        $scope.orders_from_mrn[i].selected = false;
      }
    }
  }

  $scope.combine = function() {
    $state.go('report_templates_three_powerscribe',{
      datablock_dictionary: angular.toJson($scope.datablock_dictionary),
      user_dictionary: angular.toJson($scope.user_dictionary),
      patient_dictionary: angular.toJson($scope.patient_dictionary),
      selected_order_from_mrn: angular.toJson($scope.selected_order_from_mrn),

      template_name: $scope.templateName,
      file_name: $scope.file_name
    });
  }

  $scope.$watch('templateName', function(data) {
    if (data) {
      console.log(data);
      $http.get('getTemplate', {
        params: { template_name: data }
      })
      .success(function(data) {
        $scope.report_template = data;
      });
    };
  });
})
.controller('report_templates_three_powerscribeViewCtrl',function($scope,fileUpload,fileUploadResponseData,$timeout,$state,$stateParams,$http){
  $scope.$state = $state;
  $scope.file_name = $state.params.file_name;
  $scope.template_name = $state.params.template_name;
  console.log($state.params);
  $scope.datablock_dictionary = angular.fromJson($state.params.datablock_dictionary);
  $scope.user_dictionary = angular.fromJson($state.params.user_dictionary);
  $scope.patient_dictionary = angular.fromJson($state.params.patient_dictionary);
  $scope.selected_order_from_mrn = angular.fromJson($state.params.selected_order_from_mrn);
  $scope.output = ""

  $scope.report = null;
  $scope.accession = $scope.selected_order_from_mrn.Accession;

  // report_id given back by powerscribe
  $scope.report_id = null;
  //$scope.accession = "5655347"; 

  // This was for a submission test
  // deprecated, delete soon
  $scope.order_data = null;

  
  var timeoutPromise = null;

  var cancelNextLoad = function() {
    $timeout.cancel(timeoutPromise);
  }

  var nextLoad = function (polling_method) {
    cancelNextLoad();
    timeoutPromise = $timeout(polling_method,3000);
  }

  /*
  $scope.getTaskResult = function(task_id,task_method, evaluation_method, set_data_method) {
    $timeout(function() {
      if (evaluation_method()) {
        $http({
          url: 'getTaskResult',
          method: "GET",
          params: {
            task_id : task_id,
            task_method : task_method
          },
          headers: {
          'Content-Type': 'application/json'
          }
          }).then(function (success_response) {
            console.log('in getTaskResult');
            console.log(success_response);
            if (success_response.data.result) {
              set_data_method(success_response.data.result);
              //desired_scope_data = success_response.data;
            } else {
              $scope.getTaskResult(task_id,task_method,evaluation_method, set_data_method);
            }
          });
        }
    },3000)
  };
  */

  if ($scope.template_name && $scope.datablock_dictionary) {
    //console.log($scope.template_name);
    //console.log($scope.datablock_dictionary);
    $http.get('getGeneratedReport', {
      params: {
        template_name: $scope.template_name,
        datablock_dictionary: angular.toJson($scope.datablock_dictionary),
        user_dictionary: angular.toJson($scope.user_dictionary),
        patient_dictionary: angular.toJson($scope.patient_dictionary)
      }
    })
    .success(function(data) {
      $scope.report = data;
    });
  }

  $scope.go_back = function() {
    $state.go('report_templates_two_verify', {
      "datablock_dictionary": angular.toJson($scope.datablock_dictionary),
      "user_dictionary": angular.toJson($scope.user_dictionary),
      "patient_dictionary": angular.toJson($scope.patient_dictionary),
      "file_name":$state.params.file_name
    });
  } 

  $scope.getTaskResult = function(task_id,task_method, evaluation_method, set_data_method) {
    var polling_method = function() {
      if (evaluation_method()) {
        $http({
          url: 'getTaskResult',
          method: "GET",
          params: {
            task_id : task_id,
            task_method : task_method
          },
          headers: {
          'Content-Type': 'application/json'
          }
          }).then(function (success_response) {
            console.log('in getTaskResult');
            console.log(success_response);
            if (success_response.data.result) {
              set_data_method(success_response.data.result);
              cancelNextLoad();
              $state.go("report_templates_one_upload");
              //desired_scope_data = success_response.data;
            } else {
              nextLoad(polling_method);
              //$scope.getTaskResult(task_id,task_method,evaluation_method, set_data_method);
            }
          });
        }
      }

      polling_method();

    /*
    $timeout(function() {
      if (evaluation_method()) {
        $http({
          url: 'getTaskResult',
          method: "GET",
          params: {
            task_id : task_id,
            task_method : task_method
          },
          headers: {
          'Content-Type': 'application/json'
          }
          }).then(function (success_response) {
            console.log('in getTaskResult');
            console.log(success_response);
            if (success_response.data.result) {
              set_data_method(success_response.data.result);
              //desired_scope_data = success_response.data;
            } else {
              $scope.getTaskResult(task_id,task_method,evaluation_method, set_data_method);
            }
          });
        }
    },3000)
    */
  };

 
  $scope.submit_to_powerscribe = function() {
    /*
    $http({
      url: 'getOrderByAccession',
      method: "GET",
      params: {
        //report : $scope.report,
        accession : $scope.accession
      },
      headers: {
          //'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          'Content-Type': 'application/json'
      }
    }).then(function (success_response) {
      console.log("success");
      console.log(success_response);
      if (success_response.data) {
        $scope.getTaskResult(success_response.data.task_id, success_response.data.task_method);
      }
      //TaskResultObtainer.init(success_response.data['task_id'],success_resposne.data['task_method']);
    }, function (error_response) {
      console.log('error');
      console.log(error_response);
    });
    */
    $http({
      url: 'submitToPowerscribe',
      method: "POST",
      data: $.param({
        report : $scope.report,
        accession : $scope.accession,
        technologist_cwid : $scope.user_dictionary['loginName']
      }),
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          //'Content-Type': 'application/json; charset=UTF-8'
      }
    }).then(function(success_response){
      console.log(success_response);

      var obtained_report_id = function() {
        return $scope.report_id == null;
      }

      var set_report_id = function(data) {
        $scope.report_id = data.report_id;
      }

      if (success_response.data) {
        $scope.getTaskResult(success_response.data.task_id,success_response.data.task_method,obtained_report_id,set_report_id)
      }

    },function(error_response) {
      console.log(error_response);
    });
  } 
});