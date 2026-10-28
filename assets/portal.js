(function () {
  'use strict';

  var GROUPS = window.GROUPS || [];
  var PROJECTS = window.PROJECTS || [];

  var STATUS = {
    live:  'ใช้งานจริง',
    demo:  'มี Demo ให้ทดลอง',
    proto: 'ต้นแบบ UI',
    soon:  'กำลังเตรียม Demo'
  };
  var FILTERS = [
    { id: 'all',   label: 'ทั้งหมด' },
    { id: 'ready', label: 'มี Demo' },
    { id: 'live',  label: 'ใช้งานจริง' },
    { id: 'proto', label: 'ต้นแบบ' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('list'), stageEl = $('stage'), qEl = $('q'), countEl = $('count'), filtersEl = $('filters');

  var state = { q: '', filter: 'all', current: null };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function byId(id) { for (var i = 0; i < PROJECTS.length; i++) if (PROJECTS[i].id === id) return PROJECTS[i]; return null; }
  function absUrl(u) { try { return new URL(u, location.href).href; } catch (e) { return u; } }

  /* ---------- filtering ---------- */
  function matches(p) {
    if (state.filter === 'ready' && !p.url) return false;
    if (state.filter === 'live' && p.status !== 'live') return false;
    if (state.filter === 'proto' && p.status !== 'proto') return false;
    if (!state.q) return true;
    var hay = [p.name, p.summary, p.owner].concat(p.tags || []).join(' ').toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function visible() { return PROJECTS.filter(matches); }

  /* ---------- index ---------- */
  function renderFilters() {
    filtersEl.innerHTML = FILTERS.map(function (f) {
      return '<button type="button" data-f="' + f.id + '" aria-pressed="' + (state.filter === f.id) + '">' + f.label + '</button>';
    }).join('');
  }

  function renderList() {
    var vis = visible();
    if (!vis.length) {
      listEl.innerHTML = '<div class="none">ไม่พบโครงการที่ตรงกับ “' + esc(state.q) + '”<br>' +
        '<button type="button" data-clear>ล้างการค้นหา</button></div>';
      countEl.textContent = '';
      return;
    }
    var html = '';
    GROUPS.forEach(function (g) {
      var items = vis.filter(function (p) { return p.group === g.id; });
      if (!items.length) return;
      html += '<section class="group"><h2><span>' + esc(g.name) + '</span><span>' + items.length + '</span></h2><ul>';
      items.forEach(function (p) {
        html += '<li><button type="button" class="item" data-id="' + esc(p.id) + '"' +
          (state.current === p.id ? ' aria-current="true"' : '') + '>' +
          '<span class="dot ' + esc(p.status) + '" title="' + esc(STATUS[p.status] || '') + '"></span>' +
          '<span class="nm">' + esc(p.name) + '</span>' +
          '<span class="ow">' + esc(p.owner || STATUS[p.status] || '') + '</span>' +
          '</button></li>';
      });
      html += '</ul></section>';
    });
    listEl.innerHTML = html;
    var ready = vis.filter(function (p) { return p.url; }).length;
    countEl.textContent = 'แสดง ' + vis.length + ' จาก ' + PROJECTS.length + ' โครงการ ในจำนวนนี้เปิด Demo ได้ ' + ready + ' โครงการ';
  }

  /* ---------- stage ---------- */
  function renderStage() {
    var p = byId(state.current);
    if (!p) { stageEl.innerHTML = ''; return; }

    var actions = '';
    if (p.url && p.embed) {
      actions += '<button type="button" class="btn" data-act="fullscreen">' + icon('full') + 'เต็มจอ</button>';
    }
    if (p.url) {
      actions += '<a class="btn' + (p.embed ? '' : ' primary') + '" href="' + esc(absUrl(p.url)) + '" target="_blank" rel="noopener">' + icon('ext') + 'เปิดในแท็บใหม่</a>';
    }
    if (p.deck) {
      actions += '<a class="btn" href="' + esc(p.deck) + '" target="_blank" rel="noopener">' + icon('doc') + 'สไลด์ประกอบ</a>';
    }
    actions += '<button type="button" class="btn" data-act="copy">' + icon('link') + 'คัดลอกลิงก์</button>';

    var meta = '';
    if (p.owner) meta += '<span>หน่วยงาน <b>' + esc(p.owner) + '</b></span>';
    if (p.tags && p.tags.length) meta += '<span>' + p.tags.map(esc).join(', ') + '</span>';

    var body;
    if (p.url && p.embed) {
      body = '<div class="loading" id="loading">กำลังเปิด Demo</div>' +
        '<iframe id="frame" src="' + esc(p.url) + '" title="Demo: ' + esc(p.name) + '" allow="microphone; camera; fullscreen; clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    } else if (p.url) {
      body = '<div class="placard"><h3>ระบบนี้เปิดในแท็บใหม่</h3>' +
        '<p>เว็บไซต์ของระบบนี้ไม่อนุญาตให้แสดงซ้อนในหน้าอื่น กดปุ่มด้านล่างเพื่อเปิดระบบจริงในแท็บใหม่</p>' +
        '<p class="url">' + esc(absUrl(p.url)) + '</p>' +
        '<a class="btn primary" href="' + esc(absUrl(p.url)) + '" target="_blank" rel="noopener">' + icon('ext') + 'เปิด ' + esc(p.name) + '</a></div>';
    } else {
      body = '<div class="placard"><h3>ยังไม่มีลิงก์ Demo</h3>' +
        '<p>เมื่อ Demo พร้อม ให้ใส่ลิงก์ในช่อง <code>url</code> ของโครงการ <code>' + esc(p.id) + '</code> ในไฟล์ <code>projects.js</code> แล้ว push ขึ้น GitHub ระบบจะแสดง Demo ที่นี่อัตโนมัติ</p></div>';
    }

    stageEl.innerHTML =
      '<button type="button" class="back" data-act="back">' + icon('back') + 'รายการโครงการ</button>' +
      '<div class="stage-head"><div>' +
        '<div class="status-line"><span class="dot ' + esc(p.status) + '" style="width:10px;height:10px;border-radius:50%;display:inline-block"></span>' + esc(STATUS[p.status] || '') + '</div>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="summary">' + esc(p.summary) + '</p>' +
        (meta ? '<div class="meta">' + meta + '</div>' : '') +
      '</div><div class="actions">' + actions + '</div></div>' +
      '<div class="mat" id="mat">' + body + '</div>';

    var frame = $('frame');
    if (frame) frame.addEventListener('load', function () { var l = $('loading'); if (l) l.remove(); });

    document.title = p.name + ' · OneSpace Demo Portal';
    updatePresentPos();
  }

  function icon(n) {
    var d = {
      full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
      ext:  '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
      doc:  '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
      back: '<path d="m15 6-6 6 6 6"/>'
    }[n];
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  /* ---------- navigation ---------- */
  function select(id, opts) {
    if (!byId(id)) return;
    state.current = id;
    if (!(opts && opts.noHash) && location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    renderList();
    renderStage();
    document.body.classList.add('viewing');
    if (opts && opts.focus) stageEl.focus({ preventScroll: true });
  }

  // presenter order follows the on-screen grouping; if the current project is
  // hidden by a search/filter, step through every project instead
  function ordered() {
    var vis = visible();
    var pool = vis.some(function (p) { return p.id === state.current; }) ? vis : PROJECTS;
    var out = [];
    GROUPS.forEach(function (g) { pool.forEach(function (p) { if (p.group === g.id) out.push(p); }); });
    return out;
  }

  function step(dir) {
    var list = ordered();
    if (!list.length) return;
    var i = list.findIndex(function (p) { return p.id === state.current; });
    select(list[(i + dir + list.length) % list.length].id);
  }

  function updatePresentPos() {
    var list = ordered();
    var i = list.findIndex(function (p) { return p.id === state.current; });
    $('presentPos').textContent = i > -1 ? (i + 1) + ' / ' + list.length : '';
  }

  function setPresent(on) {
    document.body.classList.toggle('present', on);
    $('presentBtn').setAttribute('aria-pressed', String(on));
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  function copyLink() {
    var url = location.href.split('#')[0] + '#' + state.current;
    var done = function () { toast('คัดลอกลิงก์แล้ว'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
    } else { fallbackCopy(url); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------- events ---------- */
  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-f]');
    if (!b) return;
    state.filter = b.getAttribute('data-f');
    renderFilters(); renderList(); updatePresentPos();
  });

  listEl.addEventListener('click', function (e) {
    var item = e.target.closest('.item');
    if (item) { select(item.getAttribute('data-id'), { focus: true }); return; }
    if (e.target.closest('[data-clear]')) { qEl.value = ''; state.q = ''; renderList(); qEl.focus(); }
  });

  stageEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'copy') copyLink();
    if (act === 'back') { document.body.classList.remove('viewing'); window.scrollTo(0, 0); }
    if (act === 'fullscreen') {
      var m = $('mat');
      if (m && m.requestFullscreen) m.requestFullscreen().catch(function () { setPresent(true); });
      else setPresent(true);
    }
  });

  var qTimer;
  qEl.addEventListener('input', function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = qEl.value.trim(); renderList(); updatePresentPos(); }, 80);
  });
  qEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var v = visible(); if (v.length) select(v[0].id, { focus: true }); }
    if (e.key === 'Escape') { qEl.value = ''; state.q = ''; renderList(); qEl.blur(); }
  });

  $('presentBtn').addEventListener('click', function () { setPresent(!document.body.classList.contains('present')); });
  $('exitPresent').addEventListener('click', function () { setPresent(false); });
  $('prevBtn').addEventListener('click', function () { step(-1); });
  $('nextBtn').addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); setPresent(false); qEl.focus(); }
    else if (e.key === 'p' || e.key === 'P') setPresent(!document.body.classList.contains('present'));
    else if (e.key === 'Escape' && document.body.classList.contains('present')) setPresent(false);
    else if (e.key === ']' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === '[' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });

  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    if (id && id !== state.current) select(id, { noHash: true });
  });

  /* ---------- start ---------- */
  renderFilters();
  var start = location.hash.slice(1);
  if (!byId(start)) {
    var firstEmbed = PROJECTS.filter(function (p) { return p.url && p.embed; })[0];
    start = (firstEmbed || PROJECTS[0] || {}).id;
  }
  if (start) {
    select(start, { noHash: !location.hash });
    // on phones, open on the list unless a project was linked directly
    if (!location.hash) document.body.classList.remove('viewing');
  } else {
    renderList();
  }
})();
