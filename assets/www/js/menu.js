angular.module('MyApp.menu', [  ])

// Shared menu object acts like a session
.factory('menu', function() {
    console.log("in menu factory");
	var defaults = {
		// Call menu.reset() on logout to clear
//		reset : reset,
		isCordova : window.isCordova,
		login : null
	};
//
//	// Reset the menu
//	function reset() {
//		angular.copy(defaults, menu);
//	}
//
	var menu = {};
	angular.copy(defaults, menu);
	return menu;
})

.controller('MenuController', function($scope, menu, $state, $ionicScrollDelegate, appShortName, appFullName) {
	$scope.appShortName = appShortName;
	$scope.appFullName = appFullName;

	$scope.menu = menu;
	console.log("in menuCont");
//
//
//	// Check if a form field is empty
//	$scope.isEmpty = function isEmpty(value) {
//		return typeof value === 'undefined' || value === '' || value === null || value !== value;
//	};
//
//	$scope.back = function back() {
//		window.history.back();
//	};

//	$scope.loginLogout = function() {
//		if (menu.login) {
//			bemaFactory.logoutPrompt().then(function() {
//				$state.go('menu.login');
//			});
//		} else {
//			$state.go('menu.login');
//		}
//	};

	// Resize main <ion-scroll> when content changes.
	// DO NOT call scrollTop() here or the cursor will lose focus.
//	$scope.resizeContent = function() {
//		$ionicScrollDelegate.$getByHandle('main').resize();
//	};
//
//	$scope.openPopover = function($event) {
//		popover.openPopover($event);
//	};
});