angular.module('security.service', [
	'security.retryQueue',
])
.factory('security', ['$http', '$q', '$state','securityRetryQueue', function($http, $q,$state,queue) {
	// Redirect to the given url (defaults to '/')
	function redirect(url) {
		url = url || '/';
	}

	function gotoLogin() {
		$state.go('login');
	}

	// Register a handler for when an item is added to the retry queue
	// I think this is the only handler that is added to the queue
	queue.onItemAddedCallbacks.push(function (retryItem) {
		if ( queue.hasMore() ) {
			service.gotoLogin();
		}
	});

	// The public API of the service

	var service = {
		// Get the first reason for needing a login
		getLoginReason: function() {
			return queue.retryReason();
		},

		// Show the modal login dialog
		gotoLogin: function() {
			gotoLogin();
		},

		// Attempt to authenticate a user by the given email and password
		login: function(username, password) {
			var request = $http.post('login', {username: username, password: password});
			return request
				.success(function(response) {
					//console.log('in login success');
					//console.log(response);
					service.currentUser = response;
					return response;
				})
				.error(function(response) {
					service.currentUser = null;
					return response;
				});
		},

		// Logout the current user and redirect
		logout: function() {
			$http.post('logout').then(function() {
				service.currentUser = null;
				$state.go('login');
				//redirect(redirectTo);
			});
		},

		// Ask the backend to see if a user is already authenticated -- this may be from a previous session
		requestCurrentUser: function() {
			//console.log('i got called');
			if (service.isAuthenticated()) {
				return $q.when(service.currentUser);
			} else {
				return $http.get('current-user').then(function(response) {
					//console.log('in get current-user');
					//console.log(service.currentUser);
					//console.log(response);
					// if err, then no user returned
					if (!response.data.error) {
						service.currentUser = response.data;
					} else {
						service.currentUser = null;
					}
					return service.currentUser;
				});
			}
		},

		// Information about the current user
		currentUser: null,

		// Is the current user authenticated?
		isAuthenticated: function() {
			return !!(service.currentUser && service.currentUser.applications.radiqal.member);
		},

		// Is the current user an administrator?
		isAdmin: function() {
			return !!(service.currentUser && service.currentUser.applications.radiqal.admin);
		}
	};

	return service;
}]);