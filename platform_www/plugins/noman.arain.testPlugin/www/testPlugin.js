cordova.define("noman.arain.testPlugin.TestPlugin", function(require, exports, module) {
cordova.define("noman.arain.testPlugin.TestPlugin", function(require, exports, module) {
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2011, IBM Corporation
 */

var testPlugin = {
	signIn : function(success, error) {
		cordova.exec(success, error, "TestPlugin", "signIn", []);
	},
	disconnect : function(success, error) {
    		cordova.exec(success, error, "TestPlugin", "disconnect", []);
    },
    getGoogleApiClientStatus : function(success, error) {
        		cordova.exec(success, error, "TestPlugin", "getGoogleApiClientStatus", []);
    },
	packageExists : function(success, error) {
		cordova.exec(success, error, "MrzPlugin", "packageExists", []);
	}
};

module.exports = testPlugin;
});

});
