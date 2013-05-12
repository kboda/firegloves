
var FireGloves = new function() {
    var t = this;
	Components.utils.import("resource://fgmodules/module.js");
    
	this.selected_config = function() {
	
		if (gBrowser.selectedBrowser == null) {
			return null;
		}
		var browser = gBrowser.selectedBrowser;
		if (browser != null) {

			var cfg = jsbeautifier.getConfig(browser);
			return cfg;
		}
		
		return null;
	};
	
	this.update_text = function(browser) {
		
        var cfg = t.selected_config();
        if (cfg != null) {
            this.toggleToolbarButton('fireglovesOn', cfg.active);
        }

	};

	this.toggle = function() {
		
		var cfg = t.selected_config();
			if (cfg != null) {
				cfg.active = !cfg.active;
				t.update_text();
				uasOverride.load(cfg.active);
                gBrowser.selectedBrowser.webNavigation.reload(gBrowser.selectedBrowser.webNavigation.LOAD_FLAGS_BYPASS_CACHE);
			}
		
	};

    var iPrefs = function(prefBranch) {
        var Cc = Components.classes;
        var Ci = Components.interfaces;
		this.prefs = null;
		this.prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(prefBranch);
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
            
		this.clearPref = function(pref) {
			this.prefs.clearUserPref(pref);
		};
		this.setPrefC = function(pref, value) {
			this.prefs.setCharPref(pref, value);
		};
        this.getPrefC = function(pref) {
			return this.prefs.getCharPref(pref);
		};
        this.getPrefB = function(pref) {
            return this.prefs.getBoolPref(pref);
        };
        this.setPrefB = function(pref, value) {
			this.prefs.setBoolPref(pref, value);
		};
	};
    
	var uasOverride = {
		set: function() {
            var fgp = new iPrefs("extensions.firegloves.");
            var uasp = new iPrefs("general.useragent.");
            uasp.setPrefC("override", fgp.getPrefC("userAgent"));
            var intlp = new iPrefs("intl.");
            intlp.setPrefC("accept_languages", fgp.getPrefC("acceptLanguage"));
		},
		clear: function() {
            new iPrefs("general.useragent.").clearPref("override");
            new iPrefs("intl.").clearPref("accept_languages");
		},
		load: function(active) {
			if (active) this.set();
			else this.clear();
		}
	};
    
    this.init = function() {
        var fgprefs = new iPrefs("extensions.firegloves.");
        
        // first run init
        if (!fgprefs.getPrefB("firstRunDone")) {
            fgprefs.setPrefB("firstRunDone", true);
            
            // https://developer.mozilla.org/en-US/docs/Code_snippets/Toolbar
            /**
             * Installs the toolbar button with the given ID into the given
             * toolbar, if it is not already present in the document.
             *
             * @param {string} toolbarId The ID of the toolbar to install to.
             * @param {string} id The ID of the button to install.
             * @param {string} afterId The ID of the element to insert after. @optional
             */
            function installButton(toolbarId, id, afterId) {
                if (!document.getElementById(id)) {
                    var toolbar = document.getElementById(toolbarId);
             
                    // If no afterId is given, then append the item to the toolbar
                    var before = null;
                    if (afterId) {
                        let elem = document.getElementById(afterId);
                        if (elem && elem.parentNode == toolbar)
                            before = elem.nextElementSibling;
                    }
             
                    toolbar.insertItem(id, before);
                    toolbar.setAttribute("currentset", toolbar.currentSet);
                    document.persist(toolbar.id, "currentset");
             
                    if (toolbarId == "addon-bar")
                        toolbar.collapsed = false;
                }
            }
            
            installButton("nav-bar", "firegloves-toolbar-button");
        }
    };

	this.load = function() {
		
        t.init();
		t.update_text();
		
		var container = gBrowser.tabContainer;
		if (typeof container == 'undefined') {
			alert('Loading error - FireGloves');
		}
		container.addEventListener("TabOpen", t.tabOpen, false);
		container.addEventListener("TabClose", t.tabClose, false);
		container.addEventListener("TabSelect", t.tabSelect, false);
        
        var fgonauto = !!privateBrowsingListener.inPrivateBrowsing ||(new iPrefs("extensions.firegloves.").getPrefB("fgonauto"));
        if (fgonauto) uasOverride.load(true);
		
		for (var i = 0; i < container.childNodes.length; ++i) {
            var browser = gBrowser.getBrowserForTab(container.childNodes[i]);
			jsbeautifier.add(browser, window.Worker);
            
            var cfg = jsbeautifier.getConfig(browser);
            if (cfg != null) {
                // privát mód, vagy auto engedélyezés!
                cfg.active = fgonauto;
                t.update_text(browser);
            }
		}
		
	};
	
	this.unload = function() {
        try {
            for (var i = 0; i < container.childNodes.length; ++i) {
                jsbeautifier.remove(gBrowser.getBrowserForTab(container.childNodes[i]));
            }
            container.removeEventListener("TabOpen", t.tabOpen, false);  
            container.removeEventListener("TabClose", t.tabClose, false);
            container.removeEventListener("TabSelect", t.tabClose, false);
        } catch (e) {}
	};
	
	this.tabOpen = function(event) {
		var browser = gBrowser.getBrowserForTab(event.target);
		jsbeautifier.add(browser, window.Worker);
		
        var cfg = jsbeautifier.getConfig(browser);
        if (cfg != null) {
            // privát mód, vagy auto engedélyezés!
            cfg.active = !!privateBrowsingListener.inPrivateBrowsing || (new iPrefs("extensions.firegloves.").getPrefB("fgonauto"));
            t.update_text(browser);
        }
	};
	
	this.tabClose = function(event) {
		var browser = gBrowser.getBrowserForTab(event.target);
		jsbeautifier.remove(browser);
	};
	
	this.tabSelect = function(event) {
		t.update_text();
	};
    
    this.close = function(event) {
        uasOverride.load(false);
    };
    
    this.toggleToolbarButton = function(c, s) {
        if (typeof s == 'undefined') s = true;
        try {
            var btn = document.getElementById("firegloves-toolbar-button");
            btn.setAttribute(c, s);
        } catch (e) {}
    };
    
    this.clearCookies = function() {
        var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
            .getService(Components.interfaces.nsICookieManager);
        cookieManager.removeAll();
        gBrowser.selectedBrowser.contentWindow.wrappedJSObject.name = '';
    };
    
    this.clearFontCache = function() {
        var cfg = t.selected_config();
        if (cfg != null) {
            cfg.fontCache = [];
            gBrowser.selectedBrowser.webNavigation.reload(gBrowser.selectedBrowser.webNavigation.LOAD_FLAGS_BYPASS_CACHE);
        }
    };
    
    this.showStats = function() {
        var FGS = null;
        try {
            FGS = JSON.parse(
                JSON.stringify(gBrowser.selectedBrowser.contentWindow.wrappedJSObject.FireGlovesStats)
            );
        } catch (e) {}
        if (!FGS || typeof FGS != 'object') FGS = {};
        var cfg = t.selected_config();
        function mergeUnique(a1, a2) {
            for (var i in a2) {
                if (a1.indexOf(a2[i]) === -1) a1.push(a2[i]);
            }
            return a1;
        }
        if (cfg != null && cfg.fontCache.length > 0) {
            if (FGS.fontCache && FGS.fontCache.length) {
                FGS.fontCache = mergeUnique(FGS.fontCache, cfg.fontCache);
            } else {
                FGS.fontCache = cfg.fontCache;
            }
        }
        
        window.openDialog(
            "chrome://firegloves/content/tabStats.xul",
            "firegloves-tabstats-window", "chrome,centerscreen,modal", FGS);
    };
    
    this.openPreferences = function() {
      if (null == this._preferencesWindow || this._preferencesWindow.closed) {
        let instantApply =
          new iPrefs("browser.preferences.").getPrefB("instantApply");
        let features =
          "chrome,titlebar,toolbar,centerscreen" +
          (instantApply.value ? ",dialog=no" : ",modal");
     
        this._preferencesWindow =
          window.openDialog(
            "chrome://firegloves/content/options.xul",
            "firegloves-preferences-window", features);
      }
     
      this._preferencesWindow.focus();
    };
	
	window.addEventListener("load", t.load, false);
	window.addEventListener("unload", t.unload, false);
	window.addEventListener("close", t.close, false);
	
	// kiegészítés privát mód figyeléséhez --> https://developer.mozilla.org/En/Supporting_private_browsing_mode
	
	function PrivateBrowsingListener() {
		this.init();
	}
	PrivateBrowsingListener.prototype = {
		_os: null,
		_inPrivateBrowsing: false, // whether we are in private browsing mode
		_watcher: null, // the watcher object

		init : function () {
			this._inited = true;
			this._os = Components.classes["@mozilla.org/observer-service;1"]
							 .getService(Components.interfaces.nsIObserverService);
			this._os.addObserver(this, "private-browsing", false);
			this._os.addObserver(this, "quit-application", false);
			try {
				var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
							  .getService(Components.interfaces.nsIPrivateBrowsingService);
				this._inPrivateBrowsing = pbs.privateBrowsingEnabled;
			} catch(ex) {
			  // ignore exceptions in older versions of Firefox
			}
		},

		observe : function (aSubject, aTopic, aData) {
			if (aTopic == "private-browsing") {
				if (aData == "enter") {
					this._inPrivateBrowsing = true;
					if (this.watcher &&
					"onEnterPrivateBrowsing" in this._watcher) {
						this.watcher.onEnterPrivateBrowsing();
					}
				} else if (aData == "exit") {
					this._inPrivateBrowsing = false;
					if (this.watcher &&
						"onExitPrivateBrowsing" in this._watcher) {
							this.watcher.onExitPrivateBrowsing();
					}
				}
			} else if (aTopic == "quit-application") {
				this._os.removeObserver(this, "quit-application");
				this._os.removeObserver(this, "private-browsing");
			}
		},

		get inPrivateBrowsing() {
			return this._inPrivateBrowsing;
		},

		get watcher() {
			return this._watcher;
		},

		set watcher(val) {
			this._watcher = val;
		}
	};
	
    var privateBrowsingListener = new PrivateBrowsingListener();
    privateBrowsingListener.watcher = {
        onEnterPrivateBrowsing : function() {
            // we have just entered private browsing mode!
            
            // if 'start with private browsing mode' on
            if (new iPrefs("extensions.firegloves.").getPrefB("fgonprivate")) {
                var cfg = t.selected_config();
                if (cfg != null) {
                    cfg.active = true;
                    t.update_text();
                    uasOverride.load(cfg.active);
                    /*
                    if (new iPrefs("extensions.firegloves.").getPrefB("fgalert")) {
                        alert('FireGloves is active!');
                    }
                    */
                }
            }
        },

        onExitPrivateBrowsing : function() {
            // we have just left private browsing mode!
            var cfg = t.selected_config();
            if (cfg != null) {
                cfg.active = false;
                t.update_text();
                uasOverride.load(cfg.active);
            }
        }
    };
    
    
    // kiegészítés addon uninstall figyeléshez
    
    var addonListener = {
        onUninstalling: function(addon, restart) {
            if (addon.id == "firegloves@fingerprint.pet-portal.eu") {
                // reset Firefox prefs
                new iPrefs("general.useragent.").clearPref("override");
                new iPrefs("intl.").clearPref("accept_languages");
                // remove FG prefs
                new iPrefs("extensions.").prefs.deleteBranch("firegloves");
            }
        }
    }

    try {
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.addAddonListener(addonListener);
    } catch (ex) { alert(ex); }

};
