/**
 * Djini's Bakehouse - Product Management System
 * Handles product loading, filtering, searching, and display
 *
 * Version 2.0 with enhanced features:
 * - Lazy loading of product images
 * - Advanced filtering
 * - Product quick view
 * - Recently viewed products
 * - Product comparison
 * - Improved search with tags and ingredients
 */

class ProductManager {
  constructor() {
    this.products = [];
    this.categories = [];
    this.filteredProducts = [];
    this.currentCategory = "all";
    this.currentSort = "popular";
    this.searchQuery = "";
    this.priceRange = { min: 0, max: 100 };
    this.dietaryFilters = [];
    this.tagFilters = [];
    this.productListElement = document.getElementById("product-grid");
    this.recentlyViewed =
      JSON.parse(localStorage.getItem("djinisRecentlyViewed")) || [];
    this.compareItems =
      JSON.parse(localStorage.getItem("djinisCompareItems")) || [];
    this.productsPerPage = 12;
    this.currentPage = 1;
    this.init();
  }

  /**
   * Initialize the product manager
   */
  async init() {
    try {
      // Load products and categories
      await this.loadProducts();
      await this.loadCategories();

      // Initialize price range from actual product prices
      this.initializePriceRange();

      // Set up event listeners
      this.setupEventListeners();

      // Initial render
      this.filterProducts();
      this.renderProducts();

      // If we're on a product detail page, load the product
      if (window.location.pathname.includes("product-detail.html")) {
        this.loadProductDetail();
      }

      // If we're on the compare page, load comparison
      if (window.location.pathname.includes("compare.html")) {
        this.renderProductComparison();
      }

      // Load recently viewed products
      this.renderRecentlyViewed();
    } catch (error) {
      console.error("Error initializing product manager:", error);
      this.showError("Failed to load products. Please try again later.");
    }
  }

  /**
   * Initialize price range from actual product prices
   */
  initializePriceRange() {
    if (this.products.length === 0) return;

    const prices = this.products.map((product) => product.price);
    this.priceRange.min = Math.floor(Math.min(...prices));
    this.priceRange.max = Math.ceil(Math.max(...prices));

    // Update UI price range inputs if they exist
    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");
    const priceRangeText = document.getElementById("price-range-text");

    if (minPriceInput && maxPriceInput) {
      minPriceInput.min = this.priceRange.min;
      minPriceInput.max = this.priceRange.max;
      minPriceInput.value = this.priceRange.min;

      maxPriceInput.min = this.priceRange.min;
      maxPriceInput.max = this.priceRange.max;
      maxPriceInput.value = this.priceRange.max;
    }

    if (priceRangeText) {
      priceRangeText.textContent = `$${this.priceRange.min} - $${this.priceRange.max}`;
    }
  }

  /**
   * Load products from the data file or API
   */
  async loadProducts() {
    try {
      // In a real app, this would be an API call
      const response = await fetch("/data/products.json");
      if (!response.ok) throw new Error("Failed to load products");

      this.products = await response.json();
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error("Error loading products:", error);

      // Fallback to mock data if fetch fails
      this.products = this.getMockProducts();
      this.filteredProducts = [...this.products];
    }
  }

  /**
   * Load categories from the data file or API
   */
  async loadCategories() {
    try {
      // In a real app, this would be an API call
      const response = await fetch("/data/categories.json");
      if (!response.ok) throw new Error("Failed to load categories");

      this.categories = await response.json();
      this.renderCategories();
    } catch (error) {
      console.error("Error loading categories:", error);

      // Fallback to mock categories
      this.categories = this.getMockCategories();
      this.renderCategories();
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Category filter buttons
    const categoryButtons = document.querySelectorAll(".category-btn");
    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        this.filterByCategory(category);

        // Update active category button
        categoryButtons.forEach((btn) => {
          btn.classList.remove("bg-red-50", "font-medium");
        });
        button.classList.add("bg-red-50", "font-medium");
      });
    });

    // Sort dropdown
    const sortSelect = document.getElementById("sort-menu");
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        this.sortProducts(sortSelect.value);
      });
    }

    // Search input
    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      // Debounce search to improve performance
      const debounceSearch = this.debounce((value) => {
        this.searchProducts(value);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        debounceSearch(e.target.value);
      });

      // Clear search button
      const clearSearchButton = document.getElementById("clear-search");
      if (clearSearchButton) {
        clearSearchButton.addEventListener("click", () => {
          searchInput.value = "";
          this.searchProducts("");
        });
      }
    }

    // Price range filters
    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");
    const priceRangeText = document.getElementById("price-range-text");

    if (minPriceInput && maxPriceInput && priceRangeText) {
      const updatePriceRange = this.debounce(() => {
        const min = parseFloat(minPriceInput.value);
        const max = parseFloat(maxPriceInput.value);

        // Ensure min is not greater than max
        if (min > max) {
          minPriceInput.value = max;
          this.priceRange.min = max;
        } else {
          this.priceRange.min = min;
        }

        this.priceRange.max = max;
        priceRangeText.textContent = `$${this.priceRange.min.toFixed(
          2
        )} - $${this.priceRange.max.toFixed(2)}`;

        this.filterProducts();
        this.renderProducts();
      }, 500);

      minPriceInput.addEventListener("input", updatePriceRange);
      maxPriceInput.addEventListener("input", updatePriceRange);
    }

    // Dietary filter checkboxes
    const dietaryCheckboxes = document.querySelectorAll(".dietary-filter");
    if (dietaryCheckboxes.length > 0) {
      dietaryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          // Update dietary filters
          this.dietaryFilters = Array.from(
            document.querySelectorAll(".dietary-filter:checked")
          ).map((cb) => cb.value);

          this.filterProducts();
          this.renderProducts();
        });
      });
    }

    // Tag filter checkboxes
    const tagCheckboxes = document.querySelectorAll(".tag-filter");
    if (tagCheckboxes.length > 0) {
      tagCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          // Update tag filters
          this.tagFilters = Array.from(
            document.querySelectorAll(".tag-filter:checked")
          ).map((cb) => cb.value);

          this.filterProducts();
          this.renderProducts();
        });
      });
    }

    // Reset filters button
    const resetFiltersButton = document.getElementById("reset-filters");
    if (resetFiltersButton) {
      resetFiltersButton.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    // Pagination buttons
    this.setupPaginationEvents();

    // Quick view buttons (will be set up when products are rendered)

    // Compare checkbox (will be set up when products are rendered)
  }

  /**
   * Set up pagination event listeners
   */
  setupPaginationEvents() {
    const paginationContainer = document.getElementById("pagination");
    if (!paginationContainer) return;

    paginationContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("pagination-button")) {
        const page = parseInt(e.target.getAttribute("data-page"));
        this.goToPage(page);
      } else if (e.target.classList.contains("pagination-prev")) {
        this.goToPage(this.currentPage - 1);
      } else if (e.target.classList.contains("pagination-next")) {
        this.goToPage(this.currentPage + 1);
      }
    });

    // Items per page selector
    const itemsPerPageSelect = document.getElementById("items-per-page");
    if (itemsPerPageSelect) {
      itemsPerPageSelect.addEventListener("change", () => {
        this.productsPerPage = parseInt(itemsPerPageSelect.value);
        this.currentPage = 1; // Reset to first page
        this.renderProducts();
      });
    }
  }

  /**
   * Navigate to specific page
   * @param {number} page - The page number to go to
   */
  goToPage(page) {
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.productsPerPage
    );

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.renderProducts();

    // Scroll to top of product grid
    if (this.productListElement) {
      window.scrollTo({
        top: this.productListElement.offsetTop - 100,
        behavior: "smooth",
      });
    }
  }

  /**
   * Filter products by category
   * @param {string} category - The category to filter by
   */
  filterByCategory(category) {
    this.currentCategory = category;
    this.currentPage = 1; // Reset to first page
    this.filterProducts();
    this.renderProducts();
  }

  /**
   * Sort products
   * @param {string} sortMethod - The sort method
   */
  sortProducts(sortMethod) {
    this.currentSort = sortMethod;

    // Sort the filtered products
    this.filteredProducts.sort((a, b) => {
      switch (sortMethod) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case "rating":
          return b.rating - a.rating;
        default: // popular
          return b.popularity - a.popularity;
      }
    });

    this.renderProducts();
  }

  /**
   * Search products
   * @param {string} query - The search query
   */
  searchProducts(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1; // Reset to first page
    this.filterProducts();
    this.renderProducts();

    // Update UI to show search results
    const searchResultsCount = document.getElementById("search-results-count");
    if (searchResultsCount) {
      if (this.searchQuery) {
        searchResultsCount.textContent = `${this.filteredProducts.length} results for "${this.searchQuery}"`;
        searchResultsCount.classList.remove("hidden");
      } else {
        searchResultsCount.classList.add("hidden");
      }
    }
  }

  /**
   * Reset all filters to default values
   */
  resetFilters() {
    // Reset category
    this.currentCategory = "all";
    const categoryButtons = document.querySelectorAll(".category-btn");
    categoryButtons.forEach((btn) => {
      btn.classList.remove("bg-red-50", "font-medium");
      if (btn.getAttribute("data-category") === "all") {
        btn.classList.add("bg-red-50", "font-medium");
      }
    });

    // Reset price range
    this.initializePriceRange();

    // Reset dietary filters
    this.dietaryFilters = [];
    document.querySelectorAll(".dietary-filter").forEach((cb) => {
      cb.checked = false;
    });

    // Reset tag filters
    this.tagFilters = [];
    document.querySelectorAll(".tag-filter").forEach((cb) => {
      cb.checked = false;
    });

    // Reset search
    this.searchQuery = "";
    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.value = "";
    }

    // Reset page
    this.currentPage = 1;

    // Apply filters and render
    this.filterProducts();
    this.renderProducts();

    // Hide search results count
    const searchResultsCount = document.getElementById("search-results-count");
    if (searchResultsCount) {
      searchResultsCount.classList.add("hidden");
    }
  }

  /**
   * Filter products based on current filters
   */
  filterProducts() {
    // Start with all products
    let filtered = [...this.products];

    // Apply category filter
    if (this.currentCategory !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category === this.currentCategory ||
          (product.categories &&
            product.categories.includes(this.currentCategory))
      );
    }

    // Apply price range filter
    filtered = filtered.filter(
      (product) =>
        product.price >= this.priceRange.min &&
        product.price <= this.priceRange.max
    );

    // Apply dietary filters
    if (this.dietaryFilters.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.dietary) return false;

        return this.dietaryFilters.every((filter) =>
          product.dietary.includes(filter)
        );
      });
    }

    // Apply tag filters
    if (this.tagFilters.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.tags) return false;

        return this.tagFilters.some((filter) => product.tags.includes(filter));
      });
    }

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter((product) => {
        // Search in name, description, and category
        const basicMatch =
          product.name.toLowerCase().includes(this.searchQuery) ||
          product.description.toLowerCase().includes(this.searchQuery) ||
          (product.category &&
            product.category.toLowerCase().includes(this.searchQuery));

        // Search in tags
        const tagMatch =
          product.tags &&
          product.tags.some((tag) =>
            tag.toLowerCase().includes(this.searchQuery)
          );

        // Search in ingredients
        const ingredientMatch =
          product.ingredients &&
          product.ingredients.some((ingredient) =>
            ingredient.toLowerCase().includes(this.searchQuery)
          );

        return basicMatch || tagMatch || ingredientMatch;
      });
    }

    this.filteredProducts = filtered;

    // Sort based on current sort method
    this.sortProducts(this.currentSort);

    // Update filter counts if UI elements exist
    this.updateFilterCounts();
  }

  /**
   * Update the counts displayed next to filter options
   */
  updateFilterCounts() {
    // Update category counts
    const categoryCountElements = document.querySelectorAll(".category-count");
    if (categoryCountElements.length > 0) {
      // Count for "all" category
      const allCount = document.querySelector(
        '.category-count[data-category="all"]'
      );
      if (allCount) {
        allCount.textContent = this.products.length;
      }

      // Count for each specific category
      this.categories.forEach((category) => {
        const countElement = document.querySelector(
          `.category-count[data-category="${category.id}"]`
        );
        if (countElement) {
          const count = this.products.filter(
            (product) =>
              product.category === category.id ||
              (product.categories && product.categories.includes(category.id))
          ).length;

          countElement.textContent = count;
        }
      });
    }

    // Update tag counts
    const tagCountElements = document.querySelectorAll(".tag-count");
    if (tagCountElements.length > 0) {
      tagCountElements.forEach((element) => {
        const tag = element.getAttribute("data-tag");
        const count = this.products.filter(
          (product) => product.tags && product.tags.includes(tag)
        ).length;

        element.textContent = count;
      });
    }
  }

  /**
   * Render the list of products
   */
  renderProducts() {
    if (!this.productListElement) return;

    // Clear product grid
    this.productListElement.innerHTML = "";

    // Show "no products found" message if there are no filtered products
    if (this.filteredProducts.length === 0) {
      this.productListElement.innerHTML = `
        <div class="col-span-full text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900">No products found</h3>
          <p class="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
          <button id="reset-filters-empty" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            Reset Filters
          </button>
        </div>
      `;

      // Add event listener to reset filters button
      const resetFiltersEmptyButton = document.getElementById(
        "reset-filters-empty"
      );
      if (resetFiltersEmptyButton) {
        resetFiltersEmptyButton.addEventListener("click", () => {
          this.resetFilters();
        });
      }

      // Hide pagination
      const paginationContainer = document.getElementById("pagination");
      if (paginationContainer) {
        paginationContainer.classList.add("hidden");
      }

      return;
    }

    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);

    // Add each product to the grid
    paginatedProducts.forEach((product, index) => {
      const productElement = document.createElement("div");
      productElement.className =
        "product-card bg-white shadow-lg rounded-lg overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl duration-300";
      productElement.setAttribute("data-category", product.category);
      productElement.setAttribute("data-product-id", product.id);

      // Check if product is on sale or has a special tag
      const specialBadge = product.onSale
        ? `<div class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
          ${product.discountPercentage}% OFF
        </div>`
        : product.isNew
        ? `<div class="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">NEW</div>`
        : product.limited
        ? `<div class="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">LIMITED</div>`
        : "";

      // Calculate sale price if the product is on sale
      const priceDisplay = product.onSale
        ? `<span class="line-through text-gray-400">$${product.originalPrice.toFixed(
            2
          )}</span>
         <span class="font-bold text-red-500 ml-2">$${product.price.toFixed(
           2
         )}</span>`
        : `<span class="font-bold text-red-500">$${product.price.toFixed(
            2
          )}</span>`;

      // Rating stars display
      const rating = this.generateRatingStars(product.rating);

      // Check if product is in compare list
      const isInCompare = this.compareItems.includes(product.id);

      productElement.innerHTML = `
        <div class="relative group">
          ${specialBadge}
          <div class="absolute top-4 left-4 z-10">
            <div class="flex flex-col space-y-2">
              <button class="quick-view-btn bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" 
                      data-product-id="${product.id}" 
                      data-product-json='${JSON.stringify(product).replace(
                        /'/g,
                        "&apos;"
                      )}' 
                      aria-label="Quick view">
                <i class="fas fa-eye text-gray-700"></i>
              </button>
              <button class="wishlist-btn bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" 
                      data-product-id="${product.id}" 
                      aria-label="Add to wishlist">
                <i class="far fa-heart text-gray-700"></i>
              </button>
              <button class="compare-btn bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity ${
                isInCompare ? "active" : ""
              }" 
                      data-product-id="${product.id}" 
                      aria-label="Compare">
                <i class="fas fa-${
                  isInCompare
                    ? "check text-green-500"
                    : "exchange-alt text-gray-700"
                }"></i>
              </button>
            </div>
          </div>
          <a href="product-detail.html?id=${product.id}" class="block">
            <img data-src="${product.image}" alt="${
        product.name
      }" class="w-full h-48 object-cover transition-transform group-hover:scale-105 lazy-image">
            <div class="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </a>
          <div class="p-4">
            <a href="product-detail.html?id=${product.id}" class="block">
              <h3 class="text-xl font-bold text-gray-700 hover:text-red-500 transition-colors">${
                product.name
              }</h3>
              <div class="flex items-center text-yellow-400 text-sm mt-1">
                ${rating}
                <span class="text-gray-500 ml-1">(${product.reviewCount})</span>
              </div>
              <p class="text-gray-600 text-sm my-2 line-clamp-2">${
                product.description
              }</p>
            </a>
            <div class="flex justify-between items-center mt-4">
              <div>
                ${priceDisplay}
              </div>
              <button class="add-to-cart px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                data-id="${product.id}" 
                data-name="${product.name}" 
                data-price="${product.price}"
                data-image="${product.image}">
                <i class="fas fa-shopping-cart mr-1"></i> Add
              </button>
            </div>
          </div>
        </div>
      `;

      this.productListElement.appendChild(productElement);

      // Add a delay for staggered animation
      setTimeout(() => {
        productElement.classList.add("animate-fade-in");
      }, index * 50);
    });

    // Initialize lazy loading for images
    this.lazyLoadImages();

    // Set up quick view buttons
    this.setupQuickViewButtons();

    // Set up wishlist buttons
    this.setupWishlistButtons();

    // Set up compare buttons
    this.setupCompareButtons();

    // Render pagination
    this.renderPagination();
  }

  /**
   * Render pagination controls
   */
  renderPagination() {
    const paginationContainer = document.getElementById("pagination");
    if (!paginationContainer) return;

    const totalProducts = this.filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / this.productsPerPage);

    if (totalPages <= 1) {
      paginationContainer.classList.add("hidden");
      return;
    }

    paginationContainer.classList.remove("hidden");

    let paginationHTML = `
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-700">
          Showing <span class="font-medium">${Math.min(
            (this.currentPage - 1) * this.productsPerPage + 1,
            totalProducts
          )}</span> to 
          <span class="font-medium">${Math.min(
            this.currentPage * this.productsPerPage,
            totalProducts
          )}</span> of 
          <span class="font-medium">${totalProducts}</span> products
        </div>
        <div class="flex space-x-1">
    `;

    // Previous button
    paginationHTML += `
      <button class="pagination-prev px-3 py-1 rounded-md ${
        this.currentPage === 1
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-100"
      }" 
              ${this.currentPage === 1 ? "disabled" : ""}>
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if endPage is at maximum
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button
    if (startPage > 1) {
      paginationHTML += `
        <button class="pagination-button px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100" data-page="1">1</button>
      `;

      if (startPage > 2) {
        paginationHTML += `
          <span class="px-3 py-1 text-gray-700">...</span>
        `;
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-button px-3 py-1 rounded-md ${
          i === this.currentPage
            ? "bg-red-500 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }" 
               data-page="${i}">${i}</button>
      `;
    }

    // Last page button
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `
          <span class="px-3 py-1 text-gray-700">...</span>
        `;
      }

      paginationHTML += `
        <button class="pagination-button px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100" data-page="${totalPages}">${totalPages}</button>
      `;
    }

    // Next button
    paginationHTML += `
      <button class="pagination-next px-3 py-1 rounded-md ${
        this.currentPage === totalPages
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-100"
      }" 
              ${this.currentPage === totalPages ? "disabled" : ""}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    paginationHTML += `
        </div>
      </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
  }

  /**
   * Set up quick view buttons
   */
  setupQuickViewButtons() {
    const quickViewButtons = document.querySelectorAll(".quick-view-btn");

    quickViewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = button.getAttribute("data-product-id");
        const productJson = button.getAttribute("data-product-json");

        try {
          const product = JSON.parse(productJson);
          this.showQuickViewModal(product);
        } catch (error) {
          console.error("Error parsing product JSON:", error);
        }
      });
    });
  }

  /**
   * Set up wishlist buttons
   */
  setupWishlistButtons() {
    const wishlistButtons = document.querySelectorAll(".wishlist-btn");

    wishlistButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = button.getAttribute("data-product-id");
        const icon = button.querySelector("i");

        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
          // Show login modal or redirect to login page
          if (typeof showLoginPrompt === "function") {
            showLoginPrompt();
          } else {
            window.location.href =
              "pages/login.html?redirect=" +
              encodeURIComponent(window.location.href);
          }
          return;
        }

        // Toggle wishlist status
        if (this.isProductInWishlist(productId)) {
          this.removeFromWishlist(productId);
          icon.classList.remove("fas", "text-red-500");
          icon.classList.add("far", "text-gray-700");
        } else {
          this.addToWishlist(productId);
          icon.classList.remove("far", "text-gray-700");
          icon.classList.add("fas", "text-red-500");
        }
      });

      // Initialize icon based on wishlist status
      const productId = button.getAttribute("data-product-id");
      const icon = button.querySelector("i");

      if (this.isProductInWishlist(productId)) {
        icon.classList.remove("far", "text-gray-700");
        icon.classList.add("fas", "text-red-500");
      }
    });
  }

  /**
   * Set up compare buttons
   */
  setupCompareButtons() {
    const compareButtons = document.querySelectorAll(".compare-btn");

    compareButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = button.getAttribute("data-product-id");
        const icon = button.querySelector("i");

        if (this.isProductInCompare(productId)) {
          this.removeFromCompare(productId);
          icon.className = "fas fa-exchange-alt text-gray-700";
          button.classList.remove("active");
        } else {
          if (this.compareItems.length >= 4) {
            // Show max items reached message
            if (typeof showToast === "function") {
              showToast(
                "You can compare up to 4 products at a time. Please remove a product before adding a new one.",
                "warning"
              );
            } else {
              alert(
                "You can compare up to 4 products at a time. Please remove a product before adding a new one."
              );
            }
            return;
          }

          this.addToCompare(productId);
          icon.className = "fas fa-check text-green-500";
          button.classList.add("active");
        }

        // Update compare count
        this.updateCompareCount();
      });
    });
  }

  /**
   * Show quick view modal for a product
   * @param {Object} product - The product to display
   */
  showQuickViewModal(product) {
    // Create quick view modal if it doesn't exist
    let quickViewModal = document.getElementById("quick-view-modal");

    if (!quickViewModal) {
      quickViewModal = document.createElement("div");
      quickViewModal.id = "quick-view-modal";
      quickViewModal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 opacity-0 invisible transition-opacity duration-300";
      quickViewModal.setAttribute("aria-modal", "true");
      quickViewModal.setAttribute("role", "dialog");

      document.body.appendChild(quickViewModal);
    }

    // Calculate sale price if the product is on sale
    const priceDisplay = product.onSale
      ? `<span class="line-through text-gray-400 text-lg">$${product.originalPrice.toFixed(
          2
        )}</span>
       <span class="font-bold text-red-500 text-2xl ml-2">$${product.price.toFixed(
         2
       )}</span>`
      : `<span class="font-bold text-red-500 text-2xl">$${product.price.toFixed(
          2
        )}</span>`;

    // Generate rating stars
    const rating = this.generateRatingStars(product.rating);

    // Sale badge
    const saleBadge = product.onSale
      ? `<span class="inline-block bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
        ${product.discountPercentage}% OFF
      </span>`
      : product.isNew
      ? `<span class="inline-block bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-bold">NEW</span>`
      : product.limited
      ? `<span class="inline-block bg-orange-500 text-white px-3 py-1 rounded-md text-sm font-bold">LIMITED</span>`
      : "";

    // Check if product is in wishlist
    const wishlistIcon = this.isProductInWishlist(product.id)
      ? '<i class="fas fa-heart text-red-500 mr-2"></i>'
      : '<i class="far fa-heart mr-2"></i>';

    // Check if product is in compare list
    const compareIcon = this.isProductInCompare(product.id)
      ? '<i class="fas fa-check text-green-500 mr-2"></i>'
      : '<i class="fas fa-exchange-alt mr-2"></i>';

    quickViewModal.innerHTML = `
      <div class="bg-white rounded-lg overflow-hidden w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto relative">
        <button id="close-quick-view" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
          <i class="fas fa-times text-xl"></i>
        </button>
        
        <div class="grid grid-cols-1 md:grid-cols-2">
          <div class="p-6 bg-gray-50">
            <img src="${product.image}" alt="${
      product.name
    }" class="w-full h-auto rounded-lg mb-4">
            ${
              product.gallery
                ? `
              <div class="grid grid-cols-4 gap-2">
                ${product.gallery
                  .map(
                    (img, index) => `
                  <div class="cursor-pointer quick-view-thumbnail ${
                    index === 0 ? "ring-2 ring-red-500" : ""
                  }">
                    <img src="${img}" alt="${
                      product.name
                    }" class="w-full h-20 object-cover rounded-lg">
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
          
          <div class="p-6 flex flex-col">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">${
              product.name
            }</h2>
            
            <div class="flex items-center mb-2">
              <div class="flex items-center text-yellow-400">
                ${rating}
              </div>
              <span class="text-gray-600 ml-2">${product.rating} (${
      product.reviewCount
    } reviews)</span>
            </div>
            
            <div class="flex items-center mb-4">
              ${priceDisplay}
              <span class="ml-2">${saleBadge}</span>
            </div>
            
            <div class="text-gray-600 mb-6">
              <p>${product.description}</p>
            </div>
            
            ${
              product.ingredients
                ? `
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Ingredients</h3>
                <p class="text-gray-600">${product.ingredients.join(", ")}</p>
              </div>
            `
                : ""
            }
            
            <div class="flex items-center space-x-2 mb-6">
              ${
                product.tags
                  ? product.tags
                      .map(
                        (tag) => `
                <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${tag}</span>
              `
                      )
                      .join("")
                  : ""
              }
            </div>
            
            <div class="mt-auto">
              <div class="flex items-center space-x-4 mb-4">
                <div class="flex items-center border rounded-lg overflow-hidden">
                  <button id="quick-view-decrease" class="px-3 py-2 bg-gray-100 hover:bg-gray-200">-</button>
                  <input type="number" id="quick-view-quantity" min="1" value="1" class="w-16 text-center border-x">
                  <button id="quick-view-increase" class="px-3 py-2 bg-gray-100 hover:bg-gray-200">+</button>
                </div>
                
                <button id="quick-view-add-to-cart" class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
                  data-id="${product.id}" 
                  data-name="${product.name}" 
                  data-price="${product.price}"
                  data-image="${product.image}">
                  <i class="fas fa-shopping-cart mr-2"></i> Add to Cart
                </button>
              </div>
              
              <div class="flex space-x-2">
                <button id="quick-view-wishlist" class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                  data-product-id="${product.id}">
                  ${wishlistIcon} Wishlist
                </button>
                
                <button id="quick-view-compare" class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                  data-product-id="${product.id}">
                  ${compareIcon} Compare
                </button>
              </div>
              
              <a href="product-detail.html?id=${
                product.id
              }" class="block text-center mt-4 text-red-500 hover:text-red-600 transition-colors">
                View Full Details <i class="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Show modal
    quickViewModal.classList.remove("invisible", "opacity-0");
    document.body.classList.add("overflow-hidden");

    // Set up quick view event listeners
    this.setupQuickViewEventListeners(product);

    // Add product to recently viewed
    this.addToRecentlyViewed(product);
  }

  /**
   * Set up event listeners for quick view modal
   * @param {Object} product - The product being viewed
   */
  setupQuickViewEventListeners(product) {
    const closeButton = document.getElementById("close-quick-view");
    const modal = document.getElementById("quick-view-modal");
    const decreaseBtn = document.getElementById("quick-view-decrease");
    const increaseBtn = document.getElementById("quick-view-increase");
    const quantityInput = document.getElementById("quick-view-quantity");
    const addToCartBtn = document.getElementById("quick-view-add-to-cart");
    const wishlistBtn = document.getElementById("quick-view-wishlist");
    const compareBtn = document.getElementById("quick-view-compare");

    // Close modal
    if (closeButton && modal) {
      closeButton.addEventListener("click", () => {
        modal.classList.add("invisible", "opacity-0");
        document.body.classList.remove("overflow-hidden");
      });

      // Close modal when clicking outside
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("invisible", "opacity-0");
          document.body.classList.remove("overflow-hidden");
        }
      });

      // Close modal with Escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("invisible")) {
          modal.classList.add("invisible", "opacity-0");
          document.body.classList.remove("overflow-hidden");
        }
      });
    }

    // Quantity controls
    if (decreaseBtn && increaseBtn && quantityInput) {
      decreaseBtn.addEventListener("click", () => {
        const currentVal = parseInt(quantityInput.value);
        if (currentVal > 1) {
          quantityInput.value = currentVal - 1;
        }
      });

      increaseBtn.addEventListener("click", () => {
        const currentVal = parseInt(quantityInput.value);
        quantityInput.value = currentVal + 1;
      });
    }

    // Add to cart button
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        const quantity = parseInt(quantityInput.value);

        // Add to cart with quantity
        if (typeof window.djinisCart !== "undefined") {
          const item = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
          };

          window.djinisCart.addItem(item);

          // Show toast notification
          if (typeof window.djinisCart.showToast === "function") {
            window.djinisCart.showToast(
              `${quantity} ${product.name} added to cart!`
            );
          } else if (typeof showToast === "function") {
            showToast(`${quantity} ${product.name} added to cart!`, "success");
          }
        } else {
          // Fallback to basic cart functionality
          for (let i = 0; i < quantity; i++) {
            this.addToCartBasic(product);
          }
        }

        // Close modal
        modal.classList.add("invisible", "opacity-0");
        document.body.classList.remove("overflow-hidden");
      });
    }

    // Wishlist button
    if (wishlistBtn) {
      wishlistBtn.addEventListener("click", () => {
        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
          // Show login modal or redirect to login page
          if (typeof showLoginPrompt === "function") {
            showLoginPrompt();
          } else {
            window.location.href =
              "pages/login.html?redirect=" +
              encodeURIComponent(window.location.href);
          }
          return;
        }

        const productId = wishlistBtn.getAttribute("data-product-id");

        if (this.isProductInWishlist(productId)) {
          this.removeFromWishlist(productId);
          wishlistBtn.innerHTML = '<i class="far fa-heart mr-2"></i> Wishlist';
        } else {
          this.addToWishlist(productId);
          wishlistBtn.innerHTML =
            '<i class="fas fa-heart text-red-500 mr-2"></i> Wishlist';
        }
      });
    }

    // Compare button
    if (compareBtn) {
      compareBtn.addEventListener("click", () => {
        const productId = compareBtn.getAttribute("data-product-id");

        if (this.isProductInCompare(productId)) {
          this.removeFromCompare(productId);
          compareBtn.innerHTML =
            '<i class="fas fa-exchange-alt mr-2"></i> Compare';
        } else {
          if (this.compareItems.length >= 4) {
            // Show max items reached message
            if (typeof showToast === "function") {
              showToast(
                "You can compare up to 4 products at a time. Please remove a product before adding a new one.",
                "warning"
              );
            } else {
              alert(
                "You can compare up to 4 products at a time. Please remove a product before adding a new one."
              );
            }
            return;
          }

          this.addToCompare(productId);
          compareBtn.innerHTML =
            '<i class="fas fa-check text-green-500 mr-2"></i> Compare';
        }

        // Update compare count
        this.updateCompareCount();
      });
    }

    // Image thumbnails
    const thumbnails = document.querySelectorAll(".quick-view-thumbnail");
    const mainImage = document.querySelector("#quick-view-modal img");

    if (thumbnails.length > 0 && mainImage) {
      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener("click", () => {
          const imgSrc = thumbnail.querySelector("img").getAttribute("src");
          mainImage.setAttribute("src", imgSrc);

          // Add active class to clicked thumbnail
          thumbnails.forEach((t) => {
            t.classList.remove("ring-2", "ring-red-500");
          });
          thumbnail.classList.add("ring-2", "ring-red-500");
        });
      });
    }
  }

  /**
   * Add a product to recently viewed
   * @param {Object} product - The product to add
   */
  addToRecentlyViewed(product) {
    // Create a simpler version of the product with only essential info
    const simpleProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      rating: product.rating,
      category: product.category,
      dateViewed: new Date().toISOString(),
    };

    // Remove product if it already exists
    this.recentlyViewed = this.recentlyViewed.filter(
      (p) => p.id !== product.id
    );

    // Add to beginning of array
    this.recentlyViewed.unshift(simpleProduct);

    // Limit to 10 items
    if (this.recentlyViewed.length > 10) {
      this.recentlyViewed.pop();
    }

    // Save to localStorage
    localStorage.setItem(
      "djinisRecentlyViewed",
      JSON.stringify(this.recentlyViewed)
    );
  }

  /**
   * Render recently viewed products
   */
  renderRecentlyViewed() {
    const recentlyViewedContainer = document.getElementById("recently-viewed");
    if (!recentlyViewedContainer || this.recentlyViewed.length === 0) return;

    // Sort by date viewed (newest first)
    const sortedProducts = [...this.recentlyViewed].sort(
      (a, b) => new Date(b.dateViewed) - new Date(a.dateViewed)
    );

    // Take only the first 6 products
    const displayProducts = sortedProducts.slice(0, 6);

    recentlyViewedContainer.innerHTML = `
      <div class="my-12">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Recently Viewed</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          ${displayProducts
            .map(
              (product) => `
            <div class="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <a href="product-detail.html?id=${product.id}" class="block">
                <img src="${product.image}" alt="${
                product.name
              }" class="w-full h-32 object-cover">
                <div class="p-3">
                  <h3 class="font-medium text-gray-800 text-sm line-clamp-2">${
                    product.name
                  }</h3>
                  <div class="flex justify-between items-center mt-2">
                    <span class="text-red-500 font-medium">$${product.price.toFixed(
                      2
                    )}</span>
                    <div class="text-yellow-400 text-xs">
                      ${this.generateRatingStars(product.rating, true)}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in
   */
  isUserLoggedIn() {
    // Check for user authentication data in localStorage
    const userAuth = localStorage.getItem("djinisUserAuth");
    return userAuth !== null && JSON.parse(userAuth).isLoggedIn === true;
  }

  /**
   * Check if product is in wishlist
   * @param {string} productId - Product ID to check
   * @returns {boolean} True if product is in wishlist
   */
  isProductInWishlist(productId) {
    const wishlist =
      JSON.parse(localStorage.getItem("djinisUserWishlist")) || [];
    return wishlist.some((item) => item.id === productId);
  }

  /**
   * Add product to wishlist
   * @param {string} productId - Product ID to add
   */
  addToWishlist(productId) {
    // Get product details
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    // Get current wishlist
    const wishlist =
      JSON.parse(localStorage.getItem("djinisUserWishlist")) || [];

    // Check if product is already in wishlist
    if (!wishlist.some((item) => item.id === productId)) {
      // Add to wishlist
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        dateAdded: new Date().toISOString(),
      });

      // Save to localStorage
      localStorage.setItem("djinisUserWishlist", JSON.stringify(wishlist));

      // Show toast notification
      if (typeof showToast === "function") {
        showToast(`${product.name} added to wishlist!`, "success");
      }
    }
  }

  /**
   * Remove product from wishlist
   * @param {string} productId - Product ID to remove
   */
  removeFromWishlist(productId) {
    // Get current wishlist
    const wishlist =
      JSON.parse(localStorage.getItem("djinisUserWishlist")) || [];

    // Find product in wishlist
    const product = wishlist.find((item) => item.id === productId);
    if (!product) return;

    // Remove from wishlist
    const updatedWishlist = wishlist.filter((item) => item.id !== productId);

    // Save to localStorage
    localStorage.setItem("djinisUserWishlist", JSON.stringify(updatedWishlist));

    // Show toast notification
    if (typeof showToast === "function") {
      showToast(`${product.name} removed from wishlist`, "info");
    }
  }

  /**
   * Check if product is in compare list
   * @param {string} productId - Product ID to check
   * @returns {boolean} True if product is in compare list
   */
  isProductInCompare(productId) {
    return this.compareItems.includes(productId);
  }

  /**
   * Add product to compare list
   * @param {string} productId - Product ID to add
   */
  addToCompare(productId) {
    if (this.compareItems.includes(productId)) return;

    // Get product details
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    // Add to compare list
    this.compareItems.push(productId);

    // Save to localStorage
    localStorage.setItem(
      "djinisCompareItems",
      JSON.stringify(this.compareItems)
    );

    // Show toast notification
    if (typeof showToast === "function") {
      showToast(`${product.name} added to comparison`, "success");
    }

    // Show compare bar if it exists
    this.showCompareBar();
  }

  /**
   * Remove product from compare list
   * @param {string} productId - Product ID to remove
   */
  removeFromCompare(productId) {
    // Get product details
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    // Remove from compare list
    this.compareItems = this.compareItems.filter((id) => id !== productId);

    // Save to localStorage
    localStorage.setItem(
      "djinisCompareItems",
      JSON.stringify(this.compareItems)
    );

    // Show toast notification
    if (typeof showToast === "function") {
      showToast(`${product.name} removed from comparison`, "info");
    }

    // Update compare bar
    this.updateCompareBar();

    // If we're on the compare page, reload
    if (window.location.pathname.includes("compare.html")) {
      this.renderProductComparison();
    }
  }

  /**
   * Update compare count
   */
  updateCompareCount() {
    const compareCount = document.getElementById("compare-count");
    if (!compareCount) return;

    compareCount.textContent = this.compareItems.length;

    if (this.compareItems.length === 0) {
      compareCount.classList.add("hidden");
    } else {
      compareCount.classList.remove("hidden");
    }
  }

  /**
   * Show compare bar
   */
  showCompareBar() {
    let compareBar = document.getElementById("compare-bar");

    if (!compareBar) {
      // Create compare bar
      compareBar = document.createElement("div");
      compareBar.id = "compare-bar";
      compareBar.className =
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 transform translate-y-full transition-transform duration-300";

      document.body.appendChild(compareBar);
    }

    // Update compare bar content
    this.updateCompareBar();

    // Show compare bar
    setTimeout(() => {
      compareBar.classList.remove("translate-y-full");
    }, 10);
  }

  /**
   * Update compare bar content
   */
  updateCompareBar() {
    const compareBar = document.getElementById("compare-bar");
    if (!compareBar) return;

    // Hide compare bar if no items
    if (this.compareItems.length === 0) {
      compareBar.classList.add("translate-y-full");
      setTimeout(() => {
        compareBar.innerHTML = "";
      }, 300);
      return;
    }

    // Get products to compare
    const productsToCompare = this.compareItems
      .map((id) => this.products.find((p) => p.id === id))
      .filter(Boolean);

    // Generate HTML
    compareBar.innerHTML = `
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center">
          <span class="font-medium mr-4">Compare Products (${
            productsToCompare.length
          })</span>
          <div class="flex space-x-4">
            ${productsToCompare
              .map(
                (product) => `
              <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded">
                <button class="remove-compare absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-gray-100"
                        data-product-id="${product.id}">
                  <i class="fas fa-times text-xs text-gray-500"></i>
                </button>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="flex space-x-3">
          <button id="clear-compare" class="text-gray-700 hover:text-red-500 transition-colors">
            <i class="fas fa-trash-alt mr-1"></i> Clear All
          </button>
          <a href="compare.html" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
            Compare <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    `;

    // Add event listeners
    const removeButtons = compareBar.querySelectorAll(".remove-compare");
    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-product-id");
        this.removeFromCompare(productId);
      });
    });

    const clearButton = compareBar.querySelector("#clear-compare");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearCompare();
      });
    }
  }

  /**
   * Clear all products from compare
   */
  clearCompare() {
    this.compareItems = [];
    localStorage.setItem(
      "djinisCompareItems",
      JSON.stringify(this.compareItems)
    );

    // Update UI
    this.updateCompareCount();
    this.updateCompareBar();

    // If we're on the compare page, reload or redirect
    if (window.location.pathname.includes("compare.html")) {
      window.location.href = "products.html";
    }
  }

  /**
   * Render product comparison page
   */
  renderProductComparison() {
    const compareContainer = document.getElementById("compare-container");
    if (!compareContainer) return;

    // Get products to compare
    const productsToCompare = this.compareItems
      .map((id) => this.products.find((p) => p.id === id))
      .filter(Boolean);

    if (productsToCompare.length === 0) {
      compareContainer.innerHTML = `
        <div class="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-xl font-medium text-gray-900 mb-2">No products to compare</h3>
          <p class="text-gray-600 mb-6">Add products to compare by clicking the compare button on product cards.</p>
            <a href="products.html" class="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors mt-4">
              Browse Products
            </a>
          </div>
        `;
      return;
    }

    // Generate features to compare
    const features = [
      "Category",
      "Rating",
      "Price",
      "Description",
      "Ingredients",
      "Nutrition",
    ];

    // Generate comparison table
    compareContainer.innerHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
            <thead>
              <tr>
                <th class="py-3 px-4 bg-gray-50 text-left w-40">Features</th>
                ${productsToCompare
                  .map(
                    (product) => `
                  <th class="py-3 px-4 bg-gray-50 text-center">
                    <div class="relative">
                      <button class="remove-compare absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-gray-100"
                              data-product-id="${product.id}">
                        <i class="fas fa-times text-xs text-gray-500"></i>
                      </button>
                      <img src="${product.image}" alt="${product.name}" class="w-24 h-24 object-cover rounded mx-auto mb-2">
                      <h3 class="font-medium text-gray-800">${product.name}</h3>
                    </div>
                  </th>
                `
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              <!-- Product Image -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Image</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    <a href="product-detail.html?id=${product.id}" class="block">
                      <img src="${product.image}" alt="${product.name}" class="w-32 h-32 object-cover rounded mx-auto">
                    </a>
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Category -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Category</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">${product.category}</td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Rating -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Rating</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    <div class="flex items-center justify-center text-yellow-400">
                      ${this.generateRatingStars(product.rating)}
                    </div>
                    <span class="text-gray-600 text-sm">(${
                      product.reviewCount
                    } reviews)</span>
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Price -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Price</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    ${
                      product.onSale
                        ? `<span class="line-through text-gray-400">$${product.originalPrice.toFixed(
                            2
                          )}</span><br>
                       <span class="font-bold text-red-500">$${product.price.toFixed(
                         2
                       )}</span>`
                        : `<span class="font-bold text-red-500">$${product.price.toFixed(
                            2
                          )}</span>`
                    }
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Description -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Description</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">${product.description}</td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Ingredients -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Ingredients</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    ${
                      product.ingredients
                        ? `<ul class="list-disc text-left pl-5">
                        ${product.ingredients
                          .map((ingredient) => `<li>${ingredient}</li>`)
                          .join("")}
                       </ul>`
                        : '<span class="text-gray-400">Not available</span>'
                    }
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Nutrition -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Nutrition</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    ${
                      product.nutrition
                        ? `<table class="w-full text-sm">
                        ${Object.entries(product.nutrition)
                          .map(
                            ([key, value]) => `
                          <tr>
                            <td class="text-left font-medium">${key}</td>
                            <td class="text-right">${value}</td>
                          </tr>
                        `
                          )
                          .join("")}
                       </table>`
                        : '<span class="text-gray-400">Not available</span>'
                    }
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Tags -->
              <tr class="hover:bg-gray-50">
                <td class="py-4 px-4 font-medium border-t">Tags</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    ${
                      product.tags
                        ? `<div class="flex flex-wrap justify-center gap-1">
                        ${product.tags
                          .map(
                            (tag) => `
                          <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${tag}</span>
                        `
                          )
                          .join("")}
                       </div>`
                        : '<span class="text-gray-400">Not available</span>'
                    }
                  </td>
                `
                  )
                  .join("")}
              </tr>
              
              <!-- Action Buttons -->
              <tr>
                <td class="py-4 px-4 font-medium border-t">Actions</td>
                ${productsToCompare
                  .map(
                    (product) => `
                  <td class="py-4 px-4 text-center border-t">
                    <div class="flex flex-col space-y-2">
                      <button class="add-to-cart bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition w-full"
                        data-id="${product.id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}"
                        data-image="${product.image}">
                        <i class="fas fa-shopping-cart mr-1"></i> Add to Cart
                      </button>
                      <a href="product-detail.html?id=${product.id}" class="text-red-500 hover:text-red-600 transition">
                        View Details
                      </a>
                    </div>
                  </td>
                `
                  )
                  .join("")}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-6 text-center">
          <button id="clear-compare-table" class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition mr-2">
            <i class="fas fa-trash-alt mr-1"></i> Clear All
          </button>
          <a href="products.html" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition ml-2">
            <i class="fas fa-plus mr-1"></i> Add More Products
          </a>
        </div>
      `;

    // Add event listeners for remove buttons
    const removeButtons = compareContainer.querySelectorAll(".remove-compare");
    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-product-id");
        this.removeFromCompare(productId);
      });
    });

    // Add event listener for clear all button
    const clearButton = document.getElementById("clear-compare-table");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearCompare();
      });
    }

    // Add event listeners for add to cart buttons
    const addToCartButtons = compareContainer.querySelectorAll(".add-to-cart");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-id");
        const productName = button.getAttribute("data-name");
        const productPrice = parseFloat(button.getAttribute("data-price"));
        const productImage = button.getAttribute("data-image");

        // Add to cart
        if (typeof window.djinisCart !== "undefined") {
          window.djinisCart.addItem({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1,
          });
        } else {
          this.addToCartBasic({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
          });
        }

        // Show toast notification
        if (
          typeof window.djinisCart !== "undefined" &&
          typeof window.djinisCart.showToast === "function"
        ) {
          window.djinisCart.showToast(`${productName} added to cart!`);
        } else if (typeof showToast === "function") {
          showToast(`${productName} added to cart!`, "success");
        }
      });
    });
  }

  /**
   * Lazy load images
   */
  lazyLoadImages() {
    const lazyImages = document.querySelectorAll(".lazy-image");

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove("lazy-image");
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach((img) => {
        imageObserver.observe(img);
      });
    } else {
      // For browsers that don't support IntersectionObserver
      lazyImages.forEach((img) => {
        img.src = img.dataset.src;
        img.classList.remove("lazy-image");
      });
    }
  }

  /**
   * Helper function to debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Timeout in ms
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
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

  /**
   * Load product detail page
   */
  loadProductDetail() {
    // Get product ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
      this.showError("Product not found");
      return;
    }

    // Find product by ID
    const product = this.products.find((product) => product.id === productId);

    if (!product) {
      this.showError("Product not found");
      return;
    }

    // Update page title
    document.title = `${product.name} - Djini's Bakehouse`;

    // Add product to recently viewed
    this.addToRecentlyViewed(product);

    // Render product detail
    this.renderProductDetail(product);

    // Load related products
    this.loadRelatedProducts(product);
  }

  /**
   * Render product detail
   * @param {Object} product - The product to display
   */
  renderProductDetail(product) {
    const productDetailElement = document.getElementById("product-detail");
    if (!productDetailElement) return;

    // Generate rating stars
    const rating = this.generateRatingStars(product.rating);

    // Calculate sale price if the product is on sale
    const priceDisplay = product.onSale
      ? `<span class="line-through text-gray-400 text-xl">$${product.originalPrice.toFixed(
          2
        )}</span>
         <span class="font-bold text-red-500 text-3xl ml-2">$${product.price.toFixed(
           2
         )}</span>`
      : `<span class="font-bold text-red-500 text-3xl">$${product.price.toFixed(
          2
        )}</span>`;

    // Sale badge
    const saleBadge = product.onSale
      ? `<span class="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
          ${product.discountPercentage}% OFF
        </span>`
      : "";

    // Format ingredients as a list
    const ingredientsList = product.ingredients
      ? `<div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">Ingredients</h3>
          <ul class="list-disc pl-5 text-gray-600">
            ${product.ingredients
              .map((ingredient) => `<li>${ingredient}</li>`)
              .join("")}
          </ul>
        </div>`
      : "";

    // Format nutrition info as a table
    const nutritionInfo = product.nutrition
      ? `<div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">Nutrition Information</h3>
          <table class="w-full text-sm text-gray-600">
            <tbody>
              ${Object.entries(product.nutrition)
                .map(
                  ([key, value]) => `
                <tr class="border-b">
                  <td class="py-2 font-medium">${key}</td>
                  <td class="py-2 text-right">${value}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>`
      : "";

    // Format dietary info if available
    const dietaryInfo = product.dietary
      ? `<div class="mt-4 flex flex-wrap gap-2">
          ${product.dietary
            .map(
              (diet) => `
            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              ${diet}
            </span>
          `
            )
            .join("")}
        </div>`
      : "";

    // Format tags
    const tagsHtml = product.tags
      ? `<div class="flex flex-wrap gap-2 mt-4">
          ${product.tags
            .map(
              (tag) => `
            <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              ${tag}
            </span>
          `
            )
            .join("")}
        </div>`
      : "";

    // Check if product is in wishlist
    const isInWishlist = this.isProductInWishlist(product.id);
    const wishlistButtonHtml = isInWishlist
      ? '<i class="fas fa-heart text-red-500 mr-2"></i> Remove from Wishlist'
      : '<i class="far fa-heart mr-2"></i> Add to Wishlist';

    // Check if product is in compare
    const isInCompare = this.isProductInCompare(product.id);
    const compareButtonHtml = isInCompare
      ? '<i class="fas fa-check text-green-500 mr-2"></i> Added to Compare'
      : '<i class="fas fa-exchange-alt mr-2"></i> Add to Compare';

    productDetailElement.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div class="bg-white p-4 rounded-lg shadow-md">
              <div class="product-gallery">
                <div class="gallery-main-image">
                  <img src="${product.image}" alt="${
      product.name
    }" class="w-full h-auto rounded-lg">
                </div>
                ${
                  product.gallery
                    ? `
                  <div class="gallery-thumbnails mt-4 grid grid-cols-4 gap-2">
                    <div class="gallery-thumbnail active">
                      <img src="${product.image}" alt="${
                        product.name
                      }" class="w-full h-20 object-cover rounded-lg">
                    </div>
                    ${product.gallery
                      .map(
                        (img) => `
                      <div class="gallery-thumbnail">
                        <img src="${img}" alt="${product.name}" class="w-full h-20 object-cover rounded-lg">
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
              </div>
            </div>
            
            <!-- Social sharing -->
            <div class="mt-4 flex justify-center space-x-4">
              <button class="share-btn" data-platform="facebook" aria-label="Share on Facebook">
                <i class="fab fa-facebook-f text-blue-600 text-xl"></i>
              </button>
              <button class="share-btn" data-platform="twitter" aria-label="Share on Twitter">
                <i class="fab fa-twitter text-blue-400 text-xl"></i>
              </button>
              <button class="share-btn" data-platform="pinterest" aria-label="Share on Pinterest">
                <i class="fab fa-pinterest text-red-600 text-xl"></i>
              </button>
              <button class="share-btn" data-platform="email" aria-label="Share via Email">
                <i class="fas fa-envelope text-gray-600 text-xl"></i>
              </button>
            </div>
          </div>
          
          <div>
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h1 class="text-3xl font-bold text-gray-800">${product.name}</h1>
              
              <!-- Product code/SKU -->
              <p class="text-sm text-gray-500 mb-2">Product Code: ${
                product.id
              }</p>
              
              <div class="flex items-center mt-2">
                <div class="flex items-center text-yellow-400">
                  ${rating}
                </div>
                <span class="text-gray-600 ml-2">${product.rating} (${
      product.reviewCount
    } reviews)</span>
                <a href="#reviews" class="text-blue-500 hover:text-blue-600 ml-4 text-sm">Write a Review</a>
              </div>
              
              <!-- Availability info -->
              <div class="mt-2">
                <span class="text-green-600 font-medium">
                  <i class="fas fa-check-circle mr-1"></i> In Stock
                </span>
                <span class="text-gray-500 text-sm ml-4">Usually ships within 24 hours</span>
              </div>
              
              <!-- Dietary info -->
              ${dietaryInfo}
              
              <div class="mt-4 flex items-center">
                ${priceDisplay}
                ${saleBadge}
              </div>
              
              <div class="mt-6 text-gray-600">
                <p>${product.description}</p>
              </div>
              
              ${ingredientsList}
              
              ${nutritionInfo}
              
              <!-- Quantity selector -->
              <div class="mt-6">
                <label for="product-quantity" class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <div class="flex items-center space-x-4">
                  <div class="flex items-center border rounded-lg overflow-hidden">
                    <button id="decrease-quantity" class="px-3 py-2 bg-gray-100 hover:bg-gray-200">-</button>
                    <input type="number" id="product-quantity" min="1" value="1" class="w-16 text-center border-x">
                    <button id="increase-quantity" class="px-3 py-2 bg-gray-100 hover:bg-gray-200">+</button>
                  </div>
                  
                  <button id="add-to-cart-detail" class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
                    data-id="${product.id}" 
                    data-name="${product.name}" 
                    data-price="${product.price}"
                    data-image="${product.image}">
                    <i class="fas fa-shopping-cart mr-2"></i> Add to Cart
                  </button>
                </div>
                
                <!-- Wishlist and Compare buttons -->
                <div class="flex mt-4 space-x-2">
                  <button id="add-to-wishlist" class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                    ${wishlistButtonHtml}
                  </button>
                  
                  <button id="add-to-compare" class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                    ${compareButtonHtml}
                  </button>
                </div>
              </div>
              
              ${tagsHtml}
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md mt-6">
              <div class="flex items-center text-gray-600 mb-4">
                <div class="flex items-center mr-6">
                  <i class="fas fa-truck text-red-500 mr-2"></i>
                  <span>Free shipping over $50</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-undo text-red-500 mr-2"></i>
                  <span>30-day return policy</span>
                </div>
              </div>
              
              <div class="border-t pt-4">
                <div class="flex items-start">
                  <i class="fas fa-shield-alt text-red-500 mt-1 mr-2"></i>
                  <p class="text-sm text-gray-600">
                    All our products are made fresh daily with high-quality ingredients. We take pride in our baking process and quality control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-12">
          <div class="border-b border-gray-200">
            <nav class="flex flex-wrap -mb-px" aria-label="Tabs">
              <button class="tab-button inline-block p-4 text-red-500 border-b-2 border-red-500 rounded-t-lg" aria-current="page" data-tab="description">
                Description
              </button>
              <button class="tab-button inline-block p-4 text-gray-500 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 rounded-t-lg" data-tab="reviews">
                Reviews
              </button>
              <button class="tab-button inline-block p-4 text-gray-500 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 rounded-t-lg" data-tab="shipping">
                Shipping & Returns
              </button>
            </nav>
          </div>
          
          <div class="tab-content">
            <div id="description" class="tab-pane">
              <div class="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
                <div class="prose text-gray-600">
                  ${product.longDescription || product.description}
                </div>
              </div>
            </div>
            
            <div id="reviews" class="tab-pane hidden">
              <div class="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
                <div id="reviews-container">
                  <div class="text-center py-10">
                    <div class="loading-spinner mx-auto"></div>
                    <p class="mt-4 text-gray-600">Loading reviews...</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="shipping" class="tab-pane hidden">
              <div class="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Shipping & Returns</h2>
                <div class="prose text-gray-600">
                  <h3 class="text-lg font-semibold mb-2">Shipping</h3>
                  <p>We offer several shipping options:</p>
                  <ul class="list-disc pl-5 mb-4">
                    <li>Standard Delivery (2-3 hours): $5.99</li>
                    <li>Express Delivery (1 hour): $9.99</li>
                    <li>Free shipping on orders over $50</li>
                  </ul>
                  
                  <h3 class="text-lg font-semibold mb-2">Returns & Refunds</h3>
                  <p>We want you to be completely satisfied with your purchase. If for any reason you're not happy with your order, please contact us within 24 hours of delivery.</p>
                  <p>Due to the perishable nature of our products, we handle returns on a case-by-case basis. Please contact our customer service team at (555) 123-4567 or email us at returns@djinisbakehouse.com.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

    // Add event listeners for product detail page
    this.setupProductDetailEvents(product);
  }

  /**
   * Generate rating stars HTML
   * @param {number} rating - The rating value (0-5)
   * @param {boolean} small - Whether to use small stars
   * @returns {string} The HTML for the rating stars
   */
  generateRatingStars(rating, small = false) {
    const starClass = small ? "text-xs" : "";
    let starsHtml = "";
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += `<i class="fas fa-star ${starClass}"></i>`;
    }

    // Half star
    if (halfStar) {
      starsHtml += `<i class="fas fa-star-half-alt ${starClass}"></i>`;
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += `<i class="far fa-star ${starClass}"></i>`;
    }

    return starsHtml;
  }

  /**
   * Render category filters
   */
  renderCategories() {
    const categoriesContainer = document.getElementById("categories-container");
    if (!categoriesContainer) return;

    // Clear categories container
    categoriesContainer.innerHTML = `
        <div class="mb-4">
          <button class="category-btn w-full text-left p-3 rounded-lg hover:bg-red-50 transition mb-1 bg-red-50 font-medium flex justify-between items-center" data-category="all">
            <span>All Products</span>
            <span class="category-count text-gray-500 text-sm" data-category="all">${this.products.length}</span>
          </button>
        </div>
      `;

    // Add each category
    this.categories.forEach((category) => {
      const categoryButton = document.createElement("div");
      categoryButton.className = "mb-1";

      // Count products in this category
      const count = this.products.filter(
        (product) =>
          product.category === category.id ||
          (product.categories && product.categories.includes(category.id))
      ).length;

      // Add icon if present
      const iconHtml = category.icon
        ? `<i class="${category.icon} mr-2"></i>`
        : "";

      categoryButton.innerHTML = `
          <button class="category-btn w-full text-left p-3 rounded-lg hover:bg-red-50 transition flex justify-between items-center" data-category="${category.id}">
            <span>${iconHtml}${category.name}</span>
            <span class="category-count text-gray-500 text-sm" data-category="${category.id}">${count}</span>
          </button>
        `;

      categoriesContainer.appendChild(categoryButton);
    });

    // Add event listeners to newly created category buttons
    const categoryButtons = document.querySelectorAll(".category-btn");
    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        this.filterByCategory(category);

        // Update active category button
        categoryButtons.forEach((btn) => {
          btn.classList.remove("bg-red-50", "font-medium");
        });
        button.classList.add("bg-red-50", "font-medium");
      });
    });
  }

  /**
   * Load related products for a product detail page
   * @param {Object} product - The main product
   */
  loadRelatedProducts(product) {
    // Find related products (same category or has matching tags)
    let relatedProducts = this.products.filter(
      (p) =>
        p.id !== product.id && // Not the same product
        (p.category === product.category || // Same category
          (product.tags &&
            p.tags &&
            p.tags.some((tag) => product.tags.includes(tag)))) // Matching tags
    );

    // Limit to 6 products
    if (relatedProducts.length > 6) {
      relatedProducts = relatedProducts.slice(0, 6);
    }

    // Render related products
    this.renderRelatedProducts(relatedProducts);
  }

  /**
   * Render related products section
   * @param {Array} products - The related products to display
   */
  renderRelatedProducts(products) {
    const relatedProductsContainer =
      document.getElementById("related-products");
    if (!relatedProductsContainer) return;

    if (products.length === 0) {
      relatedProductsContainer.classList.add("hidden");
      return;
    }

    relatedProductsContainer.classList.remove("hidden");

    // Clear container
    relatedProductsContainer.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${products
          .map((product) => {
            // Generate rating stars
            const rating = this.generateRatingStars(product.rating, true);

            // Calculate sale price if the product is on sale
            const priceDisplay = product.onSale
              ? `<span class="line-through text-gray-400 text-sm">$${product.originalPrice.toFixed(
                  2
                )}</span>
             <span class="font-bold text-red-500 ml-1">$${product.price.toFixed(
               2
             )}</span>`
              : `<span class="font-bold text-red-500">$${product.price.toFixed(
                  2
                )}</span>`;

            return `
            <div class="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <a href="product-detail.html?id=${product.id}" class="block">
                <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-cover">
                <div class="p-4">
                  <h3 class="font-medium text-gray-800 line-clamp-2">${product.name}</h3>
                  <div class="flex items-center text-yellow-400 text-xs mt-1">
                    ${rating}
                    <span class="text-gray-500 ml-1 text-xs">(${product.reviewCount})</span>
                  </div>
                  <div class="mt-2">
                    ${priceDisplay}
                  </div>
                </div>
              </a>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }
}

// Initialize the product manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.productManager = new ProductManager();
});
