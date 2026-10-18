/**
 * Atelier Contracting — Architectural Core v2.1
 * Main Interactive Application Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    currentView: "view-overview", // 'view-overview', 'view-customers', 'view-blueprints', 'view-portal'
    activeWorkspace: "admin", // 'admin' | 'client'
    selectedClient: ATELIER_DATA.clients[0], // Rahul Sharma default
    selectedDrawing: ATELIER_DATA.drawings[0],
    projectFilter: "all",
    blueprintFilter: "all",
    searchQuery: "",
    lightboxZoom: 1,
    lightboxPan: { x: 0, y: 0 },
    isDraggingLightbox: false,
    dragStart: { x: 0, y: 0 }
  };

  // DOM Elements
  const viewPanels = document.querySelectorAll(".view-panel");
  const sidebarNavItems = document.querySelectorAll(".sidebar-nav-item");
  const workspaceBtns = document.querySelectorAll(".workspace-btn");
  const appSidebar = document.querySelector(".app-sidebar");
  const toastContainer = document.getElementById("toast-container");

  // --- View Switching ---
  function switchView(viewId) {
    state.currentView = viewId;

    viewPanels.forEach(panel => {
      panel.classList.toggle("active", panel.id === viewId);
    });

    sidebarNavItems.forEach(item => {
      const target = item.dataset.targetView;
      item.classList.toggle("active", target === viewId);
    });

    // If switching to portal view, set workspace switcher
    if (viewId === "view-portal") {
      state.activeWorkspace = "client";
      updateWorkspaceButtons("client");
      if (appSidebar) appSidebar.style.display = "none";
    } else {
      state.activeWorkspace = "admin";
      updateWorkspaceButtons("admin");
      if (appSidebar) appSidebar.style.display = "flex";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateWorkspaceButtons(mode) {
    workspaceBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.workspace === mode);
    });
  }

  // Bind Sidebar Nav
  sidebarNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetView = item.dataset.targetView;
      if (targetView) switchView(targetView);
    });
  });

  // Bind Top Workspace Switcher
  workspaceBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.workspace;
      if (mode === "client") {
        switchView("view-portal");
      } else {
        switchView("view-overview");
      }
    });
  });

  // Client View button in sidebar footer
  const clientViewFooterBtn = document.getElementById("nav-client-view-footer");
  if (clientViewFooterBtn) {
    clientViewFooterBtn.addEventListener("click", () => switchView("view-portal"));
  }

  // Return to Studio button in Portal Header
  const returnToStudioBtn = document.getElementById("btn-return-studio");
  if (returnToStudioBtn) {
    returnToStudioBtn.addEventListener("click", () => switchView("view-overview"));
  }

  // --- Toast System ---
  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  // --- Customer Directory Logic ---
  const customerListContainer = document.getElementById("customer-cards-list");
  const inspectorClientName = document.getElementById("inspector-client-name");
  const inspectorProjectTitle = document.getElementById("inspector-project-title");
  const inspectorUsername = document.getElementById("inspector-username");
  const inspectorPin = document.getElementById("inspector-pin");
  const inspectorLastLogin = document.getElementById("inspector-last-login");
  const inspectorAuthStatus = document.getElementById("inspector-auth-status");
  const inspectorAuditList = document.getElementById("inspector-audit-list");

  function renderCustomerCards(filter = "all", search = "") {
    if (!customerListContainer) return;
    customerListContainer.innerHTML = "";

    const filtered = ATELIER_DATA.clients.filter(client => {
      const matchesFilter = filter === "all" || client.statusType === filter;
      const matchesSearch = search === "" || 
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
        client.phone.includes(search);
      return matchesFilter && matchesSearch;
    });

    filtered.forEach(client => {
      const card = document.createElement("div");
      card.className = `client-folio-card ${state.selectedClient.id === client.id ? "selected" : ""}`;
      card.dataset.clientId = client.id;

      card.innerHTML = `
        <div class="client-folio-card-top">
          <div class="client-identity-lockup">
            <div class="client-monogram">${client.name.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <div style="font-family: var(--font-display); font-weight: 700; font-size: 14px;">${client.name}</div>
              <div style="font-size: 11px; color: var(--ink-secondary); font-family: var(--font-mono);">${client.phone} • ${client.refId}</div>
            </div>
          </div>
          <span class="badge ${client.statusType === 'execution' ? 'badge-execution' : client.statusType === 'design' ? 'badge-design' : 'badge-approved'}">
            ${client.status}
          </span>
        </div>

        <div class="client-folio-card-body">
          <div class="client-thumbnail-box">
            <svg width="100%" height="100%" viewBox="0 0 140 100" style="background:#EFEAE1;">
              <rect x="15" y="15" width="110" height="70" fill="none" stroke="#D8C9B8" stroke-width="1.5"/>
              <line x1="15" y1="50" x2="125" y2="50" stroke="#D8C9B8" stroke-dasharray="4 2"/>
              <circle cx="70" cy="50" r="14" fill="#E8DED0" stroke="#111111" stroke-width="1"/>
              <text x="70" y="54" font-size="8" font-family="'Space Grotesk'" font-weight="700" text-anchor="middle" fill="#111111">INTERIOR</text>
            </svg>
            <span class="client-thumb-tag">${client.areaSqFt} SQ FT</span>
          </div>

          <div class="client-card-info">
            <div>
              <div style="font-family: var(--font-display); font-weight: 700; font-size: 13.5px; margin-bottom: 2px;">${client.typology}</div>
              <div style="font-size: 12px; color: var(--ink-secondary);">${client.phase} • Lead: ${client.leadArchitect}</div>
            </div>
            
            <div class="client-card-kpis">
              <div class="client-card-kpi-item">
                <span class="client-card-kpi-val">${client.counts.blueprints}</span>
                <span class="client-card-kpi-lbl">Blueprints</span>
              </div>
              <div class="client-card-kpi-item">
                <span class="client-card-kpi-val">${client.counts.specs}</span>
                <span class="client-card-kpi-lbl">Docs &amp; Specs</span>
              </div>
              <div class="client-card-kpi-item">
                <span class="client-card-kpi-val">${client.counts.siteLogs}</span>
                <span class="client-card-kpi-lbl">Site Logs</span>
              </div>
            </div>
          </div>
        </div>

        <div class="client-card-actions">
          <button class="btn btn-primary btn-sm btn-view-portal" data-client-id="${client.id}">
            VIEW PORTAL AS ${client.name.split(" ")[0].toUpperCase()}
          </button>
          <button class="btn btn-secondary btn-sm btn-quick-upload">UPLOAD FILE</button>
          <button class="btn btn-secondary btn-sm btn-inspect-client" data-client-id="${client.id}">MANAGE ACCESS</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (!e.target.closest("button")) {
          selectClient(client);
        }
      });

      const viewPortalBtn = card.querySelector(".btn-view-portal");
      if (viewPortalBtn) {
        viewPortalBtn.addEventListener("click", () => {
          selectClient(client);
          switchView("view-portal");
        });
      }

      const inspectBtn = card.querySelector(".btn-inspect-client");
      if (inspectBtn) {
        inspectBtn.addEventListener("click", () => selectClient(client));
      }

      customerListContainer.appendChild(card);
    });
  }

  function selectClient(client) {
    state.selectedClient = client;

    // Update active state in cards
    document.querySelectorAll(".client-folio-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.clientId === client.id);
    });

    // Update Inspector Panel
    if (inspectorClientName) inspectorClientName.textContent = client.name;
    if (inspectorProjectTitle) inspectorProjectTitle.textContent = `${client.projectTitle} • ${client.typology}`;
    if (inspectorUsername) inspectorUsername.textContent = client.security.username;
    if (inspectorPin) inspectorPin.textContent = `•••• [${client.security.pin}]`;
    if (inspectorLastLogin) inspectorLastLogin.textContent = client.security.lastLogin;
    if (inspectorAuthStatus) inspectorAuthStatus.textContent = client.security.authStatus;

    if (inspectorAuditList) {
      inspectorAuditList.innerHTML = "";
      client.auditTrail.forEach(item => {
        const row = document.createElement("div");
        row.style.padding = "8px 0";
        row.style.borderBottom = "1px solid var(--border-hairline)";
        row.innerHTML = `
          <div style="font-size: 11.5px; font-weight: 600; color: var(--ink-primary);">${item.action}</div>
          <div style="font-size: 10px; color: var(--ink-secondary); font-family: var(--font-mono);">${item.time} • ${item.device}</div>
        `;
        inspectorAuditList.appendChild(row);
      });
    }

    // Also sync client portal elements
    syncPortalView(client);
  }

  function syncPortalView(client) {
    const portalResidenceTitle = document.getElementById("portal-residence-title");
    const portalResidenceLoc = document.getElementById("portal-residence-loc");
    const portalRefBadge = document.getElementById("portal-ref-badge");
    const portalVaultBadge = document.getElementById("portal-vault-badge");
    const portalLeadArch = document.getElementById("portal-lead-arch");
    const portalPhaseText = document.getElementById("portal-phase-text");
    const portalSprintPct = document.getElementById("portal-sprint-pct");
    const portalClientPill = document.getElementById("portal-client-pill");

    if (portalResidenceTitle) portalResidenceTitle.textContent = client.projectTitle.toUpperCase();
    if (portalResidenceLoc) portalResidenceLoc.textContent = client.location;
    if (portalRefBadge) portalRefBadge.textContent = `REF: ${client.refId}`;
    if (portalVaultBadge) portalVaultBadge.textContent = `VAULT KEY: ${client.vaultKey}`;
    if (portalLeadArch) portalLeadArch.textContent = client.leadArchitect;
    if (portalPhaseText) portalPhaseText.textContent = client.phase;
    if (portalSprintPct) portalSprintPct.textContent = `Overall Sprint: ${client.completionPct}% Complete`;
    if (portalClientPill) portalClientPill.textContent = `CLIENT: ${client.name.toUpperCase()}`;
  }

  // Directory filter buttons
  document.querySelectorAll("[data-dir-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-dir-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCustomerCards(btn.dataset.dirFilter);
    });
  });

  // Phone lookup input
  const quickLookupInput = document.getElementById("quick-lookup-input");
  if (quickLookupInput) {
    quickLookupInput.addEventListener("input", (e) => {
      renderCustomerCards("all", e.target.value.trim());
    });
  }

  // --- Active Commissions Table (Overview View) ---
  const commissionsTableBody = document.getElementById("commissions-table-body");
  function renderCommissionsTable() {
    if (!commissionsTableBody) return;
    commissionsTableBody.innerHTML = "";

    ATELIER_DATA.clients.forEach(client => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="client-monogram" style="width:26px; height:26px; font-size:10px;">
              ${client.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div style="font-weight:700; font-family:var(--font-display);">${client.name}</div>
              <div style="font-size:11px; color:var(--ink-secondary); font-family:var(--font-mono);">${client.phone}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight:600;">${client.projectTitle}</div>
          <div style="font-size:11.5px; color:var(--ink-secondary);">${client.typology}</div>
        </td>
        <td>
          <span class="badge ${client.statusType === 'execution' ? 'badge-execution' : client.statusType === 'design' ? 'badge-design' : 'badge-approved'}">
            ${client.status}
          </span>
        </td>
        <td>
          <div style="font-weight:600; font-size:12.5px;">${client.liveDraft}</div>
          <div style="font-size:10.5px; color:var(--ink-secondary);">${client.liveDraftTimestamp}</div>
        </td>
        <td class="align-right" style="font-family:var(--font-mono); font-weight:700;">${client.counts.blueprints}</td>
        <td class="align-right" style="font-family:var(--font-mono); font-weight:700;">${client.counts.specs}</td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <button class="btn btn-secondary btn-sm btn-tbl-blueprints" data-client-id="${client.id}">VIEW BLUEPRINTS</button>
            <button class="btn btn-secondary btn-sm btn-tbl-site-log" data-client-id="${client.id}">SITE LOG</button>
            <button class="btn btn-icon btn-tbl-doc" title="Download Folio Dossier">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </td>
      `;

      row.querySelector(".btn-tbl-blueprints").addEventListener("click", () => {
        selectClient(client);
        switchView("view-blueprints");
      });

      row.querySelector(".btn-tbl-site-log").addEventListener("click", () => {
        selectClient(client);
        switchView("view-portal");
      });

      row.querySelector(".btn-tbl-doc").addEventListener("click", () => {
        showToast(`Exporting official folio dossier for ${client.projectTitle}...`, "info");
      });

      commissionsTableBody.appendChild(row);
    });
  }

  // --- Drawings & Blueprints Central View ---
  const drawingsGrid = document.getElementById("blueprints-grid-container");
  const heroDrawingContainer = document.getElementById("hero-drawing-sheet");

  function renderDrawings(filterCategory = "all") {
    if (!drawingsGrid) return;
    drawingsGrid.innerHTML = "";

    const filtered = ATELIER_DATA.drawings.filter(drw => {
      return filterCategory === "all" || drw.category === filterCategory;
    });

    filtered.forEach(drw => {
      const card = document.createElement("div");
      card.className = "blueprint-card";
      card.innerHTML = `
        <div class="blueprint-card-preview">
          <span class="blueprint-sheet-tag">${drw.sheetNumber}</span>
          <img src="assets/blueprints/blueprint-a101-rev03.svg" alt="${drw.title}" style="cursor:pointer;" />
        </div>
        <div class="blueprint-card-meta">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span class="label-xs">${drw.code}</span>
              <span class="badge ${drw.currentRev.includes('03') || drw.currentRev.includes('04') ? 'badge-approved' : 'badge-active'}">${drw.currentRev} [LATEST]</span>
            </div>
            <h4 style="margin-bottom:6px; font-size:13.5px;">${drw.shortTitle}</h4>
            <p style="font-size:12px; color:var(--ink-secondary); line-height:1.4;">${drw.description}</p>
          </div>
          <div style="margin-top:12px; font-size:11px; color:var(--ink-secondary); font-family:var(--font-mono);">
            Updated ${drw.updatedDate} • Scale ${drw.scale}
          </div>
        </div>
        <div class="blueprint-card-footer">
          <button class="btn btn-secondary btn-sm btn-open-lightbox" data-drawing-id="${drw.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            PREVIEW DRAWING
          </button>
          <button class="btn btn-primary btn-sm btn-download-pdf" data-drawing-id="${drw.id}">
            DOWNLOAD PDF
          </button>
        </div>
      `;

      card.querySelector(".blueprint-card-preview").addEventListener("click", () => openLightbox(drw));
      card.querySelector(".btn-open-lightbox").addEventListener("click", () => openLightbox(drw));
      card.querySelector(".btn-download-pdf").addEventListener("click", () => {
        showToast(`Preparing vector PDF download for ${drw.sheetNumber} (${drw.currentRev})...`, "info");
      });

      drawingsGrid.appendChild(card);
    });
  }

  // Filter blueprint tabs
  document.querySelectorAll("[data-blueprint-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-blueprint-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderDrawings(btn.dataset.blueprintFilter);
    });
  });

  // --- Lightbox & Redline Inspector ---
  const lightboxModal = document.getElementById("lightbox-modal");
  const lightboxCanvas = document.getElementById("lightbox-canvas-target");
  const lightboxCloseBtn = document.getElementById("btn-close-lightbox");
  const lightboxSheetTitle = document.getElementById("lightbox-sheet-title");
  const lightboxSheetRev = document.getElementById("lightbox-sheet-rev");
  const btnZoomIn = document.getElementById("lightbox-zoom-in");
  const btnZoomOut = document.getElementById("lightbox-zoom-out");
  const btnZoomReset = document.getElementById("lightbox-zoom-reset");
  const redlineToggleBtn = document.getElementById("btn-toggle-redline-diff");

  let isRedlineMode = false;

  function openLightbox(drawing = ATELIER_DATA.drawings[0]) {
    state.selectedDrawing = drawing;
    if (lightboxSheetTitle) lightboxSheetTitle.textContent = `${drawing.sheetNumber} — ${drawing.title}`;
    if (lightboxSheetRev) lightboxSheetRev.textContent = `${drawing.currentRev} [ACTIVE ON SITE]`;

    renderLightboxContent();
    if (lightboxModal) lightboxModal.classList.add("active");
  }

  function renderLightboxContent() {
    if (!lightboxCanvas) return;
    state.lightboxZoom = 1;
    state.lightboxPan = { x: 0, y: 0 };
    updateCanvasTransform();

    if (isRedlineMode) {
      // Render Split Comparison Container
      lightboxCanvas.innerHTML = `
        <div class="compare-container" id="compare-split-box">
          <div class="compare-layer-superseded">
            <img src="assets/blueprints/blueprint-a101-rev02.svg" style="width:100%; height:100%; object-fit:contain;" />
          </div>
          <div class="compare-layer-current" id="compare-current-layer" style="width: 50%;">
            <img src="assets/blueprints/blueprint-a101-rev03.svg" style="width:100%; height:100%; object-fit:contain;" />
          </div>
          <div class="compare-slider-control" id="compare-handle" style="left: 50%;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      `;
      setupCompareSlider();
    } else {
      lightboxCanvas.innerHTML = `
        <img src="assets/blueprints/blueprint-a101-rev03.svg" style="width:100%; height:100%; object-fit:contain; pointer-events:none;" />
      `;
    }
  }

  function setupCompareSlider() {
    const handle = document.getElementById("compare-handle");
    const currentLayer = document.getElementById("compare-current-layer");
    const container = document.getElementById("compare-split-box");

    if (!handle || !currentLayer || !container) return;

    let isDragging = false;

    function onPointerMove(e) {
      if (!isDragging) return;
      const rect = container.getBoundingClientRect();
      let offsetX = (e.clientX || e.touches[0].clientX) - rect.left;
      offsetX = Math.max(0, Math.min(offsetX, rect.width));
      const pct = (offsetX / rect.width) * 100;
      currentLayer.style.width = `${pct}%`;
      handle.style.left = `${pct}%`;
    }

    handle.addEventListener("mousedown", () => { isDragging = true; });
    window.addEventListener("mouseup", () => { isDragging = false; });
    window.addEventListener("mousemove", onPointerMove);
  }

  function updateCanvasTransform() {
    if (lightboxCanvas) {
      lightboxCanvas.style.transform = `scale(${state.lightboxZoom}) translate(${state.lightboxPan.x}px, ${state.lightboxPan.y}px)`;
    }
  }

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      state.lightboxZoom = Math.min(state.lightboxZoom + 0.25, 3.5);
      updateCanvasTransform();
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      state.lightboxZoom = Math.max(state.lightboxZoom - 0.25, 0.6);
      updateCanvasTransform();
    });
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener("click", () => {
      state.lightboxZoom = 1;
      state.lightboxPan = { x: 0, y: 0 };
      updateCanvasTransform();
    });
  }

  if (redlineToggleBtn) {
    redlineToggleBtn.addEventListener("click", () => {
      isRedlineMode = !isRedlineMode;
      redlineToggleBtn.classList.toggle("active", isRedlineMode);
      renderLightboxContent();
      showToast(isRedlineMode ? "Redline Diff Activated: Rev 03 (Current) vs Rev 02 (Superseded)" : "Standard Vector View Restored", "info");
    });
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener("click", () => {
      if (lightboxModal) lightboxModal.classList.remove("active");
    });
  }

  // --- Quick Upload Modal ---
  const uploadModal = document.getElementById("upload-modal");
  const btnCloseUpload = document.getElementById("btn-close-upload");
  const uploadForm = document.getElementById("drawing-upload-form");

  document.querySelectorAll("[data-open-upload-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (uploadModal) uploadModal.classList.add("active");
    });
  });

  if (btnCloseUpload) {
    btnCloseUpload.addEventListener("click", () => {
      if (uploadModal) uploadModal.classList.remove("active");
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const sheetName = document.getElementById("input-upload-sheet-name").value;
      const revNum = document.getElementById("input-upload-rev").value;
      if (uploadModal) uploadModal.classList.remove("active");
      showToast(`Drawing "${sheetName}" (${revNum}) registered into Safe-Build queue!`, "info");
    });
  }

  // --- Add Client Modal ---
  const addClientModal = document.getElementById("add-client-modal");
  const btnCloseAddClient = document.getElementById("btn-close-add-client");
  const addClientForm = document.getElementById("add-client-form");

  document.querySelectorAll("[data-open-client-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (addClientModal) addClientModal.classList.add("active");
    });
  });

  if (btnCloseAddClient) {
    btnCloseAddClient.addEventListener("click", () => {
      if (addClientModal) addClientModal.classList.remove("active");
    });
  }

  if (addClientForm) {
    addClientForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("input-new-client-name").value;
      const project = document.getElementById("input-new-project-title").value;
      const phone = document.getElementById("input-new-client-phone").value;

      ATELIER_DATA.clients.unshift({
        id: `c-${Date.now()}`,
        name: name,
        phone: phone,
        projectTitle: project,
        typology: "Bespoke Residence Commission",
        location: "Mumbai",
        areaSqFt: 3500,
        refId: `AT-MUM-${Math.floor(100 + Math.random()*900)}`,
        vaultKey: `PR0${Math.floor(100 + Math.random()*900)}`,
        phase: "Design Phase (Stage 1 — Concept Planning)",
        completionPct: 15,
        status: "DESIGN REVISION",
        statusType: "design",
        leadArchitect: "Julian Vane",
        liveDraft: "Concept Schematic Draft 01",
        liveDraftTimestamp: "Just now • Lead Arch",
        counts: { blueprints: 4, specs: 2, siteLogs: 0 },
        security: {
          username: name.toLowerCase().replace(" ", "."),
          pin: "5521",
          lastLogin: "Pending First Login",
          authStatus: "Concept Review Access"
        },
        auditTrail: [{ action: "Client Portfolio Commissioned", time: "Just now", device: "Admin Director Console" }]
      });

      renderCustomerCards();
      renderCommissionsTable();
      if (addClientModal) addClientModal.classList.remove("active");
      showToast(`New client folio for "${name}" registered with Safe-Build credentials.`, "info");
    });
  }

  // --- Keyboard Shortcuts (⌘K search) ---
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("global-search-input");
      if (searchInput) searchInput.focus();
    }
    if (e.key === "Escape") {
      if (lightboxModal) lightboxModal.classList.remove("active");
      if (uploadModal) uploadModal.classList.remove("active");
      if (addClientModal) addClientModal.classList.remove("active");
    }
  });

  // Global search input handling
  const globalSearchInput = document.getElementById("global-search-input");
  if (globalSearchInput) {
    globalSearchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (state.currentView === "view-customers") {
        renderCustomerCards("all", q);
      }
    });
  }

  // Hero Sheet Redline Diff Button in Drawings View
  const btnHeroRedlineDiff = document.getElementById("btn-hero-redline-diff");
  if (btnHeroRedlineDiff) {
    btnHeroRedlineDiff.addEventListener("click", () => {
      isRedlineMode = true;
      openLightbox(ATELIER_DATA.drawings[0]);
    });
  }

  const btnHeroInspectVector = document.getElementById("btn-hero-inspect-vector");
  if (btnHeroInspectVector) {
    btnHeroInspectVector.addEventListener("click", () => {
      isRedlineMode = false;
      openLightbox(ATELIER_DATA.drawings[0]);
    });
  }

  const btnHeroDownloadPdf = document.getElementById("btn-hero-download-pdf");
  if (btnHeroDownloadPdf) {
    btnHeroDownloadPdf.addEventListener("click", () => {
      showToast("Downloading Official Vector PDF for SHEET A-101 (REV 03)...", "info");
    });
  }

  // Reset Customer PIN action in Inspector
  const btnResetPin = document.getElementById("btn-reset-pin");
  if (btnResetPin) {
    btnResetPin.addEventListener("click", () => {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      state.selectedClient.security.pin = newPin;
      if (inspectorPin) inspectorPin.textContent = `•••• [${newPin}]`;
      showToast(`Temporary OTP PIN reset to [${newPin}] and dispatched via SMS.`, "info");
    });
  }

  // Generate Project Bundle (ZIP)
  const btnGenBundle = document.getElementById("btn-gen-project-bundle");
  if (btnGenBundle) {
    btnGenBundle.addEventListener("click", () => {
      showToast(`Compiling all 14 active drawing sheets & 8 specs for ${state.selectedClient.projectTitle} (ZIP)...`, "info");
    });
  }

  // Send Notification
  const btnSendNotification = document.getElementById("btn-send-drawing-notif");
  if (btnSendNotification) {
    btnSendNotification.addEventListener("click", () => {
      showToast(`Push notification dispatched to ${state.selectedClient.name} (${state.selectedClient.security.device}).`, "info");
    });
  }

  // Initial renders
  renderCommissionsTable();
  renderCustomerCards();
  renderDrawings();
  selectClient(ATELIER_DATA.clients[0]);
});
