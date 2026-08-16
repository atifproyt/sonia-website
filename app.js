const defaultProducts = [
  { id: "sonias-rakhi", name: "Sonia's Handmade Rakhi", price: null, category: "Gifts", material: "Kundan · pearls · green beads", description: "A festive handmade rakhi with kundan, pearls and green beads.", tag: "Handmade", available: true, image: "assets/sonia-handmade-rakhi.png" }
];
const catalogueVersion = "sonia-one-piece-v1";

const state = {
  products: initialCatalogue(),
  bag: readStorage("sonia-bag", []),
  activeFilter: "All",
  imageData: ""
};

const el = (selector, parent = document) => parent.querySelector(selector);
const els = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function initialCatalogue() {
  const savedProducts = readStorage("sonia-products", []);
  if (readStorage("sonia-catalogue-version", "") !== catalogueVersion) {
    try { localStorage.setItem("sonia-catalogue-version", catalogueVersion); } catch { /* browser storage unavailable */ }
    return structuredClone(defaultProducts);
  }
  return Array.isArray(savedProducts) && savedProducts.length ? savedProducts : structuredClone(defaultProducts);
}
function persist() {
  localStorage.setItem("sonia-products", JSON.stringify(state.products));
  localStorage.setItem("sonia-bag", JSON.stringify(state.bag));
  localStorage.setItem("sonia-catalogue-version", catalogueVersion);
}
function getProduct(id) { return state.products.find((product) => product.id === id); }
function matchesFilter(product, filter) { return filter === "All" || product.category === filter || product.tag === filter; }
function displayPrice(product) { return Number.isFinite(product.price) ? currency.format(product.price) : "Price on request"; }

function renderProducts() {
  const grid = el("#product-grid");
  const matchingProducts = state.products.filter((product) => matchesFilter(product, state.activeFilter));
  grid.classList.toggle("single-product", matchingProducts.length === 1);
  grid.innerHTML = "";
  if (!matchingProducts.length) {
    grid.innerHTML = '<p class="empty-bag">No pieces in this collection yet. Our owner studio can add one in seconds.</p>';
    return;
  }
  const template = el("#product-card-template");
  matchingProducts.forEach((product) => {
    const card = template.content.cloneNode(true);
    const article = el(".product-card", card);
    if (!product.available) article.classList.add("unavailable");
    const image = el("img", card);
    image.src = product.image;
    image.alt = product.name;
    el(".product-tag", card).textContent = product.tag;
    el(".product-category", card).textContent = product.category;
    el("h3", card).textContent = product.name;
    el(".product-material", card).textContent = product.description || product.material;
    el("strong", card).textContent = displayPrice(product);
    el(".product-image-button", card).addEventListener("click", () => showProduct(product.id));
    const addButton = el(".add-button", card);
    if (Number.isFinite(product.price)) addButton.addEventListener("click", () => addToBag(product.id));
    else {
      addButton.innerHTML = 'View &amp; enquire <span>→</span>';
      addButton.addEventListener("click", () => showProduct(product.id));
    }
    grid.append(card);
  });
}

function renderBag() {
  const bagItems = el("#bag-items");
  const bagProducts = state.bag.map(getProduct).filter(Boolean);
  el("#bag-count").textContent = bagProducts.length;
  el("#bag-total").textContent = currency.format(bagProducts.reduce((total, product) => total + product.price, 0));
  bagItems.innerHTML = bagProducts.length ? "" : '<p class="empty-bag">Your bag is waiting for a little sparkle.</p>';
  bagProducts.forEach((product, index) => {
    const item = document.createElement("div");
    item.className = "bag-line";
    item.innerHTML = `<img src="${escapeHTML(product.image)}" alt="" /><div><h3>${escapeHTML(product.name)}</h3><p>${displayPrice(product)}</p></div><button class="bag-remove" aria-label="Remove ${escapeHTML(product.name)}" data-index="${index}">×</button>`;
    bagItems.append(item);
  });
  els(".bag-remove").forEach((button) => button.addEventListener("click", () => {
    state.bag.splice(Number(button.dataset.index), 1);
    persist(); renderBag();
  }));
}

function showProduct(id) {
  const product = getProduct(id);
  if (!product) return;
  const canOrder = product.available && Number.isFinite(product.price);
  el("#product-detail").innerHTML = `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" /><div><p class="eyebrow">${escapeHTML(product.tag)} · ${escapeHTML(product.category)}</p><h2>${escapeHTML(product.name)}</h2><p class="detail-price">${displayPrice(product)}</p><p class="detail-copy">${escapeHTML(product.description || `A considered handmade piece crafted in ${(product.material || "carefully chosen materials").toLowerCase()}.`)}</p>${canOrder ? `<button class="button button-dark detail-add" data-id="${product.id}">Add to bag <span>→</span></button>` : product.available ? '<p class="detail-copy"><strong>This special piece is available by request.</strong> Sonia can add a price whenever it is ready to order.</p>' : '<p class="detail-copy"><strong>Currently sold out.</strong> Check back soon for a restock.</p>'}</div>`;
  el("#product-dialog").showModal();
  el(".detail-add")?.addEventListener("click", () => { addToBag(product.id); el("#product-dialog").close(); });
}

function addToBag(id) {
  const product = getProduct(id);
  if (!product?.available || !Number.isFinite(product.price)) return;
  state.bag.push(id);
  persist(); renderBag(); openBag();
}
function openBag() { el(".bag-panel").classList.add("open"); el(".backdrop").classList.add("visible"); el(".bag-panel").setAttribute("aria-hidden", "false"); }
function closeBag() { el(".bag-panel").classList.remove("open"); el(".backdrop").classList.remove("visible"); el(".bag-panel").setAttribute("aria-hidden", "true"); }

function renderCatalogue() {
  const list = el("#catalogue-list");
  el("#inventory-count").textContent = state.products.length;
  list.innerHTML = "";
  [...state.products].reverse().forEach((product) => {
    const item = document.createElement("div");
    item.className = "catalogue-item";
    item.innerHTML = `<img src="${escapeHTML(product.image)}" alt="" /><div><h4>${escapeHTML(product.name)}</h4><p>${escapeHTML(product.category)} · ${displayPrice(product)} · ${product.available ? "Live" : "Sold out"}</p></div><div class="catalogue-actions"><button data-edit="${product.id}">Edit</button><button data-delete="${product.id}">Delete</button></div>`;
    list.append(item);
  });
  els("[data-edit]", list).forEach((button) => button.addEventListener("click", () => editProduct(button.dataset.edit)));
  els("[data-delete]", list).forEach((button) => {
    button.addEventListener("click", () => {
      const product = getProduct(button.dataset.delete);
      if (product && confirm(`Delete “${product.name}” from the shop?`)) {
        state.products = state.products.filter((item) => item.id !== product.id);
        state.bag = state.bag.filter((id) => id !== product.id);
        persist(); renderProducts(); renderBag(); renderCatalogue();
      }
    });
  });
}

function editProduct(id) {
  const product = getProduct(id);
  if (!product) return;
  el("#product-id").value = product.id;
  el("#product-name").value = product.name;
  el("#product-price").value = Number.isFinite(product.price) ? product.price : "";
  el("#product-category").value = product.category;
  el("#product-material").value = product.material;
  el("#product-tag").value = product.tag;
  el("#product-available").checked = product.available;
  state.imageData = product.image;
  previewImage(product.image);
  el("#admin-form-title").textContent = "Edit piece";
  el("#save-label").textContent = "Save changes";
  el("#cancel-edit").hidden = false;
  el(".admin-content").scrollTo({ top: 0, behavior: "smooth" });
}
function clearForm() {
  el("#product-form").reset();
  el("#product-id").value = "";
  state.imageData = "";
  el("#image-preview").textContent = "Your product photo will appear here";
  el("#admin-form-title").textContent = "Quickly add a new piece";
  el("#save-label").textContent = "Publish to shop";
  el("#cancel-edit").hidden = true;
}
function previewImage(url) {
  el("#image-preview").innerHTML = `<img src="${escapeHTML(url)}" alt="Product preview" />`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

els(".filter").forEach((button) => button.addEventListener("click", () => {
  state.activeFilter = button.dataset.filter;
  els(".filter").forEach((item) => item.classList.toggle("active", item === button));
  renderProducts();
}));
els(".feature-strip a").forEach((link) => link.addEventListener("click", () => {
  const filter = link.dataset.filter;
  state.activeFilter = filter;
  els(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
  renderProducts();
}));
el("#view-all").addEventListener("click", () => { state.activeFilter = "All"; els(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === "All")); renderProducts(); });
el(".bag-trigger").addEventListener("click", openBag); el(".close-panel").addEventListener("click", closeBag); el(".backdrop").addEventListener("click", closeBag);
el(".menu-toggle").addEventListener("click", (event) => { const open = el(".mobile-nav").classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", open); });
els(".mobile-nav a").forEach((link) => link.addEventListener("click", () => el(".mobile-nav").classList.remove("open")));
els(".dialog-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
el("#open-admin").addEventListener("click", () => { renderCatalogue(); el("#admin-dialog").showModal(); });
el("#cancel-edit").addEventListener("click", clearForm);
el("#product-image").addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) { alert("Please use an image smaller than 1.5 MB for this browser-based demo."); event.target.value = ""; return; }
  const reader = new FileReader();
  reader.addEventListener("load", () => { state.imageData = reader.result; previewImage(state.imageData); });
  reader.readAsDataURL(file);
});
el("#product-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const editingId = el("#product-id").value;
  const existing = getProduct(editingId);
  if (!existing && !state.imageData) {
    alert("Please choose a jewellery photo before publishing this piece.");
    el("#product-image").focus();
    return;
  }
  const product = {
    id: editingId || `${el("#product-name").value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`,
    name: el("#product-name").value.trim(), price: el("#product-price").value === "" ? null : Number(el("#product-price").value), category: el("#product-category").value,
    material: el("#product-material").value.trim() || "Handmade by Sonia", tag: el("#product-tag").value, available: el("#product-available").checked,
    image: state.imageData || existing?.image || "assets/sonia-handmade-rakhi.png"
  };
  if (existing) state.products = state.products.map((item) => item.id === product.id ? product : item);
  else state.products.unshift(product);
  persist(); clearForm(); renderProducts(); renderBag(); renderCatalogue();
});
el("#export-catalogue").addEventListener("click", () => {
  const download = document.createElement("a");
  download.href = URL.createObjectURL(new Blob([JSON.stringify(state.products, null, 2)], { type: "application/json" }));
  download.download = "sonia-catalogue.json"; download.click(); URL.revokeObjectURL(download.href);
});
el("#import-catalogue").addEventListener("change", (event) => {
  const [file] = event.target.files; if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported) || !imported.every((item) => item.id && item.name && (item.price === null || item.price === "" || Number.isFinite(Number(item.price))))) throw new Error();
      state.products = imported.map((item) => ({ ...item, price: item.price === null || item.price === "" ? null : Number(item.price) }));
      persist(); renderProducts(); renderCatalogue(); clearForm(); alert("Catalogue imported successfully.");
    } catch { alert("That file is not a valid Sonia catalogue export."); }
  });
  reader.readAsText(file); event.target.value = "";
});
el("#reset-catalogue").addEventListener("click", () => {
  if (confirm("Restore Sonia's original demo collection? Your current catalogue will be replaced.")) {
    state.products = structuredClone(defaultProducts); state.bag = []; persist(); clearForm(); renderProducts(); renderBag(); renderCatalogue();
  }
});
el("#newsletter-form").addEventListener("submit", (event) => { event.preventDefault(); el("#form-note").textContent = "You’re on the list — welcome to Sonia's world."; event.currentTarget.reset(); });
el(".checkout-button").addEventListener("click", () => { if (!state.bag.length) return; alert("Checkout is ready to connect to your payment provider when you launch. For now, this is a storefront prototype."); });
el("#year").textContent = new Date().getFullYear();
renderProducts(); renderBag();
