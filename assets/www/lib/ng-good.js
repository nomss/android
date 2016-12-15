/*
 * Angular plugin for Good Dynamics
 */
(function() {
	var globalHttpInterceptors = [];

	angular.module('ngGood', [ 'debounce', 'common.environment', 'common.error' ])

	.config(function($compileProvider, $httpProvider) {
		// gdHttp needs to respect global HTTP interceptors
		globalHttpInterceptors = $httpProvider.interceptors;
	})

	.factory('gdErrorHttpInterceptor', function($q, $filter, errorFactory) {
		function addServerUid(response) {
			if (response.config && response.config.logging) {
				response.config.logging.server = response.headers('X-Server');
				response.config.logging.uid = response.headers('X-UID');
				response.config.logging.duration = (performance.now() - response.config.logging.start) / 1000;
			}
		}

		function logError(response, isConversion) {
			if (response.config && response.config.logging) {
				console.error(response.config.logging.toString() + '» ' + response.status + ' error' + (isConversion ? ' (conversion)' : ''), JSON.stringify(response, function replacer(key, value) {
					if (key == 'config') {
						return '...';
					}
					return value;
				}, 4));
			}
		}

		return {
			// Log request to console
			request : function(config) {
				if (config && config.logging) {
					var lengthString = '';
					if (typeof config.data == 'string') {
						lengthString = '« Uploading ' + $filter('number')(config.data.length, 0) + ' bytes';
					}
					config.logging.start = performance.now();
					console.debug((config.logging.toString() + lengthString).trim());
				}
				return config;
			},

			// Handle fake errors (convert HTTP 200 to HTTP 5xx)
			// Log response to console
			response : function(response) {
				addServerUid(response);
				if (response && response.config) {
					if (response.status === 200 && response.data && response.data._ERROR === true) {
						response.status = +response.data.statusCode || 500;
						response.statusText = 'Internal Server Error';
						angular.extend(response, errorFactory.parse(response));
						delete response.data._ERROR;
						logError(response, true);
						return $q.reject(response);
					} else if (response.config.logging) {
						console.debug(response.config.logging.toString() + '» ' + response.status + ' success');
					}
				}
				return response;
			},

			// Handle actual errors (timeout, HTTP 4xx, HTTP 5xx)
			// Log response to console
			responseError : function(response) {
				addServerUid(response);
				angular.extend(response, errorFactory.parse(response));
				logError(response);
				return $q.reject(response);
			}
		};
	})

	/**
	 * This is a cache for GD http request.
	 */
	.factory('gdHttpCache', function($cacheFactory) {
		var cache = $cacheFactory('gdHttpCache', {
			capacity : 20
		});

		return {
			put : function put(cacheKey, result) {
				var maxAgeMillis = 0;
				var cacheControl = result.headers('cache-control');
				if (cacheControl != null && cacheControl.includes('max-age=')) {
					maxAgeMillis = (parseInt(cacheControl.split('max-age=')[1]) || 0) * 1000;
				}
				var expires = Date.now() + maxAgeMillis;

				if (result.status == 304) {
					var cacheData = cache.get(cacheKey);
					if (cacheData != null) {
						cacheData.expires = expires;
					}
				} else if (result.status == 200) {
					cache.put(cacheKey, {
						expires : expires,
						etag : result.headers('etag'),
						status : 200,
						statusCode : 'OK',
						headers : result.headers,
						data : result.data
					});
				}
			},

			get : function get(cacheKey) {
				return cache.get(cacheKey);
			},

			clear : function clear() {
				console.debug('[gdHttpCache] Clear cache');
				cache.removeAll();
			}
		};
	})

	.factory('gdConfig', function($q, $timeout) {
		var deferred = $q.defer();
		var promise = deferred.promise;

		var timer = $timeout(function() {
			deferred.reject('gdConfig failed: Timeout waiting for deviceready event');
		}, 5000);

		document.addEventListener('deviceready', function() {
			$timeout.cancel(timer);
			if ('plugins' in window && 'GDApplication' in window.plugins) {
				window.plugins.GDApplication.getApplicationConfig(function configSuccess(success) {
					try {
						var config = JSON.parse(success);
						console.log('gdConfig', config);
						deferred.resolve(config);
					} catch (e) {
						deferred.reject('gdConfig failed: Unable to parse application config');
					}
				}, function configError(error) {
					deferred.reject('gdConfig failed: ' + error);
				});
			} else {
				deferred.reject('gdConfig failed: Missing plugin GDApplication');
			}
		}, false);

		return promise;
	})

	.factory('gdBrowser', function($q) {
		function installGoodAcces() {
			var marketUrl = 'market://details?id=com.good.gdgma';
			console.log('Installing Good Access browser', marketUrl);
			window.open(marketUrl, '_system');
		}

		return {
			launch : function launchGoodAccess(url, promptForInstall) {
				var deferred = $q.defer();
				console.log('Launching Good Access browser', url);
				if ('plugins' in window && 'GDAppKineticsPlugin' in window.plugins) {
					window.plugins.GDAppKineticsPlugin.callAppKineticsService('com.good.gdgma', 'com.good.gdservice.open-url.http', '1.0.0.0', 'open', {
						'url' : url
					}, [], function(result) {
						console.log('Good Access browser success', result);
						deferred.resolve(result);
					}, function(error) {
						console.error('Good Access browser error', error);
						if (String(error).indexOf('Requested application not found') > -1 && promptForInstall !== false) {
							if (confirm('The Good Access browser is not installed. Click "OK" to install it from the Google Play store.')) {
								installGoodAcces();
							}
						}
						deferred.reject(error);
					});
				} else {
					var error = 'Missing plugin GDAppKineticsPlugin';
					console.error('Good Access browser error', error);
					deferred.reject(error);
				}

				return deferred.promise;
			},

			install : installGoodAcces
		};
	})

	.factory('gdHttp', function($rootScope, $q, $timeout, $http, $injector, debounce, appShortName, environment, gdHttpCache) {
		var JSON_START = /^\s*(\[|\{[^\{])/;
		var JSON_END = /[\}\]]\s*$/;
		var JSON_PROTECTION_PREFIX = /^\)\]\}',?\n/;

		var cbpWifi = false;
		var cbpWifiAbort = null;

		// Read application version number
		$http.get('version.json').then(function appVersionSuccess(success) {
			var m = moment(success.data.date);
			success.data.date = m.isValid() ? +m : undefined;
			angular.extend(environment.version, success.data);
			$rootScope.$broadcast('version', environment.version);
		});

		// Android pause fires when app leaves the foreground
		document.addEventListener('pause', function onPause() {
			console.warn('Android application paused');
		}, false);

		// Android resume fires when app returns to the foreground
		document.addEventListener('resume', function onResume() {
			console.warn('Android application resumed');
		}, false);

		document.addEventListener('deviceready', function gdHttpDeviceReady() {
			// Read GD version number
			if ('plugins' in window && 'GDApplication' in window.plugins) {
				window.plugins.GDApplication.getVersion(function gdVersionSuccess(success) {
					window.gdVersion = success;
					console.debug('GD version: ' + window.gdVersion);
				});
			}

			// Detect CBP Wi-Fi and skip Good container if available
			var connectionChange = debounce(function gdHttpConnectionChange() {
				var connection = navigator.connection || {};
				var connectionType = connection.type;
				console.warn('Network connection changed: ' + connectionType);
				cbpWifi = connectionType == 'wifi'; // default true
				if (cbpWifi) {
					console.log('CBP Wi-Fi: Testing...');

					// Abort previous test
					if (cbpWifiAbort) {
						cbpWifiAbort.resolve();
					}

					// Request new test
					cbpWifiAbort = $q.defer();
					$http({
						method : 'get',
						timeout : cbpWifiAbort.promise,
						url : 'http://cbpnet.cbp.dhs.gov/'
					}).then(function cbpWifiSuccess(success) {
						if (success && success.status == 200 && String(success.data).indexOf('CBPnet') > -1) {
							console.info('CBP Wi-Fi: Success');
						} else {
							console.warn('CBP Wi-Fi: Failed, Unrecognized Response', success);
							cbpWifi = false; // unknown Wi-Fi
						}
					}, function cbpWifiError(error) {
						console.warn('CBP Wi-Fi: Failed, Error', error);
						cbpWifi = false; // unknown Wi-Fi
					});

					// Abort after 15 seconds
					$timeout(function cbpWifiTimeout() {
						cbpWifiAbort.resolve();
					}, 15000);
				}
			}, 500);

			document.addEventListener('offline', connectionChange, false);
			document.addEventListener('online', connectionChange, false);
			connectionChange();
		}, false);

		function parseHeaders(headers) {
			var parsed = {}, key, val, i;

			if (typeof headers !== 'string') {
				return parsed;
			}

			angular.forEach(headers.split('\n'), function(line) {
				i = line.indexOf(':');
				key = angular.lowercase(line.substr(0, i).trim());
				val = line.substr(i + 1).trim();

				if (key) {
					if (parsed[key]) {
						parsed[key] += ', ' + val;
					} else {
						parsed[key] = val;
					}
				}
			});

			return parsed;
		}

		function headersGetter(headers) {
			var headersObj = angular.isObject(headers) ? headers : undefined;

			return function(name) {
				if (!headersObj) {
					headersObj = parseHeaders(headers);
				}

				if (name) {
					return headersObj[angular.lowercase(name)] || null;
				}

				return headersObj;
			};
		}

		function isSuccess(status) {
			return 200 <= status && status < 300;
		}

		function buildUrl(url, params) {
			var formData = buildFormData(params);
			if (formData) {
				url += ((url.indexOf('?') == -1) ? '?' : '&') + formData;
			}
			return url;
		}

		function buildFormData(params) {
			var data = [];
			if (params) {
				angular.forEach(params, function(value, key) {
					if (String(key).charAt(0) == '$') {
						return;
					}
					if (value === null || angular.isUndefined(value) || value == "") {
						return;
					}
					if (!angular.isArray(value)) {
						value = [ value ];
					}

					angular.forEach(value, function(v) {
						if (angular.isObject(v)) {
							v = angular.toJson(v);
						}
						data.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
					});
				});
			}
			data.sort();
			return data.join('&');
		}

		function toArrayBuffer(string) {
			var array = null;
			try {
				array = new Uint8Array(string.length);
				for (var i = 0, length = string.length; i < length; i++) {
					array[i] = string.charCodeAt(i) & 0xff;
				}
			} catch (e) {
				console.error('Unable to create Uint8Array', e);
			}
			return array;
		}

		function toBlob(array, type) {
			var blob = null;
			try {
				blob = new Blob([ array ], {
					type : type
				});
			} catch (e) {
				try {
					var builder = new BlobBuilder();
					builder.append(array.buffer);
					blob = builder.getBlob(type);
				} catch (ee) {
					console.error('Unable to create Blob', ee);
				}
			}
			return blob;
		}

		function isPromise(value) {
			return value && typeof value.then === 'function';
		}

		function gdHttp(requestConfig) {
			// Configure request
			var config = {
				method : 'get',
				timeout : 60000,
				logging : {
					toString : function getLoggingString() {
						var str = this.conduit + '[#' + this.requestId;
						if (this.server || this.uid) {
							str += '/' + (this.server || '') + (this.uid ? '#' + this.uid : '');
						}
						str += '] ' + config.method + ' ' + config.logging.url;
						if (typeof this.duration === 'number') {
							str += ' (took ' + this.duration.toLocaleString() + ' seconds)';
						}
						str += '\r\n';
						return str;
					},

					conduit : '$http',
					requestId : sluid(6)
				}
			};
			angular.extend(config, requestConfig);

			config.method = angular.uppercase(config.method);
			if (!isPromise(config.timeout)) {
				config.timeout = Math.max((+config.timeout || 0), 0);
			}
			config.timeStart = Date.now();
			config.headers = angular.extend({
				'X-App' : (appShortName || '') + '/' + (environment.version.number || ''),
				'X-Phone-Number' : (window.device || {}).phoneNumber,
				'X-Device-Request-Id' : config.logging.requestId,
				'X-Request-Start-Time' : config.timeStart
			}, config.headers);

			// Create POST data using form params
			if (config.method == 'POST' && config.data == null && config.params) {
				config.data = buildFormData(config.params);
				delete config.params;
				config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
			}
			var url = buildUrl(config.url, config.params);
			config.logging.url = url;

			// Send request
			if (!cbpWifi && 'plugins' in window && 'GDHttpRequest' in window.plugins) {
				// Use GDHttpRequest
				config.logging.conduit = 'GDHttpRequest';
				config.headers['User-Agent'] = navigator.userAgent + ' GoodDynamics/' + (window.gdVersion || '0');

				// Get HTTP interceptors active at request time
				var httpInterceptors = [];
				angular.forEach(globalHttpInterceptors, function(interceptorFactory) {
					httpInterceptors.unshift(angular.isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
				});

				// Apply interceptors
				var promise = $q.when(config);
				var chain = [ gdRequest, undefined ];
				angular.forEach(httpInterceptors, function(interceptor) {
					if (interceptor.request || interceptor.requestError) {
						chain.unshift(interceptor.request, interceptor.requestError);
					}
					if (interceptor.response || interceptor.responseError) {
						chain.push(interceptor.response, interceptor.responseError);
					}
				});
				while (chain.length) {
					var thenFn = chain.shift();
					var rejectFn = chain.shift();
					promise = promise.then(thenFn, rejectFn);
				}

				// Add .success() and .error() to promise
				promise.success = function(fn) {
					promise.then(function(response) {
						fn(response.data, response.status, response.headers, response.config);
					});
					return promise;
				};
				promise.error = function(fn) {
					promise.then(null, function(response) {
						fn(response.data, response.status, response.headers, response.config);
					});
					return promise;
				};

				return promise;

			} else {
				// Use Angular $http
				config.logging.conduit = '$http';
				return $http(config);
			}

			function gdRequest() {
				var deferred = $q.defer();
				var promise = deferred.promise;

				// Check gdHttpCache
				var cacheKey = config.logging.url;
				if (config.method == 'GET') {
					var cacheData = gdHttpCache.get(cacheKey);
					if (cacheData != null) {
						if (cacheData.expires > Date.now()) {
							console.debug(config.logging.toString() + '[gdHttpCache] Returning cached data (expires: ' + moment(cacheData.expires).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss.SSS z') + ')')
							resolvePromise(cacheData);
							return promise;
						} else if (cacheData.etag != null) {
							console.debug(config.logging.toString() + '[gdHttpCache] Cache hit expired, conditional request using If-None-Match: ' + cacheData.etag);
							config.headers['If-None-Match'] = cacheData.etag;
						}
					}
				}

				// Create HTTP request
				var gdTimeoutSeconds = 0;
				if (typeof config.timeout == 'number') {
					gdTimeoutSeconds = Math.ceil(config.timeout / 1000);
				}
				var request = window.plugins.GDHttpRequest.createRequest(config.method, url, gdTimeoutSeconds, true, null, null, null, false);
				request.disableHostVerification = true;
				request.disablePeerVerification = true;

				// Add request headers
				var headers = angular.extend({}, $http.defaults.headers.common, $http.defaults.headers[config.method.toLowerCase()], config.headers);
				angular.forEach(headers, function(header, headerName) {
					var headerValue = header;
					if (typeof header === 'function') {
						headerValue = header();
					}
					if (headerValue != null) {
						headerValue = String(headerValue);
						request.addRequestHeader(headerName, headerValue);
					}
				});

				// Add POST data
				if (config.method == 'POST' && config.data) {
					request.addHttpBody(config.data);
				}

				// Send request
				request.send(function gdRequestSend(success) {

					// Success
					request = null;
					try {
						var response = JSON.parse(success);
						var status = response.status;
						var statusText = response.statusText;
						var data = response.responseText;
						var headers = headersGetter(response.headers);

						if (status == 304) {
							// 304 Not Modified in response to conditional GET
							// Convert to 200 OK using cached data
							var cacheData = gdHttpCache.get(cacheKey);
							if (cacheData != null) {
								console.debug(config.logging.toString() + '[gdHttpCache] Convert HTTP 304 Not Modified to HTTP 200 OK');
								status = cacheData.status;
								statusText = cacheData.statusText;
								data = cacheData.data;
								headers = cacheData.headers;
							}
						} else {
							var contentType = headers('Content-Type');
							if (data == null || (typeof data == 'string' && data.length == 0)) {
								// Angular $http treats null as empty object.
								// However, we want to treat null as an error.
								// See TMERF-577. No HTTP requests yield null.
								console.error(config.logging.toString() + ' Good Network failure (empty response)', response.headers);
								data = null;
								status = 0;
								statusText = 'Good Network failure (empty response)';

							} else if (typeof data == 'string') {
								try {
									if (config.responseType == 'arraybuffer' || config.responseType == 'blob') {
										// Transform string to array or blob
										data = toArrayBuffer(data);
										if (config.responseType == 'blob') {
											data = toBlob(data, contentType);
										}
									} else {
										// Transform string to JSON object
										data = data.replace(JSON_PROTECTION_PREFIX, '');
										if ((contentType && contentType.indexOf('application/json') === 0) || (JSON_START.test(data) && JSON_END.test(data))) {
											data = JSON.parse(data);
										}
									}
								} catch (ee) {
									console.error(config.logging.toString() + ' Good Network failure (invalid response)', response.headers, data);
									data = null;
									status = 0;
									statusText = 'Good Network failure (invalid response)';
								}

							} else {
								console.error(config.logging.toString() + ' Good Network failure (unrecognized response type: ' + typeof data + ')', response.headers, data);
								data = null;
								status = 0;
								statusText = 'Good Network failure (unrecognized response type)';
							}

							// Add to gdHttpCache
							if (data != null && config.method == 'GET' && (status == 200 || status == 304)) {
								gdHttpCache.put(cacheKey, {
									status : status,
									headers : headers,
									data : data
								});
							}
						}

						resolvePromise({
							status : status,
							statusText : statusText,
							headers : headers,
							data : data
						});

					} catch (e) {
						// Parse error
						console.error(config.logging.toString() + ' Good Network failure (parse error)', e, success);
						resolvePromise({
							status : 0,
							statusText : 'Good Network failure (parse error)'
						});
					}

				}, function(error) {
					// IO error
					request = null;
					var status = 0;
					var matches;
					if (matches = String(error).match(/^Error Status Code: (\d+)/)) {
						status = matches[1];
					}

					if (String(error).indexOf('IOException') > -1) {
						error = 'communication error';
					}

					resolvePromise({
						status : status,
						statusText : 'Good Network failure (' + (error || 'unknown error') + ')'
					});
				});

				// If timeout is a promise, abort GD request when resolved
				if (!gdTimeoutSeconds) {
					$q.when(config.timeout).then(function gdRequestAbort() {
						if (request != null) {
							console.warn(config.logging.toString() + ' Request aborted');
							resolvePromise({
								status : 0,
								statusText : 'abort'
							});
							request.abort();
						}
					});
				}

				return promise;

				function resolvePromise(result) {
					var status = Math.max((+result.status || 0), 0);
					(isSuccess(status) ? deferred.resolve : deferred.reject)({
						config : config,
						status : status,
						statusText : result.statusText,
						headers : result.headers || headersGetter(),
						data : result.data
					});
				}
			}
		}

		function createShortMethod(name) {
			return function(url, config) {
				return gdHttp(angular.extend(config || {}, {
					method : name,
					url : url
				}));
			};
		}

		function createShortMethodWithData(name) {
			return function(url, data, config) {
				return gdHttp(angular.extend(config || {}, {
					method : name,
					url : url,
					data : data
				}));
			};
		}

		return {
			'delete' : createShortMethod('delete'),
			get : createShortMethod('get'),
			head : createShortMethod('head'),
			post : createShortMethodWithData('post'),
			put : createShortMethodWithData('put')
		};
	});
})();
