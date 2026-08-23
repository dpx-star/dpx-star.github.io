"use strict";

const state = {
    packages: [],
    category: "all",
    search: ""
};

const packagesGrid = document.getElementById("packagesGrid");
const featuredPackages = document.getElementById("featuredPackages");
const searchInput = document.getElementById("searchInput");
const resultsCount = document.getElementById("resultsCount");
const packageCount = document.getElementById("packageCount");
const categoryCount = document.getElementById("categoryCount");
const emptyState = document.getElementById("emptyState");
const clearSearch = document.getElementById("clearSearch");

const modal = document.getElementById("packageModal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");


/* =========================
   LOAD REGISTRY
========================= */

async function loadRegistry() {

    try {

        const response = await fetch("index.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error("Unable to load package registry.");
        }

        const data = await response.json();

        state.packages = Array.isArray(data.packages)
            ? data.packages
            : [];

        updateStats();
        renderFeatured();
        renderPackages();

    } catch (error) {

        console.error(error);

        packagesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">!</div>

                <h3>Registry unavailable</h3>

                <p>
                    The package registry could not be loaded.
                </p>
            </div>
        `;

    }

}


/* =========================
   STATS
========================= */

function updateStats() {

    packageCount.textContent = state.packages.length;

    const categories = new Set();

    state.packages.forEach(pkg => {

        if (Array.isArray(pkg.categories)) {

            pkg.categories.forEach(category => {
                categories.add(category);
            });

        }

    });

    categoryCount.textContent = categories.size;

}


/* =========================
   FILTERING
========================= */

function getFilteredPackages() {

    const query = state.search
        .trim()
        .toLowerCase();

    return state.packages.filter(pkg => {

        const matchesCategory =
            state.category === "all" ||
            (
                Array.isArray(pkg.categories) &&
                pkg.categories.includes(state.category)
            );

        if (!matchesCategory) {
            return false;
        }

        if (!query) {
            return true;
        }

        const searchable = [
            pkg.name,
            pkg.description,
            pkg.author,
            ...(pkg.categories || []),
            ...(pkg.tags || [])
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchable.includes(query);

    });

}


/* =========================
   PACKAGE CARD
========================= */

function createPackageCard(pkg, featured = false) {

    const categories = Array.isArray(pkg.categories)
        ? pkg.categories
        : [];

    const tags = Array.isArray(pkg.tags)
        ? pkg.tags
        : [];

    const icon = pkg.icon || "D";

    const categoryHTML = categories
        .slice(0, 2)
        .map(category =>
            `<span class="tag">${escapeHTML(category)}</span>`
        )
        .join("");

    const tagsHTML = tags
        .slice(0, 2)
        .map(tag =>
            `<span class="tag">${escapeHTML(tag)}</span>`
        )
        .join("");

    const card = document.createElement("article");

    card.className =
        `package-card ${featured ? "featured-card" : ""}`;

    card.innerHTML = `
        <div class="package-top">

            <div class="package-icon">
                ${escapeHTML(icon)}
            </div>

            <span class="package-version">
                v${escapeHTML(pkg.version || "0.0.0")}
            </span>

        </div>

        <h3>
            ${escapeHTML(pkg.name)}
        </h3>

        <p class="package-description">
            ${escapeHTML(pkg.description || "No description available.")}
        </p>

        <div class="package-meta">
            ${categoryHTML}
            ${tagsHTML}
        </div>
    `;

    card.addEventListener("click", () => {
        openPackage(pkg);
    });

    return card;

}


/* =========================
   RENDER PACKAGES
========================= */

function renderPackages() {

    const filtered = getFilteredPackages();

    packagesGrid.innerHTML = "";

    resultsCount.textContent =
        `${filtered.length} package${filtered.length === 1 ? "" : "s"}`;

    if (filtered.length === 0) {

        emptyState.classList.remove("hidden");

        return;

    }

    emptyState.classList.add("hidden");

    filtered.forEach(pkg => {

        packagesGrid.appendChild(
            createPackageCard(pkg)
        );

    });

}


/* =========================
   FEATURED
========================= */

function renderFeatured() {

    featuredPackages.innerHTML = "";

    const featured = state.packages
        .filter(pkg => pkg.featured === true)
        .slice(0, 3);

    featured.forEach(pkg => {

        featuredPackages.appendChild(
            createPackageCard(pkg, true)
        );

    });

}


/* =========================
   MODAL
========================= */

function openPackage(pkg) {

    const installCommand =
        pkg.install ||
        `dpx install ${pkg.name}`;

    modalContent.innerHTML = `
        <div class="package-icon">
            ${escapeHTML(pkg.icon || "D")}
        </div>

        <br>

        <h2 class="modal-title">
            ${escapeHTML(pkg.name)}
        </h2>

        <p class="modal-description">
            ${escapeHTML(pkg.description || "")}
        </p>

        <div class="package-meta">

            <span class="tag">
                v${escapeHTML(pkg.version || "0.0.0")}
            </span>

            <span class="tag">
                ${escapeHTML(pkg.author || "Unknown")}
            </span>

        </div>

        <br>

        <div class="install-command">
            ${escapeHTML(installCommand)}
        </div>

        <button
            class="copy-button"
            id="copyInstall"
        >
            Copy install command
        </button>
    `;

    modal.classList.remove("hidden");

    document
        .getElementById("copyInstall")
        .addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(
                    installCommand
                );

                const button =
                    document.getElementById("copyInstall");

                button.textContent = "Copied!";

                setTimeout(() => {
                    button.textContent =
                        "Copy install command";
                }, 1500);

            } catch (error) {

                console.error(error);

            }

        });

}


/* =========================
   CLOSE MODAL
========================= */

function hideModal() {
    modal.classList.add("hidden");
}

closeModal.addEventListener("click", hideModal);

modal.addEventListener("click", event => {

    if (
        event.target.classList.contains("modal-backdrop")
    ) {
        hideModal();
    }

});

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        hideModal();
    }

});


/* =========================
   SEARCH
========================= */

searchInput.addEventListener("input", event => {

    state.search = event.target.value;

    renderPackages();

});


/* =========================
   CATEGORY BUTTONS
========================= */

document
    .querySelectorAll(".quick-tags button")
    .forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".quick-tags button")
                .forEach(btn =>
                    btn.classList.remove("active")
                );

            button.classList.add("active");

            state.category =
                button.dataset.category || "all";

            renderPackages();

        });

    });


/* =========================
   CLEAR SEARCH
========================= */

clearSearch.addEventListener("click", () => {

    searchInput.value = "";

    state.search = "";
    state.category = "all";

    document
        .querySelectorAll(".quick-tags button")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    document
        .querySelector('[data-category="all"]')
        .classList.add("active");

    renderPackages();

});


/* =========================
   "/" SEARCH SHORTCUT
========================= */

document.addEventListener("keydown", event => {

    const target = event.target;

    const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA";

    if (
        event.key === "/" &&
        !isTyping
    ) {

        event.preventDefault();

        searchInput.focus();

    }

});


/* =========================
   HTML ESCAPING
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   START
========================= */

document
    .querySelector('[data-category="all"]')
    .classList.add("active");

loadRegistry();
