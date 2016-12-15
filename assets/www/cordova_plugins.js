cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-inappbrowser.inappbrowser",
        "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
        "pluginId": "cordova-plugin-inappbrowser",
        "clobbers": [
            "cordova.InAppBrowser.open",
            "window.open"
        ]
    },
    {
        "id": "noman.arain.testPlugin.TestPlugin",
        "file": "plugins/noman.arain.testPlugin/www/testPlugin.js",
        "pluginId": "noman.arain.testPlugin",
        "clobbers": [
            "window.plugins.testPlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-inappbrowser": "1.5.0",
    "cordova-plugin-whitelist": "1.3.0",
    "cordova-plugin-console": "1.0.4",
    "noman.arain.testPlugin": "1.0.0",
    "cordova-android-fragments": "0.1.0"
};
// BOTTOM OF METADATA
});