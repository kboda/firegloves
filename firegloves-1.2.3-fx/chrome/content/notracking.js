/* noTracking.js */
var EXPORTED_SYMBOLS = ["magic"];

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
    this.setPrefI = function(pref, value) {
        this.prefs.setIntPref(pref, value);
    };
    
    this.getPrefB = function(pref) {
		return this.prefs.getBoolPref(pref);
	};
    this.getPrefC = function(pref) {
        return this.prefs.getCharPref(pref);
    };
    this.getPrefI = function(pref) {
        return this.prefs.getIntPref(pref);
    };
    this.getPrefA = function(pref) {
		return this.prefs.getCharPref(pref).split(',');
	};
    
    this.getPrefType = function(pref) {
        return this.prefs.getPrefType(pref);
    };
};

var ntprefs = new iPrefs("extensions.firegloves.");

var m = {
	randomMode: "",
	screenRes: "",
    screenResObj: {},
	platform: "",
	language: "",
	timeZone: "",
	userAgent: "",
	appVersion: "",
	plugins: "",
	mimeTypes: ""
};

function randomElement(arr) {
	var rnd = Math.floor(Math.random()*arr.length);
	return arr[rnd];
}

function randomNumber(from, to) {
	return Math.floor(Math.random()*(to-from))-(to-from)/2;
}

function magic(fontCache, fontCacheMax) {

// Random or manual properties

if (ntprefs.getPrefB("randomMode")) {

	m.randomMode = "/* Random mode On */\r\n";
	
    var res = randomElement(ntprefs.getPrefA("screenResolutions")).split('x');
	m.screenRes = "{ width: "+res[0]+", height: "+res[1]+", availWidth: "+res[0]+", availHeight: "+res[1]+", colorDepth: 24 }";
    m.screenResObj = { width: res[0], height: res[1] };
	m.platform = randomElement(ntprefs.getPrefA("platforms"));
	m.language = randomElement(ntprefs.getPrefA("languages"));
	m.timeZone = ""+randomNumber(-3,3)*60; // egyéb túl feltűnő..
	
} else {

	m.randomMode = "/* Random mode Off */\r\n";
    
	var res = ntprefs.getPrefC("screenResolution").split('x');
	if (res.length < 2) res = randomElement(ntprefs.getPrefA("screenResolutions")).split('x');
	m.screenRes = "{ width: "+res[0]+", height: "+res[1]+", availWidth: "+res[0]+", availHeight: "+res[1]+", colorDepth: 24 }";
    m.screenResObj = { width: res[0], height: res[1] };
	m.platform = ntprefs.getPrefC("platform");
	if (m.platform.length == 0) m.platform = "Win32";
	m.language = ntprefs.getPrefC("language");
	if (m.language.length == 0) m.language = "en";
	m.timeZone = ""+parseInt(ntprefs.getPrefC("timeZone"))*60;
	if (m.timeZone.length == 0) m.timeZone = "-60";
	
}

// Browser strings

m.userAgent = ntprefs.getPrefC("userAgent");
m.appVersion = ntprefs.getPrefC("appVersion");

////

// Collections

if (ntprefs.getPrefB("pluginsDisabled")) m.plugins = "{length:0}";
//if (ntprefs.getPrefB("mimeTypesDisabled")) m.mimeTypes = "{length:0}";

////

///////////////////////

// Fonts init
var fontFamily = "";
fontFamily += "var fontFamilySetter_T = CSSStyleDeclaration.prototype.__lookupSetter__('fontFamily'); \r\n";
fontFamily += "var CSSSetprop_T = CSSStyleDeclaration.prototype.setProperty; \r\n";
fontFamily += "var innerHTMLSetter_T = HTMLElement.prototype.__lookupSetter__('innerHTML'); \r\n";
fontFamily += "var outerHTMLSetter_T = HTMLElement.prototype.__lookupSetter__('outerHTML'); \r\n";
fontFamily += "var setAttribute_T = HTMLElement.prototype.setAttribute; \r\n";
fontFamily += "var offsetWidthGetter_T = HTMLElement.prototype.__lookupGetter__('offsetWidth'); \r\n";
fontFamily += "var offsetHeightGetter_T = HTMLElement.prototype.__lookupGetter__('offsetHeight'); \r\n";
fontFamily += "var attrValueSetter_T = Attr.prototype.__lookupSetter__('value'); \r\n";
fontFamily += "var attrNodeValueSetter_T = Attr.prototype.__lookupSetter__('nodeValue'); \r\n";
fontFamily += "var attrTextContentSetter_T = Attr.prototype.__lookupSetter__('textContent'); \r\n";
fontFamily += "var HTMLElements_T = ['HTMLAnchorElement','HTMLAppletElement','HTMLAudioElement','HTMLAreaElement','HTMLBaseElement','HTMLBaseFontElement','HTMLBodyElement','HTMLBRElement','HTMLButtonElement','HTMLCanvasElement','HTMLDirectoryElement','HTMLDivElement','HTMLDListElement','HTMLEmbedElement','HTMLFieldSetElement','HTMLFontElement','HTMLFormElement','HTMLFrameElement','HTMLFrameSetElement','HTMLHeadElement','HTMLHeadingElement','HTMLHtmlElement','HTMLHRElement','HTMLIFrameElement','HTMLImageElement','HTMLInputElement','HTMLKeygenElement','HTMLLabelElement','HTMLLIElement','HTMLLinkElement','HTMLMapElement','HTMLMenuElement','HTMLMetaElement','HTMLModElement','HTMLObjectElement','HTMLOListElement','HTMLOptGroupElement','HTMLOptionElement','HTMLOutputElement','HTMLParagraphElement','HTMLParamElement','HTMLPreElement','HTMLQuoteElement','HTMLScriptElement','HTMLSelectElement','HTMLSourceElement','HTMLSpanElement','HTMLStyleElement','HTMLTableElement','HTMLTableCaptionElement','HTMLTableCellElement','HTMLTableDataCellElement','HTMLTableHeaderCellElement','HTMLTableColElement','HTMLTableRowElement','HTMLTableSectionElement','HTMLTextAreaElement','HTMLTimeElement','HTMLTitleElement','HTMLTrackElement','HTMLUListElement','HTMLUnknownElement','HTMLVideoElement']; \r\n";
for (var i in fontCache) { fontCache[i] = fontCache[i].replace(/"/gi, '\\"'); }
fontFamily += "var fontCache_T = " + (fontCache.length ? ('["' + fontCache.join('","') + '"]') : '[]') + "; \r\n";
fontFamily += "for (var i_T in fontCache_T) { fontCache_T[i_T] = fontCache_T[i_T].replace(/\\\"/gi, '\"'); } \r\n";
fontFamily += "var fontCacheMax_T = " + fontCacheMax + "; \r\n";
fontFamily += "function cleanCSS_T(d) { if (typeof d != 'string') return d; var fc = fontCache_T; var p = /font(\\-family)?([\\s]*:[\\s]*)((([\"'][\\w\\d\\s\\.\\,\\-@]*[\"'])|([\\w\\d\\s\\.\\,\\-@]))+)/gi; "+
    "function r(m, pa, p0, p1, o, s) { "+
        "var p1o = p1; p1 = p1.replace(/(^\\s+)|(\\s+$)/gi, '').replace(/\\s+/gi, ' '); "+
        "if (p1.length < 2) { p1o = ''; } else if (fc.indexOf(p1) == -1) { if (fc.length < fontCacheMax_T) { fc.push(p1); } else { p1o = fc[0]; } } "+
        "return 'font' + pa + p0 + p1o; } "+
    "fontCache_T = fc; return d.replace(p, r); } \r\n";
fontFamily += "var setTimeout_T = Window.prototype.setTimeout; \r\n";
fontFamily += "var contentWindowGetter_T = HTMLIFrameElement.prototype.__lookupGetter__('contentWindow'); \r\n";

fontFamily += "function ds_T(o, a, f) { o.__defineSetter__(a, f); o.__lookupSetter__(a).toString = function() { return ''; }; o.__lookupSetter__(a).toSource = function() { return ''; }; } \r\n";
fontFamily += "function dg_T(o, a, f) { o.__defineGetter__(a, f); o.__lookupGetter__(a).toString = function() { return ''; }; o.__lookupGetter__(a).toSource = function() { return ''; }; } \r\n";
fontFamily += "function df_T(o, a, f) { o[a] = f; o[a].toString = function() { return ''; }; o[a].toSource = function() { return ''; }; } \r\n";

if (ntprefs.getPrefB("fakeOffset")) {    
    fontFamily += "var fOTimeout_T = " + ntprefs.getPrefI("fakeOffsetTimeout") + "; \r\n";
    fontFamily += "var fOAfter_T = " + ntprefs.getPrefI("fakeOffsetAfter") + "; \r\n";
    fontFamily += "var offsetRand_T = fOAfter_T, offsetTimeout_T = false; \r\n";
}

function eq(s) {
    return s.substring(1, s.length-1).replace(/"/g, "'");
}

function mf(t, o, a, f) {
    return t + '_T(' + o + ', "' + a + '", ' + f + '); \r\n';
}

function ds(o, a, f) {
    if (typeof f == 'function') f = eq(f.toSource());
    return mf('ds', o, a, f);
}

function dg(o, a, f) {
    if (typeof f == 'function') f = eq(f.toSource());
    return mf('dg', o, a, f);
}

function df(o, a, f) {
    if (typeof f == 'function') f = eq(f.toSource());
    return mf('df', o, a, f);
}

/* window spec attribs */
function wndcloak(oName) {

    var spec = "/* window cloak */ \r\n";
    
    var HTMLmanip = "";
    var fakeOffset = "";

    // Fonts

    if (new iPrefs("browser.display.").getPrefI("use_document_fonts")) {
        
        if (ntprefs.getPrefB("fontsDisabled")) {
        
            // overriding font family setters
        
            // style.fontFamily = ...
            
            spec += ds(oName+".CSSStyleDeclaration.prototype", 'fontFamily', function(f) {
                d_T('fontFamily');
                if (fontCache_T.indexOf(f) == -1) {
                    if (fontCache_T.length < fontCacheMax_T) {
                        fontCache_T.push(f); v_T('fontCache', fontCache_T);
                    } else {
                        f = fontCache_T[0];
                    }
                }
                fontFamilySetter_T.call(this, f);
            });
            
            // style.setProperty('font-family', ... );
            
            spec += df(oName+".CSSStyleDeclaration.prototype", 'setProperty', function (propertyName, value, priority) {
                if (propertyName == 'font-family') {
                    d_T('fontFamily');
                    if (fontCache_T.indexOf(value) == -1) {
                        if (fontCache_T.length < fontCacheMax_T) {
                            fontCache_T.push(value); v_T('fontCache', fontCache_T);
                        } else {
                            value = fontCache_T[0];
                        }
                    }
                }
                CSSSetprop_T.call(this, propertyName, value, priority);
            });
            
            // overriding Attr value setters
            
            // attr.value
            spec += ds(oName+".Attr.prototype", 'value', function(v) {
                d_T('HTMLmanip');
                attrValueSetter_T.call(this, cleanCSS_T(v));
            });
            // attr.nodeValue
            spec += ds(oName+".Attr.prototype", 'nodeValue', function(v) {
                d_T('HTMLmanip');
                attrNodeValueSetter_T.call(this, cleanCSS_T(v));
            });
            // attr.textContent
            spec += ds(oName+".Attr.prototype", 'textContent', function(v) {
                d_T('HTMLmanip');
                attrTextContentSetter_T.call(this, cleanCSS_T(v));
            });
            
            // overriding HTML insertion
            HTMLmanip =
                // innerHTML
                ds(oName+"[HTMLElements_T[e]].prototype", 'innerHTML', function(f) {
                    d_T('HTMLmanip');
                    innerHTMLSetter_T.call(this, cleanCSS_T(f));
                })+
                // outerHTML
                ds(oName+"[HTMLElements_T[e]].prototype", 'outerHTML', function(f) {
                    d_T('HTMLmanip');
                    outerHTMLSetter_T.call(this, cleanCSS_T(f));
                })+
                // setAttribute(a, v)
                df(oName+"[HTMLElements_T[e]].prototype", 'setAttribute', function(a, v) {
                    d_T('HTMLmanip');
                    if (typeof v == 'string') v = cleanCSS_T(v);
                    setAttribute_T.call(this, a, v);
                });
            
        }
        
        if (ntprefs.getPrefB("fakeOffset")) {
        
            fakeOffset =
                // offsetWidth
                dg(oName+"[HTMLElements_T[e]].prototype", 'offsetWidth', function () {
                    d_T('offsetValue');
                    if (offsetRand_T == 0) {
                        if (offsetTimeout_T) clearTimeout(offsetTimeout_T);
                        offsetTimeout_T = setTimeout_T.call(window, function() { offsetRand_T = fOAfter_T; offsetTimeout_T = false}, fOTimeout_T);
                        return Math.round(Math.random()*1000);
                    } else { offsetRand_T--; return offsetWidthGetter_T.call(this); }
                });
                // offsetHeight
                dg(oName+"[HTMLElements_T[e]].prototype", 'offsetHeight', function () {
                    d_T('offsetValue');
                    if (offsetRand_T == 0) {
                        if (offsetTimeout_T) clearTimeout(offsetTimeout_T);
                        offsetTimeout_T = setTimeout_T.call(window, function() { offsetRand_T = fOAfter_T; offsetTimeout_T = false}, fOTimeout_T);
                        return Math.round(Math.random()*1000);
                    } else { offsetRand_T--; return offsetHeightGetter_T.call(this); }
                });
                
        }
        
        spec += "for (var e in HTMLElements_T) { "+
                    "if ("+oName+"[HTMLElements_T[e]]) { "+
                        // insert font clearing code
                        HTMLmanip+
                        // insert fake offset code
                        fakeOffset+
                    "} "+
                "} \r\n";
    }

    if (m.timeZone.length > 0) {
        spec += df(oName+".Date.prototype", 'getTimezoneOffset', "function() { d_T('timeZone'); return " + m.timeZone + "; }");
    }
    
    return spec;
    
}

/* iframe unhook */
function iframecloak(oName) {
    
    var spec = "/* iframe cloak */ \r\n";
    spec += dg(oName+".HTMLIFrameElement.prototype", 'contentWindow',
        "function() { d_T('iframeWindow'); "+
            "var w = contentWindowGetter_T.call(this); "+
            wndcpy("w", "window")+
            wndcloak("w")+
            "return w; }");
        
    return spec;
    
}

////

////////////////////////////

// Others

/* copy window attribs to other window obj */
function wndcpy(tObj, sObj) {
    var wndProps = [
        "screen","performance","Components","navigator","innerHeight","innerWidth","outerHeight","outerWidth"
        ];
    var wndP = "/* window copy */ \r\n";
    for (var i in wndProps) { // copy opener attribs to new window obj
        wndP += "try { Object.defineProperty("+tObj+",'"+wndProps[i]+"',{ value: "+sObj+"."+wndProps[i]+" }); } catch (e) {} \r\n";
    }
    wndP += tObj+".open = "+sObj+".open; \r\n";
    return wndP;
}

/* window open unhook */
var wnd = "/* window open */ \r\n";
wnd += "var wndOpen_T = Window.prototype.open; \r\n";
wnd += df("Window.prototype", 'open',
    "function(url, name, params) { d_T('windowOpen'); "+
        "var w = wndOpen_T.call(this, url, name, params); \r\n"+
        wndcpy("w", "w.opener")+
        wndcloak("w")+
        iframecloak("w")+
        "return w; }");

////

/* stats */
var display = ''+
'window.FireGlovesStats = {}; '+
'function d_T(k) { '+
    'if (!window.FireGlovesStats[k]) window.FireGlovesStats[k] = 0;'+
	'window.FireGlovesStats[k]++;'+
'} '+
'function v_T(k, v) { '+
    'window.FireGlovesStats[k] = v;'+
'} ';



/* build the script injection */	
	
var script = "\r\n\r\n<script type=\"text/javascript\">\r\n"+
	"/* protected by [ FireGloves ] script injection */ \r\n"+
	m.randomMode+"\r\n"+
    "(function() {\r\n"; // do not pollute the JS context..
	
script += display+"\r\n";

/* Window attribs */
if (m.screenRes.length > 0)  script += dg("Window.prototype", 'screen', "function() { d_T('screenRes'); return " + m.screenRes + "; }");
if (m.screenResObj.width) script    += dg("Window.prototype", 'innerWidth', "function() { d_T('screenRes'); return " + m.screenResObj.width + "; }")+
                                       dg("Window.prototype", 'outerWidth', "function() { d_T('screenRes'); return " + m.screenResObj.width + "; }");
if (m.screenResObj.height) script   += dg("Window.prototype", 'innerHeight', "function() { d_T('screenRes'); return " + m.screenResObj.height + "; }")+
                                       dg("Window.prototype", 'outerHeight', "function() { d_T('screenRes'); return " + m.screenResObj.height + "; }");
script += dg("Window.prototype", 'performance', "function() { d_T('timing'); return { navigation: {}, timing: {} }; }");
script += "try { Object.defineProperty(window, 'Components', { value: {} }); } catch (e) {} \r\n";

/* Navigator attribs */
if (m.userAgent.length > 0) script  += dg("navigator", 'userAgent', "function() { d_T('userAgent'); return '" + m.userAgent + "'; }");
if (m.appVersion.length > 0) script += dg("navigator", 'appVersion', "function() { d_T('appVersion'); return '" + m.appVersion + "'; }");
script += dg("navigator", 'buildID', "function() { d_T('buildID'); return undefined; }");
if (m.plugins.length > 0) script    +=
    df("PluginArray", 'refresh', "function(p) {}")+
    df("PluginArray", 'item', "function(i) { return null; }")+
    df("PluginArray", 'namedItem', "function(i) { return null; }")+
    dg("PluginArray", 'length', "function() { return 0; }")+
    dg("navigator", 'plugins', "function() { d_T('plugins'); return PluginArray; }")+
    dg("navigator", 'mimeTypes', "function() { d_T('plugins'); return MimeTypeArray; }");
if (m.platform.length > 0) script   += dg("navigator", 'platform', "function(){ d_T('platform'); return '" + m.platform + "'; }");
if (m.language.length > 0) script   += dg("navigator", 'language', "function(){ d_T('language'); return '" + m.language + "'; }");

// Disabling cheats...
//script += "Object.defineProperty(window,'navigator',{ value: navigator, writable: false }); \r\n";
script += fontFamily + "\r\n";
script += wndcloak("window");
script += iframecloak("window");
script += wnd + "\r\n";

// Remove this script to prevent reading it from JS
script += "var thisScriptElement = document.getElementsByTagName('script')[0]; thisScriptElement.parentNode.removeChild(thisScriptElement);\r\n";

script += "})();\r\n";
script += '</script>\r\n\r\n';

var T = Math.round(Math.random() * Math.pow(10, 16)); //(new Date()).getTime();
script = script.replace(/_T/g, T);

return script;
}