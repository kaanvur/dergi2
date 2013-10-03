Monocle = {
    VERSION: "2.1.0"
};
Monocle.pieceLoaded = function (a) {
    if (typeof onMonoclePiece == "function") {
        onMonoclePiece(a)
    }
};
Monocle.defer = function (a, b) {
    if (a && typeof a == "function") {
        return setTimeout(a, b || 0)
    }
};
Monocle.Dimensions = {};
Monocle.Controls = {};
Monocle.Flippers = {};
Monocle.Panels = {};
Monocle.pieceLoaded("core/monocle");
Monocle.Env = function () {
    var API = {
        constructor: Monocle.Env
    };
    var k = API.constants = API.constructor;
    var p = API.properties = {
        resultCallback: null
    };
    var css = Monocle.Browser.css;
    var activeTestName = null;
    var frameLoadCallback = null;
    var testFrame = null;
    var testFrameCntr = null;
    var testFrameLoadedWithStandard = false;
    var testFrameSize = 100;
    var surveyCallback = null;

    function survey(cb) {
        surveyCallback = cb;
        runNextTest()
    }

    function runNextTest() {
        var test = envTests.shift();
        if (!test) {
            return completed()
        }
        activeTestName = test[0];
        try {
            test[1]()
        } catch (e) {
            result(e)
        }
    }

    function result(val) {
        API[activeTestName] = val;
        if (p.resultCallback) {
            p.resultCallback(activeTestName, val)
        }
        runNextTest();
        return val
    }

    function completed() {
        Monocle.defer(removeTestFrame);
        if (typeof surveyCallback == "function") {
            surveyCallback(API)
        }
    }

    function testForFunction(str) {
        return function () {
            result(typeof eval(str) == "function")
        }
    }

    function testNotYetImplemented(rslt) {
        return function () {
            result(rslt)
        }
    }

    function loadTestFrame(cb, src) {
        if (!testFrame) {
            testFrame = createTestFrame()
        }
        frameLoadCallback = cb;
        if (typeof src == "undefined") {
            if (testFrameLoadedWithStandard) {
                frameLoadCallback(testFrame)
            } else {
                testFrameLoadedWithStandard = true;
                src = 4
            }
        }
        if (typeof src == "number") {
            var pgs = [];
            for (var i = 1, ii = src; i <= ii; ++i) {
                pgs.push("<div>Page " + i + "</div>")
            }
            var divStyle = ["display:inline-block", "line-height:" + testFrameSize + "px", "width:" + testFrameSize + "px"].join(";");
            src = 'javascript:\'<!DOCTYPE html><html><head><meta name="time" content="' + (new Date()).getTime() + '" /><style>div{' + divStyle + "}</style></head><body>" + pgs.join("") + "</body></html>'"
        }
        testFrame.src = src
    }

    function createTestFrame() {
        testFrameCntr = document.createElement("div");
        testFrameCntr.style.cssText = ["width:" + testFrameSize + "px", "height:" + testFrameSize + "px", "overflow:hidden", "position:absolute", "visibility:hidden"].join(";");
        document.body.appendChild(testFrameCntr);
        var fr = document.createElement("iframe");
        testFrameCntr.appendChild(fr);
        fr.setAttribute("scrolling", "no");
        fr.style.cssText = ["width:100%", "height:100%", "border:none", "background:#900"].join(";");
        fr.addEventListener("load", function () {
            if (!fr.contentDocument || !fr.contentDocument.body) {
                return
            }
            var bd = fr.contentDocument.body;
            bd.style.cssText = (["margin:0", "padding:0", "position:absolute", "height:100%", "width:100%", "-webkit-column-width:" + testFrameSize + "px", "-webkit-column-gap:0", "-moz-column-width:" + testFrameSize + "px", "-moz-column-gap:0", "-o-column-width:" + testFrameSize + "px", "-o-column-gap:0", "column-width:" + testFrameSize + "px", "column-gap:0"].join(";"));
            if (bd.scrollHeight > testFrameSize) {
                bd.style.cssText += ["min-width:200%", "overflow:hidden"].join(";");
                if (bd.scrollHeight <= testFrameSize) {
                    bd.className = "column-force"
                } else {
                    bd.className = "column-failed " + bd.scrollHeight
                }
            }
            frameLoadCallback(fr)
        }, false);
        return fr
    }

    function removeTestFrame() {
        if (testFrameCntr && testFrameCntr.parentNode) {
            testFrameCntr.parentNode.removeChild(testFrameCntr)
        }
    }

    function columnedWidth(fr) {
        var bd = fr.contentDocument.body;
        var de = fr.contentDocument.documentElement;
        return Math.max(bd.scrollWidth, de.scrollWidth)
    }
    var envTests = [
        ["supportsW3CEvents", testForFunction("window.addEventListener")],
        ["supportsCustomEvents", testForFunction("document.createEvent")],
        ["supportsColumns",
            function () {
                result(css.supportsPropertyWithAnyPrefix("column-width"))
            }
        ],
        ["supportsTransform",
            function () {
                result(css.supportsProperty(["transformProperty", "WebkitTransform", "MozTransform", "OTransform", "msTransform"]))
            }
        ],
        ["supportsXPath", testForFunction("document.evaluate")],
        ["supportsQuerySelector", testForFunction("document.querySelector")],
        ["supportsTransform3d",
            function () {
                result(css.supportsMediaQueryProperty("transform-3d") && css.supportsProperty(["perspectiveProperty", "WebkitPerspective", "MozPerspective", "OPerspective", "msPerspective"]))
            }
        ],
        ["touch",
            function () {
                result(("ontouchstart" in window) || css.supportsMediaQueryProperty("touch-enabled"))
            }
        ],
        ["embedded",
            function () {
                result(top != self)
            }
        ],
        ["brokenIframeTouchModel",
            function () {
                result(Monocle.Browser.iOSVersionBelow("4.2"))
            }
        ],
        ["selectIgnoresZOrder",
            function () {
                result(Monocle.Browser.iOSVersionBelow("4.2"))
            }
        ],
        ["floatsIgnoreColumns", testNotYetImplemented(false)],
        ["widthsIgnoreTranslate",
            function () {
                loadTestFrame(function (fr) {
                    var firstWidth = columnedWidth(fr);
                    var s = fr.contentDocument.body.style;
                    var props = css.toDOMProps("transform");
                    for (var i = 0, ii = props.length; i < ii; ++i) {
                        s[props[i]] = "translateX(-600px)"
                    }
                    var secondWidth = columnedWidth(fr);
                    for (i = 0, ii = props.length; i < ii; ++i) {
                        s[props[i]] = "none"
                    }
                    result(secondWidth == firstWidth)
                })
            }
        ],
        ["relativeIframeExpands",
            function () {
                result(navigator.userAgent.indexOf("Android 2") >= 0)
            }
        ],
        ["scrollToApplyStyle",
            function () {
                result(Monocle.Browser.iOSVersionBelow("4"))
            }
        ],
        ["forceColumns",
            function () {
                loadTestFrame(function (fr) {
                    var bd = fr.contentDocument.body;
                    result(bd.className ? true : false)
                })
            }
        ],
        ["findNodesByScrolling",
            function () {
                result(typeof document.body.getBoundingClientRect !== "function")
            }
        ],
        ["sheafIsScroller",
            function () {
                loadTestFrame(function (fr) {
                    result(fr.parentNode.scrollWidth > testFrameSize)
                })
            }
        ],
        ["translateIframeIn3d",
            function () {
                result(Monocle.Browser.is.MobileSafari && !Monocle.Browser.iOSVersionBelow("5"))
            }
        ]
    ];

    function isCompatible() {
        return (API.supportsW3CEvents && API.supportsCustomEvents && API.supportsTransform)
    }
    API.survey = survey;
    API.isCompatible = isCompatible;
    return API
};
Monocle.pieceLoaded("compat/env");
Monocle.CSS = function () {
    var b = {
        constructor: Monocle.CSS
    };
    var d = b.constants = b.constructor;
    var a = b.properties = {
        guineapig: document.createElement("div")
    };

    function g(o) {
        var m = [o];
        var n = d.engines.indexOf(Monocle.Browser.engine);
        if (n) {
            var k = d.prefixes[n];
            if (k) {
                m.push(k + o)
            }
        }
        return m
    }

    function i(p, o) {
        var n = g(p);
        for (var k = 0, m = n.length; k < m; ++k) {
            n[k] += ": " + o + ";"
        }
        return n.join("")
    }

    function c(q) {
        var o = q.split("-");
        for (var m = o.length; m > 0; --m) {
            o[m] = f(o[m])
        }
        var n = [o.join("")];
        var p = d.engines.indexOf(Monocle.Browser.engine);
        if (p) {
            var k = d.domprefixes[p];
            if (k) {
                o[0] = f(o[0]);
                n.push(k + o.join(""))
            }
        }
        return n
    }

    function e(m) {
        for (var k in m) {
            if (a.guineapig.style[m[k]] !== undefined) {
                return true
            }
        }
        return false
    }

    function l(k) {
        return e(c(k))
    }

    function h(o) {
        var m = "monocle_guineapig";
        a.guineapig.id = m;
        var n = document.createElement("style");
        n.textContent = o + "{#" + m + "{height:3px}}";
        (document.head || document.getElementsByTagName("head")[0]).appendChild(n);
        document.documentElement.appendChild(a.guineapig);
        var k = a.guineapig.offsetHeight === 3;
        n.parentNode.removeChild(n);
        a.guineapig.parentNode.removeChild(a.guineapig);
        return k
    }

    function j(k) {
        return h("@media (" + d.prefixes.join(k + "),(") + "monocle__)")
    }

    function f(k) {
        return k ? k.charAt(0).toUpperCase() + k.substr(1) : ""
    }
    b.toCSSProps = g;
    b.toCSSDeclaration = i;
    b.toDOMProps = c;
    b.supportsProperty = e;
    b.supportsPropertyWithAnyPrefix = l;
    b.supportsMediaQuery = h;
    b.supportsMediaQueryProperty = j;
    return b
};
Monocle.CSS.engines = ["W3C", "WebKit", "Gecko", "Opera", "IE", "Konqueror"];
Monocle.CSS.prefixes = ["", "-webkit-", "-moz-", "-o-", "-ms-", "-khtml-"];
Monocle.CSS.domprefixes = ["", "Webkit", "Moz", "O", "ms", "Khtml"];
Monocle.pieceLoaded("compat/css");
if (typeof window.console == "undefined") {
    window.console = {
        messages: [],
        log: function (a) {
            this.messages.push(a)
        }
    }
}
window.console.compatDir = function (a) {
    var b = function (d) {
        var c = [];
        for (x in d) {
            c.push(x + ": " + d[x])
        }
        return c.join("; ")
    };
    window.console.log(b(a))
};
Monocle.pieceLoaded("compat/stubs");
Monocle.Browser = {};
Monocle.Browser.is = {
    IE: !! (window.attachEvent && navigator.userAgent.indexOf("Opera") === -1),
    Opera: navigator.userAgent.indexOf("Opera") > -1,
    WebKit: navigator.userAgent.indexOf("AppleWebKit/") > -1,
    Gecko: navigator.userAgent.indexOf("Gecko") > -1 && navigator.userAgent.indexOf("KHTML") === -1,
    MobileSafari: !! navigator.userAgent.match(/AppleWebKit.*Mobile/)
};
if (Monocle.Browser.is.IE) {
    Monocle.Browser.engine = "IE"
} else {
    if (Monocle.Browser.is.Opera) {
        Monocle.Browser.engine = "Opera"
    } else {
        if (Monocle.Browser.is.WebKit) {
            Monocle.Browser.engine = "WebKit"
        } else {
            if (Monocle.Browser.is.Gecko) {
                Monocle.Browser.engine = "Gecko"
            } else {
                Monocle.Browser.engine = "W3C"
            }
        }
    }
}
Monocle.Browser.on = {
    iPhone: navigator.userAgent.indexOf("iPhone") != -1,
    iPad: navigator.userAgent.indexOf("iPad") != -1,
    BlackBerry: navigator.userAgent.indexOf("BlackBerry") != -1,
    Android: navigator.userAgent.indexOf("Android") != -1,
    MacOSX: navigator.userAgent.indexOf("Mac OS X") != -1 && !Monocle.Browser.is.MobileSafari,
    Kindle3: navigator.userAgent.match(/Kindle\/3/)
};
if (Monocle.Browser.is.MobileSafari) {
    (function () {
        var a = navigator.userAgent.match(/ OS ([\d_]+)/);
        if (a) {
            Monocle.Browser.iOSVersion = a[1].replace(/_/g, ".")
        } else {
            console.warn("Unknown MobileSafari user agent: " + navigator.userAgent)
        }
    })()
}
Monocle.Browser.iOSVersionBelow = function (a) {
    return !!Monocle.Browser.iOSVersion && Monocle.Browser.iOSVersion < a
};
Monocle.Browser.css = new Monocle.CSS();
Monocle.Browser.survey = function (a) {
    if (!Monocle.Browser.env) {
        Monocle.Browser.env = new Monocle.Env();
        Monocle.Browser.env.survey(a)
    } else {
        if (typeof a == "function") {
            a()
        }
    }
};
Monocle.pieceLoaded("compat/browser");
Monocle.Factory = function (e, j, i, a) {
    var q = {
        constructor: Monocle.Factory
    };
    var t = q.constants = q.constructor;
    var o = q.properties = {
        element: e,
        label: j,
        index: i,
        reader: a,
        prefix: a.properties.classPrefix || ""
    };

    function b() {
        if (!o.label) {
            return
        }
        var k = o.reader.properties.graph;
        k[o.label] = k[o.label] || [];
        if (typeof o.index == "undefined" && k[o.label][o.index]) {
            throw ("Element already exists in graph: " + o.label + "[" + o.index + "]")
        } else {
            o.index = o.index || k[o.label].length
        }
        k[o.label][o.index] = o.element;
        l(o.label)
    }

    function n(p, k) {
        if (!o.reader.properties.graph[p]) {
            return null
        }
        return o.reader.properties.graph[p][k || 0]
    }

    function h(k, v, p) {
        return k.dom = new Monocle.Factory(k, v, p, o.reader)
    }

    function f(y, B, w, k) {
        var A, p;
        if (arguments.length == 1) {
            B = null, A = 0;
            p = {}
        } else {
            if (arguments.length == 2) {
                A = 0;
                p = {}
            } else {
                if (arguments.length == 4) {
                    A = arguments[2];
                    p = arguments[3]
                } else {
                    if (arguments.length == 3) {
                        var z = arguments[arguments.length - 1];
                        if (typeof z == "number") {
                            A = z;
                            p = {}
                        } else {
                            A = 0;
                            p = z
                        }
                    }
                }
            }
        }
        var v = document.createElement(y);
        h(v, B, A);
        if (p["class"]) {
            v.className += " " + o.prefix + p["class"]
        }
        if (p.html) {
            v.innerHTML = p.html
        }
        if (p.text) {
            v.appendChild(document.createTextNode(p.text))
        }
        return v
    }

    function u(w, y, v, k) {
        var p = f.apply(this, arguments);
        o.element.appendChild(p);
        return p
    }

    function g() {
        return [o.label, o.index, o.reader]
    }

    function d(k) {
        return Monocle.Styles.applyRules(o.element, k)
    }

    function r(p, k) {
        return Monocle.Styles.affix(o.element, p, k)
    }

    function c(p) {
        p = o.prefix + p;
        var k = o.element.className;
        if (!k) {
            return false
        }
        if (k == p) {
            return true
        }
        return new RegExp("(^|\\s)" + p + "(\\s|$)").test(k)
    }

    function l(k) {
        if (c(k)) {
            return
        }
        var p = o.element.className ? " " : "";
        return o.element.className += p + o.prefix + k
    }

    function m(p) {
        var w = new RegExp("(^|\\s+)" + o.prefix + p + "(\\s+|$)");
        var v = /^\s+|\s+$/g;
        var k = o.element.className;
        o.element.className = k.replace(w, " ").replace(v, "");
        return o.element.className
    }
    q.find = n;
    q.claim = h;
    q.make = f;
    q.append = u;
    q.address = g;
    q.setStyles = d;
    q.setBetaStyle = r;
    q.hasClass = c;
    q.addClass = l;
    q.removeClass = m;
    b();
    return q
};
Monocle.pieceLoaded("core/factory");
Monocle.Events = {};
Monocle.Events.dispatch = function (c, g, d, b) {
    if (!document.createEvent) {
        return true
    }
    var a = document.createEvent("Events");
    a.initEvent(g, false, b || false);
    a.m = d;
    try {
        return c.dispatchEvent(a)
    } catch (f) {
        console.warn("Failed to dispatch event: " + g);
        return false
    }
};
Monocle.Events.listen = function (c, d, b, a) {
    return c.addEventListener(d, b, a || false)
};
Monocle.Events.deafen = function (c, f, b, a) {
    if (c.removeEventListener) {
        return c.removeEventListener(f, b, a || false)
    } else {
        if (c.detachEvent) {
            try {
                return c.detachEvent("on" + f, b)
            } catch (d) {}
        }
    }
};
Monocle.Events.listenForContact = function (g, d, b) {
    var e = {};
    var f = function (h, i) {
        h.m = {
            pageX: i.pageX,
            pageY: i.pageY
        };
        var j = h.target || h.srcElement;
        while (j.nodeType != 1 && j.parentNode) {
            j = j.parentNode
        }
        var k = c(h, j);
        h.m.offsetX = k[0];
        h.m.offsetY = k[1];
        if (h.currentTarget) {
            k = c(h, h.currentTarget);
            h.m.registrantX = k[0];
            h.m.registrantY = k[1]
        }
        return h
    };
    var c = function (h, j) {
        var i;
        if (j.getBoundingClientRect) {
            var l = j.getBoundingClientRect();
            var k = document.body.getBoundingClientRect();
            i = {
                left: l.left - k.left,
                top: l.top - k.top
            }
        } else {
            i = {
                left: j.offsetLeft,
                top: j.offsetTop
            };
            while (j = j.parentNode) {
                if (j.offsetLeft || j.offsetTop) {
                    i.left += j.offsetLeft;
                    i.top += j.offsetTop
                }
            }
        }
        return [h.m.pageX - i.left, h.m.pageY - i.top]
    };
    var a = (b && b.useCapture) || false;
    if (!Monocle.Browser.env.touch) {
        if (d.start) {
            e.mousedown = function (h) {
                if (h.button != 0) {
                    return
                }
                d.start(f(h, h))
            };
            Monocle.Events.listen(g, "mousedown", e.mousedown, a)
        }
        if (d.move) {
            e.mousemove = function (h) {
                d.move(f(h, h))
            };
            Monocle.Events.listen(g, "mousemove", e.mousemove, a)
        }
        if (d.end) {
            e.mouseup = function (h) {
                d.end(f(h, h))
            };
            Monocle.Events.listen(g, "mouseup", e.mouseup, a)
        }
        if (d.cancel) {
            e.mouseout = function (h) {
                obj = h.relatedTarget || h.fromElement;
                while (obj && (obj = obj.parentNode)) {
                    if (obj == g) {
                        return
                    }
                }
                d.cancel(f(h, h))
            };
            Monocle.Events.listen(g, "mouseout", e.mouseout, a)
        }
    } else {
        if (d.start) {
            e.start = function (h) {
                if (h.touches.length > 1) {
                    return
                }
                d.start(f(h, h.targetTouches[0]))
            }
        }
        if (d.move) {
            e.move = function (h) {
                if (h.touches.length > 1) {
                    return
                }
                d.move(f(h, h.targetTouches[0]))
            }
        }
        if (d.end) {
            e.end = function (h) {
                d.end(f(h, h.changedTouches[0]));
                h.preventDefault()
            }
        }
        if (d.cancel) {
            e.cancel = function (h) {
                d.cancel(f(h, h.changedTouches[0]))
            }
        }
        if (Monocle.Browser.env.brokenIframeTouchModel) {
            Monocle.Events.tMonitor = Monocle.Events.tMonitor || new Monocle.Events.TouchMonitor();
            Monocle.Events.tMonitor.listen(g, e, b)
        } else {
            for (etype in e) {
                Monocle.Events.listen(g, "touch" + etype, e[etype], a)
            }
        }
    }
    return e
};
Monocle.Events.deafenForContact = function (b, a) {
    var c = "";
    if (Monocle.Browser.env.touch) {
        c = Monocle.Browser.env.brokenIframeTouchModel ? "contact" : "touch"
    }
    for (evtType in a) {
        Monocle.Events.deafen(b, c + evtType, a[evtType])
    }
};
Monocle.Events.listenForTap = function (f, e, c) {
    var b;
    if (Monocle.Browser.on.Kindle3) {
        Monocle.Events.listen(f, "click", function () {})
    }
    var a = function () {
        b = null;
        if (c && f.dom) {
            f.dom.removeClass(c)
        }
    };
    var d = function (g) {
        if (g.type.match(/^mouse/)) {
            return
        }
        if (Monocle.Browser.is.MobileSafari && Monocle.Browser.iOSVersion < "3.2") {
            return
        }
        if (g.m.registrantX < 0 || g.m.registrantX > f.offsetWidth || g.m.registrantY < 0 || g.m.registrantY > f.offsetHeight) {
            a()
        }
    };
    return Monocle.Events.listenForContact(f, {
        start: function (g) {
            b = [g.m.pageX, g.m.pageY];
            if (c && f.dom) {
                f.dom.addClass(c)
            }
        },
        move: d,
        end: function (g) {
            d(g);
            if (b) {
                g.m.startOffset = b;
                e(g)
            }
            a()
        },
        cancel: a
    }, {
        useCapture: false
    })
};
Monocle.Events.deafenForTap = Monocle.Events.deafenForContact;
Monocle.Events.TouchMonitor = function () {
    if (Monocle.Events == this) {
        return new Monocle.Events.TouchMonitor()
    }
    var c = {
        constructor: Monocle.Events.TouchMonitor
    };
    var h = c.constants = c.constructor;
    var b = c.properties = {
        touching: null,
        edataPrev: null,
        originator: null,
        brokenModel_4_1: navigator.userAgent.match(/ OS 4_1/)
    };

    function n(k) {
        if (k.contentDocument) {
            g(k.contentDocument);
            k.contentDocument.isTouchFrame = true
        }
        if (b.brokenModel_4_1) {
            g(k)
        }
    }

    function f(r, p, k) {
        for (etype in p) {
            Monocle.Events.listen(r, "contact" + etype, p[etype], k)
        }
        g(r, k)
    }

    function g(p, k) {
        if (p.monocleTouchProxy) {
            return
        }
        p.monocleTouchProxy = true;
        var r = function (t) {
            a(p, t)
        };
        Monocle.Events.listen(p, "touchstart", r, k);
        Monocle.Events.listen(p, "touchmove", r, k);
        Monocle.Events.listen(p, "touchend", r, k);
        Monocle.Events.listen(p, "touchcancel", r, k)
    }

    function a(p, k) {
        var t = {
            start: k.type == "touchstart",
            move: k.type == "touchmove",
            end: k.type == "touchend" || k.type == "touchcancel",
            time: new Date().getTime(),
            frame: p.isTouchFrame
        };
        if (!b.touching) {
            b.originator = p
        }
        var r = p;
        var u = k.touches[0] || k.changedTouches[0];
        r = document.elementFromPoint(u.screenX, u.screenY);
        if (r) {
            d(p, r, k, t)
        }
    }

    function d(p, t, k, r) {
        if (b.brokenModel_4_1 && !r.frame && !b.touching && r.start && b.edataPrev && b.edataPrev.end && (r.time - b.edataPrev.time) < 30) {
            k.preventDefault();
            return
        }
        if (!b.touching && !r.end) {
            return q(k, t, r)
        }
        if (r.move && b.touching) {
            return i(k, r)
        }
        if (b.brokenModel_4_1) {
            if (b.touching && !r.frame) {
                return e(k, r)
            }
        } else {
            if (r.end && b.touching) {
                return e(k, r)
            }
        } if (b.brokenModel_4_1 && b.originator != p && r.frame && r.end) {
            k.preventDefault();
            return
        }
        if (r.frame && r.end && b.touching) {
            return e(k, r)
        }
    }

    function q(k, r, p) {
        b.touching = r;
        b.edataPrev = p;
        return j(b.touching, "start", k)
    }

    function i(k, p) {
        m();
        b.edataPrev = p;
        return j(b.touching, "move", k)
    }

    function l(p, r) {
        var k = j(b.touching, "end", p);
        b.edataPrev = r;
        b.touching = null;
        return k
    }

    function e(k, r) {
        m();
        var p = o(b.touching, "end", k);
        b.edataPrev = r;
        b.provisionalEnd = setTimeout(function () {
            if (b.touching) {
                b.touching.dispatchEvent(p);
                b.touching = null
            }
        }, 30)
    }

    function m() {
        if (b.provisionalEnd) {
            clearTimeout(b.provisionalEnd);
            b.provisionalEnd = null
        }
    }

    function o(w, u, k) {
        var r = function (z) {
            return document.createTouch(document.defaultView, w, z.identifier, z.screenX, z.screenY, z.screenX, z.screenY)
        };
        var y = function (A) {
            for (var z = 0; z < v.all.length; ++z) {
                if (v.all[z].identifier == A) {
                    return v.all[z]
                }
            }
        };
        var v = {
            all: [],
            target: [],
            changed: []
        };
        for (var p = 0; p < k.touches.length; ++p) {
            v.all.push(r(k.touches[p]))
        }
        for (var p = 0; p < k.targetTouches.length; ++p) {
            v.target.push(y(k.targetTouches[p].identifier) || r(k.targetTouches[p]))
        }
        for (var p = 0; p < k.changedTouches.length; ++p) {
            v.changed.push(y(k.changedTouches[p].identifier) || r(k.changedTouches[p]))
        }
        var t = document.createEvent("TouchEvent");
        t.initTouchEvent("contact" + u, true, true, document.defaultView, k.detail, k.screenX, k.screenY, k.screenX, k.screenY, k.ctrlKey, k.altKey, k.shiftKey, k.metaKey, document.createTouchList.apply(document, v.all), document.createTouchList.apply(document, v.target), document.createTouchList.apply(document, v.changed), k.scale, k.rotation);
        return t
    }

    function j(u, t, p) {
        var r = o(u, t, p);
        var k = u.dispatchEvent(r);
        if (!k) {
            p.preventDefault()
        }
        return k
    }
    c.listen = f;
    c.listenOnIframe = n;
    return c
};
Monocle.Events.listenOnIframe = function (a) {
    if (!Monocle.Browser.env.brokenIframeTouchModel) {
        return
    }
    Monocle.Events.tMonitor = Monocle.Events.tMonitor || new Monocle.Events.TouchMonitor();
    Monocle.Events.tMonitor.listenOnIframe(a)
};
Monocle.pieceLoaded("core/events");
Monocle.Styles = {
    rulesToString: function (b) {
        if (typeof b != "string") {
            var a = [];
            for (var c in b) {
                a.push(c + ": " + b[c] + ";")
            }
            b = a.join(" ")
        }
        return b
    },
    applyRules: function (a, b) {
        b = Monocle.Styles.rulesToString(b);
        a.style.cssText += ";" + b;
        return a.style.cssText
    },
    affix: function (b, d, c) {
        var e = b.style ? b.style : b;
        var a = Monocle.Browser.css.toDOMProps(d);
        while (a.length) {
            e[a.shift()] = c
        }
    },
    setX: function (c, a) {
        var b = c.style;
        if (typeof a == "number") {
            a += "px"
        }
        if (Monocle.Browser.env.supportsTransform3d) {
            b.webkitTransform = "translate3d(" + a + ", 0, 0)"
        } else {
            b.webkitTransform = "translateX(" + a + ")"
        }
        b.MozTransform = b.OTransform = b.transform = "translateX(" + a + ")";
        return a
    },
    setY: function (b, c) {
        var a = b.style;
        if (typeof c == "number") {
            c += "px"
        }
        if (Monocle.Browser.env.supportsTransform3d) {
            a.webkitTransform = "translate3d(0, " + c + ", 0)"
        } else {
            a.webkitTransform = "translateY(" + c + ")"
        }
        a.MozTransform = a.OTransform = a.transform = "translateY(" + c + ")";
        return c
    }
};
Monocle.Styles.container = {
    position: "absolute",
    top: "0",
    left: "0",
    bottom: "0",
    right: "0"
};
Monocle.Styles.page = {
    position: "absolute",
    "z-index": "1",
    "-webkit-user-select": "none",
    "-moz-user-select": "none",
    "user-select": "none",
    "-webkit-transform": "translate3d(0,0,0)",
    visibility: "visible"
};
Monocle.Styles.sheaf = {
    position: "absolute",
    overflow: "hidden"
};
Monocle.Styles.component = {
    width: "100%",
    height: "100%",
    border: "none",
    "-webkit-user-select": "none",
    "-moz-user-select": "none",
    "user-select": "none"
};
Monocle.Styles.control = {
    "z-index": "100",
    cursor: "pointer"
};
Monocle.Styles.overlay = {
    position: "absolute",
    display: "none",
    width: "100%",
    height: "100%",
    "z-index": "1000"
};
Monocle.pieceLoaded("core/styles");
Monocle.Reader = function (B, I, t, r) {
    if (Monocle == this) {
        return new Monocle.Reader(B, I, t, r)
    }
    var A = {
        constructor: Monocle.Reader
    };
    var O = A.constants = A.constructor;
    var K = A.properties = {
        initialized: false,
        book: null,
        graph: {},
        pageStylesheets: [],
        systemId: (t ? t.systemId : null) || O.DEFAULT_SYSTEM_ID,
        classPrefix: O.DEFAULT_CLASS_PREFIX,
        controls: [],
        resizeTimer: null
    };
    var d;

    function f() {
        t = t || {};
        Monocle.Browser.survey(i)
    }

    function i() {
        var p = B;
        if (typeof p == "string") {
            p = document.getElementById(p)
        }
        d = A.dom = p.dom = new Monocle.Factory(p, "box", 0, A);
        if (!Monocle.Browser.env.isCompatible()) {
            if (j("monocle:incompatible", {}, true)) {
                p.innerHTML = "Your browser is not compatible with Monocle."
            }
            return
        }
        j("monocle:initializing");
        var k;
        if (I) {
            k = new Monocle.Book(I)
        } else {
            k = Monocle.Book.fromNodes([p.cloneNode(true)])
        }
        p.innerHTML = "";
        l();
        C(t.flipper);
        q();
        N(t.stylesheet);
        e(t.primeURL, function () {
            h();
            E("monocle:componentmodify", H);
            K.flipper.listenForInteraction(t.panels);
            y(k, t.place, function () {
                K.initialized = true;
                if (r) {
                    r(A)
                }
                j("monocle:loaded")
            })
        })
    }

    function l() {
        var p;
        var U = d.find("box");
        if (document.defaultView) {
            var k = document.defaultView.getComputedStyle(U, null);
            p = k.getPropertyValue("position")
        } else {
            if (U.currentStyle) {
                p = U.currentStyle.position
            }
        } if (["absolute", "relative"].indexOf(p) == -1) {
            U.style.position = "relative"
        }
    }

    function C(k) {
        if (!k) {
            if (!Monocle.Browser.env.supportsColumns) {
                k = Monocle.Flippers.Legacy
            } else {
                if (Monocle.Browser.on.Kindle3) {
                    k = Monocle.Flippers.Instant
                }
            }
            k = k || Monocle.Flippers.Slider
        }
        if (!k) {
            throw ("Flipper not found.")
        }
        K.flipper = new k(A, null, K.readerOptions)
    }

    function q() {
        var U = d.append("div", "container");
        for (var k = 0; k < K.flipper.pageCount; ++k) {
            var p = U.dom.append("div", "page", k);
            p.style.visibility = "hidden";
            p.m = {
                reader: A,
                pageIndex: k,
                place: null
            };
            p.m.sheafDiv = p.dom.append("div", "sheaf", k);
            p.m.activeFrame = p.m.sheafDiv.dom.append("iframe", "component", k);
            p.m.activeFrame.m = {
                pageDiv: p
            };
            p.m.activeFrame.setAttribute("frameBorder", 0);
            p.m.activeFrame.setAttribute("scrolling", "no");
            K.flipper.addPage(p);
            Monocle.Events.listenOnIframe(p.m.activeFrame)
        }
        d.append("div", "overlay");
        j("monocle:loading")
    }

    function N(k) {
        var p = O.DEFAULT_STYLE_RULES;
        if (Monocle.Browser.env.floatsIgnoreColumns) {
            p += "html#RS\\:monocle * { float: none !important; }"
        }
        K.defaultStyles = P(p, false);
        if (k) {
            K.initialStyles = P(k, false)
        }
    }

    function e(U, V) {
        U = U || "about:blank";
        var p = 0;
        var k = function (W) {
            var X = W.target || W.srcElement;
            Monocle.Events.deafen(X, "load", k);
            j("monocle:frameprimed", {
                frame: X,
                pageIndex: p
            });
            if ((p += 1) == K.flipper.pageCount) {
                Monocle.defer(V)
            }
        };
        m(function (W) {
            Monocle.Events.listen(W.m.activeFrame, "load", k);
            W.m.activeFrame.src = U
        })
    }

    function h() {
        d.find("container").dom.setStyles(Monocle.Styles.container);
        m(function (U, p) {
            U.dom.setStyles(Monocle.Styles.page);
            d.find("sheaf", p).dom.setStyles(Monocle.Styles.sheaf);
            var k = d.find("component", p);
            k.dom.setStyles(Monocle.Styles.component)
        });
        c();
        d.find("overlay").dom.setStyles(Monocle.Styles.overlay);
        j("monocle:styles")
    }

    function z() {
        if (!Monocle.Browser.env.relativeIframeExpands) {
            return
        }
        for (var p = 0, k; k = d.find("component", p); ++p) {
            k.style.display = "none"
        }
    }

    function c() {
        if (!Monocle.Browser.env.relativeIframeExpands) {
            return
        }
        for (var p = 0, k; k = d.find("component", p); ++p) {
            k.style.width = k.parentNode.offsetWidth + "px";
            k.style.display = "block"
        }
    }

    function y(k, p, W) {
        K.book = k;
        var V = 0;
        if (typeof W == "function") {
            var U = function (X) {
                j("monocle:firstcomponentchange", X.m);
                if ((V += 1) == K.flipper.pageCount) {
                    M("monocle:componentchange", U);
                    W()
                }
            };
            E("monocle:componentchange", U)
        }
        K.flipper.moveTo(p || {
            page: 1
        })
    }

    function u() {
        return K.book
    }

    function Q() {
        if (!K.initialized) {
            console.warn("Attempt to resize book before initialization.")
        }
        z();
        if (!j("monocle:resizing", {}, true)) {
            return
        }
        clearTimeout(K.resizeTimer);
        K.resizeTimer = setTimeout(function () {
            c();
            o(true);
            j("monocle:resize")
        }, O.durations.RESIZE_DELAY)
    }

    function o(U) {
        if (!K.book) {
            return
        }
        j("monocle:recalculating");
        var k, p;
        if (U !== false) {
            var k = a();
            var p = {
                percent: k ? k.percentageThrough() : 0
            }
        }
        m(function (V) {
            V.m.activeFrame.m.component.updateDimensions(V)
        });
        Monocle.defer(function () {
            if (p) {
                K.flipper.moveTo(p)
            }
            j("monocle:recalculated")
        })
    }

    function n(p) {
        var k = a(p);
        return k ? (k.pageNumber() || 1) : 1
    }

    function a(k) {
        if (!K.initialized) {
            console.warn("Attempt to access place before initialization.")
        }
        return K.flipper.getPlace(k)
    }

    function b(k, U) {
        if (!K.initialized) {
            console.warn("Attempt to move place before initialization.")
        }
        var p = U;
        if (!k.direction) {
            j("monocle:jumping", {
                locus: k
            });
            p = function () {
                j("monocle:jump", {
                    locus: k
                });
                if (U) {
                    U()
                }
            }
        }
        K.flipper.moveTo(k, p)
    }

    function v(p) {
        var k = K.book.locusOfChapter(p);
        if (k) {
            b(k);
            return true
        } else {
            j("monocle:notfound", {
                href: p
            });
            return false
        }
    }

    function T(Z, k, U) {
        for (var W = 0; W < K.controls.length; ++W) {
            if (K.controls[W].control == Z) {
                console.warn("Already added control: " + Z);
                return
            }
        }
        U = U || {};
        var X = {
            control: Z,
            elements: [],
            controlType: k
        };
        K.controls.push(X);
        var V;
        var Y = d.find("container"),
            p = d.find("overlay");
        if (!k || k == "standard") {
            V = Z.createControlElements(Y);
            Y.appendChild(V);
            X.elements.push(V)
        } else {
            if (k == "page") {
                m(function (ac, aa) {
                    var ab = Z.createControlElements(ac);
                    ac.appendChild(ab);
                    X.elements.push(ab)
                })
            } else {
                if (k == "modal" || k == "popover" || k == "hud") {
                    V = Z.createControlElements(p);
                    p.appendChild(V);
                    X.elements.push(V);
                    X.usesOverlay = true
                } else {
                    if (k == "invisible") {
                        if (typeof (Z.createControlElements) == "function" && (V = Z.createControlElements(Y))) {
                            Y.appendChild(V);
                            X.elements.push(V)
                        }
                    } else {
                        console.warn("Unknown control type: " + k)
                    }
                }
            }
        }
        for (var W = 0; W < X.elements.length; ++W) {
            Monocle.Styles.applyRules(X.elements[W], Monocle.Styles.control)
        }
        if (U.hidden) {
            g(Z)
        } else {
            L(Z)
        } if (typeof Z.assignToReader == "function") {
            Z.assignToReader(A)
        }
        return Z
    }

    function S(p) {
        for (var k = 0; k < K.controls.length; ++k) {
            if (K.controls[k].control == p) {
                return K.controls[k]
            }
        }
    }

    function g(V) {
        var k = S(V);
        if (!k) {
            console.warn("No data for control: " + V);
            return
        }
        if (k.hidden) {
            return
        }
        for (var U = 0; U < k.elements.length; ++U) {
            k.elements[U].style.display = "none"
        }
        if (k.usesOverlay) {
            var p = d.find("overlay");
            p.style.display = "none";
            Monocle.Events.deafenForContact(p, p.listeners)
        }
        k.hidden = true;
        if (V.properties) {
            V.properties.hidden = true
        }
        j("controlhide", V, false)
    }

    function L(W) {
        var k = S(W);
        if (!k) {
            console.warn("No data for control: " + W);
            return false
        }
        if (G(W)) {
            return false
        }
        var p = d.find("overlay");
        if (k.usesOverlay && k.controlType != "hud") {
            for (var U = 0, V = K.controls.length; U < V; ++U) {
                if (K.controls[U].usesOverlay && !K.controls[U].hidden) {
                    return false
                }
            }
            p.style.display = "block"
        }
        for (var U = 0; U < k.elements.length; ++U) {
            k.elements[U].style.display = "block"
        }
        if (k.controlType == "popover") {
            var X = function (Y) {
                var Z = Y.target;
                do {
                    if (Z == k.elements[0]) {
                        return true
                    }
                } while (Z && (Z = Z.parentNode));
                return false
            };
            p.listeners = Monocle.Events.listenForContact(p, {
                start: function (Y) {
                    if (!X(Y)) {
                        g(W)
                    }
                },
                move: function (Y) {
                    if (!X(Y)) {
                        Y.preventDefault()
                    }
                }
            })
        }
        k.hidden = false;
        if (W.properties) {
            W.properties.hidden = false
        }
        j("controlshow", W, false);
        return true
    }

    function G(p) {
        var k = S(p);
        return k.hidden == false
    }

    function j(U, p, k) {
        return Monocle.Events.dispatch(d.find("box"), U, p, k)
    }

    function E(U, p, k) {
        Monocle.Events.listen(d.find("box"), U, p, k)
    }

    function M(p, k) {
        Monocle.Events.deafen(d.find("box"), p, k)
    }

    function P(k, p) {
        return F(function () {
            K.pageStylesheets.push(k);
            var U = K.pageStylesheets.length - 1;
            for (var V = 0; V < K.flipper.pageCount; ++V) {
                var W = d.find("component", V).contentDocument;
                w(W, U)
            }
            return U
        }, p)
    }

    function J(k, p, U) {
        return F(function () {
            K.pageStylesheets[k] = p;
            if (typeof p.join == "function") {
                p = p.join("\n")
            }
            for (var W = 0; W < K.flipper.pageCount; ++W) {
                var X = d.find("component", W).contentDocument;
                var V = X.getElementById("monStylesheet" + k);
                if (!V) {
                    console.warn("No such stylesheet: " + k);
                    return
                }
                if (V.styleSheet) {
                    V.styleSheet.cssText = p
                } else {
                    V.replaceChild(X.createTextNode(p), V.firstChild)
                }
            }
        }, U)
    }

    function D(k, p) {
        return F(function () {
            K.pageStylesheets[k] = null;
            for (var V = 0; V < K.flipper.pageCount; ++V) {
                var W = d.find("component", V).contentDocument;
                var U = W.getElementById("monStylesheet" + k);
                U.parentNode.removeChild(U)
            }
        }, p)
    }

    function H(k) {
        var U = k.m.document;
        U.documentElement.id = K.systemId;
        for (var p = 0; p < K.pageStylesheets.length; ++p) {
            if (K.pageStylesheets[p]) {
                w(U, p)
            }
        }
    }

    function F(U, p) {
        p = (p === false) ? false : true;
        if (p) {
            j("monocle:stylesheetchanging", {})
        }
        var k = U();
        if (p) {
            o(true);
            Monocle.defer(function () {
                j("monocle:stylesheetchange", {})
            })
        } else {
            o(false)
        }
        return k
    }

    function w(W, p) {
        var V = K.pageStylesheets[p];
        if (!V) {
            return
        }
        var U = W.getElementsByTagName("head")[0];
        if (!U) {
            U = W.createElement("head");
            W.documentElement.appendChild(U)
        }
        if (typeof V.join == "function") {
            V = V.join("\n")
        }
        var k = W.createElement("style");
        k.type = "text/css";
        k.id = "monStylesheet" + p;
        if (k.styleSheet) {
            k.styleSheet.cssText = V
        } else {
            k.appendChild(W.createTextNode(V))
        }
        U.appendChild(k);
        return k
    }

    function R() {
        return K.flipper.visiblePages ? K.flipper.visiblePages() : [d.find("page")]
    }

    function m(V) {
        for (var k = 0, p = K.flipper.pageCount; k < p; ++k) {
            var U = d.find("page", k);
            V(U, k)
        }
    }
    A.getBook = u;
    A.getPlace = a;
    A.moveTo = b;
    A.skipToChapter = v;
    A.resized = Q;
    A.addControl = T;
    A.hideControl = g;
    A.showControl = L;
    A.showingControl = G;
    A.dispatchEvent = j;
    A.listen = E;
    A.deafen = M;
    A.addPageStyles = P;
    A.updatePageStyles = J;
    A.removePageStyles = D;
    A.visiblePages = R;
    f();
    return A
};
Monocle.Reader.durations = {
    RESIZE_DELAY: 100
};
Monocle.Reader.abortMessage = {
    CLASSNAME: "monocleAbortMessage",
    TEXT: "Your browser does not support this technology."
};
Monocle.Reader.DEFAULT_SYSTEM_ID = "RS:monocle";
Monocle.Reader.DEFAULT_CLASS_PREFIX = "monelem_";
Monocle.Reader.DEFAULT_STYLE_RULES = ["html#RS\\:monocle * {-webkit-font-smoothing: subpixel-antialiased;text-rendering: auto !important;word-wrap: break-word !important;overflow: visible !important;}", "html#RS\\:monocle body {-webkit-text-size-adjust: none;}", "html#RS\\:monocle body * {max-width: 100% !important;}", "html#RS\\:monocle img, html#RS\\:monocle video, html#RS\\:monocle object {max-height: 95% !important;height: auto !important;}"];
Monocle.pieceLoaded("core/reader");
Monocle.Book = function (a) {
    if (Monocle == this) {
        return new Monocle.Book(a)
    }
    var d = {
        constructor: Monocle.Book
    };
    var e = d.constants = d.constructor;
    var b = d.properties = {
        dataSource: a,
        components: [],
        chapters: {}
    };

    function f() {
        b.componentIds = a.getComponents();
        b.contents = a.getContents();
        b.lastCIndex = b.componentIds.length - 1
    }

    function n(r, t) {
        t.load = false;
        var u = r.m.activeFrame ? r.m.activeFrame.m.component : null;
        var q = null;
        var o = b.componentIds.indexOf(t.componentId);
        if (o < 0 && !u) {
            t.load = true;
            t.componentId = b.componentIds[0];
            return t
        } else {
            if (o < 0 && t.componentId && u.properties.id != t.componentId) {
                r.m.reader.dispatchEvent("monocle:notfound", {
                    href: t.componentId
                });
                return null
            } else {
                if (o < 0) {
                    q = u;
                    t.componentId = r.m.activeFrame.m.component.properties.id;
                    o = b.componentIds.indexOf(t.componentId)
                } else {
                    if (!b.components[o] || b.components[o] != u) {
                        t.load = true;
                        return t
                    } else {
                        q = u
                    }
                }
            }
        }
        var k = {
            load: false,
            componentId: t.componentId,
            page: 1
        };
        lastPageNum = q.lastPageNumber();
        if (typeof (t.page) == "number") {
            k.page = t.page
        } else {
            if (typeof (t.pagesBack) == "number") {
                k.page = lastPageNum + t.pagesBack
            } else {
                if (typeof (t.percent) == "number") {
                    var p = new Monocle.Place();
                    p.setPlace(q, 1);
                    k.page = p.pageAtPercentageThrough(t.percent)
                } else {
                    if (typeof (t.direction) == "number") {
                        if (!r.m.place) {
                            console.warn("Can't move in a direction if pageDiv has no place.")
                        }
                        k.page = r.m.place.pageNumber();
                        k.page += t.direction
                    } else {
                        if (typeof (t.anchor) == "string") {
                            k.page = q.pageForChapter(t.anchor, r)
                        } else {
                            if (typeof (t.xpath) == "string") {
                                k.page = q.pageForXPath(t.xpath, r)
                            } else {
                                if (typeof (t.selector) == "string") {
                                    k.page = q.pageForSelector(t.selector, r)
                                } else {
                                    if (typeof (t.position) == "string") {
                                        if (t.position == "start") {
                                            k.page = 1
                                        } else {
                                            if (t.position == "end") {
                                                k.page = lastPageNum["new"]
                                            }
                                        }
                                    } else {
                                        console.warn("Unrecognised locus: " + t)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } if (k.page < 1) {
            if (o == 0) {
                k.page = 1;
                k.boundarystart = true
            } else {
                k.load = true;
                k.componentId = b.componentIds[o - 1];
                k.pagesBack = k.page;
                k.page = null
            }
        } else {
            if (k.page > lastPageNum) {
                if (o == b.lastCIndex) {
                    k.page = lastPageNum;
                    k.boundaryend = true
                } else {
                    k.load = true;
                    k.componentId = b.componentIds[o + 1];
                    k.page -= lastPageNum
                }
            }
        }
        return k
    }

    function c(p, q) {
        q = n(p, q);
        if (q && !q.load) {
            var k = {
                locus: q,
                page: p
            };
            if (q.boundarystart) {
                p.m.reader.dispatchEvent("monocle:boundarystart", k)
            } else {
                if (q.boundaryend) {
                    p.m.reader.dispatchEvent("monocle:boundaryend", k)
                } else {
                    var o = b.components[b.componentIds.indexOf(q.componentId)];
                    p.m.place = p.m.place || new Monocle.Place();
                    p.m.place.setPlace(o, q.page);
                    var k = {
                        page: p,
                        locus: q,
                        pageNumber: p.m.place.pageNumber(),
                        componentId: q.componentId
                    };
                    p.m.reader.dispatchEvent("monocle:pagechange", k)
                }
            }
        }
        return q
    }

    function i(p, r, u, q) {
        var t = b.componentIds.indexOf(r.componentId);
        if (!r.load || t < 0) {
            r = n(p, r)
        }
        if (!r) {
            return
        }
        if (!r.load) {
            u(r);
            return
        }
        var w = function () {
            r = c(p, r);
            if (!r) {
                return
            } else {
                if (r.load) {
                    i(p, r, u, q)
                } else {
                    u(r)
                }
            }
        };
        var o = function () {
            q ? q(w) : w()
        };
        var v = function (y) {
            y.applyTo(p, o)
        };
        var k = function (y) {
            q ? q(function () {
                v(y)
            }) : v(y)
        };
        h(t, k, p)
    }

    function m(k, o, r, p, q) {
        o = c(k, o);
        if (!o) {
            if (q) {
                q()
            }
        } else {
            if (o.load) {
                i(k, o, r, p)
            } else {
                r(o)
            }
        }
    }

    function h(t, v, r) {
        if (b.components[t]) {
            return v(b.components[t])
        }
        var k = b.componentIds[t];
        if (r) {
            var p = {
                page: r,
                component: k,
                index: t
            };
            r.m.reader.dispatchEvent("monocle:componentloading", p)
        }
        var q = function () {
            console.warn("Failed to load component: " + k);
            r.m.reader.dispatchEvent("monocle:componentfailed", p);
            try {
                var w = r.m.activeFrame.m.component;
                p.cmptId = w.properties.id;
                v(w)
            } catch (y) {
                console.warn("Failed to fall back to previous component.")
            }
        };
        var u = function (w) {
            if (w === false) {
                return q()
            }
            if (r) {
                p.source = w;
                r.m.reader.dispatchEvent("monocle:componentloaded", p);
                html = p.html
            }
            b.components[t] = new Monocle.Component(d, k, t, l(k), w);
            v(b.components[t])
        };
        var o = b.dataSource.getComponent(k, u);
        if (o && !b.components[t]) {
            u(o)
        } else {
            if (o === false) {
                return q()
            }
        }
    }

    function l(o) {
        if (b.chapters[o]) {
            return b.chapters[o]
        }
        b.chapters[o] = [];
        var r = new RegExp("^" + o + "(#(.+)|$)");
        var q;
        var k = function (u) {
            if (q = u.src.match(r)) {
                b.chapters[o].push({
                    title: u.title,
                    fragment: q[2] || null
                })
            }
            if (u.children) {
                for (var t = 0; t < u.children.length; ++t) {
                    k(u.children[t])
                }
            }
        };
        for (var p = 0; p < b.contents.length; ++p) {
            k(b.contents[p])
        }
        return b.chapters[o]
    }

    function j(r) {
        var q = new RegExp("^(.+?)(#(.*))?$");
        var p = r.match(q);
        if (!p) {
            return null
        }
        var k = g(p[1]);
        if (!k) {
            return null
        }
        var o = {
            componentId: k
        };
        p[3] ? o.anchor = p[3] : o.position = "start";
        return o
    }

    function g(k) {
        return b.componentIds.indexOf(k) >= 0 ? k : null
    }
    d.getMetaData = a.getMetaData;
    d.pageNumberAt = n;
    d.setPageAt = c;
    d.loadPageAt = i;
    d.setOrLoadPageAt = m;
    d.chaptersForComponent = l;
    d.locusOfChapter = j;
    f();
    return d
};
Monocle.Book.fromNodes = function (a) {
    var b = {
        getComponents: function () {
            return ["anonymous"]
        },
        getContents: function () {
            return []
        },
        getComponent: function (c) {
            return {
                nodes: a
            }
        },
        getMetaData: function (c) {}
    };
    return new Monocle.Book(b)
};
Monocle.pieceLoaded("core/book");
Monocle.Place = function () {
    var c = {
        constructor: Monocle.Place
    };
    var i = c.constants = c.constructor;
    var b = c.properties = {
        component: null,
        percent: null
    };

    function t(k, p) {
        b.component = k;
        b.percent = p / k.lastPageNumber();
        b.chapter = null
    }

    function q(k, p) {
        b.component = k;
        b.percent = p;
        b.chapter = null
    }

    function o() {
        return b.component.properties.id
    }

    function l() {
        return b.percent - 1 / b.component.lastPageNumber()
    }

    function d() {
        return b.percent
    }

    function n(k) {
        return Math.max(Math.round(b.component.lastPageNumber() * k), 1)
    }

    function r() {
        return n(b.percent)
    }

    function h() {
        if (b.chapter) {
            return b.chapter
        }
        return b.chapter = b.component.chapterForPage(r())
    }

    function g() {
        var k = h();
        return k ? k.title : null
    }

    function f() {
        var p = o();
        var k = h();
        if (k && k.fragment) {
            p += "#" + k.fragment
        }
        return p
    }

    function a(k) {
        k = k || {};
        var p = {
            page: r(),
            componentId: o()
        };
        if (k.direction) {
            p.page += k.direction
        } else {
            p.percent = d()
        }
        return p
    }

    function j() {
        componentIds = b.component.properties.book.properties.componentIds;
        componentSize = 1 / componentIds.length;
        var k = componentIds.indexOf(o()) * componentSize;
        k += componentSize * b.percent;
        return k
    }

    function m() {
        return b.component.properties.index == 0 && r() == 1
    }

    function e() {
        return (b.component.properties.index == b.component.properties.book.properties.lastCIndex && r() == b.component.lastPageNumber())
    }
    c.setPlace = t;
    c.setPercentageThrough = q;
    c.componentId = o;
    c.percentAtTopOfPage = l;
    c.percentAtBottomOfPage = d;
    c.percentageThrough = d;
    c.pageAtPercentageThrough = n;
    c.pageNumber = r;
    c.chapterInfo = h;
    c.chapterTitle = g;
    c.chapterSrc = f;
    c.getLocus = a;
    c.percentageOfBook = j;
    c.onFirstPageOfBook = m;
    c.onLastPageOfBook = e;
    return c
};
Monocle.Place.FromPageNumber = function (c, b) {
    var a = new Monocle.Place();
    a.setPlace(c, b);
    return a
};
Monocle.Place.FromPercentageThrough = function (b, c) {
    var a = new Monocle.Place();
    a.setPercentageThrough(b, c);
    return a
};
Monocle.Place.percentOfBookToLocus = function (a, c) {
    var d = a.getBook().properties.componentIds;
    var b = 1 / d.length;
    return {
        componentId: d[Math.floor(c / b)],
        percent: (c % b) / b
    }
};
Monocle.pieceLoaded("core/place");
Monocle.Component = function (l, r, h, f, v) {
    var t = {
        constructor: Monocle.Component
    };
    var y = t.constants = t.constructor;
    var q = t.properties = {
        book: l,
        id: r,
        index: h,
        chapters: f,
        source: v
    };

    function A(p, C) {
        var k = {
            page: p,
            source: q.source
        };
        p.m.reader.dispatchEvent("monocle:componentchanging", k);
        return d(p, function () {
            m(p, p.m.activeFrame, function () {
                C(p, t)
            })
        })
    }

    function d(k, C) {
        var p = k.m.activeFrame;
        p.m.component = t;
        p.style.visibility = "hidden";
        if (q.source.html || (typeof q.source == "string")) {
            return o(q.source.html || q.source, p, C)
        } else {
            if (q.source.javascript) {
                return z(q.source.javascript, p, C)
            } else {
                if (q.source.url) {
                    return a(q.source.url, p, C)
                } else {
                    if (q.source.nodes) {
                        return j(q.source.nodes, p, C)
                    } else {
                        if (q.source.doc) {
                            return e(q.source.doc, p, C)
                        }
                    }
                }
            }
        }
    }

    function o(C, p, D) {
        C = C.replace(/\n/g, "\\n").replace(/\r/, "\\r");
        C = C.replace(/\'/g, "\\'");
        if (Monocle.Browser.is.Gecko) {
            var k = "<!DOCTYPE[^>]*>";
            C = C.replace(new RegExp(k, "m"), "")
        }
        z(C, p, D)
    }

    function z(p, k, C) {
        p = "javascript:'" + p + "';";
        k.onload = function () {
            k.onload = null;
            Monocle.defer(C)
        };
        k.src = p
    }

    function a(k, C, D) {
        console.log("Loading frame from URL: " + k);
        if (!k.match(/^\//)) {
            var p = document.createElement("a");
            p.setAttribute("href", k);
            k = p.href;
            delete(p)
        }
        C.onload = function () {
            C.onload = null;
            Monocle.defer(D)
        };
        C.contentWindow.location.replace(k)
    }

    function j(k, p, I) {
        var H = p.contentDocument;
        H.documentElement.innerHTML = "";
        var F = H.createElement("head");
        var C = H.createElement("body");
        for (var E = 0; E < k.length; ++E) {
            var D = H.importNode(k[E], true);
            C.appendChild(D)
        }
        var G = H.getElementsByTagName("head")[0];
        if (G) {
            H.documentElement.replaceChild(F, G)
        } else {
            H.documentElement.appendChild(F)
        } if (H.body) {
            H.documentElement.replaceChild(C, H.body)
        } else {
            H.documentElement.appendChild(C)
        } if (I) {
            I()
        }
    }

    function e(E, C, I) {
        var H = C.contentDocument;
        var D = E.getElementsByTagName("base");
        if (D[0]) {
            var G = H.getElementsByTagName("head")[0];
            if (!G) {
                try {
                    G = H.createElement("head");
                    if (H.body) {
                        H.insertBefore(G, H.body)
                    } else {
                        H.appendChild(G)
                    }
                } catch (F) {
                    G = H.body
                }
            }
            var k = H.getElementsByTagName("base");
            var p = k[0] ? k[0] : H.createElement("base");
            p.setAttribute("href", D[0].getAttribute("href"));
            G.appendChild(p)
        }
        H.replaceChild(H.importNode(E.documentElement, true), H.documentElement);
        Monocle.defer(I)
    }

    function m(p, D, E) {
        Monocle.Events.listenOnIframe(D);
        var C = D.contentDocument;
        var k = {
            page: p,
            document: C,
            component: t
        };
        p.m.reader.dispatchEvent("monocle:componentmodify", k);
        i(p, function () {
            D.style.visibility = "visible";
            B(p);
            p.m.reader.dispatchEvent("monocle:componentchange", k);
            E()
        })
    }

    function i(k, p) {
        k.m.dimensions.update(function (C) {
            q.pageLength = C;
            if (typeof p == "function") {
                p()
            }
        })
    }

    function B(k) {
        if (q.chapters[0] && typeof q.chapters[0].percent == "number") {
            return
        }
        var E = k.m.activeFrame.contentDocument;
        for (var p = 0; p < q.chapters.length; ++p) {
            var D = q.chapters[p];
            D.percent = 0;
            if (D.fragment) {
                var C = E.getElementById(D.fragment);
                D.percent = k.m.dimensions.percentageThroughOfNode(C)
            }
        }
        return q.chapters
    }

    function g(p) {
        var D = null;
        var C = (p - 1) / q.pageLength;
        for (var k = 0; k < q.chapters.length; ++k) {
            if (C >= q.chapters[k].percent) {
                D = q.chapters[k]
            } else {
                return D
            }
        }
        return D
    }

    function c(p, k) {
        if (!p) {
            return 1
        }
        for (var C = 0; C < q.chapters.length; ++C) {
            if (q.chapters[C].fragment == p) {
                return n(q.chapters[C].percent)
            }
        }
        var F = k.m.activeFrame.contentDocument;
        var E = F.getElementById(p);
        var D = k.m.dimensions.percentageThroughOfNode(E);
        return n(D)
    }

    function b(k, p) {
        var E = p.m.activeFrame.contentDocument;
        var D = 0;
        if (Monocle.Browser.env.supportsXPath) {
            var C = E.evaluate(k, E, null, 9, null).singleNodeValue;
            if (C) {
                D = p.m.dimensions.percentageThroughOfNode(C)
            }
        } else {
            console.warn("XPath not supported in this client.")
        }
        return n(D)
    }

    function w(k, p) {
        var E = p.m.activeFrame.contentDocument;
        var D = 0;
        if (Monocle.Browser.env.supportsQuerySelector) {
            var C = E.querySelector(k);
            if (C) {
                D = p.m.dimensions.percentageThroughOfNode(C)
            }
        } else {
            console.warn("querySelector not supported in this client.")
        }
        return n(D)
    }

    function n(k) {
        return Math.floor(k * q.pageLength) + 1
    }

    function u() {
        return q.pageLength
    }
    t.applyTo = A;
    t.updateDimensions = i;
    t.chapterForPage = g;
    t.pageForChapter = c;
    t.pageForXPath = b;
    t.pageForSelector = w;
    t.lastPageNumber = u;
    return t
};
Monocle.pieceLoaded("core/component");
Monocle.Controls.Panel = function () {
    var c = {
        constructor: Monocle.Controls.Panel
    };
    var h = c.constants = c.constructor;
    var b = c.properties = {
        evtCallbacks: {}
    };

    function e(k) {
        b.div = k.dom.make("div", h.CLS.panel);
        b.div.dom.setStyles(h.DEFAULT_STYLES);
        Monocle.Events.listenForContact(b.div, {
            start: a,
            move: f,
            end: g,
            cancel: n
        }, {
            useCapture: false
        });
        return b.div
    }

    function d(k) {
        b.evtCallbacks = k
    }

    function l() {
        b.evtCallbacks = {}
    }

    function a(k) {
        b.contact = true;
        k.m.offsetX += b.div.offsetLeft;
        k.m.offsetY += b.div.offsetTop;
        j();
        i("start", k)
    }

    function f(k) {
        if (!b.contact) {
            return
        }
        i("move", k)
    }

    function g(k) {
        if (!b.contact) {
            return
        }
        Monocle.Events.deafenForContact(b.div, b.listeners);
        m();
        b.contact = false;
        i("end", k)
    }

    function n(k) {
        if (!b.contact) {
            return
        }
        Monocle.Events.deafenForContact(b.div, b.listeners);
        m();
        b.contact = false;
        i("cancel", k)
    }

    function i(o, k) {
        if (b.evtCallbacks[o]) {
            b.evtCallbacks[o](c, k.m.offsetX, k.m.offsetY)
        }
        k.preventDefault()
    }

    function j() {
        if (b.expanded) {
            return
        }
        b.div.dom.addClass(h.CLS.expanded);
        b.expanded = true
    }

    function m(k) {
        if (!b.expanded) {
            return
        }
        b.div.dom.removeClass(h.CLS.expanded);
        b.expanded = false
    }
    c.createControlElements = e;
    c.listenTo = d;
    c.deafen = l;
    c.expand = j;
    c.contract = m;
    return c
};
Monocle.Controls.Panel.CLS = {
    panel: "panel",
    expanded: "controls_panel_expanded"
};
Monocle.Controls.Panel.DEFAULT_STYLES = {
    position: "absolute",
    height: "100%"
};
Monocle.pieceLoaded("controls/panel");
Monocle.Panels.TwoPane = function (d, f) {
    var c = {
        constructor: Monocle.Panels.TwoPane
    };
    var b = c.constants = c.constructor;
    var e = c.properties = {};

    function a() {
        e.panels = {
            forwards: new Monocle.Controls.Panel(),
            backwards: new Monocle.Controls.Panel()
        };
        for (dir in e.panels) {
            d.properties.reader.addControl(e.panels[dir]);
            e.panels[dir].listenTo(f);
            e.panels[dir].properties.direction = d.constants[dir.toUpperCase()];
            var g = {
                width: b.WIDTH
            };
            g[(dir == "forwards" ? "right" : "left")] = 0;
            e.panels[dir].properties.div.dom.setStyles(g)
        }
    }
    a();
    return c
};
Monocle.Panels.TwoPane.WIDTH = "50%";
Monocle.pieceLoaded("panels/twopane");
Monocle.Panels.IMode = function (e, a) {
    var d = {
        constructor: Monocle.Panels.IMode
    };
    var f = d.constants = d.constructor;
    var c = d.properties = {};

    function i() {
        c.flipper = e;
        c.reader = e.properties.reader;
        c.panels = {
            forwards: new Monocle.Controls.Panel(),
            backwards: new Monocle.Controls.Panel()
        };
        c.divs = {};
        for (dir in c.panels) {
            c.reader.addControl(c.panels[dir]);
            c.divs[dir] = c.panels[dir].properties.div;
            c.panels[dir].listenTo(a);
            c.panels[dir].properties.direction = e.constants[dir.toUpperCase()];
            c.divs[dir].style.width = "33%";
            c.divs[dir].style[dir == "forwards" ? "right" : "left"] = 0
        }
        c.panels.central = new Monocle.Controls.Panel();
        c.reader.addControl(c.panels.central);
        c.divs.central = c.panels.central.properties.div;
        c.divs.central.dom.setStyles({
            left: "33%",
            width: "34%"
        });
        l({
            end: h
        });
        for (dir in c.panels) {
            c.divs[dir].dom.addClass("panels_imode_panel");
            c.divs[dir].dom.addClass("panels_imode_" + dir + "Panel")
        }
        c.toggleIcon = {
            createControlElements: function (k) {
                var o = k.dom.make("div", "panels_imode_toggleIcon");
                Monocle.Events.listenForTap(o, g);
                return o
            }
        };
        c.reader.addControl(c.toggleIcon, null, {
            hidden: true
        })
    }

    function l(k) {
        c.menuCallbacks = k;
        c.panels.central.listenTo(c.menuCallbacks)
    }

    function j() {
        c.interactive ? g() : h()
    }

    function h() {
        if (c.interactive) {
            return
        }
        c.panels.central.contract();
        var o = c.reader.visiblePages()[0];
        var q = o.m.sheafDiv;
        var p = q.offsetLeft;
        var k = o.offsetWidth - (q.offsetLeft + q.offsetWidth);
        p = Math.floor(((p - 2) / o.offsetWidth) * 10000 / 100) + "%";
        k = Math.floor(((k - 2) / o.offsetWidth) * 10000 / 100) + "%";
        b(function () {
            c.divs.forwards.style.width = k;
            c.divs.backwards.style.width = p;
            Monocle.Styles.affix(c.divs.central, "transform", "translateY(-100%)")
        });
        c.reader.showControl(c.toggleIcon);
        c.interactive = true;
        if (e.interactiveMode) {
            e.interactiveMode(true)
        }
    }

    function g() {
        if (!c.interactive) {
            return
        }
        c.panels.central.contract();
        m();
        b(function () {
            c.divs.forwards.style.width = "33%";
            c.divs.backwards.style.width = "33%";
            Monocle.Styles.affix(c.divs.central, "transform", "translateY(0)")
        });
        c.reader.hideControl(c.toggleIcon);
        c.interactive = false;
        if (e.interactiveMode) {
            e.interactiveMode(false)
        }
    }

    function b(o) {
        var k = Monocle.Panels.IMode.CAMEO_DURATION + "ms ease-in";
        Monocle.Styles.affix(c.divs.forwards, "transition", "width " + k);
        Monocle.Styles.affix(c.divs.backwards, "transition", "width " + k);
        Monocle.Styles.affix(c.divs.central, "transition", "-webkit-transform " + k);
        for (var p in c.panels) {
            c.panels[p].deafen()
        }
        for (var q in c.divs) {
            c.divs[q].style.opacity = 1
        }
        if (typeof WebkitTransitionEvent != "undefined") {
            c.cameoListener = Monocle.Events.listen(c.divs.central, "webkitTransitionEnd", n)
        } else {
            setTimeout(n, f.CAMEO_DURATION)
        }
        o()
    }

    function n() {
        setTimeout(function () {
            var k = "opacity linear " + Monocle.Panels.IMode.LINGER_DURATION + "ms";
            Monocle.Styles.affix(c.divs.forwards, "transition", k);
            Monocle.Styles.affix(c.divs.backwards, "transition", k);
            Monocle.Styles.affix(c.divs.central, "transition", k);
            for (var o in c.divs) {
                c.divs[o].style.opacity = 0
            }
            c.panels.forwards.listenTo(a);
            c.panels.backwards.listenTo(a);
            c.panels.central.listenTo(c.menuCallbacks)
        }, Monocle.Panels.IMode.LINGER_DURATION);
        if (c.cameoListener) {
            Monocle.Events.deafen(c.divs.central, "webkitTransitionEnd", n)
        }
    }

    function m() {
        for (var o = 0, k; k = c.reader.dom.find("component", o); ++o) {
            var p = k.contentWindow.getSelection() || k.contentDocument.selection;
            if (p.removeAllRanges) {
                p.removeAllRanges()
            }
            if (p.empty) {
                p.empty()
            }
            k.contentDocument.body.scrollLeft = 0;
            k.contentDocument.body.scrollTop = 0
        }
    }
    d.toggle = j;
    d.modeOn = h;
    d.modeOff = g;
    d.menuCallbacks = l;
    i();
    return d
};
Monocle.Panels.IMode.CAMEO_DURATION = 250;
Monocle.Panels.IMode.LINGER_DURATION = 250;
Monocle.pieceLoaded("panels/imode");
Monocle.Panels.eInk = function (d, g) {
    var c = {
        constructor: Monocle.Panels.eInk
    };
    var b = c.constants = c.constructor;
    var f = c.properties = {
        flipper: d
    };

    function a() {
        f.panel = new Monocle.Controls.Panel();
        f.reader = f.flipper.properties.reader;
        f.reader.addControl(f.panel);
        f.panel.listenTo({
            end: function (j, i) {
                if (i < f.panel.properties.div.offsetWidth / 2) {
                    f.panel.properties.direction = d.constants.BACKWARDS
                } else {
                    f.panel.properties.direction = d.constants.FORWARDS
                }
                g.end(j, i)
            }
        });
        var h = f.panel.properties.div.style;
        f.reader.listen("monocle:componentchanging", function () {
            h.opacity = 1;
            Monocle.defer(function () {
                h.opacity = 0
            }, 40)
        });
        h.width = "100%";
        h.background = "#000";
        h.opacity = 0;
        if (b.LISTEN_FOR_KEYS) {
            Monocle.Events.listen(window.top.document, "keyup", e)
        }
    }

    function e(h) {
        var j = h.charCode || h.keyCode;
        var i = null;
        if (j == b.KEYS.PAGEUP) {
            i = d.constants.BACKWARDS
        } else {
            if (j == b.KEYS.PAGEDOWN) {
                i = d.constants.FORWARDS
            }
        } if (i) {
            d.moveTo({
                direction: i
            });
            h.preventDefault()
        }
    }
    a();
    return c
};
Monocle.Panels.eInk.LISTEN_FOR_KEYS = true;
Monocle.Panels.eInk.KEYS = {
    PAGEUP: 33,
    PAGEDOWN: 34
};
Monocle.Panels.Marginal = function (flipper, evtCallbacks) {
    var API = {
        constructor: Monocle.Panels.Marginal
    };
    var k = API.constants = API.constructor;
    var p = API.properties = {};

    function initialize() {
        p.panels = {
            forwards: new Monocle.Controls.Panel(),
            backwards: new Monocle.Controls.Panel()
        };
        for (dir in p.panels) {
            flipper.properties.reader.addControl(p.panels[dir]);
            p.panels[dir].listenTo(evtCallbacks);
            p.panels[dir].properties.direction = flipper.constants[dir.toUpperCase()];
            with(p.panels[dir].properties.div.style) {
                dir == "forwards" ? right = 0 : left = 0
            }
        }
        setWidths();
        if (flipper.interactiveMode) {
            flipper.interactiveMode(true)
        }
    }

    function setWidths() {
        var page = flipper.properties.reader.dom.find("page");
        var sheaf = page.m.sheafDiv;
        var bw = sheaf.offsetLeft;
        var fw = page.offsetWidth - (sheaf.offsetLeft + sheaf.offsetWidth);
        bw = Math.floor(((bw - 2) / page.offsetWidth) * 10000 / 100) + "%";
        fw = Math.floor(((fw - 2) / page.offsetWidth) * 10000 / 100) + "%";
        p.panels.forwards.properties.div.style.width = fw;
        p.panels.backwards.properties.div.style.width = bw
    }
    API.setWidths = setWidths;
    initialize();
    return API
};
Monocle.pieceLoaded("panels/marginal");
Monocle.Dimensions.Vert = function (d) {
    var c = {
        constructor: Monocle.Dimensions.Vert
    };
    var f = c.constants = c.constructor;
    var b = c.properties = {
        page: d,
        reader: d.m.reader
    };

    function h() {
        b.reader.listen("monocle:componentchange", e)
    }

    function g(k) {
        b.bodyHeight = i();
        b.pageHeight = l();
        b.length = Math.ceil(b.bodyHeight / b.pageHeight);
        k(b.length)
    }

    function i() {
        return b.page.m.activeFrame.contentDocument.body.scrollHeight
    }

    function l() {
        return b.page.m.activeFrame.offsetHeight - f.GUTTER
    }

    function a(o) {
        if (!o) {
            return 0
        }
        var n = b.page.m.activeFrame.contentDocument;
        var p = 0;
        if (o.getBoundingClientRect) {
            p = o.getBoundingClientRect().top;
            p -= n.body.getBoundingClientRect().top
        } else {
            var k = n.body.scrollTop;
            o.scrollIntoView();
            p = n.body.scrollTop;
            n.body.scrollLeft = 0;
            n.body.scrollTop = k
        }
        var m = p / b.bodyHeight;
        return m
    }

    function e(m) {
        if (m.m.page != b.page) {
            return
        }
        var o = b.page.m.sheafDiv;
        var k = b.page.m.activeFrame;
        o.dom.setStyles(f.SHEAF_STYLES);
        k.dom.setStyles(f.COMPONENT_STYLES);
        var n = m.m.document;
        n.documentElement.style.overflow = "hidden";
        n.body.style.marginRight = "10px !important";
        k.contentWindow.scrollTo(0, 0)
    }

    function j(k) {
        return b.pageHeight * (k.page - 1)
    }
    c.update = g;
    c.percentageThroughOfNode = a;
    c.locusToOffset = j;
    h();
    return c
};
Monocle.Dimensions.Vert.GUTTER = 10;
Monocle.pieceLoaded("dimensions/vert");
Monocle.Flippers.Legacy = function (a) {
    var m = {
        constructor: Monocle.Flippers.Legacy
    };
    var q = m.constants = m.constructor;
    var j = m.properties = {
        pageCount: 1,
        divs: {}
    };

    function b() {
        j.reader = a
    }

    function c(k) {
        k.m.dimensions = new Monocle.Dimensions.Vert(k)
    }

    function t() {
        return e().m.place
    }

    function h(k, w) {
        var p = o;
        if (typeof w == "function") {
            p = function (y) {
                o(y);
                w(y)
            }
        }
        j.reader.getBook().setOrLoadPageAt(e(), k, p)
    }

    function v(k) {
        if (typeof k != "function") {
            k = q.DEFAULT_PANELS_CLASS;
            if (!k) {
                console.warn("Invalid panel class.")
            }
        }
        j.panels = new k(m, {
            end: g
        })
    }

    function e() {
        return j.reader.dom.find("page")
    }

    function g(p) {
        var w = p.properties.direction;
        var k = t();
        if ((w < 0 && k.onFirstPageOfBook()) || (w > 0 && k.onLastPageOfBook())) {
            return
        }
        h({
            page: t().pageNumber() + w
        })
    }

    function o(y) {
        var w = j.reader.dom.find("component");
        var A = w.contentWindow;
        var k = r(A);
        var B = e().m.dimensions;
        var z = B.properties.pageHeight;
        var p = B.locusToOffset(y);
        if (Math.abs(p - k) > z) {
            return A.scrollTo(0, p)
        }
        d(A, k < p ? k + z : k);
        Monocle.defer(function () {
            l(A, k, p, 300, f)
        }, 150)
    }

    function r(k) {
        if (k.pageYOffset) {
            return k.pageYOffset
        }
        if (k.document.documentElement && k.document.documentElement.scrollTop) {
            return k.document.documentElement.scrollTop
        }
        if (k.document.body.scrollTop) {
            return k.document.body.scrollTop
        }
        return 0
    }

    function l(B, y, w, A, C) {
        clearTimeout(B.smoothScrollInterval);
        var p = (new Date()).getTime();
        var D = 40;
        var z = (w - y) * (D / A);
        var k = function () {
            var E = y + z;
            if ((new Date()).getTime() - p > A || Math.abs(y - w) < Math.abs((y + z) - w)) {
                clearTimeout(B.smoothScrollInterval);
                B.scrollTo(0, w);
                if (C) {
                    C()
                }
            } else {
                B.scrollTo(0, E);
                y = E
            }
        };
        B.smoothScrollInterval = setInterval(k, D)
    }

    function f() {
        i(e().m.activeFrame.contentWindow);
        j.reader.dispatchEvent("monocle:turn")
    }

    function d(p, w) {
        if (j.hideTO) {
            clearTimeout(j.hideTO)
        }
        var k = p.document;
        if (!k.body.indicator) {
            k.body.indicator = n(k);
            k.body.appendChild(k.body.indicator)
        }
        k.body.indicator.line.style.display = "block";
        k.body.indicator.style.opacity = 1;
        u(w)
    }

    function i(p) {
        var k = p.document;
        j.hideTO = Monocle.defer(function () {
            if (!k.body.indicator) {
                k.body.indicator = n(k);
                k.body.appendChild(k.body.indicator)
            }
            var w = e().m.dimensions;
            u(w.locusToOffset(t().getLocus()) + w.properties.pageHeight);
            k.body.indicator.line.style.display = "none";
            k.body.indicator.style.opacity = 0.5
        }, 600)
    }

    function n(p) {
        var k = p.createElement("div");
        p.body.appendChild(k);
        Monocle.Styles.applyRules(k, q.STYLES.iBox);
        k.arrow = p.createElement("div");
        k.appendChild(k.arrow);
        Monocle.Styles.applyRules(k.arrow, q.STYLES.arrow);
        k.line = p.createElement("div");
        k.appendChild(k.line);
        Monocle.Styles.applyRules(k.line, q.STYLES.line);
        return k
    }

    function u(A) {
        var z = e();
        var w = z.m.activeFrame.contentDocument;
        var k = z.m.dimensions.properties.bodyHeight;
        k -= w.body.indicator.offsetHeight;
        if (A > k) {
            A = k
        }
        w.body.indicator.style.top = A + "px"
    }
    m.pageCount = j.pageCount;
    m.addPage = c;
    m.getPlace = t;
    m.moveTo = h;
    m.listenForInteraction = v;
    b();
    return m
};
Monocle.Flippers.Legacy.FORWARDS = 1;
Monocle.Flippers.Legacy.BACKWARDS = -1;
Monocle.Flippers.Legacy.DEFAULT_PANELS_CLASS = Monocle.Panels.TwoPane;
Monocle.Flippers.Legacy.STYLES = {
    iBox: {
        position: "absolute",
        right: 0,
        left: 0,
        height: "10px"
    },
    arrow: {
        position: "absolute",
        right: 0,
        height: "10px",
        width: "10px",
        background: "#333",
        "border-radius": "6px"
    },
    line: {
        width: "100%",
        "border-top": "2px dotted #333",
        "margin-top": "5px"
    }
};
Monocle.pieceLoaded("flippers/legacy");
Monocle.Dimensions.Columns = function (e) {
    var c = {
        constructor: Monocle.Dimensions.Columns
    };
    var g = c.constants = c.constructor;
    var b = c.properties = {
        page: e,
        reader: e.m.reader,
        length: 0,
        width: 0
    };

    function h(k) {
        n();
        Monocle.defer(function () {
            b.length = l();
            if (Monocle.DEBUG) {
                console.log("page[" + b.page.m.pageIndex + "] -> " + b.length + " (" + b.page.m.activeFrame.m.component.properties.id + ")")
            }
            k(b.length)
        })
    }

    function n() {
        var q = f();
        var k = d();
        b.width = q.width;
        var p = Monocle.Styles.rulesToString(g.STYLE.columned);
        p += Monocle.Browser.css.toCSSDeclaration("column-width", b.width + "px");
        p += Monocle.Browser.css.toCSSDeclaration("column-gap", 0);
        p += Monocle.Browser.css.toCSSDeclaration("transform", "translateX(0)");
        if (Monocle.Browser.env.forceColumns && k.scrollHeight > q.height) {
            p += Monocle.Styles.rulesToString(g.STYLE["column-force"]);
            if (Monocle.DEBUG) {
                console.warn("Force columns (" + k.scrollHeight + " > " + q.height + ")")
            }
        }
        if (k.style.cssText != p) {
            b.page.m.offset = 0;
            k.style.cssText = p;
            if (Monocle.Browser.env.scrollToApplyStyle) {
                k.scrollLeft = 0
            }
        }
    }

    function d() {
        return b.page.m.activeFrame.contentDocument.body
    }

    function m() {
        var p = d();
        var q = b.page.m.activeFrame.contentDocument.documentElement;
        var k = Math.max(p.scrollWidth, q.scrollWidth);
        if (!Monocle.Browser.env.widthsIgnoreTranslate && b.page.m.offset) {
            k += b.page.m.offset
        }
        return k
    }

    function f() {
        var k = b.page.m.sheafDiv;
        return {
            width: k.clientWidth,
            height: k.clientHeight
        }
    }

    function l() {
        return Math.ceil(m() / f().width)
    }

    function j(k) {
        return f().width * (k.page - 1)
    }

    function i(k) {
        var p = j(k);
        b.page.m.offset = p;
        o(p);
        return p
    }

    function o(p) {
        var k = d();
        if (Monocle.Browser.env.translateIframeIn3d) {
            k.style.cssText += "-webkit-transform: translate3d(-" + p + "px,0,0)"
        } else {
            Monocle.Styles.affix(k, "transform", "translateX(-" + p + "px)")
        }
    }

    function a(u) {
        if (!u) {
            return 0
        }
        var t = b.page.m.activeFrame.contentDocument;
        var w = 0;
        if (Monocle.Browser.env.findNodesByScrolling) {
            o(0);
            var r = s = b.page.m.activeFrame.contentWindow;
            var v = [
                [r, r.scrollX, r.scrollY],
                [window, window.scrollX, window.scrollY]
            ];
            if (Monocle.Browser.env.sheafIsScroller) {
                var p = b.page.m.sheafDiv;
                var k = p.scrollLeft;
                u.scrollIntoView();
                w = p.scrollLeft
            } else {
                var p = r;
                var k = p.scrollX;
                u.scrollIntoView();
                w = p.scrollX
            }
            while (s = v.shift()) {
                s[0].scrollTo(s[1], s[2])
            }
            o(b.page.m.offset)
        } else {
            w = u.getBoundingClientRect().left;
            w -= t.body.getBoundingClientRect().left
        }
        w += 1;
        var q = w / (b.length * b.width);
        return q
    }
    c.update = h;
    c.percentageThroughOfNode = a;
    c.locusToOffset = j;
    c.translateToLocus = i;
    return c
};
Monocle.Dimensions.Columns.STYLE = {
    columned: {
        margin: "0",
        padding: "0",
        height: "100%",
        width: "100%",
        position: "absolute"
    },
    "column-force": {
        "min-width": "200%",
        overflow: "hidden"
    }
};
Monocle.pieceLoaded("dimensions/columns");
Monocle.Flippers.Slider = function (j) {
    if (Monocle.Flippers == this) {
        return new Monocle.Flippers.Slider(j)
    }
    var z = {
        constructor: Monocle.Flippers.Slider
    };
    var M = z.constants = z.constructor;
    var J = z.properties = {
        pageCount: 2,
        activeIndex: 1,
        turnData: {}
    };

    function g() {
        J.reader = j
    }

    function o(k) {
        k.m.dimensions = new Monocle.Dimensions.Columns(k);
        Monocle.Styles.setX(k, "0px")
    }

    function P() {
        return [G()]
    }

    function n(k) {
        Q(true);
        Q(false);
        if (typeof k != "function") {
            k = M.DEFAULT_PANELS_CLASS;
            if (!k) {
                console.warn("Invalid panel class.")
            }
        }
        var p = function (U, S, R) {
            var T = S.properties.direction;
            if (U == "lift") {
                B(T, R)
            } else {
                if (U == "release") {
                    v(T, R)
                }
            }
        };
        J.panels = new k(z, {
            start: function (S, R) {
                p("lift", S, R)
            },
            move: function (S, R) {
                u(S.properties.direction, R)
            },
            end: function (S, R) {
                p("release", S, R)
            },
            cancel: function (S, R) {
                p("release", S, R)
            }
        })
    }

    function Q(p) {
        J.reader.dispatchEvent("monocle:interactive:" + (p ? "on" : "off"));
        if (!Monocle.Browser.env.selectIgnoresZOrder) {
            return
        }
        if (J.interactive = p) {
            if (J.activeIndex != 0) {
                var k = a();
                if (k) {
                    y(J.reader.dom.find("page", 0), k.getLocus(), function () {
                        H();
                        l()
                    })
                } else {
                    H()
                }
            }
        }
    }

    function a(k) {
        k = k || G();
        return k.m ? k.m.place : null
    }

    function d(k, R) {
        var p = function () {
            l(function () {
                if (typeof R == "function") {
                    R()
                }
                O()
            })
        };
        y(G(), k, p)
    }

    function y(k, p, R) {
        C();
        J.reader.getBook().setOrLoadPageAt(k, p, function (S) {
            k.m.dimensions.translateToLocus(S);
            if (R) {
                R()
            }
        })
    }

    function G() {
        return J.reader.dom.find("page", J.activeIndex)
    }

    function K() {
        return J.reader.dom.find("page", (J.activeIndex + 1) % 2)
    }

    function H() {
        G().style.zIndex = 1;
        K().style.zIndex = 2;
        return J.activeIndex = (J.activeIndex + 1) % 2
    }

    function B(k, p) {
        if (J.turnData.lifting || J.turnData.releasing) {
            return
        }
        J.turnData.points = {
            start: p,
            min: p,
            max: p
        };
        J.turnData.lifting = true;
        if (k == M.FORWARDS) {
            if (a().onLastPageOfBook()) {
                J.reader.dispatchEvent("monocle:boundaryend", {
                    locus: a().getLocus({
                        direction: k
                    }),
                    page: G()
                });
                m();
                return
            }
            h(p)
        } else {
            if (k == M.BACKWARDS) {
                if (a().onFirstPageOfBook()) {
                    J.reader.dispatchEvent("monocle:boundarystart", {
                        locus: a().getLocus({
                            direction: k
                        }),
                        page: G()
                    });
                    m();
                    return
                }
                L(p)
            } else {
                console.warn("Invalid direction: " + k)
            }
        }
    }

    function u(k, p) {
        if (!J.turnData.points) {
            return
        }
        if (J.turnData.lifting || J.turnData.releasing) {
            return
        }
        A(p);
        N(p, null, "0")
    }

    function v(k, p) {
        if (!J.turnData.points) {
            return
        }
        if (J.turnData.lifting) {
            J.turnData.releaseArgs = [k, p];
            return
        }
        if (J.turnData.releasing) {
            return
        }
        A(p);
        J.turnData.releasing = true;
        r(K());
        if (k == M.FORWARDS) {
            if (J.turnData.points.tap || J.turnData.points.start - p > 60 || J.turnData.points.min >= p) {
                b(f)
            } else {
                D(F)
            }
        } else {
            if (k == M.BACKWARDS) {
                if (J.turnData.points.tap || p - J.turnData.points.start > 60 || J.turnData.points.max <= p) {
                    D(c)
                } else {
                    b(w)
                }
            } else {
                console.warn("Invalid direction: " + k)
            }
        }
    }

    function A(k) {
        J.turnData.points.min = Math.min(J.turnData.points.min, k);
        J.turnData.points.max = Math.max(J.turnData.points.max, k);
        J.turnData.points.tap = J.turnData.points.max - J.turnData.points.min < 10
    }

    function h(k) {
        q(k)
    }

    function L(p) {
        var R = K(),
            k = G();
        r(k);
        i(R, function () {
            H();
            y(R, a(K()).getLocus({
                direction: M.BACKWARDS
            }), function () {
                q(p);
                e(k)
            })
        })
    }

    function f() {
        var k = G(),
            p = K();
        if (J.interactive) {
            r(k);
            r(p);
            y(k, a().getLocus({
                direction: M.FORWARDS
            }), function () {
                t(k, function () {
                    l(O)
                })
            })
        } else {
            r(p);
            H();
            t(k, function () {
                l(O)
            })
        }
    }

    function c() {
        if (J.interactive) {
            y(K(), a().getLocus(), function () {
                H();
                l(O)
            })
        } else {
            O()
        }
    }

    function F() {
        m()
    }

    function w() {
        H();
        t(K(), function () {
            l(m)
        })
    }

    function l(k) {
        y(K(), a().getLocus({
            direction: M.FORWARDS
        }), k)
    }

    function q(k) {
        J.turnData.lifting = false;
        var p = J.turnData.releaseArgs;
        if (p) {
            J.turnData.releaseArgs = null;
            v(p[0], p[1])
        } else {
            if (k) {
                N(k)
            }
        }
    }

    function O() {
        J.reader.dispatchEvent("monocle:turn");
        m()
    }

    function m() {
        e(G());
        e(K());
        J.turnData = {}
    }

    function E(V, X, aa, Y) {
        var W;
        if (!aa.duration) {
            W = 0
        } else {
            W = parseInt(aa.duration)
        } if (typeof (X) == "number") {
            X = X + "px"
        }
        if (typeof WebKitTransitionEvent != "undefined") {
            if (W) {
                transition = "-webkit-transform";
                transition += " " + W + "ms";
                transition += " " + (aa.timing || "linear");
                transition += " " + (aa.delay || 0) + "ms"
            } else {
                transition = "none"
            }
            V.style.webkitTransition = transition;
            if (Monocle.Browser.env.supportsTransform3d) {
                V.style.webkitTransform = "translate3d(" + X + ",0,0)"
            } else {
                V.style.webkitTransform = "translateX(" + X + ")"
            }
        } else {
            if (W > 0) {
                clearTimeout(V.setXTransitionInterval);
                var p = (new Date()).getTime();
                var Z = 40;
                var T = parseInt(X);
                var S = I(V);
                var U = (T - S) * (Z / W);
                var k = function () {
                    var ab = S + U;
                    if ((new Date()).getTime() - p > W || Math.abs(S - T) <= Math.abs((S + U) - T)) {
                        clearTimeout(V.setXTransitionInterval);
                        Monocle.Styles.setX(V, T);
                        if (V.setXTCB) {
                            V.setXTCB()
                        }
                    } else {
                        Monocle.Styles.setX(V, ab);
                        S = ab
                    }
                };
                V.setXTransitionInterval = setInterval(k, Z)
            } else {
                Monocle.Styles.setX(V, X)
            }
        } if (V.setXTCB) {
            Monocle.Events.deafen(V, "webkitTransitionEnd", V.setXTCB);
            V.setXTCB = null
        }
        V.setXTCB = function () {
            if (Y) {
                Y()
            }
        };
        var R = I(V);
        if (!W || R == parseInt(X)) {
            V.setXTCB()
        } else {
            Monocle.Events.listen(V, "webkitTransitionEnd", V.setXTCB)
        }
    }

    function I(p) {
        if (typeof WebKitCSSMatrix == "object") {
            var k = window.getComputedStyle(p).webkitTransform;
            k = new WebKitCSSMatrix(k);
            return k.m41
        } else {
            var R = p.style.MozTransform;
            if (!R || R == "") {
                return 0
            }
            return parseFloat((/translateX\((\-?.*)px\)/).exec(R)[1]) || 0
        }
    }

    function t(k, p) {
        Monocle.defer(function () {
            E(k, 0, {
                duration: 0
            }, p)
        })
    }

    function i(k, p) {
        Monocle.defer(function () {
            E(k, 0 - k.offsetWidth, {
                duration: 0
            }, p)
        })
    }

    function D(p) {
        var k = {
            duration: M.durations.SLIDE,
            timing: "ease-in"
        };
        Monocle.defer(function () {
            E(G(), 0, k, p)
        })
    }

    function b(p) {
        var k = {
            duration: M.durations.SLIDE,
            timing: "ease-in"
        };
        Monocle.defer(function () {
            E(G(), 0 - G().offsetWidth, k, p)
        })
    }

    function N(k, R, p) {
        E(G(), Math.min(0, k - G().offsetWidth), {
            duration: p || M.durations.FOLLOW_CURSOR
        }, R)
    }

    function C() {
        if (J.waitControl) {
            return
        }
        J.waitControl = {
            createControlElements: function (k) {
                return k.dom.make("div", "flippers_slider_wait")
            }
        };
        J.reader.addControl(J.waitControl, "page")
    }

    function r(p) {
        var k = J.reader.dom.find("flippers_slider_wait", p.m.pageIndex);
        k.style.visibility = "visible"
    }

    function e(p) {
        var k = J.reader.dom.find("flippers_slider_wait", p.m.pageIndex);
        k.style.visibility = "hidden"
    }
    z.pageCount = J.pageCount;
    z.addPage = o;
    z.getPlace = a;
    z.moveTo = d;
    z.listenForInteraction = n;
    z.visiblePages = P;
    z.interactiveMode = Q;
    g();
    return z
};
Monocle.Flippers.Slider.DEFAULT_PANELS_CLASS = Monocle.Panels.TwoPane;
Monocle.Flippers.Slider.FORWARDS = 1;
Monocle.Flippers.Slider.BACKWARDS = -1;
Monocle.Flippers.Slider.durations = {
    SLIDE: 220,
    FOLLOW_CURSOR: 100
};
Monocle.pieceLoaded("flippers/slider");
Monocle.Flippers.Scroller = function (f, h) {
    var b = {
        constructor: Monocle.Flippers.Scroller
    };
    var d = b.constants = b.constructor;
    var a = b.properties = {
        pageCount: 1,
        duration: 200
    };

    function e() {
        a.reader = f;
        a.setPageFn = h
    }

    function g(k) {
        k.m.dimensions = new Monocle.Dimensions.Columns(k)
    }

    function i() {
        return a.reader.dom.find("page")
    }

    function j(k) {
        if (typeof k != "function") {
            k = d.DEFAULT_PANELS_CLASS
        }
        a.panels = new k(b, {
            end: function (o) {
                l(o.properties.direction)
            }
        })
    }

    function l(k) {
        if (a.turning) {
            return
        }
        m({
            page: n().pageNumber() + k
        })
    }

    function n() {
        return i().m.place
    }

    function m(k, p) {
        var o = c;
        if (typeof p == "function") {
            o = function (q) {
                c(q);
                p(q)
            }
        }
        a.reader.getBook().setOrLoadPageAt(i(), k, o)
    }

    function c(u) {
        a.turning = true;
        var v = i().m.dimensions.locusToOffset(u);
        var t = i().m.activeFrame.contentDocument.body;
        if (false && typeof WebKitTransitionEvent != "undefined") {
            t.style.webkitTransition = "-webkit-transform " + a.duration + "ms ease-out 0ms";
            t.style.webkitTransform = "translateX(-" + v + "px)";
            Monocle.Events.listen(t, "webkitTransitionEnd", function () {
                a.turning = false;
                a.reader.dispatchEvent("monocle:turn")
            })
        } else {
            var p = 0 - v;
            var o = (new Date()).getTime();
            var w = 40;
            var q = a.currX || 0;
            var r = (p - q) * (w / a.duration);
            var k = function () {
                var y = q + r;
                if ((new Date()).getTime() - o > a.duration || Math.abs(q - p) <= Math.abs((q + r) - p)) {
                    clearTimeout(t.animInterval);
                    Monocle.Styles.setX(t, p);
                    a.turning = false;
                    a.reader.dispatchEvent("monocle:turn")
                } else {
                    Monocle.Styles.setX(t, y);
                    q = y
                }
                a.currX = y
            };
            t.animInterval = setInterval(k, w)
        }
    }
    b.pageCount = a.pageCount;
    b.addPage = g;
    b.getPlace = n;
    b.moveTo = m;
    b.listenForInteraction = j;
    e();
    return b
};
Monocle.Flippers.Scroller.speed = 200;
Monocle.Flippers.Scroller.rate = 20;
Monocle.Flippers.Scroller.FORWARDS = 1;
Monocle.Flippers.Scroller.BACKWARDS = -1;
Monocle.Flippers.Scroller.DEFAULT_PANELS_CLASS = Monocle.Panels.TwoPane;
Monocle.pieceLoaded("flippers/scroller");
Monocle.Flippers.Instant = function (f) {
    var b = {
        constructor: Monocle.Flippers.Instant
    };
    var d = b.constants = b.constructor;
    var a = b.properties = {
        pageCount: 1
    };

    function e() {
        a.reader = f
    }

    function g(k) {
        k.m.dimensions = new Monocle.Dimensions.Columns(k)
    }

    function l() {
        return h().m.place
    }

    function m(k, o) {
        var n = c;
        if (typeof o == "function") {
            n = function (p) {
                c(p);
                o(p)
            }
        }
        a.reader.getBook().setOrLoadPageAt(h(), k, n)
    }

    function i(k) {
        if (typeof k != "function") {
            if (Monocle.Browser.on.Kindle3) {
                k = Monocle.Panels.eInk
            }
            k = k || d.DEFAULT_PANELS_CLASS
        }
        if (!k) {
            throw ("Panels not found.")
        }
        a.panels = new k(b, {
            end: j
        })
    }

    function h() {
        return a.reader.dom.find("page")
    }

    function j(k) {
        var n = k.properties.direction;
        m({
            page: l().pageNumber() + n
        })
    }

    function c(k) {
        h().m.dimensions.translateToLocus(k);
        Monocle.defer(function () {
            a.reader.dispatchEvent("monocle:turn")
        })
    }
    b.pageCount = a.pageCount;
    b.addPage = g;
    b.getPlace = l;
    b.moveTo = m;
    b.listenForInteraction = i;
    e();
    return b
};
Monocle.Flippers.Instant.FORWARDS = 1;
Monocle.Flippers.Instant.BACKWARDS = -1;
Monocle.Flippers.Instant.DEFAULT_PANELS_CLASS = Monocle.Panels.TwoPane;
Monocle.pieceLoaded("flippers/instant");
Monocle.pieceLoaded("monocore");