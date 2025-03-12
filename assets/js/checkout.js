/**
 * Djini's Bakehouse - Checkout Page JavaScript
 * Handles checkout functionality, order processing, and form validation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Constants
  const TAX_RATE = 0.08; // 8% tax rate
  const STANDARD_SHIPPING = 5.99;
  const EXPRESS_SHIPPING = 9.99;
  const FREE_SHIPPING_THRESHOLD = 50.00;

  // DOM Elements - Form sections
  const checkoutForm = document.getElementById('checkout-form');
  const creditCardDetails = document.getElementById('credit-card-details');
  const paypalDetails = document.getElementById('paypal-details');
  const cashDetails = document.getElementById('cash-details');
  
  // DOM Elements - Payment options
  const creditCardOption = document.getElementById('credit-card');
  const paypalOption = document.getElementById('paypal');
  const cashOption = document.getElementById('cash');
  
  // DOM Elements - Delivery options
  const standardDeliveryOption = document.getElementById('standard-delivery');
  const expressDeliveryOption = document.getElementById('express-delivery');
  const pickupOption = document.getElementById('pickup');
  
  // DOM Elements - Order summary
  const checkoutSummary = document.getElementById('checkout-summary');
  const checkoutTotal = document.getElementById('checkout-total');
  
  // Order data
  let cart = [];
  let orderSummary = {
    subtotal: 0,
    discount: 0,
    shipping: STANDARD_SHIPPING,
    tax: 0,
    total: 0
  };

  /**
   * Initialize checkout page
   */
  function init() {
    loadCart();
    populateOrderSummary();
    setupEventListeners();
    prefillFormWithUserData();
  }

  /**
   * Load cart from localStorage
   */
  function loadCart() {
    try {
      cart = JSON.parse(localStorage.getItem('djinisCart')) || [];
      
      // Redirect to cart page if cart is empty
      if (cart.length === 0) {
        window.location.href = 'cart.html';
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      cart = [];
    }
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Payment method selection
    if (creditCardOption) {
      creditCardOption.addEventListener('change', togglePaymentMethods);
    }
    if (paypalOption) {
      paypalOption.addEventListener('change', togglePaymentMethods);
    }
    if (cashOption) {
      cashOption.addEventListener('change', togglePaymentMethods);
    }

    // Delivery option selection
    if (standardDeliveryOption) {
      standardDeliveryOption.addEventListener('change', updateShippingCost);
    }
    if (expressDeliveryOption) {
      expressDeliveryOption.addEventListener('change', updateShippingCost);
    }
    if (pickupOption) {
      pickupOption.addEventListener('change', updateShippingCost);
    }

    // Form submission
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleCheckoutSubmission);
    }

    // Credit card formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', formatCardNumber);
    }

    // Expiry date formatting
    const expiryDateInput = document.getElementById('expiry-date');
    if (expiryDateInput) {
      expiryDateInput.addEventListener('input', formatExpiryDate);
    }
  }

  /**
   * Toggle payment method details based on selection
   */
  function togglePaymentMethods() {
    if (creditCardDetails && paypalDetails && cashDetails) {
      // Hide all payment details initially
      creditCardDetails.classList.add('hidden');
      paypalDetails.classList.add('hidden');
      cashDetails.classList.add('hidden');

      // Show selected payment details
      if (creditCardOption && creditCardOption.checked) {
        creditCardDetails.classList.remove('hidden');
      } else if (paypalOption && paypalOption.checked) {
        paypalDetails.classList.remove('hidden');
      } else if (cashOption && cashOption.checked) {
        cashDetails.classList.remove('hidden');
      }
    }
  }

  /**
   * Update shipping cost based on selected delivery option
   */
  function updateShippingCost() {
    if (standardDeliveryOption && standardDeliveryOption.checked) {
      orderSummary.shipping = STANDARD_SHIPPING;
    } else if (expressDeliveryOption && expressDeliveryOption.checked) {
      orderSummary.shipping = EXPRESS_SHIPPING;
    } else if (pickupOption && pickupOption.checked) {
      orderSummary.shipping = 0;
    }

    // Check for free shipping threshold
    if (orderSummary.subtotal >= FREE_SHIPPING_THRESHOLD && orderSummary.shipping !== 0) {
      const freeShippingNote = document.createElement('div');
      freeShippingNote.className = 'text-green-600 text-sm mt-1';
      freeShippingNote.innerHTML = '<i class="fas fa-tag mr-1"></i>Free shipping applied (orders over $' + FREE_SHIPPING_THRESHOLD.toFixed(2) + ')';
      
      // Add note after delivery options
      const deliveryOptions = document.getElementById('delivery-options');
      if (deliveryOptions && !document.querySelector('.text-green-600.text-sm.mt-1')) {
        deliveryOptions.appendChild(freeShippingNote);
      }
      
      orderSummary.shipping = 0;
    }

    // Update order summary with new shipping cost
    updateOrderSummaryDisplay();
  }

  /**
   * Populate order summary with cart items and totals
   */
  function populateOrderSummary() {
    if (!checkoutSummary) return;

    // Clear existing content
    checkoutSummary.innerHTML = '';

    // Calculate subtotal
    orderSummary.subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Get applied coupon if any
    const coupon = getAppliedCoupon();
    orderSummary.discount = 0;
    let freeShipping = false;

    if (coupon) {
      if (coupon.type === 'percentage') {
        orderSummary.discount = orderSummary.subtotal * (coupon.value / 100);
      } else if (coupon.type === 'fixed') {
        orderSummary.discount = Math.min(coupon.value, orderSummary.subtotal);
      } else if (coupon.type === 'shipping' && coupon.value === 'free') {
        freeShipping = true;
        orderSummary.shipping = 0;
      }
    }

    // Check for free shipping threshold
    if (orderSummary.subtotal >= FREE_SHIPPING_THRESHOLD || freeShipping) {
      orderSummary.shipping = 0;
    } else {
      // Set default shipping method (standard)
      orderSummary.shipping = STANDARD_SHIPPING;
    }

    // Calculate tax (on subtotal after discounts)
    orderSummary.tax = (orderSummary.subtotal - orderSummary.discount) * TAX_RATE;

    // Calculate total
    orderSummary.total = orderSummary.subtotal - orderSummary.discount + orderSummary.shipping + orderSummary.tax;

    // Add each item to summary
    cart.forEach(item => {
      const itemTotal = (item.price * item.quantity).toFixed(2);

      const itemElement = document.createElement('div');
      itemElement.className = 'flex justify-between py-2';
      itemElement.innerHTML = `
        <span>${item.name} × ${item.quantity}</span>
        <span>$${itemTotal}</span>
      `;

      checkoutSummary.appendChild(itemElement);
    });

    // Add summary details
    const summaryDetails = document.createElement('div');
    summaryDetails.className = 'space-y-2 mt-4 pt-4 border-t';
    
    // Build summary HTML
    let summaryHTML = `
      <div class="flex justify-between">
        <span>Subtotal</span>
        <span>$${orderSummary.subtotal.toFixed(2)}</span>
      </div>
    `;
    
    // Add discount if any
    if (orderSummary.discount > 0) {
      summaryHTML += `
        <div class="flex justify-between text-green-600">
          <span>Discount</span>
          <span>-$${orderSummary.discount.toFixed(2)}</span>
        </div>
      `;
    }
    
    // Add shipping
    summaryHTML += `
      <div class="flex justify-between">
        <span>Shipping</span>
        <span>${orderSummary.shipping === 0 ? 'Free' : '$' + orderSummary.shipping.toFixed(2)}</span>
      </div>
    `;
    
    // Add tax
    summaryHTML += `
      <div class="flex justify-between">
        <span>Tax (${(TAX_RATE * 100).toFixed(0)}%)</span>
        <span>$${orderSummary.tax.toFixed(2)}</span>
      </div>
    `;
    
    // Set HTML content
    summaryDetails.innerHTML = summaryHTML;
    checkoutSummary.appendChild(summaryDetails);
    
    // Update total display
    updateOrderSummaryDisplay();
  }

  /**
   * Update order summary display with calculated totals
   */
  function updateOrderSummaryDisplay() {
    if (checkoutTotal) {
      // Recalculate total with current shipping and tax
      orderSummary.tax = (orderSummary.subtotal - orderSummary.discount) * TAX_RATE;
      orderSummary.total = orderSummary.subtotal - orderSummary.discount + orderSummary.shipping + orderSummary.tax;
      
      // Update display
      checkoutTotal.textContent = orderSummary.total.toFixed(2);
    }
  }

  /**
   * Get the applied coupon from localStorage
   * @returns {Object|null} The coupon object or null if none applied
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
   * Prefill form with saved user data if available
   */
  function prefillFormWithUserData() {
    // Try to get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('djinisUserProfile'));
    
    if (userData) {
      // Fill in personal information fields
      if (document.getElementById('first-name')) {
        document.getElementById('first-name').value = userData.firstName || '';
      }
      if (document.getElementById('last-name')) {
        document.getElementById('last-name').value = userData.lastName || '';
      }
      if (document.getElementById('email')) {
        document.getElementById('email').value = userData.email || '';
      }
      if (document.getElementById('phone')) {
        document.getElementById('phone').value = userData.phone || '';
      }
      
      // Fill in address fields if saved
      if (userData.address) {
        if (document.getElementById('address')) {
          document.getElementById('address').value = userData.address.street || '';
        }
        if (document.getElementById('apartment')) {
          document.getElementById('apartment').value = userData.address.apartment || '';
        }
        if (document.getElementById('city')) {
          document.getElementById('city').value = userData.address.city || '';
        }
        if (document.getElementById('state')) {
          document.getElementById('state').value = userData.address.state || '';
        }
        if (document.getElementById('zipcode')) {
          document.getElementById('zipcode').value = userData.address.zipcode || '';
        }
      }
    }
  }

  /**
   * Format credit card number with spaces
   * @param {Event} e - Input event
   */
  function formatCardNumber(e) {
    let input = e.target;
    
    // Remove non-digits
    let value = input.value.replace(/\D/g, '');
    
    // Add spaces after every 4 digits
    if (value.length > 0) {
      value = value.match(/.{1,4}/g).join(' ');
    }
    
    // Update the input value
    input.value = value;
  }

  /**
   * Format expiry date as MM/YY
   * @param {Event} e - Input event
   */
  function formatExpiryDate(e) {
    let input = e.target;
    
    // Remove non-digits
    let value = input.value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    // Update the input value
    input.value = value;
  }

  /**
   * Handle checkout form submission
   * @param {Event} e - Submit event
   */
  function handleCheckoutSubmission(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateCheckoutForm()) {
      return;
    }
    
    // Collect form data
    const formData = collectFormData();
    
    // Process order
    processOrder(formData);
  }

  /**
   * Validate checkout form
   * @returns {boolean} True if valid, false otherwise
   */
  function validateCheckoutForm() {
    // Get required fields
    const requiredFields = document.querySelectorAll('#checkout-form [required]');
    let isValid = true;
    
    // Check each required field
    requiredFields.forEach(field => {
      // Remove any existing error messages
      const existingError = field.parentElement.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Reset field styling
      field.classList.remove('border-red-500');
      
      // Validate field
      if (!field.value.trim()) {
        isValid = false;
        
        // Add error styling
        field.classList.add('border-red-500');
        
        // Add error message
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error-message text-red-500 text-sm mt-1';
        errorMessage.textContent = 'This field is required';
        field.parentElement.appendChild(errorMessage);
      }
    });
    
    // Credit card specific validations
    if (creditCardOption && creditCardOption.checked) {
      // Card number validation (16 digits)
      const cardNumber = document.getElementById('card-number');
      if (cardNumber && cardNumber.value.replace(/\D/g, '').length !== 16) {
        isValid = false;
        cardNumber.classList.add('border-red-500');
        
        // Add error message if not exists
        if (!cardNumber.parentElement.querySelector('.error-message')) {
          const errorMessage = document.createElement('p');
          errorMessage.className = 'error-message text-red-500 text-sm mt-1';
          errorMessage.textContent = 'Please enter a valid 16-digit card number';
          cardNumber.parentElement.appendChild(errorMessage);
        }
      }
      
      // Expiry date validation (MM/YY format)
      const expiryDate = document.getElementById('expiry-date');
      if (expiryDate) {
        const expiryValue = expiryDate.value;
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        
        if (!expiryRegex.test(expiryValue)) {
          isValid = false;
          expiryDate.classList.add('border-red-500');
          
          // Add error message if not exists
          if (!expiryDate.parentElement.querySelector('.error-message')) {
            const errorMessage = document.createElement('p');
            errorMessage.className = 'error-message text-red-500 text-sm mt-1';
            errorMessage.textContent = 'Please enter a valid expiry date (MM/YY)';
            expiryDate.parentElement.appendChild(errorMessage);
          }
        } else {
          // Check if card is expired
          const [month, year] = expiryValue.split('/');
          const expiryMonth = parseInt(month, 10);
          const expiryYear = parseInt('20' + year, 10);
          
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
          const currentYear = now.getFullYear();
          
          if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
            isValid = false;
            expiryDate.classList.add('border-red-500');
            
            // Add error message if not exists
            if (!expiryDate.parentElement.querySelector('.error-message')) {
              const errorMessage = document.createElement('p');
              errorMessage.className = 'error-message text-red-500 text-sm mt-1';
              errorMessage.textContent = 'Card is expired';
              expiryDate.parentElement.appendChild(errorMessage);
            }
          }
        }
      }
      
      // CVV validation (3-4 digits)
      const cvv = document.getElementById('cvv');
      if (cvv && (cvv.value.length < 3 || cvv.value.length > 4 || !/^\d+$/.test(cvv.value))) {
        isValid = false;
        cvv.classList.add('border-red-500');
        
        // Add error message if not exists
        if (!cvv.parentElement.querySelector('.error-message')) {
          const errorMessage = document.createElement('p');
          errorMessage.className = 'error-message text-red-500 text-sm mt-1';
          errorMessage.textContent = 'Please enter a valid CVV (3-4 digits)';
          cvv.parentElement.appendChild(errorMessage);
        }
      }
    }
    
    return isValid;
  }

  /**
   * Collect form data into an object
   * @returns {Object} Form data object
   */
  function collectFormData() {
    const formData = {
      customer: {
        firstName: document.getElementById('first-name')?.value || '',
        lastName: document.getElementById('last-name')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || ''
      },
      delivery: {
        address: document.getElementById('address')?.value || '',
        apartment: document.getElementById('apartment')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        zipcode: document.getElementById('zipcode')?.value || '',
        method: getSelectedDeliveryMethod()
      },
      payment: {
        method: getSelectedPaymentMethod(),
        cardDetails: creditCardOption && creditCardOption.checked ? {
          cardNumber: document.getElementById('card-number')?.value || '',
          cardName: document.getElementById('card-name')?.value || '',
          expiryDate: document.getElementById('expiry-date')?.value || '',
          cvv: document.getElementById('cvv')?.value || ''
        } : null
      },
      notes: document.getElementById('order-notes')?.value || '',
      cart: cart,
      summary: orderSummary,
      orderDate: new Date().toISOString()
    };
    
    return formData;
  }

  /**
   * Get the selected delivery method
   * @returns {string} Delivery method
   */
  function getSelectedDeliveryMethod() {
    if (standardDeliveryOption && standardDeliveryOption.checked) {
      return 'standard';
    } else if (expressDeliveryOption && expressDeliveryOption.checked) {
      return 'express';
    } else if (pickupOption && pickupOption.checked) {
      return 'pickup';
    }
    return 'standard'; // Default
  }

  /**
   * Get the selected payment method
   * @returns {string} Payment method
   */
  function getSelectedPaymentMethod() {
    if (creditCardOption && creditCardOption.checked) {
      return 'credit-card';
    } else if (paypalOption && paypalOption.checked) {
      return 'paypal';
    } else if (cashOption && cashOption.checked) {
      return 'cash';
    }
    return 'credit-card'; // Default
  }

  /**
   * Process the order
   * @param {Object} formData - Collected form data
   */
  function processOrder(formData) {
    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      const originalText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
      
      // Simulate order processing
      setTimeout(() => {
        // Generate order number
        const orderNumber = generateOrderNumber();
        
        // Save order to localStorage
        saveOrder(orderNumber, formData);
        
        // Clear cart
        clearCart();
        
        // Redirect to confirmation page
        window.location.href = `order-confirmation.html?order=${orderNumber}`;
      }, 2000);
    }
  }

  /**
   * Generate a random order number
   * @returns {string} Order number
   */
  function generateOrderNumber() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DJB-${timestamp}${random}`;
  }

  /**
   * Save order to localStorage
   * @param {string} orderNumber - Generated order number
   * @param {Object} formData - Order data
   */
  function saveOrder(orderNumber, formData) {
    try {
      // Get existing orders
      const orders = JSON.parse(localStorage.getItem('djinisOrders')) || [];
      
      // Add new order
      orders.push({
        orderId: orderNumber,
        ...formData,
        status: 'Placed',
        estimatedDelivery: calculateEstimatedDelivery(formData.delivery.method)
      });
      
      // Save back to localStorage
      localStorage.setItem('djinisOrders', JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  /**
   * Calculate estimated delivery time based on delivery method
   * @param {string} deliveryMethod - Selected delivery method
   * @returns {string} Estimated delivery time
   */
  function calculateEstimatedDelivery(deliveryMethod) {
    const now = new Date();
    let estimatedTime;
    
    switch (deliveryMethod) {
      case 'express':
        // Add 1 hour
        estimatedTime = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'standard':
        // Add 2-3 hours (use 2.5)
        estimatedTime = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
        break;
      case 'pickup':
        // Add 30 minutes
        estimatedTime = new Date(now.getTime() + 30 * 60 * 1000);
        break;
      default:
        // Default to 2 hours
        estimatedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
    
    // Format time nicely
    const options = { 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    };
    
    return `Today, by ${estimatedTime.toLocaleTimeString('en-US', options)}`;
  }

  /**
   * Clear cart after successful order
   */
  function clearCart() {
    localStorage.removeItem('djinisCart');
    localStorage.removeItem('djinisCoupon');
  }

  // Initialize the checkout page
  init();
});