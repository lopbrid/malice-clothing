let cart = [];

// Fetch products from backend
async function loadProducts() {
  let res = await fetch('/api/products/');
  let products = await res.json();
  let grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  products.forEach(p => {
    let div = document.createElement('div');
    div.classList.add('product');

    let variantButtons = p.variants.map(v => {
      let disabled = v.stock <= 0 ? 'disabled' : '';
      return `<button onclick="selectSize(this)" data-stock="${v.stock}" data-size="${v.size}" ${disabled}>
                ${v.size} (${v.stock} left)
              </button>`;
    }).join('');

    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p class="price">₱${p.price}</p>
      <button class="btn" onclick="toggleSize(this)">Add</button>
      <div class="size-box">
        <div class="sizes">${variantButtons}</div>
        <button class="checkout" onclick="addToCartBackend(${p.id},'${p.name}',${p.price},'${p.image}',this)">Add to Cart</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

// Toggle size selection
function toggleSize(button){
  document.querySelectorAll('.size-box').forEach(box => {
    if(box !== button.nextElementSibling) box.classList.remove('open');
  });
  button.nextElementSibling.classList.toggle('open');
}

// Select size
function selectSize(btn){
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ADD TO CART WITH BACKEND
function addToCartBackend(productId,name,price,image,button){
  let sizeBox = button.parentElement;
  let selected = sizeBox.querySelector('.sizes .active');

  if(!selected){ alert("Please select a size."); return; }

  let size = selected.getAttribute('data-size');
  let maxStock = parseInt(selected.getAttribute('data-stock'));

  // Check if item already in cart
  let existing = cart.find(i => i.name === name && i.size === size);
  if(existing){
    if(existing.quantity >= maxStock){
      alert(`Cannot add more. Max stock for ${size} is ${maxStock}.`);
      return;
    }
    existing.quantity += 1;
  } else {
    if(maxStock <= 0){
      alert(`Out of stock for size ${size}`);
      return;
    }
    cart.push({name,price,size,quantity:1,image});
  }

  renderCart();

  // Update stock in UI
  let newStock = maxStock - 1;
  selected.setAttribute('data-stock', newStock);
  selected.innerText = `${size} (${newStock} left)`;
  if(newStock <= 0) selected.disabled = true;

  sizeBox.classList.remove('open');
  selected.classList.remove('active');
}

// RENDER CART
function renderCart() {
  let items = document.getElementById('cartItems');
  let checkoutBtn = document.querySelector('#cartDrawer .checkout');
  items.innerHTML = '';
  let total = 0, count = 0;

  if(cart.length === 0){
    checkoutBtn.style.display = 'none';
    items.innerHTML = '<p>Cart is empty</p>';
  } else {
    checkoutBtn.style.display = 'block';
  }

  cart.forEach((item,index) => {
    items.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <span>${item.name}</span>
          <span>Size: ${item.size}</span>
          <span>₱${item.price}</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="quantity-controls">
            <button onclick="updateQuantity(${index},-1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity(${index},1)">+</button>
          </div>
          <button class="remove" onclick="removeItem(${index})">🗑️</button>
        </div>
      </div>
    `;
    total += item.price * item.quantity;
    count += item.quantity;
  });

  document.getElementById('total').innerText = total;
  document.getElementById('cartCount').innerText = count;
}

// UPDATE CART QUANTITY
function updateQuantity(index,delta){
  let item = cart[index];

  let btn = [...document.querySelectorAll('.sizes button')].find(b => 
    b.getAttribute('data-size')===item.size &&
    b.closest('.product').querySelector('h3').innerText===item.name
  );

  let stock = parseInt(btn.getAttribute('data-stock'));

  if(delta === 1){
    if(stock <= 0){
      alert(`Max stock reached for size ${item.size}`);
      return;
    }
    item.quantity += 1;
    btn.setAttribute('data-stock', stock-1);
    btn.innerText = `${item.size} (${stock-1} left)`;
    if(stock-1 <= 0) btn.disabled = true;
  } else if(delta === -1){
    item.quantity -= 1;
    btn.setAttribute('data-stock', stock+1);
    btn.innerText = `${item.size} (${stock+1} left)`;
    btn.disabled = false;

    if(item.quantity <= 0){
      cart.splice(index,1);
    }
  }

  renderCart();
}

// REMOVE ITEM
function removeItem(index){
  let item = cart[index];

  let btn = [...document.querySelectorAll('.sizes button')].find(b => 
    b.getAttribute('data-size')===item.size &&
    b.closest('.product').querySelector('h3').innerText===item.name
  );

  let stock = parseInt(btn.getAttribute('data-stock'));
  btn.setAttribute('data-stock', stock + item.quantity);
  btn.innerText = `${item.size} (${stock + item.quantity} left)`;
  btn.disabled = false;

  cart.splice(index,1);
  renderCart();
}

// CART TOGGLE AND CHECKOUT
function toggleCart() { document.getElementById('cartDrawer').classList.toggle('open'); }
function openCheckout() { document.getElementById('checkoutModal').classList.add('active'); }
function submitOrder() {
  alert("Order placed! MALICE will contact you soon.");
  cart.forEach(item => {
    let btn = [...document.querySelectorAll('.sizes button')].find(b => 
      b.getAttribute('data-size')===item.size &&
      b.closest('.product').querySelector('h3').innerText===item.name
    );
    let stock = parseInt(btn.getAttribute('data-stock'));
    btn.setAttribute('data-stock', stock + item.quantity);
    btn.innerText = `${item.size} (${stock + item.quantity} left)`;
    btn.disabled = false;
  });
  cart = [];
  renderCart();
  document.getElementById('checkoutModal').classList.remove('active');
}

// CSRF helper
function getCookie(name){
  let cookieValue = null;
  if(document.cookie && document.cookie!==''){
    let cookies = document.cookie.split(';');
    for(let i=0;i<cookies.length;i++){
      let cookie = cookies[i].trim();
      if(cookie.substring(0,name.length+1)===(name+'=')){
        cookieValue = decodeURIComponent(cookie.substring(name.length+1));
        break;
      }
    }
  }
  return cookieValue;
}

loadProducts();
