(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var S = { me: '', superAdmins: [], users: [], projects: [], groups: [], q: '' };
  var newPicks = { all: false, ids: {} };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function when(ts) {
    if (!ts) return 'ยังไม่เคยเข้าสู่ระบบ';
    try {
      return 'เข้าล่าสุด ' + new Date(ts * 1000).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }
  function toast(msg, bad) {
    var t = $('toast');
    t.textContent = msg; t.style.background = bad ? '#8f1d14' : '';
    t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, bad ? 3500 : 1600);
  }
  function api(method, url, body) {
    return fetch(url, {
      method: method, credentials: 'same-origin', cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) { location.replace('/login.html?next=/admin.html'); throw new Error('signed_out'); }
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.message || 'บันทึกไม่สำเร็จ'); e.data = d; throw e; }
        return d;
      });
    });
  }
  function sw(checked, attrs, label) {
    return '<button type="button" class="switch" role="switch" aria-checked="' + !!checked + '" aria-label="' + esc(label) + '" ' + (attrs || '') + '></button>';
  }

  /* ---------- add form ---------- */
  function renderPicks() {
    var html = '<button type="button" class="chip all" data-pick="*" aria-pressed="' + newPicks.all + '">ทุกโครงการ</button>';
    S.projects.forEach(function (p) {
      html += '<button type="button" class="chip" data-pick="' + esc(p.id) + '" aria-pressed="' + (newPicks.all || !!newPicks.ids[p.id]) + '"' +
        (newPicks.all ? ' disabled' : '') + '>' + esc(p.name) + '</button>';
    });
    $('newProjects').innerHTML = html;
  }
  $('newProjects').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (!b || b.disabled) return;
    var id = b.getAttribute('data-pick');
    if (id === '*') newPicks.all = !newPicks.all; else newPicks.ids[id] = !newPicks.ids[id];
    renderPicks();
  });

  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var key = $('newKey').value.trim().toLowerCase();
    var err = $('addErr');
    $('newKey').setAttribute('aria-invalid', 'false'); err.textContent = '';
    if (!key) { err.textContent = 'กรุณาใส่อีเมล หรือ @โดเมน'; $('newKey').setAttribute('aria-invalid', 'true'); $('newKey').focus(); return; }
    var ids = Object.keys(newPicks.ids).filter(function (k) { return newPicks.ids[k]; });
    if (!newPicks.all && !ids.length) { err.textContent = 'เลือก Demo ที่ให้ดูอย่างน้อย 1 โครงการ'; return; }
    var btn = $('addBtn'); btn.disabled = true;
    api('POST', '/api/admin/users', { create: true, key: key, name: $('newName').value, enabled: true, all: newPicks.all, projects: ids })
      .then(function (d) {
        S.users.unshift(Object.assign({ lastLogin: null }, d.user));
        $('newKey').value = ''; $('newName').value = '';
        newPicks = { all: false, ids: {} }; renderPicks(); renderGrid();
        toast('เพิ่ม ' + d.user.key + ' แล้ว');
        $('newKey').focus();
      })
      .catch(function (x) { if (x.message !== 'signed_out') { err.textContent = x.message; $('newKey').setAttribute('aria-invalid', 'true'); } })
      .finally(function () { btn.disabled = false; });
  });

  /* ---------- users × demos grid ---------- */
  function renderGrid() {
    var head = '<tr><th scope="col">ผู้ชม</th><th scope="col">ใช้งาน</th><th scope="col" class="sep">ทุกโครงการ</th>';
    S.projects.forEach(function (p) { head += '<th scope="col" class="proj">' + esc(p.name) + '</th>'; });
    head += '<th scope="col" class="sep"><span class="sr">ลบ</span></th></tr>';
    $('gridHead').innerHTML = head;

    var q = S.q.toLowerCase();
    var match = function (k, n) { return !q || (k + ' ' + (n || '')).toLowerCase().indexOf(q) > -1; };
    var rows = '';

    S.superAdmins.forEach(function (a) {
      if (!match(a.key)) return;
      rows += '<tr class="super"><td><div class="who-mail">' + esc(a.key) + '<span class="badge super">Super Admin</span></div>' +
        '<div class="who-sub">' + (a.key === S.me ? 'คุณ · ' : '') + esc(when(a.lastLogin)) + '</div></td>' +
        '<td>' + sw(true, 'disabled', 'ใช้งาน') + '</td><td class="sep">' + sw(true, 'disabled', 'ทุกโครงการ') + '</td>';
      S.projects.forEach(function (p) { rows += '<td>' + sw(true, 'disabled', p.name) + '</td>'; });
      rows += '<td class="sep"></td></tr>';
    });

    var shown = 0;
    S.users.forEach(function (u) {
      if (!match(u.key, u.name)) return;
      shown++;
      var isDomain = u.key.charAt(0) === '@';
      var on = u.enabled !== false;
      var ids = u.projects || [];
      var k = esc(u.key);
      rows += '<tr class="' + (on ? '' : 'off') + '" data-key="' + k + '"><td>' +
        '<div class="who-mail">' + k +
          (isDomain ? '<span class="badge domain">ทุกคนในโดเมน</span>' : '') +
          (on ? '' : '<span class="badge paused">ระงับอยู่</span>') + '</div>' +
        '<div class="who-sub">' + (u.name ? esc(u.name) + ' · ' : '') + (isDomain ? 'สิทธิ์ใช้กับทุกอีเมลในโดเมนนี้' : esc(when(u.lastLogin))) + '</div></td>' +
        '<td>' + sw(on, 'data-f="enabled"', 'ใช้งาน ' + u.key) + '</td>' +
        '<td class="sep">' + sw(u.all, 'data-f="all"', 'ทุกโครงการ ' + u.key) + '</td>';
      S.projects.forEach(function (p) {
        rows += '<td>' + sw(u.all || ids.indexOf(p.id) > -1, 'data-p="' + esc(p.id) + '"' + (u.all ? ' disabled' : ''), p.name + ' ' + u.key) + '</td>';
      });
      rows += '<td class="sep"><button type="button" class="del" data-del>ลบ</button></td></tr>';
    });

    if (!S.users.length) {
      rows += '<tr class="empty-row"><td colspan="' + (S.projects.length + 4) + '">ยังไม่มีผู้ชม เพิ่มอีเมลแรกได้จากฟอร์มด้านบน</td></tr>';
    } else if (!shown && q) {
      rows += '<tr class="empty-row"><td colspan="' + (S.projects.length + 4) + '">ไม่พบผู้ชมที่ตรงกับ “' + esc(S.q) + '”</td></tr>';
    }
    $('gridBody').innerHTML = rows;
    $('userCount').textContent = S.users.length + S.superAdmins.length;
  }

  function findUser(key) { for (var i = 0; i < S.users.length; i++) if (S.users[i].key === key) return S.users[i]; return null; }

  $('gridBody').addEventListener('click', function (e) {
    var row = e.target.closest('tr[data-key]'); if (!row) return;
    var u = findUser(row.getAttribute('data-key')); if (!u) return;

    if (e.target.closest('[data-del]')) {
      if (!confirm('ลบ ' + u.key + ' ออกจากผู้มีสิทธิ์เข้าดู?\nคนนี้จะเข้าพอร์ทัลไม่ได้อีก (ถ้า login ค้างอยู่ จะถูกตัดออกเมื่อโหลดหน้าครั้งถัดไป)')) return;
      api('DELETE', '/api/admin/users', { key: u.key }).then(function () {
        S.users = S.users.filter(function (x) { return x.key !== u.key; });
        renderGrid(); toast('ลบ ' + u.key + ' แล้ว');
      }).catch(function (x) { if (x.message !== 'signed_out') toast(x.message, true); });
      return;
    }

    var b = e.target.closest('.switch'); if (!b || b.disabled) return;
    var before = { enabled: u.enabled !== false, all: !!u.all, projects: (u.projects || []).slice() };
    var patch = { key: u.key };
    var f = b.getAttribute('data-f'), pid = b.getAttribute('data-p');
    if (f === 'enabled') { u.enabled = patch.enabled = !before.enabled; }
    else if (f === 'all') { u.all = patch.all = !before.all; }
    else if (pid) {
      var has = before.projects.indexOf(pid) > -1;
      u.projects = has ? before.projects.filter(function (x) { return x !== pid; }) : before.projects.concat(pid);
      patch.projects = u.projects;
    }
    renderGrid();
    api('POST', '/api/admin/users', patch).then(function (d) {
      Object.assign(u, d.user); toast('บันทึกแล้ว');
    }).catch(function (x) {
      u.enabled = before.enabled; u.all = before.all; u.projects = before.projects; renderGrid();
      if (x.message !== 'signed_out') toast(x.message, true);
    });
  });

  $('userQ').addEventListener('input', function () { S.q = this.value.trim(); renderGrid(); });

  /* ---------- project on/off ---------- */
  function renderProjects() {
    var groupName = {}; S.groups.forEach(function (g) { groupName[g.id] = g.name; });
    $('projList').innerHTML = S.projects.map(function (p) {
      return '<li data-id="' + esc(p.id) + '"><div><div class="pn">' + esc(p.name) + '</div><div class="pg">' + esc(groupName[p.group] || '') + '</div></div>' +
        '<div class="state"><span>' + (p.off ? 'ซ่อนจากผู้ชมทุกคน' : 'แสดงให้ผู้ที่มีสิทธิ์') + '</span>' +
        sw(!p.off, '', 'แสดง ' + p.name) + '</div></li>';
    }).join('');
  }
  $('projList').addEventListener('click', function (e) {
    var b = e.target.closest('.switch'); if (!b) return;
    var li = b.closest('li'); var id = li.getAttribute('data-id');
    var p = S.projects.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var was = p.off; p.off = !was; renderProjects();
    api('POST', '/api/admin/projects', { id: id, off: p.off }).then(function () {
      toast(p.off ? 'ซ่อน ' + p.name + ' แล้ว' : 'แสดง ' + p.name + ' แล้ว');
    }).catch(function (x) { p.off = was; renderProjects(); if (x.message !== 'signed_out') toast(x.message, true); });
  });

  /* ---------- account ---------- */
  $('logoutBtn').addEventListener('click', function () {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(function () { location.replace('/login.html'); });
  });

  /* ---------- start ---------- */
  api('GET', '/api/admin/state').then(function (d) {
    S.me = d.me; S.superAdmins = d.superAdmins || []; S.users = d.users || [];
    S.projects = d.projects || []; S.groups = d.groups || [];
    $('who').textContent = d.me;
    renderPicks(); renderGrid(); renderProjects();
  }).catch(function (x) {
    if (x.message === 'signed_out') return;
    if (x.data && x.data.error === 'forbidden') { location.replace('/'); return; }
    var b = $('banner'); b.hidden = false; b.textContent = x.message;
    document.querySelectorAll('.panel').forEach(function (p) { p.hidden = true; });
  });
})();
