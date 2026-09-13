const products = [
  { id: 1, name: 'House Blend', category: 'Drinks', price: 3.5, emoji: '☕', tone: 'yellow', barcode: '100000001' },
  { id: 2, name: 'Iced Matcha', category: 'Drinks', price: 5.25, emoji: '🍵', tone: 'green', barcode: '100000002' },
  { id: 3, name: 'Berry Fizz', category: 'Drinks', price: 4.75, emoji: '🫐', tone: 'pink', barcode: '100000003' },
  { id: 4, name: 'Citrus Tonic', category: 'Drinks', price: 4.5, emoji: '🍋', tone: 'yellow', barcode: '100000004' },
  { id: 5, name: 'Avocado Toast', category: 'Food', price: 8.5, emoji: '🥑', tone: 'green', barcode: '100000005' },
  { id: 6, name: 'Granola Bowl', category: 'Food', price: 7.25, emoji: '🥣', tone: 'yellow', barcode: '100000006' },
  { id: 7, name: 'Butter Croissant', category: 'Food', price: 4.25, emoji: '🥐', tone: 'yellow', barcode: '100000007' },
  { id: 8, name: 'Ham & Swiss', category: 'Food', price: 9.75, emoji: '🥪', tone: 'blue', barcode: '100000008' },
  { id: 9, name: 'Canvas Tote', category: 'Retail', price: 16, emoji: '👜', tone: 'blue', barcode: '100000009' },
  { id: 10, name: 'Ceramic Mug', category: 'Retail', price: 14, emoji: '🏺', tone: 'pink', barcode: '100000010' },
  { id: 11, name: 'House Beans', category: 'Retail', price: 18.5, emoji: '🫘', tone: 'yellow', barcode: '100000011' },
  { id: 12, name: 'Gift Card', category: 'Retail', price: 25, emoji: '🎁', tone: 'pink', barcode: '100000012' }
];

const cashiers = [{ name: 'Alex Morgan', initials: 'AM', role: 'Morning cashier' }, { name: 'Jamie Cruz', initials: 'JC', role: 'Shift supervisor' }, { name: 'Taylor Reed', initials: 'TR', role: 'Cashier' }];
const state = { cart: [], category: 'All', search: '', discountRate: 0.1, payment: 'Cash', paid: false, history: [], cashier: cashiers[0] };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `₱${value.toFixed(2)}`;
const localDateTime = () => {
  const now = new Date();
  return { date: now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), time: now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) };
};

function renderProducts() {
  const visible = products.filter((product) => {
    const categoryMatch = state.category === 'All' || product.category === state.category;
    const searchMatch = product.name.toLowerCase().includes(state.search.toLowerCase()) || product.barcode.includes(state.search);
    return categoryMatch && searchMatch;
  });
  $('#productCount').textContent = visible.length;
  $('#productGrid').innerHTML = visible.map((product) => `
    <article class="product-card"><button data-product="${product.id}" aria-label="Add ${product.name}">
      <div class="product-image ${product.tone}">${product.emoji}</div>
      <h3>${product.name}</h3><p>${product.category}</p>
      <div class="product-footer"><span class="price">${money(product.price)}</span><span class="add-icon">+</span></div>
    </button></article>`).join('') || '<div class="empty-order">No products match your search.</div>';
  document.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => addToCart(Number(button.dataset.product))));
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  const existing = state.cart.find((item) => item.id === id);
  state.history.push(JSON.stringify(state.cart));
  existing ? existing.quantity += 1 : state.cart.push({ ...product, quantity: 1 });
  state.paid = false;
  renderCart();
  showToast(`${product.name} added to order`);
}

function updateQuantity(id, delta) {
  state.history.push(JSON.stringify(state.cart));
  const item = state.cart.find((product) => product.id === id);
  if (!item) return;
  item.quantity += delta;
  state.cart = state.cart.filter((product) => product.quantity > 0);
  state.paid = false;
  renderCart();
}

function totals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * state.discountRate;
  const tax = (subtotal - discount) * 0.0825;
  return { subtotal, discount, tax, total: subtotal - discount + tax, itemCount: state.cart.reduce((sum, item) => sum + item.quantity, 0) };
}

function renderCart() {
  const { subtotal, discount, tax, total, itemCount } = totals();
  $('#orderItems').innerHTML = state.cart.length ? state.cart.map((item) => `
    <div class="order-line"><div class="line-image">${item.emoji}</div><div><h4>${item.name}</h4><small>${money(item.price)} each</small><div class="qty-controls"><button data-qty="${item.id}" data-delta="-1">−</button><span>${item.quantity}</span><button data-qty="${item.id}" data-delta="1">+</button></div></div><span class="line-price">${money(item.price * item.quantity)}</span></div>`).join('') : '<div class="empty-order"><div><i data-lucide="shopping-basket"></i><br>Add products to start a sale</div></div>';
  $('#subtotal').textContent = money(subtotal);
  $('#discountValue').textContent = `-${money(discount)}`;
  $('#taxValue').textContent = money(tax);
  $('#totalValue').textContent = money(total);
  $('#payAmount').textContent = money(total);
  $('#itemSummary').textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  $('#terminalItems').textContent = itemCount;
  $('#terminalDiscount').textContent = money(discount);
  $('#payButton').disabled = !state.cart.length;
  $('#finalizeBtn').disabled = !state.paid;
  $('#undoBtn').disabled = !state.history.length;
  $('#discountBtn').textContent = `${Math.round(state.discountRate * 100)}%`;
  document.querySelectorAll('[data-qty]').forEach((button) => button.addEventListener('click', () => updateQuantity(Number(button.dataset.qty), Number(button.dataset.delta))));
  lucide.createIcons();
}

function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200); }
function newSale() { state.cart = []; state.history = []; state.paid = false; renderCart(); showToast('New sale started'); }
function showReceipt() {
  const summary = totals();
  const timestamp = localDateTime();
  $('#receiptDate').textContent = timestamp.date;
  $('#receiptTime').textContent = timestamp.time;
  $('#receiptCashier').textContent = state.cashier.name;
  $('#receiptPayment').textContent = state.payment;
  $('#receiptLines').innerHTML = state.cart.map((item) => `<div class="receipt-line"><span>${item.name} <small>x${item.quantity}</small></span><strong>${money(item.price * item.quantity)}</strong></div>`).join('');
  $('#receiptSubtotal').textContent = money(summary.subtotal);
  $('#receiptDiscount').textContent = `-${money(summary.discount)}`;
  $('#receiptTax').textContent = money(summary.tax);
  $('#receiptTotal').textContent = money(summary.total);
  $('#receiptModal').classList.add('open');
  $('#receiptModal').setAttribute('aria-hidden', 'false');
  lucide.createIcons();
}
function closeReceipt() { $('#receiptModal').classList.remove('open'); $('#receiptModal').setAttribute('aria-hidden', 'true'); }

function scanBarcode() {
  const code = $('#searchInput').value.trim();
  const product = products.find((item) => item.barcode === code);
  if (!product) { showToast(code ? 'Barcode not found in catalog' : 'Ready for barcode scanner'); $('#searchInput').focus(); return; }
  addToCart(product.id);
  $('#searchInput').value = '';
  state.search = '';
  renderProducts();
}
function renderCashiers() {
  $('#cashierOptions').innerHTML = cashiers.map((cashier, index) => `<button class="cashier-option ${cashier.name === state.cashier.name ? 'active' : ''}" data-cashier="${index}"><div class="avatar">${cashier.initials}</div><div><strong>${cashier.name}</strong><span>${cashier.role}</span></div></button>`).join('');
  document.querySelectorAll('[data-cashier]').forEach((button) => button.addEventListener('click', () => { state.cashier = cashiers[Number(button.dataset.cashier)]; $('#cashierName').textContent = state.cashier.name; $('#cashierAvatar').textContent = state.cashier.initials; closeModal('cashierModal'); showToast(`Cashier changed to ${state.cashier.name}`); }));
}
function openModal(id) { $(`#${id}`).classList.add('open'); $(`#${id}`).setAttribute('aria-hidden', 'false'); lucide.createIcons(); }
function closeModal(id) { $(`#${id}`).classList.remove('open'); $(`#${id}`).setAttribute('aria-hidden', 'true'); }
function approveCardPayment() { state.paid = true; closeModal('cardModal'); renderCart(); showToast('Card payment approved'); }

$('#searchInput').addEventListener('input', (event) => { state.search = event.target.value; renderProducts(); });
$('#searchInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); scanBarcode(); } });
$('#scanButton').addEventListener('click', scanBarcode);
document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { document.querySelector('.filter-button.active').classList.remove('active'); button.classList.add('active'); state.category = button.dataset.category; renderProducts(); }));
document.querySelectorAll('.payment-button').forEach((button) => button.addEventListener('click', () => { document.querySelector('.payment-button.active').classList.remove('active'); button.classList.add('active'); state.payment = button.dataset.method; showToast(`${state.payment} selected`); }));
$('#discountBtn').addEventListener('click', () => { state.discountRate = state.discountRate === 0.1 ? 0 : 0.1; renderCart(); showToast(state.discountRate ? '10% discount applied' : 'Discount removed'); });
$('#clearOrderBtn').addEventListener('click', newSale);
$('#newSaleBtn').addEventListener('click', newSale);
$('#undoBtn').addEventListener('click', () => { if (!state.history.length) return; state.cart = JSON.parse(state.history.pop()); state.paid = false; renderCart(); showToast('Last change undone'); });
$('#payButton').addEventListener('click', () => { if (state.payment === 'Card') { $('#cardAmount').textContent = money(totals().total); openModal('cardModal'); } else { state.paid = true; renderCart(); showToast(`${state.payment} payment approved`); } });
$('#finalizeBtn').addEventListener('click', () => { if (!state.paid) return; showReceipt(); });
document.querySelectorAll('[data-close-receipt]').forEach((button) => button.addEventListener('click', closeReceipt));
$('#newReceiptSale').addEventListener('click', () => { closeReceipt(); newSale(); });
$('#cashierButton').addEventListener('click', () => { renderCashiers(); openModal('cashierModal'); });
$('#addProductButton').addEventListener('click', () => openModal('productModal'));
$('#productForm').addEventListener('submit', (event) => { event.preventDefault(); const newProduct = { id: Date.now(), name: $('#productName').value.trim(), category: $('#productCategory').value, price: Number($('#productPrice').value), barcode: $('#productBarcode').value.trim() || `200${Date.now()}`, emoji: $('#productEmoji').value || '🛍️', tone: 'green' }; products.push(newProduct); closeModal('productModal'); event.target.reset(); $('#productEmoji').value = '🛍️'; renderProducts(); showToast(`${newProduct.name} added to catalog`); });
$('#approveCard').addEventListener('click', approveCardPayment);
document.querySelectorAll('[data-close-cashier]').forEach((button) => button.addEventListener('click', () => closeModal('cashierModal')));
document.querySelectorAll('[data-close-product]').forEach((button) => button.addEventListener('click', () => closeModal('productModal')));
document.querySelectorAll('[data-close-card]').forEach((button) => button.addEventListener('click', () => closeModal('cardModal')));
$('#printReceipt').addEventListener('click', () => window.print());
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchInput').focus(); } });

renderProducts();
renderCart();
renderCashiers();
lucide.createIcons();
