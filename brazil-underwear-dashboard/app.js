(() => {
  const data = window.__YO_DATA__ || { meta: {}, products: [], categories: [], keywords: [] };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const state = {
    mode: 'sales',
    query: '',
    category: 'ALL',
    source: 'ALL',
    minRecent: 0,
    page: 1,
    pageSize: 12,
    filtered: [],
  };

  const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

  function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatNumber(value) {
    return numberFmt.format(num(value));
  }

  function formatCompact(value) {
    return compactFmt.format(num(value));
  }

  function formatPercent(value) {
    return `${(Math.max(0, Math.min(1, num(value))) * 100).toFixed(1)}%`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function safeUrl(value) {
    const url = String(value || '');
    return /^https?:\/\//i.test(url) ? url : '#';
  }

  function leafCategory(value) {
    const parts = String(value || '').split('->');
    return (parts[parts.length - 1] || '未分类').trim();
  }

  function sourceMatches(product) {
    if (state.source === 'HOT') return Boolean(product.hotProduct);
    if (state.source === 'NEW') return Boolean(product.hotNew);
    if (state.source === 'SEARCH') return Boolean(product.productSearch);
    return true;
  }

  function filterProducts() {
    const query = state.query.trim().toLowerCase();
    const rows = data.products.filter((product) => {
      const haystack = [product.title, product.category, product.shop, product.id].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesCategory = state.category === 'ALL' || leafCategory(product.category) === state.category;
      const matchesRecent = num(product.recentSales) >= state.minRecent;
      return matchesQuery && matchesCategory && matchesRecent && sourceMatches(product);
    });

    rows.sort((a, b) => {
      if (state.mode === 'trend') {
        return num(b.recentSales) - num(a.recentSales) || num(b.totalSales) - num(a.totalSales) || num(b.recentShare) - num(a.recentShare);
      }
      return num(b.totalSales) - num(a.totalSales) || num(b.recentSales) - num(a.recentSales) || num(b.rating) - num(a.rating);
    });
    state.filtered = rows;
    const pages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, pages);
  }

  function renderMetrics() {
    const meta = data.meta || {};
    $('#metricProducts').textContent = formatNumber(meta.productCount);
    $('#heroProducts').textContent = formatCompact(meta.productCount);
    $('#metricNew').textContent = formatCompact(meta.hotNewCount);
    $('#metricCategories').textContent = formatNumber(meta.categoryCount);
    $('#metricKeywords').textContent = formatNumber(meta.keywordCount);
    $('#generatedAt').textContent = meta.generatedAt || 'LOCAL';
  }

  function populateCategoryFilter() {
    const select = $('#categoryFilter');
    const categories = [...new Set(data.products.map((product) => leafCategory(product.category)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="ALL">全部内衣裤</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  }

  function sourceBadges(product) {
    const badges = [];
    if (product.hotProduct) badges.push('<span class="badge hot">HOT</span>');
    if (product.hotNew) badges.push('<span class="badge new">NEW</span>');
    return badges.length ? `<div class="source-badges">${badges.join('')}</div>` : '';
  }

  function renderProductRows() {
    const tbody = $('#productRows');
    const empty = $('#emptyState');
    const start = (state.page - 1) * state.pageSize;
    const rows = state.filtered.slice(start, start + state.pageSize);
    $('#resultCount').textContent = formatNumber(state.filtered.length);
    $('#rankingTitle').textContent = state.mode === 'trend' ? '近30天热度领先' : '累计销量领先';
    $('#rankingModeNo').textContent = state.mode === 'trend' ? 'B' : 'A';
    empty.hidden = rows.length > 0;
    tbody.innerHTML = rows.map((product, index) => {
      const rank = start + index + 1;
      const share = num(product.recentShare);
      const image = safeUrl(product.image);
      const front = safeUrl(product.shopeeUrl);
      const source = safeUrl(product.sourceUrl);
      return `<tr>
        <td><span class="rank-pill">${String(rank).padStart(2, '0')}</span></td>
        <td><div class="product-cell">
          <img class="product-thumb" src="${image}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <div class="product-info">
            <div class="product-title" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</div>
            <div class="product-category" title="${escapeHtml(product.category)}">${escapeHtml(product.category)}</div>
            ${sourceBadges(product)}
          </div>
        </div></td>
        <td><span class="metric-strong">${formatNumber(product.totalSales)}</span><span class="metric-caption">${escapeHtml(product.shop || '—')}</span></td>
        <td><span class="metric-strong">${formatNumber(product.recentSales)}</span><div class="trend-meter"><i style="width:${Math.max(2, Math.min(100, share * 100))}%"></i></div><span class="trend-percent">${formatPercent(share)} of total</span></td>
        <td><span class="metric-strong">${escapeHtml(product.price || '—')}</span><span class="metric-caption">${escapeHtml(product.location || '')}</span></td>
        <td><span class="rating">★ ${num(product.rating).toFixed(2)}</span><span class="metric-caption">${formatNumber(product.reviews)} reviews</span></td>
        <td><div class="actions"><a class="action-link primary" href="${front}" target="_blank" rel="noopener">SHOPEE ↗</a><a class="action-link" href="${source}" target="_blank" rel="noopener">源链</a></div></td>
      </tr>`;
    }).join('');
  }

  function renderPagination() {
    const holder = $('#pagination');
    const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    const visible = new Set([1, pages, state.page - 1, state.page, state.page + 1].filter((n) => n >= 1 && n <= pages));
    const ordered = [...visible].sort((a, b) => a - b);
    let html = '';
    let previous = 0;
    ordered.forEach((page) => {
      if (previous && page - previous > 1) html += '<span class="page-gap">…</span>';
      html += `<button type="button" class="page-btn ${page === state.page ? 'active' : ''}" data-page="${page}">${page}</button>`;
      previous = page;
    });
    holder.innerHTML = html;
    $$('#pagination .page-btn').forEach((button) => button.addEventListener('click', () => {
      state.page = Number(button.dataset.page);
      render();
      $('#ranking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function renderCategoryBars() {
    const holder = $('#categoryBars');
    const rows = (data.categories || []).slice().sort((a, b) => num(b.monthlySales) - num(a.monthlySales)).slice(0, 8);
    const max = Math.max(1, ...rows.map((row) => num(row.monthlySales)));
    holder.innerHTML = rows.map((row) => {
      const name = row.category || '未分类';
      const width = Math.max(4, num(row.monthlySales) / max * 100);
      return `<div class="bar-row category-bar" data-category="${escapeHtml(name)}" title="筛选 ${escapeHtml(name)}">
        <span class="bar-label">${escapeHtml(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span class="bar-value">${formatCompact(row.monthlySales)}</span>
      </div>`;
    }).join('');
    $$('.category-bar').forEach((bar) => bar.addEventListener('click', () => {
      const category = bar.dataset.category;
      $('#categoryFilter').value = category;
      state.category = category;
      state.page = 1;
      render();
      $('#ranking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function renderKeywordBars() {
    const holder = $('#keywordBars');
    const rows = (data.keywords || []).slice().sort((a, b) => num(b.traffic) - num(a.traffic)).slice(0, 8);
    const max = Math.max(1, ...rows.map((row) => num(row.traffic)));
    holder.innerHTML = rows.map((row) => {
      const width = Math.max(4, num(row.traffic) / max * 100);
      return `<div class="bar-row"><span class="bar-label" title="${escapeHtml(row.keyword)}">${escapeHtml(row.keyword)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span class="bar-value">${formatCompact(row.traffic)}</span></div>`;
    }).join('');
  }

  function renderScatter() {
    const svg = $('#scatterChart');
    const rows = (data.products || []).slice().sort((a, b) => num(b.recentSales) - num(a.recentSales)).slice(0, 70);
    const width = 760;
    const height = 330;
    const pad = { left: 48, right: 18, top: 20, bottom: 40 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const maxX = Math.max(1, ...rows.map((row) => Math.log10(num(row.recentSales) + 1)));
    const maxY = Math.max(1, ...rows.map((row) => Math.log10(num(row.totalSales) + 1)));
    const x = (value) => pad.left + (Math.log10(num(value) + 1) / maxX) * innerW;
    const y = (value) => pad.top + innerH - (Math.log10(num(value) + 1) / maxY) * innerH;
    const circles = rows.map((row) => {
      const cx = x(row.recentSales);
      const cy = y(row.totalSales);
      const radius = row.hotNew ? 5.5 : 4;
      const fill = row.hotNew ? '#ff754c' : '#8bd8cd';
      return `<circle class="scatter-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius}" fill="${fill}"><title>${escapeHtml(row.title)}\n总销量 ${formatNumber(row.totalSales)} · 近30天 ${formatNumber(row.recentSales)}</title></circle>`;
    }).join('');
    svg.innerHTML = `<line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}"/><line class="axis-line" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}"/>
      <line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH * .5}" x2="${width - pad.right}" y2="${pad.top + innerH * .5}" opacity=".35"/>
      <text class="axis-text" x="${pad.left}" y="${height - 12}">近30天销量 · log</text><text class="axis-text" x="${pad.left + innerW - 84}" y="${height - 12}">HIGH →</text>
      <text class="axis-text" x="8" y="${pad.top + 5}">累计销量</text><text class="axis-text" x="14" y="${pad.top + innerH - 3}">LOW</text>${circles}`;
  }

  function render() {
    filterProducts();
    renderProductRows();
    renderPagination();
    $$('.segment').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function bindEvents() {
    $$('.segment').forEach((button) => button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      state.page = 1;
      render();
    }));
    $('#productSearch').addEventListener('input', (event) => {
      state.query = event.target.value;
      state.page = 1;
      render();
    });
    $('#categoryFilter').addEventListener('change', (event) => {
      state.category = event.target.value;
      state.page = 1;
      render();
    });
    $('#sourceFilter').addEventListener('change', (event) => {
      state.source = event.target.value;
      state.page = 1;
      render();
    });
    $('#minRecent').addEventListener('input', (event) => {
      state.minRecent = Math.max(0, num(event.target.value));
      state.page = 1;
      render();
    });
    $('#resetFilters').addEventListener('click', () => {
      state.mode = 'sales';
      state.query = '';
      state.category = 'ALL';
      state.source = 'ALL';
      state.minRecent = 0;
      state.page = 1;
      $('#productSearch').value = '';
      $('#categoryFilter').value = 'ALL';
      $('#sourceFilter').value = 'ALL';
      $('#minRecent').value = '0';
      render();
    });
  }

  renderMetrics();
  populateCategoryFilter();
  renderCategoryBars();
  renderKeywordBars();
  renderScatter();
  bindEvents();
  render();
})();
