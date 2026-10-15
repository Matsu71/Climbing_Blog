// CRUX: small enhancements. Every page works without this file.
(function () {
  'use strict';

  var norm = function (s) { return String(s || '').normalize('NFKC').toLowerCase().trim(); };

  // Table filters: <form data-filter-for="table-id"> with a search box and optional selects.
  document.querySelectorAll('form[data-filter-for]').forEach(function (form) {
    var id = form.getAttribute('data-filter-for');
    var table = document.getElementById(id);
    var count = document.querySelector('[data-count-for="' + id + '"]');
    if (!table) return;
    var rows = Array.prototype.slice.call(table.tBodies[0].rows);
    var apply = function () {
      var q = norm(form.elements.q && form.elements.q.value);
      var selects = Array.prototype.filter.call(form.elements, function (el) { return el.tagName === 'SELECT'; });
      var shown = 0;
      rows.forEach(function (row) {
        var ok = !q || norm(row.getAttribute('data-q')).indexOf(q) !== -1;
        selects.forEach(function (sel) {
          if (ok && sel.value) ok = row.getAttribute('data-' + sel.name) === sel.value;
        });
        row.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = rows.length + '件中 ' + shown + '件を表示';
    };
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    apply();
  });

  // Chart tooltips. Marks carry data-tip. Dense areas ([data-nearest]) pick the closest mark.
  var tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('role', 'status');
  tip.hidden = true;
  document.body.appendChild(tip);
  var hot = null;
  var show = function (mark, x, y) {
    if (hot && hot !== mark) hot.classList.remove('is-hot');
    hot = mark;
    mark.classList.add('is-hot');
    tip.textContent = mark.getAttribute('data-tip');
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 12));
    var top = y - h - 12 < 8 ? y + 16 : y - h - 12;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  };
  var hide = function () {
    tip.hidden = true;
    if (hot) hot.classList.remove('is-hot');
    hot = null;
  };
  document.querySelectorAll('.chart').forEach(function (chart) {
    chart.addEventListener('pointermove', function (ev) {
      var area = ev.target.closest('[data-nearest]');
      if (area) {
        var best = null, bestD = 24 * 24;
        area.querySelectorAll('[data-tip]').forEach(function (m) {
          var r = m.getBoundingClientRect();
          var dx = r.left + r.width / 2 - ev.clientX, dy = r.top + r.height / 2 - ev.clientY;
          var d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = m; }
        });
        if (best) return show(best, ev.clientX, ev.clientY);
        return hide();
      }
      var mark = ev.target.closest('[data-tip]');
      if (mark) show(mark, ev.clientX, ev.clientY);
      else hide();
    });
    chart.addEventListener('pointerleave', hide);
  });
  window.addEventListener('scroll', hide, { passive: true });
})();
