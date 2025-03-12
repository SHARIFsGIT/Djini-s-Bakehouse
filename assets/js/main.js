/**
 * Main JavaScript file for Djini's Bakehouse website
 *
 * Contains initialization for all UI components, sliders, animations,
 * and general website functionality.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS animations
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    mirror: false,
  });

  // Initialize Swiper sliders
  initializeSliders();

  // Initialize UI components
  initializeUIComponents();

  // Initialize event listeners
  initializeEventListeners();

  // Initialize countdown timers
  initializeCountdownTimers();

  // Handle back to top button
  handleBackToTop();
});

/**
 * Initialize all Swiper slider instances
 */
function initializeSliders() {
  // Featured products slider
  if (document.querySelector(".featured-products")) {
    new Swiper(".featured-products", {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
        1280: {
          slidesPerView: 4,
        },
      },
    });
  }

  // Testimonials slider
  if (document.querySelector(".testimonials-slider")) {
    new Swiper(".testimonials-slider", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
      },
    });
  }
}

/**
 * Initialize UI components like dropdowns, mobile menu, etc.
 */
function initializeUIComponents() {
  // Mobile menu functionality
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeMenuBtn = document.getElementById("close-menu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  }

  if (closeMenuBtn && mobileMenu) {
    closeMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    });
  }

  // Mobile submenu toggles
  const mobileSubmenuToggles = document.querySelectorAll(
    ".mobile-submenu-toggle"
  );

  mobileSubmenuToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const submenu = this.nextElementSibling;
      submenu.classList.toggle("hidden");

      // Toggle icon rotation
      const icon = this.querySelector("i");
      icon.classList.toggle("transform");
      icon.classList.toggle("rotate-180");
    });
  });

  // Search overlay
  const searchToggle = document.getElementById("search-toggle");
  const searchToggleMobile = document.getElementById("search-toggle-mobile");
  const searchOverlay = document.getElementById("search-overlay");
  const closeSearch = document.getElementById("close-search");

  if ((searchToggle || searchToggleMobile) && searchOverlay && closeSearch) {
    const openSearch = () => {
      searchOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        document.getElementById("search-input").focus();
      }, 100);
    };

    if (searchToggle) {
      searchToggle.addEventListener("click", openSearch);
    }

    if (searchToggleMobile) {
      searchToggleMobile.addEventListener("click", openSearch);
    }

    closeSearch.addEventListener("click", function () {
      searchOverlay.classList.add("hidden");
      document.body.style.overflow = "";
    });

    // Close search overlay when clicking outside the search container
    searchOverlay.addEventListener("click", function (e) {
      if (e.target === searchOverlay) {
        searchOverlay.classList.add("hidden");
        document.body.style.overflow = "";
      }
    });

    // Handle search tags
    const searchTags = document.querySelectorAll("[data-search]");
    searchTags.forEach((tag) => {
      tag.addEventListener("click", function () {
        const searchTerm = this.getAttribute("data-search");
        const searchInput = document.getElementById("search-input");
        searchInput.value = searchTerm;
        // Trigger search function here
        performSearch(searchTerm);
      });
    });
  }

  // Mini cart functionality
  const cartToggle = document.getElementById("cart-toggle");
  const miniCart = document.getElementById("mini-cart");
  const closeCart = document.getElementById("close-cart");

  if (cartToggle && miniCart && closeCart) {
    cartToggle.addEventListener("click", function () {
      miniCart.classList.remove("translate-x-full");
      document.body.style.overflow = "hidden";
    });

    closeCart.addEventListener("click", function () {
      miniCart.classList.add("translate-x-full");
      document.body.style.overflow = "";
    });

    // Close mini cart when clicking outside
    document.addEventListener("click", function (e) {
      if (miniCart.classList.contains("translate-x-full")) return;

      if (
        !miniCart.contains(e.target) &&
        e.target !== cartToggle &&
        !cartToggle.contains(e.target)
      ) {
        miniCart.classList.add("translate-x-full");
        document.body.style.overflow = "";
      }
    });
  }

  // Promo banner close functionality
  const promoBanner = document.getElementById("promo-banner");
  const closeBanner = document.getElementById("close-banner");

  if (promoBanner && closeBanner) {
    // Check if banner was previously closed
    const isBannerClosed = localStorage.getItem("promoBannerClosed");

    if (isBannerClosed === "true") {
      promoBanner.style.display = "none";
    }

    closeBanner.addEventListener("click", function () {
      promoBanner.style.display = "none";
      localStorage.setItem("promoBannerClosed", "true");
    });
  }
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Add to Cart buttons
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-id");
      const productName = this.getAttribute("data-name");
      const productPrice = parseFloat(this.getAttribute("data-price"));
      const productImage = this.getAttribute("data-image");

      // Add to cart function from cart.js
      addToCart(productId, productName, productPrice, productImage, 1);

      // Show success toast
      showToast(`${productName} added to cart!`, "success");

      // Animate cart icon
      animateCartIcon();
    });
  });

  // Wishlist/favorite buttons
  const wishlistButtons = document.querySelectorAll(".absolute.top-2.left-2");

  wishlistButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      const icon = this.querySelector("i");
      icon.classList.toggle("far");
      icon.classList.toggle("fas");
      icon.classList.toggle("text-gray-200");
      icon.classList.toggle("text-red-500");

      // Show toast based on action (add/remove from wishlist)
      if (icon.classList.contains("fas")) {
        showToast("Added to your wishlist!", "info");
      } else {
        showToast("Removed from your wishlist!", "info");
      }
    });
  });

  // Newsletter form submission
  const newsletterForm = document.querySelector(".newsletter-form");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (validateEmail(email)) {
        // Here you would normally send this to your backend
        console.log("Subscribing email:", email);

        // Reset input and show success message
        emailInput.value = "";
        showToast("Thank you for subscribing!", "success");
      } else {
        showToast("Please enter a valid email address", "error");
      }
    });
  }

  // Search form functionality
  const searchInput = document.getElementById("search-input");

  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        performSearch(this.value.trim());
      }
    });
  }
}

/**
 * Initialize countdown timers for special offers
 */
function initializeCountdownTimers() {
  const countdownTimers = document.querySelectorAll(".countdown-timer");

  countdownTimers.forEach((timer) => {
    const hours = parseInt(timer.getAttribute("data-hours")) || 24;
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours);

    updateCountdown(timer, endTime);

    // Update every second
    setInterval(() => {
      updateCountdown(timer, endTime);
    }, 1000);
  });
}

/**
 * Update countdown timer display
 * @param {HTMLElement} timerElement - The timer element to update
 * @param {Date} endTime - The target end time
 */
function updateCountdown(timerElement, endTime) {
  const now = new Date();
  const diff = endTime - now;

  if (diff <= 0) {
    timerElement.textContent = "00:00:00";
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timerElement.textContent = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Handle back to top button behavior
 */
function handleBackToTop() {
  const backToTopButton = document.getElementById("back-to-top");

  if (backToTopButton) {
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.remove("opacity-0", "invisible");
      } else {
        backToTopButton.classList.add("opacity-0", "invisible");
      }
    });

    backToTopButton.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");

  if (!toast || !toastMessage || !toastIcon) return;

  // Set message
  toastMessage.textContent = message;

  // Set icon and color based on type
  toastIcon.className = "p-2 rounded-full mr-3";

  switch (type) {
    case "success":
      toastIcon.classList.add("bg-green-100");
      toastIcon.innerHTML = '<i class="fas fa-check text-green-600"></i>';
      break;
    case "error":
      toastIcon.classList.add("bg-red-100");
      toastIcon.innerHTML = '<i class="fas fa-times text-red-600"></i>';
      break;
    case "info":
      toastIcon.classList.add("bg-blue-100");
      toastIcon.innerHTML = '<i class="fas fa-info text-blue-600"></i>';
      break;
    default:
      toastIcon.classList.add("bg-green-100");
      toastIcon.innerHTML = '<i class="fas fa-check text-green-600"></i>';
  }

  // Show toast
  toast.classList.remove("hidden");
  toast.classList.add("slide-in");

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("slide-in");
    toast.classList.add("slide-out");

    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("slide-out");
    }, 300);
  }, 3000);

  // Close button functionality
  const closeToast = document.getElementById("close-toast");
  if (closeToast) {
    closeToast.addEventListener("click", function () {
      toast.classList.remove("slide-in");
      toast.classList.add("slide-out");

      setTimeout(() => {
        toast.classList.add("hidden");
        toast.classList.remove("slide-out");
      }, 300);
    });
  }
}

/**
 * Animate cart icon when product is added
 */
function animateCartIcon() {
  const cartIcon = document.querySelector("#cart-toggle .fa-shopping-cart");
  const cartCount = document.querySelector("#cart-count");

  if (cartIcon) {
    cartIcon.classList.add("animate-bounce");

    setTimeout(() => {
      cartIcon.classList.remove("animate-bounce");
    }, 1000);
  }

  if (cartCount) {
    cartCount.classList.add("cart-badge-pulse");

    setTimeout(() => {
      cartCount.classList.remove("cart-badge-pulse");
    }, 700);
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function validateEmail(email) {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Perform search functionality
 * @param {string} query - Search query
 */
function performSearch(query) {
  if (!query) return;

  query = query.toLowerCase();
  const searchResults = document.getElementById("search-results");

  // Simulated search results (in a real app, this would fetch from an API)
  const products = [
    {
      id: "apple-strudel-1",
      name: "Apple Strudel",
      price: 6.99,
      image: "images/Apple Strudle.jpg",
      category: "pastry",
    },
    {
      id: "bagelen-1",
      name: "Bagelen",
      price: 4.5,
      image: "images/Bagelen.jpg",
      category: "bread",
    },
    {
      id: "baguette-1",
      name: "Baguette",
      price: 3.99,
      image: "images/Baguette.jpg",
      category: "bread",
    },
    {
      id: "beef-curry-puff-1",
      name: "Beef Curry Puff",
      price: 5.25,
      image: "images/Beef Curry Puff.jpg",
      category: "savory",
    },
    {
      id: "croissant-1",
      name: "Croissant",
      price: 3.75,
      image: "images/Croissant.jpg",
      category: "pastry",
    },
    {
      id: "triple-cheese-bread-1",
      name: "Triple Cheese Bread",
      price: 6.74,
      image: "images/Triple cheese bread.jpg",
      category: "bread",
    },
    {
      id: "christmas-stollen-1",
      name: "Festive Stollen",
      price: 11.04,
      image: "images/Christmas stollen.jpg",
      category: "seasonal",
    },
    {
      id: "maritozzo-1",
      name: "Maritozzo",
      price: 7.5,
      image: "images/Maritozzo.jpg",
      category: "pastry",
    },
  ];

  // Filter products by query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
  );

  // Display results
  if (searchResults) {
    if (filteredProducts.length === 0) {
      searchResults.innerHTML = `
          <div class="text-center py-12">
            <p class="text-gray-500">No results found for "${query}"</p>
            <p class="text-sm text-gray-400 mt-2">Try a different search term or browse our categories</p>
          </div>
        `;
    } else {
      searchResults.innerHTML = `
          <p class="text-sm text-gray-500 mb-4">Found ${
            filteredProducts.length
          } results for "${query}"</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${filteredProducts
              .map(
                (product) => `
              <div class="flex items-center bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <img src="${product.image}" alt="${
                  product.name
                }" class="w-20 h-20 object-cover">
                <div class="flex-1 p-3">
                  <h4 class="font-semibold text-gray-800">${product.name}</h4>
                  <div class="flex justify-between items-center mt-1">
                    <span class="font-bold text-primary">$${product.price.toFixed(
                      2
                    )}</span>
                    <button class="add-to-cart text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                      data-id="${product.id}" data-name="${
                  product.name
                }" data-price="${product.price}" data-image="${product.image}">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;

      // Attach event listeners to newly created Add to Cart buttons
      const newAddToCartButtons =
        searchResults.querySelectorAll(".add-to-cart");

      newAddToCartButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const productId = this.getAttribute("data-id");
          const productName = this.getAttribute("data-name");
          const productPrice = parseFloat(this.getAttribute("data-price"));
          const productImage = this.getAttribute("data-image");

          // Add to cart function from cart.js
          addToCart(productId, productName, productPrice, productImage, 1);

          // Show success toast
          showToast(`${productName} added to cart!`, "success");

          // Animate cart icon
          animateCartIcon();
        });
      });
    }
  }
}

/**
 * Setup cart event listeners
 */
function setupCartEventListeners() {
  // Clear cart button (if it exists)
  const clearCartButton = document.getElementById("clear-cart");

  if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
      // Confirm before clearing
      if (confirm("Are you sure you want to clear your cart?")) {
        localStorage.setItem("djinisCart", JSON.stringify([]));
        updateCartUI();
        showToast("Your cart has been cleared", "info");
      }
    });
  }

  // Apply coupon button (if it exists)
  const applyCouponButton = document.getElementById("apply-coupon");
  const couponInput = document.getElementById("coupon-code");

  if (applyCouponButton && couponInput) {
    applyCouponButton.addEventListener("click", function () {
      const couponCode = couponInput.value.trim();

      if (!couponCode) {
        showToast("Please enter a coupon code", "error");
        return;
      }

      // Example coupons - in a real app these would be validated on the server
      const validCoupons = {
        WELCOME10: { discount: 0.1, type: "percent" },
        FRESHBAKE: { discount: 5, type: "fixed" },
        FREESHIP: { discount: 5, type: "shipping" },
      };

      if (validCoupons[couponCode.toUpperCase()]) {
        const coupon = validCoupons[couponCode.toUpperCase()];

        // Store coupon in localStorage
        localStorage.setItem(
          "djinisCoupon",
          JSON.stringify({
            code: couponCode.toUpperCase(),
            ...coupon,
          })
        );

        // Update UI to reflect discount
        if (typeof updateOrderSummary === "function") {
          updateOrderSummary();
        }

        showToast("Coupon applied successfully!", "success");
      } else {
        showToast("Invalid coupon code", "error");
      }
    });
  }

  // Checkout button event listener
  const checkoutButton = document.querySelector(".checkout-button");

  if (checkoutButton) {
    checkoutButton.addEventListener("click", function (e) {
      const cart = JSON.parse(localStorage.getItem("djinisCart")) || [];

      if (cart.length === 0) {
        e.preventDefault();
        showToast(
          "Your cart is empty. Add some items before checkout.",
          "error"
        );
      }
    });
  }
}

/**
 * Handle product image gallery
 */
function handleProductGallery() {
  const thumbnails = document.querySelectorAll(".gallery-thumbnail");
  const mainImage = document.querySelector(".gallery-main-image img");

  if (thumbnails.length && mainImage) {
    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", function () {
        // Update main image
        mainImage.src = this.querySelector("img").src;

        // Update active state
        thumbnails.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
      });
    });
  }
}

// Initialize product gallery if on product detail page
if (window.location.pathname.includes("product-detail.html")) {
  handleProductGallery();
}
