document.addEventListener('DOMContentLoaded', () => {

  // ===== Mobile Navigation =====
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      nav.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header')) {
        mobileToggle.classList.remove('active');
        nav.classList.remove('open');
      }
    });
  }

  // ===== Header Scroll Effect =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // ===== Back to Top =====
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== Load Page Data =====
  const page = document.body.dataset.page;

  if (page === 'home') {
    loadHomeData();
  } else if (page === 'clinical-trials') {
    loadClinicalTrials();
  } else if (page === 'states') {
    loadStates();
  } else if (page === 'cities') {
    loadCities();
  } else if (page === 'guides') {
    loadGuides();
  }

  // ===== Home Page =====
  function loadHomeData() {
    Promise.all([
      fetch('data/studies.json').then(r => r.json()),
      fetch('data/states.json').then(r => r.json()),
      fetch('data/cities.json').then(r => r.json()),
      fetch('data/guides.json').then(r => r.json())
    ]).then(([studies, states, cities, guides]) => {
      renderFeaturedStudies(studies);
      renderHomeStates(states);
      renderHomeCities(cities);
      renderHomeGuides(guides);
    }).catch(() => {
      document.querySelectorAll('[data-section]').forEach(el => {
        el.innerHTML = '<div class="no-results"><h3>Unable to load data</h3><p>Please try again later.</p></div>';
      });
    });
  }

  function renderFeaturedStudies(studies) {
    const container = document.getElementById('featured-studies');
    if (!container) return;

    const featured = studies.slice(0, 6);
    container.innerHTML = featured.map(s => `
      <div class="study-card card">
        <span class="badge badge-recruiting">${s.status}</span>
        <h3>${s.title}</h3>
        <div class="meta">
          <span>📍 ${s.city}, ${s.state}</span>
          <span>🏥 ${s.sponsor}</span>
          <span>📋 ${s.phase}</span>
        </div>
        <p>${s.description}</p>
        <div class="card-footer">
          <span class="reward">💰 ${s.reward}</span>
          <a href="#" class="btn-link">View Details →</a>
        </div>
      </div>
    `).join('');
  }

  function renderHomeStates(states) {
    const container = document.getElementById('home-states');
    if (!container) return;

    const limited = states.filter(s => s.studyCount > 30).slice(0, 12);
    container.innerHTML = limited.map(s => `
      <div class="state-card">
        <span class="state-name">${s.name}</span>
        <span class="state-count">${s.studyCount} studies</span>
      </div>
    `).join('');
  }

  function renderHomeCities(cities) {
    const container = document.getElementById('home-cities');
    if (!container) return;

    const limited = cities.slice(0, 12);
    container.innerHTML = limited.map(c => `
      <div class="city-card">
        <h4>${c.name}</h4>
        <div class="city-state">${c.state}</div>
        <div class="city-count">${c.studyCount} active studies</div>
      </div>
    `).join('');
  }

  function renderHomeGuides(guides) {
    const container = document.getElementById('home-guides');
    if (!container) return;

    const limited = guides.slice(0, 3);
    container.innerHTML = limited.map(g => `
      <div class="guide-card card">
        <div class="guide-category">${g.category}</div>
        <h3>${g.title}</h3>
        <p>${g.excerpt}</p>
        <div class="guide-meta">
          <span>By ${g.author}</span>
          <span>${g.readTime}</span>
        </div>
      </div>
    `).join('');
  }

  // ===== Clinical Trials Page =====
  function loadClinicalTrials() {
    const container = document.getElementById('trials-list');
    const loading = document.getElementById('trials-loading');
    const noResults = document.getElementById('trials-none');
    const filterStatus = document.getElementById('filter-status');
    const filterPhase = document.getElementById('filter-phase');
    const filterState = document.getElementById('filter-state');
    const searchInput = document.getElementById('trials-search');

    if (!container) return;

    fetch('data/studies.json').then(r => r.json()).then(allStudies => {
      if (filterState) {
        const states = [...new Set(allStudies.map(s => s.state))].sort();
        filterState.innerHTML = '<option value="">All States</option>' +
          states.map(s => `<option value="${s}">${s}</option>`).join('');
      }

      function filterAndRender() {
        let filtered = [...allStudies];

        if (searchInput) {
          const q = searchInput.value.toLowerCase();
          if (q) {
            filtered = filtered.filter(s =>
              s.title.toLowerCase().includes(q) ||
              s.condition.toLowerCase().includes(q) ||
              s.sponsor.toLowerCase().includes(q) ||
              s.city.toLowerCase().includes(q) ||
              s.state.toLowerCase().includes(q)
            );
          }
        }

        if (filterStatus && filterStatus.value) {
          filtered = filtered.filter(s => s.status === filterStatus.value);
        }

        if (filterPhase && filterPhase.value) {
          filtered = filtered.filter(s => s.phase === filterPhase.value);
        }

        if (filterState && filterState.value) {
          filtered = filtered.filter(s => s.state === filterState.value);
        }

        if (filtered.length === 0) {
          container.innerHTML = '';
          noResults.style.display = 'block';
          loading.style.display = 'none';
          return;
        }

        noResults.style.display = 'none';
        container.innerHTML = filtered.map(s => `
          <div class="study-card card">
            <span class="badge badge-recruiting">${s.status}</span>
            <h3>${s.title}</h3>
            <div class="meta">
              <span>📍 ${s.city}, ${s.state}</span>
              <span>🏥 ${s.sponsor}</span>
              <span>📋 ${s.phase}</span>
              <span>👤 ${s.ageRange} · ${s.gender}</span>
            </div>
            <p>${s.description}</p>
            <div class="card-footer">
              <span class="reward">💰 ${s.reward}</span>
              <a href="#" class="btn-link">View Details →</a>
            </div>
          </div>
        `).join('');
        loading.style.display = 'none';
      }

      if (searchInput) searchInput.addEventListener('input', filterAndRender);
      if (filterStatus) filterStatus.addEventListener('change', filterAndRender);
      if (filterPhase) filterPhase.addEventListener('change', filterAndRender);
      if (filterState) filterState.addEventListener('change', filterAndRender);

      filterAndRender();
    }).catch(() => {
      if (loading) loading.style.display = 'none';
      if (container) container.innerHTML = '<div class="no-results"><h3>Unable to load trials</h3><p>Please try again later.</p></div>';
    });
  }

  // ===== States Page =====
  function loadStates() {
    const container = document.getElementById('states-list');
    const searchInput = document.getElementById('states-search');

    if (!container) return;

    fetch('data/states.json').then(r => r.json()).then(states => {
      function render(filter) {
        let filtered = states;
        if (filter) {
          const q = filter.toLowerCase();
          filtered = states.filter(s => s.name.toLowerCase().includes(q) || s.abbr.toLowerCase().includes(q));
        }
        container.innerHTML = filtered.map(s => `
          <div class="state-card">
            <span class="state-name">${s.name} (${s.abbr})</span>
            <span class="state-count">${s.studyCount} studies</span>
          </div>
        `).join('');
      }

      if (searchInput) {
        searchInput.addEventListener('input', () => render(searchInput.value));
      }

      render('');
    }).catch(() => {
      container.innerHTML = '<div class="no-results"><h3>Unable to load states</h3></div>';
    });
  }

  // ===== Cities Page =====
  function loadCities() {
    const container = document.getElementById('cities-list');
    const searchInput = document.getElementById('cities-search');

    if (!container) return;

    fetch('data/cities.json').then(r => r.json()).then(cities => {
      function render(filter) {
        let filtered = cities;
        if (filter) {
          const q = filter.toLowerCase();
          filtered = cities.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
        }
        container.innerHTML = filtered.map(c => `
          <div class="city-card">
            <h4>${c.name}</h4>
            <div class="city-state">${c.state}</div>
            <div class="city-count">${c.studyCount} active studies</div>
          </div>
        `).join('');
      }

      if (searchInput) {
        searchInput.addEventListener('input', () => render(searchInput.value));
      }

      render('');
    }).catch(() => {
      container.innerHTML = '<div class="no-results"><h3>Unable to load cities</h3></div>';
    });
  }

  // ===== Guides Page =====
  function loadGuides() {
    const container = document.getElementById('guides-list');
    if (!container) return;

    fetch('data/guides.json').then(r => r.json()).then(guides => {
      container.innerHTML = guides.map(g => `
        <div class="guide-card card">
          <div class="guide-category">${g.category}</div>
          <h3>${g.title}</h3>
          <p>${g.excerpt}</p>
          <div class="guide-meta">
            <span>By ${g.author} · ${g.date}</span>
            <span>${g.readTime}</span>
          </div>
        </div>
      `).join('');
    }).catch(() => {
      container.innerHTML = '<div class="no-results"><h3>Unable to load guides</h3></div>';
    });
  }

  // ===== Newsletter Form =====
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      if (input && input.value.trim()) {
        const btn = newsletterForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Subscribed!';
        input.value = '';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      }
    });
  }

  // ===== Contact Form =====
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Message Sent!';
      contactForm.reset();
      setTimeout(() => { btn.textContent = originalText; }, 2000);
    });
  }

});
