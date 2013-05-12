
onmessage = function(event) {
	var nok = true;
	var data = event.data.script.join("");
    var clean;
    //event.data.context.browser.contentWindow.alert("works!");
    
    if (event.data.contentType.indexOf("text/css") !== -1) {
        // CSS móka
        
        if (event.data.fontCacheMax !== -1) {
            var css = "\r\n/* protected by [ FireGloves ] css injection */\r\n\r\n";
            clean = cleanCSS(data, event.data.fontCache, event.data.fontCacheMax);
            data = css + clean.script;
        } else {
            clean = { fontCache: event.data.fontCache };
        }
        
    } else {
        // JS móka
        
        //var pattern = /[^<]?(<![^>]*>)?<html[^>]*>/i;
        var patterns = /(<script[^>]*>)/i;
        var patternd = /(<(head|body|html)[^>]*>)/i;
        
        data = cleanBase64(data); // base64 kódolt inline CSS dekódolása
        clean = cleanCSS(data, event.data.fontCache, event.data.fontCacheMax); // css tisztítás <style> és inline style miatt
        data = clean.script;
        
        // egyszerűen az első <script> elem elé beszúrjuk (mindenképp kell a futtatáshoz)
        if (patterns.test(data)) { // ha van benne script
            data = data.replace(patterns, event.data.magic + "$1");
        } else { // ha nincs script, csak beillesztjük a fejrészbe
            //console.log(pattern.exec(data));
            data = data.replace(patternd, "$1" + event.data.magic);
        }
        
        /*
        if (patterns.test(data)) { // csak akkor, ha van a teljes docban script!
            if (pattern.test(data)) { // ha van html (és doctype) akkor az után fusson
                var ins = pattern.exec(data);
                data = data.replace(pattern, ins[0] + event.data.magic);
            } else { // egyébként az egész előtt fusson, mert nem valid a html, lehet csapda!
                //var ins = patterns.exec(data);
                //data = data.replace(patterns, event.data.magic + ins[0]);
                data = event.data.magic + data;
            }
        }
        */
        
    }
	postMessage({ script: data, fontCache: clean.fontCache });
	this.close();
}

function cleanCSS(data, fontCache, fontCacheMax) {
    if (!fontCache) fontCache = [];
    var pattern = /font(\-family)?([\s]*:[\s]*)(((["'][\w\d\s\.\,\-@]*["'])|([\w\d\s\.\,\-@]))+)/gi;
    function replacer(match, pa, p0, p1, offset, string) {
        var p1o = p1;
        p1 = p1.replace(/(^\s+)|(\s+$)/gi, "").replace(/\s+/gi, " ");
        if (p1.length < 2) {
            p1o = "";
        } else if (fontCache.indexOf(p1) == -1) {
            // ha nincs a fontok között
            if (fontCache.length < fontCacheMax) {
                // ha nem értük el a maximum méretet
                fontCache.push(p1);
            } else {
                // ha elértük a max méretet
                p1o = "inherit"; //fontCache[0];
            }
        }
        return "font" + pa + p0 + p1o;
    }
    data = data.replace(pattern, replacer);
    return { script: data, fontCache: fontCache };
}

function cleanBase64(data) {
    var pattern = /<link[^>]*base64[\s]*,[\s]*([^">]*)[^>]*>/gi;
    function replacer(match, p1, offset, string) {
        try {
            p1 = atob(p1.replace(/\s/gi, '')); // base64 decode
        } catch (e) {
            p1 = "/* wrong base64 encoded style */";
        }
        return "<style type=\"text/css\">\r\n" + p1 + "\r\n</style>";
    }
    return data.replace(pattern, replacer);
}