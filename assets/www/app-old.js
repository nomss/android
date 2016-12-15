angular.module('MyApp', ['ionic', 'ngCordova', 'MyApp.menu', 'MyApp.controllers', 'MyApp.factories', 'auth0.lock', 'angular-jwt', 'ui.router'])

.constant('appShortName', 'app').constant('appFullName', 'MyApp')

.run(function($rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicNavBarDelegate, $timeout, MyAppFactory, menu, authService, lock) {
	// Require login for most states
	console.log(".run menu: ", menu);
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
	    console.log("$rootScope.$on, event: ", event);
//		if (!menu.login && toState.loginRequired !== false) {
//			console.warn('Attempted state without login', errorFactory.stateString(toState, toParams));
			event.preventDefault();
//			$state.go('menu.login', null, {
//				location : 'replace'
//			});
//		} else if (menu.login && (toState.name == "menu.login")) {
//			event.preventDefault();
//			bemaFactory.logoutPrompt().then(function() {
//				$state.go('menu.login');
//			});
//		}
	});

	// Log state change success
//	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
//		console.info('Loaded state', errorFactory.stateString(toState, toParams));
//		popover.clearAction();
//		popover.closePopover();
//	});

	$ionicPlatform.ready(function() {
		// Required with android:windowSoftInputMode="adjustPan"
		ionic.Platform.isFullScreen = true;

		$ionicPlatform.registerBackButtonAction(function() {
			window.history.back();
		}, 125);

		// Device menu button toggles side menu
		document.addEventListener('menubutton', function menubutton(event) {
			event.preventDefault();
			$ionicSideMenuDelegate.toggleLeft();
		}, false);

		console.log("ionicPlatform ready");

		menu.login = 'test';
		// Register Grabba event listeners
//		grabbaFactory.registerCallbacks();
	});

	 function run(authService, lock) {
        // Register the authentication listener that is
        // set up in auth.service.js
        authService.registerAuthenticationListener();
      }

    $rootScope.authService = authService;

    // Register the authentication listener that is
    // set up in auth.service.js
    authService.registerAuthenticationListener();

    // Register the synchronous hash parser
    // when using UI Router
    lock.interceptHash();
    authService.authenticateAndGetProfile();

})

.config(function($compileProvider, $stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider, lockProvider) {
	// Disable Angular debugging to improve performance
	$compileProvider.debugInfoEnabled(false);

	// Ionic 1.0.0 config
	$ionicConfigProvider.views.maxCache(0);
	$ionicConfigProvider.navBar.alignTitle('center');
	$ionicConfigProvider.backButton.icon('ion-android-arrow-back');
	$ionicConfigProvider.backButton.previousTitleText(false);
	$ionicConfigProvider.backButton.text('');
	$ionicConfigProvider.form.checkbox('circle');
	$ionicConfigProvider.form.toggle('large');
	$ionicConfigProvider.tabs.style('striped');
	$ionicConfigProvider.tabs.position('top');

	// Enable HTTP cross-domain requests
//	$httpProvider.defaults.withCredentials = true;
    // Global HTTP interceptors
    // Called in forward order for request, reverse order for response
//    $httpProvider.interceptors.push('sessionTimeoutInterceptor', 'gdErrorHttpInterceptor', 'appUpdateInterceptor');

    // Default to login page
    $urlRouterProvider.otherwise('login');

//	$stateProvider.state('menu', {
//		abstract : true,
//		templateUrl : '/../index.html'
////		,		controller : 'MenuController'
//	})
$stateProvider
    .state('home', {
        url: '/home',
        controller: 'HomeController',
        templateUrl: 'components/home/home.html',
        controllerAs: 'vm'
      })

	.state('menu.login', {
		url : '/login/:error',
		views : {
			'menuContent' : {
				templateUrl : 'login/login.html',
				controller : 'LoginController'
			}
		}
	})

//    .state('menu.login', {
//        url: '/login',
//        controller: 'LoginController',
//        templateUrl: 'login/login.html',
//        controllerAs: 'vm'
//      })

    lockProvider.init({
      clientID: 'NI3r3xbFAAkS7XC8yKbrlezCQyzAXMjZ',
      domain: 'tarbiyyat.auth0.com'
    });

    $urlRouterProvider.otherwise('/login');
//	.state('login', {
//            url: "login",
////            template: 'test'
//            templateUrl: 'login/login.html'
////            ,            controller : 'LoginController'
////            authenticate: false
//        })

//	.state('login', {
//		loginRequired : false,
//		url : '/login/:error',
//		views : {
//			'menuContent' : {
//				templateUrl : 'login/login.html'
////				,				controller : 'LoginController'
//			}
//		}
//	})

//	.state('menu.splash', {
//		url : '/splash/',
//		views : {
//			'menuContent' : {
//				templateUrl : 'bema/templates/splash.html',
//				controller : 'SplashController'
//			}
//		}
//	})

//	.state('test', {
//		url : '/test/test/',
//		views : {
//			'menuContent' : {
//				templateUrl : 'login/login.html'
////				,				controller : 'SplashController'
//			}
//		}
//	})

});
//
//.controller('TestController', function($scope) {
//	$scope.title = 'Flight';
//
////	$scope.onStart = function() {
////        window.plugins.testPlugin.disconnect(function (data) {
////            console.log('Disconnect', data);
////        }, function captureError(error) {
////            console.error('Disconnect failed: ', error);
////        });
////    };
////
////    $scope.onStart();
//

//

//
//})