angular.module('MyApp.factories', [ 'MyApp.menu' ])

.factory('MyAppFactory', function($http, $q, $timeout, menu) {

//	function loginSuccess(success) {
		// Update menu
//		menu.login = success.data.login || {};
//		menu.login.lastLogin = prefsFactory.getNumber('LastLogin');

		// Apply site preference
//		var sitePref = prefsFactory.getString('Site');
//		if (sitePref) {
//			menu.site = lookup.list('bemaSite').get(sitePref);
//		}

		// Return login info
//		return menu.login;
//	}


	return {
		login : function(form) {
			console.info('Password login attempt');
//			return gdHttp.post(environment.current.url + '/login', null, {
//				params : form
//			}).then(loginSuccess);
		}


//		logoutPrompt : function() {
//			var bemaFactory = this;
//			return commonLoginFactory.confirmLogout().then(function() {
//				bemaFactory.resetForm();
//				bemaFactory.resetData();
//				flightCache = null;
//			});
//		}
	};
});
