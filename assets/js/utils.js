/**
 * Djini's Bakehouse - Utility Functions
 * Contains useful helper functions used throughout the website
 */

class DjinisUtils {
    /**
     * Format currency
     * @param {number} amount - The amount to format
     * @param {string} currencyCode - Currency code (default: USD)
     * @returns {string} Formatted currency string
     */
    static formatCurrency(amount, currencyCode = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    }
  
    /**
     * Format date
     * @param {string|Date} date - The date to format
     * @param {object} options - Formatting options
     * @returns {string} Formatted date string
     */
    static formatDate(date, options = {}) {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
  
      const mergedOptions = { ...defaultOptions, ...options };
      
      return new Date(date).toLocaleDateString('en-US', mergedOptions);
    }
  
    /**
     * Format time
     * @param {string|Date} date - The date/time to format
     * @returns {string} Formatted time string
     */
    static formatTime(date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  
    /**
     * Get relative time (e.g., "2 hours ago")
     * @param {string|Date} date - The date to format
     * @returns {string} Relative time string
     */
    static getRelativeTime(date) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const now = new Date();
      const then = new Date(date);
      const diffInSeconds = Math.floor((then - now) / 1000);
      
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(diffInSeconds, 'second');
      }
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (Math.abs(diffInMinutes) < 60) {
        return rtf.format(diffInMinutes, 'minute');
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (Math.abs(diffInHours) < 24) {
        return rtf.format(diffInHours, 'hour');
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (Math.abs(diffInDays) < 30) {
        return rtf.format(diffInDays, 'day');
      }
      
      const diffInMonths = Math.floor(diffInDays / 30);
      if (Math.abs(diffInMonths) < 12) {
        return rtf.format(diffInMonths, 'month');
      }
      
      const diffInYears = Math.floor(diffInMonths / 12);
      return rtf.format(diffInYears, 'year');
    }
  
    /**
     * Truncate text with ellipsis
     * @param {string} text - The text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength) {
      if (text.length <= maxLength) {
        return text;
      }
      
      return text.substring(0, maxLength) + '...';
    }
  
    /**
     * Capitalize first letter of each word
     * @param {string} text - The text to capitalize
     * @returns {string} Capitalized text
     */
    static capitalizeWords(text) {
      return text.replace(/\b\w/g, char => char.toUpperCase());
    }
  
    /**
     * Validate email address
     * @param {string} email - The email to validate
     * @returns {boolean} True if valid
     */
    static isValidEmail(email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  
    /**
     * Validate phone number
     * @param {string} phone - The phone number to validate
     * @returns {boolean} True if valid
     */
    static isValidPhone(phone) {
      const phonePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      return phonePattern.test(phone);
    }
  
    /**
     * Generate random ID
     * @param {number} length - ID length
     * @returns {string} Random ID
     */
    static generateId(length = 8) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = '';
      
      for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return id;
    }
  
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
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
     * Get URL parameter
     * @param {string} name - Parameter name
     * @returns {string|null} Parameter value
     */
    static getUrlParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
  
    /**
     * Get URL hash parameter
     * @returns {string} Hash parameter
     */
    static getUrlHash() {
      return window.location.hash.substring(1);
    }
  
    /**
     * Set URL parameter without page reload
     * @param {string} name - Parameter name
     * @param {string} value - Parameter value
     */
    static setUrlParam(name, value) {
      const url = new URL(window.location);
      url.searchParams.set(name, value);
      window.history.pushState({}, '', url);
    }
  
    /**
     * Serialize form data
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data as object
     */
    static serializeForm(form) {
      const formData = new FormData(form);
      const data = {};
      
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      
      return data;
    }
  
    /**
     * Create element with attributes and content
     * @param {string} tag - Element tag name
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement|Array} content - Element content
     * @returns {HTMLElement} Created element
     */
    static createElement(tag, attributes = {}, content = null) {
      const element = document.createElement(tag);
      
      // Set attributes
      for (const [key, value] of Object.entries(attributes)) {
        if (key === 'class') {
          element.className = value;
        } else if (key === 'dataset') {
          for (const [dataKey, dataValue] of Object.entries(value)) {
            element.dataset[dataKey] = dataValue;
          }
        } else {
          element.setAttribute(key, value);
        }
      }
      
      // Set content
      if (content !== null) {
        if (typeof content === 'string') {
          element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          element.appendChild(content);
        } else if (Array.isArray(content)) {
          content.forEach(item => {
            if (typeof item === 'string') {
              element.innerHTML += item;
            } else if (item instanceof HTMLElement) {
              element.appendChild(item);
            }
          });
        }
      }
      
      return element;
    }
  
    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
  
    /**
     * Scroll to element
     * @param {HTMLElement|string} element - Element or selector
     * @param {number} offset - Offset from top
     * @param {string} behavior - Scroll behavior
     */
    static scrollTo(element, offset = 0, behavior = 'smooth') {
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) 
        : element;
      
      if (!targetElement) return;
      
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior
      });
    }
  
    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    static formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    static formatPhoneNumber(phone) {
      const cleaned = ('' + phone).replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      
      if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
      }
      
      return phone;
    }
  
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Promise that resolves when text is copied
     */
    static copyToClipboard(text) {
      // Use newer Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            resolve();
          } else {
            reject(new Error('Unable to copy text'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }
  
    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    static showToast(message, type = 'success', duration = 3000) {
      // Create toast container if it doesn't exist
      let toastContainer = document.getElementById('toast-container');
      
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
        document.body.appendChild(toastContainer);
      }
      
      // Create toast element
      const toast = document.createElement('div');
      toast.className = 'transform transition-all duration-300 translate-x-full';
      
      // Set toast color based on type
      let bgColor, textColor, icon;
      switch (type) {
        case 'error':
          bgColor = 'bg-red-500';
          textColor = 'text-white';
          icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
          break;
        case 'warning':
          bgColor = 'bg-yellow-500';
          textColor = 'text-white';
          icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
          break;
        case 'info':
          bgColor = 'bg-blue-500';
          textColor = 'text-white';
          icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
          break;
        default: // success
          bgColor = 'bg-green-500';
          textColor = 'text-white';
          icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
      }
      
      toast.className += ` ${bgColor} ${textColor} rounded-lg shadow-lg px-4 py-3 flex items-center max-w-xs`;
      
      // Add content
      toast.innerHTML = `
        <div class="flex-shrink-0 mr-2">
          ${icon}
        </div>
        <div class="flex-1">${message}</div>
        <button class="ml-2 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;
      
      // Add to container
      toastContainer.appendChild(toast);
      
      // Show toast with animation
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
      }, 10);
      
      // Set up close button
      const closeButton = toast.querySelector('button');
      closeButton.addEventListener('click', () => {
        removeToast();
      });
      
      // Set up auto-removal
      const timeoutId = setTimeout(() => {
        removeToast();
      }, duration);
      
      // Remove toast function
      function removeToast() {
        clearTimeout(timeoutId);
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
        
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }
  
    /**
     * Validate password strength
     * @param {string} password - Password to check
     * @returns {Object} Validation result object with score and feedback
     */
    static validatePasswordStrength(password) {
      let score = 0;
      const feedback = [];
      
      // Length check
      if (password.length < 8) {
        feedback.push('Password should be at least 8 characters long');
      } else {
        score += 1;
      }
      
      // Contains lowercase letters
      if (/[a-z]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Add lowercase letters');
      }
      
      // Contains uppercase letters
      if (/[A-Z]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Add uppercase letters');
      }
      
      // Contains numbers
      if (/\d/.test(password)) {
        score += 1;
      } else {
        feedback.push('Add numbers');
      }
      
      // Contains special characters
      if (/[^a-zA-Z0-9]/.test(password)) {
        score += 1;
      } else {
        feedback.push('Add special characters');
      }
      
      // Calculate strength
      let strength = 'weak';
      if (score >= 4) {
        strength = 'strong';
      } else if (score >= 3) {
        strength = 'medium';
      }
      
      return {
        score,
        strength,
        feedback
      };
    }
  
    /**
     * Format quantity with unit
     * @param {number} value - Quantity value
     * @param {string} unit - Unit of measurement
     * @param {boolean} showZero - Whether to show zero values
     * @returns {string} Formatted quantity
     */
    static formatQuantity(value, unit, showZero = false) {
      if (value === 0 && !showZero) {
        return '';
      }
      
      if (value === 1) {
        // Handle singular units (e.g., "1 piece" instead of "1 pieces")
        if (unit === 'pieces') return '1 piece';
        if (unit === 'servings') return '1 serving';
      }
      
      return `${value} ${unit}`;
    }
  
    /**
     * Calculate discount percentage
     * @param {number} originalPrice - Original price
     * @param {number} discountedPrice - Discounted price
     * @returns {number} Discount percentage
     */
    static calculateDiscountPercentage(originalPrice, discountedPrice) {
      if (originalPrice <= 0) return 0;
      
      const discount = originalPrice - discountedPrice;
      const percentage = (discount / originalPrice) * 100;
      
      return Math.round(percentage);
    }
  
    /**
     * Apply discount to price
     * @param {number} price - Original price
     * @param {number} discountPercentage - Discount percentage
     * @returns {number} Discounted price
     */
    static applyDiscount(price, discountPercentage) {
      const discount = price * (discountPercentage / 100);
      return price - discount;
    }
  }
  
  // Make utils globally available
  window.DjinisUtils = DjinisUtils;