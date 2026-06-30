(function(){'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  const stateName = document.body.dataset.state || '';
  const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const container = $('#state-studies-list');
  const paginationEl = $('#state-pagination');
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
        (s.city ? '<span>' + escape(s.city) + ', ' + escape(s.state) + '</span>' : '') +
        '<span>' + escape(s.sponsor) + '</span>' +
        '<span>' + escape(s.phase) + '</span>' +
      '</div>' +
      '<p>' + escape((s.summary || '').slice(0, 200)) + '</p>' +
      '<div class="card-footer">' +
        '<a href="https://clinicaltrials.gov/study/' + escape(s.id) + '" class="btn-link" target="_blank" rel="noopener">View Details on ClinicalTrials.gov &rarr;</a>' +
      '</div></div>';
  }

  function renderPagination(current, total) {
    const pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) return '';
    let html = '<div class="pagination">';
    html += '<a href="#" data-page="' + (current - 1) + '" class="' + (current <= 1 ? 'disabled' : '') + '">&laquo; Prev</a>';
    for (let i = 1; i <= pages; i++) {
      if (i === current) {
        html += '<span class="active">' + i + '</span>';
      } else if (i === 1 || i === pages || Math.abs(i - current) <= 2) {
        html += '<a href="#" data-page="' + i + '">' + i + '</a>';
      } else if (Math.abs(i - current) === 3) {
        html += '<span class="dots">...</span>';
      }
    }
    html += '<a href="#" data-page="' + (current + 1) + '" class="' + (current >= pages ? 'disabled' : '') + '">Next &raquo;</a>';
    html += '</div>';
    return html;
  }

  function doRender() {
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = allStudies.slice(start, start + PER_PAGE);

    if (!pageItems.length) {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>No studies found</h3><p>Check back later for new clinical trials in ' + escape(stateName) + '.</p></div>';
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
            const el = $('#state-studies-section');
            if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
          }
        });
      });
    }

    const countEl = $('#state-results-count');
    if (countEl) countEl.textContent = allStudies.length + ' clinical trial' + (allStudies.length !== 1 ? 's' : '') + ' found';
  }

  function loadStateStudies() {
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading studies...</div>';

    const api = '/api/studies?state=' + encodeURIComponent(stateSlug) + '&pageSize=50';

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

  loadStateStudies();
})();
