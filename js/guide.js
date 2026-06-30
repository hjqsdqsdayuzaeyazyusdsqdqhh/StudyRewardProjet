(function(){'use strict';
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  // ===== Reading Progress Bar =====
  function setupProgressBar() {
    const bar = $('#guide-progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight * 100, 100) : 0;
      bar.style.width = progress + '%';
      bar.setAttribute('aria-valuenow', Math.round(progress));
    }, { passive: true });
  }

  // ===== TOC Scroll Highlight =====
  function setupTOC() {
    const tocItems = $$('.toc-item');
    const sections = tocItems.map(function(a) {
      var id = a.getAttribute('href').slice(1);
      return { id: id, el: document.getElementById(id), link: a };
    }).filter(function(s) { return s.el; });

    if (!sections.length) return;

    function updateActive() {
      var scrollPos = window.scrollY + 130;
      var active = sections[0];
      sections.forEach(function(s) {
        if (s.el.offsetTop <= scrollPos) active = s;
      });
      sections.forEach(function(s) { s.link.classList.remove('active'); });
      if (active) active.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    sections.forEach(function(s) {
      s.link.addEventListener('click', function(e) {
        e.preventDefault();
        s.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ===== Copy Link =====
  function setupCopyLink() {
    const btn = $('#copy-guide-link');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(function() {
          showToast('Link copied to clipboard!');
        }).catch(function() {});
      }
    });
  }

  // ===== Share =====
  function setupShare() {
    const btn = $('#share-guide-btn');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href }).catch(function() {});
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(window.location.href).then(function() {
            showToast('Link copied to clipboard!');
          }).catch(function() {});
        }
      }
    });
  }

  // ===== Print =====
  function setupPrint() {
    const btn = $('#print-guide-btn');
    if (btn) btn.addEventListener('click', function() { window.print(); });
  }

  // ===== Toast =====
  function showToast(msg) {
    var existing = $('.study-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'study-toast';
    toast.textContent = msg;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  // ===== FAQ Accordion =====
  function setupFAQ() {
    var list = $('.faq-list');
    if (!list) return;
    list.addEventListener('click', function(e) {
      var btn = e.target.closest('.faq-question');
      if (!btn) return;
      var item = btn.closest('.faq-item');
      if (!item) return;
      var isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(function(i) {
        i.classList.remove('open');
        var a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        var ans = item.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  }

  // ===== Init =====
  function init() {
    setupProgressBar();
    setupTOC();
    setupCopyLink();
    setupShare();
    setupPrint();
    setupFAQ();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
