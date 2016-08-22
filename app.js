var evt = {
  _: {},
  on: function (e, fn) {
    this._[e] = this._[e] || [];
    this._[e].push(fn);
  },
  off: function (e, fn) {
    if (e in this._ === false) return;
    this._[e].splice(this._[e].indexOf(fn), 1);
  },
  fire: function (e /* , ...args */) {
    if (e in this._ === false) return;
    for (var i = 0; i < this._[e].length; i++)
      this._[e][i].apply(this, Array.prototype.slice.call(arguments, 1));
  }
};

function Enum() {
  var args = Array.prototype.slice.call(arguments, 0);
  for (var i = 0; i < args.length; i++)
    this[args[i]] = i+1;
}

var API = (function (Enum) {
  "use strict";

  var pub = {};
  var keys = {
    'json': 'massas.min.json'
  };
  var error = new Enum('closeParenthesis', 'startsWithNum');

  var _mass = {};
  Object.defineProperty(pub, 'mass', {
    get: function () { return _mass; },
    set: function () { throw new Error("Can't set mass from outside the API"); },
    configurable: false
  });

  // Loads mass json from request
  var loadMassJson = function (e) {
    _mass = JSON.parse(e.target.response);
  };

  // Makes request to 'massas.json'
  var getMassJson = function () {
    var req = new XMLHttpRequest();
    req.onload = loadMassJson;
    req.open('GET', keys.json);
    //req.responseType = 'json'; // NOT SUPPORTED IN CHROME :(
    req.send(null);
  };

  // Rounds a number n to p decimal places
  function _round(n, p) {
    p = Math.pow(10, p);
    return Math.round(n*p)/p;
  }

  //var _test = 'CC2Cn3CN4(O2H)10(OH(SO4)3)2';
  var reglex = /([A-Z][a-z]*|\(.+\)|\d+)/g;
  var evalParen = function (exp) {
    var e = exp.match(reglex);
    var s = 0, c, n;
    if(!isNaN(parseInt(e[0]))) throw error.startsWithNum;
    for (var i = 0; i < e.length; i++) {
      c = e[i];

      if (c[0] === '(') { // Parenthesis
        if (c[c.length-1] !== ')') throw error.closeParenthesis;

        // Get number after element
        n = parseInt(e[++i]);
        if (isNaN(n)) { n = 1; i--; }

        // Adds parenthesis mass times next number
        s += evalParen(c.slice(1, -1)) * n;
      } else { // Element
        // Get number after element
        n = parseInt(e[++i]);
        if (isNaN(n)) { n = 1; i--; }

        // Adds element mass times next number
        s += _mass[c] * n;
      }

    }
    return s;
  }
  pub.eval = function (str) {
    try {
      var r = evalParen(str);
      evt.fire('evaluated', str, r);
      return r;
    } catch (e) {
      console.error("ERROR:", e);
    }
  };

  var renderResults = function () {
    results.hidden = false;
    var mm = pub.eval(inp.formula.value.trim());

    rMass.innerHTML = mm + 'g/mol';

    var m = parseInt(inp.massa.value);
    if (inp.massa.value && !isNaN(m)) {
      rMolsWrap.hidden = false;
      var n = m / mm;
      rMols.innerHTML = _round(n, 3) + 'mol';

      // Gás
      if (inp.isgas.checked) {
        rVolWrap.hidden = false;
        rVol.innerHTML = _round(n*22.71, 3) + 'L';
      } else {
        rVolWrap.hidden = true;
      }

    } else {
      rMolsWrap.hidden = true;
    }
  };

  var calcBtnClick = function () {
    if (inp.formula.value)
      renderResults();
    else
      alert('A fórmula molecular não pode estar em branco');
  };

  // Cache DOM
  var $ = document.querySelector.bind(document);
  var inp = {
    formula: $('#formula'),
    massa: $('#massa'),
    isgas: $('#isgas')
  };
  var calcBtn = $('.calc');
  var results = $('.results');
  var rMass = $('.rmass', results);
  var rMolsWrap = $('.rmolswrap', results);
  var rMols = $('.rmols', rMolsWrap);
  var rVolWrap = $('.rvolwrap', results);
  var rVol = $('.rvol', rVolWrap);

  // Bind event listeners
  calcBtn.addEventListener('click', calcBtnClick);

  // Request 'massas.json' to load elements
  getMassJson();

  // Return the API
  return pub;

})(Enum);
