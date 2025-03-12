/**
 * Djini's Bakehouse - Enhanced Cart Page JavaScript
 * Advanced cart functionality with cross-selling, save for later,
 * real-time inventory, abandoned cart recovery, and more
 *
 * Version 2.0
 */

document.addEventListener("DOMContentLoaded", function () {
  // Constants
  const TAX_RATE = 0.08; // 8% tax rate
  const SHIPPING_COST = 5.99;
  const FREE_SHIPPING_THRESHOLD = 50.0;
  const CART_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const MIN_CHECKOUT_AMOUNT = 15.0; // Minimum order amount
  const GIFT_WRAP_COST = 3.99;

  // DOM Elements - Cart
  const cartItemsContainer = document.getElementById("cart-items-container");
  const emptyCart = document.getElementById("empty-cart");
  const cartContent = document.getElementById("cart-content");
  const cartItemCount = document.getElementById("cart-item-count");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartDiscount = document.getElementById("cart-discount");
  const cartShipping = document.getElementById("cart-shipping");
  const cartTax = document.getElementById("cart-tax");
  const cartTotal = document.getElementById("cart-total");
  const updateCartBtn = document.getElementById("update-cart");
  const checkoutBtn = document.getElementById("checkout-button");
  const clearCartBtn = document.getElementById("clear-cart-button");

  // DOM Elements - Promo and Gift Options
  const promoForm = document.getElementById("promo-form");
  const promoCodeInput = document.getElementById("promo-code");
  const promoMessage = document.getElementById("promo-message");
  const giftOptionsToggle = document.getElementById("gift-options-toggle");
  const giftOptionsSection = document.getElementById("gift-options-section");
  const giftWrapCheckbox = document.getElementById("gift-wrap");
  const giftMessageTextarea = document.getElementById("gift-message");

  // DOM Elements - Added sections
  const savedForLaterContainer = document.getElementById(
    "saved-for-later-container"
  );
  const recentlyViewedContainer = document.getElementById(
    "recently-viewed-container"
  );
  const crossSellContainer = document.getElementById("cross-sell-container");
  const recommendedProducts = document.getElementById("recommended-products");
  const abandonedCartBanner = document.getElementById("abandoned-cart-banner");
  const zipCodeInput = document.getElementById("shipping-zip-code");
  const calculateShippingBtn = document.getElementById(
    "calculate-shipping-btn"
  );
  const shippingOptionsContainer = document.getElementById(
    "shipping-options-container"
  );
  const cartNotesTextarea = document.getElementById("cart-notes");

  // DOM Elements - Mobile specific
  const cartSummaryToggle = document.getElementById("cart-summary-toggle");
  const cartSummaryMobile = document.getElementById("cart-summary-mobile");

  // DOM Elements - Modals
  const confirmRemoveModal = document.getElementById("confirm-remove-modal");
  const removeItemName = document.getElementById("remove-item-name");
  const cancelRemoveBtn = document.getElementById("cancel-remove");
  const confirmRemoveBtn = document.getElementById("confirm-remove");
  const stockWarningModal = document.getElementById("stock-warning-modal");
  const stockWarningContent = document.getElementById("stock-warning-content");
  const stockWarningClose = document.getElementById("stock-warning-close");

  // DOM Elements - Notification
  const notificationToast = document.getElementById("notification-toast");
  const toastMessage = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");
  const closeToastBtn = document.getElementById("close-toast");

  // Variables
  let currentRemoveItemId = null;
  let currentRemoveAction = "remove"; // 'remove' or 'saveForLater'
  let cart = [];
  let savedForLater = [];
  let recentlyViewed = [];
  let appliedPromo = null;
  let cartNotes = "";
  let giftOptions = {
    isGift: false,
    message: "",
    wrap: false,
  };
  let inventory = {}; // Will store inventory data
  let shippingMethods = []; // Will store available shipping methods
  let selectedShippingMethod = "standard";
  let userZipCode = "";
  let lastCartInteraction = Date.now();
  let cartRecoveryTimer = null;

  /**
   * Initialize cart page
   */
  function init() {
    loadUserData();
    loadCart();
    loadSavedForLater();
    loadRecentlyViewed();
    loadInventory();
    checkAbandonedCart();
    renderCart();
    renderSavedForLater();
    renderRecentlyViewed();
    loadCrossSellProducts();
    loadRecommendedProducts();
    setupEventListeners();
    checkCartTimeout();
    checkMinimumOrderAmount();
  }

  /**
   * Load user data from localStorage
   */
  function loadUserData() {
    try {
      const userData = JSON.parse(localStorage.getItem("djinisUserProfile"));
      if (userData && userData.zipCode) {
        userZipCode = userData.zipCode;
        if (zipCodeInput) {
          zipCodeInput.value = userZipCode;
        }
        calculateShipping(userZipCode);
      }

      // Load cart notes if any
      cartNotes = localStorage.getItem("djinisCartNotes") || "";
      if (cartNotesTextarea && cartNotes) {
        cartNotesTextarea.value = cartNotes;
      }

      // Load gift options if any
      const savedGiftOptions = localStorage.getItem("djinisGiftOptions");
      if (savedGiftOptions) {
        giftOptions = JSON.parse(savedGiftOptions);

        if (giftWrapCheckbox) {
          giftWrapCheckbox.checked = giftOptions.wrap;
        }

        if (giftMessageTextarea) {
          giftMessageTextarea.value = giftOptions.message;
        }

        if (giftOptionsToggle) {
          giftOptionsToggle.checked = giftOptions.isGift;
          toggleGiftOptions();
        }
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

      // Get applied coupon
      const couponJson = localStorage.getItem("djinisCoupon");
      if (couponJson) {
        appliedPromo = JSON.parse(couponJson);

        // Display applied promo
        if (promoCodeInput && appliedPromo) {
          promoCodeInput.value = appliedPromo.code;
          showPromoMessage(
            `Coupon applied: ${
              appliedPromo.description || getPromoDescription(appliedPromo)
            }`,
            "success"
          );
        }
      }

      // Record last interaction time
      lastCartInteraction =
        parseInt(localStorage.getItem("djinisLastCartInteraction")) ||
        Date.now();
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      cart = [];
    }
  }

  /**
   * Load saved for later items
   */
  function loadSavedForLater() {
    try {
      savedForLater =
        JSON.parse(localStorage.getItem("djinisSavedForLater")) || [];
    } catch (error) {
      console.error("Error loading saved items:", error);
      savedForLater = [];
    }
  }

  /**
   * Load recently viewed products
   */
  function loadRecentlyViewed() {
    try {
      recentlyViewed =
        JSON.parse(localStorage.getItem("djinisRecentlyViewed")) || [];
    } catch (error) {
      console.error("Error loading recently viewed items:", error);
      recentlyViewed = [];
    }
  }

  /**
   * Load inventory levels (simulated)
   */
  function loadInventory() {
    // In a real app, this would be an API call
    // For demo purposes, we'll simulate inventory checking

    inventory = {
      // Simulate some items with low stock
      croissant: { stock: 3, lowStockThreshold: 5 },
      baguette: { stock: 2, lowStockThreshold: 5 },
      "sourdough-bread": { stock: 1, lowStockThreshold: 5 },
      "cinnamon-roll": { stock: 0, lowStockThreshold: 5 }, // Out of stock
    };

    // For other products, generate random stock levels
    const productIds = [
      ...cart.map((item) => item.id),
      ...savedForLater.map((item) => item.id),
    ];

    productIds.forEach((id) => {
      if (!inventory[id]) {
        inventory[id] = {
          stock: Math.floor(Math.random() * 20) + 5,
          lowStockThreshold: 5,
        };
      }
    });

    // Check for stock issues
    checkStockLevels();
  }

  /**
   * Check for stock issues in cart
   */
  function checkStockLevels() {
    const stockIssues = [];
    const updatedCart = [...cart];
    let cartUpdated = false;

    // Check each cart item against inventory
    updatedCart.forEach((item, index) => {
      const itemInventory = inventory[item.id];

      if (itemInventory) {
        // Item is out of stock
        if (itemInventory.stock === 0) {
          stockIssues.push({
            name: item.name,
            issue: "outOfStock",
            action: "removed",
          });

          // Move to saved for later
          savedForLater.push({ ...item, quantity: 1 });
          updatedCart.splice(index, 1);
          cartUpdated = true;
        }
        // Requested quantity exceeds available stock
        else if (item.quantity > itemInventory.stock) {
          stockIssues.push({
            name: item.name,
            issue: "limitedStock",
            requestedQty: item.quantity,
            availableQty: itemInventory.stock,
            action: "adjusted",
          });

          // Adjust quantity to available stock
          updatedCart[index].quantity = itemInventory.stock;
          cartUpdated = true;
        }
        // Item is low in stock (but quantity is ok)
        else if (itemInventory.stock <= itemInventory.lowStockThreshold) {
          stockIssues.push({
            name: item.name,
            issue: "lowStock",
            availableQty: itemInventory.stock,
            action: "warning",
          });
        }
      }
    });

    // Update cart if changes were made
    if (cartUpdated) {
      cart = updatedCart;
      saveCart();
      saveSavedForLater();
    }

    // Show stock warnings if any
    if (stockIssues.length > 0) {
      showStockWarning(stockIssues);
    }
  }

  /**
   * Display stock warning modal
   */
  function showStockWarning(issues) {
    if (!stockWarningModal || !stockWarningContent) return;

    let warningHTML = '<ul class="space-y-2">';

    issues.forEach((issue) => {
      if (issue.issue === "outOfStock") {
        warningHTML += `
                  <li class="flex items-start">
                      <i class="fas fa-times-circle text-red-500 mt-1 mr-2"></i>
                      <div>
                          <p class="font-medium">${issue.name} is currently out of stock</p>
                          <p class="text-sm text-gray-600">We've moved it to your "Saved for Later" list</p>
                      </div>
                  </li>
              `;
      } else if (issue.issue === "limitedStock") {
        warningHTML += `
                  <li class="flex items-start">
                      <i class="fas fa-exclamation-triangle text-amber-500 mt-1 mr-2"></i>
                      <div>
                          <p class="font-medium">Limited availability for ${issue.name}</p>
                          <p class="text-sm text-gray-600">We've adjusted the quantity from ${issue.requestedQty} to ${issue.availableQty} (our current stock)</p>
                      </div>
                  </li>
              `;
      } else if (issue.issue === "lowStock") {
        warningHTML += `
                  <li class="flex items-start">
                      <i class="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                      <div>
                          <p class="font-medium">Only ${issue.availableQty} ${issue.name} left in stock</p>
                          <p class="text-sm text-gray-600">You might want to place your order soon</p>
                      </div>
                  </li>
              `;
      }
    });

    warningHTML += "</ul>";

    stockWarningContent.innerHTML = warningHTML;
    stockWarningModal.classList.remove("hidden");
  }

  /**
   * Check for abandoned cart
   */
  function checkAbandonedCart() {
    const lastVisit =
      parseInt(localStorage.getItem("djinisLastCartInteraction")) || 0;
    const now = Date.now();

    // Check if last cart interaction was > 24 hours but < 7 days ago
    if (
      lastVisit > 0 &&
      now - lastVisit > 24 * 60 * 60 * 1000 &&
      now - lastVisit < 7 * 24 * 60 * 60 * 1000
    ) {
      if (abandonedCartBanner && cart.length > 0) {
        abandonedCartBanner.classList.remove("hidden");

        // Add last visit time
        const lastVisitDate = new Date(lastVisit);
        const lastVisitDisplay =
          abandonedCartBanner.querySelector(".last-visit-time");
        if (lastVisitDisplay) {
          lastVisitDisplay.textContent = lastVisitDate.toLocaleDateString(
            undefined,
            {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }
          );
        }
      }
    }
  }

  /**
   * Check cart timeout (inactive for 30 minutes)
   */
  function checkCartTimeout() {
    // Clear any existing timer
    if (cartRecoveryTimer) {
      clearTimeout(cartRecoveryTimer);
    }

    // Set timer to check for inactivity
    cartRecoveryTimer = setTimeout(() => {
      const timeSinceLastInteraction = Date.now() - lastCartInteraction;

      // If cart has been inactive for too long, show notification
      if (timeSinceLastInteraction >= CART_TIMEOUT) {
        showNotification(
          "Your cart session will expire soon. Please complete your order.",
          "warning"
        );
      }
    }, CART_TIMEOUT - 5 * 60 * 1000); // Show 5 minutes before timeout
  }

  /**
   * Check minimum order amount
   */
  function checkMinimumOrderAmount() {
    if (!checkoutBtn) return;

    const subtotal = calculateSubtotal();

    if (subtotal < MIN_CHECKOUT_AMOUNT) {
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add("opacity-50", "cursor-not-allowed");

      // Add minimum order message
      let minOrderMessage = document.getElementById("min-order-message");

      if (!minOrderMessage) {
        minOrderMessage = document.createElement("p");
        minOrderMessage.id = "min-order-message";
        minOrderMessage.className = "text-red-500 text-sm mt-2 text-center";
        minOrderMessage.textContent = `Minimum order amount is $${MIN_CHECKOUT_AMOUNT.toFixed(
          2
        )}`;
        checkoutBtn.parentNode.appendChild(minOrderMessage);
      }
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove("opacity-50", "cursor-not-allowed");

      // Remove minimum order message if exists
      const minOrderMessage = document.getElementById("min-order-message");
      if (minOrderMessage) {
        minOrderMessage.remove();
      }
    }
  }

  /**
   * Setup all event listeners for the cart page
   */
  function setupEventListeners() {
    // Document level event to track user interaction
    document.addEventListener("click", updateLastInteraction);
    document.addEventListener("keydown", updateLastInteraction);

    // Update cart button
    if (updateCartBtn) {
      updateCartBtn.addEventListener("click", function () {
        updateCartQuantities();
        showNotification("Cart updated successfully!", "success");
      });
    }

    // Clear cart button
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", function () {
        openClearCartConfirmation();
      });
    }

    // Promo code form
    if (promoForm) {
      promoForm.addEventListener("submit", function (event) {
        event.preventDefault();
        applyPromoCode();
      });

      // Handle enter key in promo input
      if (promoCodeInput) {
        promoCodeInput.addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            applyPromoCode();
          }
        });
      }
    }

    // Gift options toggle
    if (giftOptionsToggle) {
      giftOptionsToggle.addEventListener("change", function () {
        toggleGiftOptions();
        saveGiftOptions();
        updateOrderSummary();
      });
    }

    // Gift wrap checkbox
    if (giftWrapCheckbox) {
      giftWrapCheckbox.addEventListener("change", function () {
        giftOptions.wrap = this.checked;
        saveGiftOptions();
        updateOrderSummary();
      });
    }

    // Gift message textarea
    if (giftMessageTextarea) {
      giftMessageTextarea.addEventListener("input", function () {
        giftOptions.message = this.value;
        saveGiftOptions();
      });
    }

    // Cart notes textarea
    if (cartNotesTextarea) {
      cartNotesTextarea.addEventListener("input", function () {
        cartNotes = this.value;
        localStorage.setItem("djinisCartNotes", cartNotes);
      });
    }

    // ZIP code input
    if (zipCodeInput && calculateShippingBtn) {
      calculateShippingBtn.addEventListener("click", function (e) {
        e.preventDefault();
        const zipCode = zipCodeInput.value.trim();
        if (zipCode) {
          calculateShipping(zipCode);
        }
      });
    }

    // Close toast button
    if (closeToastBtn) {
      closeToastBtn.addEventListener("click", function () {
        hideNotification();
      });
    }

    // Cancel remove button in modal
    if (cancelRemoveBtn) {
      cancelRemoveBtn.addEventListener("click", function () {
        closeRemoveModal();
      });
    }

    // Confirm remove button in modal
    if (confirmRemoveBtn) {
      confirmRemoveBtn.addEventListener("click", function () {
        if (currentRemoveItemId) {
          if (currentRemoveAction === "remove") {
            removeCartItem(currentRemoveItemId);
          } else if (currentRemoveAction === "saveForLater") {
            moveToSavedForLater(currentRemoveItemId);
          }
          closeRemoveModal();
          showNotification(
            currentRemoveAction === "remove"
              ? "Item removed from cart"
              : "Item saved for later",
            "success"
          );
        }
      });
    }

    // Stock warning close button
    if (stockWarningClose) {
      stockWarningClose.addEventListener("click", function () {
        stockWarningModal.classList.add("hidden");
      });
    }

    // Cart summary toggle for mobile
    if (cartSummaryToggle && cartSummaryMobile) {
      cartSummaryToggle.addEventListener("click", function () {
        cartSummaryMobile.classList.toggle("hidden");

        // Toggle icon
        const icon = this.querySelector("i");
        if (icon) {
          if (icon.classList.contains("fa-chevron-down")) {
            icon.classList.remove("fa-chevron-down");
            icon.classList.add("fa-chevron-up");
          } else {
            icon.classList.remove("fa-chevron-up");
            icon.classList.add("fa-chevron-down");
          }
        }
      });
    }

    // Abandoned cart banner close
    if (abandonedCartBanner) {
      const closeButton = abandonedCartBanner.querySelector(".close-banner");
      if (closeButton) {
        closeButton.addEventListener("click", function () {
          abandonedCartBanner.classList.add("hidden");
        });
      }
    }

    // Using event delegation for dynamically created elements
    if (cartItemsContainer) {
      cartItemsContainer.addEventListener("click", function (event) {
        const target = event.target;

        // Remove item button
        if (target.closest(".remove-item-btn")) {
          const button = target.closest(".remove-item-btn");
          const itemId = button.getAttribute("data-id");
          const itemName = button.getAttribute("data-name");
          openRemoveModal(itemId, itemName, "remove");
        }

        // Save for later button
        if (target.closest(".save-for-later-btn")) {
          const button = target.closest(".save-for-later-btn");
          const itemId = button.getAttribute("data-id");
          const itemName = button.getAttribute("data-name");
          openRemoveModal(itemId, itemName, "saveForLater");
        }

        // Increase quantity button
        if (target.closest(".quantity-plus")) {
          const button = target.closest(".quantity-plus");
          const itemId = button.getAttribute("data-id");
          increaseQuantity(itemId);
        }

        // Decrease quantity button
        if (target.closest(".quantity-minus")) {
          const button = target.closest(".quantity-minus");
          const itemId = button.getAttribute("data-id");
          decreaseQuantity(itemId);
        }
      });

      // Handle quantity input changes
      cartItemsContainer.addEventListener("change", function (event) {
        if (event.target.classList.contains("quantity-input")) {
          const input = event.target;
          const itemId = input.getAttribute("data-id");
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

    // Event delegation for saved for later container
    if (savedForLaterContainer) {
      savedForLaterContainer.addEventListener("click", function (event) {
        const target = event.target;

        // Move to cart button
        if (target.closest(".move-to-cart-btn")) {
          const button = target.closest(".move-to-cart-btn");
          const itemId = button.getAttribute("data-id");
          moveToCart(itemId);
        }

        // Remove from saved button
        if (target.closest(".remove-saved-btn")) {
          const button = target.closest(".remove-saved-btn");
          const itemId = button.getAttribute("data-id");
          removeSavedItem(itemId);
        }
      });
    }

    // Event delegation for cross-sell and recommended products
    const productContainers = [
      crossSellContainer,
      recommendedProducts,
      recentlyViewedContainer,
    ];
    productContainers.forEach((container) => {
      if (container) {
        container.addEventListener("click", function (event) {
          const target = event.target;

          // Add to cart button
          if (target.closest(".add-to-cart")) {
            const button = target.closest(".add-to-cart");
            const productId = button.getAttribute("data-id");
            const productName = button.getAttribute("data-name");
            const productPrice = parseFloat(button.getAttribute("data-price"));
            const productImage = button.getAttribute("data-image") || "";

            addToCart({
              id: productId,
              name: productName,
              price: productPrice,
              image: productImage,
              quantity: 1,
            });

            // Animate the button
            button.classList.add("bg-green-500");
            button.innerHTML = '<i class="fas fa-check"></i>';

            setTimeout(() => {
              button.classList.remove("bg-green-500");
              button.innerHTML = "Add";
            }, 1500);
          }
        });
      }
    });
  }

  /**
   * Update last interaction timestamp
   */
  function updateLastInteraction() {
    lastCartInteraction = Date.now();
    localStorage.setItem(
      "djinisLastCartInteraction",
      lastCartInteraction.toString()
    );

    // Reset the timeout checker
    checkCartTimeout();
  }

  /**
   * Toggle gift options section
   */
  function toggleGiftOptions() {
    if (!giftOptionsSection || !giftOptionsToggle) return;

    if (giftOptionsToggle.checked) {
      giftOptionsSection.classList.remove("hidden");
      giftOptions.isGift = true;
    } else {
      giftOptionsSection.classList.add("hidden");
      giftOptions.isGift = false;

      // Clear gift wrap when turned off
      if (giftWrapCheckbox) {
        giftWrapCheckbox.checked = false;
        giftOptions.wrap = false;
      }
    }
  }

  /**
   * Save gift options to localStorage
   */
  function saveGiftOptions() {
    localStorage.setItem("djinisGiftOptions", JSON.stringify(giftOptions));
  }

  /**
   * Calculate shipping based on ZIP code
   */
  function calculateShipping(zipCode) {
    if (!zipCode) return;

    // Save ZIP code
    userZipCode = zipCode;

    // Show loading state
    if (shippingOptionsContainer) {
      shippingOptionsContainer.innerHTML = `
              <div class="flex justify-center py-3">
                  <i class="fas fa-spinner fa-spin text-gray-500"></i>
              </div>
          `;
      shippingOptionsContainer.classList.remove("hidden");
    }

    // Simulate API call to get shipping rates
    setTimeout(() => {
      // Simulate different rates based on ZIP code
      // In a real app, this would be an API call to a shipping provider

      // First digit of ZIP determines region (for simulation)
      const region = parseInt(zipCode.charAt(0));

      // Base shipping rates
      const baseStandard = SHIPPING_COST;
      const baseExpress = 9.99;

      // Apply regional modifier (simulated)
      let regionalModifier = 1.0;
      if (region >= 9) regionalModifier = 1.2; // West coast
      else if (region >= 7) regionalModifier = 1.1; // Mountain/Pacific
      else if (region <= 1) regionalModifier = 1.15; // Northeast

      // Calculate shipping options
      shippingMethods = [
        {
          id: "standard",
          name: "Standard Delivery (2-3 hours)",
          price: Math.round(baseStandard * regionalModifier * 100) / 100,
          eta: "2-3 hours",
        },
        {
          id: "express",
          name: "Express Delivery (1 hour)",
          price: Math.round(baseExpress * regionalModifier * 100) / 100,
          eta: "1 hour",
        },
        {
          id: "pickup",
          name: "Store Pickup",
          price: 0,
          eta: "30 minutes",
        },
      ];

      // Display shipping options
      renderShippingOptions();

      // Update order summary with new shipping cost
      updateOrderSummary();

      // Show success message
      showNotification("Shipping options updated for " + zipCode, "success");

      // Save ZIP code to user profile
      const userData =
        JSON.parse(localStorage.getItem("djinisUserProfile")) || {};
      userData.zipCode = zipCode;
      localStorage.setItem("djinisUserProfile", JSON.stringify(userData));
    }, 1000);
  }

  /**
   * Render shipping options
   */
  function renderShippingOptions() {
    if (!shippingOptionsContainer || shippingMethods.length === 0) return;

    // Clear container
    shippingOptionsContainer.innerHTML = "";

    // Create shipping options
    const shippingForm = document.createElement("div");
    shippingForm.className = "mt-4 space-y-3";

    // Add heading
    const heading = document.createElement("h3");
    heading.className = "font-medium text-gray-700";
    heading.textContent = "Available Shipping Options";
    shippingForm.appendChild(heading);

    // Add radio buttons for each shipping method
    shippingMethods.forEach((method) => {
      const isSelected = selectedShippingMethod === method.id;
      const isFree = method.price === 0;

      const optionDiv = document.createElement("div");
      optionDiv.className =
        "flex items-center justify-between p-3 border rounded-lg" +
        (isSelected ? " border-red-500 bg-red-50" : "");

      const leftSection = document.createElement("div");
      leftSection.className = "flex items-center";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "shipping-method";
      radio.id = `shipping-${method.id}`;
      radio.value = method.id;
      radio.checked = isSelected;
      radio.className = "mr-3 text-red-500 focus:ring-red-500";

      radio.addEventListener("change", () => {
        selectedShippingMethod = method.id;
        renderShippingOptions();
        updateOrderSummary();
      });

      const label = document.createElement("label");
      label.htmlFor = `shipping-${method.id}`;
      label.className = "flex flex-col";
      label.innerHTML = `
              <span class="font-medium">${method.name}</span>
              <span class="text-sm text-gray-600">Estimated arrival: ${method.eta}</span>
          `;

      const price = document.createElement("span");
      price.className = isFree ? "font-medium text-green-500" : "font-medium";
      price.textContent = isFree ? "FREE" : `$${method.price.toFixed(2)}`;

      leftSection.appendChild(radio);
      leftSection.appendChild(label);

      optionDiv.appendChild(leftSection);
      optionDiv.appendChild(price);

      shippingForm.appendChild(optionDiv);
    });

    shippingOptionsContainer.appendChild(shippingForm);
  }

  /**
   * Get current shipping cost based on selected method
   */
  function getShippingCost() {
    // Check for free shipping coupon
    if (
      appliedPromo &&
      appliedPromo.type === "shipping" &&
      appliedPromo.value === "free"
    ) {
      return 0;
    }

    // Check for free shipping threshold
    const subtotal = calculateSubtotal();
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }

    // Get selected shipping method cost
    const selectedMethod = shippingMethods.find(
      (method) => method.id === selectedShippingMethod
    );
    return selectedMethod ? selectedMethod.price : SHIPPING_COST;
  }

  /**
   * Render cart items and summary
   */
  function renderCart() {
    if (!cartItemsContainer) return;

    // Check if cart is empty
    if (cart.length === 0) {
      if (emptyCart) emptyCart.classList.remove("hidden");
      if (cartContent) cartContent.classList.add("hidden");
      return;
    }

    // Show cart content, hide empty cart message
    if (emptyCart) emptyCart.classList.add("hidden");
    if (cartContent) cartContent.classList.remove("hidden");

    // Update cart item count
    if (cartItemCount) {
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      cartItemCount.textContent = totalItems;
    }

    // Clear cart items container
    cartItemsContainer.innerHTML = "";

    // Render each cart item
    cart.forEach((item) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      const itemInventory = inventory[item.id] || {
        stock: 999,
        lowStockThreshold: 5,
      };
      const isLowStock = itemInventory.stock <= itemInventory.lowStockThreshold;

      const cartItemEl = document.createElement("div");
      cartItemEl.className =
        "p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b hover:bg-gray-50 transition";
      cartItemEl.setAttribute("data-id", item.id);

      let lowStockWarning = "";
      if (isLowStock && itemInventory.stock > 0) {
        lowStockWarning = `
                  <div class="text-sm text-orange-600 mt-1 flex items-center">
                      <i class="fas fa-exclamation-circle mr-1"></i>
                      Only ${itemInventory.stock} left in stock
                  </div>
              `;
      }

      cartItemEl.innerHTML = `
              <div class="flex items-center mb-4 sm:mb-0">
                  <div class="flex space-x-3">
                      <button class="remove-item-btn text-gray-400 hover:text-red-500 transition-colors" 
                              data-id="${item.id}" 
                              data-name="${item.name}" 
                              aria-label="Remove ${item.name} from cart">
                          <i class="fas fa-times"></i>
                      </button>
                      <button class="save-for-later-btn text-gray-400 hover:text-blue-500 transition-colors" 
                              data-id="${item.id}" 
                              data-name="${item.name}" 
                              aria-label="Save ${item.name} for later">
                          <i class="fas fa-bookmark"></i>
                      </button>
                  </div>
                  <div class="flex items-center ml-4">
                      ${
                        item.image
                          ? `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg mr-4">`
                          : `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <i class="fas fa-cookie text-gray-400 text-3xl"></i>
                      </div>`
                      }
                      <div>
                          <h3 class="font-semibold text-gray-800">${
                            item.name
                          }</h3>
                          <p class="text-gray-600 text-sm mt-1">$${item.price.toFixed(
                            2
                          )} each</p>
                          ${lowStockWarning}
                      </div>
                  </div>
              </div>
              <div class="flex items-center">
                  <div class="flex items-center border rounded-lg mr-6 quantity-control">
                      <button class="quantity-minus px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600" 
                              data-id="${item.id}">-</button>
                      <input type="number" min="1" max="${
                        itemInventory.stock
                      }" value="${item.quantity}" 
                             class="quantity-input w-12 py-1 text-center border-x focus:outline-none" data-id="${
                               item.id
                             }">
                      <button class="quantity-plus px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600" 
                              data-id="${item.id}" ${
        item.quantity >= itemInventory.stock ? "disabled" : ""
      }>+</button>
                  </div>
                  <span class="font-semibold text-gray-800 w-20 text-right">$${itemTotal}</span>
              </div>
          `;

      cartItemsContainer.appendChild(cartItemEl);

      // Apply fade-in animation
      setTimeout(() => {
        cartItemEl.classList.add("fade-in");
      }, 100);
    });

    // Calculate order summary
    updateOrderSummary();
  }

  /**
   * Render saved for later items
   */
  function renderSavedForLater() {
    if (!savedForLaterContainer) return;

    // Check if there are saved items
    if (savedForLater.length === 0) {
      savedForLaterContainer.classList.add("hidden");
      return;
    }

    // Show saved for later section
    savedForLaterContainer.classList.remove("hidden");

    // Get the items container
    let itemsContainer = savedForLaterContainer.querySelector(".saved-items");
    if (!itemsContainer) {
      const heading = document.createElement("h2");
      heading.className = "text-xl font-bold text-gray-800 mb-4";
      heading.textContent = "Saved For Later";
      savedForLaterContainer.appendChild(heading);

      itemsContainer = document.createElement("div");
      itemsContainer.className = "saved-items space-y-4";
      savedForLaterContainer.appendChild(itemsContainer);
    } else {
      itemsContainer.innerHTML = "";
    }

    // Render each saved item
    savedForLater.forEach((item) => {
      const savedItemEl = document.createElement("div");
      savedItemEl.className =
        "p-4 border rounded-lg flex justify-between items-center bg-white hover:shadow-sm transition";

      const itemInventory = inventory[item.id] || { stock: 999 };
      const isInStock = itemInventory.stock > 0;

      savedItemEl.innerHTML = `
              <div class="flex items-center">
                  ${
                    item.image
                      ? `<img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-4">`
                      : `<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mr-4">
                      <i class="fas fa-cookie text-gray-400 text-2xl"></i>
                  </div>`
                  }
                  <div>
                      <h3 class="font-medium text-gray-800">${item.name}</h3>
                      <p class="text-red-500 font-medium">$${item.price.toFixed(
                        2
                      )}</p>
                      ${
                        !isInStock
                          ? `
                          <p class="text-red-500 text-sm">
                              <i class="fas fa-times-circle mr-1"></i>
                              Out of stock
                          </p>
                      `
                          : ""
                      }
                  </div>
              </div>
              <div class="flex space-x-2">
                  <button class="move-to-cart-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center text-sm"
                          data-id="${item.id}" ${
        !isInStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ""
      }>
                      <i class="fas fa-shopping-cart mr-1"></i> Add to Cart
                  </button>
                  <button class="remove-saved-btn p-1 text-gray-400 hover:text-red-500 transition"
                          data-id="${item.id}">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          `;

      itemsContainer.appendChild(savedItemEl);
    });
  }

  /**
   * Render recently viewed products
   */
  function renderRecentlyViewed() {
    if (!recentlyViewedContainer) return;

    // Check if there are recently viewed items
    if (recentlyViewed.length === 0) {
      recentlyViewedContainer.classList.add("hidden");
      return;
    }

    // Get recently viewed items that are not in cart
    const cartItemIds = cart.map((item) => item.id);
    const filteredRecentlyViewed = recentlyViewed
      .filter((item) => !cartItemIds.includes(item.id))
      .slice(0, 4); // Limit to 4 items

    if (filteredRecentlyViewed.length === 0) {
      recentlyViewedContainer.classList.add("hidden");
      return;
    }

    // Show recently viewed section
    recentlyViewedContainer.classList.remove("hidden");

    // Clear container
    recentlyViewedContainer.innerHTML = `
          <h2 class="text-xl font-bold text-gray-800 mb-4">Recently Viewed</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 recently-viewed-grid"></div>
      `;

    const grid = recentlyViewedContainer.querySelector(".recently-viewed-grid");

    // Render each recently viewed item
    filteredRecentlyViewed.forEach((product) => {
      const productEl = document.createElement("div");
      productEl.className =
        "bg-white rounded-lg shadow-md overflow-hidden product-card";
      productEl.innerHTML = `
              <div class="h-40 bg-gray-200 relative overflow-hidden">
                  ${
                    product.image
                      ? `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition-transform hover:scale-105">`
                      : `<div class="w-full h-full flex items-center justify-center">
                          <i class="fas fa-cookie-bite text-gray-400 text-4xl"></i>
                      </div>`
                  }
              </div>
              <div class="p-4">
                  <h3 class="font-medium text-gray-800 mb-2 line-clamp-2">${
                    product.name
                  }</h3>
                  <div class="flex justify-between items-center">
                      <span class="text-red-500 font-bold">$${product.price.toFixed(
                        2
                      )}</span>
                      <button class="add-to-cart bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                              data-id="${product.id}" 
                              data-name="${product.name}" 
                              data-price="${product.price}"
                              ${
                                product.image
                                  ? `data-image="${product.image}"`
                                  : ""
                              }>
                          Add
                      </button>
                  </div>
              </div>
          `;

      grid.appendChild(productEl);
    });
  }

  /**
   * Load cross-selling products based on cart items
   */
  function loadCrossSellProducts() {
    if (!crossSellContainer || cart.length === 0) return;

    // In a real app, this would be an API call to get recommended cross-sell products
    // For demo purposes, we'll simulate cross-sell recommendations

    // Clear container and add heading
    crossSellContainer.innerHTML = `
          <h2 class="text-xl font-bold text-gray-800 mb-4">Frequently Bought Together</h2>
          <div class="cross-sell-items space-y-4"></div>
      `;

    const itemsContainer =
      crossSellContainer.querySelector(".cross-sell-items");

    // Cross-sell product mappings (in a real app, this would come from a recommendation engine)
    const crossSellMappings = {
      croissant: [
        {
          id: "coffee",
          name: "Fresh Brewed Coffee",
          price: 2.99,
          image: "../images/Coffee.jpg",
        },
        {
          id: "butter",
          name: "French Butter",
          price: 4.99,
          image: "../images/Butter.jpg",
        },
      ],
      "chocolate-chip-cookie": [
        {
          id: "milk",
          name: "Cold Milk",
          price: 1.99,
          image: "../images/Milk.jpg",
        },
        {
          id: "ice-cream",
          name: "Vanilla Ice Cream",
          price: 3.99,
          image: "../images/Ice Cream.jpg",
        },
      ],
      baguette: [
        {
          id: "cheese",
          name: "Artisan Cheese Platter",
          price: 8.99,
          image: "../images/Cheese.jpg",
        },
        {
          id: "jam",
          name: "Organic Strawberry Jam",
          price: 5.99,
          image: "../images/Jam.jpg",
        },
      ],
      "cinnamon-roll": [
        {
          id: "coffee",
          name: "Fresh Brewed Coffee",
          price: 2.99,
          image: "../images/Coffee.jpg",
        },
        {
          id: "cream-cheese",
          name: "Cream Cheese Frosting",
          price: 3.49,
          image: "../images/Cream Cheese.jpg",
        },
      ],
    };

    // Get all potential cross-sells for cart items
    const cartItemIds = cart.map((item) => item.id);
    let allCrossSells = [];

    cartItemIds.forEach((itemId) => {
      if (crossSellMappings[itemId]) {
        allCrossSells = [...allCrossSells, ...crossSellMappings[itemId]];
      }
    });

    // Remove duplicates and items already in cart
    const uniqueCrossSells = allCrossSells.filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.id === product.id) &&
        !cartItemIds.includes(product.id)
    );

    // Limit to 3 cross-sells
    const displayCrossSells = uniqueCrossSells.slice(0, 3);

    if (displayCrossSells.length === 0) {
      crossSellContainer.classList.add("hidden");
      return;
    }

    // Show cross-sell section
    crossSellContainer.classList.remove("hidden");

    // Build and display the bundle
    const bundleContainer = document.createElement("div");
    bundleContainer.className = "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6";

    // Add each cross-sell product
    displayCrossSells.forEach((product) => {
      const productEl = document.createElement("div");
      productEl.className =
        "flex items-center bg-white p-4 rounded-lg border transition hover:shadow-sm";
      productEl.innerHTML = `
              <div class="flex-shrink-0 mr-4">
                  ${
                    product.image
                      ? `<img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded">`
                      : `<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <i class="fas fa-utensils text-gray-400 text-xl"></i>
                      </div>`
                  }
              </div>
              <div class="flex-grow">
                  <h3 class="font-medium text-gray-800">${product.name}</h3>
                  <div class="flex justify-between items-center mt-2">
                      <span class="text-red-500 font-medium">$${product.price.toFixed(
                        2
                      )}</span>
                      <button class="add-to-cart bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                              data-id="${product.id}" 
                              data-name="${product.name}" 
                              data-price="${product.price}"
                              ${
                                product.image
                                  ? `data-image="${product.image}"`
                                  : ""
                              }>
                          Add
                      </button>
                  </div>
              </div>
          `;

      bundleContainer.appendChild(productEl);
    });

    itemsContainer.appendChild(bundleContainer);

    // Add "Add All to Cart" button if there are multiple cross-sells
    if (displayCrossSells.length > 1) {
      const totalBundlePrice = displayCrossSells.reduce(
        (total, product) => total + product.price,
        0
      );

      const addAllButton = document.createElement("div");
      addAllButton.className = "text-center";
      addAllButton.innerHTML = `
              <button id="add-bundle" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                  Add All for $${totalBundlePrice.toFixed(2)}
              </button>
          `;

      itemsContainer.appendChild(addAllButton);

      // Add event listener for "Add All" button
      document
        .getElementById("add-bundle")
        .addEventListener("click", function () {
          // Add all cross-sell items to cart
          displayCrossSells.forEach((product) => {
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image || "",
              quantity: 1,
            });
          });

          // Show success message
          showNotification("Bundle added to cart!", "success");

          // Change button text temporarily
          this.innerHTML = 'Added! <i class="fas fa-check ml-1"></i>';
          this.classList.add("bg-green-500");

          setTimeout(() => {
            this.innerHTML = `Add All for $${totalBundlePrice.toFixed(2)}`;
            this.classList.remove("bg-green-500");
          }, 2000);
        });
    }
  }

  /**
   * Load recommended products based on shopping patterns
   */
  function loadRecommendedProducts() {
    if (!recommendedProducts) return;

    // In a real app, this would be an API call to get personalized recommendations
    // For demo purposes, we'll use static product recommendations

    const recommendedItems = [
      {
        id: "cinnamon-roll",
        name: "Cinnamon Roll",
        price: 4.5,
        image: "../images/Cinnamon Roll.jpg",
      },
      {
        id: "chocolate-chip-cookie",
        name: "Chocolate Chip Cookie",
        price: 2.75,
        image: "../images/Chocolate Chip Cookie.jpg",
      },
      {
        id: "blueberry-muffin",
        name: "Blueberry Muffin",
        price: 3.25,
        image: "../images/Blueberry Muffin.jpg",
      },
      {
        id: "sourdough-bread",
        name: "Sourdough Bread",
        price: 6.99,
        image: "../images/Sourdough Bread.jpg",
      },
    ];

    // Remove items already in cart
    const cartItemIds = cart.map((item) => item.id);
    const filteredRecommendations = recommendedItems.filter(
      (item) => !cartItemIds.includes(item.id)
    );

    if (filteredRecommendations.length === 0) {
      recommendedProducts.classList.add("hidden");
      return;
    }

    // Clear container and add heading
    recommendedProducts.innerHTML = `
          <h2 class="text-xl font-bold text-gray-800 mb-4">You Might Also Like</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 recommended-grid"></div>
      `;

    const grid = recommendedProducts.querySelector(".recommended-grid");

    // Add recommended products
    filteredRecommendations.forEach((product) => {
      const productEl = document.createElement("div");
      productEl.className =
        "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow product-card";
      productEl.innerHTML = `
              <div class="h-40 bg-gray-200 relative overflow-hidden">
                  ${
                    product.image
                      ? `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition-transform hover:scale-105">`
                      : `<div class="w-full h-full flex items-center justify-center">
                          <i class="fas fa-cookie-bite text-gray-400 text-4xl"></i>
                      </div>`
                  }
              </div>
              <div class="p-4">
                  <h3 class="font-medium text-gray-800 mb-2">${
                    product.name
                  }</h3>
                  <div class="flex justify-between items-center">
                      <span class="text-red-500 font-bold">$${product.price.toFixed(
                        2
                      )}</span>
                      <button class="add-to-cart bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                              data-id="${product.id}" 
                              data-name="${product.name}" 
                              data-price="${product.price}"
                              ${
                                product.image
                                  ? `data-image="${product.image}"`
                                  : ""
                              }>
                          Add
                      </button>
                  </div>
              </div>
          `;

      grid.appendChild(productEl);
    });
  }

  /**
   * Get promo code description
   */
  function getPromoDescription(promo) {
    if (!promo) return "";

    if (promo.type === "percentage") {
      return `${promo.value}% off your order`;
    } else if (promo.type === "fixed") {
      return `$${promo.value} off your order`;
    } else if (promo.type === "shipping" && promo.value === "free") {
      return "Free shipping";
    } else if (promo.type === "bogo") {
      return "Buy one get one free";
    }

    return "";
  }

  /**
   * Calculate subtotal
   */
  function calculateSubtotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  /**
   * Update order summary calculations
   */
  function updateOrderSummary() {
    // Calculate subtotal
    const subtotal = calculateSubtotal();
    if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);

    // Apply coupon/discount if any
    let discount = 0;

    if (appliedPromo) {
      if (appliedPromo.type === "percentage") {
        discount = subtotal * (appliedPromo.value / 100);
      } else if (appliedPromo.type === "fixed") {
        discount = Math.min(appliedPromo.value, subtotal); // Don't allow discount > subtotal
      }
      // Shipping discounts are handled in getShippingCost()
    }

    // Display discount if any
    const discountRow = document.getElementById("discount-row");
    if (discountRow) {
      if (discount > 0) {
        discountRow.classList.remove("hidden");
        if (cartDiscount) cartDiscount.textContent = discount.toFixed(2);
      } else {
        discountRow.classList.add("hidden");
      }
    }

    // Calculate shipping
    const shipping = getShippingCost();
    if (cartShipping) {
      cartShipping.textContent = shipping === 0 ? "0.00" : shipping.toFixed(2);
    }

    // Display gift wrap fee if selected
    const giftWrapRow = document.getElementById("gift-wrap-row");
    if (giftWrapRow) {
      if (giftOptions.wrap) {
        giftWrapRow.classList.remove("hidden");
        const giftWrapFee = document.getElementById("gift-wrap-fee");
        if (giftWrapFee) {
          giftWrapFee.textContent = GIFT_WRAP_COST.toFixed(2);
        }
      } else {
        giftWrapRow.classList.add("hidden");
      }
    }

    // Calculate tax (applied after discount)
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * TAX_RATE;
    if (cartTax) cartTax.textContent = tax.toFixed(2);

    // Calculate total
    const giftWrapFee = giftOptions.wrap ? GIFT_WRAP_COST : 0;
    const total = subtotal - discount + shipping + tax + giftWrapFee;
    if (cartTotal) cartTotal.textContent = total.toFixed(2);

    // Check if cart meets minimum order amount
    checkMinimumOrderAmount();

    // Disable checkout button if cart is empty
    if (checkoutBtn) {
      checkoutBtn.disabled = cart.length === 0;
      if (cart.length === 0) {
        checkoutBtn.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        checkoutBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
  }

  /**
   * Apply a promo code to the cart
   */
  function applyPromoCode() {
    if (!promoCodeInput || !promoMessage) return;

    const code = promoCodeInput.value.trim().toUpperCase();
    if (!code) {
      showPromoMessage("Please enter a promo code", "error");
      return;
    }

    // If the same code is already applied, show notification
    if (appliedPromo && appliedPromo.code === code) {
      showPromoMessage("This promo code is already applied", "warning");
      return;
    }

    // Available promo codes
    const promoCodes = {
      WELCOME10: {
        type: "percentage",
        value: 10,
        description: "10% off your order",
      },
      SAVE20: {
        type: "percentage",
        value: 20,
        description: "20% off your order",
      },
      FREESHIP: {
        type: "shipping",
        value: "free",
        description: "Free shipping",
      },
      "5DOLLARS": { type: "fixed", value: 5, description: "$5 off your order" },
      SPRING25: {
        type: "percentage",
        value: 25,
        description: "25% off your order",
      },
      BDAY15: { type: "fixed", value: 15, description: "$15 off your order" },
      LOYALTY: {
        type: "percentage",
        value: 15,
        description: "15% off for loyalty members",
      },
    };

    // Show loading state
    const applyButton = document.querySelector("#promo-form button");
    if (applyButton) {
      const originalText = applyButton.innerHTML;
      applyButton.disabled = true;
      applyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      // Simulate API call to validate promo code
      setTimeout(() => {
        // Reset button
        applyButton.disabled = false;
        applyButton.innerHTML = originalText;

        // Check if code is valid
        if (promoCodes[code]) {
          // Remove any existing promo
          if (appliedPromo) {
            showNotification(
              `Replaced promo code "${appliedPromo.code}" with "${code}"`,
              "info"
            );
          }

          // Apply new promo
          appliedPromo = {
            code: code,
            ...promoCodes[code],
          };

          // Save coupon to localStorage
          localStorage.setItem("djinisCoupon", JSON.stringify(appliedPromo));

          // Show success message and update summary
          showPromoMessage(
            `Coupon applied: ${appliedPromo.description}`,
            "success"
          );
          updateOrderSummary();

          // Add animation to the promo code input
          promoCodeInput.classList.add("border-green-500");
          setTimeout(() => {
            promoCodeInput.classList.remove("border-green-500");
          }, 2000);
        } else {
          showPromoMessage("Invalid promo code. Please try again.", "error");

          // Add animation to the promo code input
          promoCodeInput.classList.add("border-red-500");
          setTimeout(() => {
            promoCodeInput.classList.remove("border-red-500");
          }, 2000);
        }
      }, 800); // Simulate API delay
    }
  }

  /**
   * Display promo code status message
   */
  function showPromoMessage(message, type) {
    if (!promoMessage) return;

    promoMessage.textContent = message;
    promoMessage.classList.remove(
      "hidden",
      "text-green-600",
      "text-red-600",
      "text-amber-600"
    );

    if (type === "success") {
      promoMessage.classList.add("text-green-600");
    } else if (type === "error") {
      promoMessage.classList.add("text-red-600");
    } else if (type === "warning") {
      promoMessage.classList.add("text-amber-600");
    }

    promoMessage.classList.remove("hidden");

    // Add promo code remove button if success
    if (type === "success") {
      const removeButton = document.createElement("button");
      removeButton.className = "text-gray-500 hover:text-red-500 ml-2";
      removeButton.innerHTML = '<i class="fas fa-times"></i>';
      removeButton.setAttribute("aria-label", "Remove promo code");

      removeButton.addEventListener("click", () => {
        // Remove promo code
        localStorage.removeItem("djinisCoupon");
        appliedPromo = null;
        promoCodeInput.value = "";
        promoMessage.textContent = "Promo code removed";
        promoMessage.classList.remove("text-green-600", "text-red-600");
        promoMessage.classList.add("text-gray-600");

        // Remove the button itself
        removeButton.remove();

        // Update order summary
        updateOrderSummary();

        // Hide message after 3 seconds
        setTimeout(() => {
          promoMessage.classList.add("hidden");
        }, 3000);
      });

      // Add button to message
      promoMessage.appendChild(removeButton);
    } else {
      // Auto hide after 5 seconds for non-success messages
      setTimeout(() => {
        promoMessage.classList.add("hidden");
      }, 5000);
    }
  }

  /**
   * Increase the quantity of an item in the cart
   */
  function increaseQuantity(itemId) {
    const itemIndex = cart.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      // Check stock level
      const item = cart[itemIndex];
      const itemInventory = inventory[itemId] || { stock: 999 };

      if (item.quantity < itemInventory.stock) {
        cart[itemIndex].quantity += 1;
        saveCart();
        renderCart();
        updateLastInteraction();
      } else {
        // Show stock limit notification
        showNotification(
          `Sorry, only ${itemInventory.stock} of this item available`,
          "warning"
        );
      }
    }
  }

  /**
   * Decrease the quantity of an item in the cart
   */
  function decreaseQuantity(itemId) {
    const itemIndex = cart.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
        saveCart();
        renderCart();
        updateLastInteraction();
      } else {
        // If quantity would be 0, ask to remove item
        const itemName = cart[itemIndex].name;
        openRemoveModal(itemId, itemName, "remove");
      }
    }
  }

  /**
   * Update the quantity of an item in the cart
   */
  function updateQuantity(itemId, quantity) {
    const itemIndex = cart.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      // Check stock level
      const itemInventory = inventory[itemId] || { stock: 999 };

      if (quantity <= itemInventory.stock) {
        cart[itemIndex].quantity = quantity;
        saveCart();
        renderCart();
        updateLastInteraction();
      } else {
        // Adjust to max stock
        cart[itemIndex].quantity = itemInventory.stock;
        saveCart();
        renderCart();

        // Show stock limit notification
        showNotification(
          `Sorry, only ${itemInventory.stock} of this item available`,
          "warning"
        );
      }
    }
  }

  /**
   * Update all cart quantities based on input values
   */
  function updateCartQuantities() {
    const quantityInputs = document.querySelectorAll(".quantity-input");
    let updated = false;

    quantityInputs.forEach((input) => {
      const itemId = input.getAttribute("data-id");
      const newQuantity = parseInt(input.value);

      if (newQuantity > 0) {
        const itemIndex = cart.findIndex((item) => item.id === itemId);

        if (itemIndex !== -1) {
          // Check stock level
          const itemInventory = inventory[itemId] || { stock: 999 };
          const finalQuantity = Math.min(newQuantity, itemInventory.stock);

          if (cart[itemIndex].quantity !== finalQuantity) {
            cart[itemIndex].quantity = finalQuantity;
            updated = true;

            // Show warning if adjusted
            if (finalQuantity < newQuantity) {
              showNotification(
                `Quantity for ${cart[itemIndex].name} adjusted to available stock (${finalQuantity})`,
                "warning"
              );
            }
          }
        }
      } else {
        // Reset to 1 if invalid
        input.value = 1;
        const itemIndex = cart.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1 && cart[itemIndex].quantity !== 1) {
          cart[itemIndex].quantity = 1;
          updated = true;
        }
      }
    });

    if (updated) {
      saveCart();
      renderCart();
      updateLastInteraction();
    }
  }

  /**
   * Remove an item from the cart
   */
  function removeCartItem(itemId) {
    // Get the item before removing (for animation)
    const itemElement = document.querySelector(`[data-id="${itemId}"]`);
    if (itemElement) {
      itemElement.classList.add("fade-out");

      // Delay removal to allow animation to complete
      setTimeout(() => {
        cart = cart.filter((item) => item.id !== itemId);
        saveCart();
        renderCart();
        updateLastInteraction();

        // Update cart count in header
        updateCartCount();
      }, 300);
    } else {
      // No animation if element not found
      cart = cart.filter((item) => item.id !== itemId);
      saveCart();
      renderCart();
      updateLastInteraction();

      // Update cart count in header
      updateCartCount();
    }
  }

  /**
   * Add an item to the cart
   */
  function addToCart(item) {
    // Check if already in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      // Increase quantity if already in cart
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.push(item);
    }

    // Save and render cart
    saveCart();
    renderCart();
    updateLastInteraction();

    // Update cart count in header
    updateCartCount();

    // Show notification
    showNotification(`${item.name} added to cart!`, "success");
  }

  /**
   * Move an item to saved for later
   */
  function moveToSavedForLater(itemId) {
    const itemIndex = cart.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const item = cart[itemIndex];

      // Add to saved for later list
      // Set quantity to 1 when saving for later
      savedForLater.push({ ...item, quantity: 1 });

      // Remove from cart
      cart.splice(itemIndex, 1);

      // Save changes
      saveCart();
      saveSavedForLater();

      // Re-render
      renderCart();
      renderSavedForLater();
      updateLastInteraction();

      // Update cart count in header
      updateCartCount();
    }
  }

  /**
   * Move an item from saved for later to cart
   */
  function moveToCart(itemId) {
    const itemIndex = savedForLater.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const item = savedForLater[itemIndex];

      // Check inventory
      const itemInventory = inventory[itemId] || { stock: 999 };

      if (itemInventory.stock === 0) {
        showNotification(
          `Sorry, ${item.name} is currently out of stock`,
          "error"
        );
        return;
      }

      // Check if already in cart
      const existingItemIndex = cart.findIndex(
        (cartItem) => cartItem.id === itemId
      );

      if (existingItemIndex !== -1) {
        // Increase quantity if already in cart
        cart[existingItemIndex].quantity += 1;
      } else {
        // Add to cart
        cart.push({ ...item, quantity: 1 });
      }

      // Remove from saved for later
      savedForLater.splice(itemIndex, 1);

      // Save changes
      saveCart();
      saveSavedForLater();

      // Re-render
      renderCart();
      renderSavedForLater();
      updateLastInteraction();

      // Update cart count in header
      updateCartCount();

      // Show notification
      showNotification(`${item.name} added to cart`, "success");
    }
  }

  /**
   * Remove an item from saved for later
   */
  function removeSavedItem(itemId) {
    savedForLater = savedForLater.filter((item) => item.id !== itemId);
    saveSavedForLater();
    renderSavedForLater();
  }

  /**
   * Open confirmation for clearing the entire cart
   */
  function openClearCartConfirmation() {
    // Create modal if not exists
    let confirmModal = document.getElementById("clear-cart-modal");

    if (!confirmModal) {
      confirmModal = document.createElement("div");
      confirmModal.id = "clear-cart-modal";
      confirmModal.className =
        "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40 hidden";

      confirmModal.innerHTML = `
              <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 sm:mx-auto">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Clear Your Cart?</h3>
                  <p class="text-gray-600 mb-6">Are you sure you want to remove all items from your cart?</p>
                  <div class="flex justify-end space-x-4">
                      <button id="cancel-clear-cart" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                          Cancel
                      </button>
                      <button id="confirm-clear-cart" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                          Clear Cart
                      </button>
                  </div>
              </div>
          `;

      document.body.appendChild(confirmModal);

      // Add event listeners
      document
        .getElementById("cancel-clear-cart")
        .addEventListener("click", () => {
          confirmModal.classList.add("hidden");
        });

      document
        .getElementById("confirm-clear-cart")
        .addEventListener("click", () => {
          // Clear cart
          cart = [];
          saveCart();
          renderCart();
          updateLastInteraction();
          updateCartCount();

          // Hide modal
          confirmModal.classList.add("hidden");

          // Show notification
          showNotification("Your cart has been cleared", "info");
        });
    }

    // Show modal
    confirmModal.classList.remove("hidden");
  }

  /**
   * Update cart count in header
   */
  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll(".cart-count");

    cartCountElements.forEach((element) => {
      element.textContent = totalItems;
      if (totalItems === 0) {
        element.classList.add("invisible");
      } else {
        element.classList.remove("invisible");
      }
    });
  }

  /**
   * Save cart to localStorage
   */
  function saveCart() {
    try {
      localStorage.setItem("djinisCart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart:", error);
      showNotification("There was an error saving your cart", "error");
    }
  }

  /**
   * Save saved for later items to localStorage
   */
  function saveSavedForLater() {
    try {
      localStorage.setItem(
        "djinisSavedForLater",
        JSON.stringify(savedForLater)
      );
    } catch (error) {
      console.error("Error saving items for later:", error);
    }
  }

  /**
   * Open the remove item confirmation modal
   */
  function openRemoveModal(itemId, itemName, action) {
    if (!confirmRemoveModal || !removeItemName) return;

    currentRemoveItemId = itemId;
    currentRemoveAction = action;

    // Set modal title and message based on action
    const modalTitle = document.getElementById("remove-modal-title");
    if (modalTitle) {
      modalTitle.textContent =
        action === "remove" ? "Remove Item?" : "Save for Later?";
    }

    removeItemName.textContent = itemName;

    // Update button text
    if (confirmRemoveBtn) {
      confirmRemoveBtn.textContent =
        action === "remove" ? "Remove" : "Save for Later";
    }

    confirmRemoveModal.classList.remove("hidden");

    // Close modal if clicked outside
    document.addEventListener("click", closeModalOnOutsideClick);

    // Close modal on escape key
    document.addEventListener("keydown", closeModalOnEscape);
  }

  /**
   * Close the remove item confirmation modal
   */
  function closeRemoveModal() {
    if (!confirmRemoveModal) return;

    confirmRemoveModal.classList.add("hidden");
    currentRemoveItemId = null;
    currentRemoveAction = "remove";

    // Remove event listeners
    document.removeEventListener("click", closeModalOnOutsideClick);
    document.removeEventListener("keydown", closeModalOnEscape);
  }

  /**
   * Close modal when clicking outside
   */
  function closeModalOnOutsideClick(event) {
    if (
      confirmRemoveModal &&
      !confirmRemoveModal.contains(event.target) &&
      !event.target.closest(".remove-item-btn") &&
      !event.target.closest(".save-for-later-btn") &&
      !event.target.closest(".quantity-minus")
    ) {
      closeRemoveModal();
    }
  }

  /**
   * Close modal on escape key
   */
  function closeModalOnEscape(event) {
    if (event.key === "Escape") {
      closeRemoveModal();
    }
  }

  /**
   * Show notification toast
   */
  function showNotification(message, type = "success") {
    if (!notificationToast || !toastMessage || !toastIcon) return;

    toastMessage.textContent = message;

    // Set icon based on type
    toastIcon.className = "p-2 rounded-full mr-3";

    if (type === "success") {
      toastIcon.classList.add("bg-green-100");
      toastIcon.innerHTML = '<i class="fas fa-check text-green-600"></i>';
      notificationToast.classList.remove(
        "bg-red-100",
        "bg-yellow-100",
        "bg-blue-100"
      );
      notificationToast.classList.add("bg-green-50");
    } else if (type === "error") {
      toastIcon.classList.add("bg-red-100");
      toastIcon.innerHTML = '<i class="fas fa-times text-red-600"></i>';
      notificationToast.classList.remove(
        "bg-green-100",
        "bg-yellow-100",
        "bg-blue-100"
      );
      notificationToast.classList.add("bg-red-50");
    } else if (type === "warning") {
      toastIcon.classList.add("bg-yellow-100");
      toastIcon.innerHTML =
        '<i class="fas fa-exclamation-triangle text-yellow-600"></i>';
      notificationToast.classList.remove(
        "bg-green-100",
        "bg-red-100",
        "bg-blue-100"
      );
      notificationToast.classList.add("bg-yellow-50");
    } else if (type === "info") {
      toastIcon.classList.add("bg-blue-100");
      toastIcon.innerHTML = '<i class="fas fa-info-circle text-blue-600"></i>';
      notificationToast.classList.remove(
        "bg-green-100",
        "bg-red-100",
        "bg-yellow-100"
      );
      notificationToast.classList.add("bg-blue-50");
    }

    // Show notification
    notificationToast.classList.remove("hidden");

    // Add slide-in animation
    notificationToast.classList.add("notification-slide-in");

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
      notificationToast.classList.remove("notification-slide-in");
      notificationToast.classList.add("notification-slide-out");

      // Wait for animation to complete
      setTimeout(() => {
        notificationToast.classList.add("hidden");
        notificationToast.classList.remove("notification-slide-out");
      }, 300);
    }
  }

  // Initialize the cart page
  init();
});
