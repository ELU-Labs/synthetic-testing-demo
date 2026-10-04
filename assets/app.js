/* Acme Outfitters — demo store for ELU synthetic testing.
 * Static, client-side only: the cart and the sign-in session live in localStorage. */
(function () {
  'use strict';

  var PRODUCTS = [
    { id: 'trail-backpack', name: 'Trail Backpack 28L', category: 'Bags', price: 89, sizes: ['One size'],
      description: 'A light day pack with a padded laptop sleeve, hip belt and rain cover.' },
    { id: 'merino-tee', name: 'Merino Wool Tee', category: 'Clothing', price: 45, sizes: ['S', 'M', 'L', 'XL'],
      description: 'Soft, odour-resistant merino for long days on the trail.' },
    { id: 'rain-shell', name: 'Packable Rain Shell', category: 'Clothing', price: 120, sizes: ['S', 'M', 'L'],
      description: 'A waterproof, breathable shell that packs into its own pocket.' },
    { id: 'steel-bottle', name: 'Insulated Steel Bottle', category: 'Accessories', price: 32, sizes: ['500 ml', '750 ml'],
      description: 'Keeps drinks cold for 24 hours or hot for 12.' },
    { id: 'camp-mug', name: 'Enamel Camp Mug', category: 'Accessories', price: 18, sizes: ['One size'],
      description: 'Classic enamel mug that survives every camp kitchen.' },
    { id: 'trail-runners', name: 'Trail Running Shoes', category: 'Footwear', price: 135, sizes: ['8', '9', '10', '11', '12'],
      description: 'Grippy, cushioned shoes for rocky and muddy trails.' },
    { id: 'hiking-socks', name: 'Hiking Socks (2 pack)', category: 'Footwear', price: 22, sizes: ['M', 'L'],
      description: 'Cushioned wool-blend socks that stay dry.' },
    { id: 'headlamp', name: 'Rechargeable Headlamp', category: 'Accessories', price: 39, sizes: ['One size'],
      description: '400 lumens, USB-C charging and a red night mode.' }
  ];
  var CATEGORIES = ['Bags', 'Clothing', 'Footwear', 'Accessories'];
  var DEMO_ACCOUNT = {
    email: 'shopper@acme-demo.test',
    name: 'Sam Shopper',
    passwordSha256: 'dffca6bd01990cf4d503e993e38bdea32fdfc9a5e4ea3cafef3cf176910c338e'
  };
  var ORDERS = [
    { id: 'A-1042', placed: 'September 12, 2026', status: 'Delivered', address: '12 Pine Street, Portland, OR',
      items: [{ productId: 'merino-tee', size: 'M', quantity: 2 }, { productId: 'camp-mug', size: 'One size', quantity: 1 }] },
    { id: 'A-1057', placed: 'September 28, 2026', status: 'Shipped', address: '12 Pine Street, Portland, OR',
      items: [{ productId: 'trail-runners', size: '10', quantity: 1 }] }
  ];

  var CART_KEY = 'acme_cart';
  var SESSION_KEY = 'acme_session';

  function $(selector) { return document.querySelector(selector); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'text') node.textContent = attrs[key];
      else if (key === 'onclick') node.addEventListener('click', attrs[key]);
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  function money(value) { return '$' + value.toFixed(2); }
  function param(name) { return new URLSearchParams(window.location.search).get(name); }
  function productById(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null; }

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); renderCartCount(); }
  function cartCount() { return readCart().reduce(function (sum, item) { return sum + item.quantity; }, 0); }
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }

  function renderCartCount() {
    var badge = $('#cart-count');
    if (badge) badge.textContent = String(cartCount());
  }

  function renderHeader() {
    var signedIn = session();
    var header = $('#site-header');
    if (!header) return;
    header.innerHTML = '';
    header.appendChild(el('a', { href: 'index.html', class: 'brand', text: 'Acme Outfitters' }));
    var nav = el('nav', { 'aria-label': 'Main' }, [
      el('a', { href: 'shop.html', text: 'Shop' }),
      el('a', { href: 'help.html', text: 'Help' }),
      el('a', { href: 'cart.html', class: 'cart-link' }, [
        document.createTextNode('Cart '),
        el('span', { id: 'cart-count', class: 'badge', text: String(cartCount()) })
      ]),
      signedIn ? el('a', { href: 'account.html', text: 'Your account' }) : el('a', { href: 'signin.html', text: 'Sign in' })
    ]);
    header.appendChild(nav);
  }

  function productCard(product) {
    return el('article', { class: 'card' }, [
      el('div', { class: 'thumb', 'aria-hidden': 'true', text: product.name.charAt(0) }),
      el('h3', {}, [el('a', { href: 'product.html?id=' + product.id, text: product.name })]),
      el('p', { class: 'muted', text: product.category }),
      el('p', { class: 'price', text: money(product.price) })
    ]);
  }

  function renderHome() {
    var grid = $('#featured');
    PRODUCTS.slice(0, 4).forEach(function (product) { grid.appendChild(productCard(product)); });
    $('#home-search').addEventListener('submit', function (event) {
      event.preventDefault();
      var query = $('#home-search-input').value.trim();
      window.location.href = 'shop.html' + (query ? '?q=' + encodeURIComponent(query) : '');
    });
  }

  function renderShop() {
    var state = { query: param('q') || '', category: param('category') || 'All' };
    var input = $('#shop-search');
    input.value = state.query;
    var filters = $('#category-filters');
    ['All'].concat(CATEGORIES).forEach(function (category) {
      var button = el('button', { type: 'button', class: 'chip', 'data-category': category, text: category });
      button.addEventListener('click', function () { state.category = category; draw(); });
      filters.appendChild(button);
    });
    input.addEventListener('input', function () { state.query = input.value; draw(); });
    function draw() {
      var query = state.query.trim().toLowerCase();
      var matches = PRODUCTS.filter(function (product) {
        var inCategory = state.category === 'All' || product.category === state.category;
        var inQuery = !query || product.name.toLowerCase().indexOf(query) !== -1 ||
          product.description.toLowerCase().indexOf(query) !== -1;
        return inCategory && inQuery;
      });
      Array.prototype.forEach.call(filters.children, function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-category') === state.category));
      });
      $('#result-count').textContent = matches.length === 1 ? '1 product' : matches.length + ' products';
      var grid = $('#products');
      grid.innerHTML = '';
      if (!matches.length) grid.appendChild(el('p', { class: 'empty', text: 'No products match your search.' }));
      matches.forEach(function (product) { grid.appendChild(productCard(product)); });
    }
    draw();
  }

  function renderProduct() {
    var product = productById(param('id'));
    var root = $('#product');
    if (!product) {
      root.appendChild(el('h1', { text: 'Product not found' }));
      root.appendChild(el('p', {}, [el('a', { href: 'shop.html', text: 'Back to the shop' })]));
      return;
    }
    document.title = product.name + ' — Acme Outfitters';
    var sizeSelect = el('select', { id: 'size', name: 'size' },
      product.sizes.map(function (size) { return el('option', { value: size, text: size }); }));
    var quantity = el('input', { id: 'quantity', name: 'quantity', type: 'number', min: '1', max: '10', value: '1' });
    var status = el('p', { id: 'add-status', role: 'status', class: 'status' });
    var add = el('button', { type: 'button', class: 'primary', text: 'Add to cart' });
    add.addEventListener('click', function () {
      var qty = Math.max(1, Math.min(10, parseInt(quantity.value, 10) || 1));
      var items = readCart();
      var existing = items.filter(function (item) { return item.productId === product.id && item.size === sizeSelect.value; })[0];
      if (existing) existing.quantity += qty; else items.push({ productId: product.id, size: sizeSelect.value, quantity: qty });
      writeCart(items);
      status.textContent = '';
      status.appendChild(document.createTextNode('Added ' + qty + ' × ' + product.name + ' to your cart. '));
      status.appendChild(el('a', { href: 'cart.html', text: 'View cart' }));
    });
    root.appendChild(el('p', { class: 'muted' }, [el('a', { href: 'shop.html?category=' + encodeURIComponent(product.category), text: product.category })]));
    root.appendChild(el('h1', { text: product.name }));
    root.appendChild(el('p', { class: 'price', text: money(product.price) }));
    root.appendChild(el('p', { text: product.description }));
    root.appendChild(el('div', { class: 'form-row' }, [el('label', { for: 'size', text: 'Size' }), sizeSelect]));
    root.appendChild(el('div', { class: 'form-row' }, [el('label', { for: 'quantity', text: 'Quantity' }), quantity]));
    root.appendChild(add);
    root.appendChild(status);
    var related = $('#related');
    PRODUCTS.filter(function (p) { return p.category === product.category && p.id !== product.id; })
      .slice(0, 3).forEach(function (p) { related.appendChild(productCard(p)); });
    if (!related.children.length) related.appendChild(el('p', { class: 'muted', text: 'No related products.' }));
  }

  function renderCart() {
    var root = $('#cart');
    function draw() {
      var items = readCart();
      root.innerHTML = '';
      if (!items.length) {
        root.appendChild(el('p', { class: 'empty', text: 'Your cart is empty.' }));
        root.appendChild(el('p', {}, [el('a', { href: 'shop.html', text: 'Continue shopping' })]));
        return;
      }
      var subtotal = 0;
      var list = el('ul', { class: 'cart-items' });
      items.forEach(function (item, index) {
        var product = productById(item.productId);
        if (!product) return;
        subtotal += product.price * item.quantity;
        var decrease = el('button', { type: 'button', 'aria-label': 'Decrease quantity of ' + product.name, text: '−' });
        var increase = el('button', { type: 'button', 'aria-label': 'Increase quantity of ' + product.name, text: '+' });
        decrease.addEventListener('click', function () {
          var next = readCart(); next[index].quantity = Math.max(1, next[index].quantity - 1); writeCart(next); draw();
        });
        increase.addEventListener('click', function () {
          var next = readCart(); next[index].quantity = Math.min(10, next[index].quantity + 1); writeCart(next); draw();
        });
        list.appendChild(el('li', {}, [
          el('span', { class: 'item-name', text: product.name + ' (' + item.size + ')' }),
          el('span', { class: 'qty' }, [decrease, el('span', { text: ' ' + item.quantity + ' ' }), increase]),
          el('span', { class: 'price', text: money(product.price * item.quantity) })
        ]));
      });
      root.appendChild(list);
      root.appendChild(el('p', { class: 'subtotal' }, [el('strong', { text: 'Subtotal: ' + money(subtotal) })]));
      root.appendChild(el('p', { class: 'muted', text: 'Checkout is not available in this demo store.' }));
      root.appendChild(el('p', {}, [el('a', { href: 'shop.html', text: 'Continue shopping' })]));
    }
    draw();
  }

  function sha256Hex(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buffer) {
      return Array.prototype.map.call(new Uint8Array(buffer), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  function renderSignIn() {
    var form = $('#signin-form');
    var error = $('#signin-error');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.textContent = '';
      var email = $('#email').value.trim().toLowerCase();
      sha256Hex($('#password').value).then(function (digest) {
        if (email !== DEMO_ACCOUNT.email || digest !== DEMO_ACCOUNT.passwordSha256) {
          error.textContent = 'Incorrect email or password.';
          return;
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name }));
        var next = param('next');
        window.location.href = next && /^[a-z]+\.html(\?[^#]*)?$/.test(next) ? next : 'account.html';
      });
    });
  }

  function requireSession(here) {
    var current = session();
    if (!current) window.location.replace('signin.html?next=' + encodeURIComponent(here));
    return current;
  }

  function orderTotal(order) {
    return order.items.reduce(function (sum, item) { return sum + productById(item.productId).price * item.quantity; }, 0);
  }

  function renderAccount() {
    var current = requireSession('account.html');
    if (!current) return;
    $('#account-name').textContent = 'Signed in as ' + current.name + ' (' + current.email + ')';
    var list = $('#orders');
    ORDERS.forEach(function (order) {
      list.appendChild(el('li', {}, [
        el('a', { href: 'order.html?id=' + order.id, text: 'Order ' + order.id }),
        el('span', { class: 'muted', text: ' · placed ' + order.placed + ' · ' + order.status + ' · ' + money(orderTotal(order)) })
      ]));
    });
    $('#signout').addEventListener('click', function () {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
    });
  }

  function renderOrder() {
    var id = param('id') || '';
    var current = requireSession('order.html?id=' + encodeURIComponent(id));
    if (!current) return;
    var order = ORDERS.filter(function (o) { return o.id === id; })[0];
    var root = $('#order');
    if (!order) {
      root.appendChild(el('h1', { text: 'Order not found' }));
      root.appendChild(el('p', {}, [el('a', { href: 'account.html', text: 'Back to your orders' })]));
      return;
    }
    root.appendChild(el('h1', { text: 'Order ' + order.id }));
    root.appendChild(el('p', { text: 'Placed ' + order.placed + ' · Status: ' + order.status }));
    root.appendChild(el('p', { class: 'muted', text: 'Ships to ' + order.address }));
    var list = el('ul', { class: 'cart-items' });
    order.items.forEach(function (item) {
      var product = productById(item.productId);
      list.appendChild(el('li', {}, [
        el('span', { class: 'item-name', text: product.name + ' (' + item.size + ')' }),
        el('span', { text: '× ' + item.quantity }),
        el('span', { class: 'price', text: money(product.price * item.quantity) })
      ]));
    });
    root.appendChild(list);
    root.appendChild(el('p', { class: 'subtotal' }, [el('strong', { text: 'Total: ' + money(orderTotal(order)) })]));
    root.appendChild(el('p', {}, [el('a', { href: 'account.html', text: 'Back to your orders' })]));
  }

  function showError() {
    var banner = $('#error-banner');
    if (banner) banner.hidden = false;
  }
  window.addEventListener('error', showError);
  window.addEventListener('unhandledrejection', showError);

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    var page = document.body.getAttribute('data-page');
    var pages = { home: renderHome, shop: renderShop, product: renderProduct, cart: renderCart,
      signin: renderSignIn, account: renderAccount, order: renderOrder };
    if (pages[page]) pages[page]();
  });
})();
