/* Eleva Shop Express - lógica de painel e galeria (localStorage ou Firebase Firestore) */

const STORAGE_KEY = "eleva_shop_express_products";
const ADMIN_TOKEN_KEY = "eleva_shop_express_admin";
const ADMIN_PASSWORD = "admin123";
const PRODUCTS_COLLECTION = "eleva_shop_products";

const productsGrid = document.getElementById("productsGrid");
const noProducts = document.getElementById("noProducts");
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeAdmin = document.getElementById("closeAdmin");
const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");
const adminPassword = document.getElementById("adminPassword");
const productForm = document.getElementById("productForm");
const adminProductList = document.getElementById("adminProductList");

const useFirestore = typeof window.db !== "undefined";
const productsCollection = useFirestore ? window.db.collection(PRODUCTS_COLLECTION) : null;

function isAdminLogged() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) === "1";
}

function setAdminLogged(value) {
  if (value) localStorage.setItem(ADMIN_TOKEN_KEY, "1");
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
  updateAdminView();
}

function updateAdminView() {
  const logged = isAdminLogged();
  adminLogin.classList.toggle("hidden", logged);
  adminPanel.classList.toggle("hidden", !logged);
  loginError.textContent = "";
  adminPassword.value = "";
}

function openModal() {
  adminModal.setAttribute("aria-hidden", "false");
  adminModal.style.display = "grid";
  adminPassword.focus();
  updateAdminView();
}

function closeModal() {
  adminModal.setAttribute("aria-hidden", "true");
  adminModal.style.display = "none";
}

async function loadProductsLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn("Falha ao interpretar os produtos salvos", e);
  }
  return [];
}

async function loadProducts() {
  if (useFirestore) {
    try {
      const snapshot = await productsCollection.orderBy("createdAt", "desc").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn("Erro ao ler produtos do Firestore, usando localStorage como fallback", err);
      return await loadProductsLocal();
    }
  }

  return await loadProductsLocal();
}

async function saveProductsLocal(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function addProduct(product) {
  if (useFirestore) {
    try {
      await productsCollection.doc(product.id).set({
        ...product,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn("Erro ao adicionar produto no Firestore", err);
    }
  }

  const products = await loadProducts();
  products.unshift(product);
  await saveProductsLocal(products);
}

async function removeProduct(id) {
  if (useFirestore) {
    try {
      await productsCollection.doc(id).delete();
      return;
    } catch (err) {
      console.warn("Erro ao remover produto do Firestore", err);
    }
  }

  const products = (await loadProducts()).filter((p) => p.id !== id);
  await saveProductsLocal(products);
}

async function ensureDefaultProducts() {
  const products = await loadProducts();
  if (products.length === 0) {
    const sample = [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name: "Camiseta Básica",
        description: "Camiseta confortável para o dia a dia. Disponível em várias cores.",
        price: "R$ 49,90",
        image: "https://images.unsplash.com/photo-1520975681912-0fe359e00a9c?auto=format&fit=crop&w=900&q=70",
      },
    ];

    for (const item of sample) {
      await addProduct(item);
    }
  }
}

function renderProductCard(product) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "card-image";
  img.src = product.image;
  img.alt = product.name;

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = product.name;

  const desc = document.createElement("p");
  desc.className = "card-desc";
  desc.textContent = product.description;

  const price = document.createElement("div");
  price.className = "card-price";
  price.textContent = product.price;

  card.append(img, title, desc, price);

  card.addEventListener("click", () => {
    alert(`${product.name}\n\n${product.description}\n\nPreço: ${product.price}`);
  });

  return card;
}

async function renderProducts() {
  const products = await loadProducts();
  productsGrid.innerHTML = "";
  if (products.length === 0) {
    noProducts.style.display = "block";
    return;
  }
  noProducts.style.display = "none";

  products.forEach((product) => {
    productsGrid.appendChild(renderProductCard(product));
  });
}

async function renderAdminList() {
  const products = await loadProducts();
  adminProductList.innerHTML = "";

  if (products.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nenhum produto cadastrado ainda.";
    adminProductList.appendChild(empty);
    return;
  }

  products.forEach((product) => {
    const item = document.createElement("div");
    item.className = "admin-item";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "12px";
    row.style.alignItems = "center";

    const thumb = document.createElement("img");
    thumb.src = product.image;
    thumb.alt = product.name;
    thumb.style.width = "72px";
    thumb.style.height = "72px";
    thumb.style.borderRadius = "12px";
    thumb.style.objectFit = "cover";
    thumb.style.border = "1px solid rgba(255,255,255,0.16)";

    const info = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = product.name;

    const meta = document.createElement("div");
    meta.textContent = `${product.price} — ${product.description}`;

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn";
    deleteBtn.textContent = "Remover";
    deleteBtn.addEventListener("click", async () => {
      const confirmed = confirm(`Remover o produto “${product.name}”?`);
      if (!confirmed) return;
      await removeProduct(product.id);
      await renderProducts();
      await renderAdminList();
    });

    actions.appendChild(deleteBtn);
    row.append(thumb, info, actions);
    item.appendChild(row);
    adminProductList.appendChild(item);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Falha ao ler imagem.")));
    reader.readAsDataURL(file);
  });
}

adminBtn.addEventListener("click", () => {
  openModal();
});

closeAdmin.addEventListener("click", closeModal);

adminModal.addEventListener("click", (event) => {
  if (event.target === adminModal) closeModal();
});

loginBtn.addEventListener("click", () => {
  const value = adminPassword.value.trim();
  if (value === ADMIN_PASSWORD) {
    setAdminLogged(true);
  } else {
    loginError.textContent = "Senha incorreta. Tente novamente.";
  }
});

logoutBtn.addEventListener("click", () => {
  setAdminLogged(false);
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const price = document.getElementById("productPrice").value.trim();
  const file = document.getElementById("productImage").files[0];

  if (!name || !description || !price || !file) {
    loginError.textContent = "Preencha todos os campos e selecione uma imagem.";
    return;
  }

  let image;
  try {
    image = await readFileAsDataUrl(file);
  } catch (err) {
    loginError.textContent = "Não foi possível ler a imagem. Tente outro arquivo.";
    return;
  }

  const product = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    description,
    price,
    image,
  };

  await addProduct(product);
  await renderProducts();
  await renderAdminList();

  productForm.reset();
  loginError.textContent = "";
});

async function init() {
  await ensureDefaultProducts();
  await renderProducts();
  updateAdminView();
}

init();
