/**
 * UI Components for Djini's Bakehouse
 * Contains reusable UI component initialization and functionality
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize UI components
  initializeTabs();
  initializeAccordions();
  initializeModals();
  initializeDropdowns();
  initializeQuantityControls();
  initializePasswordStrengthMeters();
  initializeImageGallery();
  initializeFilterButtons();
  initializeSortOptions();
  initializeTooltips();
  initializeBackToTop();
});

/**
 * Initialize tab functionality
 */
function initializeTabs() {
  const tabGroups = document.querySelectorAll(".tab-group");

  tabGroups.forEach((group) => {
    const tabButtons = group.querySelectorAll(".tab-button");
    const tabPanels = group.querySelectorAll(".tab-panel");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Get the target tab
        const targetPanel = document.getElementById(
          button.getAttribute("data-target")
        );

        // Reset all tabs and panels
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanels.forEach((panel) => panel.classList.add("hidden"));

        // Activate clicked tab and panel
        button.classList.add("active");
        targetPanel.classList.remove("hidden");

        // Store active tab in localStorage if specified
        const storeKey = group.getAttribute("data-store-key");
        if (storeKey) {
          localStorage.setItem(storeKey, button.getAttribute("data-target"));
        }
      });
    });

    // Check for stored tab preference
    const storeKey = group.getAttribute("data-store-key");
    if (storeKey) {
      const storedTab = localStorage.getItem(storeKey);
      if (storedTab) {
        const targetButton = group.querySelector(
          `.tab-button[data-target="${storedTab}"]`
        );
        if (targetButton) {
          targetButton.click();
        }
      }
    }

    // Activate first tab if none active
    if (!group.querySelector(".tab-button.active")) {
      const firstButton = group.querySelector(".tab-button");
      if (firstButton) {
        firstButton.click();
      }
    }
  });
}

/**
 * Initialize accordion functionality
 */
function initializeAccordions() {
  const accordions = document.querySelectorAll(".accordion");

  accordions.forEach((accordion) => {
    const headers = accordion.querySelectorAll(".accordion-header");

    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector("i.fa-chevron-down, i.fa-chevron-up");

        // Toggle visibility
        content.classList.toggle("hidden");

        // Toggle icon
        if (icon) {
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-up");
        }

        // Toggle active class
        header.classList.toggle("active");

        // Close other accordions if this is a single-open accordion
        if (
          accordion.classList.contains("single-open") &&
          !content.classList.contains("hidden")
        ) {
          headers.forEach((otherHeader) => {
            if (otherHeader !== header) {
              const otherContent = otherHeader.nextElementSibling;
              const otherIcon = otherHeader.querySelector(
                "i.fa-chevron-down, i.fa-chevron-up"
              );

              otherContent.classList.add("hidden");
              otherHeader.classList.remove("active");

              if (otherIcon) {
                otherIcon.classList.add("fa-chevron-down");
                otherIcon.classList.remove("fa-chevron-up");
              }
            }
          });
        }
      });
    });

    // Open default accordion if specified
    const defaultOpen = accordion.querySelectorAll(
      '.accordion-header[data-default-open="true"]'
    );
    defaultOpen.forEach((header) => {
      if (header.nextElementSibling.classList.contains("hidden")) {
        header.click();
      }
    });
  });
}

/**
 * Initialize modal functionality
 */
function initializeModals() {
  // Open modal buttons
  const modalOpenButtons = document.querySelectorAll("[data-modal-target]");

  modalOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-modal-target");
      const modal = document.getElementById(modalId);

      if (modal) {
        openModal(modal);
      }
    });
  });

  // Close modal buttons
  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");

      if (modal) {
        closeModal(modal);
      }
    });
  });

  // Close modals when clicking overlay
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target);
    }
  });

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModals = document.querySelectorAll(".modal:not(.hidden)");
      openModals.forEach((modal) => {
        closeModal(modal);
      });
    }
  });
}

/**
 * Open a modal
 * @param {HTMLElement} modal - The modal element to open
 */
function openModal(modal) {
  // Show modal
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  // Focus first focusable element
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // Trigger open event
  modal.dispatchEvent(new CustomEvent("modal:open"));
}

/**
 * Close a modal
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
  // Hide modal
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");

  // Return focus to trigger element if available
  const triggerElement = document.querySelector(
    `[data-modal-target="${modal.id}"]`
  );
  if (triggerElement) {
    triggerElement.focus();
  }

  // Trigger close event
  modal.dispatchEvent(new CustomEvent("modal:close"));
}

/**
 * Initialize dropdown menus
 */
function initializeDropdowns() {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();

      const dropdown = toggle.nextElementSibling;
      const isOpen = !dropdown.classList.contains("hidden");

      // Close all dropdowns
      document.querySelectorAll(".dropdown-content").forEach((content) => {
        content.classList.add("hidden");
      });

      // Toggle this dropdown
      if (!isOpen) {
        dropdown.classList.remove("hidden");
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-content").forEach((content) => {
      content.classList.add("hidden");
    });
  });

  // Prevent dropdown content clicks from closing the dropdown
  document.querySelectorAll(".dropdown-content").forEach((content) => {
    content.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });
}

/**
 * Initialize quantity controls (+/-)
 */
function initializeQuantityControls() {
  const quantityControls = document.querySelectorAll(".quantity-control");

  quantityControls.forEach((control) => {
    const minusButton = control.querySelector(".quantity-minus");
    const plusButton = control.querySelector(".quantity-plus");
    const input = control.querySelector('input[type="number"]');

    if (!minusButton || !plusButton || !input) return;

    const min = parseInt(input.getAttribute("min")) || 1;
    const max = parseInt(input.getAttribute("max")) || 99;

    minusButton.addEventListener("click", () => {
      const currentValue = parseInt(input.value);
      if (currentValue > min) {
        input.value = currentValue - 1;
        // Trigger change event
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    plusButton.addEventListener("click", () => {
      const currentValue = parseInt(input.value);
      if (currentValue < max) {
        input.value = currentValue + 1;
        // Trigger change event
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Validate input manually
    input.addEventListener("change", () => {
      let currentValue = parseInt(input.value);

      if (isNaN(currentValue) || currentValue < min) {
        input.value = min;
      } else if (currentValue > max) {
        input.value = max;
      }
    });
  });
}

/**
 * Initialize password strength meters
 */
function initializePasswordStrengthMeters() {
  const passwordInputs = document.querySelectorAll(
    'input[type="password"][data-strength-meter]'
  );

  passwordInputs.forEach((input) => {
    // Create strength meter elements if not present
    const parentElement = input.parentElement;
    let strengthMeter = parentElement.querySelector(".password-strength-meter");
    let strengthText = parentElement.querySelector(".password-strength-text");

    if (!strengthMeter) {
      strengthMeter = document.createElement("div");
      strengthMeter.className =
        "password-strength-meter mt-2 h-1 bg-gray-200 rounded-full overflow-hidden";

      const strengthFill = document.createElement("div");
      strengthFill.className =
        "password-strength-fill h-full transition-all duration-300";

      strengthMeter.appendChild(strengthFill);
      parentElement.appendChild(strengthMeter);
    }

    if (!strengthText) {
      strengthText = document.createElement("p");
      strengthText.className =
        "password-strength-text text-xs mt-1 text-gray-500";
      parentElement.appendChild(strengthText);
    }

    // Check password strength on input
    input.addEventListener("input", () => {
      const password = input.value;
      let strength = 0;
      let message = "";
      let fillClass = "";

      // Check length
      if (password.length >= 8) {
        strength += 1;
      }

      // Check for lowercase
      if (/[a-z]/.test(password)) {
        strength += 1;
      }

      // Check for uppercase
      if (/[A-Z]/.test(password)) {
        strength += 1;
      }

      // Check for numbers
      if (/\d/.test(password)) {
        strength += 1;
      }

      // Check for special characters
      if (/[^a-zA-Z0-9]/.test(password)) {
        strength += 1;
      }

      // Update UI based on strength
      const fill = strengthMeter.querySelector(".password-strength-fill");

      if (password.length === 0) {
        message = "";
        fill.style.width = "0%";
        fill.className = "password-strength-fill h-full";
      } else if (strength < 2) {
        message = "Weak password";
        fill.style.width = "20%";
        fill.className = "password-strength-fill h-full bg-red-500";
      } else if (strength < 3) {
        message = "Fair password";
        fill.style.width = "40%";
        fill.className = "password-strength-fill h-full bg-orange-500";
      } else if (strength < 4) {
        message = "Good password";
        fill.style.width = "60%";
        fill.className = "password-strength-fill h-full bg-yellow-500";
      } else if (strength < 5) {
        message = "Strong password";
        fill.style.width = "80%";
        fill.className = "password-strength-fill h-full bg-blue-500";
      } else {
        message = "Very strong password";
        fill.style.width = "100%";
        fill.className = "password-strength-fill h-full bg-green-500";
      }

      strengthText.textContent = message;
    });
  });
}

/**
 * Initialize product image gallery
 */
function initializeImageGallery() {
  const galleries = document.querySelectorAll(".product-gallery");

  galleries.forEach((gallery) => {
    const mainImage = gallery.querySelector(".gallery-main-image img");
    const thumbnails = gallery.querySelectorAll(".gallery-thumbnail");

    if (!mainImage || thumbnails.length === 0) return;

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
        // Update main image
        const thumbnailImg = thumbnail.querySelector("img");
        if (thumbnailImg) {
          mainImage.src = thumbnailImg.src;

          // Update active state
          thumbnails.forEach((t) => t.classList.remove("active"));
          thumbnail.classList.add("active");
        }
      });
    });

    // Set first thumbnail as active by default
    if (!gallery.querySelector(".gallery-thumbnail.active")) {
      thumbnails[0].classList.add("active");
    }
  });
}

/**
 * Initialize filter buttons
 */
function initializeFilterButtons() {
  const filterGroups = document.querySelectorAll(".filter-group");

  filterGroups.forEach((group) => {
    const filterButtons = group.querySelectorAll(".filter-button");
    const filterTarget = document.querySelector(
      group.getAttribute("data-filter-target")
    );

    if (!filterTarget) return;

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filterValue = button.getAttribute("data-filter");

        // Update active state
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Apply filter
        if (filterValue === "all") {
          // Show all items
          filterTarget.querySelectorAll(".filter-item").forEach((item) => {
            item.classList.remove("hidden");
          });
        } else {
          // Show only matching items
          filterTarget.querySelectorAll(".filter-item").forEach((item) => {
            const itemCategories = item.getAttribute("data-categories");

            if (itemCategories && itemCategories.includes(filterValue)) {
              item.classList.remove("hidden");
            } else {
              item.classList.add("hidden");
            }
          });
        }

        // Update counter if available
        const counter = document.querySelector(".filter-counter");
        if (counter) {
          const visibleItems = filterTarget.querySelectorAll(
            ".filter-item:not(.hidden)"
          ).length;
          counter.textContent = visibleItems;
        }
      });
    });

    // Initialize with first filter (or "all" if available)
    const allButton = group.querySelector('.filter-button[data-filter="all"]');
    const firstButton = group.querySelector(".filter-button");

    if (allButton) {
      allButton.click();
    } else if (firstButton) {
      firstButton.click();
    }
  });
}

/**
 * Initialize sort options
 */
function initializeSortOptions() {
  const sortSelects = document.querySelectorAll(".sort-select");

  sortSelects.forEach((select) => {
    const sortTarget = document.querySelector(
      select.getAttribute("data-sort-target")
    );

    if (!sortTarget) return;

    select.addEventListener("change", () => {
      const sortValue = select.value;
      const sortDirection =
        select.options[select.selectedIndex].getAttribute("data-direction") ||
        "asc";
      const items = Array.from(sortTarget.querySelectorAll(".sort-item"));

      // Sort items
      items.sort((a, b) => {
        let aValue = a.getAttribute(`data-${sortValue}`);
        let bValue = b.getAttribute(`data-${sortValue}`);

        // Convert to proper types for comparison
        if (!isNaN(aValue) && !isNaN(bValue)) {
          // Numeric comparison
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else {
          // String comparison
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        // Compare based on direction
        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // Reorder elements
      items.forEach((item) => {
        sortTarget.appendChild(item);
      });
    });
  });
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
  const tooltipTriggers = document.querySelectorAll("[data-tooltip]");

  tooltipTriggers.forEach((trigger) => {
    const tooltipText = trigger.getAttribute("data-tooltip");
    const tooltipPosition =
      trigger.getAttribute("data-tooltip-position") || "top";

    // Create tooltip element
    const tooltip = document.createElement("div");
    tooltip.className =
      "invisible opacity-0 absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded pointer-events-none transition-opacity duration-200";
    tooltip.textContent = tooltipText;

    // Set tooltip position classes
    switch (tooltipPosition) {
      case "top":
        tooltip.classList.add(
          "bottom-full",
          "left-1/2",
          "transform",
          "-translate-x-1/2",
          "mb-1"
        );
        break;
      case "bottom":
        tooltip.classList.add(
          "top-full",
          "left-1/2",
          "transform",
          "-translate-x-1/2",
          "mt-1"
        );
        break;
      case "left":
        tooltip.classList.add(
          "right-full",
          "top-1/2",
          "transform",
          "-translate-y-1/2",
          "mr-1"
        );
        break;
      case "right":
        tooltip.classList.add(
          "left-full",
          "top-1/2",
          "transform",
          "-translate-y-1/2",
          "ml-1"
        );
        break;
    }

    // Add tooltip to trigger element
    trigger.style.position = "relative";
    trigger.appendChild(tooltip);

    // Show/hide tooltip on hover
    trigger.addEventListener("mouseenter", () => {
      tooltip.classList.remove("invisible", "opacity-0");
      tooltip.classList.add("visible", "opacity-100");
    });

    trigger.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible", "opacity-100");
      tooltip.classList.add("invisible", "opacity-0");
    });
  });
}

/**
 * Initialize back to top button
 */
function initializeBackToTop() {
  const backToTopButton = document.getElementById("back-to-top");

  if (backToTopButton) {
    // Show/hide button based on scroll position
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.remove("opacity-0", "invisible");
      } else {
        backToTopButton.classList.add("opacity-0", "invisible");
      }
    });

    // Scroll to top when clicked
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

/**
 * Create and show a notification toast
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = "success", duration = 3000) {
  // Check if we have DjinisUtils with showToast
  if (typeof DjinisUtils !== "undefined" && DjinisUtils.showToast) {
    DjinisUtils.showToast(message, type, duration);
    return;
  }

  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className =
      "fixed bottom-4 right-4 z-50 flex flex-col space-y-2";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = "transform transition-all duration-300 translate-x-full";

  // Set toast color based on type
  let bgColor, textColor, icon;
  switch (type) {
    case "error":
      bgColor = "bg-red-500";
      textColor = "text-white";
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case "warning":
      bgColor = "bg-yellow-500";
      textColor = "text-white";
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case "info":
      bgColor = "bg-blue-500";
      textColor = "text-white";
      icon = '<i class="fas fa-info-circle"></i>';
      break;
    default: // success
      bgColor = "bg-green-500";
      textColor = "text-white";
      icon = '<i class="fas fa-check-circle"></i>';
  }

  toast.className += ` ${bgColor} ${textColor} rounded-lg shadow-lg px-4 py-3 flex items-center max-w-xs`;

  // Add content
  toast.innerHTML = `
      <div class="flex-shrink-0 mr-2">
        ${icon}
      </div>
      <div class="flex-1">${message}</div>
      <button class="ml-2 focus:outline-none">
        <i class="fas fa-times"></i>
      </button>
    `;

  // Add to container
  toastContainer.appendChild(toast);

  // Show toast with animation
  setTimeout(() => {
    toast.classList.remove("translate-x-full");
    toast.classList.add("translate-x-0");
  }, 10);

  // Set up close button
  const closeButton = toast.querySelector("button");
  closeButton.addEventListener("click", () => {
    removeToast();
  });

  // Set up auto-removal
  const timeoutId = setTimeout(() => {
    removeToast();
  }, duration);

  // Remove toast function
  function removeToast() {
    clearTimeout(timeoutId);
    toast.classList.remove("translate-x-0");
    toast.classList.add("translate-x-full");

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

/**
 * Lazy load images
 */
function lazyLoadImages() {
  // Check if IntersectionObserver is supported
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute("data-src");

          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
            img.classList.add("fade-in");
          }

          observer.unobserve(img);
        }
      });
    });

    // Observe all images with data-src
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver support
    document.querySelectorAll("img[data-src]").forEach((img) => {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
    });
  }
}

/**
 * Initialize form validation
 */
function initializeFormValidation() {
  const forms = document.querySelectorAll("form[data-validate]");

  forms.forEach((form) => {
    // Add validation to all inputs with required attribute
    const requiredInputs = form.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );

    requiredInputs.forEach((input) => {
      // Add blur event listeners
      input.addEventListener("blur", () => {
        validateInput(input);
      });

      // Add input event listeners for real-time validation
      input.addEventListener("input", () => {
        // If field was previously marked as invalid, revalidate on input
        if (input.classList.contains("border-red-500")) {
          validateInput(input);
        }
      });
    });

    // Add submit event listener
    form.addEventListener("submit", (e) => {
      let isValid = true;

      // Validate all required inputs
      requiredInputs.forEach((input) => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });

      // Prevent submission if the form is invalid
      if (!isValid) {
        e.preventDefault();

        // Focus first invalid input
        const firstInvalid = form.querySelector(".border-red-500");
        if (firstInvalid) {
          firstInvalid.focus();
        }

        // Show form error message
        const formErrorMessage = form.querySelector(".form-error-message");
        if (formErrorMessage) {
          formErrorMessage.classList.remove("hidden");

          // Auto-hide after 5 seconds
          setTimeout(() => {
            formErrorMessage.classList.add("hidden");
          }, 5000);
        }
      }
    });
  });
}

/**
 * Validate a form input
 * @param {HTMLElement} input - The input to validate
 * @returns {boolean} - True if input is valid
 */
function validateInput(input) {
  let isValid = true;
  const errorMessage = input.parentElement.querySelector(".error-message");

  // Clear existing validation state
  input.classList.remove("border-red-500", "border-green-500");
  if (errorMessage) {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  }

  // Required field validation
  if (input.hasAttribute("required") && !input.value.trim()) {
    isValid = false;
    markInvalid(input, errorMessage, "This field is required");
  }

  // Email validation
  if (input.getAttribute("type") === "email" && input.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.value)) {
      isValid = false;
      markInvalid(input, errorMessage, "Please enter a valid email address");
    }
  }

  // Phone validation
  if (input.getAttribute("type") === "tel" && input.value.trim()) {
    const phonePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phonePattern.test(input.value)) {
      isValid = false;
      markInvalid(input, errorMessage, "Please enter a valid phone number");
    }
  }

  // Password validation
  if (
    input.getAttribute("type") === "password" &&
    input.hasAttribute("data-min-length") &&
    input.value.trim()
  ) {
    const minLength = parseInt(input.getAttribute("data-min-length"));
    if (input.value.length < minLength) {
      isValid = false;
      markInvalid(
        input,
        errorMessage,
        `Password must be at least ${minLength} characters long`
      );
    }
  }

  // Password confirmation validation
  if (input.hasAttribute("data-confirm-password")) {
    const passwordInput = document.getElementById(
      input.getAttribute("data-confirm-password")
    );
    if (passwordInput && input.value !== passwordInput.value) {
      isValid = false;
      markInvalid(input, errorMessage, "Passwords do not match");
    }
  }

  // Minimum and maximum value validation for number inputs
  if (input.getAttribute("type") === "number") {
    const value = parseFloat(input.value);
    const min = parseFloat(input.getAttribute("min"));
    const max = parseFloat(input.getAttribute("max"));

    if (!isNaN(min) && value < min) {
      isValid = false;
      markInvalid(input, errorMessage, `Value must be at least ${min}`);
    } else if (!isNaN(max) && value > max) {
      isValid = false;
      markInvalid(input, errorMessage, `Value must be at most ${max}`);
    }
  }

  // Custom validation using data-pattern attribute
  if (input.hasAttribute("data-pattern") && input.value.trim()) {
    const pattern = new RegExp(input.getAttribute("data-pattern"));
    if (!pattern.test(input.value)) {
      isValid = false;
      markInvalid(
        input,
        errorMessage,
        input.getAttribute("data-pattern-message") || "Invalid format"
      );
    }
  }

  // Add success class if valid and has value
  if (isValid && input.value.trim()) {
    input.classList.add("border-green-500");
  }

  return isValid;
}

/**
 * Mark an input as invalid
 * @param {HTMLElement} input - The input to mark
 * @param {HTMLElement} errorMessage - The error message element
 * @param {string} message - The error message
 */
function markInvalid(input, errorMessage, message) {
  input.classList.add("border-red-500");

  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  }
}

// Make helper functions globally available
window.showToast = showToast;
window.lazyLoadImages = lazyLoadImages;
window.initializeFormValidation = initializeFormValidation;

// Initialize lazy loading immediately
document.addEventListener("DOMContentLoaded", lazyLoadImages);
