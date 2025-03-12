/**
 * Djini's Bakehouse - Checkout Process Handler
 * Manages the checkout flow, form validation, and order processing
 */

class CheckoutManager {
    constructor() {
      this.cart = JSON.parse(localStorage.getItem('djinisCart')) || [];
      this.coupon = JSON.parse(localStorage.getItem('djinisCoupon')) || null;
      this.addresses = JSON.parse(localStorage.getItem('djinisAddresses')) || [];
      this.paymentMethods = JSON.parse(localStorage.getItem('djinisPaymentMethods')) || [];
      this.deliveryMethod = 'standard';
      this.paymentMethod = 'credit-card';
      this.orderData = {};
      this.init();
    }
  
    /**
     * Initialize checkout manager
     */
    init() {
      if (this.cart.length === 0) {
        // Redirect to cart page if cart is empty
        if (window.location.pathname.includes('checkout.html')) {
          window.location.href = 'cart.html';
          return;
        }
      }
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Load saved addresses and payment methods
      this.loadSavedAddresses();
      this.loadSavedPaymentMethods();
      
      // Render order summary
      this.renderOrderSummary();
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Delivery method radio buttons
      const deliveryOptions = document.querySelectorAll('[name="delivery-method"]');
      deliveryOptions.forEach(option => {
        option.addEventListener('change', () => {
          this.deliveryMethod = option.id;
          this.updateOrderSummary();
        });
      });
  
      // Payment method radio buttons
      const paymentOptions = document.querySelectorAll('[name="payment-method"]');
      paymentOptions.forEach(option => {
        option.addEventListener('change', () => {
          // Hide all payment details
          document.querySelectorAll('.payment-details').forEach(details => {
            details.classList.add('hidden');
          });
          
          // Show selected payment details
          const selectedPaymentDetails = document.getElementById(`${option.id}-details`);
          if (selectedPaymentDetails) {
            selectedPaymentDetails.classList.remove('hidden');
          }
          
          // Update visual selection
          document.querySelectorAll('.payment-method-option').forEach(opt => {
            opt.classList.remove('selected');
          });
          option.closest('.payment-method-option').classList.add('selected');
  
          // Update payment method
          this.paymentMethod = option.id;
        });
      });
  
      // Saved address selection
      const savedAddressSelect = document.getElementById('saved-address');
      if (savedAddressSelect) {
        savedAddressSelect.addEventListener('change', () => {
          const addressId = savedAddressSelect.value;
          
          if (addressId === 'new') {
            // Clear form for new address
            this.clearAddressForm();
            document.getElementById('save-address-container').classList.remove('hidden');
          } else {
            // Fill form with selected address
            this.fillAddressForm(addressId);
            document.getElementById('save-address-container').classList.add('hidden');
          }
        });
      }
  
      // Saved payment method selection
      const savedPaymentSelect = document.getElementById('saved-payment');
      if (savedPaymentSelect) {
        savedPaymentSelect.addEventListener('change', () => {
          const paymentId = savedPaymentSelect.value;
          
          if (paymentId === 'new') {
            // Clear form for new payment method
            this.clearPaymentForm();
            document.getElementById('save-payment-container').classList.remove('hidden');
          } else {
            // Fill form with selected payment method
            this.fillPaymentForm(paymentId);
            document.getElementById('save-payment-container').classList.add('hidden');
          }
        });
      }
  
      // Checkout form submission
      const checkoutForm = document.getElementById('checkout-form');
      if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.processCheckout();
        });
      }
  
      // Form field validation
      const formFields = document.querySelectorAll('#checkout-form input[required], #checkout-form select[required]');
      formFields.forEach(field => {
        field.addEventListener('blur', () => {
          this.validateField(field);
        });
      });
  
      // Card number formatting
      const cardNumberInput = document.getElementById('card-number');
      if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 16) {
            value = value.slice(0, 16);
          }
          
          // Format with spaces every 4 digits
          const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
          e.target.value = formattedValue;
        });
      }
  
      // Expiry date formatting
      const expiryDateInput = document.getElementById('expiry-date');
      if (expiryDateInput) {
        expiryDateInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 4) {
            value = value.slice(0, 4);
          }
          
          // Format as MM/YY
          if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
          }
          
          e.target.value = value;
        });
      }
  
      // CVV input validation (numbers only)
      const cvvInput = document.getElementById('cvv');
      if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 4) {
            value = value.slice(0, 4);
          }
          e.target.value = value;
        });
      }
    }
  
    /**
     * Load saved addresses
     */
    loadSavedAddresses() {
      const savedAddressSelect = document.getElementById('saved-address');
      if (!savedAddressSelect) return;
  
      // Clear existing options
      while (savedAddressSelect.options.length > 1) {
        savedAddressSelect.remove(1);
      }
  
      // Add saved addresses
      this.addresses.forEach(address => {
        const option = document.createElement('option');
        option.value = address.id;
        option.textContent = address.name;
        savedAddressSelect.appendChild(option);
      });
    }
  
    /**
     * Load saved payment methods
     */
    loadSavedPaymentMethods() {
      const savedPaymentSelect = document.getElementById('saved-payment');
      if (!savedPaymentSelect) return;
  
      // Clear existing options
      while (savedPaymentSelect.options.length > 1) {
        savedPaymentSelect.remove(1);
      }
  
      // Add saved payment methods
      this.paymentMethods.forEach(payment => {
        const option = document.createElement('option');
        option.value = payment.id;
        option.textContent = payment.name;
        savedPaymentSelect.appendChild(option);
      });
    }
  
    /**
     * Fill address form with saved address
     * @param {string} addressId - Address ID
     */
    fillAddressForm(addressId) {
      const address = this.addresses.find(addr => addr.id === addressId);
      if (!address) return;
  
      // Fill address fields
      document.getElementById('first-name').value = address.firstName;
      document.getElementById('last-name').value = address.lastName;
      document.getElementById('email').value = address.email;
      document.getElementById('phone').value = address.phone;
      document.getElementById('address').value = address.streetAddress;
      document.getElementById('apartment').value = address.apartment || '';
      document.getElementById('city').value = address.city;
      document.getElementById('state').value = address.state;
      document.getElementById('zipcode').value = address.zipCode;
    }
  
    /**
     * Clear address form
     */
    clearAddressForm() {
      document.getElementById('first-name').value = '';
      document.getElementById('last-name').value = '';
      document.getElementById('email').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('address').value = '';
      document.getElementById('apartment').value = '';
      document.getElementById('city').value = '';
      document.getElementById('state').value = '';
      document.getElementById('zipcode').value = '';
    }
  
    /**
     * Fill payment form with saved payment method
     * @param {string} paymentId - Payment method ID
     */
    fillPaymentForm(paymentId) {
      const payment = this.paymentMethods.find(pay => pay.id === paymentId);
      if (!payment) return;
  
      // Fill payment fields
      document.getElementById('card-name').value = payment.cardName;
      document.getElementById('card-number').value = payment.cardNumber;
      document.getElementById('expiry-date').value = payment.expiryDate;
      document.getElementById('cvv').value = '***'; // Don't fill actual CVV for security
    }
  
    /**
     * Clear payment form
     */
    clearPaymentForm() {
      document.getElementById('card-name').value = '';
      document.getElementById('card-number').value = '';
      document.getElementById('expiry-date').value = '';
      document.getElementById('cvv').value = '';
    }
  
    /**
     * Render order summary
     */
    renderOrderSummary() {
      const summaryContainer = document.getElementById('checkout-summary');
      const totalElement = document.getElementById('checkout-total');
      if (!summaryContainer || !totalElement) return;
  
      // Clear summary container
      summaryContainer.innerHTML = '';
  
      // Add each item to the summary
      this.cart.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between py-2';
        itemElement.innerHTML = `
          <span>${item.name} × ${item.quantity}</span>
          <span>${itemTotal}</span>
        `;
        
        summaryContainer.appendChild(itemElement);
      });
  
      // Update order summary
      this.updateOrderSummary();
    }
  
    /**
     * Update order summary with calculations
     */
    updateOrderSummary() {
      const summaryContainer = document.getElementById('checkout-summary');
      const totalElement = document.getElementById('checkout-total');
      if (!summaryContainer || !totalElement) return;
  
      // Calculate subtotal
      const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Calculate discount
      const discount = this.calculateDiscount(subtotal);
      
      // Calculate shipping
      const shipping = this.calculateShipping();
      
      // Calculate tax
      const tax = (subtotal - discount) * 0.1; // 10% tax
      
      // Calculate total
      const total = subtotal - discount + shipping + tax;
  
      // Add divider
      const divider = document.createElement('div');
      divider.className = 'border-t my-3';
      summaryContainer.appendChild(divider);
  
      // Add subtotal
      const subtotalElement = document.createElement('div');
      subtotalElement.className = 'flex justify-between py-2';
      subtotalElement.innerHTML = `
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      `;
      summaryContainer.appendChild(subtotalElement);
  
      // Add discount if applicable
      if (discount > 0) {
        const discountElement = document.createElement('div');
        discountElement.className = 'flex justify-between py-2 text-green-600';
        discountElement.innerHTML = `
          <span>Discount</span>
          <span>-${discount.toFixed(2)}</span>
        `;
        summaryContainer.appendChild(discountElement);
      }
  
      // Add shipping
      const shippingElement = document.createElement('div');
      shippingElement.className = 'flex justify-between py-2';
      shippingElement.innerHTML = `
        <span>Shipping (${this.formatDeliveryMethod()})</span>
        <span>${shipping === 0 ? 'Free' : shipping.toFixed(2)}</span>
      `;
      summaryContainer.appendChild(shippingElement);
  
      // Add tax
      const taxElement = document.createElement('div');
      taxElement.className = 'flex justify-between py-2';
      taxElement.innerHTML = `
        <span>Tax (10%)</span>
        <span>${tax.toFixed(2)}</span>
      `;
      summaryContainer.appendChild(taxElement);
  
      // Add total
      totalElement.textContent = total.toFixed(2);
  
      // Show applied coupon if any
      if (this.coupon) {
        const couponElement = document.createElement('div');
        couponElement.className = 'mt-4 pt-3 border-t border-dashed';
        
        let discountText = '';
        if (this.coupon.type === 'percentage') {
          discountText = `${this.coupon.value}% off`;
        } else if (this.coupon.type === 'fixed') {
          discountText = `${this.coupon.value} off`;
        } else if (this.coupon.type === 'shipping') {
          discountText = 'Free shipping';
        }
        
        couponElement.innerHTML = `
          <div class="flex justify-between items-center text-sm text-green-600">
            <div class="flex items-center">
              <i class="fas fa-tag mr-2"></i>
              <span>Coupon applied: ${this.coupon.code}</span>
            </div>
            <span>${discountText}</span>
          </div>
        `;
        
        summaryContainer.appendChild(couponElement);
      }
    }
  
    /**
     * Calculate discount based on applied coupon
     * @param {number} subtotal - Order subtotal
     * @returns {number} Discount amount
     */
    calculateDiscount(subtotal) {
      if (!this.coupon) return 0;
      
      if (this.coupon.type === 'percentage') {
        return subtotal * (this.coupon.value / 100);
      } else if (this.coupon.type === 'fixed') {
        return Math.min(subtotal, this.coupon.value);
      }
      
      return 0;
    }
  
    /**
     * Calculate shipping cost based on delivery method
     * @returns {number} Shipping cost
     */
    calculateShipping() {
      // Check if free shipping from coupon
      if (this.coupon && this.coupon.type === 'shipping') {
        return 0;
      }
      
      // Calculate based on delivery method
      switch (this.deliveryMethod) {
        case 'express-delivery':
          return 9.99;
        case 'pickup':
          return 0;
        default: // standard-delivery
          // Free shipping for orders over $50
          const subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
          return subtotal >= 50 ? 0 : 5.99;
      }
    }
  
    /**
     * Format delivery method for display
     * @returns {string} Formatted delivery method
     */
    formatDeliveryMethod() {
      switch (this.deliveryMethod) {
        case 'express-delivery':
          return 'Express (1 hour)';
        case 'pickup':
          return 'Store Pickup';
        default: // standard-delivery
          return 'Standard (2-3 hours)';
      }
    }
  
    /**
     * Validate form field
     * @param {HTMLElement} field - Form field to validate
     * @returns {boolean} True if valid
     */
    validateField(field) {
      const value = field.value.trim();
      const fieldName = field.id;
      const errorContainer = field.parentElement.querySelector('.error-message') || 
                            this.createErrorContainer(field);
      
      // Check required fields
      if (field.hasAttribute('required') && !value) {
        errorContainer.textContent = 'This field is required';
        errorContainer.classList.remove('hidden');
        field.classList.add('border-red-500');
        return false;
      }
      
      // Validate email
      if (fieldName === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          errorContainer.textContent = 'Please enter a valid email address';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Validate phone
      if (fieldName === 'phone' && value) {
        const phonePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (!phonePattern.test(value)) {
          errorContainer.textContent = 'Please enter a valid phone number';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Validate zipcode
      if (fieldName === 'zipcode' && value) {
        const zipPattern = /^\d{5}(-\d{4})?$/;
        if (!zipPattern.test(value)) {
          errorContainer.textContent = 'Please enter a valid ZIP code';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Validate card number
      if (fieldName === 'card-number' && value) {
        const cardNumber = value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 16) {
          errorContainer.textContent = 'Please enter a valid card number';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Validate expiry date
      if (fieldName === 'expiry-date' && value) {
        const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryPattern.test(value)) {
          errorContainer.textContent = 'Please enter a valid expiry date (MM/YY)';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
        
        // Check if card is expired
        const [month, year] = value.split('/');
        const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
        const today = new Date();
        
        if (expiry < today) {
          errorContainer.textContent = 'This card has expired';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Validate CVV
      if (fieldName === 'cvv' && value) {
        const cvvPattern = /^\d{3,4}$/;
        if (!cvvPattern.test(value)) {
          errorContainer.textContent = 'Please enter a valid CVV';
          errorContainer.classList.remove('hidden');
          field.classList.add('border-red-500');
          return false;
        }
      }
      
      // Field is valid
      errorContainer.classList.add('hidden');
      field.classList.remove('border-red-500');
      return true;
    }
  
    /**
     * Create error container for a field
     * @param {HTMLElement} field - The form field
     * @returns {HTMLElement} Error container element
     */
    createErrorContainer(field) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-message text-red-500 text-sm mt-1 hidden';
      field.parentElement.appendChild(errorContainer);
      return errorContainer;
    }
  
    /**
     * Validate entire form
     * @returns {boolean} True if entire form is valid
     */
    validateForm() {
      const formFields = document.querySelectorAll('#checkout-form input[required], #checkout-form select[required]');
      let isValid = true;
      
      formFields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });
      
      // Additional validation for payment method
      if (this.paymentMethod === 'credit-card') {
        const cardFields = [
          document.getElementById('card-number'),
          document.getElementById('card-name'),
          document.getElementById('expiry-date'),
          document.getElementById('cvv')
        ];
        
        cardFields.forEach(field => {
          if (field && !this.validateField(field)) {
            isValid = false;
          }
        });
      }
      
      return isValid;
    }
  
    /**
     * Process checkout
     */
    processCheckout() {
      // Validate form
      if (!this.validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector('.error-message:not(.hidden)');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // Get form data
      const formData = new FormData(document.getElementById('checkout-form'));
      const orderData = {};
      
      for (const [key, value] of formData.entries()) {
        orderData[key] = value;
      }
      
      // Add cart and payment info
      orderData.items = this.cart;
      orderData.subtotal = this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      orderData.discount = this.calculateDiscount(orderData.subtotal);
      orderData.shipping = this.calculateShipping();
      orderData.tax = (orderData.subtotal - orderData.discount) * 0.1;
      orderData.total = orderData.subtotal - orderData.discount + orderData.shipping + orderData.tax;
      orderData.coupon = this.coupon;
      orderData.paymentMethod = this.paymentMethod;
      orderData.deliveryMethod = this.deliveryMethod;
      orderData.orderDate = new Date().toISOString();
      orderData.orderId = this.generateOrderId();
      
      // Save order data
      this.orderData = orderData;
      
      // Save address if requested
      const saveAddress = document.getElementById('save-address');
      if (saveAddress && saveAddress.checked) {
        this.saveAddress();
      }
      
      // Save payment method if requested
      const savePayment = document.getElementById('save-payment');
      if (savePayment && savePayment.checked) {
        this.savePaymentMethod();
      }
      
      // Show loading spinner
      this.showLoadingState();
      
      // Process payment (simulated)
      setTimeout(() => {
        this.completeOrder();
      }, 2000);
    }
  
    /**
     * Show loading state during checkout
     */
    showLoadingState() {
      const submitButton = document.querySelector('#checkout-form button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML = '<div class="loading-spinner mx-auto"></div><span class="ml-2">Processing...</span>';
    }
  
    /**
     * Complete order
     */
    completeOrder() {
      // Save order to localStorage
      const orders = JSON.parse(localStorage.getItem('djinisOrders')) || [];
      orders.push(this.orderData);
      localStorage.setItem('djinisOrders', JSON.stringify(orders));
      
      // Clear cart
      localStorage.removeItem('djinisCart');
      localStorage.removeItem('djinisCoupon');
      
      // Save order ID for confirmation page
      localStorage.setItem('djinisLastOrder', JSON.stringify(this.orderData));
      
      // Redirect to confirmation page
      window.location.href = 'order-confirmation.html';
    }
  
    /**
     * Save address to localStorage
     */
    saveAddress() {
      const addressName = prompt('Enter a name for this address (e.g., "Home", "Work"):', 'Home');
      if (!addressName) return;
      
      const newAddress = {
        id: 'address_' + Date.now(),
        name: addressName,
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        streetAddress: document.getElementById('address').value,
        apartment: document.getElementById('apartment').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipcode').value,
        createdAt: new Date().toISOString()
      };
      
      this.addresses.push(newAddress);
      localStorage.setItem('djinisAddresses', JSON.stringify(this.addresses));
    }
  
    /**
     * Save payment method to localStorage
     */
    savePaymentMethod() {
      const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
      const last4 = cardNumber.slice(-4);
      
      // Determine card type
      let cardType = 'Credit Card';
      if (/^4/.test(cardNumber)) {
        cardType = 'Visa';
      } else if (/^5[1-5]/.test(cardNumber)) {
        cardType = 'Mastercard';
      } else if (/^3[47]/.test(cardNumber)) {
        cardType = 'American Express';
      } else if (/^6(?:011|5)/.test(cardNumber)) {
        cardType = 'Discover';
      }
      
      const paymentName = prompt('Enter a name for this payment method:', `${cardType} ending in ${last4}`);
      if (!paymentName) return;
      
      const newPayment = {
        id: 'payment_' + Date.now(),
        name: paymentName,
        cardName: document.getElementById('card-name').value,
        cardNumber: `**** **** **** ${last4}`,
        cardType,
        expiryDate: document.getElementById('expiry-date').value,
        createdAt: new Date().toISOString()
      };
      
      this.paymentMethods.push(newPayment);
      localStorage.setItem('djinisPaymentMethods', JSON.stringify(this.paymentMethods));
    }
  
    /**
     * Generate a unique order ID
     * @returns {string} Order ID
     */
    generateOrderId() {
      const timestamp = new Date().getTime().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `DJB-${timestamp}-${random}`;
    }
  }
  
  // Initialize checkout manager on DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.djinisCheckout = new CheckoutManager();
  });