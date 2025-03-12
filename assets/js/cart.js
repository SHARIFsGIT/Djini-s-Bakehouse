/**
 * Djini's Bakehouse - Shopping Cart Management System
 * Enhanced with better storage, error handling, and additional features
 */

class ShoppingCart {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('djinisCart')) || [];
    this.events = {};
    this.init();
  }

  /**
   * Initialize the cart
   */
  init() {
    this.updateCartCount();
    this.setupEventListeners();
    this.setupToastNotification();
  }

  /**
   * Add event listener to all "Add to Cart" buttons
   */
  setupEventListeners() {
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-id');
        const productName = button.getAttribute('data-name');
        const productPrice = parseFloat(button.getAttribute('data-price'));
        const productImage = button.getAttribute('data-image') || '';
        
        this.addItem({
          id: productId,
          name: productName,
          price: productPrice,
          image: productImage,
          quantity: 1
        });
        
        this.showToast(`${productName} added to cart!`);
        this.triggerEvent('itemAdded');
      });
    });

    // Set up toast notification close button
    const closeToastBtn = document.getElementById('close-toast');
    if (closeToastBtn) {
      closeToastBtn.addEventListener('click', () => {
        this.hideToast();
      });
    }
    
    // If we're on the cart page, render the cart items and set up cart specific events
    if (window.location.pathname.includes('cart.html')) {
      this.renderCart();
      this.setupCartPageEvents();
    }
    
    // If we're on checkout page, render checkout summary
    if (window.location.pathname.includes('checkout.html')) {
      this.renderCheckoutSummary();
    }
  }

  /**
   * Setup cart page specific event listeners
   */
  setupCartPageEvents() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    
    // Using event delegation for dynamic cart elements
    cartContainer.addEventListener('click', (event) => {
      // Handle remove item button
      if (event.target.closest('.remove-item')) {
        const button = event.target.closest('.remove-item');
        const productId = button.getAttribute('data-id');
        this.removeItem(productId);
      }
      
      // Handle decrease quantity button
      if (event.target.closest('.decrease-quantity')) {
        const button = event.target.closest('.decrease-quantity');
        const productId = button.getAttribute('data-id');
        this.decreaseQuantity(productId);
      }
      
      // Handle increase quantity button
      if (event.target.closest('.increase-quantity')) {
        const button = event.target.closest('.increase-quantity');
        const productId = button.getAttribute('data-id');
        this.increaseQuantity(productId);
      }
    });
    
    // Handle quantity input changes
    cartContainer.addEventListener('change', (event) => {
      if (event.target.tagName === 'INPUT' && event.target.type === 'number') {
        const input = event.target;
        const productId = input.getAttribute('data-id');
        const newQuantity = parseInt(input.value);
        
        if (newQuantity > 0) {
          this.updateItemQuantity(productId, newQuantity);
        } else {
          input.value = 1;
          this.updateItemQuantity(productId, 1);
        }
      }
    });
    
    // Handle clear cart button
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
      clearCartButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your cart?')) {
          this.clearCart();
        }
      });
    }

    // Set up coupon code functionality
    const applyCouponButton = document.getElementById('apply-coupon');
    if (applyCouponButton) {
      applyCouponButton.addEventListener('click', () => {
        const couponInput = document.getElementById('coupon-code');
        if (couponInput && couponInput.value) {
          this.applyCoupon(couponInput.value);
        }
      });
    }
  }

  /**
   * Add item to cart
   * @param {Object} item - The item to add
   */
  addItem(item) {
    // Check if product is already in cart
    const existingItemIndex = this.cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex > -1) {
      // Increase quantity if already in cart
      this.cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item to cart
      this.cart.push(item);
    }
    
    // Save updated cart to localStorage
    this.saveCart();
    
    // Update cart count in header
    this.updateCartCount();
    
    // Add pulse animation to cart icon
    this.pulseCartIcon();
  }

  /**
   * Remove item from cart
   * @param {string} productId - The ID of the product to remove
   */
  removeItem(productId) {
    // Filter out the item with the given productId
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
    this.triggerEvent('itemRemoved');
  }

  /**
   * Increase the quantity of an item in the cart
   * @param {string} productId - The ID of the product
   */
  increaseQuantity(productId) {
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      this.cart[itemIndex].quantity += 1;
      this.saveCart();
      this.renderCart();
      this.triggerEvent('quantityChanged');
    }
  }

  /**
   * Decrease the quantity of an item in the cart
   * @param {string} productId - The ID of the product
   */
  decreaseQuantity(productId) {
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      if (this.cart[itemIndex].quantity > 1) {
        this.cart[itemIndex].quantity -= 1;
      } else {
        // Remove item if quantity would be 0
        this.cart.splice(itemIndex, 1);
      }
      this.saveCart();
      this.updateCartCount();
      this.renderCart();
      this.triggerEvent('quantityChanged');
    }
  }

  /**
   * Update the quantity of an item in the cart
   * @param {string} productId - The ID of the product
   * @param {number} quantity - The new quantity
   */
  updateItemQuantity(productId, quantity) {
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      this.cart[itemIndex].quantity = quantity;
      this.saveCart();
      this.renderCart();
      this.triggerEvent('quantityChanged');
    }
  }

  /**
   * Clear all items from the cart
   */
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
    this.triggerEvent('cartCleared');
  }

  /**
   * Apply a coupon code to the cart
   * @param {string} code - The coupon code
   */
  applyCoupon(code) {
    // Sample coupon codes
    const coupons = {
      'WELCOME10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FREESHIP': { type: 'shipping', value: 'free' },
      '5DOLLARS': { type: 'fixed', value: 5 }
    };
    
    const couponInfo = coupons[code.toUpperCase()];
    
    if (couponInfo) {
      localStorage.setItem('djinisCoupon', JSON.stringify({
        code: code.toUpperCase(),
        ...couponInfo
      }));
      
      this.showToast(`Coupon "${code.toUpperCase()}" applied successfully!`, 'success');
      this.renderCart(); // Re-render cart with discount
      this.triggerEvent('couponApplied');
      
      // Clear the input field
      const couponInput = document.getElementById('coupon-code');
      if (couponInput) couponInput.value = '';
    } else {
      this.showToast('Invalid coupon code. Please try again.', 'error');
    }
  }

  /**
   * Get the applied coupon if any
   * @returns {Object|null} The applied coupon
   */
  getAppliedCoupon() {
    const couponJson = localStorage.getItem('djinisCoupon');
    return couponJson ? JSON.parse(couponJson) : null;
  }

  /**
   * Calculate the discount amount based on the applied coupon
   * @param {number} subtotal - The cart subtotal
   * @returns {number} The discount amount
   */
  calculateDiscount(subtotal) {
    const coupon = this.getAppliedCoupon();
    if (!coupon) return 0;
    
    if (coupon.type === 'percentage') {
      return (subtotal * coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      return Math.min(subtotal, coupon.value);
    }
    
    return 0;
  }

  /**
   * Calculate if shipping is free based on coupon
   * @returns {boolean} True if shipping is free
   */
  isShippingFree() {
    const coupon = this.getAppliedCoupon();
    return coupon && coupon.type === 'shipping' && coupon.value === 'free';
  }

  /**
   * Save the cart to localStorage
   */
  saveCart() {
    try {
      localStorage.setItem('djinisCart', JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      this.showToast('There was an error saving your cart. Please try again.', 'error');
    }
  }

  /**
   * Update the cart count in the header
   */
  updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    if (cartCountElements.length === 0) return;
    
    const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElements.forEach(element => {
      element.textContent = totalItems;
      
      // Make count invisible if 0
      if (totalItems === 0) {
        element.classList.add('invisible');
      } else {
        element.classList.remove('invisible');
      }
    });
  }

  /**
   * Add pulse animation to cart icon
   */
  pulseCartIcon() {
    const cartIconElements = document.querySelectorAll('.cart-icon');
    if (cartIconElements.length === 0) return;
    
    cartIconElements.forEach(icon => {
      icon.classList.add('cart-badge-pulse');
      setTimeout(() => {
        icon.classList.remove('cart-badge-pulse');
      }, 700);
    });
  }

  /**
   * Setup toast notification
   */
  setupToastNotification() {
    // Create toast element if it doesn't exist
    if (!document.getElementById('cart-toast')) {
      const toastHtml = `
        <div id="cart-toast" class="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 hidden transform transition-transform duration-300 z-50 max-w-xs">
          <div class="flex items-center">
            <div id="toast-icon" class="bg-green-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="flex-1">
              <p id="toast-message" class="font-medium"></p>
              <a href="cart.html" class="text-sm text-blue-600 hover:underline">View Cart</a>
            </div>
            <button id="close-toast" class="ml-4 text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      `;
      
      // Add toast to document
      const toastContainer = document.createElement('div');
      toastContainer.innerHTML = toastHtml;
      document.body.appendChild(toastContainer.firstElementChild);
      
      // Add event listener to close button
      document.getElementById('close-toast').addEventListener('click', () => {
        this.hideToast();
      });
    }
  }

  /**
   * Show toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (success, error, warning)
   */
  showToast(message, type = 'success') {
    const toast = document.getElementById('cart-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastMessage || !toastIcon) return;
    
    // Set message
    toastMessage.textContent = message;
    
    // Set icon based on type
    toastIcon.className = 'p-2 rounded-full mr-3';
    let iconHtml = '';
    
    switch (type) {
      case 'error':
        toastIcon.classList.add('bg-red-100');
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>`;
        break;
      case 'warning':
        toastIcon.classList.add('bg-yellow-100');
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>`;
        break;
      default: // success
        toastIcon.classList.add('bg-green-100');
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
    }
    
    toastIcon.innerHTML = iconHtml;
    
    // Show toast
    toast.classList.remove('hidden', 'slide-out');
    toast.classList.add('slide-in');
    
    // Auto hide after 3 seconds
    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  /**
   * Hide toast notification
   */
  hideToast() {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;
    
    toast.classList.remove('slide-in');
    toast.classList.add('slide-out');
    
    clearTimeout(this.toastTimeout);
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }

  /**
   * Render cart items on the cart page
   */
  renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const checkoutButton = document.getElementById('checkout-button');
    const subtotalElement = document.getElementById('cart-subtotal');
    const discountElement = document.getElementById('cart-discount');
    const shippingElement = document.getElementById('cart-shipping');
    
    if (!cartContainer) return;
    
    if (this.cart.length === 0) {
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
    this.cart.forEach(item => {
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
          ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">` : ''}
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
    
    // Calculate subtotal
    const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate discount
    const discount = this.calculateDiscount(subtotal);
    
    // Calculate shipping
    const shippingCost = this.isShippingFree() ? 0 : 5.99;
    
    // Calculate total
    const total = subtotal - discount + shippingCost;
    
    // Update elements if they exist
    if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
    
    // Show or hide discount row based on if there's a discount
    const discountRow = document.getElementById('discount-row');
    if (discountRow) {
      if (discount > 0) {
        discountRow.classList.remove('hidden');
        if (discountElement) discountElement.textContent = `-${discount.toFixed(2)}`;
      } else {
        discountRow.classList.add('hidden');
      }
    }
    
    // Show shipping cost or "Free" text
    if (shippingElement) {
      shippingElement.textContent = this.isShippingFree() ? 'Free' : `$${shippingCost.toFixed(2)}`;
    }
    
    // Update total
    if (cartTotalElement) cartTotalElement.textContent = total.toFixed(2);
    
    // Show applied coupon if any
    const coupon = this.getAppliedCoupon();
    const couponInfoElement = document.getElementById('applied-coupon');
    
    if (couponInfoElement) {
      if (coupon) {
        let discountText = '';
        
        if (coupon.type === 'percentage') {
          discountText = `${coupon.value}% off`;
        } else if (coupon.type === 'fixed') {
          discountText = `$${coupon.value} off`;
        } else if (coupon.type === 'shipping') {
          discountText = 'Free shipping';
        }
        
        couponInfoElement.textContent = `Applied: ${coupon.code} (${discountText})`;
        couponInfoElement.classList.remove('hidden');
      } else {
        couponInfoElement.classList.add('hidden');
      }
    }
  }

  /**
   * Render checkout summary on the checkout page
   */
  renderCheckoutSummary() {
    const checkoutSummaryElement = document.getElementById('checkout-summary');
    const checkoutTotalElement = document.getElementById('checkout-total');
    const subtotalElement = document.getElementById('checkout-subtotal');
    const taxElement = document.getElementById('checkout-tax');
    const shippingElement = document.getElementById('checkout-shipping');
    const discountElement = document.getElementById('checkout-discount');
    
    if (!checkoutSummaryElement || !checkoutTotalElement) return;
    
    // Clear summary container
    checkoutSummaryElement.innerHTML = '';
    
    // Add each item to summary
    this.cart.forEach(item => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      
      const summaryItemElement = document.createElement('div');
      summaryItemElement.className = 'flex justify-between py-2';
      summaryItemElement.innerHTML = `
        <span>${item.name} × ${item.quantity}</span>
        <span>$${itemTotal}</span>
      `;
      
      checkoutSummaryElement.appendChild(summaryItemElement);
    });
    
    // Calculate subtotal
    const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate discount
    const discount = this.calculateDiscount(subtotal);
    
    // Calculate shipping
    const shippingCost = this.isShippingFree() ? 0 : 5.99;
    
    // Calculate tax
    const tax = (subtotal - discount) * 0.1; // 10% tax
    
    // Calculate total
    const total = subtotal - discount + tax + shippingCost;
    
    // Add subtotal row
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'flex justify-between py-2 border-t mt-4';
    subtotalRow.innerHTML = `
      <span>Subtotal</span>
      <span>$${subtotal.toFixed(2)}</span>
    `;
    checkoutSummaryElement.appendChild(subtotalRow);
    
    // Add discount row if there is a discount
    if (discount > 0) {
      const discountRow = document.createElement('div');
      discountRow.className = 'flex justify-between py-2 text-green-600';
      discountRow.innerHTML = `
        <span>Discount</span>
        <span>-$${discount.toFixed(2)}</span>
      `;
      checkoutSummaryElement.appendChild(discountRow);
    }
    
    // Add shipping row
    const shippingRow = document.createElement('div');
    shippingRow.className = 'flex justify-between py-2';
    shippingRow.innerHTML = `
      <span>Shipping</span>
      <span>${this.isShippingFree() ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
    `;
    checkoutSummaryElement.appendChild(shippingRow);
    
    // Add tax row
    const taxRow = document.createElement('div');
    taxRow.className = 'flex justify-between py-2';
    taxRow.innerHTML = `
      <span>Tax (10%)</span>
      <span>$${tax.toFixed(2)}</span>
    `;
    checkoutSummaryElement.appendChild(taxRow);
    
    // Update total
    checkoutTotalElement.textContent = total.toFixed(2);
    
    // Show applied coupon if any
    const coupon = this.getAppliedCoupon();
    if (coupon) {
      const couponRow = document.createElement('div');
      couponRow.className = 'flex justify-between py-2 text-sm text-green-600 border-t border-dashed';
      
      let discountText = '';
      if (coupon.type === 'percentage') {
        discountText = `${coupon.value}% off`;
      } else if (coupon.type === 'fixed') {
        discountText = `$${coupon.value} off`;
      } else if (coupon.type === 'shipping') {
        discountText = 'Free shipping';
      }
      
      couponRow.innerHTML = `
        <span>Coupon Applied: ${coupon.code}</span>
        <span>${discountText}</span>
      `;
      
      // Insert after subtotal (before tax)
      checkoutSummaryElement.insertBefore(couponRow, taxRow);
    }
  }

  /**
   * Subscribe to cart events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  triggerEvent(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get cart contents
   * @returns {Array} The cart items
   */
  getCart() {
    return [...this.cart];
  }

  /**
   * Get cart total
   * @returns {number} The cart total
   */
  getTotal() {
    // Calculate subtotal
    const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate discount
    const discount = this.calculateDiscount(subtotal);
    
    // Calculate shipping
    const shippingCost = this.isShippingFree() ? 0 : 5.99;
    
    // Calculate tax
    const tax = (subtotal - discount) * 0.1; // 10% tax
    
    // Calculate total
    return subtotal - discount + tax + shippingCost;
  }

  /**
   * Format currency
   * @param {number} amount - The amount to format
   * @returns {string} The formatted currency string
   */
  static formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }
}

// Initialize the shopping cart when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global cart instance
  window.djinisCart = new ShoppingCart();
});