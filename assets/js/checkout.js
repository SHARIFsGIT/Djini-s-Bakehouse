/**
 * Djini's Bakehouse - Checkout Page JavaScript
 * Enhanced with additional features for a more complete checkout experience
 *
 * Features:
 * - Real-time form validation
 * - Address auto-complete integration
 * - Saved addresses & payment methods
 * - Order scheduling
 * - Gift options
 * - Promo code validation
 * - Loyalty points integration
 * - Inventory checking
 * - Enhanced payment processing
 */

document.addEventListener("DOMContentLoaded", function () {
  initializeToggleableElements();
  // Constants
  const TAX_RATE = 0.08; // 8% tax rate
  const STANDARD_SHIPPING = 5.99;
  const EXPRESS_SHIPPING = 9.99;
  const FREE_SHIPPING_THRESHOLD = 50.0;
  const GIFT_WRAP_FEE = 3.99;
  const LOYALTY_POINTS_RATE = 10; // $1 = 10 points
  const MIN_POINTS_REDEMPTION = 500; // Minimum points needed to redeem

  // DOM Elements - Form sections
  const checkoutForm = document.getElementById("checkout-form");
  const creditCardDetails = document.getElementById("credit-card-details");
  const paypalDetails = document.getElementById("paypal-details");
  const cashDetails = document.getElementById("cash-details");
  const savedAddressesContainer = document.getElementById("saved-addresses");
  const savedPaymentMethodsContainer = document.getElementById(
    "saved-payment-methods"
  );

  // DOM Elements - Payment options
  const creditCardOption = document.getElementById("credit-card");
  const paypalOption = document.getElementById("paypal");
  const cashOption = document.getElementById("cash");

  // DOM Elements - Delivery options
  const standardDeliveryOption = document.getElementById("standard-delivery");
  const expressDeliveryOption = document.getElementById("express-delivery");
  const pickupOption = document.getElementById("pickup");

  // DOM Elements - Order summary
  const checkoutSummary = document.getElementById("checkout-summary");
  const checkoutTotal = document.getElementById("checkout-total");
  const promoCodeInput = document.getElementById("promo-code");
  const applyPromoButton = document.getElementById("apply-promo");
  const loyaltyPointsContainer = document.getElementById(
    "loyalty-points-container"
  );
  const usePointsCheckbox = document.getElementById("use-loyalty-points");

  // DOM Elements - Additional options
  const giftWrapOption = document.getElementById("gift-wrap");
  const giftMessageContainer = document.getElementById(
    "gift-message-container"
  );
  const scheduleDeliveryCheckbox = document.getElementById("schedule-delivery");
  const deliveryDateContainer = document.getElementById(
    "delivery-date-container"
  );

  // Order data
  let cart = [];
  let orderSummary = {
    subtotal: 0,
    discount: 0,
    shipping: STANDARD_SHIPPING,
    tax: 0,
    giftWrap: 0,
    loyaltyDiscount: 0,
    total: 0,
  };

  // User data
  let userData = null;
  let loyaltyPoints = 0;
  let savedAddresses = [];
  let savedPaymentMethods = [];
  let appliedPromoCode = null;

  /**
   * Initialize checkout page
   */
  function init() {
    loadUserData();
    loadCart();
    populateOrderSummary();
    setupEventListeners();
    prefillFormWithUserData();
    initializeAddressAutocomplete();
    checkInventory();
    prefillShippingDate();
    displayEstimatedDeliveryTime();
  }

  /**
   * Load user data from localStorage or account system
   */
  function loadUserData() {
    try {
      userData = JSON.parse(localStorage.getItem("djinisUserProfile")) || null;

      if (userData) {
        // Load saved addresses
        savedAddresses = userData.savedAddresses || [];

        // Load saved payment methods
        savedPaymentMethods = userData.savedPaymentMethods || [];

        // Load loyalty points
        loyaltyPoints = userData.loyaltyPoints || 0;

        // Display saved addresses
        displaySavedAddresses();

        // Display saved payment methods
        displaySavedPaymentMethods();

        // Display loyalty points
        displayLoyaltyPoints();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  /**
   * Load cart from localStorage
   */
  function loadCart() {
    try {
      cart = JSON.parse(localStorage.getItem("djinisCart")) || [];

      // Redirect to cart page if cart is empty
      if (cart.length === 0) {
        window.location.href = "cart.html";
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      cart = [];
    }
  }

  /**
   * Check inventory levels for items in cart
   */
  function checkInventory() {
    // In a real implementation, this would make an API call
    // For demo purposes, we'll simulate inventory checking

    const outOfStockItems = [];
    const lowStockItems = [];

    // Simulate inventory check
    cart.forEach((item) => {
      // Generate a random inventory level for demonstration
      const inventoryLevel = Math.floor(Math.random() * 20);

      if (inventoryLevel === 0) {
        outOfStockItems.push(item);
      } else if (inventoryLevel < item.quantity) {
        lowStockItems.push({
          item: item,
          available: inventoryLevel,
        });
      }
    });

    // Display warnings for inventory issues
    if (outOfStockItems.length > 0 || lowStockItems.length > 0) {
      const inventoryAlert = document.createElement("div");
      inventoryAlert.className =
        "bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6";

      let alertHTML = '<div class="flex">';
      alertHTML +=
        '<div class="flex-shrink-0"><i class="fas fa-exclamation-triangle text-yellow-400"></i></div>';
      alertHTML += '<div class="ml-3">';
      alertHTML +=
        '<h3 class="text-sm font-medium text-yellow-800">Attention needed</h3>';
      alertHTML += '<div class="mt-2 text-sm text-yellow-700">';
      alertHTML += '<ul class="list-disc pl-5 space-y-1">';

      // Out of stock items
      outOfStockItems.forEach((item) => {
        alertHTML += `<li><strong>${item.name}</strong> is currently out of stock and has been removed from your cart.</li>`;
      });

      // Low stock items
      lowStockItems.forEach(({ item, available }) => {
        alertHTML += `<li>Only ${available} of <strong>${item.name}</strong> are available. Your quantity has been adjusted.</li>`;
      });

      alertHTML += "</ul></div></div></div>";
      inventoryAlert.innerHTML = alertHTML;

      // Add alert to page
      if (checkoutForm && checkoutForm.parentNode) {
        checkoutForm.parentNode.insertBefore(inventoryAlert, checkoutForm);
      }

      // Update cart with inventory adjustments
      if (outOfStockItems.length > 0) {
        cart = cart.filter(
          (item) => !outOfStockItems.some((outItem) => outItem.id === item.id)
        );
      }

      if (lowStockItems.length > 0) {
        cart = cart.map((item) => {
          const lowStockItem = lowStockItems.find(
            (lowItem) => lowItem.item.id === item.id
          );
          if (lowStockItem) {
            return { ...item, quantity: lowStockItem.available };
          }
          return item;
        });
      }

      // Update localStorage with adjusted cart
      localStorage.setItem("djinisCart", JSON.stringify(cart));

      // Recalculate order summary
      populateOrderSummary();
    }
  }

  function initializeToggleableElements() {
    // Helper function to toggle element visibility
    function toggleElementVisibility(elementId, show) {
      const element = document.getElementById(elementId);
      if (!element) return;

      if (show) {
        // When showing the element, apply the classes stored in data-display-class
        const displayClasses = element.getAttribute("data-display-class") || "";
        element.classList.remove("hidden");
        displayClasses.split(" ").forEach((cls) => {
          if (cls) element.classList.add(cls);
        });
      } else {
        // When hiding, remove all classes from data-display-class and add hidden
        const displayClasses = element.getAttribute("data-display-class") || "";
        displayClasses.split(" ").forEach((cls) => {
          if (cls) element.classList.remove(cls);
        });
        element.classList.add("hidden");
      }
    }

    // Schedule delivery toggle
    const scheduleDeliveryCheckbox =
      document.getElementById("schedule-delivery");
    if (scheduleDeliveryCheckbox) {
      scheduleDeliveryCheckbox.addEventListener("change", function () {
        toggleElementVisibility("delivery-date-container", this.checked);
      });
    }

    // Gift options toggle
    const giftOptionsToggle = document.getElementById("gift-options-toggle");
    if (giftOptionsToggle) {
      giftOptionsToggle.addEventListener("change", function () {
        toggleElementVisibility("gift-options-section", this.checked);

        // Also control the gift wrap row in order summary
        toggleElementVisibility("gift-wrap-row", this.checked);
      });
    }

    // Payment method toggles
    const paymentMethods = document.querySelectorAll(
      'input[name="payment-method"]'
    );
    paymentMethods.forEach((method) => {
      method.addEventListener("change", function () {
        // Hide all payment details sections
        document.querySelectorAll(".payment-details").forEach((details) => {
          const displayClasses =
            details.getAttribute("data-display-class") || "";
          displayClasses.split(" ").forEach((cls) => {
            if (cls) details.classList.remove(cls);
          });
          details.classList.add("hidden");
        });

        // Show the selected payment method details
        const selectedMethodDetails = document.getElementById(
          `${this.value}-details`
        );
        if (selectedMethodDetails) {
          toggleElementVisibility(selectedMethodDetails.id, true);
        }
      });
    });

    // Same as shipping address toggle
    const sameAsShipping = document.getElementById("same-as-shipping");
    if (sameAsShipping) {
      sameAsShipping.addEventListener("change", function () {
        toggleElementVisibility("billing-address-container", !this.checked);
      });
    }

    // Order protection checkbox
    const orderProtection = document.getElementById("add-protection");
    if (orderProtection) {
      orderProtection.addEventListener("change", function () {
        toggleElementVisibility("order-protection-row", this.checked);
      });
    }

    // Loyalty points usage
    const useLoyaltyPoints = document.getElementById("use-loyalty-points");
    if (useLoyaltyPoints) {
      useLoyaltyPoints.addEventListener("change", function () {
        toggleElementVisibility("loyalty-discount-row", this.checked);
      });
    }
  }

  /**
   * Apply the toggleElementVisibility function to the existing checkout.js
   * by overriding key functions that toggle visibility
   */
  function overrideToggleFunctions() {
    // If you have a global function like toggleScheduledDelivery, override it
    if (typeof window.toggleScheduledDelivery === "function") {
      const originalToggleFunc = window.toggleScheduledDelivery;
      window.toggleScheduledDelivery = function () {
        // Call original function
        originalToggleFunc.apply(this, arguments);

        // Use our new toggle functionality
        const scheduleDeliveryCheckbox =
          document.getElementById("schedule-delivery");
        if (scheduleDeliveryCheckbox) {
          toggleElementVisibility(
            "delivery-date-container",
            scheduleDeliveryCheckbox.checked
          );
        }
      };
    }

    // Same for other toggle functions
    if (typeof window.toggleBillingAddress === "function") {
      const originalToggleFunc = window.toggleBillingAddress;
      window.toggleBillingAddress = function () {
        // Call original function
        originalToggleFunc.apply(this, arguments);

        const sameAsShippingCheckbox =
          document.getElementById("same-as-shipping");
        if (sameAsShippingCheckbox) {
          toggleElementVisibility(
            "billing-address-container",
            !sameAsShippingCheckbox.checked
          );
        }
      };
    }
  }

  /**
   * Display saved addresses in the checkout form
   */
  function displaySavedAddresses() {
    if (!savedAddressesContainer || savedAddresses.length === 0) return;

    savedAddressesContainer.innerHTML = "";
    savedAddressesContainer.classList.remove("hidden");

    // Create address selection heading
    const heading = document.createElement("h3");
    heading.className = "text-lg font-medium text-gray-900 mb-2";
    heading.textContent = "Your Saved Addresses";
    savedAddressesContainer.appendChild(heading);

    // Create address cards
    savedAddresses.forEach((address, index) => {
      const addressCard = document.createElement("div");
      addressCard.className =
        "border rounded-lg p-4 mb-3 cursor-pointer hover:border-red-500 transition";

      if (index === 0) {
        addressCard.classList.add("border-red-500", "bg-red-50");
      }

      addressCard.innerHTML = `
        <div class="flex justify-between">
          <div>
            <p class="font-medium">${
              address.name || `${userData.firstName} ${userData.lastName}`
            }</p>
            <p>${address.street}</p>
            ${address.apartment ? `<p>Apt ${address.apartment}</p>` : ""}
            <p>${address.city}, ${address.state} ${address.zipcode}</p>
            <p>${address.phone || userData.phone}</p>
          </div>
          <div>
            <button type="button" class="text-gray-400 hover:text-gray-500" data-address-index="${index}">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      `;

      // Add event listener to select this address
      addressCard.addEventListener("click", (e) => {
        // Don't trigger if edit button clicked
        if (e.target.closest("button")) return;

        // Remove selected class from all cards
        savedAddressesContainer
          .querySelectorAll(".border-red-500")
          .forEach((card) => {
            card.classList.remove("border-red-500", "bg-red-50");
          });

        // Add selected class to this card
        addressCard.classList.add("border-red-500", "bg-red-50");

        // Fill form with this address
        fillAddressForm(address);
      });

      // Add event listener for edit button
      const editButton = addressCard.querySelector("button");
      if (editButton) {
        editButton.addEventListener("click", () => {
          // Fill form with this address for editing
          fillAddressForm(address);

          // Scroll to address form
          document
            .getElementById("address-form")
            .scrollIntoView({ behavior: "smooth" });
        });
      }

      savedAddressesContainer.appendChild(addressCard);
    });

    // Add a button to add new address
    const addNewButton = document.createElement("button");
    addNewButton.type = "button";
    addNewButton.className =
      "text-red-500 hover:text-red-600 text-sm flex items-center";
    addNewButton.innerHTML = '<i class="fas fa-plus mr-2"></i> Add New Address';

    addNewButton.addEventListener("click", () => {
      // Clear address form
      clearAddressForm();

      // Remove selected class from all cards
      savedAddressesContainer
        .querySelectorAll(".border-red-500")
        .forEach((card) => {
          card.classList.remove("border-red-500", "bg-red-50");
        });

      // Scroll to address form
      document
        .getElementById("address-form")
        .scrollIntoView({ behavior: "smooth" });
    });

    savedAddressesContainer.appendChild(addNewButton);
  }

  /**
   * Display saved payment methods in the checkout form
   */
  function displaySavedPaymentMethods() {
    if (!savedPaymentMethodsContainer || savedPaymentMethods.length === 0)
      return;

    savedPaymentMethodsContainer.innerHTML = "";
    savedPaymentMethodsContainer.classList.remove("hidden");

    // Create payment methods heading
    const heading = document.createElement("h3");
    heading.className = "text-lg font-medium text-gray-900 mb-2";
    heading.textContent = "Your Saved Payment Methods";
    savedPaymentMethodsContainer.appendChild(heading);

    // Create payment method cards
    savedPaymentMethods.forEach((method, index) => {
      const methodCard = document.createElement("div");
      methodCard.className =
        "border rounded-lg p-4 mb-3 cursor-pointer hover:border-red-500 transition";

      if (index === 0) {
        methodCard.classList.add("border-red-500", "bg-red-50");
      }

      // Get card icon based on card type
      let cardIcon = "";
      if (method.cardType === "visa") {
        cardIcon = '<i class="fab fa-cc-visa text-blue-700 mr-2"></i>';
      } else if (method.cardType === "mastercard") {
        cardIcon = '<i class="fab fa-cc-mastercard text-red-600 mr-2"></i>';
      } else if (method.cardType === "amex") {
        cardIcon = '<i class="fab fa-cc-amex text-blue-500 mr-2"></i>';
      } else if (method.cardType === "discover") {
        cardIcon = '<i class="fab fa-cc-discover text-orange-600 mr-2"></i>';
      }

      methodCard.innerHTML = `
        <div class="flex justify-between">
          <div class="flex items-center">
            ${cardIcon}
            <div>
              <p class="font-medium">${
                method.cardType.charAt(0).toUpperCase() +
                method.cardType.slice(1)
              }</p>
              <p class="text-gray-600">**** **** **** ${method.last4}</p>
              <p class="text-sm text-gray-500">Expires ${method.expMonth}/${
        method.expYear
      }</p>
            </div>
          </div>
          <div>
            <button type="button" class="text-gray-400 hover:text-gray-500" data-method-index="${index}">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      `;

      // Add event listener to select this method
      methodCard.addEventListener("click", (e) => {
        // Don't trigger if edit button clicked
        if (e.target.closest("button")) return;

        // Remove selected class from all cards
        savedPaymentMethodsContainer
          .querySelectorAll(".border-red-500")
          .forEach((card) => {
            card.classList.remove("border-red-500", "bg-red-50");
          });

        // Add selected class to this card
        methodCard.classList.add("border-red-500", "bg-red-50");

        // Select credit card option
        if (creditCardOption) {
          creditCardOption.checked = true;
          togglePaymentMethods();
        }

        // Fill billing address if it exists
        if (method.billingAddress) {
          document.getElementById("billing-address").value =
            method.billingAddress.street || "";
          document.getElementById("billing-city").value =
            method.billingAddress.city || "";
          document.getElementById("billing-state").value =
            method.billingAddress.state || "";
          document.getElementById("billing-zipcode").value =
            method.billingAddress.zipcode || "";
        }
      });

      // Add event listener for edit button
      const editButton = methodCard.querySelector("button");
      if (editButton) {
        editButton.addEventListener("click", () => {
          // Show add new card form and fill it with this card's details
          if (creditCardOption) {
            creditCardOption.checked = true;
            togglePaymentMethods();
          }

          // We can't fill actual card number since we only store last 4 digits
          // But we can fill name on card and expiry
          document.getElementById("card-name").value = method.nameOnCard || "";
          document.getElementById("expiry-date").value = `${
            method.expMonth
          }/${method.expYear.toString().slice(-2)}`;

          // Scroll to payment section
          document
            .getElementById("payment-methods")
            .scrollIntoView({ behavior: "smooth" });
        });
      }

      savedPaymentMethodsContainer.appendChild(methodCard);
    });

    // Add a button to add new payment method
    const addNewButton = document.createElement("button");
    addNewButton.type = "button";
    addNewButton.className =
      "text-red-500 hover:text-red-600 text-sm flex items-center";
    addNewButton.innerHTML =
      '<i class="fas fa-plus mr-2"></i> Add New Payment Method';

    addNewButton.addEventListener("click", () => {
      // Select credit card option
      if (creditCardOption) {
        creditCardOption.checked = true;
        togglePaymentMethods();
      }

      // Clear payment form
      document.getElementById("card-number").value = "";
      document.getElementById("card-name").value = "";
      document.getElementById("expiry-date").value = "";
      document.getElementById("cvv").value = "";

      // Scroll to payment section
      document
        .getElementById("payment-methods")
        .scrollIntoView({ behavior: "smooth" });
    });

    savedPaymentMethodsContainer.appendChild(addNewButton);
  }

  /**
   * Display loyalty points information
   */
  function displayLoyaltyPoints() {
    if (!loyaltyPointsContainer || loyaltyPoints === 0) return;

    // Calculate points value
    const pointsValue = (loyaltyPoints / LOYALTY_POINTS_RATE).toFixed(2);

    // Check if user has enough points to redeem
    const canRedeem = loyaltyPoints >= MIN_POINTS_REDEMPTION;

    loyaltyPointsContainer.innerHTML = `
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-gray-900">Your Loyalty Points</h3>
          <span class="text-red-500 font-bold">${loyaltyPoints} points</span>
        </div>
        <p class="text-gray-600 text-sm mb-3">Points value: $${pointsValue}</p>
        
        ${
          canRedeem
            ? `
          <div class="flex items-center">
            <input type="checkbox" id="use-loyalty-points" class="mr-2 h-4 w-4 text-red-500 focus:ring-red-400">
            <label for="use-loyalty-points" class="text-sm text-gray-700">
              Use ${loyaltyPoints} points to get $${pointsValue} off
            </label>
          </div>
        `
            : `
          <p class="text-sm text-gray-500">
            <i class="fas fa-info-circle mr-1"></i>
            You need at least ${MIN_POINTS_REDEMPTION} points to redeem.
          </p>
        `
        }
      </div>
    `;

    // Add event listener for loyalty points checkbox
    const usePointsCheckbox = document.getElementById("use-loyalty-points");
    if (usePointsCheckbox) {
      usePointsCheckbox.addEventListener("change", () => {
        if (usePointsCheckbox.checked) {
          // Apply loyalty discount
          orderSummary.loyaltyDiscount = parseFloat(pointsValue);
        } else {
          // Remove loyalty discount
          orderSummary.loyaltyDiscount = 0;
        }

        // Update order summary
        updateOrderSummaryDisplay();
      });
    }
  }

  /**
   * Fill address form with saved address data
   * @param {Object} address - The address data
   */
  function fillAddressForm(address) {
    if (!address) return;

    // Fill address fields
    document.getElementById("address").value = address.street || "";
    document.getElementById("apartment").value = address.apartment || "";
    document.getElementById("city").value = address.city || "";
    document.getElementById("state").value = address.state || "";
    document.getElementById("zipcode").value = address.zipcode || "";

    // If the address has a phone number, use it
    if (address.phone) {
      document.getElementById("phone").value = address.phone;
    }
  }

  /**
   * Clear address form fields
   */
  function clearAddressForm() {
    document.getElementById("address").value = "";
    document.getElementById("apartment").value = "";
    document.getElementById("city").value = "";
    document.getElementById("state").value = "";
    document.getElementById("zipcode").value = "";
  }

  /**
   * Initialize address autocomplete functionality
   */
  function initializeAddressAutocomplete() {
    const addressInput = document.getElementById("address");
    if (!addressInput) return;

    // Add autocomplete UI elements
    const autocompleteContainer = document.createElement("div");
    autocompleteContainer.className =
      "address-autocomplete-container relative hidden";
    autocompleteContainer.innerHTML = `
      <div class="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto"></div>
    `;

    addressInput.parentNode.appendChild(autocompleteContainer);
    const suggestionsList = autocompleteContainer.querySelector("div");

    // Simulate address autocomplete (in real implementation, this would use Google Places API or similar)
    addressInput.addEventListener(
      "input",
      debounce(() => {
        const query = addressInput.value.trim();

        if (query.length < 3) {
          autocompleteContainer.classList.add("hidden");
          return;
        }

        // Simulate API call with mock data
        simulateAddressLookup(query).then((addresses) => {
          if (addresses.length === 0) {
            autocompleteContainer.classList.add("hidden");
            return;
          }

          // Display suggestions
          suggestionsList.innerHTML = "";
          addresses.forEach((address) => {
            const suggestion = document.createElement("div");
            suggestion.className = "p-2 hover:bg-gray-100 cursor-pointer";
            suggestion.textContent = address.formatted;

            suggestion.addEventListener("click", () => {
              // Fill address form with selected address
              addressInput.value = address.street;
              document.getElementById("city").value = address.city;
              document.getElementById("state").value = address.state;
              document.getElementById("zipcode").value = address.zipcode;

              // Hide suggestions
              autocompleteContainer.classList.add("hidden");
            });

            suggestionsList.appendChild(suggestion);
          });

          autocompleteContainer.classList.remove("hidden");
        });
      }, 300)
    );

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !autocompleteContainer.contains(e.target) &&
        e.target !== addressInput
      ) {
        autocompleteContainer.classList.add("hidden");
      }
    });
  }

  /**
   * Simulate address lookup (mock implementation)
   * @param {string} query - The address query
   * @returns {Promise<Array>} - Array of address suggestions
   */
  function simulateAddressLookup(query) {
    return new Promise((resolve) => {
      // Mock address data
      const mockAddresses = [
        {
          formatted: "123 Main St, New York, NY 10001",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipcode: "10001",
        },
        {
          formatted: "123 Maple Ave, New York, NY 10002",
          street: "123 Maple Ave",
          city: "New York",
          state: "NY",
          zipcode: "10002",
        },
        {
          formatted: "123 Oak Dr, Brooklyn, NY 11201",
          street: "123 Oak Dr",
          city: "Brooklyn",
          state: "NY",
          zipcode: "11201",
        },
      ];

      // Filter addresses based on query
      const filteredAddresses = mockAddresses.filter((address) =>
        address.formatted.toLowerCase().includes(query.toLowerCase())
      );

      // Simulate network delay
      setTimeout(() => {
        resolve(filteredAddresses);
      }, 200);
    });
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Payment method selection
    if (creditCardOption) {
      creditCardOption.addEventListener("change", togglePaymentMethods);
    }
    if (paypalOption) {
      paypalOption.addEventListener("change", togglePaymentMethods);
    }
    if (cashOption) {
      cashOption.addEventListener("change", togglePaymentMethods);
    }

    // Delivery option selection
    if (standardDeliveryOption) {
      standardDeliveryOption.addEventListener("change", updateShippingCost);
    }
    if (expressDeliveryOption) {
      expressDeliveryOption.addEventListener("change", updateShippingCost);
    }
    if (pickupOption) {
      pickupOption.addEventListener("change", updateShippingCost);
    }

    // Form submission
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", handleCheckoutSubmission);

      // Real-time validation
      const inputFields = checkoutForm.querySelectorAll(
        "input, select, textarea"
      );
      inputFields.forEach((field) => {
        field.addEventListener("blur", () => {
          validateField(field);
        });

        // Special validation for card fields
        if (field.id === "card-number") {
          field.addEventListener("input", formatCardNumber);
        } else if (field.id === "expiry-date") {
          field.addEventListener("input", formatExpiryDate);
        }
      });
    }

    // Credit card formatting
    const cardNumberInput = document.getElementById("card-number");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", formatCardNumber);

      // Additional event to detect card type
      cardNumberInput.addEventListener("input", detectCardType);
    }

    // Expiry date formatting
    const expiryDateInput = document.getElementById("expiry-date");
    if (expiryDateInput) {
      expiryDateInput.addEventListener("input", formatExpiryDate);
    }

    // Phone number formatting
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", formatPhoneNumber);
    }

    // Promo code application
    if (promoCodeInput && applyPromoButton) {
      applyPromoButton.addEventListener("click", applyPromoCode);

      // Allow Enter key to apply promo code
      promoCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyPromoCode();
        }
      });
    }

    // Gift wrap option
    if (giftWrapOption) {
      giftWrapOption.addEventListener("change", () => {
        toggleGiftOptions();
        updateOrderSummary();
      });
    }

    // Schedule delivery option
    if (scheduleDeliveryCheckbox) {
      scheduleDeliveryCheckbox.addEventListener(
        "change",
        toggleScheduledDelivery
      );
    }

    // Same as shipping checkbox
    const sameAsShippingCheckbox = document.getElementById("same-as-shipping");
    if (sameAsShippingCheckbox) {
      sameAsShippingCheckbox.addEventListener("change", toggleBillingAddress);
    }
  }

  /**
   * Toggle gift options based on gift wrap selection
   */
  function toggleGiftOptions() {
    if (!giftWrapOption || !giftMessageContainer) return;

    if (giftWrapOption.checked) {
      giftMessageContainer.classList.remove("hidden");
      orderSummary.giftWrap = GIFT_WRAP_FEE;
    } else {
      giftMessageContainer.classList.add("hidden");
      orderSummary.giftWrap = 0;
    }
  }

  /**
   * Toggle scheduled delivery options
   */
  function toggleScheduledDelivery() {
    if (!scheduleDeliveryCheckbox || !deliveryDateContainer) return;

    if (scheduleDeliveryCheckbox.checked) {
      deliveryDateContainer.classList.remove("hidden");
    } else {
      deliveryDateContainer.classList.add("hidden");
    }

    // Update delivery time estimate
    displayEstimatedDeliveryTime();
  }

  /**
   * Toggle billing address form based on "same as shipping" checkbox
   */
  function toggleBillingAddress() {
    const sameAsShippingCheckbox = document.getElementById("same-as-shipping");
    const billingAddressContainer = document.getElementById(
      "billing-address-container"
    );

    if (!sameAsShippingCheckbox || !billingAddressContainer) return;

    if (sameAsShippingCheckbox.checked) {
      billingAddressContainer.classList.add("hidden");
    } else {
      billingAddressContainer.classList.remove("hidden");
    }
  }

  /**
   * Apply promo code
   */
  function applyPromoCode() {
    if (!promoCodeInput || !applyPromoButton) return;

    const promoCode = promoCodeInput.value.trim().toUpperCase();

    if (!promoCode) {
      showPromoError("Please enter a promo code");
      return;
    }

    // Disable button during "API call"
    applyPromoButton.disabled = true;
    applyPromoButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // Simulate API call to validate promo code
    setTimeout(() => {
      const validPromo = validatePromoCode(promoCode);

      if (validPromo) {
        // Show success message
        showPromoSuccess(
          `Promo code "${promoCode}" applied: ${validPromo.description}`
        );

        // Save applied promo
        appliedPromoCode = validPromo;

        // Update localStorage
        localStorage.setItem(
          "djinisCoupon",
          JSON.stringify({
            code: promoCode,
            type: validPromo.type,
            value: validPromo.value,
          })
        );

        // Update order summary
        populateOrderSummary();
      } else {
        // Show error message
        showPromoError(`Invalid promo code "${promoCode}"`);

        // Clear applied promo
        appliedPromoCode = null;
        localStorage.removeItem("djinisCoupon");
      }

      // Re-enable button
      applyPromoButton.disabled = false;
      applyPromoButton.innerHTML = "Apply";
    }, 800);
  }

  /**
   * Validate promo code against known valid codes
   * @param {string} code - The promo code to validate
   * @returns {Object|null} - Promo code details if valid, null otherwise
   */
  function validatePromoCode(code) {
    // List of valid promo codes
    const validPromoCodes = {
      WELCOME10: {
        type: "percentage",
        value: 10,
        description: "10% off your order",
      },
      FREESHIP: {
        type: "shipping",
        value: "free",
        description: "Free shipping on your order",
      },
      SPRING5: {
        type: "fixed",
        value: 5,
        description: "$5 off your order",
      },
      BAKERY25: {
        type: "percentage",
        value: 25,
        description: "25% off your order",
      },
    };

    return validPromoCodes[code] || null;
  }

  /**
   * Show promo code error message
   * @param {string} message - The error message
   */
  function showPromoError(message) {
    const container = promoCodeInput.parentElement;

    // Remove any existing messages
    container.querySelectorAll(".promo-message").forEach((el) => el.remove());

    // Add error message
    const errorMessage = document.createElement("p");
    errorMessage.className = "promo-message text-red-500 text-sm mt-1";
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;

    container.appendChild(errorMessage);

    // Add error styling
    promoCodeInput.classList.add("border-red-500");

    // Clear error after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentElement) {
        errorMessage.remove();
      }
      promoCodeInput.classList.remove("border-red-500");
    }, 5000);
  }

  /**
   * Show promo code success message
   * @param {string} message - The success message
   */
  function showPromoSuccess(message) {
    const container = promoCodeInput.parentElement;

    // Remove any existing messages
    container.querySelectorAll(".promo-message").forEach((el) => el.remove());

    // Add success message
    const successMessage = document.createElement("p");
    successMessage.className = "promo-message text-green-500 text-sm mt-1";
    successMessage.innerHTML = `<i class="fas fa-check-circle mr-1"></i>${message}`;

    container.appendChild(successMessage);

    // Add success styling
    promoCodeInput.classList.add("border-green-500");

    // Show remove button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className =
      "absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500";
    removeButton.innerHTML = '<i class="fas fa-times"></i>';

    removeButton.addEventListener("click", () => {
      // Remove promo code
      appliedPromoCode = null;
      localStorage.removeItem("djinisCoupon");

      // Clear input
      promoCodeInput.value = "";

      // Remove message and button
      successMessage.remove();
      removeButton.remove();

      // Remove styling
      promoCodeInput.classList.remove("border-green-500");

      // Update order summary
      populateOrderSummary();
    });

    // Add remove button to input container
    promoCodeInput.parentElement.style.position = "relative";
    promoCodeInput.parentElement.appendChild(removeButton);
  }

  /**
   * Format phone number as (XXX) XXX-XXXX
   * @param {Event} e - Input event
   */
  function formatPhoneNumber(e) {
    let input = e.target;

    // Remove non-digits
    let value = input.value.replace(/\D/g, "");

    // Format phone number
    if (value.length > 0) {
      if (value.length <= 3) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
      } else {
        value = `(${value.substring(0, 3)}) ${value.substring(
          3,
          6
        )}-${value.substring(6, 10)}`;
      }
    }

    // Update the input value
    input.value = value;
  }

  /**
   * Detect credit card type based on card number
   * @param {Event} e - Input event
   */
  function detectCardType(e) {
    const cardNumber = e.target.value.replace(/\s+/g, "");
    const cardTypeDisplay = document.getElementById("card-type-display");

    if (!cardTypeDisplay) return;

    let cardType = "";
    let cardTypeIcon = "";

    // Visa
    if (/^4/.test(cardNumber)) {
      cardType = "visa";
      cardTypeIcon = '<i class="fab fa-cc-visa text-blue-700"></i>';
    }
    // Mastercard
    else if (/^5[1-5]/.test(cardNumber)) {
      cardType = "mastercard";
      cardTypeIcon = '<i class="fab fa-cc-mastercard text-red-600"></i>';
    }
    // Amex
    else if (/^3[47]/.test(cardNumber)) {
      cardType = "amex";
      cardTypeIcon = '<i class="fab fa-cc-amex text-blue-500"></i>';
    }
    // Discover
    else if (/^6(?:011|5)/.test(cardNumber)) {
      cardType = "discover";
      cardTypeIcon = '<i class="fab fa-cc-discover text-orange-600"></i>';
    }

    if (cardType) {
      cardTypeDisplay.innerHTML = cardTypeIcon;
      cardTypeDisplay.classList.remove("hidden");
    } else {
      cardTypeDisplay.innerHTML = "";
      cardTypeDisplay.classList.add("hidden");
    }
  }

  /**
   * Toggle payment method details based on selection
   */
  function togglePaymentMethods() {
    if (creditCardDetails && paypalDetails && cashDetails) {
      // Hide all payment details initially
      creditCardDetails.classList.add("hidden");
      paypalDetails.classList.add("hidden");
      cashDetails.classList.add("hidden");

      // Show selected payment details
      if (creditCardOption && creditCardOption.checked) {
        creditCardDetails.classList.remove("hidden");
      } else if (paypalOption && paypalOption.checked) {
        paypalDetails.classList.remove("hidden");
      } else if (cashOption && cashOption.checked) {
        cashDetails.classList.remove("hidden");
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

    // Check for free shipping threshold or promo
    if (
      (orderSummary.subtotal >= FREE_SHIPPING_THRESHOLD &&
        orderSummary.shipping !== 0) ||
      (appliedPromoCode &&
        appliedPromoCode.type === "shipping" &&
        appliedPromoCode.value === "free")
    ) {
      const freeShippingNote = document.createElement("div");
      freeShippingNote.className = "text-green-600 text-sm mt-1";

      if (orderSummary.subtotal >= FREE_SHIPPING_THRESHOLD) {
        freeShippingNote.innerHTML =
          '<i class="fas fa-tag mr-1"></i>Free shipping applied (orders over $' +
          FREE_SHIPPING_THRESHOLD.toFixed(2) +
          ")";
      } else {
        freeShippingNote.innerHTML =
          '<i class="fas fa-tag mr-1"></i>Free shipping applied (promo code)';
      }

      // Add note after delivery options
      const deliveryOptions = document.getElementById("delivery-options");
      if (
        deliveryOptions &&
        !document.querySelector(".text-green-600.text-sm.mt-1")
      ) {
        deliveryOptions.appendChild(freeShippingNote);
      }

      orderSummary.shipping = 0;
    }

    // Update order summary with new shipping cost
    updateOrderSummaryDisplay();

    // Update estimated delivery time
    displayEstimatedDeliveryTime();
  }

  /**
   * Display estimated delivery time based on selected delivery option
   */
  function displayEstimatedDeliveryTime() {
    const deliveryTimeDisplay = document.getElementById(
      "estimated-delivery-time"
    );
    if (!deliveryTimeDisplay) return;

    // Get selected delivery method
    let deliveryMethod = "standard";
    if (expressDeliveryOption && expressDeliveryOption.checked) {
      deliveryMethod = "express";
    } else if (pickupOption && pickupOption.checked) {
      deliveryMethod = "pickup";
    }

    // Check if scheduled delivery is selected
    const isScheduled =
      scheduleDeliveryCheckbox && scheduleDeliveryCheckbox.checked;

    if (isScheduled) {
      // Get selected date and time
      const deliveryDate = document.getElementById("delivery-date").value;
      const deliveryTime = document.getElementById("delivery-time").value;

      if (deliveryDate && deliveryTime) {
        deliveryTimeDisplay.innerHTML = `
          <div class="flex items-center text-green-600">
            <i class="fas fa-clock mr-2"></i>
            <span>Scheduled for ${deliveryDate} at ${deliveryTime}</span>
          </div>
        `;
      } else {
        deliveryTimeDisplay.innerHTML =
          '<div class="text-gray-500">Please select a delivery date and time</div>';
      }
    } else {
      // Calculate estimated delivery time
      const estimatedTime = calculateEstimatedDelivery(deliveryMethod);

      deliveryTimeDisplay.innerHTML = `
        <div class="flex items-center text-green-600">
          <i class="fas fa-clock mr-2"></i>
          <span>${estimatedTime}</span>
        </div>
      `;
    }
  }

  /**
   * Prefill delivery date selection with valid dates
   */
  function prefillShippingDate() {
    const dateSelect = document.getElementById("delivery-date");
    if (!dateSelect) return;

    // Clear existing options
    dateSelect.innerHTML = "";

    // Add empty option
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Select a date";
    dateSelect.appendChild(emptyOption);

    // Get current date
    const today = new Date();

    // Add next 7 days as options
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Format date
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      // Create option
      const option = document.createElement("option");

      // Set value as ISO date string
      option.value = date.toISOString().split("T")[0];

      // Set text
      if (i === 0) {
        option.textContent = `Today (${formattedDate})`;
      } else if (i === 1) {
        option.textContent = `Tomorrow (${formattedDate})`;
      } else {
        option.textContent = formattedDate;
      }

      dateSelect.appendChild(option);
    }
  }

  /**
   * Populate order summary with cart items and totals
   */
  function populateOrderSummary() {
    if (!checkoutSummary) return;

    // Clear existing content
    checkoutSummary.innerHTML = "";

    // Calculate subtotal
    orderSummary.subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Get applied coupon if any
    const coupon = getAppliedCoupon();
    orderSummary.discount = 0;
    let freeShipping = false;

    if (coupon) {
      appliedPromoCode = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      };

      if (coupon.type === "percentage") {
        orderSummary.discount = orderSummary.subtotal * (coupon.value / 100);
      } else if (coupon.type === "fixed") {
        orderSummary.discount = Math.min(coupon.value, orderSummary.subtotal);
      } else if (coupon.type === "shipping" && coupon.value === "free") {
        freeShipping = true;
      }

      // Display promo code in input if it exists
      if (promoCodeInput) {
        promoCodeInput.value = coupon.code;
        showPromoSuccess(
          `Promo code "${coupon.code}" applied: ${getPromoDescription(coupon)}`
        );
      }
    }

    // Check for free shipping threshold
    if (orderSummary.subtotal >= FREE_SHIPPING_THRESHOLD || freeShipping) {
      orderSummary.shipping = 0;
    } else {
      // Set default shipping method (standard)
      orderSummary.shipping = STANDARD_SHIPPING;
    }

    // Calculate tax (on subtotal after discounts, before shipping)
    orderSummary.tax =
      (orderSummary.subtotal - orderSummary.discount) * TAX_RATE;

    // Initialize other fields
    orderSummary.giftWrap = 0;
    orderSummary.loyaltyDiscount = 0;

    // Calculate total
    updateOrderSummary();

    // Add each item to summary
    cart.forEach((item) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);

      const itemElement = document.createElement("div");
      itemElement.className = "flex items-center py-2 border-b";
      itemElement.innerHTML = `
        <div class="flex-shrink-0 w-16 h-16 mr-4">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded">
        </div>
        <div class="flex-grow">
          <h4 class="font-medium text-gray-800">${item.name}</h4>
          <p class="text-gray-600 text-sm">Qty: ${item.quantity}</p>
        </div>
        <div class="flex-shrink-0 font-medium">
          $${itemTotal}
        </div>
      `;

      checkoutSummary.appendChild(itemElement);
    });

    // Add summary details
    const summaryDetails = document.createElement("div");
    summaryDetails.className = "space-y-2 mt-4 pt-4";

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

    // Add loyalty points discount if any
    if (orderSummary.loyaltyDiscount > 0) {
      summaryHTML += `
        <div class="flex justify-between text-green-600">
          <span>Loyalty Points</span>
          <span>-$${orderSummary.loyaltyDiscount.toFixed(2)}</span>
        </div>
      `;
    }

    // Add gift wrap fee if any
    if (orderSummary.giftWrap > 0) {
      summaryHTML += `
        <div class="flex justify-between">
          <span>Gift Wrap</span>
          <span>$${orderSummary.giftWrap.toFixed(2)}</span>
        </div>
      `;
    }

    // Add shipping
    summaryHTML += `
      <div class="flex justify-between">
        <span>Shipping</span>
        <span>${
          orderSummary.shipping === 0
            ? "Free"
            : "$" + orderSummary.shipping.toFixed(2)
        }</span>
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

    // Add order total
    const totalElement = document.createElement("div");
    totalElement.className =
      "flex justify-between items-center pt-4 mt-4 border-t border-gray-300";
    totalElement.innerHTML = `
      <span class="text-lg font-bold">Total</span>
      <span class="text-2xl font-bold text-red-500">$<span id="checkout-total">${orderSummary.total.toFixed(
        2
      )}</span></span>
    `;

    checkoutSummary.appendChild(totalElement);

    // Show loyalty points to be earned
    if (loyaltyPoints >= 0) {
      const pointsToEarn = Math.floor(orderSummary.total * LOYALTY_POINTS_RATE);

      const pointsElement = document.createElement("div");
      pointsElement.className = "text-sm text-gray-600 mt-2 text-right";
      pointsElement.innerHTML = `You'll earn <span class="text-red-500 font-medium">${pointsToEarn} points</span> with this purchase`;

      checkoutSummary.appendChild(pointsElement);
    }
  }

  /**
   * Calculate and update order summary totals
   */
  function updateOrderSummary() {
    // Calculate tax on subtotal after discounts
    orderSummary.tax =
      (orderSummary.subtotal - orderSummary.discount) * TAX_RATE;

    // Calculate total
    orderSummary.total =
      orderSummary.subtotal -
      orderSummary.discount -
      orderSummary.loyaltyDiscount +
      orderSummary.shipping +
      orderSummary.giftWrap +
      orderSummary.tax;

    // Update display
    updateOrderSummaryDisplay();
  }

  /**
   * Update order summary display with calculated totals
   */
  function updateOrderSummaryDisplay() {
    // Update order summary first
    updateOrderSummary();

    // Update total display
    if (checkoutTotal) {
      checkoutTotal.textContent = orderSummary.total.toFixed(2);
    }
  }

  /**
   * Get promo code description
   * @param {Object} promo - The promo code object
   * @returns {string} - Description of the promo
   */
  function getPromoDescription(promo) {
    if (promo.type === "percentage") {
      return `${promo.value}% off your order`;
    } else if (promo.type === "fixed") {
      return `$${promo.value} off your order`;
    } else if (promo.type === "shipping" && promo.value === "free") {
      return "Free shipping on your order";
    }
    return "";
  }

  /**
   * Get the applied coupon from localStorage
   * @returns {Object|null} The coupon object or null if none applied
   */
  function getAppliedCoupon() {
    try {
      const couponJson = localStorage.getItem("djinisCoupon");
      return couponJson ? JSON.parse(couponJson) : null;
    } catch (error) {
      console.error("Error getting coupon:", error);
      return null;
    }
  }

  /**
   * Prefill form with saved user data if available
   */
  function prefillFormWithUserData() {
    // Try to get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("djinisUserProfile"));

    if (userData) {
      // Fill in personal information fields
      if (document.getElementById("first-name")) {
        document.getElementById("first-name").value = userData.firstName || "";
      }
      if (document.getElementById("last-name")) {
        document.getElementById("last-name").value = userData.lastName || "";
      }
      if (document.getElementById("email")) {
        document.getElementById("email").value = userData.email || "";
      }
      if (document.getElementById("phone")) {
        document.getElementById("phone").value = userData.phone || "";
      }

      // No need to fill address fields if saved addresses are available
      // as they'll be handled by the saved addresses feature
    }
  }

  /**
   * Format credit card number with spaces
   * @param {Event} e - Input event
   */
  function formatCardNumber(e) {
    let input = e.target;

    // Remove non-digits
    let value = input.value.replace(/\D/g, "");

    // Add spaces after every 4 digits
    if (value.length > 0) {
      value = value.match(/.{1,4}/g).join(" ");
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
    let value = input.value.replace(/\D/g, "");

    // Format as MM/YY
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }

    // Update the input value
    input.value = value;
  }

  /**
   * Validate a single form field
   * @param {HTMLElement} field - The field to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateField(field) {
    // Remove any existing error messages
    const existingError = field.parentElement.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Reset field styling
    field.classList.remove("border-red-500");

    // Skip validation if field is not required and empty
    if (!field.hasAttribute("required") && !field.value.trim()) {
      return true;
    }

    // Validate based on field type and requirements
    let isValid = true;
    let errorMessage = "";

    // Required field validation
    if (field.hasAttribute("required") && !field.value.trim()) {
      isValid = false;
      errorMessage = "This field is required";
    }
    // Email validation
    else if (
      field.type === "email" &&
      field.value.trim() &&
      !validateEmail(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid email address";
    }
    // Credit card validation
    else if (
      field.id === "card-number" &&
      field.value.trim() &&
      !validateCardNumber(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid credit card number";
    }
    // Expiry date validation
    else if (
      field.id === "expiry-date" &&
      field.value.trim() &&
      !validateExpiryDate(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid expiry date (MM/YY)";
    }
    // CVV validation
    else if (
      field.id === "cvv" &&
      field.value.trim() &&
      !validateCVV(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid CVV (3-4 digits)";
    }
    // Phone validation
    else if (
      field.id === "phone" &&
      field.value.trim() &&
      !validatePhone(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid phone number";
    }
    // Zip code validation
    else if (
      (field.id === "zipcode" || field.id === "billing-zipcode") &&
      field.value.trim() &&
      !validateZipCode(field.value)
    ) {
      isValid = false;
      errorMessage = "Please enter a valid zip code";
    }

    // If not valid, add error styling and message
    if (!isValid) {
      field.classList.add("border-red-500");

      const errorElement = document.createElement("p");
      errorElement.className = "error-message text-red-500 text-sm mt-1";
      errorElement.textContent = errorMessage;

      field.parentElement.appendChild(errorElement);
    }

    return isValid;
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateEmail(email) {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Validate credit card number using Luhn algorithm
   * @param {string} cardNumber - The card number to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateCardNumber(cardNumber) {
    // Remove spaces
    cardNumber = cardNumber.replace(/\s+/g, "");

    // Check if contains only digits and has appropriate length
    if (
      !/^\d+$/.test(cardNumber) ||
      cardNumber.length < 13 ||
      cardNumber.length > 19
    ) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;

    // Loop from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate expiry date format and value
   * @param {string} expiryDate - The expiry date to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateExpiryDate(expiryDate) {
    // Check format
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return false;
    }

    // Parse month and year
    const [month, year] = expiryDate
      .split("/")
      .map((part) => parseInt(part, 10));

    // Check month range
    if (month < 1 || month > 12) {
      return false;
    }

    // Check if card is expired
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

    // Convert to full year (assuming 20xx)
    const fullYear = 2000 + year;

    // Check if card is expired
    if (
      fullYear < currentDate.getFullYear() ||
      (fullYear === currentDate.getFullYear() && month < currentMonth)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate CVV format
   * @param {string} cvv - The CVV to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Validate phone number format
   * @param {string} phone - The phone number to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validatePhone(phone) {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, "");

    // Check if it has 10 digits
    return digitsOnly.length === 10;
  }

  /**
   * Validate US zip code format
   * @param {string} zipCode - The zip code to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateZipCode(zipCode) {
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  /**
   * Handle checkout form submission
   * @param {Event} e - Submit event
   */
  function handleCheckoutSubmission(e) {
    e.preventDefault();

    // Validate form
    if (!validateCheckoutForm()) {
      // Scroll to first error
      const firstError = document.querySelector(".error-message");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
    // Get all fields that need validation
    const fields = document.querySelectorAll(
      "#checkout-form input, #checkout-form select, #checkout-form textarea"
    );
    let isValid = true;

    // Validate each field
    fields.forEach((field) => {
      // Skip fields in hidden sections
      if (field.closest(".hidden")) {
        return;
      }

      // Skip fields that aren't required and are empty
      if (!field.hasAttribute("required") && !field.value.trim()) {
        return;
      }

      // Validate field
      if (!validateField(field)) {
        isValid = false;
      }
    });

    // Payment method specific validations
    if (creditCardOption && creditCardOption.checked) {
      // Credit card validation already handled by validateField
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
        firstName: document.getElementById("first-name")?.value || "",
        lastName: document.getElementById("last-name")?.value || "",
        email: document.getElementById("email")?.value || "",
        phone: document.getElementById("phone")?.value || "",
      },
      delivery: {
        address: document.getElementById("address")?.value || "",
        apartment: document.getElementById("apartment")?.value || "",
        city: document.getElementById("city")?.value || "",
        state: document.getElementById("state")?.value || "",
        zipcode: document.getElementById("zipcode")?.value || "",
        method: getSelectedDeliveryMethod(),
        scheduled: scheduleDeliveryCheckbox?.checked || false,
        scheduledDate: document.getElementById("delivery-date")?.value || "",
        scheduledTime: document.getElementById("delivery-time")?.value || "",
      },
      payment: {
        method: getSelectedPaymentMethod(),
        cardDetails:
          creditCardOption && creditCardOption.checked
            ? {
                cardNumber: document.getElementById("card-number")?.value || "",
                cardName: document.getElementById("card-name")?.value || "",
                expiryDate: document.getElementById("expiry-date")?.value || "",
                cvv: document.getElementById("cvv")?.value || "",
              }
            : null,
        savePaymentMethod:
          document.getElementById("save-payment-method")?.checked || false,
        sameAsShipping:
          document.getElementById("same-as-shipping")?.checked || false,
        billingAddress: document.getElementById("same-as-shipping")?.checked
          ? null
          : {
              address: document.getElementById("billing-address")?.value || "",
              city: document.getElementById("billing-city")?.value || "",
              state: document.getElementById("billing-state")?.value || "",
              zipcode: document.getElementById("billing-zipcode")?.value || "",
            },
      },
      giftOptions: {
        isGift: giftWrapOption?.checked || false,
        giftMessage: document.getElementById("gift-message")?.value || "",
        giftWrapFee: orderSummary.giftWrap,
      },
      promoCode: appliedPromoCode,
      loyaltyPoints: {
        used: usePointsCheckbox?.checked || false,
        pointsUsed: usePointsCheckbox?.checked ? loyaltyPoints : 0,
        pointsValue: orderSummary.loyaltyDiscount,
        pointsEarned: Math.floor(orderSummary.total * LOYALTY_POINTS_RATE),
      },
      notes: document.getElementById("order-notes")?.value || "",
      cart: cart,
      summary: orderSummary,
      orderDate: new Date().toISOString(),
    };

    return formData;
  }

  /**
   * Get the selected delivery method
   * @returns {string} Delivery method
   */
  function getSelectedDeliveryMethod() {
    if (standardDeliveryOption && standardDeliveryOption.checked) {
      return "standard";
    } else if (expressDeliveryOption && expressDeliveryOption.checked) {
      return "express";
    } else if (pickupOption && pickupOption.checked) {
      return "pickup";
    }
    return "standard"; // Default
  }

  /**
   * Get the selected payment method
   * @returns {string} Payment method
   */
  function getSelectedPaymentMethod() {
    if (creditCardOption && creditCardOption.checked) {
      return "credit-card";
    } else if (paypalOption && paypalOption.checked) {
      return "paypal";
    } else if (cashOption && cashOption.checked) {
      return "cash";
    }
    return "credit-card"; // Default
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
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

      // Show processing modal
      showProcessingModal();

      // Simulate order processing with multiple steps
      simulateOrderProcessing(formData)
        .then((orderNumber) => {
          // Save order to localStorage
          saveOrder(orderNumber, formData);

          // Save new payment method if requested
          if (
            formData.payment.method === "credit-card" &&
            formData.payment.savePaymentMethod
          ) {
            savePaymentMethod(formData.payment.cardDetails);
          }

          // Update loyalty points if used
          if (formData.loyaltyPoints.used) {
            updateLoyaltyPoints(-formData.loyaltyPoints.pointsUsed);
          }

          // Add earned points
          updateLoyaltyPoints(formData.loyaltyPoints.pointsEarned);

          // Clear cart
          clearCart();

          // Redirect to confirmation page
          window.location.href = `order-confirmation.html?order=${orderNumber}`;
        })
        .catch((error) => {
          // Hide processing modal
          hideProcessingModal();

          // Show error message
          showErrorModal(error);

          // Reset submit button
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        });
    }
  }

  /**
   * Show processing modal with animated steps
   */
  function showProcessingModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById("processing-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "processing-modal";
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Processing Your Order</h3>
          <div id="processing-steps">
            <div class="flex items-center mb-4">
              <div class="processing-step-icon w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <i class="fas fa-check text-white hidden"></i>
                <i class="fas fa-spinner fa-spin text-gray-500"></i>
              </div>
              <span class="processing-step-text text-gray-700">Validating your order...</span>
            </div>
            <div class="flex items-center mb-4 opacity-50">
              <div class="processing-step-icon w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <i class="fas fa-check text-white hidden"></i>
                <i class="fas fa-spinner fa-spin text-gray-500 hidden"></i>
              </div>
              <span class="processing-step-text text-gray-700">Processing payment...</span>
            </div>
            <div class="flex items-center mb-4 opacity-50">
              <div class="processing-step-icon w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <i class="fas fa-check text-white hidden"></i>
                <i class="fas fa-spinner fa-spin text-gray-500 hidden"></i>
              </div>
              <span class="processing-step-text text-gray-700">Confirming order details...</span>
            </div>
            <div class="flex items-center opacity-50">
              <div class="processing-step-icon w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <i class="fas fa-check text-white hidden"></i>
                <i class="fas fa-spinner fa-spin text-gray-500 hidden"></i>
              </div>
              <span class="processing-step-text text-gray-700">Preparing your order...</span>
            </div>
          </div>
          <div class="mt-6">
            <p class="text-sm text-gray-500 text-center">Please don't refresh or close this page</p>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }
  }

  /**
   * Hide processing modal
   */
  function hideProcessingModal() {
    const modal = document.getElementById("processing-modal");
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show error modal
   * @param {string} error - The error message
   */
  function showErrorModal(error) {
    // Create modal if it doesn't exist
    let modal = document.getElementById("error-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "error-modal";
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div class="flex items-center justify-center text-red-500 mb-4">
            <i class="fas fa-exclamation-circle text-5xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2 text-center">Order Processing Error</h3>
          <p class="text-gray-700 mb-4 text-center">${error}</p>
          <div class="flex justify-center">
            <button id="close-error-modal" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
              Try Again
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add event listener to close button
      const closeButton = document.getElementById("close-error-modal");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          modal.remove();
        });
      }
    }
  }

  /**
   * Simulate order processing with multiple steps
   * @param {Object} formData - Order data
   * @returns {Promise<string>} - Promise that resolves to order number
   */
  function simulateOrderProcessing(formData) {
    return new Promise((resolve, reject) => {
      const steps = document.querySelectorAll("#processing-steps > div");

      // Step 1: Validate order (500ms)
      setTimeout(() => {
        // Update step 1 UI
        steps[0]
          .querySelector(".processing-step-icon")
          .classList.add("bg-green-500");
        steps[0].querySelector(".fa-spinner").classList.add("hidden");
        steps[0].querySelector(".fa-check").classList.remove("hidden");

        // Start step 2
        steps[1].classList.remove("opacity-50");
        steps[1].querySelector(".fa-spinner").classList.remove("hidden");

        // Step 2: Process payment (1s)
        setTimeout(() => {
          // Simulate payment error (1% chance)
          if (Math.random() < 0.01) {
            reject(
              "Payment processing failed. Please try again or use a different payment method."
            );
            return;
          }

          // Update step 2 UI
          steps[1]
            .querySelector(".processing-step-icon")
            .classList.add("bg-green-500");
          steps[1].querySelector(".fa-spinner").classList.add("hidden");
          steps[1].querySelector(".fa-check").classList.remove("hidden");

          // Start step 3
          steps[2].classList.remove("opacity-50");
          steps[2].querySelector(".fa-spinner").classList.remove("hidden");

          // Step 3: Confirm order (700ms)
          setTimeout(() => {
            // Update step 3 UI
            steps[2]
              .querySelector(".processing-step-icon")
              .classList.add("bg-green-500");
            steps[2].querySelector(".fa-spinner").classList.add("hidden");
            steps[2].querySelector(".fa-check").classList.remove("hidden");

            // Start step 4
            steps[3].classList.remove("opacity-50");
            steps[3].querySelector(".fa-spinner").classList.remove("hidden");

            // Step 4: Prepare order (800ms)
            setTimeout(() => {
              // Update step 4 UI
              steps[3]
                .querySelector(".processing-step-icon")
                .classList.add("bg-green-500");
              steps[3].querySelector(".fa-spinner").classList.add("hidden");
              steps[3].querySelector(".fa-check").classList.remove("hidden");

              // Generate order number
              const orderNumber = generateOrderNumber();

              // Complete processing
              setTimeout(() => {
                resolve(orderNumber);
              }, 500);
            }, 800);
          }, 700);
        }, 1000);
      }, 500);
    });
  }

  /**
   * Save payment method
   * @param {Object} cardDetails - Card details to save
   */
  function savePaymentMethod(cardDetails) {
    if (!userData) return;

    // Get card number without spaces and last 4 digits
    const cardNumber = cardDetails.cardNumber.replace(/\s+/g, "");
    const last4 = cardNumber.slice(-4);

    // Determine card type
    let cardType = "unknown";
    if (/^4/.test(cardNumber)) {
      cardType = "visa";
    } else if (/^5[1-5]/.test(cardNumber)) {
      cardType = "mastercard";
    } else if (/^3[47]/.test(cardNumber)) {
      cardType = "amex";
    } else if (/^6(?:011|5)/.test(cardNumber)) {
      cardType = "discover";
    }

    // Get expiry month and year
    const [expMonth, expYear] = cardDetails.expiryDate.split("/");

    // Create payment method object
    const paymentMethod = {
      cardType,
      last4,
      nameOnCard: cardDetails.cardName,
      expMonth,
      expYear: "20" + expYear, // Assume 20xx
      dateAdded: new Date().toISOString(),
    };

    // Add to saved payment methods
    userData.savedPaymentMethods = userData.savedPaymentMethods || [];
    userData.savedPaymentMethods.push(paymentMethod);

    // Save to localStorage
    localStorage.setItem("djinisUserProfile", JSON.stringify(userData));
  }

  /**
   * Update loyalty points
   * @param {number} points - Points to add (positive) or subtract (negative)
   */
  function updateLoyaltyPoints(points) {
    if (!userData) return;

    // Initialize loyalty points if not exists
    userData.loyaltyPoints = userData.loyaltyPoints || 0;

    // Update points
    userData.loyaltyPoints += points;

    // Ensure points don't go below 0
    if (userData.loyaltyPoints < 0) {
      userData.loyaltyPoints = 0;
    }

    // Save to localStorage
    localStorage.setItem("djinisUserProfile", JSON.stringify(userData));
  }

  /**
   * Generate a random order number
   * @returns {string} Order number
   */
  function generateOrderNumber() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
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
      const orders = JSON.parse(localStorage.getItem("djinisOrders")) || [];

      // Add new order
      orders.push({
        orderId: orderNumber,
        ...formData,
        status: "Placed",
        estimatedDelivery: formData.delivery.scheduled
          ? `Scheduled for ${formData.delivery.scheduledDate} at ${formData.delivery.scheduledTime}`
          : calculateEstimatedDelivery(formData.delivery.method),
      });

      // Save back to localStorage
      localStorage.setItem("djinisOrders", JSON.stringify(orders));
    } catch (error) {
      console.error("Error saving order:", error);
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
      case "express":
        // Add 1 hour
        estimatedTime = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case "standard":
        // Add 2-3 hours (use 2.5)
        estimatedTime = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
        break;
      case "pickup":
        // Add 30 minutes
        estimatedTime = new Date(now.getTime() + 30 * 60 * 1000);
        break;
      default:
        // Default to 2 hours
        estimatedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }

    // Format time nicely
    const options = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };

    return `Today, by ${estimatedTime.toLocaleTimeString("en-US", options)}`;
  }

  /**
   * Clear cart after successful order
   */
  function clearCart() {
    localStorage.removeItem("djinisCart");
    localStorage.removeItem("djinisCoupon");
  }

  /**
   * Helper function to debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Timeout in ms
   * @returns {Function} - Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize the checkout page
  init();
});
