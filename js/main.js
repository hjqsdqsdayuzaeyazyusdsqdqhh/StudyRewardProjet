document.addEventListener('DOMContentLoaded', () => {

  // ===== Shared Utilities =====
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  // ===== Mobile Navigation =====
  const mobileToggle = $('.mobile-toggle');
  const mobileNav = $('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header') && mobileNav.classList.contains('open')) {
        mobileToggle.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ===== Sticky Header =====
  const header = $('.header');
  if (header) {
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
  }

  // ===== Back to Top =====
  const backToTop = $('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 400), { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ===== FAQ Accordion =====
  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (btn && answer) {
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-answer').style.maxHeight = '0';
        });
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });

  // ===== Newsletter Form =====
  const newsletterForm = $('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      if (input && input.value.trim()) {
        const btn = newsletterForm.querySelector('button');
        const orig = btn.textContent;
        btn.textContent = 'Subscribed!';
        input.value = '';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  }

  // ===== Contact Form =====
  const contactForm = $('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Message Sent!';
      contactForm.reset();
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }

  // ===== Hero Search =====
  const heroSearch = $('.hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'clinical-trials.html?q=' + encodeURIComponent(heroSearch.querySelector('input').value);
    });
  }

  // ===== Page Router =====
  const page = document.body.dataset.page;
  const loaders = {
    home: loadHome,
    'clinical-trials': loadClinicalTrials,
    states: loadStates,
    cities: loadCities,
    guides: loadGuides
  };
  if (loaders[page]) loaders[page]();

  // ===== Fetch helper =====
  function fetchJSON(url) {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // ===== Renderers =====
  function renderStudyCard(s) {
    return `
      <div class="study-card card">
        <span class="badge badge-recruiting">${s.status}</span>
        <h3>${escape(s.title)}</h3>
        <div class="meta">
          <span>${s.city}, ${s.state}</span>
          <span>${s.sponsor}</span>
          <span>${s.phase}</span>
        </div>
        <p>${escape(s.description)}</p>
        <div class="card-footer">
          <span class="reward">${s.reward}</span>
          <a href="clinical-trials.html?study=${s.id}" class="btn-link">View Details</a>
        </div>
      </div>`;
  }

  function renderStateCard(s) {
    return `<div class="state-card"><span class="state-name">${s.name} (${s.abbr})</span><span class="state-count">${s.studyCount} studies</span></div>`;
  }

  function renderCityCard(c) {
    return `<div class="city-card"><h4>${c.name}</h4><div class="city-state">${c.state}</div><div class="city-count">${c.studyCount} active studies</div></div>`;
  }

  function renderGuideCard(g) {
    return `
      <div class="guide-card card">
        <div class="guide-category">${g.category}</div>
        <h3>${escape(g.title)}</h3>
        <p>${escape(g.excerpt)}</p>
        <div class="guide-meta">
          <span>By ${g.author} &middot; ${g.date}</span>
          <span>${g.readTime}</span>
        </div>
      </div>`;
  }

  function renderCategoryCard(c) {
    return `
      <div class="category-card card">
        <div class="cat-icon"></div>
        <h4>${c.name}</h4>
        <div class="cat-count">${c.studyCount} studies</div>
      </div>`;
  }

  // ===== Pagination =====
  function renderPagination(current, total, perPage) {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return '';
    let html = '<div class="pagination">';
    html += `<a href="#" data-page="${current - 1}" class="${current <= 1 ? 'disabled' : ''}">&laquo; Prev</a>`;
    for (let i = 1; i <= pages; i++) {
      if (i === current) {
        html += `<span class="active">${i}</span>`;
      } else if (i === 1 || i === pages || Math.abs(i - current) <= 2) {
        html += `<a href="#" data-page="${i}">${i}</a>`;
      } else if (Math.abs(i - current) === 3) {
        html += `<span class="dots">...</span>`;
      }
    }
    html += `<a href="#" data-page="${current + 1}" class="${current >= pages ? 'disabled' : ''}">Next &raquo;</a>`;
    html += '</div>';
    return html;
  }

  function escape(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ===== HOME =====
  function loadHome() {
    Promise.all([
      fetchJSON('data/studies.json'),
      fetchJSON('data/states.json'),
      fetchJSON('data/cities.json'),
      fetchJSON('data/guides.json'),
      fetchJSON('data/categories.json'),
      fetchJSON('data/faq.json')
    ]).then(([studies, states, cities, guides, categories, faq]) => {
      renderStudiesHome(studies);
      renderStatesHome(states);
      renderCitiesHome(cities);
      renderGuidesHome(guides);
      renderCategoriesHome(categories);
      renderFAQPreview(faq);
    }).catch(() => {
      $$('[data-section]').forEach(el => el.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load data</h3><p>Please try again later.</p></div>');
    });
  }

  function renderStudiesHome(studies) {
    const el = $('#featured-studies');
    if (!el) return;
    el.innerHTML = studies.slice(0, 6).map(renderStudyCard).join('');
  }

  function renderStatesHome(states) {
    const el = $('#home-states');
    if (!el) return;
    el.innerHTML = states.filter(s => s.studyCount > 30).slice(0, 12).map(renderStateCard).join('');
  }

  function renderCitiesHome(cities) {
    const el = $('#home-cities');
    if (!el) return;
    el.innerHTML = cities.slice(0, 12).map(renderCityCard).join('');
  }

  function renderGuidesHome(guides) {
    const el = $('#home-guides');
    if (!el) return;
    el.innerHTML = guides.slice(0, 3).map(renderGuideCard).join('');
  }

  function renderCategoriesHome(categories) {
    const el = $('#home-categories');
    if (!el) return;
    el.innerHTML = categories.map(renderCategoryCard).join('');
  }

  function renderFAQPreview(faq) {
    const el = $('#faq-preview');
    if (!el) return;
    el.innerHTML = faq.slice(0, 5).map((f, i) => `
      <div class="faq-item${i === 0 ? ' open' : ''}">
        <button class="faq-question">${escape(f.question)}<span class="faq-icon">&#9660;</span></button>
        <div class="faq-answer" style="max-height:${i === 0 ? '200px' : '0'}">
          <div class="faq-answer-inner">${escape(f.answer)}</div>
        </div>
      </div>`).join('');
    // Re-bind FAQ listeners
    el.querySelectorAll('.faq-item').forEach(item => {
      const btn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (btn && answer) {
        btn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          el.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('open');
            i.querySelector('.faq-answer').style.maxHeight = '0';
          });
          if (!isOpen) {
            item.classList.add('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      }
    });
  }

  // ===== CLINICAL TRIALS =====
  function loadClinicalTrials() {
    const container = $('#trials-list');
    if (!container) return;
    const sidebar = $('.filter-sidebar');

    fetchJSON('data/studies.json').then(allStudies => {
      // Get URL params
      const params = new URLSearchParams(window.location.search);
      const urlQ = params.get('q') || '';

      // Populate state filter dropdown
      const stateFilter = $('#filter-state');
      if (stateFilter) {
        const states = [...new Set(allStudies.map(s => s.state))].sort();
        stateFilter.innerHTML = '<option value="">All States</option>' +
          states.map(s => `<option value="${s}">${s}</option>`).join('');
      }

      // If URL has search query, set it
      if (urlQ) {
        const searchInput = $('#sidebar-search');
        if (searchInput) searchInput.value = urlQ;
      }

      let currentPage = 1;
      const perPage = 6;

      function filterAndRender() {
        const q = ($('#sidebar-search') || {}).value || '';
        const status = ($('#filter-status') || {}).value || '';
        const phase = ($('#filter-phase') || {}).value || '';
        const state = ($('#filter-state') || {}).value || '';

        let filtered = [...allStudies];

        if (q) {
          const lower = q.toLowerCase();
          filtered = filtered.filter(s =>
            s.title.toLowerCase().includes(lower) ||
            s.condition.toLowerCase().includes(lower) ||
            s.sponsor.toLowerCase().includes(lower) ||
            s.city.toLowerCase().includes(lower) ||
            s.state.toLowerCase().includes(lower)
          );
        }

        if (status) filtered = filtered.filter(s => s.status === status);
        if (phase) filtered = filtered.filter(s => s.phase === phase);
        if (state) filtered = filtered.filter(s => s.state === state);

        const total = filtered.length;
        const start = (currentPage - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);

        if (pageItems.length === 0) {
          container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>No trials found</h3><p>Try adjusting your filters or search terms.</p></div>';
          $('#trials-pagination').innerHTML = '';
          return;
        }

        container.innerHTML = pageItems.map(renderStudyCard).join('');
        $('#trials-pagination').innerHTML = renderPagination(currentPage, total, perPage);

        // Pagination event listeners
        $('#trials-pagination').querySelectorAll('a:not(.disabled)').forEach(a => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(a.dataset.page);
            if (page >= 1 && page <= Math.ceil(total / perPage)) {
              currentPage = page;
              filterAndRender();
              window.scrollTo({ top: $('.trials-layout').offsetTop - 100, behavior: 'smooth' });
            }
          });
        });
      }

      // Bind filters
      $$('.filter-sidebar select, #sidebar-search').forEach(el => {
        el.addEventListener('change', () => { currentPage = 1; filterAndRender(); });
        if (el.tagName === 'INPUT') {
          el.addEventListener('input', () => { currentPage = 1; filterAndRender(); });
        }
      });

      // Clear filters
      const clearBtn = $('#filter-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          $$('.filter-sidebar select').forEach(s => s.value = '');
          const searchIn = $('#sidebar-search');
          if (searchIn) searchIn.value = '';
          currentPage = 1;
          filterAndRender();
        });
      }

      filterAndRender();
    }).catch(() => {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load trials</h3><p>Please try again later.</p></div>';
    });
  }

  // ===== STATES =====
  function loadStates() {
    const container = $('#states-list');
    if (!container) return;
    const alphaNav = $('.alpha-nav');

    fetchJSON('data/states.json').then(states => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      if (alphaNav) {
        alphaNav.innerHTML = '<a href="#" class="all active" data-letter="">All</a>' +
          letters.map(l => `<a href="#" data-letter="${l}">${l}</a>`).join('');

        alphaNav.querySelectorAll('a').forEach(a => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            alphaNav.querySelectorAll('a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            const letter = a.dataset.letter;
            const searchVal = ($('#states-search') || {}).value || '';
            render(letter, searchVal);
          });
        });
      }

      const searchInput = $('#states-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const activeLetter = (alphaNav ? alphaNav.querySelector('.active') : null)?.dataset?.letter || '';
          render(activeLetter, searchInput.value);
        });
      }

      function render(letter, filter) {
        let filtered = states;

        if (letter) {
          filtered = filtered.filter(s => s.name.startsWith(letter));
        }

        if (filter) {
          const q = filter.toLowerCase();
          filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.abbr.toLowerCase().includes(q));
        }

        container.innerHTML = filtered.length
          ? filtered.map(renderStateCard).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><h3>No states found</h3></div>';
      }

      render('', '');
    }).catch(() => {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load states</h3></div>';
    });
  }

  // ===== CITIES =====
  function loadCities() {
    const container = $('#cities-list');
    if (!container) return;

    Promise.all([
      fetchJSON('data/cities.json'),
      fetchJSON('data/states.json')
    ]).then(([cities, states]) => {
      const stateFilter = $('#filter-city-state');
      if (stateFilter) {
        const stateNames = [...new Set(cities.map(c => c.state))].sort();
        stateFilter.innerHTML = '<option value="">All States</option>' +
          stateNames.map(s => `<option value="${s}">${s}</option>`).join('');
        stateFilter.addEventListener('change', () => render());
      }

      const searchInput = $('#cities-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => render());
      }

      function render() {
        const q = (searchInput?.value || '').toLowerCase();
        const state = stateFilter?.value || '';

        let filtered = [...cities];
        if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
        if (state) filtered = filtered.filter(c => c.state === state);

        container.innerHTML = filtered.length
          ? filtered.map(renderCityCard).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><h3>No cities found</h3></div>';
      }

      render();
    }).catch(() => {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load cities</h3></div>';
    });
  }

  // ===== GUIDES =====
  function loadGuides() {
    const container = $('#guides-list');
    const featuredContainer = $('#guides-featured');
    if (!container) return;

    fetchJSON('data/guides.json').then(guides => {
      // Featured (first 2)
      if (featuredContainer) {
        featuredContainer.innerHTML = guides.slice(0, 2).map(g => `
          <div class="guide-card card" style="border-left:4px solid var(--primary)">
            <div class="guide-category">Featured &middot; ${g.category}</div>
            <h3>${escape(g.title)}</h3>
            <p>${escape(g.excerpt)}</p>
            <div class="guide-meta">
              <span>By ${g.author} &middot; ${g.date}</span>
              <span>${g.readTime}</span>
            </div>
          </div>`).join('');
      }

      // All guides
      container.innerHTML = guides.map(renderGuideCard).join('');

      // Categories sidebar
      const sidebar = $('#guides-categories');
      if (sidebar) {
        const cats = [...new Set(guides.map(g => g.category))];
        sidebar.innerHTML = '<h3>Categories</h3><div class="sidebar-links">' +
          cats.map(c => `<a href="#">${c}</a>`).join('') + '</div>';
      }
    }).catch(() => {
      container.innerHTML = '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load guides</h3></div>';
    });
  }

});
