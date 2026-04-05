function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return uuid();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const state = {
  activePage: "plans",
  helpDocs: [],
  activeHelpDocId: null,
  plans: [],
  currentPlan: null,
  planBuilderOpen: false,
  context: null,
  /** @type {Record<string, { file: File, url: string }>} local file chosen for a slot; uploaded on "Approve for queue" */
  pendingPlanMedia: {},
  planModalOpen: false,
};

const statusLabels = {
  new: "New",
  waiting_media: "Waiting Media",
  draft: "Draft",
  rethinking: "Rethinking",
  approved: "Approved",
  canceled: "Canceled",
  posted: "Posted",
};

const CONTENT_TYPES = [
  "Instagram Feed",
  "Instagram Story",
  "Instagram Reel",
  "Facebook Post",
  "TikTok Video",
];

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initialize();
});

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.page));
  });
  document.getElementById("refreshAllButton")?.addEventListener("click", refreshAll);
  document.getElementById("processButton")?.addEventListener("click", handleProcess);
  document.getElementById("publishNowButton")?.addEventListener("click", handlePublishNow);
  document.getElementById("newPlanButton")?.addEventListener("click", startNewPlan);
  document.getElementById("modalSavePlanButton")?.addEventListener("click", saveCurrentPlan);
  document.getElementById("addRequirementButton")?.addEventListener("click", appendRequirement);
  document.getElementById("generatePlanButton")?.addEventListener("click", generatePlanFromBuilder);
  document.getElementById("cancelPlanBuilderButton")?.addEventListener("click", cancelPlanBuilderFlow);
  document.getElementById("planModal")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-plan-modal]")) closePlanModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.planModalOpen) {
      e.preventDefault();
      closePlanModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (state.activePage === "plans" && state.planModalOpen && state.currentPlan) saveCurrentPlan();
      else if (state.activePage === "persona") saveContext();
    }
  });
  document.getElementById("reloadContextButton")?.addEventListener("click", loadContext);
  document.getElementById("saveContextButton")?.addEventListener("click", saveContext);
  document.getElementById("planTypeInput")?.addEventListener("change", handlePlanTypeChange);
  document.getElementById("refreshQueueButton")?.addEventListener("click", loadQueuePage);
  document.getElementById("refreshPublishingButton")?.addEventListener("click", loadPublishingPage);
  document.getElementById("refreshMonitorButton")?.addEventListener("click", loadMonitorPage);
  document.getElementById("menuToggle")?.addEventListener("click", toggleMobileSidebar);
  document.getElementById("sidebarBackdrop")?.addEventListener("click", closeMobileSidebar);
  document.addEventListener("submit", handleDynamicSubmit);
  document.addEventListener("click", handleDynamicClick);
  document.addEventListener("change", handlePlanFieldChange);
  document.addEventListener("change", handlePlanItemPlatformChange);
  document.addEventListener("change", handlePlanItemFileChange);
  document.addEventListener("dragover", (e) => {
    const zone = e.target.closest("[data-drop-zone]");
    if (zone) { e.preventDefault(); zone.classList.add("drag-over"); }
  });
  document.addEventListener("dragleave", (e) => {
    const zone = e.target.closest("[data-drop-zone]");
    if (zone) zone.classList.remove("drag-over");
  });
  document.addEventListener("drop", (e) => {
    const zone = e.target.closest("[data-drop-zone]");
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const itemId = zone.dataset.dropZone;
    if (!itemId || !state.currentPlan) return;
    const item = state.currentPlan.items?.find((i) => i.id === itemId);
    if (!item) return;
    setPendingPlanMedia(itemId, file);
    if (file.type.startsWith("video/")) item.uploadedMediaType = "video";
    else if (file.type.startsWith("image/")) item.uploadedMediaType = "photo";
    if (item.status === "approved") item.status = "preparing";
    renderPlans();
  });
}

function revokePendingPlanMedia(itemId) {
  const p = state.pendingPlanMedia[itemId];
  if (p?.url) {
    try {
      URL.revokeObjectURL(p.url);
    } catch {
      /* ignore */
    }
  }
  delete state.pendingPlanMedia[itemId];
}

function setPendingPlanMedia(itemId, file) {
  revokePendingPlanMedia(itemId);
  if (!file) return;
  state.pendingPlanMedia[itemId] = { file, url: URL.createObjectURL(file) };
}

function prunePendingPlanMediaNotInPlan(plan) {
  const ids = new Set((plan.items || []).map((i) => i.id));
  Object.keys(state.pendingPlanMedia).forEach((id) => {
    if (!ids.has(id)) revokePendingPlanMedia(id);
  });
}

function handlePlanItemFileChange(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
  const toolbar = input.closest("[data-plan-item-file]");
  if (!toolbar) return;
  const itemId = toolbar.dataset.planItemFile;
  if (!itemId || !state.currentPlan) return;
  const file = input.files?.[0];
  if (!file) return;
  const item = state.currentPlan.items?.find((i) => i.id === itemId);
  if (!item) return;
  setPendingPlanMedia(itemId, file);
  if (file.type.startsWith("video/")) item.uploadedMediaType = "video";
  else if (file.type.startsWith("image/")) item.uploadedMediaType = "photo";
  if (item.status === "approved") item.status = "preparing";
  input.value = "";
  renderPlans();
}

async function initialize() {
  const dateInput = document.getElementById("planStartDateInput");
  if (dateInput) dateInput.value = getTodayDateInputValue();
  await Promise.all([loadCommandReference(), loadHelpDocs(), loadPlans(), loadContext()]);
  await refreshAll();
  window.setInterval(refreshAll, 15000);
}

function toggleMobileSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebarBackdrop")?.classList.toggle("visible");
}

function closeMobileSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarBackdrop")?.classList.remove("visible");
}

function navigateTo(page) {
  closeMobileSidebar();
  if (page !== "plans" && state.planModalOpen) closePlanModal();
  state.activePage = page;
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById(`page-${page}`)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add("active");

  if (page === "queue") loadQueuePage();
  else if (page === "publishing") loadPublishingPage();
  else if (page === "monitor") loadMonitorPage();
}

async function refreshAll() {
  if (state.activePage !== "plans") return;
  await Promise.all([loadQueue(), loadDrafts(), loadPublishing(), loadMonitor(), loadPlans(), loadContext()]);
}

async function loadQueuePage() {
  await Promise.all([loadQueue(), loadDrafts(), loadPublishing(), loadMonitor()]);
}

async function loadPublishingPage() {
  await Promise.all([loadPublishing()]);
}

async function loadMonitorPage() {
  await loadMonitor();
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof payload === "object" && payload ? payload.detail || payload.error : payload;
    throw new Error(detail || "Request failed");
  }
  return payload;
}

async function loadQueue() {
  const [counts, queuePayload] = await Promise.all([
    api("/api/queue-counts"),
    api("/api/queue-items?status=new,waiting_media,draft,rethinking&limit=50"),
  ]);
  renderQueueCounts(counts);
  renderPendingBanner(queuePayload.pendingPlanItems || []);
  renderActiveQueue(queuePayload.items || []);
  renderWaitingMedia((queuePayload.items || []).filter((item) => item.status === "waiting_media"));
}

async function loadDrafts() {
  const payload = await api("/api/queue-items?status=draft,rethinking&limit=50");
  renderDrafts(payload.items || []);
}

async function loadPublishing() {
  const payload = await api("/api/publishing-overview");
  renderPublishingOverview(payload);
  renderTimeline(payload.timeline || []);
}

async function loadMonitor() {
  const payload = await api("/api/bot-monitor");
  renderMonitorQueueCounts(payload.queueCounts || {});
  renderMonitorPublishing(payload.publishing || {});
  renderRecentItems(payload.recentItems || []);
  renderFailedItems(payload.failedItems || []);
  renderOpenPlans(payload.openPlans || []);
}

async function loadCommandReference() {
  const payload = await api("/api/bot-commands");
  const container = document.getElementById("commandReference");
  if (!container) return;
  container.innerHTML = "";
  (payload.commands || []).forEach((entry) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(entry.command)}</strong>
        <span>${escapeHtml(entry.description)}</span>
      </div>
    `));
  });
}

async function loadHelpDocs() {
  const payload = await api("/api/help-docs");
  state.helpDocs = payload.documents || [];
  state.activeHelpDocId = state.helpDocs[0]?.id || null;
  renderHelpDocs();
}

async function loadPlans() {
  const plans = await api("/api/plans");
  state.plans = Array.isArray(plans) ? plans : [];
  if (state.currentPlan) {
    state.currentPlan = state.plans.find((p) => p.id === state.currentPlan.id) || state.currentPlan;
    prunePendingPlanMediaNotInPlan(state.currentPlan);
  }
  renderPlans();
}

async function loadContext() {
  state.context = await api("/api/inna-context");
  renderContext();
  renderStrategy();
}

function renderPlans() {
  renderSavedPlans();
  renderCurrentPlan();
  if (state.planModalOpen) {
    updatePlanModalTitle();
    syncPlanModalPanels();
  }
}

function openPlanModal() {
  state.planModalOpen = true;
  const el = document.getElementById("planModal");
  if (!el) return;
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  updatePlanModalTitle();
  syncPlanModalPanels();
}

function closePlanModal() {
  if (!state.planModalOpen) return;
  state.planModalOpen = false;
  closePlanBuilder();
  const modal = document.getElementById("planModal");
  if (modal) {
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
  renderPlans();
}

function syncPlanModalPanels() {
  const builder = document.getElementById("planBuilder");
  const view = document.getElementById("currentPlanView");
  if (!builder || !view) return;
  if (state.planBuilderOpen) {
    builder.classList.remove("hidden");
    view.classList.add("hidden");
  } else {
    builder.classList.add("hidden");
    view.classList.remove("hidden");
  }
}

function updatePlanModalTitle() {
  const h = document.getElementById("planModalTitle");
  if (!h) return;
  if (state.planBuilderOpen && !state.currentPlan) {
    h.textContent = "New plan";
    return;
  }
  if (state.currentPlan?.name) {
    h.textContent = state.currentPlan.name;
    return;
  }
  h.textContent = "Plan";
}

function startNewPlan() {
  Object.keys(state.pendingPlanMedia).forEach((id) => revokePendingPlanMedia(id));
  state.currentPlan = null;
  openPlanBuilder();
  openPlanModal();
  renderPlans();
}

function cancelPlanBuilderFlow() {
  closePlanBuilder();
  if (!state.currentPlan) closePlanModal();
  else renderPlans();
}

function firstPlanItemWithMedia(plan) {
  for (const it of plan.items || []) {
    if (it && it.mediaUrl) return it;
  }
  return null;
}

function planItemIsVideo(item) {
  if (!item) return false;
  if (item.uploadedMediaType === "video") return true;
  if (item.uploadedMediaType === "photo") return false;
  return inferUploadedMediaType(item.mediaUrl, item.mediaType) === "video";
}

function savedPlanThumbHtml(plan) {
  const sample = firstPlanItemWithMedia(plan);
  if (!sample?.mediaUrl) {
    return `<div class="saved-plan-thumb saved-plan-thumb-empty" aria-hidden="true">No preview</div>`;
  }
  if (planItemIsVideo(sample)) {
    return `<div class="saved-plan-thumb"><video muted playsinline preload="metadata" src="${escapeAttr(sample.mediaUrl)}"></video></div>`;
  }
  return `<div class="saved-plan-thumb"><img src="${escapeAttr(sample.mediaUrl)}" alt="" loading="lazy" /></div>`;
}

function renderSavedPlans() {
  const container = document.getElementById("savedPlansList");
  if (!container) return;
  container.innerHTML = "";
  if (!state.plans.length) {
    container.appendChild(emptyState("No saved plans yet.", "Create a content plan to schedule posts across your social channels.", "New plan", () => startNewPlan()));
    return;
  }
  state.plans.forEach((plan) => {
    const items = plan.items || [];
    const approved = items.filter((i) => i.status === "approved" || i.status === "posted").length;
    const total = items.length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
    const statusPillClass = plan.status === "closed" ? "status-canceled" : "status-approved";

    const cardNode = card(`
      <div class="saved-plan-row">
        ${savedPlanThumbHtml(plan)}
        <div class="saved-plan-body line-meta">
          <strong>${escapeHtml(plan.name)}</strong>
          <span><span class="pill ${statusPillClass}">${escapeHtml(plan.status)}</span> ${escapeHtml(plan.type)} · ${total} slots</span>
          <span>${escapeHtml(plan.startDate || "Start date not set")}</span>
          ${total > 0 ? `<div class="plan-progress"><div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${pct}%"></div></div><span class="plan-progress-label">${approved}/${total} ready</span></div>` : ""}
        </div>
      </div>
      <div class="actions">
        <button class="button small ghost" data-open-plan="${escapeAttr(plan.id)}">Open</button>
        <button class="button small ghost" data-plan-status="${escapeAttr(plan.id)}" data-next-status="${plan.status === "closed" ? "open" : "closed"}">${plan.status === "closed" ? "Reopen" : "Close"}</button>
        <button class="button small danger" data-delete-plan="${escapeAttr(plan.id)}">Delete</button>
      </div>
    `);
    cardNode.classList.add("saved-plan-card");
    if (state.planModalOpen && state.currentPlan && state.currentPlan.id === plan.id) cardNode.classList.add("active");
    container.appendChild(cardNode);
  });
}

function renderCurrentPlan() {
  const container = document.getElementById("currentPlanView");
  if (!container) return;

  if (!state.currentPlan) {
    container.innerHTML = "";
    return;
  }

  const p = state.currentPlan;
  const n = (p.items || []).length;
  const itemCards = (p.items || []).map((item) => renderPlanItemCard(item)).join("");

  container.innerHTML = `
    <div class="item-card plan-editor-header">
      <div class="plan-editor-header-row">
        <label><span>Plan name</span><input data-plan-field="name" type="text" value="${escapeAttr(p.name || "")}" placeholder="e.g. April week" /></label>
        <label><span>Start date</span><input data-plan-field="startDate" type="date" value="${escapeAttr(p.startDate || "")}" /></label>
        <span class="plan-item-count">${n} slot${n === 1 ? "" : "s"} · ${escapeHtml(p.type)} · ${escapeHtml(p.status)}</span>
      </div>
    </div>
    ${itemCards}
    <div class="item-card">
      <div class="actions">
        <button class="button small ghost" data-append-plan-item="true">Add slot</button>
      </div>
    </div>
  `;
}

function planItemPreviewMediaHtml(item) {
  const pending = state.pendingPlanMedia[item.id];
  let badge = "";
  if (pending?.url) {
    badge = `<span class="plan-preview-badge">Local only</span>`;
  }
  if (pending?.url) {
    const isVid = pending.file?.type?.startsWith("video/");
    const inner = isVid
      ? `<video controls playsinline preload="metadata" src="${escapeAttr(pending.url)}"></video>`
      : `<img src="${escapeAttr(pending.url)}" alt="" />`;
    return `${badge}${inner}`;
  }
  if (item.mediaUrl) {
    if (planItemIsVideo(item)) {
      return `${badge}<video controls playsinline preload="metadata" src="${escapeAttr(item.mediaUrl)}"></video>`;
    }
    return `${badge}<img src="${escapeAttr(item.mediaUrl)}" alt="Slot media" loading="lazy" />`;
  }
  return `<div class="plan-thumb-placeholder"><strong>No media yet</strong>Choose a file, add tags, then approve.</div>`;
}

function planItemPreviewTagsHtml(item) {
  const tags = item.tags || [];
  const row = tags.length
    ? tags.map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join("")
    : `<span class="tag-empty">No tags yet — use Add tag</span>`;
  return `
    <div class="plan-item-preview-tags">
      Tags
      <div class="pill-row">${row}</div>
    </div>
  `;
}

function renderPlatformCheckboxes(item) {
  const selected = item.contentTypes || [];
  return CONTENT_TYPES.map((ct) => {
    const checked = selected.includes(ct);
    return `<label class="check-label"><input type="checkbox" data-platform-item="${escapeAttr(item.id)}" value="${escapeAttr(ct)}" ${checked ? "checked" : ""} /> ${escapeHtml(ct)}</label>`;
  }).join("");
}

function renderPlanItemCard(item) {
  const hasGenerated = Boolean(item.generated_text);
  const platformCount = (item.contentTypes || []).length;

  return `
    <div class="item-card plan-item-card">
      <div class="plan-item-layout">
        <div class="plan-item-preview-column" aria-label="Slot preview">
          <div class="plan-item-thumb-wrap">
            ${planItemPreviewMediaHtml(item)}
          </div>
          ${planItemPreviewTagsHtml(item)}
        </div>
        <div class="plan-item-main">
          <div class="plan-item-top">
            <label><span>Day label</span><input data-item-field="${escapeAttr(item.id)}" data-field-name="day" type="text" value="${escapeAttr(item.day || "")}" placeholder="e.g. Monday" /></label>
            <span class="plan-item-date">Goes live <strong>${escapeHtml(formatDate(item.publishAt))}</strong></span>
          </div>
          <div class="plan-item-meta-row">
            ${renderStatusPill(normalizePlanStatus(item.status))}
            <label class="field-inline-expect">
              <span>Expect</span>
              <select data-item-field="${escapeAttr(item.id)}" data-field-name="mediaType">
                ${["photo", "video", "any"].map((o) => `<option value="${o}" ${item.mediaType === o ? "selected" : ""}>${o}</option>`).join("")}
              </select>
            </label>
          </div>
          <details class="plan-item-details">
            <summary>Platforms (${platformCount} selected)</summary>
            <div class="platform-checks">${renderPlatformCheckboxes(item)}</div>
          </details>
          ${hasGenerated ? `
            <details class="plan-item-details">
              <summary>AI draft text</summary>
              <div class="ai-text-block" style="margin:8px 4px 10px;border:none">${escapeHtml(item.generated_text)}</div>
            </details>
          ` : ""}
          <p class="subtle plan-item-flow-hint">1) Drop or choose file → preview updates · 2) Add tag(s) · 3) Approve uploads to server</p>
          <div class="drop-zone" data-drop-zone="${escapeAttr(item.id)}">Drop media file here or use the button below</div>
          <div class="plan-item-toolbar" data-plan-item-file="${escapeAttr(item.id)}">
            <input type="file" accept="${escapeAttr(acceptForMediaType(item.mediaType))}" aria-label="Choose media file" />
            <button type="button" class="button small ghost" data-add-tag="${escapeAttr(item.id)}">Add tag</button>
            <button type="button" class="button small ghost" data-delete-media="${escapeAttr(item.id)}">Clear media</button>
          </div>
          <div class="plan-item-toolbar">
            <button type="button" class="button small primary" data-start-processing="${escapeAttr(item.id)}" title="Uploads if needed, saves the plan, syncs queue, reloads from server">Approve for queue</button>
            <button type="button" class="button small danger" data-remove-plan-item="${escapeAttr(item.id)}">Remove slot</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderContext() {
  const form = document.getElementById("contextForm");
  if (!state.context || !form) return;
  const ctx = state.context;
  form.elements.name.value = ctx.name || "";
  form.elements.specialty.value = ctx.specialty || "";
  form.elements.location.value = ctx.location || "";
  form.elements.philosophy.value = ctx.philosophy || "";
  form.elements.targetAudience.value = ctx.targetAudience || "";
  form.elements.voiceTone.value = ctx.voice?.tone || "";
  form.elements.voiceStyle.value = ctx.voice?.style || "";
  form.elements.forbiddenWords.value = (ctx.voice?.forbiddenWords || []).join("\n");
  form.elements.quotes.value = (ctx.quotes || []).join("\n");
}

function renderStrategy() {
  const container = document.getElementById("strategySummary");
  if (!container || !state.context) return;
  const ctx = state.context;
  container.innerHTML = "";

  container.appendChild(card(`
    <div class="line-meta">
      <div class="snapshot-section-label">Profile</div>
      <strong>${escapeHtml(ctx.name || "Inna")}</strong>
      <span>${escapeHtml(ctx.specialty || "")}</span>
      <span>${escapeHtml(ctx.location || "")}</span>
    </div>
  `));

  if (ctx.targetAudience) {
    container.appendChild(card(`
      <div class="line-meta">
        <div class="snapshot-section-label">Target Audience</div>
        <span>${escapeHtml(ctx.targetAudience)}</span>
      </div>
    `));
  }

  container.appendChild(card(`
    <div class="line-meta">
      <div class="snapshot-section-label">Voice</div>
      ${ctx.voice?.tone ? `<span><strong>Tone:</strong> ${escapeHtml(ctx.voice.tone)}</span>` : ""}
      ${ctx.voice?.style ? `<span><strong>Style:</strong> ${escapeHtml(ctx.voice.style)}</span>` : ""}
    </div>
  `));

  const forbidden = ctx.voice?.forbiddenWords || [];
  if (forbidden.length) {
    container.appendChild(card(`
      <div class="line-meta">
        <div class="snapshot-section-label">Forbidden Words</div>
        <div class="snapshot-tags">${forbidden.map((w) => `<span class="snapshot-tag">${escapeHtml(w)}</span>`).join("")}</div>
      </div>
    `));
  }

  if (ctx.philosophy) {
    container.appendChild(card(`<div class="snapshot-quote">${escapeHtml(ctx.philosophy)}</div>`));
  }

  const quotes = ctx.quotes || [];
  if (quotes.length) {
    container.appendChild(card(`
      <div class="line-meta">
        <div class="snapshot-section-label">Quotes</div>
        ${quotes.map((q) => `<div class="snapshot-quote">${escapeHtml(q)}</div>`).join("")}
      </div>
    `));
  }
}

function openPlanBuilder() {
  state.planBuilderOpen = true;
  const builder = document.getElementById("planBuilder");
  if (builder) {
    builder.classList.remove("hidden");
    builder.querySelector("#requirementsList").innerHTML = "";
  }
  handlePlanTypeChange();
  updatePlanModalTitle();
  syncPlanModalPanels();
}

function closePlanBuilder() {
  state.planBuilderOpen = false;
  document.getElementById("planBuilder")?.classList.add("hidden");
  updatePlanModalTitle();
  syncPlanModalPanels();
}

function handlePlanTypeChange() {
  const list = document.getElementById("requirementsList");
  if (!list) return;
  list.innerHTML = "";
  defaultRequirements(document.getElementById("planTypeInput")?.value || "week").forEach((req) => {
    list.appendChild(renderRequirementRow(req));
  });
}

function appendRequirement() {
  const list = document.getElementById("requirementsList");
  if (!list) return;
  list.appendChild(renderRequirementRow({ day: "", mediaType: "any", contentTypes: ["Instagram Feed"] }));
}

function renderRequirementRow(requirement) {
  const node = document.createElement("div");
  node.className = "item-card requirement-row";
  node.innerHTML = `
    <div class="two-column">
      <label><span>Day</span><input data-requirement="day" type="text" value="${escapeAttr(requirement.day || "")}" /></label>
      <label>
        <span>Media Type</span>
        <select data-requirement="mediaType">
          ${["photo", "video", "any"].map((o) => `<option value="${o}" ${requirement.mediaType === o ? "selected" : ""}>${o}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="pill-row">
      ${CONTENT_TYPES.map((ct) => {
        const sel = (requirement.contentTypes || []).includes(ct);
        return `<button type="button" class="button small ${sel ? "primary" : "ghost"}" data-requirement-toggle="${escapeAttr(ct)}">${escapeHtml(ct)}</button>`;
      }).join("")}
      <button type="button" class="button small danger" data-remove-requirement="true">Remove</button>
    </div>
  `;
  return node;
}

function generatePlanFromBuilder() {
  const type = document.getElementById("planTypeInput")?.value || "week";
  const startDate = document.getElementById("planStartDateInput")?.value || "";
  const name = document.getElementById("planNameInput")?.value || `${type.charAt(0).toUpperCase()}${type.slice(1)} Plan`;
  const reqs = Array.from(document.querySelectorAll("#requirementsList .item-card")).map((row) => ({
    day: row.querySelector('[data-requirement="day"]')?.value || "",
    mediaType: row.querySelector('[data-requirement="mediaType"]')?.value || "any",
    contentTypes: Array.from(row.querySelectorAll("[data-requirement-toggle].primary")).map((b) => b.dataset.requirementToggle),
  }));

  Object.keys(state.pendingPlanMedia).forEach((id) => revokePendingPlanMedia(id));
  state.currentPlan = applyDerivedScheduleToPlan({
    id: uuid(),
    name,
    type,
    status: "open",
    startDate,
    items: reqs.map((r) => ({
      id: uuid(),
      day: r.day,
      mediaType: r.mediaType,
      contentTypes: r.contentTypes.length ? r.contentTypes : ["Instagram Feed"],
      status: "preparing",
      tags: [],
    })),
  });
  closePlanBuilder();
  openPlanModal();
  renderPlans();
}

async function saveCurrentPlan() {
  if (!state.currentPlan) { showToast("No plan to save.", true); return; }
  const idx = state.plans.findIndex((p) => p.id === state.currentPlan.id);
  if (idx >= 0) state.plans[idx] = state.currentPlan;
  else state.plans.push(state.currentPlan);
  await api("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.plans),
  });
  showToast("Plan saved.");
  await loadPlans();
}

async function saveContext() {
  const form = document.getElementById("contextForm");
  if (!form) return;
  const btn = document.getElementById("saveContextButton");
  btnLoading(btn, true, "Saving\u2026");
  try {
    const payload = {
      name: form.elements.name?.value || "",
      specialty: form.elements.specialty?.value || "",
      location: form.elements.location?.value || "",
      philosophy: form.elements.philosophy?.value || "",
      targetAudience: form.elements.targetAudience?.value || "",
      voice: {
        tone: form.elements.voiceTone?.value || "",
        style: form.elements.voiceStyle?.value || "",
        forbiddenWords: parseLines(form.elements.forbiddenWords?.value || ""),
      },
      quotes: parseLines(form.elements.quotes?.value || ""),
    };
    state.context = await api("/api/inna-context", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    renderContext();
    renderStrategy();
    showToast("Context saved.");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    btnLoading(btn, false);
  }
}

function renderHelpDocs() {
  const tabs = document.getElementById("helpDocTabs");
  const content = document.getElementById("helpDocContent");
  if (!tabs || !content) return;
  tabs.innerHTML = "";
  state.helpDocs.forEach((doc) => {
    const btn = document.createElement("button");
    btn.className = `tab-button ${doc.id === state.activeHelpDocId ? "active" : ""}`;
    btn.textContent = doc.title;
    btn.addEventListener("click", () => {
      state.activeHelpDocId = doc.id;
      renderHelpDocs();
    });
    tabs.appendChild(btn);
  });
  const active = state.helpDocs.find((d) => d.id === state.activeHelpDocId) || null;
  content.textContent = active?.content || active?.error || "No document selected.";
}

function metricColorClass(key, value) {
  if (!value || value === 0) return "";
  const map = { canceled: "metric-danger", failed: "metric-danger", waiting_media: "metric-warning", rethinking: "metric-warning", draft: "metric-purple", new: "metric-info", approved: "metric-success", published: "metric-success", posted: "metric-success" };
  return map[key] || "";
}

function renderQueueCounts(counts) {
  const container = document.getElementById("queueCounts");
  if (!container) return;
  const keys = ["new", "waiting_media", "draft", "rethinking", "approved", "canceled", "total"];
  container.innerHTML = keys.map((k) => `
    <div class="metric-card ${metricColorClass(k, counts[k])}">
      <span class="meta-label">${escapeHtml(statusLabels[k] || k)}</span>
      <strong>${escapeHtml(String(counts[k] ?? 0))}</strong>
    </div>
  `).join("");
}

function renderPendingBanner(items) {
  const banner = document.getElementById("pendingBanner");
  if (!banner) return;
  if (!items.length) { banner.classList.add("hidden"); banner.textContent = ""; return; }
  banner.classList.remove("hidden");
  banner.textContent = `${items.length} plan items pending processing or waiting for media.`;
}

function renderActiveQueue(items) {
  const container = document.getElementById("activeQueue");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No active queue items.", "Approve plan items to add them to the queue.")); return; }
  items.forEach((item) => container.appendChild(renderQueueItemCard(item)));
}

function renderWaitingMedia(items) {
  const container = document.getElementById("waitingMediaList");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No items waiting for media.", "Items needing media will appear here after processing.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(item.plan_name || item.caption || item.id)}</strong>
        <span>${escapeHtml(item.caption || "No caption")}</span>
      </div>
      <form class="actions" data-attach-form="${escapeHtml(item.id)}">
        <input type="file" name="file" accept="image/*,video/*" required />
        <input type="text" name="caption" placeholder="Optional caption" />
        <button type="submit" class="button small primary">Attach Media</button>
      </form>
    `));
  });
}

function renderDrafts(items) {
  const container = document.getElementById("draftList");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No drafts or rethinking items.", "Process queue items to generate AI drafts for review.")); return; }
  items.forEach((item) => {
    const preview = item.media_url
      ? item.file_type === "video"
        ? `<video controls src="${escapeAttr(item.media_url)}"></video>`
        : `<img src="${escapeAttr(item.media_url)}" alt="Draft media" />`
      : `<span class="muted">No media</span>`;
    container.appendChild(card(`
      <div class="item-card">
        <div class="preview-frame">${preview}</div>
        <div class="line-meta">
          <strong>${escapeHtml(item.plan_name || item.caption || item.id)}</strong>
          <span>${escapeHtml(item.caption || "No caption context")}</span>
        </div>
        <div class="pill-row">
          ${renderStatusPill(item.status)}
          ${(item.publish_targets || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
          ${(item.tags || []).map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join("")}
        </div>
        ${item.generated_text ? `<div class="ai-text-block">${escapeHtml(item.generated_text)}</div>` : `<div class="subtle">No generated text yet.</div>`}
        <div class="actions" style="margin-top:8px">
          <button class="button small primary" data-action="approve" data-item-id="${escapeAttr(item.id)}">Approve</button>
          <button class="button small ghost" data-toggle-rethink="${escapeAttr(item.id)}">Rethink</button>
          <button class="button small danger" data-action="cancel" data-item-id="${escapeAttr(item.id)}">Cancel</button>
        </div>
        <form class="stack hidden" data-rethink-form="${escapeAttr(item.id)}" style="margin-top:8px">
          <textarea name="feedback" rows="3" placeholder="What should change?"></textarea>
          <button type="submit" class="button small primary">Submit Feedback</button>
        </form>
      </div>
    `, true));
  });
}

function renderPublishingOverview(payload) {
  const container = document.getElementById("publishingOverview");
  if (!container) return;
  const entries = [
    ["Scheduled", "scheduled", payload.scheduled || 0],
    ["Published", "published", payload.published || 0],
    ["Failed", "failed", payload.failed || 0],
    ["Approved Items", "approved", payload.approved_items || 0],
    ["Waiting For Schedule", "waiting_media", payload.waiting_for_schedule || 0],
    ["Upcoming", "new", (payload.upcoming || []).length],
  ];
  container.innerHTML = entries.map(([label, key, value]) => `
    <div class="metric-card ${metricColorClass(key, value)}">
      <span class="meta-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `).join("");
}

function renderTimeline(items) {
  const container = document.getElementById("timelineList");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No scheduled or published items.", "Approve drafts with a publish date to see them here.")); return; }
  items.forEach((item) => {
    const jobs = (item.publish_jobs || []).map((job) => {
      const retry = job.status === "failed"
        ? `<button class="button small ghost" data-retry-target="${escapeAttr(item.id)}" data-target="${escapeAttr(job.target)}">Retry ${escapeHtml(job.target)}</button>`
        : "";
      return `<div class="pill-row"><span class="pill">${escapeHtml(job.target || "?")}: ${escapeHtml(job.status || "?")}</span>${retry}</div>`;
    }).join("");

    const thumb = item.media_url
      ? (item.file_type === "video"
        ? `<div class="timeline-thumb"><video muted playsinline preload="metadata" src="${escapeAttr(item.media_url)}"></video></div>`
        : `<div class="timeline-thumb"><img src="${escapeAttr(item.media_url)}" alt="" loading="lazy" /></div>`)
      : `<div class="timeline-thumb timeline-thumb-empty">No media</div>`;

    container.appendChild(card(`
      <div class="timeline-row">
        ${thumb}
        <div class="timeline-body">
          <div class="line-meta">
            <strong>${escapeHtml(item.plan_name || item.caption || item.id)}</strong>
            <span>${escapeHtml(formatDate(item.publish_at))} · ${escapeHtml(item.status)}</span>
            <span>${escapeHtml(item.caption || "")}</span>
          </div>
          ${jobs || '<div class="subtle">No publish jobs.</div>'}
        </div>
      </div>
    `));
  });
}

function renderCommandHistory(items) {
  const container = document.getElementById("commandHistory");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No recent commands.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>/${escapeHtml(item.command || "unknown")}</strong>
        <span>${escapeHtml(item.summary || "—")}</span>
        <span class="subtle">${escapeHtml(formatDate(item.timestamp))}</span>
      </div>
    `));
  });
}

function renderSevereErrors(items) {
  const container = document.getElementById("severeErrors");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No severe errors.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(item.source || "bot")}</strong>
        <span>${escapeHtml(item.summary || "Unknown error")}</span>
        ${item.details ? `<span class="subtle">${escapeHtml(item.details)}</span>` : ""}
        <span class="subtle">${escapeHtml(formatDate(item.timestamp))}</span>
      </div>
    `));
  });
}

function renderMonitorQueueCounts(counts) {
  const container = document.getElementById("monitorQueueCounts");
  if (!container) return;
  const keys = ["new", "waiting_media", "draft", "rethinking", "approved", "canceled", "total"];
  container.innerHTML = keys.map((k) => `
    <div class="metric-card ${metricColorClass(k, counts[k])}">
      <span class="meta-label">${escapeHtml(statusLabels[k] || k)}</span>
      <strong>${escapeHtml(String(counts[k] ?? 0))}</strong>
    </div>
  `).join("");
}

function renderMonitorPublishing(pub) {
  const container = document.getElementById("monitorPublishing");
  if (!container) return;
  const entries = [
    ["Scheduled", "scheduled", pub.scheduled || 0],
    ["Published", "published", pub.published || 0],
    ["Failed", "failed", pub.failed || 0],
    ["Approved", "approved", pub.approved_items || 0],
    ["Waiting", "waiting_media", pub.waiting_for_schedule || 0],
  ];
  container.innerHTML = entries.map(([label, key, value]) => `
    <div class="metric-card ${metricColorClass(key, value)}">
      <span class="meta-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `).join("");
}

function renderRecentItems(items) {
  const container = document.getElementById("recentItems");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No recent queue items.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(item.planName || item.id)}</strong>
        ${renderStatusPill(item.status)}
        ${item.generatedText ? '<span class="pill">has text</span>' : '<span class="pill">no text</span>'}
        <span class="subtle">Processed ${escapeHtml(formatDate(item.processedAt))}</span>
        <span class="subtle">Publish ${escapeHtml(formatDate(item.publishAt))}</span>
      </div>
      ${(item.failedTargets || []).length ? `<div class="subtle" style="color:var(--danger)">Failed: ${escapeHtml(item.failedTargets.join(", "))}</div>` : ""}
    `));
  });
}

function renderFailedItems(items) {
  const container = document.getElementById("failedItems");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No failed or canceled items.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(item.planName || item.id)}</strong>
        ${renderStatusPill(item.status)}
        <span class="subtle">${escapeHtml(item.reason)}</span>
        <span class="subtle">Processed ${escapeHtml(formatDate(item.processedAt))} · Publish ${escapeHtml(formatDate(item.publishAt))}</span>
      </div>
    `));
  });
}

function renderOpenPlans(items) {
  const container = document.getElementById("openPlans");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) { container.appendChild(emptyState("No open plans.")); return; }
  items.forEach((item) => {
    container.appendChild(card(`
      <div class="line-meta">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(String(item.itemCount))} items</span>
      </div>
    `));
  });
}

async function handleProcess() {
  const btn = document.getElementById("processButton");
  btnLoading(btn, true, "Processing\u2026");
  try {
    const payload = await api("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const resultDiv = document.getElementById("processResult");
    if (resultDiv) {
      resultDiv.innerHTML = "";
      resultDiv.appendChild(card(`
        <div class="line-meta">
          <strong>Processing complete</strong>
          <span>Processed: ${payload.processed} · With media: ${payload.withMedia} · Waiting: ${payload.waitingForMedia}</span>
        </div>
      `));
    }
    showToast("Queue processed.");
    await loadQueuePage();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    btnLoading(btn, false);
  }
}

async function handlePublishNow() {
  const btn = document.getElementById("publishNowButton");
  btnLoading(btn, true, "Publishing\u2026");
  try {
    const payload = await api("/api/publish-now", { method: "POST" });
    const resultDiv = document.getElementById("publishResult");
    if (resultDiv) {
      resultDiv.innerHTML = "";
      resultDiv.appendChild(card(`
        <div class="line-meta">
          <strong>Publishing complete</strong>
          <span>Published: ${payload.published} · Failed: ${payload.failed}</span>
        </div>
      `));
    }
    showToast("Publish-now complete.");
    await loadPublishingPage();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    btnLoading(btn, false);
  }
}

async function handleDynamicSubmit(event) {
  const attachForm = event.target.closest("[data-attach-form]");
  const rethinkForm = event.target.closest("[data-rethink-form]");
  if (attachForm) {
    event.preventDefault();
    const itemId = attachForm.dataset.attachForm;
    const formData = new FormData(attachForm);
    try {
      await api(`/api/queue-items/${encodeURIComponent(itemId)}/attach-media`, { method: "POST", body: formData });
      showToast(`Media attached to ${itemId}.`);
      await loadQueuePage();
    } catch (error) { showToast(error.message, true); }
    return;
  }

  if (rethinkForm) {
    event.preventDefault();
    const itemId = rethinkForm.dataset.rethinkForm;
    const feedback = new FormData(rethinkForm).get("feedback");
    try {
      await api(`/api/queue-items/${encodeURIComponent(itemId)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rethink", feedback }),
      });
      showToast("Rethink submitted.");
      await loadQueuePage();
    } catch (error) { showToast(error.message, true); }
  }
}

async function handleDynamicClick(event) {
  const btn = event.target.closest("[data-action]");
  const toggleRethink = event.target.closest("[data-toggle-rethink]");
  const retryBtn = event.target.closest("[data-retry-target]");
  const openPlanBtn = event.target.closest("[data-open-plan]");
  const statusBtn = event.target.closest("[data-plan-status]");
  const deletePlanBtn = event.target.closest("[data-delete-plan]");
  const removeItemBtn = event.target.closest("[data-remove-plan-item]");
  const startProcBtn = event.target.closest("[data-start-processing]");
  const addTagBtn = event.target.closest("[data-add-tag]");
  const deleteMediaBtn = event.target.closest("[data-delete-media]");
  const removeReqBtn = event.target.closest("[data-remove-requirement]");
  const reqToggleBtn = event.target.closest("[data-requirement-toggle]");
  const planField = event.target.closest("[data-plan-field]");
  const itemField = event.target.closest("[data-item-field]");
  const appendItemBtn = event.target.closest("[data-append-plan-item]");

  if (openPlanBtn) {
    const plan = state.plans.find((p) => p.id === openPlanBtn.dataset.openPlan);
    if (plan) {
      state.currentPlan = plan;
      prunePendingPlanMediaNotInPlan(plan);
      closePlanBuilder();
      openPlanModal();
      renderPlans();
    }
    return;
  }

  if (statusBtn) {
    const plan = state.plans.find((p) => p.id === statusBtn.dataset.planStatus);
    if (plan) {
      plan.status = statusBtn.dataset.nextStatus;
      await api("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.plans),
      });
      await loadPlans();
    }
    return;
  }

  if (deletePlanBtn) {
    if (!window.confirm("Delete this plan?")) return;
    state.plans = state.plans.filter((p) => p.id !== deletePlanBtn.dataset.deletePlan);
    if (state.currentPlan?.id === deletePlanBtn.dataset.deletePlan) {
      Object.keys(state.pendingPlanMedia).forEach((id) => revokePendingPlanMedia(id));
      state.currentPlan = null;
      closePlanModal();
    }
    await api("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.plans),
    });
    showToast("Plan deleted.");
    await loadPlans();
    return;
  }

  if (startProcBtn) {
    void approvePlanSlotForQueue(startProcBtn.dataset.startProcessing, startProcBtn);
    return;
  }

  if (removeItemBtn) {
    if (!state.currentPlan) return;
    const rid = removeItemBtn.dataset.removePlanItem;
    revokePendingPlanMedia(rid);
    state.currentPlan.items = state.currentPlan.items.filter((i) => i.id !== rid);
    renderPlans();
    return;
  }

  if (deleteMediaBtn) {
    const itemId = deleteMediaBtn.dataset.deleteMedia;
    if (!state.currentPlan) return;
    const item = state.currentPlan.items?.find((i) => i.id === itemId);
    if (item) {
      revokePendingPlanMedia(itemId);
      item.mediaUrl = undefined;
      item.uploadedMediaType = undefined;
      item.status = "preparing";
    }
    renderPlans();
    return;
  }

  if (addTagBtn) {
    const itemId = addTagBtn.dataset.addTag;
    const existing = addTagBtn.parentElement?.querySelector(".inline-tag-input");
    if (existing) { existing.querySelector("input")?.focus(); return; }
    const wrapper = document.createElement("span");
    wrapper.className = "inline-tag-input";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = "tag name";
    inp.setAttribute("aria-label", "Tag name");
    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "button small primary";
    confirmBtn.textContent = "Add";
    const commitTag = () => {
      const val = inp.value.trim();
      if (!val || !state.currentPlan) return;
      const item = state.currentPlan.items?.find((i) => i.id === itemId);
      if (item) { if (!item.tags) item.tags = []; item.tags.push(val); }
      renderPlans();
    };
    confirmBtn.addEventListener("click", commitTag);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); commitTag(); } if (e.key === "Escape") { wrapper.remove(); } });
    wrapper.appendChild(inp);
    wrapper.appendChild(confirmBtn);
    addTagBtn.parentElement?.appendChild(wrapper);
    inp.focus();
    return;
  }

  if (removeReqBtn) {
    const row = removeReqBtn.closest(".item-card");
    if (row) row.remove();
    return;
  }

  if (reqToggleBtn) {
    reqToggleBtn.classList.toggle("primary");
    reqToggleBtn.classList.toggle("ghost");
    return;
  }

  if (planField || itemField) return;

  if (appendItemBtn) {
    if (!state.currentPlan) return;
    if (!state.currentPlan.items) state.currentPlan.items = [];
    state.currentPlan.items.push({
      id: uuid(),
      day: "",
      mediaType: "any",
      contentTypes: ["Instagram Feed"],
      status: "preparing",
      tags: [],
    });
    renderPlans();
    return;
  }

  if (toggleRethink) {
    const form = document.querySelector(`[data-rethink-form="${CSS.escape(toggleRethink.dataset.toggleRethink)}"]`);
    if (form) form.classList.toggle("hidden");
    return;
  }

  if (btn) {
    const itemId = btn.dataset.itemId;
    const action = btn.dataset.action;
    if (action === "cancel" && !window.confirm("Cancel this draft?")) return;
    try {
      await api(`/api/queue-items/${encodeURIComponent(itemId)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      showToast(`${action} completed.`);
      await loadQueuePage();
    } catch (error) { showToast(error.message, true); }
    return;
  }

  if (retryBtn) {
    try {
      await api(`/api/queue-items/${encodeURIComponent(retryBtn.dataset.retryTarget)}/publish-jobs/${encodeURIComponent(retryBtn.dataset.target)}/retry`, { method: "POST" });
      showToast("Retry requested.");
      await loadPublishingPage();
    } catch (error) { showToast(error.message, true); }
  }
}

async function approvePlanSlotForQueue(itemId, buttonEl) {
  if (!state.currentPlan || !itemId) return;
  const item = state.currentPlan.items?.find((i) => i.id === itemId);
  if (!item) return;

  if (!item.publishAt) {
    showToast("Set the plan start date and day label so a publish time exists.", true);
    return;
  }

  const pending = state.pendingPlanMedia[itemId];
  const hasSavedMedia = Boolean(item.mediaUrl);
  if (!pending?.file && !hasSavedMedia) {
    showToast("Choose a media file for this slot first.", true);
    return;
  }

  const label = buttonEl.textContent;
  buttonEl.disabled = true;
  try {
    if (pending?.file) {
      buttonEl.textContent = "Uploading…";
      const formData = new FormData();
      formData.append("file", pending.file);
      const uploadPayload = await api("/api/media/upload", { method: "POST", body: formData });
      item.mediaUrl = uploadPayload.url;
      if (pending.file.type.startsWith("video/")) item.uploadedMediaType = "video";
      else if (pending.file.type.startsWith("image/")) item.uploadedMediaType = "photo";
      revokePendingPlanMedia(itemId);
    }

    buttonEl.textContent = "Saving…";
    item.status = "approved";
    const cid = state.currentPlan.id;
    const idx = state.plans.findIndex((p) => p.id === cid);
    if (idx >= 0) state.plans[idx] = state.currentPlan;
    else state.plans.push(state.currentPlan);

    await api("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.plans),
    });

    buttonEl.textContent = "Loading…";
    await loadPlans();
    showToast("Plan saved — media and tags are on the server.");
  } catch (err) {
    showToast(err.message || "Could not approve slot", true);
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = label;
  }
}

function handlePlanFieldChange(event) {
  const planField = event.target.closest("[data-plan-field]");
  const itemField = event.target.closest("[data-item-field]");

  if (planField) {
    const field = planField.dataset.planField;
    if (state.currentPlan && field) state.currentPlan[field] = event.target.value;
    if (field === "startDate") {
      state.currentPlan = applyDerivedScheduleToPlan(state.currentPlan);
      renderPlans();
    }
    return;
  }

  if (itemField) {
    const itemId = itemField.dataset.itemField;
    const fieldName = itemField.dataset.fieldName;
    if (!state.currentPlan) return;
    const item = state.currentPlan.items?.find((i) => i.id === itemId);
    if (item && fieldName) {
      item[fieldName] = event.target.value;
      if (fieldName === "startDate" || fieldName === "day") {
        state.currentPlan = applyDerivedScheduleToPlan(state.currentPlan);
      }
      renderPlans();
    }
    return;
  }
}

function handlePlanItemPlatformChange(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
  const itemId = input.dataset.platformItem;
  if (!itemId) return;

  const item = state.currentPlan?.items?.find((i) => i.id === itemId);
  if (!item) return;

  const ct = input.value;
  if (!item.contentTypes) item.contentTypes = [];

  if (input.checked) {
    if (!item.contentTypes.includes(ct)) item.contentTypes.push(ct);
  } else if (item.contentTypes.length <= 1) {
    input.checked = true;
    showToast("Choose at least one platform.", true);
    return;
  } else {
    item.contentTypes = item.contentTypes.filter((x) => x !== ct);
  }
  const platformDetails = input.closest(".plan-item-details");
  const summary = platformDetails?.querySelector(":scope > summary");
  if (summary && summary.textContent.startsWith("Platforms")) {
    summary.textContent = `Platforms (${item.contentTypes.length} selected)`;
  }
}

function renderQueueItemCard(item) {
  const preview = item.media_url
    ? item.file_type === "video"
      ? `<video controls src="${escapeAttr(item.media_url)}"></video>`
      : `<img src="${escapeAttr(item.media_url)}" alt="Queue media" />`
    : `<span class="muted">No media</span>`;
  return card(`
    <div class="item-card">
      <div class="preview-frame">${preview}</div>
      <div class="line-meta">
        <strong>${escapeHtml(item.plan_name || item.caption || item.id)}</strong>
        <span>${escapeHtml(item.caption || "No caption")}</span>
        <span class="subtle">${escapeHtml(item.file_type || "photo")} · ${escapeHtml(formatDate(item.publish_at))}</span>
      </div>
      <div class="pill-row">
        ${renderStatusPill(item.status)}
        ${(item.publish_targets || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
      </div>
    </div>
  `, true);
}

function renderStatusPill(status) {
  return `<span class="pill status-${escapeAttr(status || "unknown")}">${escapeHtml(statusLabels[status] || status || "?")}</span>`;
}

function card(inner, skipWrapper = false) {
  const node = document.createElement("div");
  node.className = skipWrapper ? "" : "item-card";
  node.innerHTML = skipWrapper ? inner : `<div>${inner}</div>`;
  return node;
}

function emptyState(message, hint, actionLabel, actionFn) {
  const node = document.createElement("div");
  node.className = "empty";
  node.textContent = message;
  if (hint) {
    const hintEl = document.createElement("span");
    hintEl.className = "empty-hint";
    hintEl.textContent = hint;
    node.appendChild(hintEl);
  }
  if (actionLabel && actionFn) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button small primary";
    btn.textContent = actionLabel;
    btn.addEventListener("click", actionFn);
    node.appendChild(btn);
  }
  return node;
}

function btnLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn._origLabel = btn._origLabel || btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span>${escapeHtml(label || btn._origLabel)}`;
  } else {
    btn.disabled = false;
    btn.textContent = btn._origLabel || label || "";
    delete btn._origLabel;
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.classList.remove("hidden", "hiding");
  toast.style.background = isError ? "#b91c1c" : "#0f172a";
  const icon = isError ? "\u2716" : "\u2714";
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${escapeHtml(message)}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.add("hiding");
    window.setTimeout(() => { toast.classList.add("hidden"); toast.classList.remove("hiding"); }, 200);
  }, 3500);
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function parseLines(value) {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

function inferUploadedMediaType(mediaUrl, mediaType) {
  if (!mediaUrl) return mediaType === "video" ? "video" : "photo";
  const lower = mediaUrl.toLowerCase();
  if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].some((e) => lower.endsWith(e))) return "video";
  return "photo";
}

function acceptForMediaType(mediaType) {
  if (mediaType === "video") return "video/*";
  if (mediaType === "photo") return "image/*";
  return "image/*,video/*";
}

function contentTypes() { return CONTENT_TYPES; }

function normalizePlanStatus(status) {
  return status || "preparing";
}

function defaultRequirements(type) {
  if (type === "week") return [
    { day: "Monday", mediaType: "photo", contentTypes: ["Instagram Feed", "Facebook Post"] },
    { day: "Wednesday", mediaType: "video", contentTypes: ["Instagram Story"] },
    { day: "Friday", mediaType: "video", contentTypes: ["Instagram Reel", "TikTok Video"] },
  ];
  if (type === "month") return Array.from({ length: 8 }, (_, i) => ({
    day: `Week ${Math.floor(i / 2) + 1} - ${i % 2 === 0 ? "Tuesday" : "Thursday"}`,
    mediaType: i % 2 === 0 ? "photo" : "video",
    contentTypes: i % 2 === 0 ? ["Instagram Feed", "Facebook Post"] : ["Instagram Reel", "TikTok Video"],
  }));
  return Array.from({ length: 12 }, (_, i) => ({
    day: `Month ${Math.floor(i / 4) + 1}, Week ${(i % 4) + 1}`,
    mediaType: "any",
    contentTypes: ["Facebook Post", "Instagram Feed"],
  }));
}

function getTodayDateInputValue() {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function applyDerivedScheduleToPlan(plan) {
  if (!plan) return plan;
  const startDate = plan.startDate;
  const items = Array.isArray(plan.items) ? plan.items : [];
  return {
    ...plan,
    items: items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const schedule = resolveItemSchedule(startDate, item.day, item.publishAt);
      return { ...item, publishAt: schedule.publishAt || item.publishAt };
    }),
  };
}

function resolveItemSchedule(startDate, dayLabel, existingPublishAt) {
  if (!startDate) return { publishAt: existingPublishAt || undefined, error: "Set a start date." };
  if (!dayLabel) return { publishAt: existingPublishAt || undefined, error: "Set a day label." };

  const WEEKDAY = new Map([
    ["sunday", 0], ["sun", 0], ["monday", 1], ["mon", 1], ["tuesday", 2], ["tue", 2],
    ["wednesday", 3], ["wed", 3], ["thursday", 4], ["thu", 4], ["friday", 5], ["fri", 5],
    ["saturday", 6], ["sat", 6],
  ]);

  const label = dayLabel.trim().toLowerCase().replace(/\s+/g, " ");
  let offsetDays = null;

  const wi = WEEKDAY.get(label);
  if (wi !== undefined && startDate) {
    const start = new Date(startDate + "T00:00:00");
    offsetDays = ((wi - start.getDay() + 7) % 7);
  }

  if (offsetDays === null) {
    const m = label.match(/^day\s+(\d+)$/);
    if (m) offsetDays = Math.max(0, parseInt(m[1]) - 1);
  }

  if (offsetDays === null) {
    const m = label.match(/^week\s+(\d+)\s*[-,]\s*(.+)$/);
    if (m && startDate) {
      const weekIdx = Math.max(0, parseInt(m[1]) - 1);
      const nested = m[2].trim().toLowerCase();
      const nwi = WEEKDAY.get(nested);
      const start = new Date(startDate + "T00:00:00");
      offsetDays = nwi !== undefined ? weekIdx * 7 + ((nwi - start.getDay() + 7) % 7) : null;
      if (offsetDays === null) {
        const nm = nested.match(/^day\s+(\d+)$/);
        if (nm) offsetDays = weekIdx * 7 + Math.max(0, parseInt(nm[1]) - 1);
      }
    }
  }

  if (offsetDays === null) {
    const m = label.match(/^week\s+(\d+)$/);
    if (m) offsetDays = Math.max(0, parseInt(m[1]) - 1) * 7;
  }

  if (offsetDays === null) {
    const m = label.match(/^month\s+(\d+)\s*,?\s*week\s+(\d+)(?:\s*[-,]\s*(.+))?$/);
    if (m && startDate) {
      const monthIdx = Math.max(0, parseInt(m[1]) - 1);
      const weekIdx = Math.max(0, parseInt(m[2]) - 1);
      const base = monthIdx * 28 + weekIdx * 7;
      const nested = m[3]?.trim().toLowerCase();
      if (!nested) offsetDays = base;
      else {
        const nwi = WEEKDAY.get(nested);
        const start = new Date(startDate + "T00:00:00");
        offsetDays = nwi !== undefined ? base + ((nwi - start.getDay() + 7) % 7) : null;
      }
    }
  }

  if (offsetDays === null || !startDate) return { publishAt: existingPublishAt || undefined, error: "Could not parse day label." };

  const publishDate = new Date(startDate + "T00:00:00");
  publishDate.setDate(publishDate.getDate() + offsetDays);
  let hours = 9, minutes = 0;
  if (existingPublishAt) {
    const existing = new Date(existingPublishAt);
    if (!Number.isNaN(existing.getTime())) { hours = existing.getHours(); minutes = existing.getMinutes(); }
  }
  publishDate.setHours(hours, minutes, 0, 0);
  return { publishAt: publishDate.toISOString(), error: null };
}
