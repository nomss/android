/* 
 * JavaScript polyfills
 * for cross-browser compatibility
 */
 
 // Stop IE duplicate click events (TMEQ-193)
// ... but only for <button> (TMERF-761)
window.addEventListener('click', function(event) {
	if (Object.prototype.toString.call(event) == '[object PointerEvent]' && event.target && event.target.nodeName == 'BUTTON') {
		console.warn('Ignoring IE PointerEvent', {
			type: event.type, 
			targetNodeName: event.target.nodeName
		});
		event.stopPropagation();
	}
}, true);

// Window
window.isCordova = 'cordova' in window || 'Cordova' in window || 'PhoneGap' in window || navigator.userAgent.indexOf('Android') > -1;
window.URL = window.URL || window.webkitURL;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

// Array
Array.prototype.find || (Array.prototype.find = function(predicate) {
	if (this == null) {
		throw new TypeError('Array.prototype.find called on null or undefined');
	}
	if (typeof predicate !== 'function') {
		throw new TypeError('predicate must be a function');
	}
	var list = Object(this);
	var length = list.length >>> 0;
	var thisArg = arguments[1];
	var value;

	for (var i = 0; i < length; i++) {
		value = list[i];
		if (predicate.call(thisArg, value, i, list)) {
			return value;
		}
	}
	return undefined;
});

Array.prototype.findIndex || (Array.prototype.findIndex = function(predicate) {
	if (this == null) {
		throw new TypeError('Array.prototype.findIndex called on null or undefined');
	}
	if (typeof predicate !== 'function') {
		throw new TypeError('predicate must be a function');
	}
	var list = Object(this);
	var length = list.length >>> 0;
	var thisArg = arguments[1];
	var value;

	for (var i = 0; i < length; i++) {
		value = list[i];
		if (predicate.call(thisArg, value, i, list)) {
			return i;
		}
	}
	return -1;
});

if (!Array.prototype.includes) {
	  Array.prototype.includes = function(searchElement /* , fromIndex */ ) {
	    'use strict';
	    var O = Object(this);
	    var len = parseInt(O.length, 10) || 0;
	    if (len === 0) {
	      return false;
	    }
	    var n = parseInt(arguments[1], 10) || 0;
	    var k;
	    if (n >= 0) {
	      k = n;
	    } else {
	      k = len + n;
	      if (k < 0) {k = 0;}
	    }
	    var currentElement;
	    while (k < len) {
	      currentElement = O[k];
	      if (searchElement === currentElement) { // NaN !== NaN
	        return true;
	      }
	      k++;
	    }
	    return false;
	  };
	}

// Number
Number.prototype.toRadians || (Number.prototype.toRadians = function() {
	return this * Math.PI / 180;
});

// String
String.prototype.includes || (String.prototype.includes = function() {
	return String.prototype.indexOf.apply(this, arguments) !== -1;
});

String.prototype.trim || (String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '');
});

String.prototype.startsWith || (String.prototype.startsWith = function(searchString, position) {
	position = position || 0;
	return this.lastIndexOf(searchString, position) === position;
});

String.prototype.endsWith || (String.prototype.endsWith = function(searchString, position) {
	var subjectString = this.toString();
	if (position === undefined || position > subjectString.length) {
		position = subjectString.length;
	}
	position -= searchString.length;
	var lastIndex = subjectString.indexOf(searchString, position);
	return lastIndex !== -1 && lastIndex === position;
});

String.prototype.splice || (String.prototype.splice = function(start, deleteCount, add) {
	return (this.slice(0, start) + add + this.slice(start + deleteCount));
});

String.prototype.escapeHtml || (String.prototype.escapeHtml = function() {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(this));
	return div.innerHTML;
});

String.prototype.repeat || (String.prototype.repeat = function(count) {
	'use strict';
	if (this == null) {
		throw new TypeError('can\'t convert ' + this + ' to object');
	}
	var str = '' + this;
	count = +count;
	if (count != count) {
		count = 0;
	}
	if (count < 0) {
		throw new RangeError('repeat count must be non-negative');
	}
	if (count == Infinity) {
		throw new RangeError('repeat count must be less than infinity');
	}
	count = Math.floor(count);
	if (str.length == 0 || count == 0) {
		return '';
	}
	// Ensuring count is a 31-bit integer allows us to heavily optimize the
	// main part. But anyway, most current (August 2014) browsers can't
	// handle
	// strings 1 << 28 chars or longer, so:
	if (str.length * count >= 1 << 28) {
		throw new RangeError('repeat count must not overflow maximum string size');
	}
	var rpt = '';
	for (;;) {
		if ((count & 1) == 1) {
		rpt += str;
		}
		count >>>= 1;
		if (count == 0) {
		break;
		}
		str += str;
	}
	return rpt;
});

// Escapes user input for use in regular expressions
function escapeRegExp(string) {
	return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Compares array contents
function arrayEqual(a, b) {
	if (!Array.isArray(a) || !Array.isArray(b)) {
		return false;
	} else if (a.length != b.length) {
		return false;
	}

	for (var i = 0, l = a.length; i < l; i++) {
		// Recurse into nested arrays
		if (Array.isArray(a[i]) && Array.isArray(b[i]) && !arrayEqual(a[i], b[i])) {
			return false;
		} else if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

// Sluid
//
// (c) 2011 Tim Wood
// Sluid is freely distributable under the terms of the MIT license.
//
// Version 0.1.0
// provides window.sliud() function
(function(a,b){function h(a){var b=(new Date).getTime(),d=a===3?23e4:a===4?14e6:a===5?91e7:a===6?56e9:35e11;a>2&&a<8||(a=7),e===b?c++:(c=0,e=b);return g(f(b%d),a)+f(c)}function g(a,b){while(a.length<b)a="0"+a;return a}function f(a){var b="",c;while(a>0)c=Math.floor(a/62),b=d[a-62*c]+b,a=c;return b||"0"}var c=0,d="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),e=0;a.sluid=h})(window)