const state = {
  packages: [],
  filtered: []
};

const REPOSITORY = {
  github: "https://github.com/dpx-star/dpx-star.github.io",
  index: "index.json"
};

const els = {
  grid: document.getElementById("packageGrid"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  category: document.getElementById("categoryFilter"),
  count: document.getElementById("packageCount"),
  github: document.getElementById("githubLink"),
  heroGithub: document.getElementById("heroGithub"),
  theme: document.getElementById("themeButton"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalCategory: document.getElementById("modalCategory"),
  modalDescription: document.getElementById("modalDescription"),
  modalVersion: document.getElementById("modalVersion"),
  modalLicense: document.getElementById("modalLicense"),
  modalPublisher: document.getElementById("modalPublisher"),
  modalPlatform: document.getElementById("modalPlatform"),
  modalCommand: document.getElementById("modalCommand"),
  modalDownload: document.getElementById("modalDownload"),
  modalSource: document.getElementById("modalSource"),
  copyCommand: document.getElementById("copyCommand"),
  year: document.getElementById("year")
};

// Repository links
els.github.href = REPOSITORY.github;
els.heroGithub.href = REPOSITORY.github;

// Current year
els.year.textContent = new Date().getFullYear();


// ============================================================
// Security / HTML escaping
// ============================================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}


// ============================================================
// Package icons
// ============================================================

function iconFor(category) {
  const icons = {
    browser: "◉",
    development: "</>",
    utilities: "⚙",
    media: "▶",
    games: "◆",
    productivity: "✦"
  };

  return icons[String(category).toLowerCase()] || "□";
}


// ============================================================
// Load package repository
// ============================================================

async function loadPackages() {
  els.count.textContent = "Loading…";

  try {
    const response = await fetch(REPOSITORY.index, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    state.packages = Array.isArray(data.packages)
      ? data.packages
      : [];

    populateCategories();
    applyFilters();

  } catch (error) {

    console.error("Could not load package index:", error);

    state.packages = [];

    els.count.textContent = "Repository unavailable";

    els.grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">!</div>
        <h3>Could not load the package repository</h3>
        <p>
          Check that <code>index.json</code> exists and that
          the site is being served over HTTP(S).
        </p>
      </div>
    `;
  }
}


// ============================================================
// Categories
// ============================================================

function populateCategories() {
  const categories = [
    ...new Set(
      state.packages
        .map(pkg => pkg.category)
        .filter(Boolean)
    )
  ].sort();

  els.category.innerHTML =
    `<option value="all">All categories</option>`;

  for (const category of categories) {
    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    els.category.appendChild(option);
  }
}


// ============================================================
// Search / filtering
// ============================================================

function applyFilters() {
  const query = els.search.value.trim().toLowerCase();
  const category = els.category.value;

  state.filtered = state.packages.filter(pkg => {

    const haystack = [
      pkg.name,
      pkg.id,
      pkg.description,
      pkg.category,
      pkg.publisher
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || haystack.includes(query);

    const matchesCategory =
      category === "all" ||
      pkg.category === category;

    return matchesSearch && matchesCategory;
  });

  renderPackages();
}


// ============================================================
// Render packages
// ============================================================

function renderPackages() {

  els.count.textContent =
    `${state.filtered.length} package${
      state.filtered.length === 1 ? "" : "s"
    }`;

  if (!state.filtered.length) {

    els.grid.innerHTML = "";

    els.empty.classList.remove("hidden");

    return;
  }

  els.empty.classList.add("hidden");

  els.grid.innerHTML = state.filtered.map((pkg, index) => `
    <article class="package-card">

      <div class="package-top">

        <div class="package-icon">
          ${escapeHtml(iconFor(pkg.category))}
        </div>

        <span class="tag">
          ${escapeHtml(pkg.category || "Other")}
        </span>

      </div>

      <h3>
        ${escapeHtml(pkg.name)}
      </h3>

      <span class="version">
        v${escapeHtml(pkg.version || "unknown")}
      </span>

      <p>
        ${escapeHtml(
          pkg.description ||
          "No description provided."
        )}
      </p>

      <div class="package-footer">

        <small>
          ${escapeHtml(
            pkg.platform ||
            "Windows"
          )}
        </small>

        <button
          class="button secondary small"
          type="button"
          data-package-index="${index}"
        >
          View
        </button>

      </div>

    </article>
  `).join("");


  // Package buttons
  els.grid
    .querySelectorAll("[data-package-index]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const index =
          Number(button.dataset.packageIndex);

        openPackage(state.filtered[index]);
      });

    });
}


// ============================================================
// Package modal
// ============================================================

function openPackage(pkg) {

  els.modalTitle.textContent =
    pkg.name || "Package";

  els.modalCategory.textContent =
    pkg.category || "Other";

  els.modalDescription.textContent =
    pkg.description ||
    "No description provided.";

  els.modalVersion.textContent =
    pkg.version || "Unknown";

  els.modalLicense.textContent =
    pkg.license || "Unknown";

  els.modalPublisher.textContent =
    pkg.publisher || "Unknown";

  els.modalPlatform.textContent =
    pkg.platform || "Windows";


  // DPX command
  els.modalCommand.textContent =
    `dpx install ${pkg.id || pkg.name}`;


  els.modalDownload.href =
    pkg.download || "#";

  els.modalSource.href =
    pkg.source || REPOSITORY.github;


  els.modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";
}


// ============================================================
// Close modal
// ============================================================

function closeModal() {

  els.modal.classList.add("hidden");

  document.body.style.overflow = "";
}


// ============================================================
// Copy DPX command
// ============================================================

async function copyInstallCommand() {

  try {

    await navigator.clipboard.writeText(
      els.modalCommand.textContent
    );

    const original =
      els.copyCommand.textContent;

    els.copyCommand.textContent =
      "Copied!";

    setTimeout(() => {

      els.copyCommand.textContent =
        original;

    }, 1200);

  } catch {

    alert(
      "Could not copy the command automatically."
    );
  }
}


// ============================================================
// Theme
// ============================================================

function loadTheme() {

  // Changed from dpm-theme -> dpx-theme
  const saved =
    localStorage.getItem("dpx-theme");

  const theme =
    saved || "dark";

  document.documentElement.dataset.theme =
    theme;

  els.theme.textContent =
    theme === "dark"
      ? "☀"
      : "☾";
}


function toggleTheme() {

  const next =
    document.documentElement.dataset.theme === "dark"
      ? "light"
      : "dark";

  document.documentElement.dataset.theme =
    next;

  localStorage.setItem(
    "dpx-theme",
    next
  );

  els.theme.textContent =
    next === "dark"
      ? "☀"
      : "☾";
}


// ============================================================
// Event listeners
// ============================================================

els.search.addEventListener(
  "input",
  applyFilters
);

els.category.addEventListener(
  "change",
  applyFilters
);

els.theme.addEventListener(
  "click",
  toggleTheme
);

els.copyCommand.addEventListener(
  "click",
  copyInstallCommand
);


// Close modal buttons
document
  .querySelectorAll("[data-close-modal]")
  .forEach(element => {

    element.addEventListener(
      "click",
      closeModal
    );

  });


// Escape key closes modal
document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !els.modal.classList.contains("hidden")
    ) {
      closeModal();
    }

  }
);


// ============================================================
// Start DPX website
// ============================================================

loadTheme();
loadPackages();
