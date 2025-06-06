// Cookie Management Functions
function getCookiePreferences() {
    try {
        return {
            essential: localStorage.getItem('essentialCookies') === 'true',
            analytics: localStorage.getItem('analyticsCookies') === 'true',
            preferences: localStorage.getItem('preferenceCookies') === 'true'
        };
    } catch (error) {
        console.error('Error getting cookie preferences:', error);
        return {
            essential: true,
            analytics: false,
            preferences: false
        };
    }
}

function reapplyCookieSettings() {
    const preferences = getCookiePreferences();
    
    if (preferences.analytics) {
        // Re-enable analytics tracking
        if (typeof trackVisit === 'function') trackVisit();
        if (typeof trackSectionViews === 'function') trackSectionViews();
        if (typeof trackScrollDepth === 'function') trackScrollDepth();
        if (typeof trackInteractions === 'function') trackInteractions();
        if (typeof trackPerformance === 'function') trackPerformance();
    }
    
    if (preferences.preferences) {
        // Re-enable preference cookies (theme, etc.)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.checked = savedTheme === 'dark';
            }
        }
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class and observe all sections
document.querySelectorAll('section').forEach(section => {
    section.classList.add('fade-in-section');
    observer.observe(section);
});

// Navbar scroll behavior
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        // Scroll Down
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        // Scroll Up
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    
    lastScroll = currentScroll;
});

// Theme switching
const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
}

// Handle theme toggle
themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Initialize Firebase Database reference
let db = null;
let initializationAttempts = 0;
const maxAttempts = 5;

// Firebase configuration
function loadFirebaseConfig() {
    // Check if we're running locally (file://) or on a server (http://)
    const isLocalEnvironment = window.location.protocol === 'file:';
    
    if (isLocalEnvironment) {
        // For local development, use local config
        // In production, this would be replaced with environment variables
        console.log('Using local config');
        return Promise.resolve({
            apiKey: "AIzaSyB1ZIQp5j_hBXJM2uC4_tJg96ZKLj5_JB8",
            authDomain: "portfolio-cac4b.firebaseapp.com",
            databaseURL: "https://portfolio-cac4b-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "portfolio-cac4b",
            storageBucket: "portfolio-cac4b.firebasestorage.app",
            messagingSenderId: "560361647150",
            appId: "1:560361647150:web:10af52ec57c5a7e53a03bf",
            measurementId: "G-8XWC6F64FC"
        });
    } else {
        // For server environment, fetch from secure endpoint
        return fetch('/config/firebase-config.json')
            .then(response => response.json())
            .catch(error => {
                console.error('Error loading Firebase config:', error);
                return null;
            });
    }
}

function initializeFirebase() {
    if (initializationAttempts >= maxAttempts) {
        console.error('Failed to initialize Firebase after multiple attempts');
        return;
    }

    try {
        loadFirebaseConfig().then(firebaseConfig => {
            if (!firebaseConfig) {
                console.error('Failed to load Firebase configuration');
                return;
            }
            
            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            // Check if Firebase Database is available
            if (firebase.database) {
                db = firebase.database();
                console.log('Firebase Database initialized successfully');
                initializeTracking();
                
                // Reapply cookie settings if previously set
                reapplyCookieSettings();
                return;
            }

            // If not ready yet, retry
            initializationAttempts++;
            setTimeout(initializeFirebase, 1000);
        });
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        initializationAttempts++;
        setTimeout(initializeFirebase, 1000);
    }
}

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show cookie consent if not previously accepted
    if (!localStorage.getItem('cookieConsent')) {
        const cookieConsent = document.getElementById('cookie-consent');
        if (cookieConsent) {
            cookieConsent.style.display = 'block';
        }
    }
    
    // Small delay to ensure Firebase SDK is loaded
    setTimeout(initializeFirebase, 500);
});

// Initialize tracking functions
function initializeTracking() {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        // Check cookie preferences before enabling tracking
        const cookiePreferences = getCookiePreferences();
        
        // Only initialize tracking if analytics cookies are accepted
        if (cookiePreferences && cookiePreferences.analytics) {
            console.log('Analytics enabled, initializing tracking...');
            trackVisit();
            trackSectionViews();
            trackScrollDepth();
            trackInteractions();
            trackPerformance();
            trackErrors();
            startReadingTimeTracking();
        } else {
            console.log('Analytics disabled due to cookie preferences');
        }
    } catch (error) {
        console.error('Error initializing tracking:', error);
    }
}

// Track page visit and device info
async function trackVisit() {
    try {
        if (!firebase.apps.length || !firebase.database) {
            console.log('Firebase not initialized yet, will retry visit tracking later');
            return;
        }

        // Get visitor location data
        const locationData = await getVisitorLocation();
        
    const deviceData = {
        screen: {
            width: window.screen.width,
            height: window.screen.height
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

        // Only add location if we got valid data
        if (locationData && locationData.country !== 'unknown') {
            deviceData.location = locationData;
        }

    // Increment total visits
        await db.ref('analytics/visits').transaction(currentVisits => (currentVisits || 0) + 1);
    
    // Store visit details
        await db.ref('analytics/visitDetails').push(deviceData);
    
    // Track daily visits
    const today = new Date().toISOString().split('T')[0];
        await db.ref(`analytics/dailyVisits/${today}`).transaction(currentVisits => (currentVisits || 0) + 1);
        
        // Track visits by location if we have valid location data
        if (locationData && locationData.country !== 'unknown') {
            await db.ref(`analytics/locationVisits/${locationData.country}`).transaction(currentVisits => (currentVisits || 0) + 1);
            
            // If we have city data, track that too
            if (locationData.city && locationData.city !== 'unknown') {
                await db.ref(`analytics/locationVisits/${locationData.country}/${locationData.city}`).transaction(currentVisits => (currentVisits || 0) + 1);
            }
        }
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

// Track section visibility
function trackSectionViews() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                db.ref('analytics/sectionViews').push({
                    section: entry.target.id,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    viewportHeight: window.innerHeight,
                    deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop'
                });
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% of section is visible
    
    sections.forEach(section => observer.observe(section));
}

// Track scroll depth
function trackScrollDepth() {
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const percent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
        if (percent > maxScroll) {
            maxScroll = Math.round(percent);
            if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                db.ref('analytics/scrollDepth').push({
                    depth: maxScroll,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    url: window.location.pathname
                });
            }
        }
    });
}

// Track interactions
function trackInteractions() {
    // Track all clicks
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link) {
            db.ref('analytics/clicks').push({
                type: 'link',
                target: link.href || link.id || 'unknown',
                text: link.textContent.trim(),
                section: link.closest('section')?.id || 'unknown',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // Track theme toggle
        if (e.target.id === 'theme-toggle') {
            db.ref('analytics/themeToggles').push({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                newTheme: document.documentElement.getAttribute('data-theme')
            });
        }
    });

    // Track resume interactions
    const resumeLink = document.querySelector('.resume-link');
    if (resumeLink) {
        resumeLink.addEventListener('click', () => {
            db.ref('analytics/downloads').transaction(current => (current || 0) + 1);
            db.ref('analytics/resumeClicks').push({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            });
        });
    }

    // Track HR email interactions
    document.querySelectorAll('a[href^="mailto:"]').forEach(emailLink => {
        emailLink.addEventListener('click', (e) => {
            const email = emailLink.getAttribute('href').replace('mailto:', '');
            const timestamp = Date.now();
            const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

            // Store email click data
            db.ref('analytics/emailClicks').push({
                email,
                timestamp,
                deviceType,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            });

            // Increment total email clicks
            db.ref('analytics/emailStats').transaction(stats => {
                if (!stats) return { totalClicks: 1 };
                return { totalClicks: (stats.totalClicks || 0) + 1 };
            });
        });
    });

    // Track company name interactions
    document.querySelectorAll('.experience-item .company-name').forEach(companyName => {
        companyName.addEventListener('click', (e) => {
            const company = e.target.textContent.trim();
            const timestamp = Date.now();
            const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

            // Store company interaction data
            db.ref('analytics/companyClicks').push({
                company,
                timestamp,
                deviceType,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            });

            // Update company interaction stats
            db.ref(`analytics/companyStats/${company.replace(/[.#$/[\]]/g, '_')}`).transaction(stats => {
                if (!stats) return { views: 1 };
                return { views: (stats.views || 0) + 1 };
            });
        });
    });
}

// Track performance metrics
function trackPerformance() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const timing = performance.timing;
            const metrics = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                url: window.location.pathname
            };
            
            db.ref('analytics/performance').push(metrics);
        }, 0);
    });
}

// Track errors
function trackErrors() {
    window.addEventListener('error', error => {
        db.ref('analytics/errors').push({
            message: error.message,
            source: error.filename,
            line: error.lineno,
            column: error.colno,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent
        });
    });

    window.addEventListener('unhandledrejection', event => {
        db.ref('analytics/errors').push({
            type: 'promise_rejection',
            message: event.reason.message || event.reason,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent
        });
    });
}

// HR Information Collection
let pendingAction = null;
const modal = document.getElementById('hr-modal');
const hrForm = document.getElementById('hr-form');
const closeModal = document.querySelector('.close-modal');

// Show modal on page load
function showIntroModal() {
    modal?.classList.add('show');
}

// Check URL parameters on page load
function checkURLParams() {
    // First show the intro modal
    showIntroModal();

    // Then check sessionStorage
    const savedFormData = sessionStorage.getItem('hrFormData');
    if (savedFormData) {
        try {
            const formData = JSON.parse(savedFormData);
            
            // Pre-fill the form if it exists
            if (hrForm) {
                const formFields = {
                    'hr-name': formData.name,
                    'hr-company': formData.company,
                    'hr-email': formData.email,
                    'country-code': formData.countryCode,
                    'phone-number': formData.phoneNumber,
                    'hr-role': formData.role,
                    'company-size': formData.companySize,
                    'hiring-for': formData.hiringFor,
                    'hr-source': formData.source,
                    'contact-preference': formData.contactPreference
                };

                // Fill in form fields
                Object.entries(formFields).forEach(([id, value]) => {
                    const field = document.getElementById(id);
                    if (field && value) {
                        field.value = value;
                    }
                });
            }
            return;
        } catch (error) {
            console.error('Error parsing saved form data:', error);
        }
    }

    // Then check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
        // Pre-fill the form if it exists
        if (hrForm) {
            const formFields = {
                'hr-name': urlParams.get('fullName'),
                'hr-company': urlParams.get('company'),
                'hr-email': urlParams.get('email'),
                'country-code': urlParams.get('countryCode'),
                'phone-number': urlParams.get('phoneNumber'),
                'hr-role': urlParams.get('currentRole'),
                'company-size': urlParams.get('companySize'),
                'hiring-for': urlParams.get('hiringFor'),
                'hr-source': urlParams.get('source'),
                'contact-preference': urlParams.get('contactPreference')
            };

            // Fill in form fields if they exist
            Object.entries(formFields).forEach(([id, value]) => {
                const field = document.getElementById(id);
                if (field && value) {
                    field.value = value;
                }
            });
        }
        
        // Clear the URL parameters without refreshing
        window.history.replaceState({}, '', window.location.pathname);
    }
}

// Call checkURLParams when DOM is loaded
document.addEventListener('DOMContentLoaded', checkURLParams);

// Show modal when clicking email or resume
document.addEventListener('DOMContentLoaded', () => {
    const emailLink = document.querySelector('a[href^="mailto:"]');
    const resumeLink = document.getElementById('resume-download');

    // Email link click handler
    emailLink?.addEventListener('click', (e) => {
        e.preventDefault();
        pendingAction = {
            type: 'email',
            href: e.target.href
        };
        modal.classList.add('show');
    });

    // Resume link click handler
    resumeLink?.addEventListener('click', (e) => {
        e.preventDefault();
        pendingAction = {
            type: 'resume',
            href: e.target.href
        };
        modal.classList.add('show');
    });

    // Close modal when clicking X or outside
    closeModal?.addEventListener('click', () => {
        modal.classList.remove('show');
        sessionStorage.removeItem('hrFormData');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            sessionStorage.removeItem('hrFormData');
        }
    });
});

// Initialize EmailJS
(function() {
    emailjs.init("wzG2b0o_PNnxUZxOI");
})();

// Add event listener for contact preference change
document.getElementById('contact-preference')?.addEventListener('change', (e) => {
    const linkedinGroup = document.getElementById('linkedin-profile-group');
    const linkedinInput = document.getElementById('linkedin-profile');
    
    if (e.target.value === 'linkedin') {
        linkedinGroup.style.display = 'block';
        linkedinInput.required = true;
    } else {
        linkedinGroup.style.display = 'none';
        linkedinInput.required = false;
        linkedinInput.value = '';
    }
});

// Handle "other" options in HR form
const setupOtherFields = () => {
    const fields = [
        {
            select: 'hr-role',
            input: 'other-role-input',
            container: 'other-role-container'
        },
        {
            select: 'hiring-for',
            input: 'other-position-input',
            container: 'other-position-container'
        },
        {
            select: 'hr-source',
            input: 'other-source-input',
            container: 'other-source-container'
        }
    ];

    fields.forEach(field => {
        const select = document.getElementById(field.select);
        const container = document.getElementById(field.container);
        const input = document.getElementById(field.input);

        if (select && container && input) {
            select.addEventListener('change', (e) => {
                if (e.target.value === 'other') {
                    container.style.display = 'block';
                    input.required = true;
                } else {
                    container.style.display = 'none';
                    input.required = false;
                    input.value = '';
                }
            });
        }
    });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', setupOtherFields);

// Handle form submission
hrForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    }
    
    try {
        // Validate Firebase initialization
        if (!db) {
            throw new Error('Firebase not initialized');
        }

        // Get form data
        const role = document.getElementById('hr-role')?.value?.trim();
        const hiringFor = document.getElementById('hiring-for')?.value?.trim();
        const source = document.getElementById('hr-source')?.value?.trim();

        const hrData = {
            name: document.getElementById('hr-name')?.value?.trim(),
            company: document.getElementById('hr-company')?.value?.trim(),
            email: document.getElementById('hr-email')?.value?.trim(),
            countryCode: document.getElementById('country-code')?.value?.trim() || '',
            phoneNumber: document.getElementById('phone-number')?.value?.trim() || '',
            role: role === 'other' ? document.getElementById('other-role-input')?.value?.trim() : role,
            hiringFor: hiringFor === 'other' ? document.getElementById('other-position-input')?.value?.trim() : hiringFor,
            source: source === 'other' ? document.getElementById('other-source-input')?.value?.trim() : source,
            contactPreference: document.getElementById('contact-preference')?.value?.trim(),
            linkedinProfile: document.getElementById('linkedin-profile')?.value?.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            actionType: pendingAction?.type || 'direct'
        };

        // Validate required fields
        const requiredFields = ['name', 'company', 'email', 'role', 'hiringFor', 'source', 'contactPreference'];
        
        // Add LinkedIn validation only if LinkedIn is selected as contact preference
        if (hrData.contactPreference === 'linkedin') {
            requiredFields.push('linkedinProfile');
        }
        
        // Add phone validation only if phone call is selected as contact preference
        if (hrData.contactPreference === 'phone' || hrData.contactPreference === 'video') {
            if (!hrData.phoneNumber) {
                throw new Error('Phone number is required when selecting phone or video call as contact preference');
            }
            if (!hrData.countryCode) {
                throw new Error('Country code is required when selecting phone or video call as contact preference');
            }
        }

        const missingFields = requiredFields.filter(field => !hrData[field]);
        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        // Validate LinkedIn URL format if provided
        if (hrData.linkedinProfile && !hrData.linkedinProfile.match(/^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/)) {
            throw new Error('Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)');
        }

        // Store HR data in Firebase
        await db.ref('analytics/hrVisitors').push(hrData);
        console.log('HR data stored successfully');

        // Store form data in sessionStorage
        sessionStorage.setItem('hrFormData', JSON.stringify(hrData));

        // Send email notifications
        try {
            // First email: Notification to portfolio owner
            const ownerNotification = await emailjs.send(
                'service_e5co86p',
                'template_se66vt2',
                {
                    to_name: 'VeeraDinesh',
                    to_email: 'veeradinesh219@gmail.com',
                    reply_to: hrData.email,
                    from_name: hrData.name,
                    from_email: hrData.email,
                    from_company: hrData.company,
                    phone_number: `${hrData.countryCode} ${hrData.phoneNumber}`,
                    role: formatRole(hrData.role),
                    hiring_for: formatRole(hrData.hiringFor),
                    contact_preference: formatContactPreference(hrData.contactPreference),
                    linkedin_profile: hrData.linkedinProfile || 'Not provided'
                }
            );
            console.log('Owner notification sent:', ownerNotification);

            // Second email: Confirmation to HR
            const hrConfirmation = await emailjs.send(
                'service_e5co86p',
                'template_0ud01k4',
                {
                    to_name: hrData.name,
                    to_email: hrData.email,
                    reply_to: 'veeradinesh219@gmail.com',
                    from_name: 'VeeraDinesh',
                    from_email: 'veeradinesh219@gmail.com',
                    company: hrData.company,
                    role: formatRole(hrData.role),
                    hiring_for: formatRole(hrData.hiringFor),
                    portfolio_url: window.location.origin,
                    resume_url: document.getElementById('resume-download').href,
                    contact_preference: formatContactPreference(hrData.contactPreference),
                    subject: `Thank you for your interest - VeeraDinesh Portfolio`
                }
            );
            console.log('HR confirmation sent:', hrConfirmation);

        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            throw new Error(`Failed to send emails: ${emailError.message}`);
        }

        // Close HR form modal
        modal.classList.remove('show');

        // Show success modal
        const successModal = document.getElementById('success-modal');
        successModal.classList.add('show');

        // Handle close button click
        const closeSuccessBtn = document.querySelector('.close-success-btn');
        const closeSuccessModal = () => {
            successModal.classList.remove('show');
            // Clear form data from session storage
            sessionStorage.removeItem('hrFormData');
            // Reset form
            hrForm.reset();
            document.getElementById('linkedin-profile-group').style.display = 'none';
            document.getElementById('other-role-container').style.display = 'none';
            document.getElementById('other-position-container').style.display = 'none';
            document.getElementById('other-source-container').style.display = 'none';
        };

        closeSuccessBtn.addEventListener('click', closeSuccessModal);
        
        // Close on click outside
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeSuccessModal();
            }
        });

        // Proceed with action after delay
        if (pendingAction) {
            setTimeout(() => {
                if (pendingAction.type === 'resume') {
                    window.open(pendingAction.href, '_blank');
                } else if (pendingAction.type === 'email') {
                    window.location.href = pendingAction.href;
                }
                pendingAction = null;
            }, 1500);
        }

    } catch (error) {
        console.error('Form submission error:', error);
        alert(error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Continue';
        }
    }
});

// Helper functions for formatting
function formatRole(role) {
    return role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatCompanySize(size) {
    const sizes = {
        'startup': 'Startup (1-50)',
        'small': 'Small (51-200)',
        'medium': 'Medium (201-1000)',
        'large': 'Large (1001-5000)',
        'enterprise': 'Enterprise (5000+)'
    };
    return sizes[size] || size;
}

function formatContactPreference(preference) {
    const preferences = {
        'email': 'Email',
        'linkedin': 'LinkedIn Message',
        'phone': 'Phone Call',
        'video': 'Video Call'
    };
    return preferences[preference] || preference;
}

// Track reading time
let startTime = Date.now();
let isTracking = false;

function startReadingTimeTracking() {
    if (!db) {
        console.error('Firebase not initialized');
        return;
    }
    if (!isTracking) {
        startTime = Date.now();
        isTracking = true;
    }
}

// Cookie Consent Functions
document.addEventListener('DOMContentLoaded', function() {
    // Show cookie consent if not previously accepted
    if (!localStorage.getItem('cookieConsent')) {
        document.getElementById('cookie-consent').style.display = 'block';
    }

    // Cookie consent banner buttons
    document.getElementById('accept-cookies-btn')?.addEventListener('click', function() {
        acceptAllCookies();
        document.getElementById('cookie-consent').style.display = 'none';
        localStorage.setItem('cookieConsent', 'accepted');
    });

    document.getElementById('cookie-settings-btn')?.addEventListener('click', function() {
        document.getElementById('cookie-settings-modal').style.display = 'block';
    });

    // Cookie settings modal
    document.getElementById('close-cookie-settings')?.addEventListener('click', function() {
        document.getElementById('cookie-settings-modal').style.display = 'none';
    });

    document.getElementById('save-preferences-btn')?.addEventListener('click', function() {
        saveCookiePreferences();
        document.getElementById('cookie-settings-modal').style.display = 'none';
        document.getElementById('cookie-consent').style.display = 'none';
        localStorage.setItem('cookieConsent', 'customized');
    });
});

function acceptAllCookies() {
    localStorage.setItem('essentialCookies', 'true');
    localStorage.setItem('analyticsCookies', 'true');
    localStorage.setItem('preferenceCookies', 'true');
    
    // Enable all cookie checkboxes in settings
    document.getElementById('analytics-cookies').checked = true;
    document.getElementById('preference-cookies').checked = true;
}

function saveCookiePreferences() {
    localStorage.setItem('essentialCookies', 'true'); // Essential cookies are always enabled
    localStorage.setItem('analyticsCookies', document.getElementById('analytics-cookies').checked);
    localStorage.setItem('preferenceCookies', document.getElementById('preference-cookies').checked);
}

// When clicking outside the modal, close it
window.addEventListener('click', function(event) {
    let modal = document.getElementById('cookie-settings-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Log that we're fixing the cookie banner
console.log('Fixing cookie banner...');

// Function to get visitor location with multiple fallbacks
async function getVisitorLocation() {
    try {
        if (!firebase.apps.length || !firebase.database) {
            console.log('Firebase not initialized yet, will retry location tracking later');
            return null;
        }

        // Using only ipwhois.app which has better CORS support and higher rate limits
        const response = await fetch('https://ipwhois.app/json/', { 
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.country_code) {
            throw new Error('Invalid location data received');
        }

        // Format the data
        const formattedData = {
            ip: data.ip || 'unknown',
            city: data.city || 'unknown',
            region: data.region || 'unknown',
            country: data.country_code,
            loc: data.latitude && data.longitude ? 
                `${data.latitude},${data.longitude}` : '',
            org: data.org || data.isp || '',
            postal: data.postal || '',
            timezone: data.timezone_id || ''
        };

        // Use a transaction to handle concurrent updates
        const locationRef = firebase.database().ref('visits/locations');
        const countryRef = locationRef.child(formattedData.country);
        
        await countryRef.transaction((currentCount) => {
            return (currentCount || 0) + 1;
        });

        // Store detailed visit data with rate limiting
        const now = Date.now();
        const detailedLocationRef = firebase.database()
            .ref('visits/locationDetails')
            .orderByChild('timestamp')
            .limitToLast(1);

        const snapshot = await detailedLocationRef.once('value');
        const lastVisit = snapshot.val();
        
        // Only store detailed data if last visit was more than 1 minute ago
        if (!lastVisit || (now - Object.values(lastVisit)[0].timestamp) > 60000) {
            await firebase.database()
                .ref('visits/locationDetails')
                .push({
                    ...formattedData,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
        }

        return formattedData;
    } catch (error) {
        console.error('Error tracking location:', error);
        return {
            country: 'unknown',
            city: 'unknown',
            region: 'unknown'
        };
    }
}

// Call getVisitorLocation when page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOMContentLoaded code ...
    
    // Track visitor location
    getVisitorLocation();
});

async function initializeAnalytics() {
    try {
        // Get Firebase config first
        const firebaseConfig = await loadFirebaseConfig();
        
        // Initialize Firebase if not already done
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
        }

        // Wait a moment to ensure Firebase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Track the visit
        await trackVisit();

        // Set up analytics cookies
        if (firebase.analytics) {
            firebase.analytics().setAnalyticsCollectionEnabled(true);
        }
    } catch (error) {
        console.error('Error initializing analytics:', error);
    }
}

// Call initialization when document is ready
document.addEventListener('DOMContentLoaded', initializeAnalytics);
