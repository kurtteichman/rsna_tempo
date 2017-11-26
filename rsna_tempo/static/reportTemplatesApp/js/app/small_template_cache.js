angular.module('smallTemplateCache',['loginModalWindow','loginToolBar']);

angular.module('loginToolBar',[])
.run(["$templateCache", function($templateCache) {
  var toolbar_template_string = '' +
  '<div>' +
  '<nav class="navbar navbar-inverse" role="navigation" style="padding:0px;margin:0px">' +
    '<div class="container-fluid">' +
      '<div class="navbar-header">' +
        '<a class="navbar-brand" href="#">Radiqal</a>' +
        '<ul class="nav navbar-nav" ng-show="isAuthenticated()">'+
  	      '<li ng-class="getActiveClass(\'queryTicketView\')"><a href="#/queryTicketView">Query Ticket</a></li>' +
  	      '<li ng-class="getActiveClass(\'createTicketView\')"><a href="#/createTicketView" >Create/Edit Ticket</a></li>' +
  	      '<li ng-class="getActiveClass(\'analyticsView\')" ng-show="isAdmin()"><a href="#/analyticsView">Analytics</a></li>' +
        '</ul>'+
      '</div>' +
      '<form class="navbar-form navbar-right" role="search">' +
        '<button ng-if="isAuthenticated()" ng-click="logout()" class="btn btn-default">Logout</button>' +
      '</form>' +
      '<ul ng-if="isAuthenticated()" class="nav navbar-nav navbar-right">' +
        '<li><a href="">Welcome, {[{ getUsername() }]}</a></li>'+
      '</ul>' + 
    '</div>' +
  '</nav>' +
  '<div ng-class="topClass">' +
  '<div ng-class="bottomClass" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' +
  '</div>' +
'</div>' +

  '</div>';
  $templateCache.put('toolbar.tpl.html',toolbar_template_string);
}]);

angular.module('loginModalWindow',[])
.run(["$templateCache", function($templateCache) {
	var loginWindow_template_string = '' +
	  '<form>'+
	    '<div class="modal-header">' +
	    '<h3>Login</h3>' +
	    '</div>' +
	    '<div class="modal-body">' +
	    '<div class="alert alert-warning" ng-show="auth_response.authReason">{{auth_response.authReason}}</div>'+
		'<div class="alert alert-error" ng-show="auth_response.authError">{{auth_response.authError}}</div>'+
		'<div class="alert alert-info">Please enter your login details</div>'+
		'<div class="container-fluid">' +
		'<div class="input-group col-md-12 input-group-lg">' +
		'<span class="input-group-addon"></span>' +
		'<input type="text" ng-model="login_info.username" class="form-control" placeholder="Username"/>' +
		'</div>' +
		'<br>' +
		'<div class="input-group col-md-12 input-group-lg">' +
		'<span class="input-group-addon"></span>' +
		'<input type="password" ng-model="login_info.password" class="form-control" placeholder="Password"/>' +
		'</div>' +
	    '</div>' +
	    '</div>' +
	    '<div class="modal-footer">' +
	    '<button class="btn btn-primary" type="submit" ng-click="login()">Sign in</button>' +
	    '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
	  '</div>' +
	  '</form>';

    $templateCache.put('loginModalWindow.tpl.html',loginWindow_template_string);
}]);
