/**
 * Djini's Bakehouse - Cart Page Specific JavaScript
 * Enhances the cart.html page with additional functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const TAX_RATE = 0.08; // 8% tax rate
    const SHIPPING_COST = 5.99;
    const FREE_SHIPPING_THRESHOLD = 50.00;
  
    // DOM Elements
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');
    const cartItemCount = document.getElementById('cart-item-count');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartDiscount = document.getElementById('cart-discount');
    const cartShipping = document.getElementById('cart-shipping');
    const cartTax = document.getElementById('cart-tax');
    const cartTotal = document.getElementById('cart-total');
    const updateCartBtn = document.getElementById('update-cart');
    const checkoutBtn = document.getElementById('checkout-button');
    const promoForm = document.getElementById('promo-form');
    const promoCodeInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    const recommendedProducts = document.getElementById('recommended-products');
    
    // Modal Elements
    const confirmRemoveModal = document.getElementById('confirm-remove-modal');
    const removeItemName = document.getElementById('remove-item-name');
    const cancelRemoveBtn = document.getElementById('cancel-remove');
    const confirmRemoveBtn = document.getElementById('confirm-remove');
    
    // Notification Elements
    const notificationToast = document.getElementById('notification-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    const closeToastBtn = document.getElementById('close-toast');
    
    // Variables
    let currentRemoveItemId = null;
    let cart = [];
  
    /**
     * Initialize cart page
     */
    function init() {
      loadCart();
      renderCart();
      loadRecommendedProducts();
      setupEventListeners();
    }
  
    /**
     * Load cart from localStorage
     */
    function loadCart() {
      try {
        cart = JSON.parse(localStorage.getItem('djinisCart')) || [];
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        cart = [];
      }
    }
  
    /**
     * Setup all event listeners for the cart page
     */
    function setupEventListeners() {
      // Update cart button
      if (updateCartBtn) {
        updateCartBtn.addEventListener('click', function() {
          updateCartQuantities();
          showNotification('Cart updated successfully!', 'success');
        });
      }
  
      // Promo code form
      if (promoForm) {
        promoForm.addEventListener('submit', function(event) {
          event.preventDefault();
          applyPromoCode();
        });
      }
  
      // Close toast button
      if (closeToastBtn) {
        closeToastBtn.addEventListener('click', function() {
          hideNotification();
        });
      }
  
      // Cancel remove button in modal
      if (cancelRemoveBtn) {
        cancelRemoveBtn.addEventListener('click', function() {
          closeRemoveModal();
        });
      }
  
      // Confirm remove button in modal
      if (confirmRemoveBtn) {
        confirmRemoveBtn.addEventListener('click', function() {
          if (currentRemoveItemId) {
            removeCartItem(currentRemoveItemId);
            closeRemoveModal();
            showNotification('Item removed from cart', 'success');
          }
        });
      }
  
      // Using event delegation for dynamically created elements
      if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(event) {
          const target = event.target;
          
          // Remove item button
          if (target.closest('.remove-item-btn')) {
            const button = target.closest('.remove-item-btn');
            const itemId = button.getAttribute('data-id');
            const itemName = button.getAttribute('data-name');
            openRemoveModal(itemId, itemName);
          }
          
          // Increase quantity button
          if (target.closest('.quantity-plus')) {
            const button = target.closest('.quantity-plus');
            const itemId = button.getAttribute('data-id');
            increaseQuantity(itemId);
          }
          
          // Decrease quantity button
          if (target.closest('.quantity-minus')) {
            const button = target.closest('.quantity-minus');
            const itemId = button.getAttribute('data-id');
            decreaseQuantity(itemId);
          }
        });
  
        // Handle quantity input changes
        cartItemsContainer.addEventListener('change', function(event) {
          if (event.target.classList.contains('quantity-input')) {
            const input = event.target;
            const itemId = input.getAttribute('data-id');
            const quantity = parseInt(input.value);
            
            if (quantity > 0) {
              updateQuantity(itemId, quantity);
            } else {
              // Reset to 1 if invalid quantity
              input.value = 1;
              updateQuantity(itemId, 1);
            }
          }
        });
      }
    }
  
    /**
     * Render cart items and summary
     */
    function renderCart() {
      if (!cartItemsContainer) return;
  
      // Check if cart is empty
      if (cart.length === 0) {
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (cartContent) cartContent.classList.add('hidden');
        return;
      }
  
      // Show cart content, hide empty cart message
      if (emptyCart) emptyCart.classList.add('hidden');
      if (cartContent) cartContent.classList.remove('hidden');
  
      // Update cart item count
      if (cartItemCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartItemCount.textContent = totalItems;
      }
  
      // Clear cart items container
      cartItemsContainer.innerHTML = '';
  
      // Render each cart item
      cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b';
        cartItemEl.innerHTML = `
          <div class="flex items-center mb-4 sm:mb-0">
            <button class="remove-item-btn text-gray-400 hover:text-red-500 transition-colors mr-4" 
                    data-id="${item.id}" 
                    data-name="${item.name}" 
                    aria-label="Remove ${item.name} from cart">
              <i class="fas fa-times"></i>
            </button>
            <div class="flex items-center">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg mr-4">` : 
              `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-cookie text-gray-400 text-3xl"></i>
               </div>`}
              <div>
                <h3 class="font-semibold text-gray-800">${item.name}</h3>
                <p class="text-gray-600 text-sm mt-1">$${item.price.toFixed(2)} each</p>
              </div>
            </div>
          </div>
          <div class="flex items-center">
            <div class="flex items-center border rounded-lg mr-6">
              <button class="quantity-minus px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600" data-id="${item.id}">-</button>
              <input type="number" min="1" value="${item.quantity}" 
                     class="quantity-input w-12 py-1 text-center border-x focus:outline-none" data-id="${item.id}">
              <button class="quantity-plus px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600" data-id="${item.id}">+</button>
            </div>
            <span class="font-semibold text-gray-800 w-20 text-right">$${itemTotal}</span>
          </div>
        `;
        
        cartItemsContainer.appendChild(cartItemEl);
      });
  
      // Calculate order summary
      updateOrderSummary();
    }
  
    /**
     * Update order summary calculations
     */
    function updateOrderSummary() {
      // Calculate subtotal
      const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
  
      // Apply coupon/discount if any
      const coupon = getAppliedCoupon();
      let discount = 0;
      let freeShipping = false;
  
      if (coupon) {
        if (coupon.type === 'percentage') {
          discount = subtotal * (coupon.value / 100);
        } else if (coupon.type === 'fixed') {
          discount = Math.min(coupon.value, subtotal); // Don't allow discount > subtotal
        } else if (coupon.type === 'shipping' && coupon.value === 'free') {
          freeShipping = true;
        }
      }
  
      // Display discount if any
      const discountRow = document.getElementById('discount-row');
      if (discountRow) {
        if (discount > 0) {
          discountRow.classList.remove('hidden');
          if (cartDiscount) cartDiscount.textContent = discount.toFixed(2);
        } else {
          discountRow.classList.add('hidden');
        }
      }
  
      // Calculate shipping (free if subtotal > threshold or if free shipping coupon applied)
      const shipping = (subtotal > FREE_SHIPPING_THRESHOLD || freeShipping) ? 0 : SHIPPING_COST;
      if (cartShipping) {
        cartShipping.textContent = shipping === 0 ? '0.00' : shipping.toFixed(2);
      }
  
      // Calculate tax (applied after discount)
      const taxableAmount = subtotal - discount;
      const tax = taxableAmount * TAX_RATE;
      if (cartTax) cartTax.textContent = tax.toFixed(2);
  
      // Calculate total
      const total = subtotal - discount + shipping + tax;
      if (cartTotal) cartTotal.textContent = total.toFixed(2);
  
      // Disable checkout button if cart is empty
      if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        if (cart.length === 0) {
          checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    }
  
    /**
     * Get the applied coupon from localStorage
     */
    function getAppliedCoupon() {
      try {
        const couponJson = localStorage.getItem('djinisCoupon');
        return couponJson ? JSON.parse(couponJson) : null;
      } catch (error) {
        console.error('Error getting coupon:', error);
        return null;
      }
    }
  
    /**
     * Apply a promo code to the cart
     */
    function applyPromoCode() {
      if (!promoCodeInput || !promoMessage) return;
      
      const code = promoCodeInput.value.trim();
      if (!code) {
        showPromoMessage('Please enter a promo code', 'error');
        return;
      }
  
      // Available promo codes
      const promoCodes = {
        'WELCOME10': { type: 'percentage', value: 10, description: '10% off your order' },
        'SAVE20': { type: 'percentage', value: 20, description: '20% off your order' },
        'FREESHIP': { type: 'shipping', value: 'free', description: 'Free shipping' },
        '5DOLLARS': { type: 'fixed', value: 5, description: '$5 off your order' }
      };
  
      // Check if code is valid
      if (promoCodes[code.toUpperCase()]) {
        const coupon = {
          code: code.toUpperCase(),
          ...promoCodes[code.toUpperCase()]
        };
  
        // Save coupon to localStorage
        localStorage.setItem('djinisCoupon', JSON.stringify(coupon));
        
        // Show success message and update summary
        showPromoMessage(`Coupon applied: ${coupon.description}`, 'success');
        updateOrderSummary();
        
        // Clear input
        promoCodeInput.value = '';
      } else {
        showPromoMessage('Invalid promo code. Please try again.', 'error');
      }
    }
  
    /**
     * Display promo code status message
     */
    function showPromoMessage(message, type) {
      if (!promoMessage) return;
      
      promoMessage.textContent = message;
      promoMessage.classList.remove('hidden', 'text-green-600', 'text-red-600');
      
      if (type === 'success') {
        promoMessage.classList.add('text-green-600');
      } else {
        promoMessage.classList.add('text-red-600');
      }
      
      promoMessage.classList.remove('hidden');
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        promoMessage.classList.add('hidden');
      }, 5000);
    }
  
    /**
     * Increase the quantity of an item in the cart
     */
    function increaseQuantity(itemId) {
      const itemIndex = cart.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        cart[itemIndex].quantity += 1;
        saveCart();
        renderCart();
      }
    }
  
    /**
     * Decrease the quantity of an item in the cart
     */
    function decreaseQuantity(itemId) {
      const itemIndex = cart.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity -= 1;
          saveCart();
          renderCart();
        } else {
          // If quantity would be 0, ask to remove item
          const itemName = cart[itemIndex].name;
          openRemoveModal(itemId, itemName);
        }
      }
    }
  
    /**
     * Update the quantity of an item in the cart
     */
    function updateQuantity(itemId, quantity) {
      const itemIndex = cart.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        cart[itemIndex].quantity = quantity;
        saveCart();
        renderCart();
      }
    }
  
    /**
     * Update all cart quantities based on input values
     */
    function updateCartQuantities() {
      const quantityInputs = document.querySelectorAll('.quantity-input');
      let updated = false;
  
      quantityInputs.forEach(input => {
        const itemId = input.getAttribute('data-id');
        const newQuantity = parseInt(input.value);
        
        if (newQuantity > 0) {
          const itemIndex = cart.findIndex(item => item.id === itemId);
          if (itemIndex !== -1 && cart[itemIndex].quantity !== newQuantity) {
            cart[itemIndex].quantity = newQuantity;
            updated = true;
          }
        } else {
          // Reset to 1 if invalid
          input.value = 1;
          const itemIndex = cart.findIndex(item => item.id === itemId);
          if (itemIndex !== -1 && cart[itemIndex].quantity !== 1) {
            cart[itemIndex].quantity = 1;
            updated = true;
          }
        }
      });
  
      if (updated) {
        saveCart();
        renderCart();
      }
    }
  
    /**
     * Remove an item from the cart
     */
    function removeCartItem(itemId) {
      cart = cart.filter(item => item.id !== itemId);
      saveCart();
      renderCart();
      
      // Update cart count in header
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      const cartCountElements = document.querySelectorAll('.cart-count');
      cartCountElements.forEach(element => {
        element.textContent = totalItems;
        if (totalItems === 0) {
          element.classList.add('invisible');
        } else {
          element.classList.remove('invisible');
        }
      });
    }
  
    /**
     * Save cart to localStorage
     */
    function saveCart() {
      try {
        localStorage.setItem('djinisCart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart:', error);
        showNotification('There was an error saving your cart', 'error');
      }
    }
  
    /**
     * Open the remove item confirmation modal
     */
    function openRemoveModal(itemId, itemName) {
      if (!confirmRemoveModal || !removeItemName) return;
      
      currentRemoveItemId = itemId;
      removeItemName.textContent = itemName;
      confirmRemoveModal.classList.remove('hidden');
      
      // Close modal if clicked outside
      document.addEventListener('click', closeModalOnOutsideClick);
      
      // Close modal on escape key
      document.addEventListener('keydown', closeModalOnEscape);
    }
  
    /**
     * Close the remove item confirmation modal
     */
    function closeRemoveModal() {
      if (!confirmRemoveModal) return;
      
      confirmRemoveModal.classList.add('hidden');
      currentRemoveItemId = null;
      
      // Remove event listeners
      document.removeEventListener('click', closeModalOnOutsideClick);
      document.removeEventListener('keydown', closeModalOnEscape);
    }
  
    /**
     * Close modal when clicking outside
     */
    function closeModalOnOutsideClick(event) {
      if (confirmRemoveModal && !confirmRemoveModal.contains(event.target) && 
          !event.target.closest('.remove-item-btn') && 
          !event.target.closest('.quantity-minus')) {
        closeRemoveModal();
      }
    }
  
    /**
     * Close modal on escape key
     */
    function closeModalOnEscape(event) {
      if (event.key === 'Escape') {
        closeRemoveModal();
      }
    }
  
    /**
     * Show notification toast
     */
    function showNotification(message, type = 'success') {
      if (!notificationToast || !toastMessage || !toastIcon) return;
      
      toastMessage.textContent = message;
      
      // Set icon based on type
      toastIcon.className = 'p-2 rounded-full mr-3';
      
      if (type === 'success') {
        toastIcon.classList.add('bg-green-100');
        toastIcon.innerHTML = '<i class="fas fa-check text-green-600"></i>';
      } else if (type === 'error') {
        toastIcon.classList.add('bg-red-100');
        toastIcon.innerHTML = '<i class="fas fa-times text-red-600"></i>';
      } else if (type === 'warning') {
        toastIcon.classList.add('bg-yellow-100');
        toastIcon.innerHTML = '<i class="fas fa-exclamation-triangle text-yellow-600"></i>';
      }
      
      // Show notification
      notificationToast.classList.remove('hidden');
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        hideNotification();
      }, 3000);
    }
  
    /**
     * Hide notification toast
     */
    function hideNotification() {
      if (notificationToast) {
        notificationToast.classList.add('hidden');
      }
    }
  
    /**
     * Load recommended products based on cart items
     */
    function loadRecommendedProducts() {
      if (!recommendedProducts) return;
      
      // Sample product recommendations (in a real implementation, these would be based on cart items)
      const recommendedItems = [
        { id: 'cinnamon-roll', name: 'Cinnamon Roll', price: 4.50, image: '../images/Cinnamon Roll.jpg' },
        { id: 'chocolate-chip-cookie', name: 'Chocolate Chip Cookie', price: 2.75, image: '../images/Chocolate Chip Cookie.jpg' },
        { id: 'blueberry-muffin', name: 'Blueberry Muffin', price: 3.25, image: '../images/Blueberry Muffin.jpg' },
        { id: 'sourdough-bread', name: 'Sourdough Bread', price: 6.99, image: '../images/Sourdough Bread.jpg' }
      ];
      
      // Clear container
      recommendedProducts.innerHTML = '';
      
      // Add recommended products
      recommendedItems.forEach(product => {
        const productEl = document.createElement('div');
        productEl.className = 'bg-white rounded-lg shadow-md overflow-hidden';
        productEl.innerHTML = `
          <div class="h-40 bg-gray-200 relative">
            ${product.image ? 
              `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">` : 
              `<div class="w-full h-full flex items-center justify-center">
                <i class="fas fa-cookie-bite text-gray-400 text-4xl"></i>
              </div>`
            }
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-800 mb-2">${product.name}</h3>
            <div class="flex justify-between items-center">
              <span class="text-red-500 font-bold">$${product.price.toFixed(2)}</span>
              <button class="add-to-cart bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                      data-id="${product.id}" 
                      data-name="${product.name}" 
                      data-price="${product.price}"
                      ${product.image ? `data-image="${product.image}"` : ''}>
                Add
              </button>
            </div>
          </div>
        `;
        
        recommendedProducts.appendChild(productEl);
      });
  
      // Add event listeners to the "Add to Cart" buttons
      const addButtons = recommendedProducts.querySelectorAll('.add-to-cart');
      addButtons.forEach(button => {
        button.addEventListener('click', function() {
          const productId = this.getAttribute('data-id');
          const productName = this.getAttribute('data-name');
          const productPrice = parseFloat(this.getAttribute('data-price'));
          const productImage = this.getAttribute('data-image') || '';
          
          // Add item to cart
          const newItem = {
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
          };
          
          // Check if already in cart
          const existingItemIndex = cart.findIndex(item => item.id === productId);
          if (existingItemIndex !== -1) {
            // Increase quantity if already in cart
            cart[existingItemIndex].quantity += 1;
          } else {
            // Add new item
            cart.push(newItem);
          }
          
          // Save and render cart
          saveCart();
          renderCart();
          
          // Show notification
          showNotification(`${productName} added to cart!`, 'success');
        });
      });
    }
  
    // Initialize the cart page
    init();
  });