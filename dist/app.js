(() => {
  "use strict";

  const documents = Array.isArray(window.MD_DOCUMENTS) ? window.MD_DOCUMENTS : [];
  const genealogy = window.LAW_GENEALOGY || { eras: [], schools: [], lineages: [], debates: [], people: [], questions: [] };
  const genealogySignatures = window.LAW_GENEALOGY_SIGNATURES || {};
  const genealogySections = ["overview", "lineages", "eras", "debates", "people"];
  const peoplePerPage = 9;
  const STORAGE_KEY = "norm-law-reader:v1";
  const PROGRESS_KEY = "norm-law-reader:progress:v1";
  const HIGHLIGHTS_KEY = "norm-law-reader:highlights:v1";
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
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    highlighter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15.5 4.5 4 4L10 18H6v-4l9.5-9.5Z"/><path d="m13.5 6.5 4 4M4 21h16"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 6 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5V6Z"/><path d="M8.5 3.5v14M15.5 6v14"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5"/><circle cx="17.5" cy="9" r="2.2"/><path d="M15.5 14.5c3.1-.7 5 .7 5.5 3.5"/></svg>',
    balance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v17M6 20h12M5 6h14M7 6l-4 7h8L7 6Zm10 0-4 7h8l-4-7Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>'
  };

  const preferences = readJson(STORAGE_KEY, {});
  const savedProgress = readJson(PROGRESS_KEY, {});
  const savedHighlights = readJson(HIGHLIGHTS_KEY, {});
  const savedFontSize = Number(preferences.fontSize);
  const readableFontSize = !Number.isFinite(savedFontSize) || savedFontSize <= 17.2 ? 19 : savedFontSize;
  const params = new URLSearchParams(location.search);
  const requestedId = params.get("doc");
  const requestedView = params.get("view") === "genealogy" ? "genealogy" : "reader";
  const requestedGenealogySection = genealogySections.includes(params.get("section")) ? params.get("section") : "overview";
  const requestedGenealogyPerson = genealogy.people.some((person) => person.id === params.get("person")) ? params.get("person") : null;
  const requestedGenealogyPage = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  const requestedGenealogyEra = genealogy.eras.some((era) => era.id === params.get("era")) ? params.get("era") : "전체";
  const requestedGenealogySchool = genealogy.schools.some((school) => school.id === params.get("school")) ? params.get("school") : "전체";
  const defaultDoc = documents.find((doc) => doc.file.includes("수리모델에서의 법")) || documents[0];

  const state = {
    currentId: documents.some((doc) => doc.id === requestedId)
      ? requestedId
      : documents.some((doc) => doc.id === preferences.lastDoc)
        ? preferences.lastDoc
        : defaultDoc?.id,
    view: requestedView,
    query: "",
    filter: "전체",
    genealogyQuery: params.get("q") || "",
    genealogyEra: requestedGenealogyEra,
    genealogySchool: requestedGenealogySchool,
    genealogySection: requestedGenealogyPerson ? "people" : requestedGenealogySection,
    genealogyPersonId: requestedGenealogyPerson,
    genealogyPeoplePage: requestedGenealogyPage,
    theme: preferences.theme || "system",
    font: preferences.font || "serif",
    fontSize: clamp(readableFontSize, 18, 30),
    leading: preferences.leading === "compact" ? "compact" : "relaxed",
    drawer: null,
    installPrompt: null,
    scrollTicking: false,
    activeHeading: null,
    pendingHighlight: null,
    pageOffsets: [0],
    currentPage: 0,
    pageLayoutFrame: null,
    pageTurnTimer: null,
    pageTurnLocked: false,
    resizeTimer: null,
    resizeProgress: null
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
  renderGenealogy();
  setView(state.view, { replaceHistory: true });
  bindGlobalEvents();
  registerPwa();

  function mountShell() {
    app.innerHTML = `
      <aside class="library" aria-label="문서함">
        <div class="brand">
          <span class="brand-mark">${icons.book}</span>
          <div class="brand-copy">
            <strong>규범과 법</strong>
            <span class="brand-context">연구 문서함</span>
          </div>
          <button class="icon-button library-close" type="button" aria-label="문서함 닫기">${icons.close}</button>
        </div>
        <nav class="primary-tabs" aria-label="자료 유형">
          <button class="primary-tab" type="button" data-app-view="reader" aria-selected="true">${icons.book}<span>연구 문서</span></button>
          <button class="primary-tab" type="button" data-app-view="genealogy" aria-selected="false">${icons.map}<span>법철학 계보</span></button>
        </nav>
        <div class="library-pane documents-pane">
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
        </div>
        <div class="library-pane genealogy-pane" aria-hidden="true">
          <div class="genealogy-sidebar-summary">
            <strong>고대에서 현대까지</strong>
            <span>${genealogy.lineages.length}개 계보 · ${genealogy.eras.length}개 시대 · ${genealogy.people.length}명</span>
          </div>
          <nav class="genealogy-sidebar-nav" aria-label="계보 섹션">
            <button type="button" data-genealogy-section="overview"><span>01</span>관점</button>
            <button type="button" data-genealogy-section="lineages"><span>02</span>큰 계보</button>
            <button type="button" data-genealogy-section="eras"><span>03</span>시대</button>
            <button type="button" data-genealogy-section="debates"><span>04</span>대립</button>
            <button type="button" data-genealogy-section="people"><span>05</span>인물</button>
          </nav>
          <div class="relation-legend" aria-label="관계 표기 설명">
            <p>관계 읽는 법</p>
            <span><i class="legend-line mentor"></i>사제·학파</span>
            <span><i class="legend-line influence"></i>영향·계승</span>
            <span><i class="legend-line conflict"></i>비판·충돌</span>
          </div>
          <footer class="library-footer">
            <span>서양 법철학 중심</span>
            <span class="offline-state" data-online="${navigator.onLine}">${navigator.onLine ? "동기화됨" : "오프라인"}</span>
          </footer>
        </div>
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
            <button class="text-button highlight-trigger desktop-highlight" type="button" aria-label="선택한 문장에 형광펜 표시">${icons.highlighter}<span class="button-label">형광펜</span></button>
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
            <div class="page-scroll-spacer" aria-hidden="true"></div>
          </section>
          <nav class="page-turner" aria-label="책장 넘기기">
            <button class="page-turn-button page-previous" type="button" aria-label="이전 쪽">${icons.chevronLeft}<span>이전 쪽</span></button>
            <output class="page-counter" aria-live="polite" aria-atomic="true">1 / 1쪽</output>
            <button class="page-turn-button page-next" type="button" aria-label="다음 쪽"><span>다음 쪽</span>${icons.chevronRight}</button>
          </nav>
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
          <button class="bottom-button highlight-trigger" type="button" aria-label="선택한 문장에 형광펜 표시">${icons.highlighter}<span>형광펜</span></button>
          <button class="bottom-button toggle-theme" type="button">${icons.moon}<span>테마</span></button>
          <button class="bottom-button settings-trigger" type="button">${icons.settings}<span>설정</span></button>
          <button class="bottom-button scroll-top" type="button">${icons.top}<span>첫 쪽</span></button>
        </nav>
        <section class="genealogy-view" aria-label="법철학 계보"></section>
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
          <div class="range-row"><span>가</span><input id="font-size" type="range" min="18" max="30" step="1" /><span style="font-size:1.55rem">가</span></div>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>줄 간격</span></div>
          <div class="segmented two" data-setting="leading">
            <button class="segment-button" type="button" data-value="compact">촘촘하게</button>
            <button class="segment-button" type="button" data-value="relaxed">여유롭게</button>
          </div>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>책장 넘기기</span><span class="setting-value">화살표 방식</span></div>
          <p class="install-tip">아래의 좌우 화살표로 한 쪽씩 넘깁니다. 컴퓨터에서는 방향키·Page Up·Page Down과 마우스 휠도 사용할 수 있습니다. 마지막 줄이 중간에서 잘리지 않도록 실제 줄 경계에 맞춰 다음 쪽을 시작합니다.</p>
        </section>
        <section class="setting-group">
          <div class="setting-label"><span>형광펜</span><span class="setting-value highlight-summary">표시 없음</span></div>
          <p class="install-tip">본문을 드래그해 선택한 뒤 ‘형광펜’을 누르세요. 표시된 구절을 다시 누르면 지워집니다. 형광펜은 이 기기에 자동 저장됩니다.</p>
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

  function renderGenealogy() {
    const view = app.querySelector(".genealogy-view");
    if (!view || !genealogy.people.length) return;
    const personById = new Map(genealogy.people.map((person) => [person.id, person]));
    view.innerHTML = `
      <header class="genealogy-toolbar">
        <button class="icon-button mobile-menu" type="button" aria-label="탐색 메뉴 열기">${icons.menu}</button>
        <div class="toolbar-title"><span>지식 지도</span><strong>${escapeHtml(genealogy.meta.title)}</strong></div>
        <div class="toolbar-actions">
          <button class="text-button install-button" type="button" hidden>${icons.download}<span class="button-label">앱 설치</span></button>
          <button class="icon-button theme-trigger" type="button" aria-label="화면 테마 전환">${icons.moon}</button>
        </div>
      </header>
      <div class="genealogy-scroll" tabindex="0">
        <div class="genealogy-inner">
          ${renderGenealogyStage(personById)}
          ${state.genealogyPersonId ? "" : renderGenealogyPager()}
        </div>
      </div>
      <nav class="genealogy-mobile-bar" aria-label="계보 화면 이동">
        <button class="bottom-button" type="button" data-genealogy-section="overview">${icons.map}<span>관점</span></button>
        <button class="bottom-button" type="button" data-genealogy-section="lineages">${icons.arrow}<span>계보</span></button>
        <button class="bottom-button" type="button" data-genealogy-section="eras">${icons.clock}<span>시대</span></button>
        <button class="bottom-button" type="button" data-genealogy-section="debates">${icons.balance}<span>대립</span></button>
        <button class="bottom-button" type="button" data-genealogy-section="people">${icons.people}<span>인물</span></button>
        <button class="bottom-button toggle-theme" type="button">${icons.moon}<span>테마</span></button>
      </nav>`;
    updateGenealogyResults({ syncUrl: false });
    updateGenealogyNavigation();
    updateThemeButtons();
    if (state.installPrompt) app.querySelectorAll(".install-button").forEach((button) => { button.hidden = false; });
    requestAnimationFrame(() => {
      const scroller = app.querySelector(".genealogy-scroll");
      if (scroller) scroller.scrollTop = 0;
    });
  }

  function renderGenealogyStage(personById) {
    if (state.genealogySection === "lineages") return renderLineagesStage(personById);
    if (state.genealogySection === "eras") return renderErasStage();
    if (state.genealogySection === "debates") return renderDebatesStage();
    if (state.genealogySection === "people") return state.genealogyPersonId ? renderPersonProfile(state.genealogyPersonId) : renderPeopleStage();
    return renderOverviewStage();
  }

  function renderOverviewStage() {
    return `
      <section class="genealogy-hero genealogy-stage" aria-labelledby="genealogy-overview-title">
        <div class="genealogy-kicker"><span>${escapeHtml(genealogy.meta.scope)}</span><i></i><span>${genealogy.people.length}명 · ${genealogy.debates.length}개 대립축</span></div>
        <div class="genealogy-title-row">
          <div><h1 id="genealogy-overview-title">${escapeHtml(genealogy.meta.title)}</h1><p>${escapeHtml(genealogy.meta.description)}</p></div>
          <div class="genealogy-compass" aria-hidden="true">${icons.balance}<span>법 · 정의 · 권력</span></div>
        </div>
        <div class="question-grid">${genealogy.questions.map((question) => `<article><span>${question.number}</span><h2>${escapeHtml(question.title)}</h2><p>${escapeHtml(question.text)}</p></article>`).join("")}</div>
        <div class="genealogy-entry-actions">
          <button type="button" data-genealogy-section="lineages"><span>계보부터 읽기</span>${icons.arrow}</button>
          <button type="button" data-genealogy-section="people"><span>인물 찾아보기</span>${icons.people}</button>
        </div>
        <p class="genealogy-reading-note"><strong>표기 원칙</strong> 화살표는 영향·계승을 뜻합니다. ‘직접 논쟁’이라고 표시하지 않은 대립은 후대의 비판 또는 구조적 대비일 수 있습니다.</p>
      </section>
      <footer class="genealogy-footer-note compact">
        <strong>읽기의 범위</strong>
        <p>법학 방법론과 정치철학을 함께 보여 주는 서양 중심의 입문 지도입니다. 시그니처 문장은 널리 알려진 번역을 간결하게 다듬었고, 개념은 등장한 논쟁 맥락과 함께 제시합니다.</p>
        <div><a href="https://plato.stanford.edu/entries/lawphil-nature/" target="_blank" rel="noreferrer">법의 본성</a><a href="https://plato.stanford.edu/entries/legal-positivism/" target="_blank" rel="noreferrer">법실증주의</a><a href="https://plato.stanford.edu/entries/natural-law-theories/" target="_blank" rel="noreferrer">자연법론</a><a href="https://iep.utm.edu/law-phil/" target="_blank" rel="noreferrer">법철학 개관</a></div>
      </footer>`;
  }

  function renderLineagesStage(personById) {
    const markup = genealogy.lineages.map((lineage, lineageIndex) => `
      <article class="lineage-track tone-${lineage.tone}">
        <header class="lineage-head"><span>${String(lineageIndex + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(lineage.title)}</h3><p>${escapeHtml(lineage.question)}</p></div></header>
        <div class="lineage-flow" aria-label="${escapeAttribute(lineage.title)} 영향 흐름">
          ${lineage.steps.map((step, stepIndex) => `
            <div class="lineage-stage"><div class="lineage-node-group">${step.map((id) => {
              const person = personById.get(id);
              return person ? `<button type="button" class="lineage-node" data-person-id="${escapeAttribute(id)}"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)}</span></button>` : "";
            }).join("")}</div>${stepIndex < lineage.steps.length - 1 ? `<span class="lineage-arrow" aria-hidden="true">${icons.arrow}</span>` : ""}</div>`).join("")}
        </div>
      </article>`).join("");
    return `<section class="genealogy-section genealogy-stage" aria-labelledby="lineages-title"><header class="section-heading"><div><span>02 · 큰 계보</span><h2 id="lineages-title">다섯 흐름을 먼저 잡기</h2></div><p>인물을 선택하면 시그니처 개념과 맥락을 포함한 상세 화면으로 이동합니다.</p></header><div class="lineage-board">${markup}</div></section>`;
  }

  function renderErasStage() {
    const markup = genealogy.eras.map((era, index) => {
      const people = genealogy.people.filter((person) => person.era === era.id);
      return `<article class="era-card"><div class="era-marker"><span>${String(index + 1).padStart(2, "0")}</span><i></i></div><div class="era-card-body"><div class="era-card-head"><div><p>${escapeHtml(era.range)}</p><h3>${escapeHtml(era.label)}</h3></div><span>${people.length}명</span></div><strong class="era-question">${escapeHtml(era.question)}</strong><p>${escapeHtml(era.summary)}</p><button type="button" class="era-people-link" data-era-filter="${escapeAttribute(era.id)}">${escapeHtml(people.slice(0, 5).map((person) => person.name).join(" · "))}${people.length > 5 ? " 외" : ""}${icons.arrow}</button></div></article>`;
    }).join("");
    return `<section class="genealogy-section genealogy-stage" aria-labelledby="eras-title"><header class="section-heading"><div><span>03 · 시대별</span><h2 id="eras-title">질문이 바뀐 순간들</h2></div><p>사상은 이전 시대를 지우지 않고 새로운 국가·재판·사회 문제 위에서 질문을 다시 배열합니다.</p></header><div class="era-timeline">${markup}</div></section>`;
  }

  function renderDebatesStage() {
    const markup = genealogy.debates.map((debate, index) => `<article class="debate-card"><div class="debate-index"><span>${String(index + 1).padStart(2, "0")}</span><em>${escapeHtml(debate.era)}</em></div><h3>${escapeHtml(debate.issue)}</h3><div class="debate-sides"><div><strong>${escapeHtml(debate.left)}</strong><p>${escapeHtml(debate.leftText)}</p></div><span class="versus">VS</span><div><strong>${escapeHtml(debate.right)}</strong><p>${escapeHtml(debate.rightText)}</p></div></div><p class="debate-relation">${escapeHtml(debate.relation)}</p></article>`).join("");
    return `<section class="genealogy-section genealogy-stage" aria-labelledby="debates-title"><header class="section-heading"><div><span>04 · 대립구도</span><h2 id="debates-title">논쟁으로 이해하는 법철학</h2></div><p>직접 충돌과 후대의 이론적 비판을 구분해 각 논쟁이 무엇을 갈라놓았는지 압축했습니다.</p></header><div class="debate-grid">${markup}</div></section>`;
  }

  function renderPeopleStage() {
    return `<section class="genealogy-section genealogy-stage people-section" aria-labelledby="people-title"><header class="section-heading"><div><span>05 · 인물별</span><h2 id="people-title">문장과 개념으로 기억하기</h2></div><p>한 쪽에 아홉 명씩 살펴보고, 인물을 열어 핵심 주장·저서·관계를 함께 읽을 수 있습니다.</p></header><div class="people-tools"><label class="genealogy-search-wrap">${icons.search}<span class="sr-only">법철학자 검색</span><input class="genealogy-search" type="search" autocomplete="off" placeholder="인물·개념·주장·저서·관계 검색" value="${escapeAttribute(state.genealogyQuery)}" /></label><div class="people-filter-block"><span>시대</span><div class="people-filter-row" data-filter-group="era"><button type="button" data-era-filter="전체" aria-pressed="true">전체</button>${genealogy.eras.map((era) => `<button type="button" data-era-filter="${escapeAttribute(era.id)}" aria-pressed="false">${escapeHtml(era.label)}</button>`).join("")}</div></div><div class="people-filter-block"><span>사조</span><div class="people-filter-row" data-filter-group="school"><button type="button" data-school-filter="전체" aria-pressed="true">전체</button>${genealogy.schools.map((school) => `<button type="button" data-school-filter="${escapeAttribute(school.id)}" aria-pressed="false">${escapeHtml(school.label)}</button>`).join("")}</div></div></div><div class="people-results-head"><strong class="people-result-count" aria-live="polite"></strong><button type="button" class="reset-genealogy-filters">필터 초기화</button></div><div class="people-grid"></div><nav class="people-pagination" aria-label="인물 목록 쪽 이동"></nav></section>`;
  }

  function renderPersonProfile(id) {
    const person = genealogy.people.find((item) => item.id === id);
    if (!person) return renderPeopleStage();
    const signature = genealogySignatures[person.id];
    const era = genealogy.eras.find((item) => item.id === person.era);
    const schools = person.schools.map((schoolId) => genealogy.schools.find((item) => item.id === schoolId)).filter(Boolean);
    const index = genealogy.people.indexOf(person);
    const previous = genealogy.people[index - 1];
    const next = genealogy.people[index + 1];
    return `<section class="person-profile genealogy-stage" aria-labelledby="person-profile-title"><button type="button" class="person-profile-back" data-people-list>${icons.chevronLeft}<span>인물 목록으로</span></button><article class="person-profile-card"><header class="person-profile-head"><div><span class="person-era">${escapeHtml(era?.label || "")}</span><h1 id="person-profile-title">${escapeHtml(person.name)}</h1><p>${escapeHtml(person.original)} · ${escapeHtml(person.years)}</p><div class="person-schools">${schools.map((school) => `<span>${escapeHtml(school.label)}</span>`).join("")}</div></div><span class="person-number">${String(index + 1).padStart(2, "0")} / ${genealogy.people.length}</span></header>${signature ? `<div class="signature-feature"><span>${escapeHtml(signature.kind)}</span><blockquote>${escapeHtml(signature.text)}</blockquote><p><strong>어떤 맥락인가</strong>${escapeHtml(signature.context)}</p></div>` : ""}<div class="person-profile-grid"><section><span>핵심 주장</span><strong>${escapeHtml(person.role)}</strong><p>${escapeHtml(person.claim)}</p></section><section><span>대표 저서</span><ul>${person.works.map((work) => `<li>${escapeHtml(work)}</li>`).join("")}</ul></section></div><section class="person-profile-relations"><span>관계와 논쟁</span><div>${person.relations.map((relation) => `<p class="relation-${relationTone(relation)}">${escapeHtml(relation)}</p>`).join("")}</div></section></article><nav class="person-neighbors" aria-label="앞뒤 인물">${previous ? `<button type="button" data-person-id="${escapeAttribute(previous.id)}">${icons.chevronLeft}<span><small>이전 인물</small><strong>${escapeHtml(previous.name)}</strong></span></button>` : `<span></span>`}${next ? `<button type="button" data-person-id="${escapeAttribute(next.id)}"><span><small>다음 인물</small><strong>${escapeHtml(next.name)}</strong></span>${icons.chevronRight}</button>` : `<span></span>`}</nav></section>`;
  }

  function renderGenealogyPager() {
    const labels = ["관점", "큰 계보", "시대", "대립", "인물"];
    const index = Math.max(0, genealogySections.indexOf(state.genealogySection));
    const previous = genealogySections[index - 1];
    const next = genealogySections[index + 1];
    return `<nav class="genealogy-pager" aria-label="계보 앞뒤 화면"><div>${previous ? `<button type="button" data-genealogy-section="${previous}">${icons.chevronLeft}<span><small>이전</small><strong>${labels[index - 1]}</strong></span></button>` : ""}</div><output>${String(index + 1).padStart(2, "0")} / ${String(genealogySections.length).padStart(2, "0")}</output><div>${next ? `<button type="button" data-genealogy-section="${next}"><span><small>다음</small><strong>${labels[index + 1]}</strong></span>${icons.chevronRight}</button>` : ""}</div></nav>`;
  }

  function filteredGenealogyPeople() {
    const query = normalizeSearch(state.genealogyQuery);
    return genealogy.people.filter((person) => {
      const eraMatches = state.genealogyEra === "전체" || person.era === state.genealogyEra;
      const schoolMatches = state.genealogySchool === "전체" || person.schools.includes(state.genealogySchool);
      const signature = genealogySignatures[person.id];
      const searchable = `${person.name} ${person.original} ${person.role} ${person.claim} ${person.works.join(" ")} ${person.relations.join(" ")} ${signature?.text || ""} ${signature?.context || ""}`;
      return eraMatches && schoolMatches && (!query || normalizeSearch(searchable).includes(query));
    });
  }

  function renderPersonCards(people) {
    if (!people.length) return '<div class="empty-people"><strong>일치하는 인물이 없습니다.</strong><span>검색어를 줄이거나 시대·사조 필터를 초기화해 보세요.</span></div>';
    return people
      .map((person) => {
        const era = genealogy.eras.find((item) => item.id === person.era);
        const schools = person.schools.map((id) => genealogy.schools.find((item) => item.id === id)).filter(Boolean);
        const signature = genealogySignatures[person.id];
        return `
          <article class="person-card" id="person-${escapeAttribute(person.id)}">
            <div class="person-card-top"><div><span class="person-era">${escapeHtml(era?.label || "")}</span><h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(person.original)} · ${escapeHtml(person.years)}</p></div><span class="person-number">${String(genealogy.people.indexOf(person) + 1).padStart(2, "0")}</span></div>
            <div class="person-schools">${schools.map((school) => `<span>${escapeHtml(school.label)}</span>`).join("")}</div>
            ${signature ? `<div class="person-signature"><span>${escapeHtml(signature.kind)}</span><strong>${escapeHtml(signature.text)}</strong><p>${escapeHtml(signature.context)}</p></div>` : `<strong class="person-role">${escapeHtml(person.role)}</strong><p class="person-claim">${escapeHtml(person.claim)}</p>`}
            <button type="button" class="person-open" data-person-id="${escapeAttribute(person.id)}"><span>상세 읽기</span>${icons.arrow}</button>
          </article>`;
      })
      .join("");
  }

  function relationTone(relation) {
    if (/사제|지도|학파/.test(relation)) return "mentor";
    if (/논쟁|비판|대립|쟁점|차이|주의/.test(relation)) return "conflict";
    return "influence";
  }

  function updateGenealogyResults({ syncUrl = true } = {}) {
    const grid = app.querySelector(".people-grid");
    if (!grid) return;
    const people = filteredGenealogyPeople();
    const totalPages = Math.max(1, Math.ceil(people.length / peoplePerPage));
    state.genealogyPeoplePage = Math.min(state.genealogyPeoplePage, totalPages);
    const start = (state.genealogyPeoplePage - 1) * peoplePerPage;
    const visiblePeople = people.slice(start, start + peoplePerPage);
    grid.innerHTML = renderPersonCards(visiblePeople);
    const count = app.querySelector(".people-result-count");
    if (count) count.textContent = people.length ? `${people.length}명 중 ${start + 1}–${Math.min(start + peoplePerPage, people.length)}명 · ${state.genealogyPeoplePage}/${totalPages}쪽` : "0명 표시";
    const pagination = app.querySelector(".people-pagination");
    if (pagination) pagination.innerHTML = renderPeoplePagination(totalPages);
    app.querySelectorAll("[data-era-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.eraFilter === state.genealogyEra)));
    app.querySelectorAll("[data-school-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.schoolFilter === state.genealogySchool)));
    const reset = app.querySelector(".reset-genealogy-filters");
    if (reset) reset.hidden = state.genealogyEra === "전체" && state.genealogySchool === "전체" && !state.genealogyQuery;
    if (syncUrl && state.view === "genealogy") writeGenealogyHistory({ replaceHistory: true });
  }

  function renderPeoplePagination(totalPages) {
    if (totalPages <= 1) return "";
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    return `<button type="button" data-people-page="${state.genealogyPeoplePage - 1}" aria-label="이전 인물 쪽" ${state.genealogyPeoplePage === 1 ? "disabled" : ""}>${icons.chevronLeft}</button><div>${pages.map((page) => `<button type="button" data-people-page="${page}" aria-current="${page === state.genealogyPeoplePage ? "page" : "false"}">${page}</button>`).join("")}</div><button type="button" data-people-page="${state.genealogyPeoplePage + 1}" aria-label="다음 인물 쪽" ${state.genealogyPeoplePage === totalPages ? "disabled" : ""}>${icons.chevronRight}</button>`;
  }

  function updateGenealogyNavigation() {
    app.querySelectorAll("[data-genealogy-section]").forEach((button) => {
      const active = button.dataset.genealogySection === state.genealogySection;
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function genealogyUrl() {
    const url = new URL(location.href);
    url.searchParams.set("view", "genealogy");
    if (state.genealogySection === "overview") url.searchParams.delete("section");
    else url.searchParams.set("section", state.genealogySection);
    if (state.genealogyPersonId) url.searchParams.set("person", state.genealogyPersonId);
    else url.searchParams.delete("person");
    if (state.genealogySection === "people" && state.genealogyPeoplePage > 1) url.searchParams.set("page", String(state.genealogyPeoplePage));
    else url.searchParams.delete("page");
    if (state.genealogySection === "people" && state.genealogyQuery) url.searchParams.set("q", state.genealogyQuery);
    else url.searchParams.delete("q");
    if (state.genealogySection === "people" && state.genealogyEra !== "전체") url.searchParams.set("era", state.genealogyEra);
    else url.searchParams.delete("era");
    if (state.genealogySection === "people" && state.genealogySchool !== "전체") url.searchParams.set("school", state.genealogySchool);
    else url.searchParams.delete("school");
    return url;
  }

  function writeGenealogyHistory({ replaceHistory = false } = {}) {
    const historyState = { docId: state.currentId, view: "genealogy", section: state.genealogySection, personId: state.genealogyPersonId, page: state.genealogyPeoplePage };
    history[replaceHistory ? "replaceState" : "pushState"](historyState, "", genealogyUrl());
  }

  function navigateGenealogy(section, { personId = null, page = 1, replaceHistory = false, skipHistory = false } = {}) {
    state.genealogySection = genealogySections.includes(section) ? section : "overview";
    state.genealogyPersonId = state.genealogySection === "people" && genealogy.people.some((person) => person.id === personId) ? personId : null;
    state.genealogyPeoplePage = Math.max(1, Number.parseInt(page, 10) || 1);
    renderGenealogy();
    if (!skipHistory) writeGenealogyHistory({ replaceHistory });
    document.title = state.genealogyPersonId ? `${genealogy.people.find((person) => person.id === state.genealogyPersonId)?.name} · 법철학의 계보` : "법철학의 계보 · 규범과 법";
    closeDrawers();
  }

  function focusGenealogyPerson(id) {
    if (!genealogy.people.some((person) => person.id === id)) return;
    navigateGenealogy("people", { personId: id, page: state.genealogyPeoplePage });
  }

  function setView(view, { replaceHistory = false, skipHistory = false } = {}) {
    state.view = view === "genealogy" ? "genealogy" : "reader";
    app.dataset.view = state.view;
    app.querySelectorAll(".primary-tab[data-app-view]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.appView === state.view)));
    const genealogyPane = app.querySelector(".genealogy-pane");
    const documentsPane = app.querySelector(".documents-pane");
    genealogyPane?.setAttribute("aria-hidden", String(state.view !== "genealogy"));
    documentsPane?.setAttribute("aria-hidden", String(state.view !== "reader"));
    const context = app.querySelector(".brand-context");
    if (context) context.textContent = state.view === "genealogy" ? "법철학 지식 지도" : "연구 문서함";
    const url = state.view === "genealogy" ? genealogyUrl() : new URL(location.href);
    if (state.view === "reader") {
      ["view", "section", "person", "page", "q", "era", "school"].forEach((key) => url.searchParams.delete(key));
    }
    if (!skipHistory) history[replaceHistory ? "replaceState" : "pushState"]({ docId: state.currentId, view: state.view, section: state.genealogySection, personId: state.genealogyPersonId, page: state.genealogyPeoplePage }, "", url);
    const activePerson = genealogy.people.find((person) => person.id === state.genealogyPersonId);
    document.title = state.view === "genealogy" ? activePerson ? `${activePerson.name} · 법철학의 계보` : "법철학의 계보 · 규범과 법" : `${currentDocument()?.title || "규범과 법"} · 규범과 법`;
    savePreferences();
    closeDrawers();
    if (state.view === "reader") requestAnimationFrame(() => schedulePageLayout(currentReadingRatio()));
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
    if (state.view === "reader") document.title = `${doc.title} · 규범과 법`;

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
    restoreHighlights(body);
    decorateHeadings(body);
    renderTableOfContents(body);
    renderPager(doc);
    bindDocumentLinks(body);

    renderLibrary();
    updateThemeButtons();
    state.pendingHighlight = null;
    updateHighlightControls();

    const url = new URL(location.href);
    if (state.view === "reader") ["view", "section", "person", "page", "q", "era", "school"].forEach((key) => url.searchParams.delete(key));
    url.searchParams.set("doc", doc.id);
    history[replaceHistory ? "replaceState" : "pushState"]({ docId: doc.id, view: state.view }, "", url);

    const scroller = app.querySelector(".article-scroll");
    requestAnimationFrame(() => {
      calculatePages();
      if (restorePosition) {
        const ratio = clamp(Number(savedProgress[doc.id]) || 0, 0, 1);
        state.currentPage = Math.round(ratio * Math.max(0, state.pageOffsets.length - 1));
        scroller.scrollLeft = state.pageOffsets[state.currentPage] || 0;
      } else {
        state.currentPage = 0;
        scroller.scrollLeft = 0;
      }
      scroller.scrollTop = 0;
      updatePageControls();
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
    if (state.view !== "reader") setView("reader", { skipHistory: true });
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

    app.addEventListener("input", (event) => {
      if (!event.target.matches(".genealogy-search")) return;
      state.genealogyQuery = event.target.value.trim();
      state.genealogyPeoplePage = 1;
      updateGenealogyResults();
    });

    app.addEventListener("click", (event) => {
      const viewTab = event.target.closest("[data-app-view]");
      if (viewTab) {
        setView(viewTab.dataset.appView);
        return;
      }

      const genealogyPerson = event.target.closest("[data-person-id]");
      if (genealogyPerson) {
        focusGenealogyPerson(genealogyPerson.dataset.personId);
        return;
      }

      const genealogySection = event.target.closest("[data-genealogy-section]");
      if (genealogySection) {
        navigateGenealogy(genealogySection.dataset.genealogySection);
        return;
      }

      const eraFilter = event.target.closest("[data-era-filter]");
      if (eraFilter) {
        state.genealogyEra = eraFilter.dataset.eraFilter;
        state.genealogyPeoplePage = 1;
        if (eraFilter.closest(".era-card")) navigateGenealogy("people");
        else updateGenealogyResults();
        return;
      }

      const schoolFilter = event.target.closest("[data-school-filter]");
      if (schoolFilter) {
        state.genealogySchool = schoolFilter.dataset.schoolFilter;
        state.genealogyPeoplePage = 1;
        updateGenealogyResults();
        return;
      }

      const peoplePage = event.target.closest("[data-people-page]");
      if (peoplePage && !peoplePage.disabled) {
        state.genealogyPeoplePage = Math.max(1, Number.parseInt(peoplePage.dataset.peoplePage, 10) || 1);
        renderGenealogy();
        writeGenealogyHistory();
        return;
      }

      if (event.target.closest("[data-people-list]")) {
        navigateGenealogy("people", { page: state.genealogyPeoplePage });
        return;
      }

      if (event.target.closest(".reset-genealogy-filters")) {
        state.genealogyQuery = "";
        state.genealogyEra = "전체";
        state.genealogySchool = "전체";
        state.genealogyPeoplePage = 1;
        const genealogySearch = app.querySelector(".genealogy-search");
        if (genealogySearch) genealogySearch.value = "";
        updateGenealogyResults();
        return;
      }

      const highlightButton = event.target.closest(".highlight-trigger");
      if (highlightButton) {
        addHighlightFromSelection();
        return;
      }

      const highlightMark = event.target.closest(".text-highlight[data-highlight-id]");
      if (highlightMark && window.getSelection()?.isCollapsed) {
        removeHighlight(highlightMark.dataset.highlightId);
        return;
      }

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
        if (heading) {
          const target = scroller.scrollLeft + heading.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
          turnToPage(nearestPageIndex(target));
        }
        closeDrawers();
        return;
      }

      if (event.target.closest(".page-previous")) {
        turnPage(-1);
        return;
      }
      if (event.target.closest(".page-next")) {
        turnPage(1);
        return;
      }

      if (event.target.closest(".mobile-menu, .open-library")) openDrawer("library");
      if (event.target.closest(".open-toc")) openDrawer("toc");
      if (event.target.closest(".settings-trigger")) openDrawer("settings");
      if (event.target.closest(".library-close, .close-panel, .drawer-backdrop")) closeDrawers();
      if (event.target.closest(".theme-trigger, .toggle-theme")) toggleTheme();
      if (event.target.closest(".scroll-top")) turnToPage(0);
      if (event.target.closest(".install-button")) installApp();

      const settingButton = event.target.closest(".segment-button");
      if (settingButton) updateSetting(settingButton.closest("[data-setting]").dataset.setting, settingButton.dataset.value);
    });

    app.querySelector("#font-size").addEventListener("input", (event) => {
      const ratio = currentReadingRatio();
      state.fontSize = Number(event.target.value);
      applyPreferences();
      savePreferences();
      schedulePageLayout(ratio);
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

    scroller.addEventListener("wheel", (event) => {
      const horizontalTableMove = event.target.closest?.(".table-scroll") && Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (horizontalTableMove) return;
      event.preventDefault();
      if (state.pageTurnLocked || Math.max(Math.abs(event.deltaY), Math.abs(event.deltaX)) < 4) return;
      state.pageTurnLocked = true;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      turnPage(delta > 0 ? 1 : -1);
      window.setTimeout(() => {
        state.pageTurnLocked = false;
      }, 560);
    }, { passive: false });

    let touchStart = null;
    scroller.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1 || event.target.closest?.("a, button, .table-scroll, .text-highlight")) {
        touchStart = null;
        return;
      }
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    scroller.addEventListener("touchend", (event) => {
      if (!touchStart || !event.changedTouches.length || !window.getSelection()?.isCollapsed) {
        touchStart = null;
        return;
      }
      const deltaX = event.changedTouches[0].clientX - touchStart.x;
      const deltaY = event.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
      turnPage(deltaX < 0 ? 1 : -1);
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (state.resizeProgress === null) state.resizeProgress = currentReadingRatio();
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(() => {
        schedulePageLayout(state.resizeProgress);
        state.resizeProgress = null;
      }, 120);
    });

    document.fonts?.ready.then(() => schedulePageLayout(currentReadingRatio()));

    window.addEventListener("popstate", (event) => {
      const nextParams = new URLSearchParams(location.search);
      const nextView = event.state?.view || (nextParams.get("view") === "genealogy" ? "genealogy" : "reader");
      if (nextView !== state.view) setView(nextView, { skipHistory: true });
      const id = event.state?.docId || nextParams.get("doc");
      if (nextView === "genealogy") {
        const nextSection = genealogySections.includes(nextParams.get("section")) ? nextParams.get("section") : "overview";
        const nextPerson = genealogy.people.some((person) => person.id === nextParams.get("person")) ? nextParams.get("person") : null;
        state.genealogyQuery = nextParams.get("q") || "";
        state.genealogyEra = genealogy.eras.some((era) => era.id === nextParams.get("era")) ? nextParams.get("era") : "전체";
        state.genealogySchool = genealogy.schools.some((school) => school.id === nextParams.get("school")) ? nextParams.get("school") : "전체";
        navigateGenealogy(nextPerson ? "people" : nextSection, { personId: nextPerson, page: nextParams.get("page") || 1, skipHistory: true });
      } else if (id && id !== state.currentId) {
        selectDocument(id, { restorePosition: true, replaceHistory: true });
      }
    });

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      app.querySelectorAll(".install-button").forEach((button) => {
        button.hidden = false;
      });
    });
    window.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      app.querySelectorAll(".install-button").forEach((button) => {
        button.hidden = true;
      });
      showToast("홈 화면에 설치했습니다.");
    });

    mediaDark.addEventListener("change", () => {
      if (state.theme === "system") applyPreferences();
    });

    document.addEventListener("selectionchange", captureArticleSelection);

    document.addEventListener("keydown", (event) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        if (innerWidth <= 780) openDrawer("library");
        requestAnimationFrame(() => (state.view === "genealogy" ? app.querySelector(".genealogy-search") : searchInput)?.focus());
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLocaleLowerCase("en") === "h" && !typing) {
        event.preventDefault();
        addHighlightFromSelection();
      }
      const highlightMark = event.target.closest?.(".text-highlight[data-highlight-id]");
      if (highlightMark && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        removeHighlight(highlightMark.dataset.highlightId);
      }
      if (event.key === "Escape") closeDrawers();

      const selection = window.getSelection();
      const inArticle = event.target === scroller || event.target.closest?.(".article-scroll");
      const interactive = event.target.closest?.("a, button, input, textarea, select, .text-highlight");
      const pageKey = ["ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "].includes(event.key);
      if (!typing && !interactive && !state.drawer && inArticle && pageKey && (!selection || selection.isCollapsed) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (event.key === "ArrowLeft" || event.key === "PageUp" || (event.key === " " && event.shiftKey)) turnPage(-1);
        else if (event.key === "Home") turnToPage(0);
        else if (event.key === "End") turnToPage(state.pageOffsets.length - 1);
        else turnPage(1);
      }
    });
  }

  function captureArticleSelection() {
    const selection = window.getSelection();
    const body = app.querySelector(".markdown-body");
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !body) {
      state.pendingHighlight = null;
      updateHighlightControls();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) {
      state.pendingHighlight = null;
      updateHighlightControls();
      return;
    }

    const offsets = rangeToTextOffsets(body, range);
    const text = body.textContent || "";
    let start = offsets.start;
    let end = offsets.end;
    while (start < end && /\s/.test(text[start])) start += 1;
    while (end > start && /\s/.test(text[end - 1])) end -= 1;

    if (end <= start) {
      state.pendingHighlight = null;
      updateHighlightControls();
      return;
    }

    state.pendingHighlight = {
      docId: state.currentId,
      start,
      end,
      quote: text.slice(start, end)
    };
    updateHighlightControls();
  }

  function rangeToTextOffsets(root, range) {
    const startRange = document.createRange();
    startRange.selectNodeContents(root);
    startRange.setEnd(range.startContainer, range.startOffset);
    const endRange = document.createRange();
    endRange.selectNodeContents(root);
    endRange.setEnd(range.endContainer, range.endOffset);
    return { start: startRange.toString().length, end: endRange.toString().length };
  }

  function addHighlightFromSelection() {
    const pending = state.pendingHighlight;
    if (!pending || pending.docId !== state.currentId) {
      showToast("먼저 본문에서 표시할 문장을 선택하세요.");
      return;
    }

    const body = app.querySelector(".markdown-body");
    const bodyText = body?.textContent || "";
    if (!body || bodyText.slice(pending.start, pending.end) !== pending.quote) {
      state.pendingHighlight = null;
      updateHighlightControls();
      showToast("선택 위치가 바뀌었습니다. 문장을 다시 선택해 주세요.");
      return;
    }

    const progressRatio = currentReadingRatio();
    const current = validHighlightsForDocument(state.currentId, bodyText);
    const overlapping = current.filter((item) => pending.start <= item.end && pending.end >= item.start);
    const start = Math.min(pending.start, ...overlapping.map((item) => item.start));
    const end = Math.max(pending.end, ...overlapping.map((item) => item.end));
    const overlappingIds = new Set(overlapping.map((item) => item.id));
    const id = window.crypto?.randomUUID?.() || `highlight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    savedHighlights[state.currentId] = [
      ...current.filter((item) => !overlappingIds.has(item.id)),
      { id, start, end, quote: bodyText.slice(start, end) }
    ].sort((a, b) => a.start - b.start);

    const stored = saveHighlights();
    restoreHighlights(body);
    state.pendingHighlight = null;
    window.getSelection()?.removeAllRanges();
    updateHighlightControls();
    schedulePageLayout(progressRatio);
    if (stored) showToast("형광펜을 저장했습니다.");
  }

  function removeHighlight(id) {
    const progressRatio = currentReadingRatio();
    const current = Array.isArray(savedHighlights[state.currentId]) ? savedHighlights[state.currentId] : [];
    const next = current.filter((item) => item.id !== id);
    if (next.length === current.length) return;
    savedHighlights[state.currentId] = next;
    const stored = saveHighlights();
    restoreHighlights(app.querySelector(".markdown-body"));
    updateHighlightControls();
    schedulePageLayout(progressRatio);
    if (stored) showToast("형광펜을 지웠습니다.");
  }

  function restoreHighlights(body) {
    if (!body) return;
    body.querySelectorAll(".text-highlight[data-highlight-id]").forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });
    body.normalize();

    const text = body.textContent || "";
    const highlights = validHighlightsForDocument(state.currentId, text);
    savedHighlights[state.currentId] = highlights;
    highlights
      .slice()
      .sort((a, b) => b.start - a.start)
      .forEach((item) => wrapTextRange(body, item));
  }

  function validHighlightsForDocument(docId, text) {
    const source = Array.isArray(savedHighlights[docId]) ? savedHighlights[docId] : [];
    return source
      .map((item) => {
        if (!item || typeof item.quote !== "string" || !item.quote) return null;
        let start = Number(item.start);
        let end = Number(item.end);
        if (!Number.isInteger(start) || !Number.isInteger(end) || text.slice(start, end) !== item.quote) {
          const found = text.indexOf(item.quote);
          if (found < 0 || text.indexOf(item.quote, found + 1) >= 0) return null;
          start = found;
          end = found + item.quote.length;
        }
        if (start < 0 || end <= start || end > text.length) return null;
        return { id: String(item.id || `highlight-${start}-${end}`), start, end, quote: item.quote };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }

  function wrapTextRange(root, highlight) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const segments = [];
    let offset = 0;
    let node;
    while ((node = walker.nextNode())) {
      const nextOffset = offset + node.nodeValue.length;
      if (nextOffset > highlight.start && offset < highlight.end) {
        segments.push({
          node,
          start: Math.max(0, highlight.start - offset),
          end: Math.min(node.nodeValue.length, highlight.end - offset)
        });
      }
      offset = nextOffset;
      if (offset >= highlight.end) break;
    }

    segments.reverse().forEach((segment) => {
      if (segment.end <= segment.start) return;
      const range = document.createRange();
      range.setStart(segment.node, segment.start);
      range.setEnd(segment.node, segment.end);
      const mark = document.createElement("mark");
      mark.className = "text-highlight";
      mark.dataset.highlightId = highlight.id;
      mark.setAttribute("role", "button");
      mark.setAttribute("aria-label", `형광펜 지우기: ${highlight.quote.slice(0, 80)}`);
      mark.title = "눌러서 형광펜 지우기";
      range.surroundContents(mark);
    });

    const marks = [...root.querySelectorAll(`.text-highlight[data-highlight-id="${cssEscape(highlight.id)}"]`)];
    marks.forEach((mark, index) => {
      mark.tabIndex = index === 0 ? 0 : -1;
    });
  }

  function updateHighlightControls() {
    const count = Array.isArray(savedHighlights[state.currentId]) ? savedHighlights[state.currentId].length : 0;
    const ready = Boolean(state.pendingHighlight && state.pendingHighlight.docId === state.currentId);
    app.querySelectorAll(".highlight-trigger").forEach((button) => {
      button.dataset.ready = String(ready);
      button.dataset.count = count ? String(count) : "";
      button.setAttribute("aria-label", ready ? "선택한 문장에 형광펜 표시" : `형광펜: 현재 문서 ${count}개 저장됨`);
    });
    const summary = app.querySelector(".highlight-summary");
    if (summary) summary.textContent = count ? `${count}개 저장됨` : "표시 없음";
  }

  function saveHighlights() {
    try {
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(savedHighlights));
      return true;
    } catch (_) {
      showToast("브라우저 저장공간을 사용할 수 없어 형광펜을 저장하지 못했습니다.");
      return false;
    }
  }

  function updateSetting(setting, value) {
    const ratio = currentReadingRatio();
    if (setting === "theme" && ["system", "light", "dark"].includes(value)) state.theme = value;
    if (setting === "font" && ["serif", "sans"].includes(value)) state.font = value;
    if (setting === "leading" && ["compact", "relaxed"].includes(value)) state.leading = value;
    applyPreferences();
    savePreferences();
    if (setting === "font" || setting === "leading") schedulePageLayout(ratio);
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

  function currentReadingRatio() {
    const lastPage = Math.max(0, state.pageOffsets.length - 1);
    return lastPage ? clamp(state.currentPage / lastPage, 0, 1) : 0;
  }

  function calculatePages() {
    const scroller = app.querySelector(".article-scroll");
    if (!scroller) return;
    const root = scroller.querySelector(".article-wrap");
    const spacer = app.querySelector(".page-scroll-spacer");
    if (!root || !spacer || scroller.clientWidth < 1) return;

    scroller.scrollLeft = 0;
    spacer.style.left = "0px";
    const pageWidth = scroller.clientWidth;
    const columnWidth = root.offsetWidth;
    root.style.columnGap = `${Math.max(0, pageWidth - columnWidth)}px`;
    void root.offsetWidth;

    const total = Math.max(1, Math.ceil((scroller.scrollWidth - 0.5) / pageWidth));
    spacer.style.left = `${total * pageWidth - 1}px`;
    state.pageOffsets = Array.from({ length: total }, (_, index) => index * pageWidth);
    state.currentPage = clamp(state.currentPage, 0, state.pageOffsets.length - 1);
  }

  function nearestPageIndex(scrollTop) {
    let nearest = 0;
    let distance = Infinity;
    state.pageOffsets.forEach((offset, index) => {
      const nextDistance = Math.abs(offset - scrollTop);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    return nearest;
  }

  function updatePageControls() {
    const total = Math.max(1, state.pageOffsets.length);
    const current = clamp(state.currentPage, 0, total - 1);
    const counter = app.querySelector(".page-counter");
    const previous = app.querySelector(".page-previous");
    const next = app.querySelector(".page-next");
    if (counter) counter.textContent = `${current + 1} / ${total}쪽`;
    if (previous) previous.disabled = current === 0;
    if (next) next.disabled = current === total - 1;
  }

  function turnToPage(index, { behavior = "smooth" } = {}) {
    const scroller = app.querySelector(".article-scroll");
    if (!scroller) return;
    const targetPage = clamp(Number(index) || 0, 0, state.pageOffsets.length - 1);
    const previousPage = state.currentPage;
    state.currentPage = targetPage;
    if (behavior === "smooth" && targetPage !== previousPage) {
      window.clearTimeout(state.pageTurnTimer);
      delete scroller.dataset.pageTurn;
      void scroller.offsetWidth;
      scroller.dataset.pageTurn = targetPage > previousPage ? "next" : "previous";
      state.pageTurnTimer = window.setTimeout(() => {
        delete scroller.dataset.pageTurn;
      }, 260);
    }
    scroller.scrollTo({ left: state.pageOffsets[targetPage] || 0, top: 0, behavior: "auto" });
    updatePageControls();
    window.setTimeout(() => {
      updateReadingProgress();
      updateActiveHeading();
    }, behavior === "smooth" ? 260 : 0);
  }

  function turnPage(direction) {
    turnToPage(state.currentPage + (direction < 0 ? -1 : 1));
  }

  function schedulePageLayout(progressRatio = currentReadingRatio()) {
    if (!app.querySelector(".markdown-body")?.hasChildNodes()) return;
    if (state.pageLayoutFrame) cancelAnimationFrame(state.pageLayoutFrame);
    state.pageLayoutFrame = requestAnimationFrame(() => {
      state.pageLayoutFrame = null;
      calculatePages();
      state.currentPage = Math.round(clamp(Number(progressRatio) || 0, 0, 1) * Math.max(0, state.pageOffsets.length - 1));
      turnToPage(state.currentPage, { behavior: "auto" });
    });
  }

  function updateReadingProgress() {
    const lastPage = Math.max(0, state.pageOffsets.length - 1);
    const ratio = lastPage ? clamp(state.currentPage / lastPage, 0, 1) : 1;
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
    const scrollerLeft = scroller.getBoundingClientRect().left;
    const scrollerTop = scroller.getBoundingClientRect().top;
    let active = headings[0];
    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      const headingPosition = rect.left - scrollerLeft + scroller.scrollLeft;
      const headingPage = nearestPageIndex(headingPosition);
      if (headingPage < state.currentPage || (headingPage === state.currentPage && rect.top - scrollerTop <= 120)) active = heading;
      else if (headingPage > state.currentPage) break;
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
      app.querySelectorAll(".install-button").forEach((button) => {
        button.hidden = true;
      });
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    showToast(isiOS ? "Safari 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요." : "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.");
  }

  function updateOnlineState() {
    app.querySelectorAll(".offline-state").forEach((badge) => {
      badge.dataset.online = String(navigator.onLine);
      badge.textContent = navigator.onLine ? "동기화됨" : "오프라인";
    });
  }

  function registerPwa() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker
        .register("./sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
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
