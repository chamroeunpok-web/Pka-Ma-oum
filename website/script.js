// Pka Ma'oum website interactions
document.documentElement.classList.add('js');

(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');

  // Header background on scroll
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Active link highlight
  var links = Array.prototype.slice.call(nav.querySelectorAll('a:not(.btn)'));
  var sections = links.map(function (a) { var h = a.getAttribute('href'); return h.charAt(0) === '#' && h.length > 1 ? document.querySelector(h) : null; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { if (l.getAttribute('href').charAt(0) === '#') l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });

    // Reveal animations
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { rev.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // Menu tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  function selectTab(name, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById('tab-' + t.dataset.tab).hidden = !on;
      if (on && focus) t.focus();
      if (on && t.parentNode.scrollWidth > t.parentNode.clientWidth) t.parentNode.scrollTo({ left: t.offsetLeft - (t.parentNode.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true); }
    });
  });
  document.querySelectorAll('a[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { selectTab(a.dataset.tab); });
  });

  if (tabs.length && /^#menus-(\w+)$/.test(location.hash)) { var tn = location.hash.slice(7); if (document.getElementById('tab-' + tn)) { selectTab(tn); var mn = document.getElementById('menus'); if (mn) setTimeout(function () { mn.scrollIntoView(); }, 60); } }

  // Gallery lightbox
  var lb = document.querySelector('.lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.g-item').forEach(function (b) {
      b.addEventListener('click', function () {
        lbImg.src = b.dataset.full;
        lbImg.alt = b.querySelector('img').alt;
        lb.showModal();
      });
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  // Event enquiry button presets occasion
  document.querySelectorAll('[data-occasion]').forEach(function (a) {
    a.addEventListener('click', function () { var o = document.getElementById('b-occasion'); if (o) o.value = a.dataset.occasion; });
  });

  // Booking form (front-end only: connect to a booking service or email before launch)
  var form = document.querySelector('.book-form');
  var date = document.getElementById('b-date');
  var today = new Date();
  if (form && date) {
  date.min = today.toISOString().slice(0, 10);
  var msg = form.querySelector('.form-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      var f = el.closest('.field');
      var ok = el.value.trim() !== '';
      f.classList.toggle('invalid', !ok);
      if (!ok && !bad) bad = el;
    });
    if (bad) {
      msg.className = 'form-msg err';
      msg.textContent = 'Please fill in your name, phone, date and time.';
      bad.focus();
      return;
    }
    var d = form.elements;
    msg.className = 'form-msg ok';
    msg.textContent = 'Thank you, ' + d.name.value.trim().split(' ')[0] + '. Your request for ' + d.guests.value +
      (d.guests.value === '1' ? ' guest' : ' guests') + ' on ' + d.date.value + ' at ' + d.time.value +
      ' has been received. We will confirm shortly.';
    form.reset();
  });
  }

  // Newsletter
  var nl = document.querySelector('.newsletter');
  if (nl) nl.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = nl.querySelector('input');
    var out = nl.querySelector('.nl-msg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { out.textContent = 'Please enter a valid email.'; return; }
    out.textContent = 'Thank you! We will keep you posted.';
    input.value = '';
  });

  var yr = document.getElementById('year');
  if (yr) yr.textContent = Math.max(2027, today.getFullYear());
})();

// Running video hero: muted, inline, loads only when it can play smoothly
(function () {
  var v = document.querySelector('.hero-video');
  if (!v) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  if (reduce || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return; // keep the still photo
  var tall = window.innerHeight > window.innerWidth;
  var ext = v.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm';
  v.src = (tall ? v.dataset.srcTall : v.dataset.srcWide) + ext;
  v.muted = true;
  var btn = document.querySelector('.video-toggle');
  var userPaused = false;
  v.addEventListener('playing', function () { v.classList.add('is-playing'); if (btn) btn.hidden = false; });
  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  play();
  if (btn) btn.addEventListener('click', function () {
    userPaused = !v.paused;
    if (userPaused) v.pause(); else play();
    btn.setAttribute('aria-pressed', userPaused);
    btn.querySelector('.vt-label').textContent = userPaused ? 'Play video' : 'Pause video';
  });
  // Pause while the hero is off screen to save battery
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (userPaused) return; if (e.isIntersecting) play(); else v.pause(); });
    }).observe(v);
  }
})();
