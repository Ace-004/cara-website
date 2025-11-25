let bar = document.getElementById("bar");
let nav = document.getElementById("navbar");
let close = document.getElementById("close");

if (bar) {
  bar.addEventListener("click", () => {
    nav.classList.add("active");
  });
}

if (close) {
  close.addEventListener("click", () => {
    nav.classList.remove("active");
  });
}

// Hero Carousel Functionality
(function () {
  let currentSlideIndex = 0;
  let autoSlideInterval;
  const slides = document.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length === 0) return; // Exit if no carousel on page

  function showSlide(index) {
    // Remove active class from all slides and dots
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    // Handle index wrapping
    if (index >= slides.length) {
      currentSlideIndex = 0;
    } else if (index < 0) {
      currentSlideIndex = slides.length - 1;
    } else {
      currentSlideIndex = index;
    }

    // Add active class to current slide and dot
    slides[currentSlideIndex].classList.add("active");
    dots[currentSlideIndex].classList.add("active");
  }

  // Move to next/previous slide
  window.moveSlide = function (direction) {
    showSlide(currentSlideIndex + direction);
    resetAutoSlide();
  };

  // Jump to specific slide
  window.currentSlide = function (index) {
    showSlide(index);
    resetAutoSlide();
  };

  // Auto slide functionality
  function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
      showSlide(currentSlideIndex + 1);
    }, 4000); // Change slide every 4 seconds
  }

  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  // Initialize carousel
  showSlide(0);
  startAutoSlide();

  // Pause auto-slide on hover
  const carouselContainer = document.querySelector(".carousel-container");
  if (carouselContainer) {
    carouselContainer.addEventListener("mouseenter", () => {
      clearInterval(autoSlideInterval);
    });

    carouselContainer.addEventListener("mouseleave", () => {
      startAutoSlide();
    });
  }
})();

// Theme toggle
(function () {
  const root = document.body;
  const btnMobile = document.getElementById("theme-toggle");
  const btnDesktop = document.getElementById("theme-toggle-desktop");

  const saved = localStorage.getItem("theme");
  if (saved === "dark") root.classList.add("dark");

  function toggleTheme() {
    root.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      root.classList.contains("dark") ? "dark" : "light"
    );
  }

  if (btnMobile) btnMobile.addEventListener("click", toggleTheme);
  if (btnDesktop) btnDesktop.addEventListener("click", toggleTheme);
})();

// ---------------- Cart Utilities (per-user) ----------------
function getCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem("cara_session"));
  } catch {
    return null;
  }
}
function getCurrentUserKey() {
  const s = getCurrentSession();
  const email = s && s.user && s.user.email ? s.user.email : "guest";
  return String(email).toLowerCase();
}
const Cart = {
  key() {
    return "cara_cart_" + getCurrentUserKey();
  },
  get() {
    const raw = localStorage.getItem(this.key());
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  set(items) {
    localStorage.setItem(this.key(), JSON.stringify(items));
    window.dispatchEvent(new Event("cart:updated"));
  },
  add(item) {
    const items = this.get();
    const idx = items.findIndex(
      (p) => p.id === item.id && p.size === item.size
    );
    if (idx >= 0) {
      items[idx].qty += item.qty;
    } else {
      items.push(item);
    }
    this.set(items);
  },
  update(id, size, qty) {
    const items = this.get();
    const idx = items.findIndex((p) => p.id === id && p.size === size);
    if (idx >= 0) {
      items[idx].qty = Math.max(1, qty | 0);
      this.set(items);
    }
  },
  remove(id, size) {
    const items = this.get().filter((p) => !(p.id === id && p.size === size));
    this.set(items);
  },
  totals() {
    const items = this.get();
    const subtotal = items.reduce((s, p) => s + p.price * p.qty, 0);
    return { subtotal, total: subtotal };
  },
};

// Wire Add To Cart on sproduct.html
(function () {
  const addBtn = document.getElementById("add-to-cart");
  if (!addBtn) return;
  const qtyEl = document.getElementById("qty");
  const sizeEl = document.getElementById("select-size");
  const nameEl = document.querySelector(".single-pro-details h4");
  const priceEl = document.querySelector(".single-pro-details h2");
  const mainImg = document.getElementById("main-img");

  addBtn.addEventListener("click", () => {
    const qty = Math.max(1, parseInt(qtyEl.value || "1", 10));
    const size = sizeEl && sizeEl.value !== "Select Size" ? sizeEl.value : "";
    const name = nameEl ? nameEl.textContent.trim() : "Product";
    const priceText = priceEl
      ? priceEl.textContent.replace(/[^0-9.]/g, "")
      : "0";
    const price = parseFloat(priceText) || 0;
    const img = mainImg ? mainImg.src : "";

    const id =
      name + "|" + price + "|" + (img || "") + (size ? "|" + size : "");

    Cart.add({ id, name, price, img, qty, size });
    addBtn.textContent = "Added!";
    setTimeout(() => (addBtn.textContent = "Add To Cart"), 1000);
  });
})();

// Render cart on cart.html
(function () {
  const body = document.getElementById("cart-body");
  if (!body) return;
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");

  function fmt(n) {
    return "$" + n.toFixed(2);
  }

  function render() {
    const items = Cart.get();
    body.innerHTML = "";
    items.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><button class="remove-item" data-id="${p.id}" data-size="${
        p.size || ""
      }"><i class=\"fa-regular fa-circle-xmark\"></i></button></td>
                <td><img src="${p.img}" alt="" style="width:70px"></td>
                <td>${p.name}${p.size ? ` - ${p.size}` : ""}</td>
                <td>${fmt(p.price)}</td>
                <td><input class="cart-qty" type="number" min="1" value="${
                  p.qty
                }" data-id="${p.id}" data-size="${p.size || ""}"></td>
                <td>${fmt(p.price * p.qty)}</td>
            `;
      body.appendChild(tr);
    });
    const t = Cart.totals();
    if (subtotalEl) subtotalEl.textContent = fmt(t.subtotal);
    if (totalEl) totalEl.innerHTML = `<strong>${fmt(t.total)}</strong>`;
  }

  body.addEventListener("input", (e) => {
    const el = e.target;
    if (el.classList.contains("cart-qty")) {
      const id = el.getAttribute("data-id");
      const size = el.getAttribute("data-size") || "";
      const qty = parseInt(el.value || "1", 10);
      Cart.update(id, size, qty);
      render();
    }
  });

  body.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-item");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const size = btn.getAttribute("data-size") || "";
    Cart.remove(id, size);
    render();
  });

  window.addEventListener("cart:updated", render);
  render();
})();

// Navbar login/logout reflect session on all pages
(function () {
  function isLoggedIn() {
    const s = getCurrentSession();
    return !!(s && s.isLoggedIn);
  }
  function showLoader(message) {
    if (document.getElementById("global-loader")) return;
    const overlay = document.createElement("div");
    overlay.id = "global-loader";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2000";
    overlay.innerHTML = `
            <div style="background:#151923; color:#e6e6e6; padding:20px 24px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.4); display:flex; align-items:center; gap:12px; min-width:220px;">
                <div style="width:24px; height:24px; border:3px solid #2b3447; border-top-color:#7dd3fc; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                <span>${message || "Please wait..."}</span>
            </div>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        `;
    document.body.appendChild(overlay);
  }
  function logout() {
    showLoader("Logging out...");
    setTimeout(() => {
      localStorage.removeItem("cara_session");
      location.reload();
    }, 700);
  }

  const loginLi = document.querySelector(".login-btn");
  if (!loginLi) return;

  if (isLoggedIn()) {
    // Replace with Logout button
    loginLi.innerHTML =
      '<button id="logout-btn" style="background-color: #ef4444; color: white; padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer;">Logout</button>';
    const out = document.getElementById("logout-btn");
    if (out) out.addEventListener("click", logout);
  } else {
    // Ensure it shows Login link
    // Only change if currently not a link
    if (!loginLi.querySelector("a")) {
      loginLi.innerHTML =
        '<a href="auth.html"><button style="background-color: #088178; color: white; padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer;">Login</button></a>';
    }
  }
})();

// Checkout modal interactions (cart.html)
(function () {
  const checkoutBtn = document.getElementById("checkout-btn");
  const modal = document.getElementById("checkout-modal");
  if (!checkoutBtn || !modal) return;
  const cancelBtn = document.getElementById("cancel-checkout");
  const placeBtn = document.getElementById("place-order-btn");
  const paymentExtra = document.getElementById("payment-extra");
  const successBox = document.getElementById("order-success");

  function openModal() {
    modal.style.display = "flex";
    updateExtra();
  }
  function closeModal() {
    modal.style.display = "none";
    successBox.style.display = "none";
    successBox.textContent = "";
  }

  function updateExtra() {
    const sel = document.querySelector('input[name="payment"]:checked');
    const selected = sel ? sel.value : "cod";
    if (selected === "upi") {
      paymentExtra.style.display = "block";
      paymentExtra.innerHTML =
        '<input name="upiId" required style="width:100%;padding:10px;border:1px solid #e1e1e1;border-radius:8px;" type="text" placeholder="Enter UPI ID (e.g. name@upi)">';
    } else if (selected === "card") {
      paymentExtra.style.display = "block";
      paymentExtra.innerHTML =
        '<input name="cardNumber" required style="width:100%;padding:10px;border:1px solid #e1e1e1;border-radius:8px;margin-bottom:8px;" type="text" inputmode="numeric" placeholder="Card Number (16 digits)"><div style="display:flex; gap:8px;"><input name="cardExpiry" required style="flex:1;padding:10px;border:1px solid #e1e1e1;border-radius:8px;" type="text" placeholder="MM/YY"><input name="cardCvv" required style="flex:1;padding:10px;border:1px solid #e1e1e1;border-radius:8px;" type="text" inputmode="numeric" placeholder="CVV"></div>';
    } else {
      paymentExtra.style.display = "none";
      paymentExtra.innerHTML = "";
    }
  }

  document.addEventListener("change", (e) => {
    if (e.target && e.target.name === "payment") updateExtra();
  });

  checkoutBtn.addEventListener("click", () => {
    if (!getCurrentSession() || !getCurrentSession().isLoggedIn) {
      alert("Please login to proceed to checkout.");
      window.location.href = "auth.html";
      return;
    }
    const items = Cart.get();
    if (!items.length) {
      alert("Your cart is empty. Add items before checkout.");
      return;
    }
    openModal();
  });

  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  placeBtn.addEventListener("click", () => {
    const items = Cart.get();
    if (!items.length) {
      closeModal();
      return;
    }
    const totals = Cart.totals();
    // Validate payment details
    const sel = document.querySelector('input[name="payment"]:checked');
    const method = sel ? sel.value : "cod";
    if (method === "upi") {
      const upi = (
        paymentExtra.querySelector('input[name="upiId"]')?.value || ""
      ).trim();
      const upiOk = /^[\w.\-]{2,}@[\w\-]{2,}$/.test(upi);
      if (!upiOk) {
        alert("Please enter a valid UPI ID (e.g. name@upi)");
        return;
      }
    } else if (method === "card") {
      const num = (
        paymentExtra.querySelector('input[name="cardNumber"]')?.value || ""
      ).replace(/\s+/g, "");
      const exp = (
        paymentExtra.querySelector('input[name="cardExpiry"]')?.value || ""
      ).trim();
      const cvv = (
        paymentExtra.querySelector('input[name="cardCvv"]')?.value || ""
      ).trim();
      const numOk = /^\d{16}$/.test(num);
      const expOk = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp);
      const cvvOk = /^\d{3,4}$/.test(cvv);
      if (!numOk) {
        alert("Enter a valid 16-digit card number");
        return;
      }
      if (!expOk) {
        alert("Enter a valid expiry in MM/YY");
        return;
      }
      if (!cvvOk) {
        alert("Enter a valid 3 or 4 digit CVV");
        return;
      }
    }
    // Save order to localStorage
    const payment = method;
    const session = getCurrentSession();
    const order = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      items: items,
      subtotal: totals.subtotal,
      total: totals.total,
      payment,
      userEmail: session && session.user ? session.user.email || "" : "",
    };
    try {
      const existing = JSON.parse(localStorage.getItem("cara_orders") || "[]");
      existing.unshift(order);
      localStorage.setItem("cara_orders", JSON.stringify(existing));
    } catch {}

    successBox.textContent = `Order placed successfully! Amount charged: $${totals.total.toFixed(
      2
    )}. Thank you for shopping.`;
    successBox.style.display = "block";
    setTimeout(() => {
      Cart.set([]);
      closeModal();
    }, 1200);
  });
})();

// Quick add to cart for product cards (index, shop)
(function () {
  function parsePrice(text) {
    const n = parseFloat((text || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick-add");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const card = btn.closest(".pro");
    if (!card) return;
    const nameEl = card.querySelector(".des h5");
    const priceEl = card.querySelector(".des h4");
    const imgEl = card.querySelector("img");
    const name = nameEl ? nameEl.textContent.trim() : "Product";
    const price = parsePrice(priceEl ? priceEl.textContent : "0");
    const img = imgEl ? imgEl.src : "";
    const id = (name + "|" + price + "|" + (img || "")).toLowerCase();
    Cart.add({ id, name, price, img, qty: 1, size: "" });
    btn.classList.add("added");
    const oldTitle = btn.getAttribute("title") || "";
    btn.setAttribute("title", "Added");
    setTimeout(() => {
      btn.classList.remove("added");
      btn.setAttribute("title", oldTitle);
    }, 800);
  });
})();

// Orders page render (orders.html)
(function () {
  const container = document.getElementById("orders-list");
  if (!container) return;
  function fmt(n) {
    return "$" + n.toFixed(2);
  }
  function render() {
    const session = getCurrentSession();
    const email = session && session.user ? session.user.email || "" : "";
    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem("cara_orders") || "[]");
    } catch {}
    if (email) {
      orders = orders.filter(
        (o) => (o.userEmail || "").toLowerCase() === email.toLowerCase()
      );
    } else {
      orders = [];
    }
    if (!orders.length) {
      container.innerHTML = '<p style="margin:10px 0;">No orders yet.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    orders.forEach((o) => {
      const wrapper = document.createElement("div");
      wrapper.style.border = "1px solid #e1e1e1";
      wrapper.style.borderRadius = "10px";
      wrapper.style.padding = "12px";
      wrapper.style.marginBottom = "12px";
      const dateStr = new Date(o.createdAt).toLocaleString();
      wrapper.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong>Order #${o.id}</strong>
                    <span style="font-size:12px; color:#606063;">${dateStr}</span>
                </div>
                <div style=\"font-size:14px; margin-bottom:8px;\">Payment: ${o.payment.toUpperCase()}</div>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left; padding:6px 0;">Item</th>
                            <th style="text-align:left; padding:6px 0;">Qty</th>
                            <th style="text-align:left; padding:6px 0;">Price</th>
                            <th style="text-align:left; padding:6px 0;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${o.items
                          .map(
                            (p) => `
                            <tr>
                                <td style=\"padding:6px 0;\">
                                    <div style=\"display:flex; align-items:center; gap:8px;\">
                                        <img src=\"${
                                          p.img
                                        }\" alt=\"\" style=\"width:50px; height:50px; object-fit:cover; border-radius:6px;\"/>
                                        <div>${p.name}${
                              p.size ? ` - ${p.size}` : ""
                            }</div>
                                    </div>
                                </td>
                                <td style=\"padding:6px 0;\">${p.qty}</td>
                                <td style=\"padding:6px 0;\">${fmt(
                                  p.price
                                )}</td>
                                <td style=\"padding:6px 0;\">${fmt(
                                  p.price * p.qty
                                )}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="text-align:right; margin-top:8px;"><strong>Total: ${fmt(
                  o.total
                )}</strong></div>
            `;
      frag.appendChild(wrapper);
    });
    container.innerHTML = "";
    container.appendChild(frag);
  }
  render();
})();

// Product card -> sproduct navigation with query params
(function () {
  function parsePrice(text) {
    const n = parseFloat((text || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  document.addEventListener(
    "click",
    (e) => {
      const card = e.target.closest(".pro");
      if (!card) return;
      if (e.target.closest(".quick-add")) return; // let quick-add handle it
      // If the card has its own onclick to sproduct, we still want to add params
      const nameEl = card.querySelector(".des h5");
      const priceEl = card.querySelector(".des h4");
      const imgEl = card.querySelector("img");
      if (!nameEl || !priceEl || !imgEl) return;
      e.preventDefault();
      e.stopPropagation();
      const name = nameEl.textContent.trim();
      const price = parsePrice(priceEl.textContent);
      // Prefer relative src for local assets
      const img = imgEl.getAttribute("src") || imgEl.src;
      const url = `sproduct.html?name=${encodeURIComponent(
        name
      )}&price=${encodeURIComponent(price)}&img=${encodeURIComponent(img)}`;
      window.location.href = url;
    },
    true
  );
})();

// sproduct parameter handling: set main image/title/price and build thumbnails
(function () {
  const mainImg = document.getElementById("main-img");
  const details = document.querySelector(".single-pro-details");
  if (!mainImg || !details) return;

  const nameEl = details.querySelector("h4");
  const priceEl = details.querySelector("h2");
  const params = new URLSearchParams(window.location.search);
  const imgParam = params.get("img");
  const nameParam = params.get("name");
  const priceParam = params.get("price");

  if (imgParam) mainImg.src = imgParam;
  if (nameParam) nameEl.textContent = nameParam;
  if (priceParam && !isNaN(parseFloat(priceParam)))
    priceEl.textContent = `$${parseFloat(priceParam).toFixed(2)}`;

  // Build thumbnails for the series if the image matches our pattern
  const group = document.querySelector(".small-img-proup");
  const src = imgParam || mainImg.getAttribute("src") || mainImg.src || "";
  if (group && src) {
    let m = src.match(/img\/products\/([fn])(\d)\.jpg$/i);
    if (!m) {
      m = src.match(/([fn])(\d)\.jpg$/i);
    }
    if (m) {
      const base = m[1].toLowerCase();
      const num = parseInt(m[2], 10);
      const start = num <= 4 ? 1 : 5;
      group.innerHTML = "";
      for (let i = 0; i < 4; i++) {
        const idx = start + i;
        const col = document.createElement("div");
        col.className = "small-img-col";
        const im = document.createElement("img");
        im.className = "small-img";
        im.alt = "";
        im.setAttribute("width", "100%");
        im.src = `img/products/${base}${idx}.jpg`;
        col.appendChild(im);
        group.appendChild(col);
      }
      group.addEventListener("click", (e) => {
        const t = e.target.closest(".small-img");
        if (!t) return;
        mainImg.src = t.src;
      });
    }
  }
})();
