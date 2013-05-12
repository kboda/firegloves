var EXPORTED_SYMBOLS = ["jsbeautifier"]; 
Components.utils.import("resource://fgmodules/notracking.js");
jsbeautifier = {
	windows : [],
	
	add: function(browser, worker) {
		this.windows.push({browser: browser, cfg: {active: false, fontCache: []}, worker: worker});
	},
	
	getConfig: function(browser) {
		for (var i = 0; i < this.windows.length; ++i) {
			if (this.windows[i].browser == browser) {
				return this.windows[i].cfg;
			}
		}
	},
	
	remove: function(browser) {
		var idx = -1;
		/* when tabs are migrated we get a TabOpen followed by a TabClose */
		for (var i = 0; i < this.windows.length; ++i) {
			if (this.windows[i].browser == browser) {
				idx = i;
				break;
			}
		}
		
		if (idx >= 0) {
			this.windows.splice(idx, 1);
		}
	}
};

var jsb = function() {

	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	var contentTypes = ["text/javascript", "application/javascript", "application/x-javascript"];
	
	/* utf8 is safe because all the multibyte characters have the high bit set. high five */
	var ascii_safe_charsets = ["utf-8", "utf8", "ascii", "iso-8859-1"];
	
	var iPrefs = function(prefBranch) {
        this.prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(prefBranch);
        this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
            
		this.clearPref = function(pref) {
			this.prefs.clearUserPref(pref);
		};
		this.setPrefC = function(pref, value) {
			this.prefs.setCharPref(pref, value);
		};
        this.getPrefI = function(pref) {
            return this.prefs.getIntPref(pref);
        };
        this.getPrefB = function(pref) {
            return this.prefs.getBoolPref(pref);
        };
	};
    
    var fgprefs = new iPrefs("extensions.firegloves.");
		
	var prefsObserver = {
		observe : function(subject, topic, data) {
			if (topic != "nsPref:changed") {
				return;
			}
			
			if (data == "contenttypes") {
				this.updateContentTypes();
			} else if (data == "userAgent") {
				this.overrideUserAgent();
			} else if (data == "acceptLanguage") {
				this.overrideAcceptLanguage();
			}
		},
		
		updateContentTypes: function() {
			var str = this.prefs.getCharPref("contenttypes");
			if (str == null) {
				return;
			}
			
			contentTypes = str.split(",");
		},
		
		overrideUserAgent: function() {
			var uasprefs = new iPrefs("general.useragent.");
			var str = this.prefs.getCharPref("userAgent");
			if (str.length == 0) {
				uasprefs.clearPref("override");
			} else {
				uasprefs.setPrefC("override", str);
			}
		},
        
        overrideAcceptLanguage: function() {
			var intlprefs = new iPrefs("intl.");
			var str = this.prefs.getCharPref("acceptLanguage");
			if (str.length == 0) {
				intlprefs.clearPref("accept_languages");
			} else {
				intlprefs.setPrefC("accept_languages", str);
			}
		},
		
		register : function() {
			this.prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.firegloves.");
			this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
			this.prefs.addObserver("", this, false);
			this.updateContentTypes();
		},
		
		QueryInterface : function(aIID) {
			if (aIID.equals(Ci.nsIObserver) ||
				aIID.equals(Ci.nsISupports))
			{
				return this;
			}
	
			throw Components.results.NS_NOINTERFACE;
		}
	};
	
	var httpRequestObserver = {
		observe: function(subject, topic, data) {
			if ((topic == 'http-on-examine-response' || topic == 'http-on-examine-cached-response')) {
				if (subject instanceof Ci.nsIHttpChannel) {
					
					
					subject.QueryInterface(Ci.nsITraceableChannel);
					subject.QueryInterface(Ci.nsIHttpChannel);
					
					var context = this.getContext(this.getWindowFromChannel(subject));

					if (context != null  && context.cfg.active) {
						var newListener = new JSBeautifierListener();
						newListener.worker = context.worker;
						newListener.originalListener = subject.setNewListener(newListener);
					}
				}
			}
		},
		
		
		getWindowFromChannel: function(aChannel) {
			var ctx = this.getLoadContext(aChannel);
			if (ctx) {
				return ctx.associatedWindow;
			}
			
			return null;
		},
		
		getContext : function(win)
		{
			for (; win; win = win.parent) {
				for (var i = 0; i < jsbeautifier.windows.length; ++i) {
					var entry =  jsbeautifier.windows[i];
					if (entry.browser.contentWindow == win) {
						return entry;
					}
				}
				
				if (win.parent == win) {
					return null;
				}
			}
		    return null;
		},
		
		
		getLoadContext: function (aChannel) {  
			try {  
				if (aChannel.notificationCallbacks) {
					return aChannel.notificationCallbacks.getInterface(Ci.nsILoadContext);
				}
			} catch (e) {
				
			}
		   
			try {
				if (aChannel && aChannel.loadGroup && aChannel.loadGroup.notificationCallbacks) {
					return aChannel.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext);
				}
			} catch (e) {
				
			}
		     
		
		   return null; 
		},
		
		

		register: function() {
			var observerService = Cc["@mozilla.org/observer-service;1"]
				.getService(Ci.nsIObserverService);

			observerService.addObserver(this,
				"http-on-examine-cached-response", false);
			observerService.addObserver(this,
				"http-on-examine-response", false);
		},

		
		QueryInterface : function(aIID) {
			if (aIID.equals(Ci.nsIObserver) ||
				aIID.equals(Ci.nsISupports))
			{
				return this;
			}
	
			throw Components.results.NS_NOINTERFACE;
		}
	};
	
	function CCIN(cName, ifaceName) {
    	return Cc[cName].createInstance(Ci[ifaceName]);
	}
    
    function mergeUnique(a1, a2, max) {
        for (var i in a2) {
            if (a1.length >= max) break;
            if (a1.indexOf(a2[i]) === -1) a1.push(a2[i]);
        }
        return a1;
    }

	function JSBeautifierListener() {
		this.intercept = false;
		this.receivedData = [];
        
        this.setFontCache = function (subject, fontCache) {
            if (subject instanceof Ci.nsIHttpChannel) {
                subject.QueryInterface(Ci.nsITraceableChannel);
                subject.QueryInterface(Ci.nsIHttpChannel);
                
                var context = this.getContext(this.getWindowFromChannel(subject));

                if (context != null  && context.cfg.active) {
                    context.cfg.fontCache = mergeUnique(context.cfg.fontCache, fontCache, fgprefs.getPrefI('fontCacheMax'));
                }
            }
        };
        
        this.getFontCache = function (subject) {
            if (subject instanceof Ci.nsIHttpChannel) {
                subject.QueryInterface(Ci.nsITraceableChannel);
                subject.QueryInterface(Ci.nsIHttpChannel);
                
                var context = this.getContext(this.getWindowFromChannel(subject));

                if (context != null  && context.cfg.active) {
                    return context.cfg.fontCache;
                }
            }
            return false;
        };
        
        this.QueryInterface = function(aIID) {
			if (aIID.equals(Ci.nsIObserver) ||
				aIID.equals(Ci.nsISupports))
			{
				return this;
			}
	
			throw Components.results.NS_NOINTERFACE;
		};
        
        this.getWindowFromChannel = function(aChannel) {
			var ctx = this.getLoadContext(aChannel);
			if (ctx) {
				return ctx.associatedWindow;
			}
			
			return null;
		};
		
		this.getContext = function(win)
		{
			for (; win; win = win.parent) {
				for (var i = 0; i < jsbeautifier.windows.length; ++i) {
					var entry =  jsbeautifier.windows[i];
					if (entry.browser.contentWindow == win) {
						return entry;
					}
				}
				
				if (win.parent == win) {
					return null;
				}
			}
		    return null;
		};
		
		this.getLoadContext = function (aChannel) {  
			try {  
				if (aChannel.notificationCallbacks) {
					return aChannel.notificationCallbacks.getInterface(Ci.nsILoadContext);
				}
			} catch (e) {
				
			}
		   
			try {
				if (aChannel && aChannel.loadGroup && aChannel.loadGroup.notificationCallbacks) {
					return aChannel.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext);
				}
			} catch (e) {
				
			}
            return null; 
		};
	}
	
	JSBeautifierListener.prototype.isCharsetCompatible = function(subject) {
		subject.QueryInterface(Ci.nsIChannel);
		var charset = subject.contentCharset;
		/* assume no charset is a safe charset.. not necessarily true :( */
		if (charset == null || charset == "") {
			return true;
		}
		
		charset = charset.toLowerCase();
		for (var i = 0; i < ascii_safe_charsets.length; ++i) {
			var set = ascii_safe_charsets[i];
			if (set == charset) {
				return true;
			}
		}
		
		return false;
	};
	
	JSBeautifierListener.prototype.isObservedType = function(subject) {
			try {
				if (subject instanceof Ci.nsIHttpChannel) {
					subject.QueryInterface(Ci.nsIHttpChannel);
					
					
					var contentType = subject.getResponseHeader("Content-Type");
					if (contentType == null) {
						return false;
					}
					
					for (var i = 0; i < contentTypes.length; ++i) {
						if (contentType.indexOf(contentTypes[i]) !== -1) {
							return true;
						} 
					}
					
					
					return false;
				}
			} catch (err) {
				// ignore
			}
			
			return false;
	};
    
    JSBeautifierListener.prototype.getContentType = function(subject) {
			try {
				if (subject instanceof Ci.nsIHttpChannel) {
					subject.QueryInterface(Ci.nsIHttpChannel);
					
					
					var contentType = subject.getResponseHeader("Content-Type");
					if (contentType == null) {
						return false;
					}
					
                    return contentType;
				}
			} catch (err) {
				// ignore
			}
			
			return false;
	};
		
	JSBeautifierListener.prototype.onDataAvailable = function(request, context, inputStream, offset, count) {
		if (this.intercept) {
			var binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1",
					"nsIBinaryInputStream");
	
			binaryInputStream.setInputStream(inputStream);
			var data = binaryInputStream.readBytes(count);
			this.receivedData.push(data);
		} else {
			try {
				this.originalListener.onDataAvailable(request, context, inputStream, offset, count);
			} catch (err) {
				request.cancel(err.result);
			}
		}
	};
	
	JSBeautifierListener.prototype.onStartRequest = function(request, context) {
		this.intercept = this.isObservedType(request) && this.isCharsetCompatible(request);
		try {
			this.originalListener.onStartRequest(request, context);
		} catch (err) {
			request.cancel(err.result);
		}
	};
	
	JSBeautifierListener.prototype.spawnWorker = function(request, context, statusCode) {
		var worker = new this.worker("chrome://firegloves/content/worker.js");
        //var dump = "";
        //var l = this.getFontCache(request);
        //for (var i in l) try { dump += i + ":" + l[i] + ", "; } catch (e) {}
        //jsbeautifier.windows[0].browser.contentWindow.alert(dump);
        var fontCacheMax = fgprefs.getPrefB('fontsDisabled') ? fgprefs.getPrefI('fontCacheMax') : -1;
        var data = { script: this.receivedData, contentType: this.getContentType(request), fontCache: this.getFontCache(request), fontCacheMax: fontCacheMax };
        if (data.contentType.indexOf("text/css") == -1) {
            data.magic = magic(data.fontCache.slice(), fontCacheMax);
        }
        worker.postMessage(data);
        
		this.receivedData = null;
		
		var t = this;
		var onMessage = function(event) {
            /*
            var dump = "";
            var l = event.data.fontCache;
            for (var i in l) try { dump += i + ":" + l[i] + ", "; } catch (e) {}
            jsbeautifier.windows[0].browser.contentWindow.alert(dump);
            */
            t.setFontCache(request, event.data.fontCache);
			var new_js = event.data.script;
			var storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
			storageStream.init(8192, new_js.length, null);
            if (new_js.length > 0) {
                try {
                    var os = storageStream.getOutputStream(0);
                    os.write(new_js, new_js.length);
                    os.close();
                } catch (e) { }
            }
            
			try {
				t.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, new_js.length);
			} catch (err) {
				// ignore .. this is after onStopRequest.. so there is not much we can do..
			}
			
			try {
				t.originalListener.onStopRequest(request, context, statusCode);
			} catch (err) {
				// ignore .. this is after onStopRequest.. so there is not much we can do..
			}
		};
		worker.onmessage = onMessage;
	};
		
	JSBeautifierListener.prototype.onStopRequest = function(request, context, statusCode) {
		if (this.intercept) {
			this.spawnWorker(request, context, statusCode);
		} else {
			try {
				this.originalListener.onStopRequest(request, context, statusCode);
			} catch (err) {
				// ignore
			}
		}
	};
	
	JSBeautifierListener.prototype.QueryInterface = function(aIID) {
			if (aIID.equals(Ci.nsIStreamListener) ||
				aIID.equals(Ci.nsISupports)) {
				return this;
			}
			throw Components.results.NS_NOINTERFACE;
	};
	
	prefsObserver.register();
	httpRequestObserver.register();
	
}();


