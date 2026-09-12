(() => {
  "use strict";

  const documents = Array.isArray(window.MD_DOCUMENTS) ? window.MD_DOCUMENTS : [];
  const STORAGE_KEY = "norm-law-reader:v1";
  const PROGRESS_KEY = "norm-law-reader:progress:v1";
  const mediaDark = window.matchMedia("(prefers-color-scheme: dark)");

  const icons = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20M8 7h7M8 11h8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15.2A8 8 0 0 1 8.8 4a8 8 0 1 0 11.2 11.2Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>',
    top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6M12 8v11"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };

  const preferences = readJson(STORAGE_KEY, {});
  const savedProgress = readJson(PROGRESS_KEY, {});
  const params = new URLSearchParams(location.search);
  const requestedId = params.get("doc");
  const defaultDoc = documents.find((doc) => doc.file.includes("수리모델에서의 법")) || documents[0];

  const state = {
    currentId: documents.some((doc) => doc.id === requestedId)
      ? requestedId
      : documents.some((doc) => doc.id === preferences.lastDoc)
        ? preferences.lastDoc
        : defaultDoc?.id,
    query: "",
    filter: "전체",
    theme: preferences.theme || "system",
    font: preferences.font || "serif",
    fontSize: clamp(Number(preferences.fontSize) || 17.2, 16, 24),
    leading: preferences.leading === "compact" ? "compact" : "relaxed",
    drawer: null,
    installPrompt: null,
    scrollTicking: false,
    activeHeading: null
  };

  const groupOrder = ["영미 논문", "후지타 연구선", "이이다 연구", "서평"];
  const filters = ["전체", ...groupOrder];
  const app = document.getElementById("app");

  if (!documents.length) {
    app.innerHTML = '<main class="reader"><p class="boot-message">불러올 문서가 없습니다. 먼저 동기화 스크립트를 실행해 주세요.</p></main>';
    return;
  }

  mountShell();
  applyPreferences();
  renderLibrary();
  renderDocument({ restorePosition: true, replaceHistory: true });
  bindGlobalEvents();
  registerPwa();

  function mountShell() {
    app.innerHTML = `
      <aside class="library" aria-label="문서함">
        <div class="brand">
          <span class="brand-mark">${icons.book}</span>
          <div class="brand-copy">
            <strong>규범과 법</strong>
            <span>연구 문서함</span>
          </div>
          <button class="icon-button library-close" type="button" aria-label="문서함 닫기">${icons.close}</button>
        </div>
        <div class="library-tools">
          <label class="search-wrap">
            <span class="sr-only">문서 검색</span>
            ${icons.search}
            <input class="search-input" type="search" autocomplete="off" placeholder="제목·저자·본문 검색" />
            <button class="search-clear" type="button" aria-label="검색어 지우기" hidden>${icons.close}</button>
          </label>
          <div class="filter-row" aria-label="연구선 필터"></div>
        </div>
        <div class="library-summary" aria-live="polite"></div>
        <nav class="doc-list" aria-label="Markdown 문서 목록"></nav>
        <footer class="library-footer">
          <span>${documents.length}편 수록</span>
          <span class="offline-state" data-online="${navigator.onLine}">${navigator.onLine ? "동기화됨" : "오프라인"}</span>
        </footer>
      </aside>
      <main class="reader">
        <div class="reader-progress" aria-hidden="true"></div>
        <header class="reader-toolbar">
          <button class="icon-button mobile-menu" type="button" aria-label="문서함 열기">${icons.menu}</button>
          <div class="toolbar-title">
            <span>읽는 중</span>
            <strong></strong>
          </div>
          <div class="toolbar-actions">
            <button class="text-button install-button" type="button" hidden>${icons.download}<span class="button-label">앱 설치</span></button>
            <button class="icon-button theme-trigger" type="button" aria-label="화면 테마 전환">${icons.moon}</button>
            <button class="icon-button settings-trigger" type="button" aria-label="읽기 설정 열기">${icons.settings}</button>
          </div>
        </header>
        <div class="reading-layout">
          <section class="article-scroll" tabindex="0" aria-label="문서 본문">
            <article class="article-wrap">
              <header class="article-header"></header>
              <div class="markdown-body"></div>
              <nav class="article-pager" aria-label="이전·다음 문서"></nav>
            </article>
          </section>
          <aside class="toc-panel" aria-label="이 문서의 목차">
            <div class="toc-inner">
              <p class="toc-heading">이 문서의 목차</p>
              <nav class="toc-list"></nav>
            </div>
          </aside>
        </div>
        <nav class="mobile-bottom-bar" aria-label="모바일 읽기 도구">
          <button class="bottom-button open-library" type="button">${icons.book}<span>문서함</span></button>
          <button class="bottom-button open-toc" type="button">${icons.list}<span>목차</span></button>
          <button class="bottom-button toggle-theme" type="button">${icons.moon}<span>테마</span></button>
          <button class="bottom-button settings-trigger" type="button">${icons.settings}<span>설정</span></button>
          <button class="bottom-button scroll-top" type="button">${icons.top}<span>맨 위</span></button>
        </nav>
      </main>
      <button class="drawer-backdrop" type="button" aria-label="패널 닫기"></button>
      <aside class="settings-panel" aria-label="읽기 설정" aria-hidden="true">
        <div class="panel-head">
          <h2>읽기 설정</h2>
          <button class="icon-button close-panel" type="button" aria-label="설정 닫기">${icons.close}</button>
        </div>
        <section class="setting-group">
          <div class="setting-label"><span>화면</span></div>
          <div class="segmented" data-setting="theme">
            <button class="segment-button" type="button" data-value="system">자동</button>
            <button class="segment-button" type="button" data-value="light">밝게</button>
            <button class="segment-button" type="button" data-value="dark">어둡게</button>
          </div>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>본문 글꼴</span></div>
          <div class="segmented two" data-setting="font">
            <button class="segment-button" type="button" data-value="serif">명조</button>
            <button class="segment-button" type="button" data-value="sans">고딕</button>
          </div>
        </section>
        <section class="setting-group">
          <label class="setting-label" for="font-size"><span>글자 크기</span><span class="setting-value font-size-value"></span></label>
          <div class="range-row"><span>가</span><input id="font-size" type="range" min="16" max="24" step="1" /><span style="font-size:1.35rem">가</span></div>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>줄 간격</span></div>
          <div class="segmented two" data-setting="leading">
            <button class="segment-button" type="button" data-value="compact">촘촘하게</button>
            <button class="segment-button" type="button" data-value="relaxed">여유롭게</button>
          </div>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>오프라인 읽기</span></div>
          <p class="install-tip">한 번 연 문서는 연결이 끊겨도 읽을 수 있습니다. Android Chrome은 상단의 설치 버튼을, iPhone Safari는 공유 메뉴의 ‘홈 화면에 추가’를 사용하세요.</p>
        </section>
      </aside>
      <aside class="mobile-toc" aria-label="모바일 목차" aria-hidden="true">
        <div class="panel-head">
          <h2>이 문서의 목차</h2>
          <button class="icon-button close-panel" type="button" aria-label="목차 닫기">${icons.close}</button>
        </div>
        <nav class="mobile-toc-list"></nav>
      </aside>
      <div class="toast" role="status" aria-live="polite"></div>
    `;
  }

  function renderLibrary() {
    const filterRow = app.querySelector(".filter-row");
    filterRow.innerHTML = filters
      .map(
        (filter) =>
          `<button class="filter-chip" type="button" data-filter="${escapeAttribute(filter)}" aria-pressed="${state.filter === filter}">${filter === "영미 논문" ? "영미" : filter === "후지타 연구선" ? "후지타" : filter === "이이다 연구" ? "이이다" : filter}</button>`
      )
      .join("");

    const normalizedQuery = normalizeSearch(state.query);
    const visible = sortedDocuments().filter((doc) => {
      const groupMatches = state.filter === "전체" || doc.group === state.filter;
      const textMatches = !normalizedQuery || normalizeSearch(`${doc.title} ${doc.author} ${doc.content}`).includes(normalizedQuery);
      return groupMatches && textMatches;
    });

    app.querySelector(".library-summary").innerHTML = `<span>${visible.length}편</span><span>${state.query ? `“${escapeHtml(state.query)}” 검색` : "전체 문서"}</span>`;
    const list = app.querySelector(".doc-list");

    if (!visible.length) {
      list.innerHTML = '<p class="empty-library">일치하는 문서가 없습니다.<br />검색어를 줄이거나 다른 연구선을 선택해 보세요.</p>';
      return;
    }

    const byGroup = new Map();
    visible.forEach((doc) => {
      if (!byGroup.has(doc.group)) byGroup.set(doc.group, []);
      byGroup.get(doc.group).push(doc);
    });

    list.innerHTML = groupOrder
      .filter((group) => byGroup.has(group))
      .map(
        (group) => `
          <p class="group-label">${escapeHtml(group)}</p>
          ${byGroup
            .get(group)
            .map((doc) => {
              const progress = Math.round((Number(savedProgress[doc.id]) || 0) * 100);
              return `<button class="doc-card" type="button" data-doc-id="${escapeAttribute(doc.id)}" aria-current="${doc.id === state.currentId}">
                <span class="doc-card-title">${highlightText(doc.title, state.query)}</span>
                <span class="doc-card-meta"><span>${escapeHtml(doc.author)}</span><span>·</span><span>${doc.kind}</span></span>
                <span class="doc-progress-track" aria-hidden="true"><span class="doc-progress-value" style="--doc-progress:${progress}%"></span></span>
              </button>`;
            })
            .join("")}
        `
      )
      .join("");
  }

  function renderDocument({ restorePosition = false, replaceHistory = false } = {}) {
    const doc = currentDocument();
    if (!doc) return;
    preferences.lastDoc = doc.id;
    savePreferences();

    const toolbarTitle = app.querySelector(".toolbar-title strong");
    toolbarTitle.textContent = doc.title;
    document.title = `${doc.title} · 규범과 법`;

    const header = app.querySelector(".article-header");
    const readingMinutes = Math.max(1, Math.round((Number(doc.words) || 1) / 330));
    header.innerHTML = `
      <div class="article-eyebrow"><span>${escapeHtml(doc.group)}</span><span class="dot"></span><span>${escapeHtml(doc.kind)}</span></div>
      <h1 class="article-title">${escapeHtml(doc.title)}</h1>
      <div class="article-submeta">
        <span>${icons.file}${escapeHtml(doc.author)}</span>
        <span>${icons.clock}약 ${readingMinutes}분</span>
        <span>${escapeHtml(doc.file)}</span>
      </div>
    `;

    const withoutTitle = doc.content.replace(/^#\s+.+(?:\r?\n|$)/, "");
    const body = app.querySelector(".markdown-body");
    body.classList.toggle("font-sans", state.font === "sans");
    body.innerHTML = renderMarkdown(withoutTitle);
    decorateHeadings(body);
    renderTableOfContents(body);
    renderPager(doc);
    bindDocumentLinks(body);

    renderLibrary();
    updateThemeButtons();

    const url = new URL(location.href);
    url.searchParams.set("doc", doc.id);
    history[replaceHistory ? "replaceState" : "pushState"]({ docId: doc.id }, "", url);

    const scroller = app.querySelector(".article-scroll");
    requestAnimationFrame(() => {
      if (restorePosition) {
        const ratio = clamp(Number(savedProgress[doc.id]) || 0, 0, 1);
        scroller.scrollTop = ratio * Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      } else {
        scroller.scrollTop = 0;
      }
      updateReadingProgress();
      updateActiveHeading();
      scroller.focus({ preventScroll: true });
    });
  }

  function renderPager(doc) {
    const ordered = sortedDocuments();
    const index = ordered.findIndex((item) => item.id === doc.id);
    const previous = index > 0 ? ordered[index - 1] : null;
    const next = index < ordered.length - 1 ? ordered[index + 1] : null;
    const pager = app.querySelector(".article-pager");
    pager.innerHTML = `
      ${previous ? `<button type="button" data-doc-id="${escapeAttribute(previous.id)}" class="pager-link previous">${icons.chevronLeft}<span><small>이전 글</small><strong>${escapeHtml(previous.title)}</strong></span></button>` : '<span></span>'}
      ${next ? `<button type="button" data-doc-id="${escapeAttribute(next.id)}" class="pager-link next"><span><small>다음 글</small><strong>${escapeHtml(next.title)}</strong></span>${icons.chevronRight}</button>` : '<span></span>'}
    `;
  }

  function renderTableOfContents(body) {
    const headings = [...body.querySelectorAll("h2, h3")];
    const markup = headings.length
      ? headings
          .map(
            (heading) =>
              `<a class="toc-link level-${heading.tagName === "H2" ? 2 : 3}" href="#${encodeURIComponent(heading.id)}" data-heading-id="${escapeAttribute(heading.id)}">${escapeHtml(heading.textContent)}</a>`
          )
          .join("")
      : '<p class="setting-value">목차가 없습니다.</p>';
    app.querySelector(".toc-list").innerHTML = markup;
    app.querySelector(".mobile-toc-list").innerHTML = markup;
  }

  function decorateHeadings(body) {
    const counts = new Map();
    body.querySelectorAll("h2, h3, h4, h5, h6").forEach((heading) => {
      const base = slugify(heading.textContent) || "section";
      const count = (counts.get(base) || 0) + 1;
      counts.set(base, count);
      heading.id = count === 1 ? base : `${base}-${count}`;
    });
  }

  function bindDocumentLinks(body) {
    body.querySelectorAll("a[data-doc-file]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const file = link.dataset.docFile;
        const target = documents.find((doc) => doc.file === file || doc.file === decodeURIComponentSafe(file));
        if (!target) {
          showToast("연결된 문서를 찾지 못했습니다.");
          return;
        }
        selectDocument(target.id);
      });
    });
  }

  function selectDocument(id, { restorePosition = true, replaceHistory = false } = {}) {
    if (!documents.some((doc) => doc.id === id)) return;
    state.currentId = id;
    renderDocument({ restorePosition, replaceHistory });
    closeDrawers();
  }

  function bindGlobalEvents() {
    const searchInput = app.querySelector(".search-input");
    const searchClear = app.querySelector(".search-clear");
    const scroller = app.querySelector(".article-scroll");

    searchInput.addEventListener("input", () => {
      state.query = searchInput.value.trim();
      searchClear.hidden = !state.query;
      renderLibrary();
    });

    searchClear.addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      searchClear.hidden = true;
      searchInput.focus();
      renderLibrary();
    });

    app.addEventListener("click", (event) => {
      const docButton = event.target.closest("[data-doc-id]");
      if (docButton) {
        selectDocument(docButton.dataset.docId);
        return;
      }

      const filter = event.target.closest("[data-filter]");
      if (filter) {
        state.filter = filter.dataset.filter;
        renderLibrary();
        return;
      }

      const tocLink = event.target.closest("[data-heading-id]");
      if (tocLink) {
        event.preventDefault();
        const heading = document.getElementById(tocLink.dataset.headingId);
        heading?.scrollIntoView({ behavior: "smooth", block: "start" });
        closeDrawers();
        return;
      }

      if (event.target.closest(".mobile-menu, .open-library")) openDrawer("library");
      if (event.target.closest(".open-toc")) openDrawer("toc");
      if (event.target.closest(".settings-trigger")) openDrawer("settings");
      if (event.target.closest(".library-close, .close-panel, .drawer-backdrop")) closeDrawers();
      if (event.target.closest(".theme-trigger, .toggle-theme")) toggleTheme();
      if (event.target.closest(".scroll-top")) scroller.scrollTo({ top: 0, behavior: "smooth" });
      if (event.target.closest(".install-button")) installApp();

      const settingButton = event.target.closest(".segment-button");
      if (settingButton) updateSetting(settingButton.closest("[data-setting]").dataset.setting, settingButton.dataset.value);
    });

    app.querySelector("#font-size").addEventListener("input", (event) => {
      state.fontSize = Number(event.target.value);
      applyPreferences();
      savePreferences();
    });

    scroller.addEventListener("scroll", () => {
      if (state.scrollTicking) return;
      state.scrollTicking = true;
      requestAnimationFrame(() => {
        updateReadingProgress();
        updateActiveHeading();
        state.scrollTicking = false;
      });
    }, { passive: true });

    window.addEventListener("popstate", (event) => {
      const id = event.state?.docId || new URLSearchParams(location.search).get("doc");
      if (id && id !== state.currentId) selectDocument(id, { restorePosition: true, replaceHistory: true });
    });

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      app.querySelector(".install-button").hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      app.querySelector(".install-button").hidden = true;
      showToast("홈 화면에 설치했습니다.");
    });

    mediaDark.addEventListener("change", () => {
      if (state.theme === "system") applyPreferences();
    });

    document.addEventListener("keydown", (event) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        if (innerWidth <= 780) openDrawer("library");
        requestAnimationFrame(() => searchInput.focus());
      }
      if (event.key === "Escape") closeDrawers();
    });
  }

  function updateSetting(setting, value) {
    if (setting === "theme" && ["system", "light", "dark"].includes(value)) state.theme = value;
    if (setting === "font" && ["serif", "sans"].includes(value)) state.font = value;
    if (setting === "leading" && ["compact", "relaxed"].includes(value)) state.leading = value;
    applyPreferences();
    savePreferences();
  }

  function applyPreferences() {
    const resolvedTheme = state.theme === "system" ? (mediaDark.matches ? "dark" : "light") : state.theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.setProperty("--reader-size", `${state.fontSize / 16}rem`);
    document.documentElement.style.setProperty("--reader-leading", state.leading === "compact" ? "1.68" : "1.86");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "dark" ? "#0b1020" : "#111d3b");

    const body = app.querySelector(".markdown-body");
    body?.classList.toggle("font-sans", state.font === "sans");
    const slider = app.querySelector("#font-size");
    if (slider) slider.value = String(Math.round(state.fontSize));
    const sizeValue = app.querySelector(".font-size-value");
    if (sizeValue) sizeValue.textContent = `${Math.round(state.fontSize)}px`;
    app.querySelectorAll("[data-setting]").forEach((group) => {
      const setting = group.dataset.setting;
      group.querySelectorAll(".segment-button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.value === state[setting]));
      });
    });
    updateThemeButtons();
  }

  function updateThemeButtons() {
    const dark = document.documentElement.dataset.theme === "dark";
    app.querySelectorAll(".theme-trigger, .toggle-theme").forEach((button) => {
      const svg = dark ? icons.sun : icons.moon;
      const label = button.querySelector("span");
      button.innerHTML = `${svg}${label ? `<span>${label.textContent}</span>` : ""}`;
      button.setAttribute("aria-label", dark ? "밝은 화면으로 전환" : "어두운 화면으로 전환");
    });
  }

  function toggleTheme() {
    const currentlyDark = document.documentElement.dataset.theme === "dark";
    state.theme = currentlyDark ? "light" : "dark";
    applyPreferences();
    savePreferences();
  }

  function updateReadingProgress() {
    const scroller = app.querySelector(".article-scroll");
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const ratio = max ? clamp(scroller.scrollTop / max, 0, 1) : 1;
    app.querySelector(".reader-progress").style.setProperty("--reading-progress", `${(ratio * 100).toFixed(2)}%`);
    savedProgress[state.currentId] = ratio;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(savedProgress));
    } catch (_) {
      // Reading remains usable when storage is unavailable.
    }

    const cardProgress = app.querySelector(`.doc-card[data-doc-id="${cssEscape(state.currentId)}"] .doc-progress-value`);
    cardProgress?.style.setProperty("--doc-progress", `${Math.round(ratio * 100)}%`);
  }

  function updateActiveHeading() {
    const scroller = app.querySelector(".article-scroll");
    const headings = [...app.querySelectorAll(".markdown-body h2, .markdown-body h3")];
    if (!headings.length) return;
    const scrollerTop = scroller.getBoundingClientRect().top;
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - scrollerTop <= 120) active = heading;
      else break;
    }
    if (active.id === state.activeHeading) return;
    state.activeHeading = active.id;
    app.querySelectorAll(".toc-link").forEach((link) => {
      link.setAttribute("aria-current", String(link.dataset.headingId === active.id));
    });
  }

  function openDrawer(drawer) {
    state.drawer = drawer;
    const library = app.querySelector(".library");
    const settings = app.querySelector(".settings-panel");
    const toc = app.querySelector(".mobile-toc");
    library.dataset.open = String(drawer === "library");
    settings.dataset.open = String(drawer === "settings");
    toc.dataset.open = String(drawer === "toc");
    settings.setAttribute("aria-hidden", String(drawer !== "settings"));
    toc.setAttribute("aria-hidden", String(drawer !== "toc"));
    app.querySelector(".drawer-backdrop").dataset.open = "true";
    document.body.style.overflow = "hidden";
  }

  function closeDrawers() {
    state.drawer = null;
    app.querySelector(".library").dataset.open = "false";
    app.querySelector(".settings-panel").dataset.open = "false";
    app.querySelector(".mobile-toc").dataset.open = "false";
    app.querySelector(".settings-panel").setAttribute("aria-hidden", "true");
    app.querySelector(".mobile-toc").setAttribute("aria-hidden", "true");
    app.querySelector(".drawer-backdrop").dataset.open = "false";
    document.body.style.overflow = "";
  }

  async function installApp() {
    if (state.installPrompt) {
      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      app.querySelector(".install-button").hidden = true;
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    showToast(isiOS ? "Safari 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요." : "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.");
  }

  function updateOnlineState() {
    const badge = app.querySelector(".offline-state");
    badge.dataset.online = String(navigator.onLine);
    badge.textContent = navigator.onLine ? "동기화됨" : "오프라인";
  }

  function registerPwa() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        showToast("오프라인 저장을 준비하지 못했습니다. 온라인 읽기는 계속 가능합니다.");
      });
    }
  }

  function showToast(message) {
    const toast = app.querySelector(".toast");
    toast.textContent = message;
    toast.dataset.show = "true";
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.dataset.show = "false";
    }, 3200);
  }

  function sortedDocuments() {
    return [...documents].sort((a, b) => {
      const groupDifference = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
      if (groupDifference) return groupDifference;
      if (a.group === "후지타 연구선") {
        const fujitaOrder = ["초고본", "게재본", "사적 형성", "생성과 변화"];
        const rank = (doc) => {
          if (doc.file.includes("초고본")) return 0;
          if (doc.file.includes("게재본")) return 1;
          if (doc.file.includes("사적 형성")) return 2;
          if (doc.file.includes("생성과 변화")) return 3;
          return fujitaOrder.length;
        };
        const difference = rank(a) - rank(b);
        if (difference) return difference;
      }
      return a.title.localeCompare(b.title, "ko");
    });
  }

  function currentDocument() {
    return documents.find((doc) => doc.id === state.currentId) || documents[0];
  }

  function savePreferences() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastDoc: state.currentId,
          theme: state.theme,
          font: state.font,
          fontSize: state.fontSize,
          leading: state.leading
        })
      );
    } catch (_) {
      // Preferences are optional.
    }
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^```/.test(line.trim())) {
        const language = line.trim().slice(3).trim();
        const code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          code.push(lines[index]);
          index += 1;
        }
        index += 1;
        output.push(`<pre${language ? ` data-language="${escapeAttribute(language)}"` : ""}><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = Math.max(2, heading[1].length);
        output.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^\s*---+\s*$/.test(line)) {
        output.push("<hr />");
        index += 1;
        continue;
      }

      if (line.trim().startsWith("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
        const headers = splitTableRow(line);
        index += 2;
        const rows = [];
        while (index < lines.length && lines[index].trim().startsWith("|")) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        output.push(`<div class="table-scroll" tabindex="0"><table><thead><tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || "")}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`);
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        output.push(`<blockquote>${quote.map((item) => `<p>${renderInline(item)}</p>`).join("")}</blockquote>`);
        continue;
      }

      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
      if (unordered) {
        const items = [];
        while (index < lines.length) {
          const match = lines[index].match(/^\s*[-*+]\s+(.+)$/);
          if (!match) break;
          items.push(match[1]);
          index += 1;
        }
        output.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
        continue;
      }

      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (ordered) {
        const items = [];
        while (index < lines.length) {
          const match = lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
          if (!match) break;
          items.push(match[1]);
          index += 1;
        }
        output.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
        continue;
      }

      const paragraph = [line.trim()];
      index += 1;
      while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    }

    return output.join("\n");
  }

  function isBlockStart(lines, index) {
    const line = lines[index];
    if (/^(#{1,6})\s+/.test(line)) return true;
    if (/^```/.test(line.trim())) return true;
    if (/^\s*---+\s*$/.test(line)) return true;
    if (/^>\s?/.test(line)) return true;
    if (/^\s*[-*+]\s+/.test(line)) return true;
    if (/^\s*\d+[.)]\s+/.test(line)) return true;
    if (line.trim().startsWith("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) return true;
    return false;
  }

  function renderInline(value) {
    const tokens = [];
    const stash = (html) => {
      const marker = `\u0000TOKEN${tokens.length}\u0000`;
      tokens.push(html);
      return marker;
    };

    let text = String(value);
    text = text.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
    text = text.replace(/\[([^\]]+)]\(<\.\/([^>]+\.md)>\)/g, (_, label, file) =>
      stash(`<a href="?doc=${encodeURIComponent(file)}" data-doc-file="${escapeAttribute(file)}">${escapeHtml(label)}</a>`)
    );
    text = text.replace(/\[([^\]]+)]\((\.\/.*?\.md)\)/g, (_, label, path) => {
      const file = decodeURIComponentSafe(path.replace(/^\.\//, ""));
      return stash(`<a href="?doc=${encodeURIComponent(file)}" data-doc-file="${escapeAttribute(file)}">${escapeHtml(label)}</a>`);
    });
    text = text.replace(/\[([^\]]+)]\(([^/)][^)]*?\.md)\)/g, (_, label, path) => {
      const file = decodeURIComponentSafe(path);
      return stash(`<a href="?doc=${encodeURIComponent(file)}" data-doc-file="${escapeAttribute(file)}">${escapeHtml(label)}</a>`);
    });
    text = text.replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, (_, label, url) =>
      stash(`<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`)
    );

    text = escapeHtml(text);
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    text = text.replace(/(^|\s)(https?:\/\/[^\s&lt;]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    tokens.forEach((token, index) => {
      text = text.replace(`\u0000TOKEN${index}\u0000`, token);
    });
    return text;
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const safe = escapeHtml(text);
    const escapedQuery = escapeRegExp(escapeHtml(query));
    return safe.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
  }

  function normalizeSearch(value) {
    return String(value).toLocaleLowerCase("ko").replace(/\s+/g, " ").trim();
  }

  function slugify(value) {
    return value
      .toLocaleLowerCase("ko")
      .replace(/<[^>]+>/g, "")
      .replace(/[^가-힣a-z0-9一-龠ぁ-んァ-ヶ]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function decodeURIComponentSafe(value) {
    try {
      return decodeURIComponent(value);
    } catch (_) {
      return value;
    }
  }

  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
