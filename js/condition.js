(function(){'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  const condSlug = document.body.dataset.condition || '';
  const condName = document.body.dataset.conditionName || '';
  const container = $('#condition-studies-list');
  const paginationEl = $('#condition-pagination');
  if (!container) return;

  let currentPage = 1;
  let allStudies = [];
  const PER_PAGE = 12;

  function escape(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function renderStudyCard(s) {
    return '<div class="study-card card" data-id="' + escape(s.id) + '">' +
      '<div class="sc-top">' +
        '<span class="badge badge-' + s.status.toLowerCase() + '">' + escape(s.status) + '</span>' +
      '</div>' +
      '<h3>' + escape(s.title) + '</h3>' +
      '<div class="meta">' +
        (s.city && s.state ? '<span>' + escape(s.city) + ', ' + escape(s.state) + '</span>' : '') +
        '<span>' + escape(s.sponsor) + '</span>' +
        '<span>' + escape(s.phase) + '</span>' +
      '</div>' +
      '<p>' + escape((s.summary || '').slice(0, 200)) + '</p>' +
      '<div class="card-footer">' +
        '<a href="https://clinicaltrials.gov/study/' + escape(s.id) + '" class="btn-link" target="_blank" rel="noopener">View Details on ClinicalTrials.gov &rarr;</a>' +
      '</div></div>';
  }

  function renderSkeleton() {
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += '<div class="study-card card skeleton"><div class="sc-top"><span class="badge skeleton-box" style="width:80px">&nbsp;</span></div><div class="skeleton-box" style="height:20px;width:80%;margin:8px 0"></div><div class="skeleton-box" style="height:14px;width:60%;margin:4px 0"></div><div class="skeleton-box" style="height:14px;width:45%;margin:4px 0"></div><div class="card-footer"><span class="skeleton-box" style="height:16px;width:120px;display:inline-block"></span></div></div>';
    }
    return html;
  }

  function renderPagination(current, total) {
    const pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) return '';
    let html = '<div class="pagination">';
    html += '<a href="#" data-page="' + (current - 1) + '" class="' + (current <= 1 ? 'disabled' : '') + '">&laquo; Prev</a>';
    for (let i = 1; i <= pages; i++) {
      if (i === current) html += '<span class="active">' + i + '</span>';
      else if (i === 1 || i === pages || Math.abs(i - current) <= 2) html += '<a href="#" data-page="' + i + '">' + i + '</a>';
      else if (Math.abs(i - current) === 3) html += '<span class="dots">...</span>';
    }
    html += '<a href="#" data-page="' + (current + 1) + '" class="' + (current >= pages ? 'disabled' : '') + '">Next &raquo;</a>';
    html += '</div>';
    return html;
  }

  function doRender() {
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = allStudies.slice(start, start + PER_PAGE);

    if (!pageItems.length) {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>No studies found</h3><p>Check back later for new clinical trials for ' + escape(condName) + '.</p></div>';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    container.innerHTML = pageItems.map(renderStudyCard).join('');
    if (paginationEl) {
      paginationEl.innerHTML = renderPagination(currentPage, allStudies.length);
      paginationEl.querySelectorAll('a:not(.disabled)').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const page = parseInt(a.dataset.page);
          if (page >= 1 && page <= Math.ceil(allStudies.length / PER_PAGE)) {
            currentPage = page;
            doRender();
            const el = $('#condition-studies-section');
            if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
          }
        });
      });
    }

    const countEl = $('#condition-results-count');
    if (countEl) countEl.textContent = allStudies.length + ' clinical trial' + (allStudies.length !== 1 ? 's' : '') + ' found';
  }

  function loadConditionStudies() {
    container.innerHTML = renderSkeleton();

    const api = '/api/studies?condition=' + encodeURIComponent(condSlug) + '&pageSize=50';

    fetch(api)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        allStudies = data.studies || [];
        currentPage = 1;
        doRender();
      })
      .catch(() => {
        container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load studies</h3><p>The clinical trial data service is temporarily unavailable. Please try again later.</p></div>';
        if (paginationEl) paginationEl.innerHTML = '';
      });
  }

  loadConditionStudies();

  // FAQ accordion
  const faqList = $('.faq-list');
  if (faqList) {
    faqList.addEventListener('click', e => {
      const btn = e.target.closest('.faq-question');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      faqList.querySelectorAll('.faq-item.open').forEach(i => {
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
})();
