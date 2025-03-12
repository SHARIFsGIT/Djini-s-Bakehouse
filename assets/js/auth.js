/**
 * Djini's Bakehouse - User Authentication System
 * Handles user login, signup, profile management, and session handling
 */

class AuthManager {
    constructor() {
      this.currentUser = null;
      this.authChangeListeners = [];
      this.sessionTimeout = null;
      this.init();
    }
  
    /**
     * Initialize the auth manager
     */
    init() {
      // Load user from localStorage
      this.loadUserFromStorage();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check for session timeout
      this.checkSessionTimeout();
      
      // Update UI based on authentication state
      this.updateUI();
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Login form
      const loginForm = document.getElementById('login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLoginForm(loginForm);
        });
        
        // Toggle password visibility
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
          togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const eyeIcon = togglePassword.querySelector('i');
            eyeIcon.classList.toggle('fa-eye');
            eyeIcon.classList.toggle('fa-eye-slash');
          });
        }
      }
      
      // Signup form
      const signupForm = document.getElementById('signup-form');
      if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSignupForm(signupForm);
        });
        
        // Toggle password visibility for signup form
        const togglePasswordButtons = document.querySelectorAll('.toggle-password');
        togglePasswordButtons.forEach(button => {
          button.addEventListener('click', () => {
            const passwordInput = button.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const eyeIcon = button.querySelector('i');
            eyeIcon.classList.toggle('fa-eye');
            eyeIcon.classList.toggle('fa-eye-slash');
          });
        });
      }
      
      // Logout buttons
      const logoutButtons = document.querySelectorAll('.logout-button');
      logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      });
      
      // Profile edit form
      const profileEditForm = document.getElementById('profile-edit-form');
      if (profileEditForm) {
        profileEditForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleProfileUpdate(profileEditForm);
        });
      }
      
      // Password change form
      const passwordChangeForm = document.getElementById('password-form');
      if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handlePasswordChange(passwordChangeForm);
        });
      }
      
      // Email preferences form
      const emailPreferencesForm = document.getElementById('email-preferences-form');
      if (emailPreferencesForm) {
        emailPreferencesForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleEmailPreferencesUpdate(emailPreferencesForm);
        });
      }
    }
  
    /**
     * Handle login form submission
     * @param {HTMLFormElement} form - The login form
     */
    handleLoginForm(form) {
      // Get form values
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;
      const rememberMe = form.querySelector('#remember-me')?.checked || false;
      
      // Validate email and password
      if (!email || !password) {
        this.showError('Please enter your email and password.');
        return;
      }
      
      // Clear any previous errors
      this.clearError();
      
      // Simulate API call to authenticate user
      this.login(email, password, rememberMe)
        .then(user => {
          // Get redirect URL from query parameter or use default
          const urlParams = new URLSearchParams(window.location.search);
          const redirectUrl = urlParams.get('redirect') || 'index.html';
          
          // Redirect to the specified page
          window.location.href = redirectUrl;
        })
        .catch(error => {
          this.showError(error.message);
        });
    }
  
    /**
     * Handle signup form submission
     * @param {HTMLFormElement} form - The signup form
     */
    handleSignupForm(form) {
      // Get form values
      const firstName = form.querySelector('#first-name').value;
      const lastName = form.querySelector('#last-name').value;
      const email = form.querySelector('#email').value;
      const phone = form.querySelector('#phone').value;
      const dob = form.querySelector('#date-of-birth').value;
      const password = form.querySelector('#password').value;
      const confirmPassword = form.querySelector('#confirm-password').value;
      
      // Validate form
      if (!firstName || !lastName || !email || !password) {
        this.showError('Please fill in all required fields.');
        return;
      }
      
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        this.showError('Please enter a valid email address.');
        return;
      }
      
      // Validate password
      if (password.length < 8) {
        this.showError('Password must be at least 8 characters long.');
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        this.showError('Passwords do not match.');
        return;
      }
      
      // Validate password strength (optional)
      const passwordStrength = this.checkPasswordStrength(password);
      if (passwordStrength === 'weak') {
        this.showError('Password is too weak. Please include letters, numbers, and special characters.');
        return;
      }
      
      // Clear any previous errors
      this.clearError();
      
      // Get email preferences
      const preferences = [];
      const preferenceCheckboxes = form.querySelectorAll('.custom-checkbox input[type="checkbox"]:not([required])');
      
      preferenceCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const prefName = checkbox.parentElement.querySelector('.font-medium').textContent;
          preferences.push(prefName);
        }
      });
      
      // Create user object
      const user = {
        firstName,
        lastName,
        email,
        phone,
        dob,
        preferences,
        joinDate: new Date().toISOString(),
      };
      
      // Simulate API call to register user
      this.register(user, password)
        .then(registeredUser => {
          // Show success message
          this.showSuccessMessage('Registration successful! Redirecting to home page...');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        })
        .catch(error => {
          this.showError(error.message);
        });
    }
  
    /**
     * Handle profile update
     * @param {HTMLFormElement} form - The profile edit form
     */
    handleProfileUpdate(form) {
      // Get form values
      const firstName = form.querySelector('#edit-first-name').value;
      const lastName = form.querySelector('#edit-last-name').value;
      const email = form.querySelector('#edit-email').value;
      const phone = form.querySelector('#edit-phone').value;
      const dob = form.querySelector('#edit-dob').value;
      const about = form.querySelector('#edit-about').value;
      
      // Validate form
      if (!firstName || !lastName || !email) {
        this.showError('Please fill in all required fields.');
        return;
      }
      
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        this.showError('Please enter a valid email address.');
        return;
      }
      
      // Create updated user object
      const updatedUser = {
        ...this.currentUser,
        firstName,
        lastName,
        email,
        phone,
        dob,
        about,
        updatedAt: new Date().toISOString()
      };
      
      // Simulate API call to update user profile
      this.updateProfile(updatedUser)
        .then(updatedUser => {
          // Show success message
          this.showSuccessMessage('Profile updated successfully!');
          
          // Update UI
          this.updateProfileUI(updatedUser);
          
          // Toggle back to view mode
          const viewMode = document.getElementById('profile-view-mode');
          const editMode = document.getElementById('profile-edit-mode');
          
          if (viewMode && editMode) {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
          }
        })
        .catch(error => {
          this.showError(error.message);
        });
    }
  
    /**
     * Handle password change
     * @param {HTMLFormElement} form - The password change form
     */
    handlePasswordChange(form) {
      // Get form values
      const currentPassword = form.querySelector('#current-password').value;
      const newPassword = form.querySelector('#new-password').value;
      const confirmPassword = form.querySelector('#confirm-password').value;
      
      // Validate form
      if (!currentPassword || !newPassword || !confirmPassword) {
        this.showError('Please fill in all fields.');
        return;
      }
      
      // Validate password
      if (newPassword.length < 8) {
        this.showError('New password must be at least 8 characters long.');
        return;
      }
      
      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        this.showError('New passwords do not match.');
        return;
      }
      
      // Validate password strength (optional)
      const passwordStrength = this.checkPasswordStrength(newPassword);
      if (passwordStrength === 'weak') {
        this.showError('New password is too weak. Please include letters, numbers, and special characters.');
        return;
      }
      
      // Simulate API call to change password
      this.changePassword(currentPassword, newPassword)
        .then(() => {
          // Show success message
          this.showSuccessMessage('Password changed successfully!');
          
          // Reset form
          form.reset();
          
          // Toggle back to view mode
          const passwordInfo = document.getElementById('password-info');
          const passwordChangeForm = document.getElementById('password-change-form');
          
          if (passwordInfo && passwordChangeForm) {
            passwordInfo.classList.remove('hidden');
            passwordChangeForm.classList.add('hidden');
          }
          
          // Update "last changed" date
          const today = new Date();
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          const formattedDate = today.toLocaleDateString('en-US', options);
          
          const passwordLastChangedText = document.querySelector('#password-info p');
          if (passwordLastChangedText) {
            passwordLastChangedText.innerHTML = `Your password was last changed on <span class="font-medium">${formattedDate}</span>`;
          }
        })
        .catch(error => {
          this.showError(error.message);
        });
    }
  
    /**
     * Handle email preferences update
     * @param {HTMLFormElement} form - The email preferences form
     */
    handleEmailPreferencesUpdate(form) {
      // Get checked preferences
      const checkboxes = form.querySelectorAll('input[type="checkbox"]');
      const preferences = {};
      
      checkboxes.forEach(checkbox => {
        const prefName = checkbox.parentElement.querySelector('.font-medium').textContent;
        preferences[prefName] = checkbox.checked;
      });
      
      // Simulate API call to update email preferences
      this.updateEmailPreferences(preferences)
        .then(() => {
          // Show success message
          this.showSuccessMessage('Email preferences updated successfully!');
        })
        .catch(error => {
          this.showError(error.message);
        });
    }
  
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {boolean} rememberMe - Remember me option
     * @returns {Promise} Promise that resolves with user data or rejects with error
     */
    login(email, password, rememberMe = false) {
      return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
          // For demo purposes, hardcoded credentials
          const validCredentials = [
            { email: 'john.doe@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' },
            { email: 'demo@djinisbakehouse.com', password: 'demo1234', firstName: 'Demo', lastName: 'User' }
          ];
          
          const matchedUser = validCredentials.find(cred => cred.email === email && cred.password === password);
          
          if (matchedUser) {
            // Create user object
            const user = {
              id: 'user_' + Date.now(),
              email: matchedUser.email,
              firstName: matchedUser.firstName,
              lastName: matchedUser.lastName,
              isLoggedIn: true,
              loginTime: new Date().toISOString(),
              sessionExpiryTime: rememberMe 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
            
            // Set current user
            this.currentUser = user;
            
            // Save to localStorage
            localStorage.setItem('djinisUserAuth', JSON.stringify(user));
            
            // If remember me is checked, save to persistent storage
            if (rememberMe) {
              localStorage.setItem('djinisUserAuthRemember', JSON.stringify(user));
            } else {
              localStorage.removeItem('djinisUserAuthRemember');
            }
            
            // Notify listeners
            this.notifyAuthChangeListeners(user);
            
            // Set session timeout
            this.setSessionTimeout(user.sessionExpiryTime);
            
            // Update UI
            this.updateUI();
            
            resolve(user);
          } else {
            reject(new Error('Invalid email or password. Please try again.'));
          }
        }, 1000); // Simulate API delay
      });
    }
  
    /**
     * Register a new user
     * @param {Object} user - User data
     * @param {string} password - User password (would be hashed in real app)
     * @returns {Promise} Promise that resolves with user data or rejects with error
     */
    register(user, password) {
      return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Check if email already exists
          // In a real app, this would be done on the server
          const existingUser = localStorage.getItem('djinisUserAuth');
          if (existingUser) {
            const parsedUser = JSON.parse(existingUser);
            if (parsedUser.email === user.email) {
              reject(new Error('An account with this email already exists.'));
              return;
            }
          }
          
          // Create user object
          const newUser = {
            ...user,
            id: 'user_' + Date.now(),
            isLoggedIn: true,
            loginTime: new Date().toISOString(),
            sessionExpiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          };
          
          // Set current user
          this.currentUser = newUser;
          
          // Save to localStorage
          localStorage.setItem('djinisUserAuth', JSON.stringify(newUser));
          localStorage.setItem('djinisUserProfile', JSON.stringify(newUser));
          
          // Save email preferences
          const emailPreferences = {};
          user.preferences.forEach(pref => {
            emailPreferences[pref] = true;
          });
          localStorage.setItem('djinisEmailPreferences', JSON.stringify(emailPreferences));
          
          // Notify listeners
          this.notifyAuthChangeListeners(newUser);
          
          // Set session timeout
          this.setSessionTimeout(newUser.sessionExpiryTime);
          
          // Update UI
          this.updateUI();
          
          resolve(newUser);
        }, 1500); // Simulate API delay
      });
    }
  
    /**
     * Update user profile
     * @param {Object} user - Updated user data
     * @returns {Promise} Promise that resolves with updated user data or rejects with error
     */
    updateProfile(user) {
      return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Update current user
          this.currentUser = {
            ...this.currentUser,
            ...user
          };
          
          // Save to localStorage
          localStorage.setItem('djinisUserAuth', JSON.stringify(this.currentUser));
          localStorage.setItem('djinisUserProfile', JSON.stringify(this.currentUser));
          
          // Notify listeners
          this.notifyAuthChangeListeners(this.currentUser);
          
          // Update UI
          this.updateUI();
          
          resolve(this.currentUser);
        }, 1000); // Simulate API delay
      });
    }
  
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Promise that resolves or rejects with error
     */
    changePassword(currentPassword, newPassword) {
      return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Verify current password (in a real app, this would be done on the server)
          // For demo purposes, we'll accept any current password
          if (currentPassword) {
            // Update password last changed date
            const updatedUser = {
              ...this.currentUser,
              passwordLastChanged: new Date().toISOString()
            };
            
            // Update current user
            this.currentUser = updatedUser;
            
            // Save to localStorage
            localStorage.setItem('djinisUserAuth', JSON.stringify(updatedUser));
            localStorage.setItem('djinisUserProfile', JSON.stringify(updatedUser));
            
            resolve();
          } else {
            reject(new Error('Current password is incorrect.'));
          }
        }, 1000); // Simulate API delay
      });
    }
  
    /**
     * Update email preferences
     * @param {Object} preferences - Email preferences
     * @returns {Promise} Promise that resolves or rejects with error
     */
    updateEmailPreferences(preferences) {
      return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Save to localStorage
          localStorage.setItem('djinisEmailPreferences', JSON.stringify(preferences));
          
          resolve();
        }, 1000); // Simulate API delay
      });
    }
  
    /**
     * Logout the current user
     */
    logout() {
      // Clear session data
      localStorage.removeItem('djinisUserAuth');
      
      // Clear current user
      this.currentUser = null;
      
      // Clear session timeout
      clearTimeout(this.sessionTimeout);
      
      // Notify listeners
      this.notifyAuthChangeListeners(null);
      
      // Update UI
      this.updateUI();
      
      // Redirect to home page
      window.location.href = 'index.html';
    }
  
    /**
     * Load user from local storage
     */
    loadUserFromStorage() {
      // Check if user is already logged in
      const userAuth = JSON.parse(localStorage.getItem('djinisUserAuth'));
      const userAuthRemember = JSON.parse(localStorage.getItem('djinisUserAuthRemember'));
      
      if (userAuth && userAuth.isLoggedIn) {
        // User is logged in
        this.currentUser = userAuth;
        this.setSessionTimeout(userAuth.sessionExpiryTime);
      } else if (userAuthRemember && userAuthRemember.isLoggedIn) {
        // User had "remember me" checked, restore login session
        this.currentUser = userAuthRemember;
        
        // Update session expiry
        this.currentUser.loginTime = new Date().toISOString();
        this.currentUser.sessionExpiryTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
        
        // Save to localStorage
        localStorage.setItem('djinisUserAuth', JSON.stringify(this.currentUser));
        
        this.setSessionTimeout(this.currentUser.sessionExpiryTime);
      }
    }
  
    /**
     * Set session timeout
     * @param {string} expiryTime - Session expiry time (ISO string)
     */
    setSessionTimeout(expiryTime) {
      // Clear any existing timeout
      clearTimeout(this.sessionTimeout);
      
      // Calculate time until session expires
      const expiry = new Date(expiryTime);
      const now = new Date();
      const timeUntilExpiry = expiry - now;
      
      // Set timeout to logout when session expires
      if (timeUntilExpiry > 0) {
        this.sessionTimeout = setTimeout(() => {
          this.logout();
          alert('Your session has expired. Please log in again.');
        }, timeUntilExpiry);
      } else {
        // Session has already expired
        this.logout();
      }
    }
  
    /**
     * Check session timeout
     */
    checkSessionTimeout() {
      if (this.currentUser && this.currentUser.sessionExpiryTime) {
        const expiry = new Date(this.currentUser.sessionExpiryTime);
        const now = new Date();
        
        if (now > expiry) {
          // Session has expired
          this.logout();
          alert('Your session has expired. Please log in again.');
        }
      }
    }
  
    /**
     * Update UI based on authentication state
     */
    updateUI() {
      // Update navbar
      this.updateNavbar();
      
      // Update profile page if we're on it
      this.updateProfilePage();
      
      // Handle redirect for protected pages
      this.handleProtectedPages();
    }
  
    /**
     * Update navbar based on authentication state
     */
    updateNavbar() {
      const loginLinks = document.querySelectorAll('a[href="login.html"]');
      const signupLinks = document.querySelectorAll('a[href="signup.html"]');
      const profileMenus = document.querySelectorAll('.profile-menu');
      
      if (this.currentUser) {
        // User is logged in
        
        // Hide login/signup links
        loginLinks.forEach(link => {
          link.href = 'profile.html';
          link.textContent = 'My Account';
        });
        
        signupLinks.forEach(link => {
          link.href = 'javascript:void(0)';
          link.textContent = 'Logout';
          link.classList.add('logout-button');
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
          });
        });
        
        // Show profile menu
        profileMenus.forEach(menu => {
          if (menu.querySelector('#user-name')) {
            menu.querySelector('#user-name').textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
          }
          menu.classList.remove('hidden');
        });
      } else {
        // User is not logged in
        
        // Show login/signup links
        loginLinks.forEach(link => {
          link.href = 'login.html';
          link.textContent = 'Login';
        });
        
        signupLinks.forEach(link => {
          link.href = 'signup.html';
          link.textContent = 'Sign Up';
          link.classList.remove('logout-button');
          
          // Remove logout event listener
          const newLink = link.cloneNode(true);
          link.parentNode.replaceChild(newLink, link);
        });
        
        // Hide profile menu
        profileMenus.forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    }
  
    /**
     * Update profile page based on authentication state
     */
    updateProfilePage() {
      if (!this.currentUser) return;
      
      // If we're on the profile page
      if (window.location.pathname.includes('profile.html')) {
        // Update profile fields
        this.updateProfileUI(this.currentUser);
      }
    }
  
    /**
     * Update profile UI with user data
     * @param {Object} user - User data
     */
    updateProfileUI(user) {
      // Update view mode
      const viewFullName = document.getElementById('view-full-name');
      const viewEmail = document.getElementById('view-email');
      const viewPhone = document.getElementById('view-phone');
      const viewDob = document.getElementById('view-dob');
      const viewAbout = document.getElementById('view-about');
      
      if (viewFullName) viewFullName.textContent = `${user.firstName} ${user.lastName}`;
      if (viewEmail) viewEmail.textContent = user.email;
      if (viewPhone) viewPhone.textContent = user.phone || 'Not provided';
      
      if (viewDob && user.dob) {
        const dobDate = new Date(user.dob);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        viewDob.textContent = dobDate.toLocaleDateString('en-US', options);
      }
      
      if (viewAbout) viewAbout.textContent = user.about || 'No information provided.';
      
      // Update edit form
      const editFirstName = document.getElementById('edit-first-name');
      const editLastName = document.getElementById('edit-last-name');
      const editEmail = document.getElementById('edit-email');
      const editPhone = document.getElementById('edit-phone');
      const editDob = document.getElementById('edit-dob');
      const editAbout = document.getElementById('edit-about');
      
      if (editFirstName) editFirstName.value = user.firstName;
      if (editLastName) editLastName.value = user.lastName;
      if (editEmail) editEmail.value = user.email;
      if (editPhone) editPhone.value = user.phone || '';
      if (editDob && user.dob) editDob.value = user.dob.split('T')[0];
      if (editAbout) editAbout.value = user.about || '';
      
      // Update user name in header and sidebar
      const userNames = document.querySelectorAll('#user-name, #sidebar-user-name');
      userNames.forEach(element => {
        element.textContent = `${user.firstName} ${user.lastName}`;
      });
      
      const userEmails = document.querySelectorAll('#sidebar-user-email');
      userEmails.forEach(element => {
        element.textContent = user.email;
      });
    }
  
    /**
     * Handle protected pages
     */
    handleProtectedPages() {
      const protectedPages = [
        'profile.html',
        'orders.html',
        'addresses.html',
        'payment-methods.html',
        'favorites.html',
        'settings.html'
      ];
      
      // Check if we're on a protected page
      const currentPage = window.location.pathname.split('/').pop();
      const isProtectedPage = protectedPages.some(page => currentPage.includes(page));
      
      if (isProtectedPage && !this.currentUser) {
        // Redirect to login page with return URL
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      }
    }
  
    /**
     * Add auth change listener
     * @param {Function} callback - Function to call when auth state changes
     */
    onAuthChange(callback) {
      this.authChangeListeners.push(callback);
    }
  
    /**
     * Notify auth change listeners
     * @param {Object|null} user - User data or null if logged out
     */
    notifyAuthChangeListeners(user) {
      this.authChangeListeners.forEach(callback => {
        callback(user);
      });
    }
  
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
      // Find error element
      const errorElement = document.getElementById('login-error') || 
                            document.getElementById('signup-error') || 
                            document.getElementById('profile-error');
      
      if (errorElement) {
        // Show error message
        errorElement.classList.remove('hidden');
        
        // Find error message element
        const errorMessageElement = errorElement.querySelector('#error-message') || errorElement;
        errorMessageElement.textContent = message;
        
        // Hide error after 5 seconds
        setTimeout(() => {
          errorElement.classList.add('hidden');
        }, 5000);
      } else {
        // If no error element found, use alert as fallback
        alert(message);
      }
    }
  
    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {string} 'weak', 'medium', or 'strong'
     */
    checkPasswordStrength(password) {
      // Basic password strength check
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (password.length < 8) {
        return 'weak';
      }
      
      if (hasLetter && hasNumber && hasSpecial) {
        return 'strong';
      }
      
      if ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial)) {
        return 'medium';
      }
      
      return 'weak';
    }
  
    /**
     * Get current user
     * @returns {Object|null} Current user or null if not logged in
     */
    getCurrentUser() {
      return this.currentUser;
    }
  
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
      return this.currentUser !== null;
    }
  
    /**
     * Clear error message
     */
    clearError() {
      // Find error element
      const errorElement = document.getElementById('login-error') || 
                            document.getElementById('signup-error') || 
                            document.getElementById('profile-error');
      
      if (errorElement) {
        // Hide error message
        errorElement.classList.add('hidden');
      }
    }
  
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
      // Create success element if it doesn't exist
      let successElement = document.getElementById('success-message');
      
      if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'success-message';
        successElement.className = 'bg-green-100 text-green-700 p-4 rounded-lg fixed top-20 right-4 z-50 transition-opacity duration-300 shadow-lg';
        
        document.body.appendChild(successElement);
      }
      
      // Show success message
      successElement.textContent = message;
      successElement.classList.remove('opacity-0');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        successElement.classList.add('opacity-0');
        
        // Remove from DOM after fade out
        setTimeout(() => {
          if (successElement.parentNode) {
            successElement.parentNode.removeChild(successElement);
          }
        }, 300);
      }, 3000);
    }
  }
  
// Initialize auth manager on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.djinisAuth = new AuthManager();
});