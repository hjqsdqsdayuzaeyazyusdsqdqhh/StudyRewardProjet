(function(){'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  function escape(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const dataCache = {};
  function fetchJSON(url) {
    if (dataCache[url]) return Promise.resolve(dataCache[url]);
    return fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(d => { dataCache[url] = d; return d; });
  }

  function loadingHTML(msg) {
    return '<div class="loading"><span class="spinner"></span>' + (msg || 'Loading...') + '</div>';
  }

  function emptyHTML(title, msg) {
    return '<div class="empty-state"><div class="es-icon">!</div><h3>' + (title || 'Nothing found') + '</h3><p>' + (msg || 'Try adjusting your filters or search terms.') + '</p></div>';
  }

  function errorHTML() {
    return '<div class="empty-state"><div class="es-icon">!</div><h3>Unable to load data</h3><p>Please try again later.</p></div>';
  }

  // ===== Mobile Nav =====
  (function initMobile() {
    const toggle = $('.mobile-toggle');
    const nav = $('.mobile-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
      });
      document.addEventListener('click', e => {
        if (!e.target.closest('.header') && nav.classList.contains('open')) {
          toggle.classList.remove('active');
          nav.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  })();

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
  (function initFAQ() {
    const list = $('.faq-list');
    if (list) {
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
  })();

  // ===== Newsletter =====
  const newsletterForm = $('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
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
    contactForm.addEventListener('submit', e => {
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
    heroSearch.addEventListener('submit', e => {
      e.preventDefault();
      const inp = heroSearch.querySelector('input');
      window.location.href = 'clinical-trials.html?q=' + encodeURIComponent(inp.value);
    });
  }

  // ===== Global Header Search (instant dropdown) =====
  (function initGlobalSearch() {
    const headerSearch = $('.header-search');
    if (!headerSearch) return;
    const input = headerSearch.querySelector('input');
    if (!input) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    headerSearch.appendChild(dropdown);

    function closeDropdown(e) {
      if (!e || !e.target.closest('.header-search')) {
        dropdown.classList.remove('open');
      }
    }

    document.addEventListener('click', closeDropdown);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') dropdown.classList.remove('open'); });

    const doSearch = debounce(function () {
      const q = input.value.trim().toLowerCase();
      if (!q) { dropdown.classList.remove('open'); return; }
      fetchJSON('/api/studies?perPage=100').then(r => { const studies = r.data || r;
        const results = studies.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.sponsor.toLowerCase().includes(q)
        ).slice(0, 6);
        if (!results.length) {
          dropdown.innerHTML = '<div class="sd-empty">No results found</div>';
        } else {
          dropdown.innerHTML = results.map(s =>
            '<a href="clinical-trials.html?study=' + s.id + '" class="sd-item">' +
              '<span class="sd-title">' + escape(s.title) + '</span>' +
              '<span class="sd-meta">' + escape(s.city) + ', ' + escape(s.state) + ' &middot; ' + s.reward + '</span>' +
            '</a>'
          ).join('');
        }
        dropdown.classList.add('open');
      }).catch(() => {});
    }, 300);

    input.addEventListener('input', doSearch);
    input.addEventListener('focus', function () { if (this.value.trim()) doSearch(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.location.href = 'clinical-trials.html?q=' + encodeURIComponent(input.value);
      }
    });
  })();

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

  // ===== Renderers =====
  function renderStudyCard(s) {
    return '<div class="study-card card" data-id="' + s.id + '">' +
      '<div class="sc-top">' +
        '<span class="badge badge-' + s.status.toLowerCase() + '">' + s.status + '</span>' +
        (s.healthyVolunteers ? '<span class="badge badge-healthy">Healthy Vols</span>' : '') +
      '</div>' +
      '<h3>' + escape(s.title) + '</h3>' +
      '<div class="meta">' +
        '<span>' + escape(s.city) + ', ' + escape(s.state) + '</span>' +
        '<span>' + escape(s.sponsor) + '</span>' +
        '<span>' + s.phase + '</span>' +
        '<span>' + s.studyType + '</span>' +
        '<span>' + escape(s.ageRange) + '</span>' +
        '<span>Posted ' + s.postedDate + '</span>' +
      '</div>' +
      '<p>' + escape(s.description) + '</p>' +
      '<div class="card-footer">' +
        '<span class="reward">' + s.reward + '</span>' +
        '<a href="clinical-trials.html?study=' + s.id + '" class="btn-link">View Details</a>' +
      '</div></div>';
  }

  function renderStudyCardCompact(s) {
    return '<div class="study-card card compact">' +
      '<span class="badge badge-' + s.status.toLowerCase() + '">' + s.status + '</span>' +
      '<h3>' + escape(s.title) + '</h3>' +
      '<div class="meta"><span>' + escape(s.city) + ', ' + escape(s.state) + '</span></div>' +
      '<div class="card-footer"><span class="reward">' + s.reward + '</span>' +
        '<a href="clinical-trials.html?study=' + s.id + '" class="btn-link">View</a></div></div>';
  }

  function renderStateCard(s, count) {
    return '<a href="clinical-trials.html?state=' + s.slug + '" class="state-card">' +
      '<span class="state-name">' + s.name + ' (' + s.abbr + ')</span>' +
      '<span class="state-count">' + (count || 0) + ' studies</span></a>';
  }

  function renderCityCard(c, count) {
    return '<a href="clinical-trials.html?city=' + c.slug + '" class="city-card">' +
      '<h4>' + c.name + '</h4>' +
      '<div class="city-state">' + c.state + '</div>' +
      '<div class="city-count">' + (count || 0) + ' active studies</div></a>';
  }

  function renderGuideCard(g) {
    return '<div class="guide-card card">' +
      '<div class="gc-top">' +
        '<span class="guide-category">' + g.category + '</span>' +
        '<span class="guide-readtime">' + g.readTime + '</span>' +
      '</div>' +
      '<h3>' + escape(g.title) + '</h3>' +
      '<p>' + escape(g.excerpt) + '</p>' +
      '<div class="guide-footer">' +
        '<span class="guide-author">By ' + g.author + ' &middot; ' + g.date + '</span>' +
        '<span class="guide-cta">Read Guide &rarr;</span>' +
      '</div></div>';
  }

  // ===== Category SVG Icons =====
  const CAT_SVGS = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 00-4 4c0 1.5.8 2.8 2 3.5A4 4 0 006 14a4 4 0 008 0 4 4 0 00-2-3.5A4 4 0 0016 7a4 4 0 00-4-4z"/><path d="M8 14v4M16 14v4"/></svg>',
    dna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>',
    lungs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M12 3a6 6 0 00-6 6c0 4 2 6 6 9M12 3a6 6 0 016 6c0 4-2 6-6 9"/><path d="M6 9H3M21 9h-3"/></svg>',
    bone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="8" ry="4"/><circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a6 6 0 006-6c0-4-6-11-6-11S6 11 6 15a6 6 0 006 6z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9.7-8 11-4.5-1.3-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="5" width="10" height="14" rx="5"/><path d="M7 12h10"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M8 6h8M6 22l2-10h8l2 10H6z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    stomach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8c0-4 3-6 8-6s8 2 8 6-3 7-8 7-8-3-8-7z"/><path d="M4 8c0 8 4 12 8 14"/></svg>',
    skin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v10a3 3 0 01-3 3H6a3 3 0 01-3-3V7z"/><circle cx="9" cy="12" r="2" fill="currentColor" opacity=".3"/><circle cx="15" cy="12" r="2" fill="currentColor" opacity=".3"/></svg>',
    research: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>'
  };

  function catSVG(slug) {
    const map = {
      cancer: CAT_SVGS.dna, oncology: CAT_SVGS.dna, 'rare-diseases': CAT_SVGS.research,
      diabetes: CAT_SVGS.drop, 'heart-disease': CAT_SVGS.heart, cardiovascular: CAT_SVGS.heart,
      vaccines: CAT_SVGS.shield, immunology: CAT_SVGS.shield, 'infectious-disease': CAT_SVGS.shield,
      neurology: CAT_SVGS.brain, 'mental-health': CAT_SVGS.brain,
      respiratory: CAT_SVGS.lungs, pulmonology: CAT_SVGS.lungs,
      orthopedics: CAT_SVGS.bone, rheumatology: CAT_SVGS.bone,
      dermatology: CAT_SVGS.skin,
      sleep: CAT_SVGS.moon,
      'weight-loss': CAT_SVGS.scale,
      'pain-management': CAT_SVGS.pill,
      'women-health': CAT_SVGS.person, 'womens-health': CAT_SVGS.person,
      'men-health': CAT_SVGS.person, 'mens-health': CAT_SVGS.person,
      'children-health': CAT_SVGS.person, 'childrens-health': CAT_SVGS.person, pediatrics: CAT_SVGS.person,
      'digestive-health': CAT_SVGS.stomach, gastroenterology: CAT_SVGS.stomach,
      ophthalmology: CAT_SVGS.eye,
      endocrinology: CAT_SVGS.drop, hematology: CAT_SVGS.drop,
      'healthy-volunteers': CAT_SVGS.shield,
      'children-s-health': CAT_SVGS.person,
      'men-s-health': CAT_SVGS.person,
      'women-s-health': CAT_SVGS.person,
      'rare-disease': CAT_SVGS.research, 'rare-diseases': CAT_SVGS.research
    };
    return map[slug] || CAT_SVGS.default;
  }

  function renderCategoryCard(c) {
    const iconHTML = c.icon ? '<span class="cat-emoji">' + c.icon + '</span>' : catSVG(c.slug);
    return '<a href="clinical-trials.html?category=' + c.slug + '" class="category-card" tabindex="0" aria-label="' + escape(c.name) + ' clinical trials">' +
      '<div class="cat-icon">' + iconHTML + '</div>' +
      '<h4>' + escape(c.name) + '</h4>' +
      (c.desc ? '<div class="cat-desc">' + escape(c.desc) + '</div>' : '') +
      '<div class="cat-count">' + (c.count || 0) + ' stud' + ((c.count || 0) !== 1 ? 'ies' : 'y') + '</div>' +
      '<div class="cat-link">View Studies &rarr;</div></a>';
  }

  function renderCategoryCardWithCount(c, count) {
    return renderCategoryCard({ ...c, count });
  }

  // ===== Pagination =====
  function renderPagination(current, total, perPage) {
    const pages = Math.ceil(total / perPage);
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

  // ===== Sorting =====
  function sortStudies(studies, sortKey) {
    const sorted = [...studies];
    switch (sortKey) {
      case 'az': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'reward-high': sorted.sort((a, b) => parseReward(b.reward) - parseReward(a.reward)); break;
      case 'reward-low': sorted.sort((a, b) => parseReward(a.reward) - parseReward(b.reward)); break;
      default: sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate)); break;
    }
    return sorted;
  }

  function parseReward(r) {
    return parseInt((r || '').replace(/[$,]/g, '')) || 0;
  }

  // ===== URL Params =====
  function getURLParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      q: p.get('q') || '',
      state: p.get('state') || '',
      city: p.get('city') || '',
      category: p.get('category') || '',
      status: p.get('status') || '',
      phase: p.get('phase') || '',
      studyType: p.get('studyType') || '',
      healthyVolunteers: p.get('healthyVolunteers') || '',
      sort: p.get('sort') || 'newest',
      perPage: parseInt(p.get('perPage')) || 9,
      study: parseInt(p.get('study')) || 0
    };
  }

  function resolveURLParams(params, states, cities, categories) {
    // Slug resolution: convert URL slugs to display names for filtering
    if (params.state && states) {
      const st = states.find(s => s.slug === params.state);
      if (st) params.state = st.name;
    }
    if (params.city && cities) {
      const ct = cities.find(c => c.slug === params.city);
      if (ct) params.city = ct.name + '|' + ct.state;
    }
    if (params.category && categories) {
      const ca = categories.find(c => c.slug === params.category);
      if (ca) params.category = ca.name;
    }
    return params;
  }

  function setURLParams(params) {
    const p = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) p.set(k, params[k]); });
    const qs = p.toString();
    const url = window.location.pathname + (qs ? '?' + qs : '');
    window.history.replaceState({}, '', url);
  }

  // ===== Compute study counts =====
  function computeCounts(studies) {
    const stateCounts = {};
    const cityCounts = {};
    const catCounts = {};
    studies.forEach(s => {
      stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
      cityCounts[s.city + '|' + s.state] = (cityCounts[s.city + '|' + s.state] || 0) + 1;
      catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    });
    return { stateCounts, cityCounts, catCounts };
  }

  // =============================================
  // HOME
  // =============================================
  function loadHome() {
    Promise.all([
      fetchJSON('/api/studies?perPage=200').then(r => r.data || r),
      fetchJSON('/api/states'),
      fetchJSON('/api/cities'),
      fetchJSON('data/guides.json'),
      fetchJSON('/api/categories'),
      fetchJSON('data/faq.json')
    ]).then(([studies, states, cities, guides, categories, faq]) => {
      renderStudiesHome(studies);
      renderStatesHome(studies, states);
      renderCitiesHome(studies, cities);
      renderGuidesHome(guides);
      renderCategoriesHome(studies, categories);
      renderFAQPreview(faq);
      renderStats(studies, states, cities);
    }).catch(() => {
      $$('[data-section]').forEach(el => el.innerHTML = errorHTML());
    });
  }

  function renderStudiesHome(studies) {
    const el = $('#featured-studies');
    if (!el) return;
    const sorted = [...studies].sort(function (a, b) { return parseReward(b.reward) - parseReward(a.reward); });
    el.innerHTML = sorted.slice(0, 6).map(renderStudyCard).join('');
  }

  function renderStatesHome(studies, states) {
    const el = $('#home-states');
    if (!el) return;
    const counts = computeCounts(studies).stateCounts;
    const sorted = states.filter(s => (counts[s.name] || 0) > 0).sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
    el.innerHTML = sorted.slice(0, 6).map(s => renderStateCard(s, counts[s.name] || 0)).join('');
  }

  function renderCitiesHome(studies, cities) {
    const el = $('#home-cities');
    if (!el) return;
    const counts = computeCounts(studies).cityCounts;
    const cityMap = {};
    cities.forEach(c => { cityMap[c.name + '|' + c.state] = c; });
    const sorted = Object.keys(counts).map(k => ({ ...cityMap[k], count: counts[k] })).filter(x => x.name).sort((a, b) => b.count - a.count);
    el.innerHTML = sorted.slice(0, 6).map(c => renderCityCard(c, c.count)).join('');
  }

  function renderGuidesHome(guides) {
    const el = $('#home-guides');
    if (!el) return;
    el.innerHTML = guides.slice(0, 3).map(renderGuideCard).join('');
  }

  function renderCategoriesHome(studies, categories) {
    const el = $('#home-categories');
    if (!el) return;
    const counts = computeCounts(studies).catCounts;
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c; });
    const uniqueCats = [...new Set(studies.map(s => s.category))].sort();
    el.innerHTML = uniqueCats.map(name => {
      const match = catMap[name];
      const desc = match ? match.description : '';
      const icon = match ? match.icon : '';
      const shortDesc = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return renderCategoryCardWithCount({ name, slug, desc: shortDesc, icon: icon }, counts[name] || 0);
    }).join('');
  }

  function renderStats(studies, states, cities) {
    const el = $('.stats-grid');
    if (!el) return;
    const totalRewards = studies.reduce((sum, s) => sum + parseReward(s.reward), 0);
    const avgReward = Math.round(totalRewards / studies.length);
    const uniqueCities = [...new Set(studies.map(s => s.city))].length;
    el.innerHTML =
      '<div class="stat-item"><div class="stat-number">' + studies.length + '</div><div class="stat-label">Active Studies</div></div>' +
      '<div class="stat-item"><div class="stat-number">' + states.length + '</div><div class="stat-label">States Covered</div></div>' +
      '<div class="stat-item"><div class="stat-number">' + uniqueCities + '+</div><div class="stat-label">Cities</div></div>' +
      '<div class="stat-item"><div class="stat-number">$' + avgReward.toLocaleString() + '</div><div class="stat-label">Avg. Reward</div></div>';
  }

  function renderFAQPreview(faq) {
    const el = $('#faq-preview');
    if (!el) return;
    el.innerHTML = faq.map((f, i) =>
      '<div class="faq-item' + (i === 0 ? ' open' : '') + '">' +
        '<button class="faq-question">' + escape(f.question) + '<span class="faq-icon">&#9660;</span></button>' +
        '<div class="faq-answer" style="max-height:' + (i === 0 ? '200px' : '0') + '">' +
          '<div class="faq-answer-inner">' + escape(f.answer) + '</div>' +
        '</div>' +
      '</div>'
    ).join('');
  }

  // =============================================
  // CLINICAL TRIALS
  // =============================================
  function loadClinicalTrials() {
    const container = $('#trials-list');
    const paginationEl = $('#trials-pagination');
    if (!container) return;

    const params = getURLParams();
    let currentPage = 1;
    let currentSort = params.sort || 'newest';
    let currentPerPage = Math.min(Math.max(params.perPage || 9, 6), 36);

    Promise.all([
      fetchJSON('/api/studies?perPage=500').then(r => r.data || r),
      fetchJSON('/api/states'),
      fetchJSON('/api/cities'),
      fetchJSON('/api/categories')
    ]).then(([allStudies, states, cities, categories]) => {
      resolveURLParams(params, states, cities, categories);
      renderTrials(allStudies, states, cities, categories);
    }).catch(() => {
      container.innerHTML = errorHTML();
    });

    function renderTrials(allStudies, states, cities, categories) {
      // Populate filter dropdowns
      populateFilters(allStudies, states, cities, categories);

      // If study detail view
      if (params.study) {
        const study = allStudies.find(s => s.id === params.study);
        if (study) {
          renderStudyDetail(study, allStudies, categories);
          return;
        }
      }

      // Set filter values from URL
      setFilterValues(params);

      function doFilterAndRender() {
        const filters = getFilterValues();
        let filtered = allStudies;

        if (filters.q) {
          const lq = filters.q.toLowerCase();
          filtered = filtered.filter(s =>
            s.title.toLowerCase().includes(lq) ||
            s.category.toLowerCase().includes(lq) ||
            s.city.toLowerCase().includes(lq) ||
            s.state.toLowerCase().includes(lq) ||
            s.sponsor.toLowerCase().includes(lq)
          );
        }
        if (filters.category) filtered = filtered.filter(s => s.category === filters.category);
        if (filters.state) filtered = filtered.filter(s => s.state === filters.state);
        if (filters.city) {
          const [cityName, stateName] = filters.city.split('|');
          filtered = filtered.filter(s => s.city === cityName && s.state === stateName);
        }
        if (filters.studyType) filtered = filtered.filter(s => s.studyType === filters.studyType);
        if (filters.status) filtered = filtered.filter(s => s.status === filters.status);
        if (filters.phase) filtered = filtered.filter(s => s.phase === filters.phase);
        if (filters.healthyVolunteers === 'yes') filtered = filtered.filter(s => s.healthyVolunteers === true);
        if (filters.healthyVolunteers === 'no') filtered = filtered.filter(s => s.healthyVolunteers === false);

        const sorted = sortStudies(filtered, currentSort);
        const total = sorted.length;
        const pages = Math.ceil(total / currentPerPage);
        if (currentPage > pages) currentPage = pages || 1;
        const start = (currentPage - 1) * currentPerPage;
        const pageItems = sorted.slice(start, start + currentPerPage);

        // Update URL
        const urlParams = {};
        Object.keys(filters).forEach(k => { if (filters[k]) urlParams[k] = filters[k]; });
        if (currentSort !== 'newest') urlParams.sort = currentSort;
        if (currentPerPage !== 9) urlParams.perPage = String(currentPerPage);
        setURLParams(urlParams);

        // Results count
        const countEl = $('#results-count');
        if (countEl) countEl.textContent = total + ' trial' + (total !== 1 ? 's' : '') + ' found';

        // Render
        if (!pageItems.length) {
          container.innerHTML = emptyHTML('No trials found', 'Try adjusting your filters or search terms.');
          if (paginationEl) paginationEl.innerHTML = '';
          return;
        }

        container.innerHTML = pageItems.map(renderStudyCard).join('');
        if (paginationEl) paginationEl.innerHTML = renderPagination(currentPage, total, currentPerPage);

        // Bind pagination via delegation
        if (paginationEl) {
          paginationEl.querySelectorAll('a:not(.disabled)').forEach(a => {
            a.addEventListener('click', e => {
              e.preventDefault();
              const page = parseInt(a.dataset.page);
              if (page >= 1 && page <= Math.ceil(total / currentPerPage)) {
                currentPage = page;
                doFilterAndRender();
                const layout = $('.trials-layout');
                if (layout) window.scrollTo({ top: layout.offsetTop - 100, behavior: 'smooth' });
              }
            });
          });
        }

        // Bind view details to use current filters
        container.querySelectorAll('.study-card .btn-link').forEach(a => {
          const id = a.closest('.study-card').dataset.id;
          if (id) {
            const study = allStudies.find(s => s.id == id);
            if (study) a.href = 'clinical-trials.html?study=' + id;
          }
        });
      }

      // Wire up filter changes
      wireFilterChanges(function () { currentPage = 1; doFilterAndRender(); });

      // Wire up sort
      const sortEl = $('#sort-select');
      if (sortEl) {
        sortEl.value = currentSort;
        sortEl.addEventListener('change', function () {
          currentSort = this.value;
          currentPage = 1;
          doFilterAndRender();
        });
      }

      // Wire up per page
      const perPageEl = $('#per-page-select');
      if (perPageEl) {
        perPageEl.value = String(currentPerPage);
        perPageEl.addEventListener('change', function () {
          currentPerPage = parseInt(this.value) || 9;
          currentPage = 1;
          doFilterAndRender();
        });
      }

      // Wire clear filters
      const clearBtn = $('#filter-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          $$('.filter-group select').forEach(s => s.value = '');
          $$('.filter-group input').forEach(i => i.value = '');
          currentPage = 1;
          currentSort = 'newest';
          currentPerPage = 9;
          if (sortEl) sortEl.value = 'newest';
          if (perPageEl) perPageEl.value = '9';
          doFilterAndRender();
        });
      }

      // Initial render
      doFilterAndRender();
    }
  }

  function populateFilters(allStudies, states, cities, categories) {
    // State
    const stateFilter = $('#filter-state');
    if (stateFilter) {
      const stateNames = [...new Set(allStudies.map(s => s.state))].sort();
      stateFilter.innerHTML = '<option value="">All States</option>' +
        stateNames.map(s => '<option value="' + s + '">' + s + '</option>').join('');
    }

    // City
    const cityFilter = $('#filter-city');
    if (cityFilter) {
      const cityList = [...new Set(allStudies.map(s => s.city + '|' + s.state))].sort();
      cityFilter.innerHTML = '<option value="">All Cities</option>' +
        cityList.map(c => {
          const parts = c.split('|');
          return '<option value="' + c + '">' + parts[0] + ', ' + parts[1] + '</option>';
        }).join('');
    }

    // Category
    const catFilter = $('#filter-category');
    if (catFilter) {
      catFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('');
    }

    // Study Type
    const typeFilter = $('#filter-study-type');
    if (typeFilter) {
      const types = [...new Set(allStudies.map(s => s.studyType))].sort();
      typeFilter.innerHTML = '<option value="">All Types</option>' +
        types.map(t => '<option value="' + t + '">' + t + '</option>').join('');
    }
  }

  function getFilterValues() {
    const g = id => ($('#' + id) || {}).value || '';
    return {
      q: g('sidebar-search'),
      category: g('filter-category'),
      state: g('filter-state'),
      city: g('filter-city'),
      studyType: g('filter-study-type'),
      status: g('filter-status'),
      phase: g('filter-phase'),
      healthyVolunteers: g('filter-healthy')
    };
  }

  function setFilterValues(params) {
    const set = (id, val) => { const el = $('#' + id); if (el && val) el.value = val; };
    set('sidebar-search', params.q);
    set('filter-category', params.category);
    set('filter-state', params.state);
    set('filter-city', params.city);
    set('filter-study-type', params.studyType);
    set('filter-status', params.status);
    set('filter-phase', params.phase);
    set('filter-healthy', params.healthyVolunteers);
  }

  function wireFilterChanges(cb) {
    $$('.filter-group select, #sidebar-search').forEach(el => {
      el.addEventListener('change', cb);
      if (el.tagName === 'INPUT') {
        el.addEventListener('input', debounce(cb, 300));
      }
    });
  }

  // ===== Study Detail View =====
  function renderStudyDetail(study, allStudies, categories) {
    const layout = $('.trials-layout');
    if (!layout) return;

    const related = allStudies.filter(s => s.category === study.category && s.id !== study.id).slice(0, 4);

    layout.innerHTML =
      '<div class="study-detail">' +
        '<a href="clinical-trials.html" class="btn-link">&larr; Back to all trials</a>' +
        '<div class="sd-header">' +
          '<span class="badge badge-' + study.status.toLowerCase() + '">' + study.status + '</span>' +
          '<h1>' + escape(study.title) + '</h1>' +
          '<div class="sd-meta">' +
            '<div class="sd-meta-item"><strong>Location:</strong> ' + escape(study.city) + ', ' + escape(study.state) + '</div>' +
            '<div class="sd-meta-item"><strong>Sponsor:</strong> ' + escape(study.sponsor) + '</div>' +
            '<div class="sd-meta-item"><strong>Phase:</strong> ' + study.phase + '</div>' +
            '<div class="sd-meta-item"><strong>Type:</strong> ' + study.studyType + '</div>' +
            '<div class="sd-meta-item"><strong>Category:</strong> ' + study.category + '</div>' +
            '<div class="sd-meta-item"><strong>Age Range:</strong> ' + study.ageRange + '</div>' +
            '<div class="sd-meta-item"><strong>Gender:</strong> ' + study.gender + '</div>' +
            '<div class="sd-meta-item"><strong>Healthy Volunteers:</strong> ' + (study.healthyVolunteers ? 'Yes' : 'No') + '</div>' +
            '<div class="sd-meta-item"><strong>Posted:</strong> ' + study.postedDate + '</div>' +
          '</div>' +
          '<div class="sd-reward">' + study.reward + '</div>' +
        '</div>' +
        '<div class="sd-description">' +
          '<h2>About This Study</h2>' +
          '<p>' + escape(study.description) + '</p>' +
        '</div>' +
        (related.length ? '<div class="sd-related"><h2>Related Studies</h2><div class="studies-grid">' +
          related.map(renderStudyCardCompact).join('') + '</div></div>' : '') +
      '</div>';

    // Related categories
    const sidebar = $('.filter-sidebar');
    if (sidebar && categories) {
      sidebar.innerHTML = '<h3>Related Categories</h3><div class="sidebar-links">' +
        categories.filter(c => c.name === study.category).map(c =>
          '<a href="clinical-trials.html?category=' + c.slug + '">' + c.name + '</a>'
        ).join('') + '</div>';
    }
  }

  // =============================================
  // STATES
  // =============================================
  function loadStates() {
    const container = $('#states-list');
    const alphaNav = $('.alpha-nav');
    if (!container) return;

    Promise.all([
      fetchJSON('/api/states'),
      fetchJSON('/api/studies?perPage=500').then(r => r.data || r)
    ]).then(([states, studies]) => {
      const counts = computeCounts(studies).stateCounts;

      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      if (alphaNav) {
        alphaNav.innerHTML = '<a href="#" class="all active" data-letter="">All</a>' +
          letters.map(l => '<a href="#" data-letter="' + l + '">' + l + '</a>').join('');
        alphaNav.addEventListener('click', e => {
          const a = e.target.closest('a');
          if (!a) return;
          e.preventDefault();
          alphaNav.querySelectorAll('a').forEach(x => x.classList.remove('active'));
          a.classList.add('active');
          doRender(a.dataset.letter, ($('#states-search') || {}).value || '');
        });
      }

      const searchInput = $('#states-search');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          const l = alphaNav ? (alphaNav.querySelector('.active') || {}).dataset.letter || '' : '';
          doRender(l, this.value);
        });
      }

      function doRender(letter, filter) {
        let filtered = states;
        if (letter) filtered = filtered.filter(s => s.name.startsWith(letter));
        if (filter) {
          const q = filter.toLowerCase();
          filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.abbr.toLowerCase().includes(q));
        }
        container.innerHTML = filtered.length
          ? filtered.map(s => renderStateCard(s, counts[s.name] || 0)).join('')
          : emptyHTML('No states found', '');
      }

      doRender('', '');
    }).catch(() => {
      container.innerHTML = errorHTML();
    });
  }

  // =============================================
  // CITIES
  // =============================================
  function loadCities() {
    const container = $('#cities-list');
    if (!container) return;

    Promise.all([
      fetchJSON('/api/cities'),
      fetchJSON('/api/states'),
      fetchJSON('/api/studies?perPage=500').then(r => r.data || r)
    ]).then(([cities, states, studies]) => {
      const counts = computeCounts(studies).cityCounts;

      const stateFilter = $('#filter-city-state');
      if (stateFilter) {
        const stateNames = [...new Set(cities.map(c => c.state))].sort();
        stateFilter.innerHTML = '<option value="">All States</option>' +
          stateNames.map(s => '<option value="' + s + '">' + s + '</option>').join('');
        stateFilter.addEventListener('change', () => doRender());
      }

      const searchInput = $('#cities-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => doRender());
      }

      function doRender() {
        const q = (searchInput ? searchInput.value : '').toLowerCase();
        const state = stateFilter ? stateFilter.value : '';

        let filtered = [...cities];
        if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
        if (state) filtered = filtered.filter(c => c.state === state);

        filtered.sort((a, b) => (counts[b.name + '|' + b.state] || 0) - (counts[a.name + '|' + a.state] || 0));

        container.innerHTML = filtered.length
          ? filtered.map(c => renderCityCard(c, counts[c.name + '|' + c.state] || 0)).join('')
          : emptyHTML('No cities found', '');
      }

      doRender();
    }).catch(() => {
      container.innerHTML = errorHTML();
    });
  }

  // =============================================
  // GUIDES
  // =============================================
  function loadGuides() {
    const container = $('#guides-list');
    const featuredContainer = $('#guides-featured');
    if (!container) return;

    fetchJSON('data/guides.json').then(guides => {
      // Featured
      if (featuredContainer) {
        featuredContainer.innerHTML = guides.slice(0, 2).map(g =>
          '<div class="guide-card card featured">' +
            '<div class="gc-top">' +
              '<span class="guide-category">Featured &middot; ' + g.category + '</span>' +
              '<span class="guide-readtime">' + g.readTime + '</span>' +
            '</div>' +
            '<h3>' + escape(g.title) + '</h3>' +
            '<p>' + escape(g.excerpt) + '</p>' +
            '<div class="guide-footer">' +
              '<span class="guide-author">By ' + g.author + ' &middot; ' + g.date + '</span>' +
              '<span class="guide-cta">Read Guide &rarr;</span>' +
            '</div></div>'
        ).join('');
      }

      // Search + category filter
      const searchInput = $('#guides-search');
      const catFilter = $('#guides-category-filter');
      let filteredGuides = [...guides];

      function renderGuides() {
        const q = (searchInput ? searchInput.value : '').toLowerCase();
        const cat = catFilter ? catFilter.value : '';
        filteredGuides = guides.filter(g => {
          const matchQ = !q || g.title.toLowerCase().includes(q) || g.excerpt.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
          const matchCat = !cat || g.category === cat;
          return matchQ && matchCat;
        });
        container.innerHTML = filteredGuides.length
          ? filteredGuides.map(renderGuideCard).join('')
          : emptyHTML('No guides found', '');
      }

      if (searchInput) searchInput.addEventListener('input', renderGuides);

      if (catFilter) {
        const cats = [...new Set(guides.map(g => g.category))];
        catFilter.innerHTML = '<option value="">All Categories</option>' +
          cats.map(c => '<option value="' + c + '">' + c + '</option>').join('');
        catFilter.addEventListener('change', renderGuides);
      }

      // Categories sidebar
      const sidebar = $('#guides-categories');
      if (sidebar) {
        const cats = [...new Set(guides.map(g => g.category))];
        sidebar.innerHTML = '<h3>Categories</h3><div class="sidebar-links">' +
          cats.map(c => '<a href="#" data-cat="' + c + '">' + c + '</a>').join('') + '</div>';
        sidebar.addEventListener('click', e => {
          const a = e.target.closest('a');
          if (!a || !a.dataset.cat) return;
          e.preventDefault();
          if (catFilter) { catFilter.value = a.dataset.cat; renderGuides(); }
        });
      }

      renderGuides();
    }).catch(() => {
      container.innerHTML = errorHTML();
    });
  }

  // ===== JSON-LD Schemas =====
  (function injectJSONLD() {
    function addLD(obj) {
      if (document.querySelector('script[type="application/ld+json"][data-injected]')) return;
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-injected', '');
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    }

    // WebSite schema (with search action) - if not already present
    if (!document.querySelector('script[type="application/ld+json"]') || !document.querySelector('script[type="application/ld+json"]').textContent.includes('WebSite')) {
      addLD({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "StudyReward",
        "url": "https://studyreward.online",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://studyreward.online/clinical-trials.html?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      });
    }

    // FAQPage schema for home page
    if (page === 'home') {
      fetchJSON('data/faq.json').then(faq => {
        addLD({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
          }))
        });
      }).catch(() => {});
    }

    // Article schema for guides
    if (page === 'guides') {
      fetchJSON('data/guides.json').then(guides => {
        guides.slice(0, 10).forEach(g => {
          addLD({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": g.title,
            "description": g.excerpt,
            "author": { "@type": "Person", "name": g.author },
            "datePublished": g.date,
            "publisher": { "@type": "Organization", "name": "StudyReward" }
          });
        });
      }).catch(() => {});
    }
  })();

})();
