(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var emailStep = $('emailStep'), pinStep = $('pinStep');
  var emailEl = $('email'), pinEl = $('pin');
  var emailErr = $('emailErr'), pinErr = $('pinErr');
  var sendBtn = $('sendBtn'), verifyBtn = $('verifyBtn'), resendBtn = $('resendBtn');
  var current = '', timer = null;

  // where to go after signing in: only same-site paths, keep the #project
  function destination() {
    var n = new URLSearchParams(location.search).get('next') || '/';
    if (n.charAt(0) !== '/' || n.charAt(1) === '/' || n.charAt(1) === '\\') n = '/';
    return n + location.hash;
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { d.status = r.status; return d; });
    }, function () {
      return { status: 0, message: 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่' };
    });
  }

  function showErr(el, input, msg) {
    el.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function countdown(sec) {
    clearInterval(timer);
    var left = sec;
    resendBtn.disabled = true;
    var tick = function () {
      if (left <= 0) { clearInterval(timer); resendBtn.disabled = false; resendBtn.textContent = 'ส่งรหัสอีกครั้ง'; return; }
      resendBtn.textContent = 'ส่งรหัสอีกครั้งได้ใน ' + left + ' วินาที';
      left--;
    };
    tick(); timer = setInterval(tick, 1000);
  }

  function requestPin(email) {
    sendBtn.disabled = true; sendBtn.textContent = 'กำลังส่งรหัส';
    return post('/api/auth/request', { email: email }).then(function (d) {
      sendBtn.disabled = false; sendBtn.textContent = 'ส่งรหัสเข้าสู่ระบบ';
      if (d.ok) {
        current = d.email;
        try { localStorage.setItem('odp-email', d.email); } catch (e) {}
        $('sentTo').textContent = d.email;
        emailStep.hidden = true; pinStep.hidden = false;
        showErr(pinErr, pinEl, '');
        pinEl.value = ''; pinEl.focus();
        countdown(d.resendIn || 60);
        return true;
      }
      if (d.status === 429 && current === email && !pinStep.hidden) {
        countdown(d.retryAfter || 60);
        showErr(pinErr, pinEl, d.message);
        return false;
      }
      showErr(emailErr, emailEl, d.message || 'ส่งรหัสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      emailStep.hidden = false; pinStep.hidden = true;
      emailEl.focus();
      return false;
    });
  }

  emailStep.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailEl.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr(emailErr, emailEl, 'กรุณาใส่อีเมลให้ถูกต้อง'); emailEl.focus(); return; }
    showErr(emailErr, emailEl, '');
    requestPin(email);
  });

  function verify() {
    var pin = pinEl.value.replace(/\D/g, '');
    if (pin.length !== 6) { showErr(pinErr, pinEl, 'กรุณาใส่รหัส 6 หลัก'); pinEl.focus(); return; }
    verifyBtn.disabled = true; verifyBtn.textContent = 'กำลังตรวจสอบ';
    post('/api/auth/verify', { pin: pin }).then(function (d) {
      if (d.ok) { verifyBtn.textContent = 'เข้าสู่ระบบแล้ว'; location.replace(destination()); return; }
      verifyBtn.disabled = false; verifyBtn.textContent = 'เข้าสู่ระบบ';
      if (d.error === 'expired' || d.error === 'too_many') {
        clearInterval(timer); resendBtn.disabled = false; resendBtn.textContent = 'ขอรหัสใหม่';
      }
      showErr(pinErr, pinEl, d.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
      pinEl.select();
    });
  }
  pinStep.addEventListener('submit', function (e) { e.preventDefault(); verify(); });
  pinEl.addEventListener('input', function () {
    var v = pinEl.value.replace(/\D/g, '').slice(0, 6);
    if (v !== pinEl.value) pinEl.value = v;
    if (pinErr.textContent) showErr(pinErr, pinEl, '');
    if (v.length === 6 && !verifyBtn.disabled) verify();   // submits as soon as the 6th digit lands
  });

  resendBtn.addEventListener('click', function () { if (current) requestPin(current); });
  $('changeBtn').addEventListener('click', function () {
    clearInterval(timer);
    pinStep.hidden = true; emailStep.hidden = false;
    emailEl.select(); emailEl.focus();
  });

  // already signed in? go straight through
  fetch('/api/auth/me', { credentials: 'same-origin' }).then(function (r) {
    if (r.ok) location.replace(destination());
  }, function () {});

  try { var last = localStorage.getItem('odp-email'); if (last) emailEl.value = last; } catch (e) {}
  if (new URLSearchParams(location.search).get('reason') === 'revoked') {
    emailErr.textContent = 'สิทธิ์เข้าดู Demo ของอีเมลนี้ถูกยกเลิกแล้ว กรุณาติดต่อผู้ดูแลพอร์ทัล';
  }
  emailEl.focus();
})();
