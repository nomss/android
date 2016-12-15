angular.module('MyApp', ['ionic', 'MyApp.menu', 'MyApp.LoginController', 'MyApp.factories', 'MyApp.MainPageController', 'firebase'])
//angular.module('MyApp', ['ngCordova', 'MyApp.menu', 'MyApp.controllers'])
.constant('appShortName', 'app').constant('appFullName', 'MyApp')

.run(function($rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicNavBarDelegate, $timeout, MyAppFactory, menu) {
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

	});

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

		console.log("ionic ready");

		// Register Grabba event listeners
//		grabbaFactory.registerCallbacks();
	});
})

.config(function() {
    console.log("initializing firebase");
    var config = {
        apiKey: "AIzaSyDfPMSYI-Ubu3G1iQVGePgRzckXEzCmUZQ",
        authDomain: "gold-subset-151101.firebaseapp.com",
        databaseURL: "https://gold-subset-151101.firebaseio.com",
        storageBucket: "gold-subset-151101.appspot.com",
        messagingSenderId: "557931784512"
      };
      firebase.initializeApp(config);
})

.config(function($compileProvider, $stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {
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

    $urlRouterProvider.otherwise('/index');

$stateProvider
  .state('menu.index', {
    url: '/index',
    views : {
        'menuContent' : {
            templateUrl: 'login/login.html',
            controller : 'LoginController'
        }
    }
  })

  .state('menu.mainPage', {
      url: '/mainPage',
      views : {
          'menuContent' : {
              templateUrl: 'login/mainPage.html'
//              ,              controller : 'MainPageController'
          }
      }
    })

  .state('menu', {
    templateUrl: 'menu/menu.html'
  })

    .state('test1', {
        url: '/test1',
        templateUrl: 'login/test1.html'
    });

});