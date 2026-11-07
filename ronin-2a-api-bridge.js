/* App #2A GitHub Pages test-only bridge for the two existing lookup calls. */
(function () {
  'use strict';
  var requests = 0;
  function lookup(method, regId, success, failure) {
    var api = String(window.RONIN_APP2A_API_URL || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(api)) {
      failure(new Error('The separate App #2A test API URL has not been configured.'));
      return;
    }
    var id = String(regId || '').trim().toUpperCase();
    if (!/^REG-\d{4,}$/.test(id)) { success({success:false}); return; }
    var callbackName = '__ronin2a_cb_' + (++requests) + '_' + Math.random().toString(36).slice(2);
    var script = document.createElement('script');
    var complete = false;
    var timeout = null;
    function clear() {
      if (timeout !== null) clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    function finish(err, response) {
      if (complete) return;
      complete = true;
      clear();
      if (err) failure(err);
      else if (!response || response.ok !== true) failure(new Error(response && response.error ? response.error : 'Lookup unavailable.'));
      else success(response.result || {success:false});
    }
    window[callbackName] = function (response) { finish(null, response); };
    script.onerror = function () { finish(new Error('The registration lookup service could not be reached.')); };
    timeout = setTimeout(function () { finish(new Error('The registration lookup request timed out.')); }, 20000);
    var separator = api.indexOf('?') >= 0 ? '&' : '?';
    script.src = api + separator + 'method=' + encodeURIComponent(method) + '&registrationId=' + encodeURIComponent(id) + '&callback=' + encodeURIComponent(callbackName);
    document.head.appendChild(script);
  }
  // Preserve the existing google.script.run success/failure chaining without changing UI code.
  function Run(success, failure) {
    this.success = success || function () {};
    this.failure = failure || function () {};
  }
  Run.prototype.withSuccessHandler = function (fn) { return new Run(fn, this.failure); };
  Run.prototype.withFailureHandler = function (fn) { return new Run(this.success, fn); };
  Run.prototype.getRegistration = function (id) { lookup('getRegistration', id, this.success, this.failure); };
  Run.prototype.getMyEntries = function (id) { lookup('getMyEntries', id, this.success, this.failure); };
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = new Run();
})();
