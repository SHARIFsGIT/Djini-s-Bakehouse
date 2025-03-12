/**
 * Djini's Bakehouse - Product Management System
 * Handles product loading, filtering, searching, and display
 */

class ProductManager {
    constructor() {
      this.products = [];
      this.categories = [];
      this.filteredProducts = [];
      this.currentCategory = 'all';
      this.currentSort = 'popular';
      this.searchQuery = '';
      this.productListElement = document.getElementById('product-grid');
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
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial render
        this.filterProducts();
        this.renderProducts();
        
        // If we're on a product detail page, load the product
        if (window.location.pathname.includes('product-detail.html')) {
          this.loadProductDetail();
        }
      } catch (error) {
        console.error('Error initializing product manager:', error);
        this.showError('Failed to load products. Please try again later.');
      }
    }
  
    /**
     * Load products from the data file or API
     */
    async loadProducts() {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we're using mock data
        const response = await fetch('/data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        
        this.products = await response.json();
        this.filteredProducts = [...this.products];
      } catch (error) {
        console.error('Error loading products:', error);
        
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
        const response = await fetch('/data/categories.json');
        if (!response.ok) throw new Error('Failed to load categories');
        
        this.categories = await response.json();
        this.renderCategories();
      } catch (error) {
        console.error('Error loading categories:', error);
        
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
      const categoryButtons = document.querySelectorAll('.category-btn');
      categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
          const category = button.getAttribute('data-category');
          this.filterByCategory(category);
          
          // Update active category button
          categoryButtons.forEach(btn => {
            btn.classList.remove('bg-red-50', 'font-medium');
          });
          button.classList.add('bg-red-50', 'font-medium');
        });
      });
      
      // Sort dropdown
      const sortSelect = document.getElementById('sort-menu');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          this.sortProducts(sortSelect.value);
        });
      }
      
      // Search input
      const searchInput = document.getElementById('product-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.searchProducts(searchInput.value);
        });
        
        // Clear search button
        const clearSearchButton = document.getElementById('clear-search');
        if (clearSearchButton) {
          clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            this.searchProducts('');
          });
        }
      }
    }
  
    /**
     * Filter products by category
     * @param {string} category - The category to filter by
     */
    filterByCategory(category) {
      this.currentCategory = category;
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
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'newest':
            return new Date(b.dateAdded) - new Date(a.dateAdded);
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
      this.filterProducts();
      this.renderProducts();
      
      // Update UI to show search results
      const searchResultsCount = document.getElementById('search-results-count');
      if (searchResultsCount) {
        if (this.searchQuery) {
          searchResultsCount.textContent = `${this.filteredProducts.length} results for "${this.searchQuery}"`;
          searchResultsCount.classList.remove('hidden');
        } else {
          searchResultsCount.classList.add('hidden');
        }
      }
    }
  
    /**
     * Filter products based on current category and search query
     */
    filterProducts() {
      // Start with all products
      let filtered = [...this.products];
      
      // Apply category filter
      if (this.currentCategory !== 'all') {
        filtered = filtered.filter(product => 
          product.category === this.currentCategory || 
          product.categories.includes(this.currentCategory)
        );
      }
      
      // Apply search filter
      if (this.searchQuery) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(this.searchQuery) ||
          product.description.toLowerCase().includes(this.searchQuery) ||
          product.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
        );
      }
      
      this.filteredProducts = filtered;
      
      // Sort based on current sort method
      this.sortProducts(this.currentSort);
    }
  
    /**
     * Render the list of products
     */
    renderProducts() {
      if (!this.productListElement) return;
      
      // Clear product grid
      this.productListElement.innerHTML = '';
      
      // Show "no products found" message if there are no filtered products
      if (this.filteredProducts.length === 0) {
        this.productListElement.innerHTML = `
          <div class="col-span-full text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900">No products found</h3>
            <p class="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        `;
        return;
      }
      
      // Add each product to the grid
      this.filteredProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl';
        productElement.setAttribute('data-category', product.category);
        
        // Check if product is on sale or has a special tag
        const specialBadge = product.onSale ? 
          `<div class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            ${product.discountPercentage}% OFF
          </div>` : 
          (product.isNew ? 
            `<div class="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">NEW</div>` : 
            (product.limited ? 
              `<div class="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">LIMITED</div>` : '')
          );
        
        // Calculate sale price if the product is on sale
        const priceDisplay = product.onSale ? 
          `<span class="line-through text-gray-400">$${product.originalPrice.toFixed(2)}</span>
           <span class="font-bold text-red-500 ml-2">$${product.price.toFixed(2)}</span>` : 
          `<span class="font-bold text-red-500">$${product.price.toFixed(2)}</span>`;
        
        // Rating stars display
        const rating = this.generateRatingStars(product.rating);
        
        productElement.innerHTML = `
          <a href="product-detail.html?id=${product.id}" class="block relative">
            ${specialBadge}
            <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
              <h3 class="text-xl font-bold text-gray-700">${product.name}</h3>
              <div class="flex items-center text-yellow-400 text-sm mt-1">
                ${rating}
                <span class="text-gray-500 ml-1">(${product.reviewCount})</span>
              </div>
              <p class="text-gray-600 text-sm my-2 line-clamp-2">${product.description}</p>
              <div class="flex justify-between items-center mt-4">
                <div>
                  ${priceDisplay}
                </div>
                <button class="add-to-cart px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  data-id="${product.id}" 
                  data-name="${product.name}" 
                  data-price="${product.price}"
                  data-image="${product.image}">
                  Add to Cart
                </button>
              </div>
            </div>
          </a>
        `;
        
        this.productListElement.appendChild(productElement);
      });
    }
  
    /**
     * Generate rating stars HTML
     * @param {number} rating - The rating value (0-5)
     * @returns {string} The HTML for the rating stars
     */
    generateRatingStars(rating) {
      let starsHtml = '';
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
      
      // Full stars
      for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
      }
      
      // Half star
      if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
      }
      
      // Empty stars
      for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
      }
      
      return starsHtml;
    }
  
    /**
     * Render category filters
     */
    renderCategories() {
      const categoriesContainer = document.getElementById('categories-container');
      if (!categoriesContainer) return;
      
      // Clear categories container
      categoriesContainer.innerHTML = `
        <button class="category-btn w-full text-left p-3 rounded-lg hover:bg-red-50 transition mb-1 bg-red-50 font-medium" data-category="all">
          All Products
        </button>
      `;
      
      // Add each category
      this.categories.forEach(category => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'category-btn w-full text-left p-3 rounded-lg hover:bg-red-50 transition mb-1';
        categoryButton.setAttribute('data-category', category.id);
        
        // Add icon if present
        const iconHtml = category.icon ? `<i class="${category.icon} mr-2"></i>` : '';
        
        categoryButton.innerHTML = `${iconHtml}${category.name}`;
        
        categoriesContainer.appendChild(categoryButton);
      });
    }
  
    /**
     * Load product detail page
     */
    loadProductDetail() {
      // Get product ID from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      
      if (!productId) {
        this.showError('Product not found');
        return;
      }
      
      // Find product by ID
      const product = this.products.find(product => product.id === productId);
      
      if (!product) {
        this.showError('Product not found');
        return;
      }
      
      // Update page title
      document.title = `${product.name} - Djini's Bakehouse`;
      
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
      const productDetailElement = document.getElementById('product-detail');
      if (!productDetailElement) return;
      
      // Generate rating stars
      const rating = this.generateRatingStars(product.rating);
      
      // Calculate sale price if the product is on sale
      const priceDisplay = product.onSale ? 
        `<span class="line-through text-gray-400 text-xl">$${product.originalPrice.toFixed(2)}</span>
         <span class="font-bold text-red-500 text-3xl ml-2">$${product.price.toFixed(2)}</span>` : 
        `<span class="font-bold text-red-500 text-3xl">$${product.price.toFixed(2)}</span>`;
      
      // Sale badge
      const saleBadge = product.onSale ? 
        `<span class="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
          ${product.discountPercentage}% OFF
        </span>` : '';
      
      // Format ingredients as a list
      const ingredientsList = product.ingredients ? 
        `<div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">Ingredients</h3>
          <ul class="list-disc pl-5 text-gray-600">
            ${product.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
          </ul>
        </div>` : '';
      
      // Format nutrition info as a table
      const nutritionInfo = product.nutrition ? 
        `<div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">Nutrition Information</h3>
          <table class="w-full text-sm text-gray-600">
            <tbody>
              ${Object.entries(product.nutrition).map(([key, value]) => `
                <tr class="border-b">
                  <td class="py-2 font-medium">${key}</td>
                  <td class="py-2 text-right">${value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : '';
      
      // Format tags
      const tagsHtml = product.tags ? 
        `<div class="flex flex-wrap gap-2 mt-4">
          ${product.tags.map(tag => `
            <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              ${tag}
            </span>
          `).join('')}
        </div>` : '';
      
      productDetailElement.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div class="bg-white p-4 rounded-lg shadow-md">
              <img src="${product.image}" alt="${product.name}" class="w-full h-auto rounded-lg">
            </div>
            ${product.gallery ? `
              <div class="grid grid-cols-4 gap-2 mt-4">
                ${product.gallery.map(img => `
                  <div class="cursor-pointer product-thumbnail">
                    <img src="${img}" alt="${product.name}" class="w-full h-20 object-cover rounded-lg">
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div>
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h1 class="text-3xl font-bold text-gray-800">${product.name}</h1>
              
              <div class="flex items-center mt-2">
                <div class="flex items-center text-yellow-400">
                  ${rating}
                </div>
                <span class="text-gray-600 ml-2">${product.rating} (${product.reviewCount} reviews)</span>
              </div>
              
              <div class="mt-4 flex items-center">
                ${priceDisplay}
                ${saleBadge}
              </div>
              
              <div class="mt-6 text-gray-600">
                <p>${product.description}</p>
              </div>
              
              ${ingredientsList}
              
              ${nutritionInfo}
              
              <div class="mt-6">
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
                
                <button id="add-to-wishlist" class="mt-4 w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
                  <i class="far fa-heart mr-2"></i> Add to Wishlist
                </button>
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
                  <p class="text-sm text-gray-600">All our products are made fresh daily with high-quality ingredients. We take pride in our baking process and quality control.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-12">
          <div class="border-b border-gray-200">
            <ul class="flex -mb-px">
              <li class="mr-1">
                <a href="#description" class="tab-link inline-block p-4 text-red-500 border-b-2 border-red-500 rounded-t-lg">Description</a>
              </li>
              <li class="mr-1">
                <a href="#reviews" class="tab-link inline-block p-4 text-gray-500 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 rounded-t-lg">Reviews</a>
              </li>
              <li class="mr-1">
                <a href="#shipping" class="tab-link inline-block p-4 text-gray-500 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 rounded-t-lg">Shipping & Returns</a>
              </li>
            </ul>
          </div>
          
          <div id="tab-content" class="py-6">
            <div id="description" class="tab-pane">
              <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
                <div class="prose text-gray-600">
                  ${product.longDescription || product.description}
                </div>
              </div>
            </div>
            
            <div id="reviews" class="tab-pane hidden">
              <div class="bg-white p-6 rounded-lg shadow-md">
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
              <div class="bg-white p-6 rounded-lg shadow-md">
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
     * Set up product detail page events
     * @param {Object} product - The product
     */
    setupProductDetailEvents(product) {
      // Quantity input
      const quantityInput = document.getElementById('product-quantity');
      const decreaseBtn = document.getElementById('decrease-quantity');
      const increaseBtn = document.getElementById('increase-quantity');
      
      if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', () => {
          const currentVal = parseInt(quantityInput.value);
          if (currentVal > 1) {
            quantityInput.value = currentVal - 1;
          }
        });
        
        increaseBtn.addEventListener('click', () => {
          const currentVal = parseInt(quantityInput.value);
          quantityInput.value = currentVal + 1;
        });
      }
      
      // Add to cart button
      const addToCartBtn = document.getElementById('add-to-cart-detail');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
          const quantity = parseInt(quantityInput.value);
          
          // Add to cart with quantity
          for (let i = 0; i < quantity; i++) {
            window.djinisCart.addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: 1
            });
          }
          
          window.djinisCart.showToast(`${quantity} ${product.name} added to cart!`);
        });
      }
      
      // Add to wishlist
      const wishlistBtn = document.getElementById('add-to-wishlist');
      if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
          // Check if the user is logged in
          const isLoggedIn = localStorage.getItem('djinisUserAuth') !== null;
          
          if (!isLoggedIn) {
            // Redirect to login page with return URL
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
          }
          
          // Add to wishlist
          const wishlist = JSON.parse(localStorage.getItem('djinisWishlist')) || [];
          
          // Check if product is already in wishlist
          const existingItem = wishlist.find(item => item.id === product.id);
          
          if (!existingItem) {
            wishlist.push({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              dateAdded: new Date().toISOString()
            });
            
            localStorage.setItem('djinisWishlist', JSON.stringify(wishlist));
            
            // Update UI
            wishlistBtn.innerHTML = '<i class="fas fa-heart text-red-500 mr-2"></i> Added to Wishlist';
            
            // Show toast
            window.djinisCart.showToast(`${product.name} added to wishlist!`);
          } else {
            // Remove from wishlist
            const updatedWishlist = wishlist.filter(item => item.id !== product.id);
            localStorage.setItem('djinisWishlist', JSON.stringify(updatedWishlist));
            
            // Update UI
            wishlistBtn.innerHTML = '<i class="far fa-heart mr-2"></i> Add to Wishlist';
            
            // Show toast
            window.djinisCart.showToast(`${product.name} removed from wishlist!`);
          }
        });
        
        // Check if product is already in wishlist
        const wishlist = JSON.parse(localStorage.getItem('djinisWishlist')) || [];
        const existingItem = wishlist.find(item => item.id === product.id);
        
        if (existingItem) {
          wishlistBtn.innerHTML = '<i class="fas fa-heart text-red-500 mr-2"></i> Added to Wishlist';
        }
      }
      
      // Tabs functionality
      const tabLinks = document.querySelectorAll('.tab-link');
      const tabPanes = document.querySelectorAll('.tab-pane');
      
      tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Get tab ID from href
          const tabId = link.getAttribute('href').substring(1);
          
          // Hide all tab panes
          tabPanes.forEach(pane => {
            pane.classList.add('hidden');
          });
          
          // Show selected tab pane
          document.getElementById(tabId).classList.remove('hidden');
          
          // Update active tab link
          tabLinks.forEach(l => {
            l.classList.remove('text-red-500', 'border-red-500');
            l.classList.add('text-gray-500', 'border-transparent');
          });
          
          link.classList.remove('text-gray-500', 'border-transparent');
          link.classList.add('text-red-500', 'border-red-500');
        });
      });
      
      // Product image gallery
      const thumbnails = document.querySelectorAll('.product-thumbnail');
      const mainImage = document.querySelector('#product-detail img');
      
      if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumbnail => {
          thumbnail.addEventListener('click', () => {
            const imgSrc = thumbnail.querySelector('img').getAttribute('src');
            mainImage.setAttribute('src', imgSrc);
            
            // Add active class to clicked thumbnail
            thumbnails.forEach(t => {
              t.classList.remove('ring-2', 'ring-red-500');
            });
            thumbnail.classList.add('ring-2', 'ring-red-500');
          });
        });
      }
      
      // Load reviews when tab is clicked
      document.querySelector('a[href="#reviews"]').addEventListener('click', () => {
        this.loadProductReviews(product.id);
      });
    }
  
    /**
     * Load product reviews
     * @param {string} productId - The product ID
     */
    async loadProductReviews(productId) {
      const reviewsContainer = document.getElementById('reviews-container');
      if (!reviewsContainer) return;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we're using mock data
        const reviews = await this.getMockReviews(productId);
        
        // Calculate average rating
        const avgRating = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
        
        // Generate rating breakdown
        const ratingCounts = [0, 0, 0, 0, 0];
        reviews.forEach(review => {
          ratingCounts[5 - review.rating]++;
        });
        
        const ratingPercentages = ratingCounts.map(count => (count / reviews.length) * 100);
        
        // Render reviews summary
        reviewsContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div class="text-center bg-gray-50 p-6 rounded-lg">
              <div class="text-5xl font-bold text-gray-800 mb-2">${avgRating.toFixed(1)}</div>
              <div class="flex items-center justify-center text-yellow-400 text-xl mb-2">
                ${this.generateRatingStars(avgRating)}
              </div>
              <p class="text-gray-600">Based on ${reviews.length} reviews</p>
            </div>
            
            <div class="md:col-span-2 bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold mb-4">Rating Distribution</h3>
              ${[5, 4, 3, 2, 1].map((star, index) => `
                <div class="flex items-center mb-2">
                  <div class="w-12 text-right mr-2">${star} star</div>
                  <div class="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${ratingPercentages[index]}%"></div>
                  </div>
                  <div class="w-12 text-left ml-2">${ratingCounts[index]}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="mb-8">
            <button id="write-review-btn" class="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition">
              Write a Review
            </button>
          </div>
          
          <div id="review-form" class="hidden bg-gray-50 p-6 rounded-lg mb-8">
            <h3 class="text-lg font-semibold mb-4">Write a Review</h3>
            <form id="product-review-form">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div class="flex text-3xl text-gray-400">
                  <i class="cursor-pointer review-star far fa-star" data-rating="1"></i>
                  <i class="cursor-pointer review-star far fa-star" data-rating="2"></i>
                  <i class="cursor-pointer review-star far fa-star" data-rating="3"></i>
                  <i class="cursor-pointer review-star far fa-star" data-rating="4"></i>
                  <i class="cursor-pointer review-star far fa-star" data-rating="5"></i>
                </div>
              </div>
              
              <div class="mb-4">
                <label for="review-title" class="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                <input type="text" id="review-title" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
              </div>
              
              <div class="mb-4">
                <label for="review-text" class="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea id="review-text" rows="4" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
              </div>
              
              <div class="flex justify-end">
                <button type="button" id="cancel-review-btn" class="mr-2 px-4 py-2 border rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
          
          <div class="space-y-6">
            ${reviews.map(review => `
              <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center text-yellow-400 mb-1">
                      ${this.generateRatingStars(review.rating)}
                    </div>
                    <h4 class="font-bold text-gray-800">${review.title}</h4>
                  </div>
                  <div class="text-sm text-gray-500">
                    ${new Date(review.date).toLocaleDateString()}
                  </div>
                </div>
                <p class="text-gray-600 mt-2">${review.text}</p>
                <div class="mt-3 flex items-center text-sm">
                  <div class="text-gray-500 mr-4">
                    <span class="font-medium">${review.author}</span>
                    ${review.verifiedPurchase ? '<span class="ml-2 text-green-600">✓ Verified Purchase</span>' : ''}
                  </div>
                  <div class="flex items-center">
                    <button class="review-helpful-btn flex items-center text-gray-500 hover:text-gray-700" data-review-id="${review.id}">
                      <i class="far fa-thumbs-up mr-1"></i>
                      Helpful (${review.helpfulCount || 0})
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Add event listeners for review functionality
        this.setupReviewEvents();
        
      } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900">Failed to load reviews</h3>
            <p class="text-gray-500 mt-2">Please try again later.</p>
          </div>
        `;
      }
    }
  
    /**
     * Set up review events
     */
    setupReviewEvents() {
      // Write review button
      const writeReviewBtn = document.getElementById('write-review-btn');
      const reviewForm = document.getElementById('review-form');
      const cancelReviewBtn = document.getElementById('cancel-review-btn');
      
      if (writeReviewBtn && reviewForm) {
        writeReviewBtn.addEventListener('click', () => {
          // Check if user is logged in
          const isLoggedIn = localStorage.getItem('djinisUserAuth') !== null;
          
          if (!isLoggedIn) {
            // Redirect to login page with return URL
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
          }
          
          reviewForm.classList.remove('hidden');
          writeReviewBtn.classList.add('hidden');
        });
      }
      
      if (cancelReviewBtn && reviewForm && writeReviewBtn) {
        cancelReviewBtn.addEventListener('click', () => {
          reviewForm.classList.add('hidden');
          writeReviewBtn.classList.remove('hidden');
        });
      }
      
      // Rating stars
      const ratingStars = document.querySelectorAll('.review-star');
      let selectedRating = 0;
      
      ratingStars.forEach(star => {
        star.addEventListener('mouseover', () => {
          const rating = parseInt(star.getAttribute('data-rating'));
          
          // Highlight stars
          ratingStars.forEach(s => {
            const r = parseInt(s.getAttribute('data-rating'));
            s.classList.remove('fas', 'far');
            s.classList.add(r <= rating ? 'fas' : 'far');
          });
        });
        
        star.addEventListener('mouseout', () => {
          // Reset stars
          ratingStars.forEach(s => {
            const r = parseInt(s.getAttribute('data-rating'));
            s.classList.remove('fas', 'far');
            s.classList.add(r <= selectedRating ? 'fas' : 'far');
          });
        });
        
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.getAttribute('data-rating'));
          
          // Set stars
          ratingStars.forEach(s => {
            const r = parseInt(s.getAttribute('data-rating'));
            s.classList.remove('fas', 'far');
            s.classList.add(r <= selectedRating ? 'fas' : 'far');
          });
        });
      });
      
      // Review form submission
      const reviewForm2 = document.getElementById('product-review-form');
      if (reviewForm2) {
        reviewForm2.addEventListener('submit', (e) => {
          e.preventDefault();
          
          // Get form values
          const title = document.getElementById('review-title').value;
          const text = document.getElementById('review-text').value;
          
          if (!selectedRating) {
            alert('Please select a rating');
            return;
          }
          
          if (!title || !text) {
            alert('Please fill in all fields');
            return;
          }
          
          // Get user info
          const userData = JSON.parse(localStorage.getItem('djinisUserAuth')) || {};
          
          // Create review object
          const review = {
            id: Date.now().toString(),
            productId: new URLSearchParams(window.location.search).get('id'),
            rating: selectedRating,
            title,
            text,
            author: `${userData.firstName || 'Anonymous'} ${userData.lastName || ''}`.trim(),
            date: new Date().toISOString(),
            verifiedPurchase: true,
            helpfulCount: 0
          };
          
          // Save review
          const reviews = JSON.parse(localStorage.getItem('djinisReviews')) || [];
          reviews.push(review);
          localStorage.setItem('djinisReviews', JSON.stringify(reviews));
          
          // Show success message
          window.djinisCart.showToast('Review submitted successfully!');
          
          // Reload reviews
          this.loadProductReviews(review.productId);
        });
      }
      
      // Helpful buttons
      const helpfulButtons = document.querySelectorAll('.review-helpful-btn');
      helpfulButtons.forEach(button => {
        button.addEventListener('click', () => {
          const reviewId = button.getAttribute('data-review-id');
          
          // Get reviews
          const reviews = JSON.parse(localStorage.getItem('djinisReviews')) || [];
          
          // Find review
          const reviewIndex = reviews.findIndex(r => r.id === reviewId);
          if (reviewIndex === -1) return;
          
          // Increment helpful count
          reviews[reviewIndex].helpfulCount = (reviews[reviewIndex].helpfulCount || 0) + 1;
          
          // Save reviews
          localStorage.setItem('djinisReviews', JSON.stringify(reviews));
          
          // Update UI
          button.innerHTML = `
            <i class="fas fa-thumbs-up mr-1"></i>
            Helpful (${reviews[reviewIndex].helpfulCount})
          `;
          button.disabled = true;
          button.classList.add('text-blue-500');
        });
      });
    }
  
    /**
     * Load related products
     * @param {Object} product - The current product
     */
    loadRelatedProducts(product) {
      const relatedProductsElement = document.getElementById('related-products');
      if (!relatedProductsElement) return;
      
      // Find related products based on category or tags
      const relatedProducts = this.products
        .filter(p => 
          p.id !== product.id && 
          (p.category === product.category || 
           p.tags.some(tag => product.tags.includes(tag)))
        )
        .slice(0, 4); // Get up to 4 related products
      
      if (relatedProducts.length === 0) {
        relatedProductsElement.classList.add('hidden');
        return;
      }
      
      relatedProductsElement.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          ${relatedProducts.map(relatedProduct => `
            <div class="product-card bg-white shadow-lg rounded-lg overflow-hidden">
              <a href="product-detail.html?id=${relatedProduct.id}">
                <img src="${relatedProduct.image}" alt="${relatedProduct.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                  <h3 class="text-lg font-bold text-gray-700">${relatedProduct.name}</h3>
                  <div class="flex items-center text-yellow-400 text-sm mt-1">
                    ${this.generateRatingStars(relatedProduct.rating)}
                    <span class="text-gray-500 ml-1">(${relatedProduct.reviewCount})</span>
                  </div>
                  <div class="flex justify-between items-center mt-3">
                    <span class="font-bold text-red-500">${relatedProduct.price.toFixed(2)}</span>
                    <button class="add-to-cart px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      data-id="${relatedProduct.id}" 
                      data-name="${relatedProduct.name}" 
                      data-price="${relatedProduct.price}"
                      data-image="${relatedProduct.image}">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </a>
            </div>
          `).join('')}
        </div>
      `;
    }
  
    /**
     * Show error message
     * @param {string} message - The error message
     */
    showError(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'bg-red-100 text-red-700 p-4 rounded-lg my-4';
      errorElement.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${message}</span>
        </div>
      `;
      
      // Find a place to insert the error
      const container = document.querySelector('main') || document.body;
      container.prepend(errorElement);
    }
  
    /**
     * Get mock products data
     * @returns {Array} Array of product objects
     */
    getMockProducts() {
      return [
        {
          id: 'apple-strudel-1',
          name: 'Apple Strudel',
          price: 6.99,
          originalPrice: 8.99,
          description: 'Savor the warm, flaky goodness of apple strudel with cinnamon-dusted apples wrapped in delicate pastry.',
          longDescription: 'Our Apple Strudel is a traditional European pastry that combines thinly sliced apples, cinnamon, sugar, and raisins, all wrapped in layers of delicate, flaky pastry. Baked to golden perfection, each slice offers the perfect balance of sweet and tart flavors with a hint of warm spices. Served with a dusting of powdered sugar.',
          image: 'images/Apple Strudle.jpg',
          gallery: [
            'images/Apple Strudle.jpg',
            'images/products/apple-strudel-2.jpg',
            'images/products/apple-strudel-3.jpg',
            'images/products/apple-strudel-slice.jpg'
          ],
          category: 'pastry',
          categories: ['pastry', 'dessert'],
          tags: ['apple', 'pastry', 'dessert', 'sweet'],
          rating: 4.8,
          reviewCount: 124,
          popularity: 95,
          onSale: true,
          discountPercentage: 22,
          isNew: false,
          limited: false,
          dateAdded: '2023-03-15T00:00:00Z',
          ingredients: [
            'Flour', 'Butter', 'Apples', 'Sugar', 'Cinnamon', 'Raisins', 'Powdered Sugar'
          ],
          nutrition: {
            'Calories': '320 kcal',
            'Fat': '14g',
            'Carbohydrates': '45g',
            'Protein': '4g',
            'Sugar': '22g'
          }
        },
        {
          id: 'bagelen-1',
          name: 'Bagelen',
          price: 4.50,
          description: 'A crispy, sweet toasted bread often enjoyed as a snack or dessert with a sprinkle of sugar on top.',
          image: 'images/Bagelen.jpg',
          category: 'bread',
          categories: ['bread', 'snack'],
          tags: ['crispy', 'sweet', 'snack', 'toasted'],
          rating: 4.5,
          reviewCount: 86,
          popularity: 85,
          onSale: false,
          isNew: false,
          limited: false,
          dateAdded: '2023-05-20T00:00:00Z'
        },
        {
          id: 'baguette-1',
          name: 'Baguette',
          price: 3.99,
          description: 'A long, crusty French bread, perfect for sandwiches or with butter and jam.',
          image: 'images/Baguette.jpg',
          category: 'bread',
          categories: ['bread', 'french'],
          tags: ['crusty', 'french', 'traditional', 'sandwich'],
          rating: 4.7,
          reviewCount: 152,
          popularity: 92,
          onSale: false,
          isNew: false,
          limited: false,
          dateAdded: '2023-01-10T00:00:00Z'
        },
        {
          id: 'beef-curry-puff-1',
          name: 'Beef Curry Puff',
          price: 5.25,
          description: 'A flaky pastry filled with savory beef curry, spices, and potatoes. Perfect snack!',
          image: 'images/Beef Curry Puff.jpg',
          category: 'savory',
          categories: ['savory', 'pastry', 'snack'],
          tags: ['beef', 'curry', 'savory', 'spicy', 'pastry'],
          rating: 4.6,
          reviewCount: 98,
          popularity: 88,
          onSale: false,
          isNew: true,
          limited: false,
          dateAdded: '2024-01-05T00:00:00Z'
        },
        {
          id: 'christmas-stollen-1',
          name: 'Festive Stollen',
          price: 12.99,
          description: 'Traditional fruit bread filled with dried fruits, nuts, and dusted with powdered sugar.',
          image: 'images/Christmas stollen.jpg',
          category: 'special',
          categories: ['bread', 'special', 'seasonal'],
          tags: ['festive', 'fruit', 'nuts', 'traditional', 'seasonal'],
          rating: 4.9,
          reviewCount: 64,
          popularity: 96,
          onSale: false,
          isNew: false,
          limited: true,
          dateAdded: '2023-11-15T00:00:00Z'
        },
        {
          id: 'croissant-1',
          name: 'Croissant',
          price: 3.50,
          description: 'A buttery, flaky French pastry, golden-brown and delicious.',
          image: 'images/Croissant.jpg',
          category: 'pastry',
          categories: ['pastry', 'french', 'breakfast'],
          tags: ['buttery', 'flaky', 'french', 'breakfast'],
          rating: 4.7,
          reviewCount: 235,
          popularity: 98,
          onSale: false,
          isNew: false,
          limited: false,
          dateAdded: '2023-01-05T00:00:00Z'
        },
        {
          id: 'triple-cheese-bread-1',
          name: 'Triple Cheese Bread',
          price: 6.74,
          originalPrice: 8.99,
          description: 'A savory bread loaded with three different types of cheese baked to perfection.',
          image: 'images/Triple cheese bread.jpg',
          category: 'bread',
          categories: ['bread', 'savory', 'cheese'],
          tags: ['cheese', 'savory', 'baked'],
          rating: 4.8,
          reviewCount: 115,
          popularity: 94,
          onSale: true,
          discountPercentage: 25,
          isNew: false,
          limited: false,
          dateAdded: '2023-07-12T00:00:00Z'
        },
        {
          id: 'maritozzo-1',
          name: 'Maritozzo',
          price: 7.50,
          description: 'Experience the rich, creamy delight of our Maritozzo, a classic Italian treat at its finest!',
          image: 'images/Maritozzo.jpg',
          category: 'pastry',
          categories: ['pastry', 'italian', 'dessert'],
          tags: ['creamy', 'italian', 'sweet', 'dessert'],
          rating: 4.9,
          reviewCount: 78,
          popularity: 90,
          onSale: false,
          isNew: true,
          limited: false,
          dateAdded: '2023-12-20T00:00:00Z'
        }
      ];
    }
  
    /**
     * Get mock categories data
     * @returns {Array} Array of category objects
     */
    getMockCategories() {
      return [
        {
          id: 'bread',
          name: 'Bread',
          icon: 'fas fa-bread-slice'
        },
        {
          id: 'pastry',
          name: 'Pastries',
          icon: 'fas fa-cookie'
        },
        {
          id: 'cake',
          name: 'Cakes',
          icon: 'fas fa-birthday-cake'
        },
        {
          id: 'savory',
          name: 'Savory Items',
          icon: 'fas fa-cheese'
        },
        {
          id: 'dessert',
          name: 'Desserts',
          icon: 'fas fa-ice-cream'
        },
        {
          id: 'special',
          name: 'Seasonal Specials',
          icon: 'fas fa-star'
        }
      ];
    }
  
    /**
     * Get mock reviews data
     * @param {string} productId - The product ID
     * @returns {Array} Array of review objects
     */
    async getMockReviews(productId) {
      // Check localStorage first
      const storedReviews = JSON.parse(localStorage.getItem('djinisReviews')) || [];
      const productReviews = storedReviews.filter(review => review.productId === productId);
      
      // If there are stored reviews for this product, use them
      if (productReviews.length > 0) {
        return productReviews;
      }
      
      // Otherwise, return mock reviews
      return [
        {
          id: '1',
          productId: productId,
          author: 'Jane D.',
          rating: 5,
          title: 'Absolutely delicious!',
          text: 'This is one of the best pastries I\'ve ever had! The flavors are perfectly balanced, and the texture is just right. I\'ve already ordered it three times this month!',
          date: '2023-12-10T12:30:00Z',
          verifiedPurchase: true,
          helpfulCount: 24
        },
        {
          id: '2',
          productId: productId,
          author: 'Mark T.',
          rating: 4,
          title: 'Great taste, but a bit pricey',
          text: 'The quality is excellent, and it tastes amazing. My only complaint is that it\'s a bit on the expensive side, but I guess you get what you pay for. Will definitely order again for special occasions.',
          date: '2023-11-22T09:15:00Z',
          verifiedPurchase: true,
          helpfulCount: 12
        },
        {
          id: '3',
          productId: productId,
          author: 'Sarah L.',
          rating: 5,
          title: 'Perfect for breakfast',
          text: 'I ordered this for a weekend brunch with friends, and everyone loved it! It\'s not too sweet, which I appreciate, and pairs perfectly with coffee. The delivery was prompt, and it arrived still fresh.',
          date: '2023-10-15T15:45:00Z',
          verifiedPurchase: true,
          helpfulCount: 18
        },
        {
          id: '4',
          productId: productId,
          author: 'Robert K.',
          rating: 3,
          title: 'Good but not great',
          text: 'It was good, but I\'ve had better. The flavor was nice, but it was a bit dry for my taste. I might try something else next time.',
          date: '2023-09-30T11:20:00Z',
          verifiedPurchase: false,
          helpfulCount: 5
        },
        {
          id: '5',
          productId: productId,
          author: 'Emma J.',
          rating: 5,
          title: 'Best in town!',
          text: 'I\'ve tried similar items from other bakeries in the area, and Djini\'s version is by far the best! The texture is perfect, and the flavors are so rich. Highly recommend!',
          date: '2023-09-15T10:10:00Z',
          verifiedPurchase: true,
          helpfulCount: 30
        }
      ];
    }
  }
  
  // Initialize product manager on DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.djinisProducts = new ProductManager();
  });