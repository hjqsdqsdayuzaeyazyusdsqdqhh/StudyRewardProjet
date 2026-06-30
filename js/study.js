(function(){'use strict';
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  const studyId = document.body.dataset.studyId || '';
  const condName = document.body.dataset.conditionName || '';
  const condSlug = document.body.dataset.condition || '';
  const stateName = document.body.dataset.state || '';
  const cityName = document.body.dataset.city || '';
  const sponsorName = document.body.dataset.sponsor || '';

  function escape(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function showToast(msg) {
    const existing = $('.study-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'study-toast';
    toast.textContent = msg;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2000);
  }

  // === Copy NCT ID ===
  function setupCopy() {
    const btns = $$('#copy-nct-btn, #sidebar-copy-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(studyId).then(() => showToast('NCT ID copied!')).catch(() => fallbackCopy());
        } else {
          fallbackCopy();
        }
      });
    });

    function fallbackCopy() {
      const ta = document.createElement('textarea');
      ta.value = studyId;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('NCT ID copied!'); } catch {}
      document.body.removeChild(ta);
    }
  }

  // === Share ===
  function setupShare() {
    const btn = $('#share-study-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const url = window.location.href;
      const title = document.title;
      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => {});
      }
    });
  }

  // === Print ===
  function setupPrint() {
    const btn = $('#print-study-btn');
    if (btn) btn.addEventListener('click', () => window.print());
  }

  // === Eligibility Collapse ===
  function setupEligibility() {
    $$('.elig-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = document.getElementById(btn.getAttribute('aria-controls'));
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        if (content) {
          content.classList.toggle('open');
          content.style.maxHeight = isOpen ? '0' : content.scrollHeight + 'px';
        }
        btn.querySelector('.elig-icon').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });
  }

  // === TOC Scroll Highlight ===
  function setupTOC() {
    const tocItems = $$('.toc-item');
    const sections = tocItems.map(a => {
      const id = a.getAttribute('href').slice(1);
      return { id, el: document.getElementById(id), link: a };
    }).filter(s => s.el);

    if (!sections.length) return;

    function updateActive() {
      const scrollPos = window.scrollY + 120;
      let active = sections[0];
      sections.forEach(s => {
        if (s.el.offsetTop <= scrollPos) active = s;
      });
      sections.forEach(s => s.link.classList.remove('active'));
      if (active) active.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    // Smooth scroll on click
    sections.forEach(s => {
      s.link.addEventListener('click', e => {
        e.preventDefault();
        s.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // === Related Studies ===
  function setupRelated() {
    const container = $('#related-studies-list');
    if (!container) return;

    const params = new URLSearchParams();
    if (condName) params.set('condition', condSlug);
    if (cityName && stateName) params.set('city', cityName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));
    if (stateName) params.set('state', stateName);
    params.set('pageSize', '6');

    if (!params.has('condition') && !params.has('city') && !params.has('state')) {
      container.innerHTML = '<p class="no-related">Related studies will appear here when condition or location data is available.</p>';
      return;
    }

    fetch('/api/studies?' + params.toString())
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const studies = (data.studies || []).filter(s => s.nctId !== studyId).slice(0, 4);
        if (!studies.length) {
          container.innerHTML = '<p class="no-related">No related studies found at this time.</p>';
          return;
        }
        container.innerHTML = '<div class="studies-grid">' + studies.map(s => {
          var nctId = s.nctId || s.id;
          return '<div class="study-card card compact">' +
            '<span class="badge badge-' + s.status.toLowerCase() + '">' + escape(s.status) + '</span>' +
            '<h3><a href="/study/' + escape(nctId) + '">' + escape(s.title) + '</a></h3>' +
            '<div class="meta"><span>' + escape(s.city || '') + (s.city && s.state ? ', ' : '') + escape(s.state || '') + '</span></div>' +
            '<div class="card-footer"><a href="/study/' + escape(nctId) + '" class="btn-link">View Details &rarr;</a></div></div>';
        }).join('') + '</div>';
      })
      .catch(() => {
        container.innerHTML = '<p class="no-related">Unable to load related studies.</p>';
      });
  }

  // === FAQ Accordion ===
  function setupFAQ() {
    const list = $('.faq-list');
    if (!list) return;
    list.addEventListener('click', e => {
      const btn = e.target.closest('.faq-question');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        const ans = item.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  }

  // === Sticky Sidebar ===
  function setupSidebar() {
    const sidebar = $('.study-sidebar');
    if (!sidebar) return;
    const parent = sidebar.closest('.container');
    if (!parent) return;

    function handleSticky() {
      const parentRect = parent.getBoundingClientRect();
      const sidebarHeight = sidebar.offsetHeight;
      const parentBottom = parentRect.top + parentRect.height;
      const viewportBottom = window.innerHeight;

      if (parentBottom < sidebarHeight + 40) {
        sidebar.style.position = 'relative';
        sidebar.style.top = 'auto';
      } else {
        sidebar.style.position = 'sticky';
        sidebar.style.top = '80px';
      }
    }

    window.addEventListener('scroll', handleSticky, { passive: true });
    window.addEventListener('resize', handleSticky);
    setTimeout(handleSticky, 100);
  }

  // === Init ===
  function init() {
    if (!studyId) return;
    setupCopy();
    setupShare();
    setupPrint();
    setupEligibility();
    setupTOC();
    setupRelated();
    setupFAQ();
    setupSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
