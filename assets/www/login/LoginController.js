angular.module('MyApp.LoginController', ['firebase'])

.controller('LoginController', function($scope, $state, menu, $firebaseObject, $firebaseArray, $firebaseAuth) {
	$scope.title = 'Login';
	console.log("LoginController");
	var provider = new firebase.auth.GoogleAuthProvider();
//
//    $scope.getGoogleApiClientStatus = function getGoogleApiClientStatus()  {
//        if(window.plugins) {
//            window.plugins.testPlugin.getGoogleApiClientStatus(function (data) {
//                console.log('getGoogleApiClientStatus: ', data);
//            }, function (error) {
//                console.error('getGoogleApiClientStatus failed: ', error);
//            });
//        }
//    }
//    $scope.getGoogleApiClientStatus();
//
    $scope.plugInSignIn = function() {
        window.plugins.testPlugin.signIn(function (data) {
            if(data == null) {
                console.log('data == null');
            }
            console.log('data: ',  data);
        	console.log('Signin success: ' + data.fullName);
        }, function (error) {
        	console.error('Signin error', error);
        });
    };
//
//    $scope.disconnect = function() {
//        window.plugins.testPlugin.disconnect(function (data) {
//        	console.log('Disconnect', data);
//        }, function captureError(error) {
//        	console.error('Disconnect failed: ', error);
//        });
//    }

    $scope.firebaseAngGoogleLogin = function() {
//      var ref = firebase.database().ref();
        // download the data into a local object
//      $scope.data = $firebaseObject(ref);
      var auth = $firebaseAuth();
      console.log("auth: ", auth);
      // login with google
      auth.$signInWithPopup("google").then(function(result) {
        console.log("Signed in as:", result.user.uid);
      }).catch(function(error) {
        console.error("Authentication failed:", error);
        console.log("menu: ", menu);
      });
    }

    $scope.firebaseGoogleLogin = function() {
        console.log("pop up");
        firebase.auth().signInWithPopup(provider).then(function(result) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          var user = result.user;
          console.log("user: ", user);
          // ...
        }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
    }

    $scope.firebaseRedirectGoogleLogin = function() {
        console.log("redirect");
        firebase.auth().getRedirectResult().then(function(result) {
          if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // ...
          }
          // The signed-in user info.
          var user = result.user;
        }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
    }

    $scope.signOut = function() {
        console.log("in signOut");
        firebase.auth().signOut().then(function() {
          // Sign-out successful.
          console.log("Sign-out successful.");
        }, function(error) {
          // An error happened.
        });
    }

    $scope.createUserWithEmailAndPassword = function() {
    var email = 'nomana123@aim.com';
    var password = 'Nomss123';
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
    }

    $scope.login = function () {
        $state.go('menu.mainPage');
    }



});
