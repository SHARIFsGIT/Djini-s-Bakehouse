// cart.js - Shopping Cart Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart from localStorage or create empty cart
    let cart = JSON.parse(localStorage.getItem('djinisCart')) || [];
    
    // Update cart count in the header
    updateCartCount();
    
    // Add event listeners to all "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        const productName = this.getAttribute('data-name');
        const productPrice = parseFloat(this.getAttribute('data-price'));
        
        // Check if product is already in cart
        const existingItemIndex = cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex > -1) {
          // Increase quantity if already in cart
          cart[existingItemIndex].quantity += 1;
        } else {
          // Add new item to cart
          cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
          });
        }
        
        // Save updated cart to localStorage
        saveCart();
        
        // Update cart count in header
        updateCartCount();
        
        // Show toast notification
        showToast();
        
        // Add pulse animation to cart icon
        const cartIcon = document.querySelector('#cart-count');
        cartIcon.classList.add('cart-badge-pulse');
        setTimeout(() => {
          cartIcon.classList.remove('cart-badge-pulse');
        }, 700);
      });
    });
    
    // Set up toast notification close button
    const closeToastBtn = document.getElementById('close-toast');
    if (closeToastBtn) {
      closeToastBtn.addEventListener('click', function() {
        hideToast();
      });
    }
    
    // If we're on the cart page, render the cart items
    if (window.location.pathname.includes('cart.html')) {
      renderCart();
      setupCartEventListeners();
    }
    
    // If we're on the checkout page, render the cart summary
    if (window.location.pathname.includes('checkout.html')) {
      renderCheckoutSummary();
      setupCheckoutEventListeners();
    }
    
    // Functions
    
    function saveCart() {
      localStorage.setItem('djinisCart', JSON.stringify(cart));
    }
    
    function updateCartCount() {
      const cartCountElement = document.getElementById('cart-count');
      if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
      }
    }
    
    function showToast() {
      const toast = document.getElementById('cart-toast');
      if (toast) {
        toast.classList.remove('hidden', 'slide-out');
        toast.classList.add('slide-in');
        
        // Auto hide after 3 seconds
        setTimeout(hideToast, 3000);
      }
    }
    
    function hideToast() {
      const toast = document.getElementById('cart-toast');
      if (toast) {
        toast.classList.remove('slide-in');
        toast.classList.add('slide-out');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 300);
      }
    }
    
    function renderCart() {
      const cartContainer = document.getElementById('cart-items');
      const cartTotalElement = document.getElementById('cart-total');
      const emptyCartMessage = document.getElementById('empty-cart-message');
      const checkoutButton = document.getElementById('checkout-button');
      
      if (!cartContainer) return;
      
      if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (cartContainer) cartContainer.classList.add('hidden');
        if (cartTotalElement) cartTotalElement.textContent = '0.00';
        if (checkoutButton) checkoutButton.disabled = true;
        return;
      }
      
      // Hide empty cart message, show cart items
      if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
      if (cartContainer) cartContainer.classList.remove('hidden');
      if (checkoutButton) checkoutButton.disabled = false;
      
      // Clear cart container
      cartContainer.innerHTML = '';
      
      // Add each item to cart
      cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'flex items-center justify-between py-4 border-b';
        cartItemElement.innerHTML = `
          <div class="flex items-center space-x-4">
            <button class="remove-item text-gray-500 hover:text-red-500" data-id="${item.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h3 class="font-medium">${item.name}</h3>
              <p class="text-sm text-gray-500">$${item.price.toFixed(2)} each</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center border rounded-lg overflow-hidden">
              <button class="decrease-quantity px-2 py-1 bg-gray-100 hover:bg-gray-200" data-id="${item.id}">-</button>
              <input type="number" min="1" value="${item.quantity}" class="w-12 text-center border-x" data-id="${item.id}">
              <button class="increase-quantity px-2 py-1 bg-gray-100 hover:bg-gray-200" data-id="${item.id}">+</button>
            </div>
            <span class="font-medium w-20 text-right">$${itemTotal}</span>
          </div>
        `;
        
        cartContainer.appendChild(cartItemElement);
      });
      
      // Update cart total
      const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
      if (cartTotalElement) cartTotalElement.textContent = cartTotal;
    }
    
    function renderCheckoutSummary() {
      const checkoutSummaryElement = document.getElementById('checkout-summary');
      const checkoutTotalElement = document.getElementById('checkout-total');
      
      if (!checkoutSummaryElement || !checkoutTotalElement) return;
      
      // Clear summary container
      checkoutSummaryElement.innerHTML = '';
      
      // Add each item to summary
      cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        const summaryItemElement = document.createElement('div');
        summaryItemElement.className = 'flex justify-between py-2';
        summaryItemElement.innerHTML = `
          <span>${item.name} × ${item.quantity}</span>
          <span>$${itemTotal}</span>
        `;
        
        checkoutSummaryElement.appendChild(summaryItemElement);
      });
      
      // Calculate subtotal, tax, and total
      const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;
      
      // Add subtotal and tax
      const subtotalElement = document.createElement('div');
      subtotalElement.className = 'flex justify-between py-2 border-t mt-4';
      subtotalElement.innerHTML = `
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      `;
      checkoutSummaryElement.appendChild(subtotalElement);
      
      const taxElement = document.createElement('div');
      taxElement.className = 'flex justify-between py-2';
      taxElement.innerHTML = `
        <span>Tax (10%)</span>
        <span>$${tax.toFixed(2)}</span>
      `;
      checkoutSummaryElement.appendChild(taxElement);
      
      // Update total
      checkoutTotalElement.textContent = total.toFixed(2);
    }
    
    function setupCartEventListeners() {
      // Event delegation for dynamic cart elements
      const cartContainer = document.getElementById('cart-items');
      if (!cartContainer) return;
      
      cartContainer.addEventListener('click', function(event) {
        // Handle remove item button
        if (event.target.closest('.remove-item')) {
          const button = event.target.closest('.remove-item');
          const productId = button.getAttribute('data-id');
          removeCartItem(productId);
        }
        
        // Handle decrease quantity button
        if (event.target.closest('.decrease-quantity')) {
          const button = event.target.closest('.decrease-quantity');
          const productId = button.getAttribute('data-id');
          decreaseQuantity(productId);
        }
        
        // Handle increase quantity button
        if (event.target.closest('.increase-quantity')) {
          const button = event.target.closest('.increase-quantity');
          const productId = button.getAttribute('data-id');
          increaseQuantity(productId);
        }
      });
      
      // Handle quantity input changes
      cartContainer.addEventListener('change', function(event) {
        if (event.target.tagName === 'INPUT' && event.target.type === 'number') {
          const input = event.target;
          const productId = input.getAttribute('data-id');
          const newQuantity = parseInt(input.value);
          
          if (newQuantity > 0) {
            updateItemQuantity(productId, newQuantity);
          } else {
            input.value = 1;
            updateItemQuantity(productId, 1);
          }
        }
      });
      
      // Handle clear cart button
      const clearCartButton = document.getElementById('clear-cart');
      if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
      }
    }
    
    function setupCheckoutEventListeners() {
      const checkoutForm = document.getElementById('checkout-form');
      if (!checkoutForm) return;
      
      checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading
        const submitButton = document.querySelector('#checkout-form button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="loading-spinner mx-auto"></div>';
        
        // Simulate checkout process
        setTimeout(() => {
          // Order successfully placed
          localStorage.removeItem('djinisCart');
          window.location.href = 'order-confirmation.html';
        }, 2000);
      });
      
      // Toggle payment methods
      const paymentOptions = document.querySelectorAll('[name="payment-method"]');
      paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
          // Hide all payment details
          document.querySelectorAll('.payment-details').forEach(details => {
            details.classList.add('hidden');
          });
          
          // Show selected payment details
          const selectedPaymentDetails = document.getElementById(`${this.id}-details`);
          if (selectedPaymentDetails) {
            selectedPaymentDetails.classList.remove('hidden');
          }
          
          // Update visual selection
          document.querySelectorAll('.payment-method-option').forEach(option => {
            option.classList.remove('selected');
          });
          this.closest('.payment-method-option').classList.add('selected');
        });
      });
    }
    
    function removeCartItem(productId) {
      cart = cart.filter(item => item.id !== productId);
      saveCart();
      updateCartCount();
      renderCart();
    }
    
    function increaseQuantity(productId) {
      const itemIndex = cart.findIndex(item => item.id === productId);
      if (itemIndex > -1) {
        cart[itemIndex].quantity += 1;
        saveCart();
        renderCart();
      }
    }
    
    function decreaseQuantity(productId) {
      const itemIndex = cart.findIndex(item => item.id === productId);
      if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity -= 1;
        } else {
          // Remove item if quantity would be 0
          cart.splice(itemIndex, 1);
        }
        saveCart();
        updateCartCount();
        renderCart();
      }
    }
    
    function updateItemQuantity(productId, quantity) {
      const itemIndex = cart.findIndex(item => item.id === productId);
      if (itemIndex > -1) {
        cart[itemIndex].quantity = quantity;
        saveCart();
        renderCart();
      }
    }
    
    function clearCart() {
      cart = [];
      saveCart();
      updateCartCount();
      renderCart();
    }
    
    // Helper function to format currency
    window.formatCurrency = function(amount) {
      return '$' + parseFloat(amount).toFixed(2);
    };
  });