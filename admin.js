// Verify dependencies are loaded
function checkDependencies() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK is not loaded');
        return false;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return false;
    }
    
    console.log('All dependencies loaded successfully');
    return true;
}

// Firebase configuration
// Global database reference
let db = null;

function loadFirebaseConfig() {
    console.log('Using local Firebase config');
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
}

// Initialize Firebase
async function initializeFirebase() {
    try {
        const firebaseConfig = await loadFirebaseConfig();
        if (!firebaseConfig) {
            console.error('Failed to load Firebase configuration');
            return false;
        }
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            // Initialize the core app first
firebase.initializeApp(firebaseConfig);
            
            // After core initialization, set up auth persistence
            if (window.location.protocol === 'file:') {
                try {
                    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                } catch (error) {
                    console.warn('Auth persistence fallback to memory:', error);
                }
            }
        }

        // Initialize database reference
        db = firebase.database();
        
        // Set up offline persistence for database
        if (db) {
            db.goOnline();
            db.ref('.info/connected').on('value', function(snap) {
                if (snap.val() === true) {
                    console.log('Connected to Firebase Database');
                } else {
                    console.log('Disconnected from Firebase Database');
                }
            });
        }

        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// Initialize app after loading config
async function initializeApp() {
    try {
    // Verify all required libraries are loaded
    if (!checkDependencies()) {
            throw new Error('Unable to initialize app due to missing dependencies');
    }
    
    const initialized = await initializeFirebase();
    if (!initialized) {
            throw new Error('Failed to initialize Firebase');
        }

        // Set up authentication state observer
        firebase.auth().onAuthStateChanged(async (user) => {
            try {
    if (!user) {
                    // If we're in a file:// environment, try silent sign-in first
                    if (window.location.protocol === 'file:') {
                        try {
                            // Attempt to sign in anonymously for local testing
                            await firebase.auth().signInAnonymously();
                            console.log('Signed in anonymously for local testing');
                        } catch (error) {
                            console.error('Anonymous auth failed:', error);
        window.location.href = 'login.html';
                            return;
                        }
                    } else {
                        window.location.href = 'login.html';
                        return;
                    }
                }
                
                console.log('User is authenticated');
                setupNavigation();
                await initializeDashboard();
                
            } catch (error) {
                console.error('Error in auth state change:', error);
            }
        });

        // Setup logout with proper cleanup
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth().signOut();
                    // Clear any local data if needed
                    localStorage.removeItem('firebase:host:portfolio-cac4b-default-rtdb.asia-southeast1.firebasedatabase.app');
                } catch (error) {
                    console.error('Error signing out:', error);
                }
            });
        }

    } catch (error) {
        console.error('App initialization error:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Failed to initialize application. Please refresh the page or contact support.';
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting app initialization...');
    initializeApp().catch(error => {
        console.error('Failed to start app:', error);
    });
});

// Initialize all charts and data listeners
async function initializeDashboard() {
    try {
        if (!db) {
            console.error("Database not initialized");
            return;
        }
        
        // Execute each setup function individually with error handling
        const setupFunctions = [
            { name: "Basic Stats", fn: setupBasicStats },
            { name: "Visits Chart", fn: setupVisitsChart },
            { name: "Device Chart", fn: setupDeviceChart },
            { name: "Section Chart", fn: setupSectionChart },
            { name: "Scroll Chart", fn: setupScrollChart },
            { name: "Performance Metrics", fn: setupPerformanceMetrics },
            { name: "Activity Log", fn: setupActivityLog },
            { name: "Error Log", fn: setupErrorLog },
            { name: "Activity Filters", fn: setupActivityFilters },
            { name: "Email Stats", fn: setupEmailStats },
            { name: "Company Stats", fn: setupCompanyStats },
            { name: "HR Stats", fn: setupHRStats },
            { name: "Portfolio Editor", fn: setupPortfolioEditor },
            { name: "Location Stats", fn: setupLocationStats }
        ];
        
        for (const setup of setupFunctions) {
            try {
                await setup.fn();
                console.log(`${setup.name} initialized successfully`);
            } catch (error) {
                console.error(`Error initializing ${setup.name}:`, error);
                // Continue with next setup function despite error
            }
        }
        
        console.log("Dashboard initialization completed");
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Setup basic statistics
async function setupBasicStats() {
    try {
        // Total visits
        db.ref('analytics/visits').on('value', snapshot => {
            document.getElementById('total-visits').textContent = snapshot.val() || 0;
        });

        // Resume downloads - Updated to use resumeClicks
        db.ref('analytics/resumeClicks').on('value', snapshot => {
            let downloads = 0;
            if (snapshot.exists()) {
                snapshot.forEach(() => {
                    downloads++;
                });
            }
            document.getElementById('resume-downloads').textContent = downloads;
        });

        // Average reading time - Updated calculation
        db.ref('analytics/readingTime').on('value', snapshot => {
            try {
                let totalTime = 0;
                let count = 0;
                
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const time = child.val()?.duration;
                        if (typeof time === 'number' && time > 0) {
                            totalTime += time;
                            count++;
                        }
                    });
                }

                const avgTime = count > 0 ? Math.round(totalTime / count) : 0;
                document.getElementById('avg-read-time').textContent = `${avgTime} min`;
            } catch (error) {
                console.error('Error calculating average read time:', error);
                document.getElementById('avg-read-time').textContent = '0 min';
            }
        });

        // Mobile percentage
        const visitDetails = await db.ref('analytics/visitDetails').once('value');
        let mobileCount = 0;
        let totalCount = 0;
        
        visitDetails.forEach(child => {
            totalCount++;
            if (child.val().deviceType === 'mobile') {
                mobileCount++;
            }
        });

        const percentage = totalCount > 0 ? Math.round((mobileCount / totalCount) * 100) : 0;
        document.getElementById('mobile-percentage').textContent = `${percentage}%`;
    } catch (error) {
        console.error('Error setting up basic stats:', error);
        // Set default values in case of error
        document.getElementById('resume-downloads').textContent = '0';
        document.getElementById('avg-read-time').textContent = '0 min';
        document.getElementById('mobile-percentage').textContent = '0%';
    }
}

// Track resume download
function trackResumeDownload() {
    const downloadData = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    
    // Add to resumeClicks collection
    db.ref('analytics/resumeClicks').push(downloadData);
}

// Track reading time
function trackReadingTime(duration) {
    if (typeof duration !== 'number' || duration <= 0) return;

    const readingData = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        duration: Math.round(duration), // duration in minutes
        deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    
    // Add to readingTime collection
    db.ref('analytics/readingTime').push(readingData);
}

// Chart theme configuration
const chartTheme = {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
    gridColor: '#2d3748',
    textColor: '#e2e8f0',
    fontSize: 12,
    fontFamily: "'Inter', sans-serif"
};

// Helper Functions
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
    }
    return dates;
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function formatDateLabel(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Setup visits chart
function setupVisitsChart() {
    // Check if Chart class is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const ctx = document.getElementById('visitsChart').getContext('2d');
    if (!ctx) return;

    // Check if chart already exists and destroy it
    if (window.visitsChart && typeof window.visitsChart.destroy === 'function') {
        window.visitsChart.destroy();
    } else {
        // If chart exists but destroy is not a function, remove the reference
        window.visitsChart = null;
    }

    const dates = getLast7Days();
    const labels = dates.map(formatDateLabel);

    window.visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Visits',
                data: Array(7).fill(0),
                borderColor: chartTheme.borderColor,
                backgroundColor: chartTheme.backgroundColor,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: chartTheme.backgroundColor,
                    titleColor: chartTheme.textColor,
                    bodyColor: chartTheme.textColor,
                    borderColor: chartTheme.gridColor,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        },
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        }
                    }
                }
            }
        }
    });

    // Function to update chart data
    const updateData = async () => {
        try {
            const promises = dates.map(async (date, index) => {
                const dateKey = formatDateKey(date);
                const snapshot = await db.ref(`analytics/dailyVisits/${dateKey}`).once('value');
                return {
                    index,
                    value: snapshot.val() || 0
                };
            });

            const results = await Promise.all(promises);
            
            // Update chart data
            results.forEach(({index, value}) => {
                window.visitsChart.data.datasets[0].data[index] = value;
            });
            
            window.visitsChart.update();
        } catch (error) {
            console.error('Error updating visits chart:', error);
        }
    };

    // Initial load
    updateData();

    // Setup real-time updates with debounce
    let updateTimeout;
    db.ref('analytics/dailyVisits').on('value', () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateData, 100);
    });
}

// Setup device distribution chart
function setupDeviceChart() {
    // Check if Chart class is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const ctx = document.getElementById('deviceChart').getContext('2d');
    if (!ctx) return;

    // Check if chart already exists and destroy it
    if (window.deviceChart && typeof window.deviceChart.destroy === 'function') {
        window.deviceChart.destroy();
    } else {
        // If chart exists but destroy is not a function, remove the reference
        window.deviceChart = null;
    }

    window.deviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Desktop', 'Mobile'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#6366f1', '#818cf8'],
                borderColor: '#1e2028',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        },
                        padding: 20
                    }
                }
            }
        }
    });

    // Batch update data
    db.ref('analytics/visitDetails').on('value', snapshot => {
        try {
            const devices = { desktop: 0, mobile: 0 };
            snapshot.forEach(child => {
                const deviceType = child.val()?.deviceType;
                if (deviceType && devices.hasOwnProperty(deviceType)) {
                    devices[deviceType]++;
                }
            });
            
            window.deviceChart.data.datasets[0].data = [devices.desktop, devices.mobile];
            window.deviceChart.update('none');
        } catch (error) {
            console.error('Error updating device chart:', error);
        }
    });
}

// Setup section views chart
function setupSectionChart() {
    // Check if Chart class is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const ctx = document.getElementById('sectionChart').getContext('2d');
    if (!ctx) return;

    // Check if chart already exists and destroy it
    if (window.sectionChart && typeof window.sectionChart.destroy === 'function') {
        window.sectionChart.destroy();
    } else {
        // If chart exists but destroy is not a function, remove the reference
        window.sectionChart = null;
    }

    window.sectionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: chartTheme.backgroundColor,
                borderColor: chartTheme.borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        }
                    }
                },
                x: {
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        }
                    }
                }
            }
        }
    });

    // Debounce update function
    let updateTimeout;
    const debouncedUpdate = (sections) => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            window.sectionChart.data.labels = Object.keys(sections);
            window.sectionChart.data.datasets[0].data = Object.values(sections);
            window.sectionChart.update('none');
        }, 100);
    };

    // Batch update data
    db.ref('analytics/sectionViews').on('value', snapshot => {
        try {
            const sections = {};
            snapshot.forEach(child => {
                const section = child.val()?.section;
                if (section) {
                    sections[section] = (sections[section] || 0) + 1;
                }
            });
            debouncedUpdate(sections);
        } catch (error) {
            console.error('Error updating section chart:', error);
        }
    });
}

// Setup scroll depth chart
function setupScrollChart() {
    // Check if Chart class is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const ctx = document.getElementById('scrollChart').getContext('2d');
    if (!ctx) return;

    // Check if chart already exists and destroy it
    if (window.scrollChart && typeof window.scrollChart.destroy === 'function') {
        window.scrollChart.destroy();
    } else {
        // If chart exists but destroy is not a function, remove the reference
        window.scrollChart = null;
    }

    window.scrollChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['25%', '50%', '75%', '100%'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: chartTheme.backgroundColor,
                borderColor: chartTheme.borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        }
                    }
                },
                x: {
                    grid: {
                        color: chartTheme.gridColor
                    },
                    ticks: {
                        color: chartTheme.textColor,
                        font: {
                            family: chartTheme.fontFamily,
                            size: chartTheme.fontSize
                        }
                    }
                }
            }
        }
    });

    // Batch update data
    db.ref('analytics/scrollDepth').on('value', snapshot => {
        try {
            const depths = { 25: 0, 50: 0, 75: 0, 100: 0 };
            snapshot.forEach(child => {
                const depth = child.val()?.depth;
                if (depth && depths.hasOwnProperty(depth)) {
                    depths[depth]++;
                }
            });
            window.scrollChart.data.datasets[0].data = Object.values(depths);
            window.scrollChart.update('none');
        } catch (error) {
            console.error('Error updating scroll chart:', error);
        }
    });
}

// Setup performance metrics
function setupPerformanceMetrics() {
    db.ref('analytics/performance').on('value', snapshot => {
        const metrics = {
            loadTime: [],
            domReady: [],
            firstPaint: []
        };

        snapshot.forEach(child => {
            const data = child.val();
            metrics.loadTime.push(data.loadTime);
            metrics.domReady.push(data.domReady);
            metrics.firstPaint.push(data.firstPaint);
        });

        // Calculate averages
        document.getElementById('avg-load-time').textContent = 
            `${calculateAverage(metrics.loadTime)}ms`;
        document.getElementById('avg-dom-ready').textContent = 
            `${calculateAverage(metrics.domReady)}ms`;
        document.getElementById('avg-first-paint').textContent = 
            `${calculateAverage(metrics.firstPaint)}ms`;
    });
}

// Setup activity filters
function setupActivityFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.type;
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            filterActivities(currentFilter);
        });
    });
}

function filterActivities(type) {
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        if (type === 'all' || item.dataset.type === type) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Setup activity log
function setupActivityLog() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return; // Guard clause
    
    db.ref('analytics').on('value', snapshot => {
        try {
            const data = snapshot.val() || {};
            const activities = [];

            // Collect all activities with error handling
            if (data.visitDetails) {
                Object.entries(data.visitDetails).forEach(([key, value]) => {
                    if (value && value.timestamp && value.deviceType) {
                        activities.push({
                            type: 'visit',
                            timestamp: value.timestamp,
                            deviceType: value.deviceType
                        });
                    }
                });
            }

            if (data.resumeClicks) {
                Object.entries(data.resumeClicks).forEach(([key, value]) => {
                    if (value && value.timestamp) {
                        activities.push({
                            type: 'download',
                            timestamp: value.timestamp,
                            deviceType: value.deviceType || 'unknown'
                        });
                    }
                });
            }

            if (data.errors) {
                Object.entries(data.errors).forEach(([key, value]) => {
                    if (value && value.timestamp && value.message) {
                        activities.push({
                            type: 'error',
                            timestamp: value.timestamp,
                            message: value.message
                        });
                    }
                });
            }

            // Sort by timestamp and take latest 50
            activities.sort((a, b) => b.timestamp - a.timestamp);
            const recentActivities = activities.slice(0, 50);

            // Render activities
            activityList.innerHTML = '';
            recentActivities.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.dataset.type = activity.type;
                item.innerHTML = `
                    <p>${formatActivity(activity)}</p>
                    <span class="time">${formatTimeAgo(activity.timestamp)}</span>
                `;
                activityList.appendChild(item);
            });

            // Reapply current filter
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter) {
                filterActivities(activeFilter.dataset.type);
            }
        } catch (error) {
            console.error('Error in activity log:', error);
            activityList.innerHTML = '<div class="error-message">Error loading activities</div>';
        }
    });
}

// Setup error log with improved error handling
function setupErrorLog() {
    const errorList = document.getElementById('error-list');
    if (!errorList) return; // Guard clause
    
    db.ref('analytics/errors').orderByChild('timestamp').limitToLast(50)
    .on('value', snapshot => {
        try {
            errorList.innerHTML = '';
            const errors = [];

            snapshot.forEach(child => {
                const error = child.val();
                if (error && error.timestamp) {
                    errors.unshift(error);
                }
            });

            if (errors.length === 0) {
                errorList.innerHTML = '<div class="error-item">No errors logged</div>';
                return;
            }

            errors.forEach(error => {
                const item = document.createElement('div');
                item.className = 'error-item';
                item.innerHTML = `
                    <div class="error-message">${escapeHtml(error.message || 'Unknown error')}</div>
                    <div class="error-details">
                        ${error.source ? `File: ${escapeHtml(error.source)}<br>` : ''}
                        ${error.line ? `Line: ${error.line}` : ''}
                        ${error.column ? `, Column: ${error.column}` : ''}
                        <br>
                        ${formatTimeAgo(error.timestamp)}
                    </div>
                `;
                errorList.appendChild(item);
            });
        } catch (error) {
            console.error('Error in error log:', error);
            errorList.innerHTML = '<div class="error-message">Error loading error log</div>';
        }
    });
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function calculateAverage(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round(sum / arr.length);
}

function formatActivity(activity) {
    switch (activity.type) {
        case 'visit':
            return `New visit from ${activity.deviceType} device`;
        case 'download':
            return 'Resume downloaded';
        case 'error':
            return `Error: ${activity.message}`;
        case 'email':
            return `Email clicked: ${activity.email}`;
        case 'company':
            return `Company viewed: ${activity.company}`;
        case 'hr':
            return `HR Visit: ${activity.name} from ${activity.company}`;
        default:
            return 'Unknown activity';
    }
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Setup email interaction stats
function setupEmailStats() {
    const emailStatsDiv = document.getElementById('email-stats');
    if (!emailStatsDiv) return;

    // Listen for total email clicks
    db.ref('analytics/emailStats').on('value', snapshot => {
        const stats = snapshot.val() || { totalClicks: 0 };
        document.getElementById('total-email-clicks').textContent = stats.totalClicks;
    });

    // Listen for recent email interactions
    db.ref('analytics/emailClicks').orderByChild('timestamp')
    .limitToLast(10).on('value', snapshot => {
        const emailList = document.getElementById('recent-emails');
        if (!emailList) return;

        emailList.innerHTML = '';
        const emails = [];

        snapshot.forEach(child => {
            emails.unshift(child.val());
        });

        emails.forEach(data => {
            const item = document.createElement('div');
            item.className = 'email-interaction';
            item.innerHTML = `
                <div class="interaction-details">
                    <strong>${escapeHtml(data.email)}</strong>
                    <span class="time">${formatTimeAgo(data.timestamp)}</span>
                </div>
                <div class="device-info">
                    ${data.deviceType} • ${data.referrer === 'direct' ? 'Direct' : 'Referral'}
                </div>
            `;
            emailList.appendChild(item);
        });
    });
}

// Setup company interaction stats
function setupCompanyStats() {
    const companyStatsDiv = document.getElementById('company-stats');
    if (!companyStatsDiv) return;

    // Listen for company interactions
    db.ref('analytics/companyStats').on('value', snapshot => {
        const statsTable = document.getElementById('company-stats-table');
        if (!statsTable) return;

        const companies = [];
        snapshot.forEach(child => {
            companies.push({
                name: child.key.replace(/_/g, '.'),
                views: child.val().views || 0
            });
        });

        // Sort by views
        companies.sort((a, b) => b.views - a.views);

        // Update table
        statsTable.innerHTML = `
            <tr>
                <th>Company</th>
                <th>Views</th>
            </tr>
            ${companies.map(company => `
                <tr>
                    <td>${escapeHtml(company.name)}</td>
                    <td>${company.views}</td>
                </tr>
            `).join('')}
        `;
    });
}

// Setup HR visitor statistics
async function setupHRStats() {
    try {
        // Remove any existing listeners first
        db.ref('analytics/hrVisitors').off('value');
        
        // Clear existing table and stats
        const existingTable = document.getElementById('hr-visitors-table');
        if (existingTable) {
            existingTable.innerHTML = '';
        }

        // Setup CSV download button
        const downloadBtn = document.getElementById('download-hr-csv');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                downloadHRVisitorsCSV();
            });
        }

        // Reset stats display - Using proper null checks instead of optional chaining
        const totalHrVisitors = document.getElementById('total-hr-visitors');
        const todayHrVisitors = document.getElementById('today-hr-visitors');
        const mostCommonRole = document.getElementById('most-common-role');
        const mostActiveCompany = document.getElementById('most-active-company');
        const mostCommonSource = document.getElementById('most-common-source');
        
        if (totalHrVisitors) totalHrVisitors.textContent = '0';
        if (todayHrVisitors) todayHrVisitors.textContent = '0';
        if (mostCommonRole) mostCommonRole.textContent = '-';
        if (mostActiveCompany) mostActiveCompany.textContent = '-';
        if (mostCommonSource) mostCommonSource.textContent = '-';
        
        // Listen for HR visitors directly
        db.ref('analytics/hrVisitors').on('value', async snapshot => {
            try {
                console.log('HR visitors data received, processing...');
                
                // Check if we have data
                if (!snapshot.exists()) {
                    console.log('No HR visitors data found in database');
                    return;
                }
                
                const stats = {
                    totalVisitors: 0,
                    roles: {},
                    companies: [],
                    sources: {}
                };

                const visitors = [];
                const companyMap = new Map();

                snapshot.forEach(child => {
                    const visitor = child.val();
                    if (!visitor) return;

                    visitors.push(visitor);
                    stats.totalVisitors++;

                    if (visitor.role) {
                        stats.roles[visitor.role] = (stats.roles[visitor.role] || 0) + 1;
                    }

                    if (visitor.company) {
                        const companyName = visitor.company.trim();
                        if (!companyMap.has(companyName)) {
                            companyMap.set(companyName, {
                                name: companyName,
                                visits: 0,
                                lastVisit: visitor.timestamp || Date.now()
                            });
                        }
                        const companyData = companyMap.get(companyName);
                        companyData.visits++;
                        if (visitor.timestamp > companyData.lastVisit) {
                            companyData.lastVisit = visitor.timestamp;
                        }
                    }

                    if (visitor.source) {
                        stats.sources[visitor.source] = (stats.sources[visitor.source] || 0) + 1;
                    }
                });

                stats.companies = Array.from(companyMap.values());

                // Update display elements - Using the references we saved earlier
                if (totalHrVisitors) {
                    totalHrVisitors.textContent = stats.totalVisitors;
                }
                
                // Calculate today's HR visitors
                const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
                let todayVisitorCount = 0;
                
                visitors.forEach(visitor => {
                    if (visitor.timestamp) {
                        const visitDate = new Date(visitor.timestamp).toISOString().split('T')[0];
                        if (visitDate === today) {
                            todayVisitorCount++;
                        }
                    }
                });
                
                if (todayHrVisitors) {
                    todayHrVisitors.textContent = todayVisitorCount;
                }

                const mostCommonRoleEntry = Object.entries(stats.roles)
                    .sort((a, b) => b[1] - a[1])[0];
                if (mostCommonRole) {
                    mostCommonRole.textContent = 
                        mostCommonRoleEntry ? formatRole(mostCommonRoleEntry[0]) : '-';
                }

                const mostActiveCompanyEntry = stats.companies
                    .sort((a, b) => b.visits - a.visits)[0];
                if (mostActiveCompany) {
                    mostActiveCompany.textContent = 
                        mostActiveCompanyEntry ? mostActiveCompanyEntry.name : '-';
                }

                const mostCommonSourceEntry = Object.entries(stats.sources)
                    .sort((a, b) => b[1] - a[1])[0];
                if (mostCommonSource) {
                    mostCommonSource.textContent = 
                        mostCommonSourceEntry ? formatSource(mostCommonSourceEntry[0]) : '-';
                }

                // Update HR Visitors table
                const table = document.getElementById('hr-visitors-table');
                if (table) {
                    table.innerHTML = ''; // Clear before updating
                    updateHRVisitorsTable(visitors);
                }
                
                // Update HR Visitors daily chart
                setupHRDailyVisitorsChart(visitors);

                // Store the calculated stats
                await db.ref('analytics/hrStats').set(stats);
                
                console.log('HR stats calculation completed successfully', {
                    totalVisitors: stats.totalVisitors,
                    todayVisitors: todayVisitorCount,
                    roles: Object.keys(stats.roles).length,
                    companies: stats.companies.length,
                    sources: Object.keys(stats.sources).length
                });

            } catch (error) {
                console.error('Error calculating HR stats:', error);
            }
        });
    } catch (error) {
        console.error('Error setting up HR stats:', error);
    }
}

// Global pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let allHRVisitors = [];

// Update HR Visitors table
function updateHRVisitorsTable(visitors) {
    const table = document.getElementById('hr-visitors-table');
    if (!table) {
        console.error('HR visitors table not found');
        return;
    }

    try {
        // Store all visitors globally for pagination
        allHRVisitors = visitors || [];
        
        // Check if there are any visitors
        if (!visitors || visitors.length === 0) {
            table.innerHTML = '<tr><td colspan="11" class="text-center">No HR visitor data available</td></tr>';
            document.getElementById('total-entries').textContent = '0';
            document.getElementById('page-start').textContent = '0';
            document.getElementById('page-end').textContent = '0';
            document.getElementById('pagination-numbers').innerHTML = '';
            document.getElementById('prev-page').disabled = true;
            document.getElementById('next-page').disabled = true;
            return;
        }
        
        // Sort visitors by timestamp (most recent first)
        allHRVisitors.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // Update pagination info
        const totalItems = allHRVisitors.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Reset to page 1 if current page is out of range
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        
        // Calculate start and end items for current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        // Get current page items
        const currentPageItems = allHRVisitors.slice(startIndex, endIndex);
        
        // Update pagination display
        document.getElementById('total-entries').textContent = totalItems;
        document.getElementById('page-start').textContent = totalItems === 0 ? '0' : startIndex + 1;
        document.getElementById('page-end').textContent = endIndex;
        
        // Create page number buttons
        const paginationNumbers = document.getElementById('pagination-numbers');
        paginationNumbers.innerHTML = '';
        
        // Only show max 5 page numbers
        const maxPageButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
        
        // Adjust start page if we're at the end
        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }
        
        // First page button (if not already showing)
        if (startPage > 1) {
            const firstPageBtn = createPageButton(1, currentPage === 1);
            paginationNumbers.appendChild(firstPageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('div');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                paginationNumbers.appendChild(ellipsis);
            }
        }
        
        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = createPageButton(i, currentPage === i);
            paginationNumbers.appendChild(pageBtn);
        }
        
        // Last page button (if not already showing)
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('div');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                paginationNumbers.appendChild(ellipsis);
            }
            
            const lastPageBtn = createPageButton(totalPages, currentPage === totalPages);
            paginationNumbers.appendChild(lastPageBtn);
        }
        
        // Update prev/next buttons
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages;
        
        // Add event listeners to pagination buttons if not already added
        if (!document.getElementById('prev-page').hasAttribute('data-listener')) {
            document.getElementById('prev-page').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateHRVisitorsTable(allHRVisitors);
                }
            });
            document.getElementById('prev-page').setAttribute('data-listener', 'true');
        }
        
        if (!document.getElementById('next-page').hasAttribute('data-listener')) {
            document.getElementById('next-page').addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    updateHRVisitorsTable(allHRVisitors);
                }
            });
            document.getElementById('next-page').setAttribute('data-listener', 'true');
        }

        // Add visitor rows for current page
        const rows = currentPageItems.map(visitor => {
            const timestamp = new Date(visitor.timestamp || Date.now());
            const contact = visitor.countryCode && visitor.phoneNumber ? 
                `${visitor.countryCode} ${visitor.phoneNumber}` : '-';

            return `
                <tr>
                    <td>${escapeHtml(visitor.name || '-')}</td>
                    <td>${escapeHtml(visitor.company || '-')}</td>
                    <td>${escapeHtml(visitor.email || '-')}</td>
                    <td>${escapeHtml(contact)}</td>
                    <td>${escapeHtml(formatRole(visitor.role) || '-')}</td>
                    <td>${escapeHtml(visitor.companySize ? formatCompanySize(visitor.companySize) : '-')}</td>
                    <td>${escapeHtml(visitor.hiringFor ? formatRole(visitor.hiringFor) : '-')}</td>
                    <td>${escapeHtml(formatSource(visitor.source) || '-')}</td>
                    <td>${escapeHtml(visitor.contactPreference ? formatContactPreference(visitor.contactPreference) : '-')}</td>
                    <td>${escapeHtml(visitor.deviceType || '-')}</td>
                    <td>${timestamp.toLocaleString()}</td>
                </tr>
            `;
        }).join('');

        table.innerHTML = rows;
    } catch (error) {
        console.error('Error updating HR visitors table:', error);
        table.innerHTML = '<tr><td colspan="11">Error loading HR visitor data</td></tr>';
    }
}

// Helper function to create page number button
function createPageButton(pageNum, isActive) {
    const button = document.createElement('div');
    button.className = `page-number${isActive ? ' active' : ''}`;
    button.textContent = pageNum;
    button.addEventListener('click', () => {
        if (currentPage !== pageNum) {
            currentPage = pageNum;
            updateHRVisitorsTable(allHRVisitors);
        }
    });
    return button;
}

// Format source display value
function formatSource(source) {
    if (!source) return '-';
    return source.charAt(0).toUpperCase() + source.slice(1);
}

// Format role display value
function formatRole(role) {
    if (!role) return '-';
    return role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Format company size display value
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

// Format contact preference display value
function formatContactPreference(preference) {
    const preferences = {
        'email': 'Email',
        'linkedin': 'LinkedIn',
        'phone': 'Phone Call',
        'video': 'Video Call'
    };
    return preferences[preference] || preference;
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section-container');
    
    // Setup sidebar toggle
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidePanel = document.querySelector('.side-panel');
    const mainContent = document.querySelector('.main-content');
    
    if (toggleBtn && sidePanel && mainContent) {
        toggleBtn.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
    
    // Add click handlers to nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            console.log('Navigation clicked:', item.dataset.section);
            
            // Remove active class from all items
            navItems.forEach(nav => {
                nav.classList.remove('active');
            });
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            
            if (targetSection) {
                targetSection.style.display = 'block';
                console.log('Displaying section:', sectionId);
                
                // Initialize portfolio editor when its section is displayed
                if (sectionId === 'portfolio-editor') {
                    setupPortfolioEditor();
                }
            } else {
                console.error('Section not found:', sectionId);
            }
        });
    });
}

// Download HR Visitors data as CSV
function downloadHRVisitorsCSV() {
    db.ref('analytics/hrVisitors').once('value', snapshot => {
        try {
            const visitors = [];
            snapshot.forEach(child => {
                const visitor = child.val();
                if (visitor) {
                    visitors.push(visitor);
                }
            });
            
            if (visitors.length === 0) {
                alert('No HR visitors data to export');
                return;
            }
            
            // Generate CSV content
            const headers = [
                'Name', 'Company', 'Email', 'Country Code', 'Phone Number', 
                'Role', 'Company Size', 'Hiring For', 'Source', 'Contact Preference',
                'Device Type', 'Timestamp'
            ];
            
            const rows = visitors.map(visitor => [
                visitor.name || '',
                visitor.company || '',
                visitor.email || '',
                visitor.countryCode || '',
                visitor.phoneNumber || '',
                visitor.role || '',
                visitor.companySize || '',
                visitor.hiringFor || '',
                visitor.source || '',
                visitor.contactPreference || '',
                visitor.deviceType || '',
                new Date(visitor.timestamp || Date.now()).toLocaleString()
            ]);
            
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `hr-visitors-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
            
        } catch (error) {
            console.error('Error downloading HR visitors CSV:', error);
            alert('Error generating CSV file');
        }
    });
}

// Setup HR Daily Visitors Chart
function setupHRDailyVisitorsChart(visitors) {
    // Check if Chart class is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const ctx = document.getElementById('hrVisitorsChart').getContext('2d');
    if (!ctx) {
        console.error('HR Visitors Chart canvas not found');
        return;
    }

    // Check if chart already exists and destroy it
    if (window.hrVisitorsChart && typeof window.hrVisitorsChart.destroy === 'function') {
        window.hrVisitorsChart.destroy();
    } else {
        // If chart exists but destroy is not a function, remove the reference
        window.hrVisitorsChart = null;
    }

    // Group visitors by date
    const dailyVisitors = {};
    
    // Get the last 14 days for the chart
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        last14Days.push(dateString);
        dailyVisitors[dateString] = 0;
    }
    
    // Count visitors by date
    if (visitors && visitors.length > 0) {
        visitors.forEach(visitor => {
            if (visitor.timestamp) {
                const visitorDate = new Date(visitor.timestamp).toISOString().split('T')[0];
                if (dailyVisitors.hasOwnProperty(visitorDate)) {
                    dailyVisitors[visitorDate]++;
                }
            }
        });
    }
    
    // Format dates for display
    const labels = last14Days.map(date => {
        const parts = date.split('-');
        return `${parts[1]}/${parts[2]}`; // Format as MM/DD
    });
    
    // Create dataset from daily counts
    const data = last14Days.map(date => dailyVisitors[date]);
    
    // Create chart
    window.hrVisitorsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'HR Visitors',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return `Date: ${last14Days[index]}`;
                        },
                        label: function(context) {
                            return `Visitors: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    console.log('HR Visitors Chart initialized with data for the last 14 days');
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Helper functions for error and success messages
function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// Setup editor tabs with proper event handling
function setupEditorTabs() {
    const tabs = document.querySelectorAll('.editor-tab');
    const tabContents = document.querySelectorAll('.editor-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show selected tab content
            const tabName = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(`${tabName}-editor`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Load portfolio data with error handling
function loadPortfolioData() {
    const ref = db.ref('portfolioData');
    
    ref.once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Load Hero Section with validation
            if (data.hero) {
                const heroName = document.getElementById('hero-name');
                const heroTagline = document.getElementById('hero-tagline');
                const heroBio = document.getElementById('hero-bio');
                
                if (heroName) heroName.value = data.hero.name || '';
                if (heroTagline) heroTagline.value = data.hero.tagline || '';
                if (heroBio) heroBio.value = data.hero.bio || '';
            }
            
            // Load About Section with validation
            if (data.about) {
                const aboutContent = document.getElementById('about-content');
                const resumeLink = document.getElementById('resume-link');
                
                if (aboutContent) aboutContent.value = data.about.content || '';
                if (resumeLink) resumeLink.value = data.about.resumeLink || '';
            }
            
            // Load Skills with validation
            if (data.skills && typeof data.skills === 'object') {
                loadSkillsData(data.skills);
            } else {
                window.currentSkills = { categories: {} };
                window.currentCategory = '';
            }
            
            // Load Projects with validation
            if (data.projects && Array.isArray(data.projects)) {
                loadProjectsData(data.projects);
            } else {
                window.currentProjects = [];
            }
            
            // Load Contact with validation
            if (data.contact) {
                const contactEmail = document.getElementById('contact-email');
                const contactLinkedin = document.getElementById('contact-linkedin');
                const contactGithub = document.getElementById('contact-github');
                const contactTwitter = document.getElementById('contact-twitter');
                
                if (contactEmail) contactEmail.value = data.contact.email || '';
                if (contactLinkedin) contactLinkedin.value = data.contact.linkedin || '';
                if (contactGithub) contactGithub.value = data.contact.github || '';
                if (contactTwitter) contactTwitter.value = data.contact.twitter || '';
            }
        })
        .catch(error => {
            console.error('Error loading portfolio data:', error);
            showErrorMessage('Failed to load portfolio data. Please try refreshing the page.');
        });
}

// Load skills data into the editor
function loadSkillsData(skills) {
    try {
        // Initialize global variables for skills
        window.currentSkills = skills.categories ? skills : { categories: {} };
        if (!window.currentSkills.categories) {
            window.currentSkills.categories = {};
        }
        
        // Set the first category as current if exists
        const categories = Object.keys(window.currentSkills.categories);
        window.currentCategory = categories.length > 0 ? categories[0] : '';
        
        // Render skill categories
        renderSkillCategories();
        if (window.currentCategory) {
            renderSkills(window.currentCategory);
        }
    } catch (error) {
        console.error('Error loading skills data:', error);
        showErrorMessage('Error loading skills data');
    }
}

// Load projects data into the editor
function loadProjectsData(projects) {
    try {
        // Initialize global variable for projects
        window.currentProjects = Array.isArray(projects) ? projects : [];
        
        // Render projects
        renderProjects(window.currentProjects);
    } catch (error) {
        console.error('Error loading projects data:', error);
        showErrorMessage('Error loading projects data');
    }
}

// Render skill categories
function renderSkillCategories() {
    const categoriesList = document.getElementById('skill-categories-list');
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    Object.keys(window.currentSkills.categories).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category-item';
        categoryDiv.innerHTML = `
            <span>${category}</span>
            <div class="category-actions">
                <button class="icon-btn edit-category" data-category="${category}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="icon-btn delete-category" data-category="${category}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add click handler to select category
        categoryDiv.querySelector('span').addEventListener('click', () => {
            selectCategory(category);
        });
        
        // Add edit handler
        categoryDiv.querySelector('.edit-category').addEventListener('click', (e) => {
            e.stopPropagation();
            const newName = prompt('Enter new category name:', category);
            if (newName && newName !== category) {
                // Copy skills to new category name
                window.currentSkills.categories[newName] = [...window.currentSkills.categories[category]];
                // Delete old category
                delete window.currentSkills.categories[category];
                // Update current category reference
                window.currentCategory = newName;
                // Refresh UI
                renderSkillCategories();
                renderSkills(newName);
            }
        });
        
        // Add delete handler
        categoryDiv.querySelector('.delete-category').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete category "${category}" and all its skills?`)) {
                delete window.currentSkills.categories[category];
                
                // Reset current category if needed
                if (window.currentCategory === category) {
                    const categories = Object.keys(window.currentSkills.categories);
                    window.currentCategory = categories.length > 0 ? categories[0] : '';
                }
                
                // Refresh UI
                renderSkillCategories();
                if (window.currentCategory) {
                    renderSkills(window.currentCategory);
                } else {
                    document.getElementById('current-skills-list').innerHTML = '';
                    document.getElementById('current-category').textContent = '-';
                }
            }
        });
        
        categoriesList.appendChild(categoryDiv);
    });
}

// Select a skill category
function selectCategory(category) {
    window.currentCategory = category;
    document.getElementById('current-category').textContent = category;
    renderSkills(category);
    
    // Highlight selected category
    const categoryItems = document.querySelectorAll('.skill-category-item');
    categoryItems.forEach(item => {
        item.classList.remove('selected');
        if (item.querySelector('span').textContent === category) {
            item.classList.add('selected');
        }
    });
}

// Render skills for a category
function renderSkills(category) {
    const skillsList = document.getElementById('current-skills-list');
    if (!skillsList) return;
    
    skillsList.innerHTML = '';
    
    if (!window.currentSkills.categories[category]) {
        return;
    }
    
    window.currentSkills.categories[category].forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';
        skillDiv.innerHTML = `
            <span>${skill}</span>
            <div class="skill-actions">
                <button class="icon-btn edit-skill" data-skill="${skill}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="icon-btn delete-skill" data-skill="${skill}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add edit handler
        skillDiv.querySelector('.edit-skill').addEventListener('click', () => {
            const newName = prompt('Enter new skill name:', skill);
            if (newName && newName !== skill) {
                const index = window.currentSkills.categories[category].indexOf(skill);
                if (index !== -1) {
                    window.currentSkills.categories[category][index] = newName;
                    renderSkills(category);
                }
            }
        });
        
        // Add delete handler
        skillDiv.querySelector('.delete-skill').addEventListener('click', () => {
            if (confirm(`Delete skill "${skill}"?`)) {
                const index = window.currentSkills.categories[category].indexOf(skill);
                if (index !== -1) {
                    window.currentSkills.categories[category].splice(index, 1);
                    renderSkills(category);
                }
            }
        });
        
        skillsList.appendChild(skillDiv);
    });
}

// Setup portfolio editor with deployment functionality
function setupPortfolioEditor() {
    console.log('Setting up Portfolio Editor...');
    
    // Check if the enhanced editor is loaded
    if (typeof window.initializePortfolioEditor === 'function') {
        // Enhanced editor is loaded, it will handle the initialization
        console.log('Enhanced Portfolio Editor loaded');
    } else {
        // Fallback if enhanced editor is not loaded
        const editorContainer = document.getElementById('portfolio-editor');
        if (editorContainer) {
            const card = editorContainer.querySelector('.card');
            if (card) {
                card.innerHTML = `
                    <div class="editor-message">
                        <h3>Portfolio Editor</h3>
                        <p>The enhanced portfolio editor is not loaded. Please make sure enhanced-editor.js is properly included in the page.</p>
                        <button class="admin-btn" onclick="location.reload()">
                            <i class="fas fa-sync"></i> Reload Page
                        </button>
                    </div>
                `;
            }
        }
    }
    
    return Promise.resolve();
}

// Setup location stats
async function setupLocationStats() {
    console.log('Setting up location stats...');
    
    // Try both possible containers since there are two with similar IDs
    let locationStatsContainer = document.getElementById('location-stats-container');
    const overviewContainer = document.querySelector('.location-table-container');
    
    // Pick the right container based on which section is visible
    const isLocationSectionVisible = document.getElementById('location-stats').style.display === 'block';
    if (isLocationSectionVisible) {
        console.log('Using dedicated location stats container');
    } else {
        console.log('Using overview location stats container');
        if (overviewContainer) {
            locationStatsContainer = overviewContainer;
        }
    }
    
    if (!locationStatsContainer) {
        console.error('Location stats container not found in either section');
        return;
    }

    try {
        locationStatsContainer.innerHTML = '<p class="loading">Loading location data...</p>';
        
        console.log('Fetching location data from Firebase...');
        // Get both location visits and detailed location data
        const [visitsSnapshot, detailsSnapshot, backupSnapshot] = await Promise.all([
            db.ref('analytics/locationVisits').once('value'),
            db.ref('analytics/locationDetails').once('value'),
            db.ref('visits/locations').once('value')
        ]);

        console.log('Location visits data received:', visitsSnapshot.exists() ? 'Yes' : 'No');
        console.log('Location details data received:', detailsSnapshot.exists() ? 'Yes' : 'No');
        console.log('Backup location data received:', backupSnapshot.exists() ? 'Yes' : 'No');
        
        // Use main data source or fallback to backup if main is empty
        let locationVisits = visitsSnapshot.val() || {};
        if (Object.keys(locationVisits).length === 0 && backupSnapshot.exists()) {
            locationVisits = backupSnapshot.val() || {};
        }
        
        // Log the raw location visits data for debugging
        console.log('Raw locationVisits data:', JSON.stringify(locationVisits));
        
        const locationDetails = [];
        
        // Process detailed location data if it exists
        detailsSnapshot.forEach(child => {
            const detail = child.val();
            if (detail && detail.country) {
                locationDetails.push(detail);
            }
        });

        console.log('Processed location data:', {
            visitsCount: Object.keys(locationVisits).length,
            detailsCount: locationDetails.length
        });

        // If we have no data, show a message
        if (Object.keys(locationVisits).length === 0 && locationDetails.length === 0) {
            locationStatsContainer.innerHTML = '<p>No location data available yet. This could be because no visitors have been tracked with location data, or the data is stored in a different database path.</p>';
            return;
        }

        // Create stats overview
        const statsOverview = document.createElement('div');
        statsOverview.className = 'location-stats-overview';
        
        // Calculate total visits - fixed calculation
        let totalVisits = 0;
        // Log each value for debugging
        Object.entries(locationVisits).forEach(([country, visits]) => {
            const numVisits = Number(visits);
            console.log(`Country ${country}: ${visits} (as number: ${numVisits})`);
            if (!isNaN(numVisits)) {
                totalVisits += numVisits;
            }
        });
        
        const uniqueCountries = parseInt(new Set(locationDetails.map(d => d.country)).size) || 0;
        const uniqueCities = parseInt(new Set(locationDetails.filter(d => d.city && d.country).map(d => `${d.city}, ${d.country}`)).size) || 0;
        
        console.log('Calculated stats:', { totalVisits, uniqueCountries, uniqueCities });
        
        statsOverview.innerHTML = `
            <div class="stat-card">
                <h4>Total Visits</h4>
                <p>${totalVisits}</p>
            </div>
            <div class="stat-card">
                <h4>Unique Countries</h4>
                <p>${uniqueCountries}</p>
            </div>
            <div class="stat-card">
                <h4>Unique Cities</h4>
                <p>${uniqueCities}</p>
            </div>
        `;

        // Create world map visualization
        const worldMapContainer = document.createElement('div');
        worldMapContainer.className = 'world-map-container';
        worldMapContainer.innerHTML = `
            <div class="map-header">
                <h3>Global Visitor Distribution</h3>
                <div class="map-controls">
                    <button id="zoom-in-btn" class="map-btn"><i class="fas fa-search-plus"></i></button>
                    <button id="zoom-out-btn" class="map-btn"><i class="fas fa-search-minus"></i></button>
                    <button id="reset-map-btn" class="map-btn"><i class="fas fa-undo"></i></button>
                </div>
            </div>
            <div class="map-wrapper">
                <canvas id="worldMap" width="800" height="400"></canvas>
            </div>
            <div class="map-summary">
                <div class="country-count-box">
                    <span id="country-count">${Object.keys(locationVisits).length}</span> countries
                </div>
            </div>
        `;

        // Create country-level stats table with percentages
        const countryTable = document.createElement('div');
        countryTable.className = 'location-stats-section';
        countryTable.innerHTML = `
            <h3>Visits by Country</h3>
            <table class="location-stats-table">
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Percentage</th>
                        <th>Visits</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;

        // Add country rows
        const countryTbody = countryTable.querySelector('tbody');
        const sortedCountries = Object.entries(locationVisits).sort(([, a], [, b]) => {
            return Number(b) - Number(a);
        });

        // Array to store map data
        const mapData = [];
        
        // Country code to coordinates mapping for the map
        const countryCoordinates = {
            // North America
            US: { lat: 37.0902, lng: -95.7129 }, // United States
            CA: { lat: 56.1304, lng: -106.3468 }, // Canada
            MX: { lat: 23.6345, lng: -102.5528 }, // Mexico
            
            // Europe
            GB: { lat: 55.3781, lng: -3.4360 }, // United Kingdom
            DE: { lat: 51.1657, lng: 10.4515 }, // Germany
            FR: { lat: 46.2276, lng: 2.2137 }, // France
            IT: { lat: 41.8719, lng: 12.5674 }, // Italy
            ES: { lat: 40.4637, lng: -3.7492 }, // Spain
            NL: { lat: 52.1326, lng: 5.2913 }, // Netherlands
            RU: { lat: 61.5240, lng: 105.3188 }, // Russia
            
            // Asia
            CN: { lat: 35.8617, lng: 104.1954 }, // China
            JP: { lat: 36.2048, lng: 138.2529 }, // Japan
            IN: { lat: 22.3511, lng: 78.6677 }, // India - Updated coordinates
            KR: { lat: 35.9078, lng: 127.7669 }, // South Korea
            AU: { lat: -25.2744, lng: 133.7751 }, // Australia
            
            // South America
            BR: { lat: -14.2350, lng: -51.9253 }, // Brazil
            AR: { lat: -38.4161, lng: -63.6167 }, // Argentina
            
            // Africa
            ZA: { lat: -30.5595, lng: 22.9375 }, // South Africa
            EG: { lat: 26.8206, lng: 30.8025 }, // Egypt
            NG: { lat: 9.0820, lng: 8.6753 }, // Nigeria
        };

        for (const [country, visits] of sortedCountries) {
            const visitsNum = Number(visits) || 0;
            const percentage = totalVisits > 0 ? ((visitsNum / totalVisits) * 100).toFixed(1) : '0.0';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${getCountryName(country)}</td>
                <td>${percentage}% <span class="visit-count">(${visitsNum})</span></td>
                <td>${visitsNum}</td>
            `;
            countryTbody.appendChild(row);
            
            // Add to map data if coordinates exist
            if (countryCoordinates[country]) {
                mapData.push({
                    country: country,
                    name: getCountryName(country),
                    coordinates: countryCoordinates[country],
                    visits: visitsNum,
                    percentage: percentage
                });
            }
        }

        // Only show city data if we have detailed location info
        if (locationDetails.length > 0) {
            // Create city-level stats table
            const cityTable = document.createElement('div');
            cityTable.className = 'location-stats-section';
            cityTable.innerHTML = `
                <h3>Visits by City</h3>
                <table class="location-stats-table">
                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Region</th>
                            <th>Country</th>
                            <th>Visits</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;

            // Process city-level data
            const cityVisits = {};
            locationDetails.forEach(detail => {
                if (detail.city && detail.region && detail.country) {
                    const key = `${detail.city}, ${detail.region}, ${detail.country}`;
                    cityVisits[key] = (cityVisits[key] || 0) + 1;
                }
            });

            // Add city rows
            const cityTbody = cityTable.querySelector('tbody');
            const sortedCities = Object.entries(cityVisits).sort(([, a], [, b]) => Number(b) - Number(a));

            for (const [cityKey, visits] of sortedCities) {
                const [city, region, country] = cityKey.split(', ');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${escapeHtml(city || '-')}</td>
                    <td>${escapeHtml(region || '-')}</td>
                    <td>${getCountryName(country)}</td>
                    <td>${Number(visits) || 0}</td>
                `;
                cityTbody.appendChild(row);
            }

            // Clear container and add new elements in order
            locationStatsContainer.innerHTML = '';
            locationStatsContainer.appendChild(statsOverview);
            locationStatsContainer.appendChild(worldMapContainer);
            locationStatsContainer.appendChild(countryTable);
            locationStatsContainer.appendChild(cityTable);
            
            // Initialize map after DOM elements are added
            setTimeout(() => {
                initializeWorldMap(mapData, totalVisits);
            }, 100);
        } else {
            // Just show country data if we don't have city data
            locationStatsContainer.innerHTML = '';
            locationStatsContainer.appendChild(statsOverview);
            locationStatsContainer.appendChild(worldMapContainer);
            locationStatsContainer.appendChild(countryTable);
            
            // Initialize map after DOM elements are added
            setTimeout(() => {
                initializeWorldMap(mapData, totalVisits);
            }, 100);
        }

        console.log('Location stats successfully set up');

    } catch (error) {
        console.error('Error setting up location stats:', error);
        locationStatsContainer.innerHTML = `
            <p class="error">Error loading location data: ${error.message}</p>
            <p>Please check the browser console for more details.</p>
        `;
    }
}

// Initialize world map visualization
function initializeWorldMap(mapData, totalVisits) {
    console.log('Initializing world map with data:', mapData);
    
    const mapWrapper = document.querySelector('.map-wrapper');
    if (!mapWrapper) {
        console.error('Map wrapper not found');
        return;
    }
    
    try {
        // Clear the map wrapper and add background + canvas
        mapWrapper.innerHTML = '';
        
        // Add background world map image
        const mapBg = document.createElement('div');
        mapBg.className = 'world-map-bg';
        mapWrapper.appendChild(mapBg);
        
        // Create canvas for data points
        const canvas = document.createElement('canvas');
        canvas.id = 'worldMap';
        canvas.style.position = 'relative';
        canvas.style.zIndex = '2';
        mapWrapper.appendChild(canvas);
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            mapWrapper.innerHTML = '<div class="error-message">Chart.js library is not loaded</div>';
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Configure chart data
        const chartData = {
            datasets: [{
                label: 'Visitor Distribution',
                data: mapData.map(country => ({
                    x: country.coordinates.lng,
                    y: country.coordinates.lat,
                    r: calculateBubbleSize(country.visits, totalVisits),
                    country: country.name,
                    visits: country.visits,
                    percentage: country.percentage
                })),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(75, 192, 192, 0.9)',
                hoverBorderColor: 'rgba(75, 192, 192, 1)',
                hoverBorderWidth: 2
            }]
        };
        
        // Create chart with improved options
        window.visitorMap = new Chart(ctx, {
            type: 'bubble',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        min: -180,
                        max: 180,
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        min: -90,
                        max: 90,
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 16
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                const data = context.raw;
                                return `${data.country}: ${data.visits} visits (${data.percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
        
        // Add map zoom controls functionality
        const zoomInBtn = document.getElementById('zoom-in-btn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                zoomMap(1.2);
            });
        }
        
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                zoomMap(0.8);
            });
        }
        
        const resetMapBtn = document.getElementById('reset-map-btn');
        if (resetMapBtn) {
            resetMapBtn.addEventListener('click', () => {
                resetMap();
            });
        }
        
        console.log('World map initialized successfully');
    } catch (error) {
        console.error('Error initializing world map:', error);
        mapWrapper.innerHTML = `<div class="error-message">Error initializing map: ${error.message}</div>`;
    }
}

// Helper function to calculate bubble size based on visit count
function calculateBubbleSize(visits, totalVisits) {
    // Base size
    const minSize = 5;
    const maxSize = 30;
    
    if (totalVisits === 0) return minSize;
    
    // Calculate size based on percentage of total, but ensure minimum visibility
    const percentage = visits / totalVisits;
    return Math.max(minSize, Math.min(maxSize, minSize + (percentage * 100)));
}

// Map zoom functions
let currentZoom = { x: { min: -180, max: 180 }, y: { min: -90, max: 90 } };

function zoomMap(factor) {
    if (!window.visitorMap) return;
    
    const xCenter = (currentZoom.x.min + currentZoom.x.max) / 2;
    const yCenter = (currentZoom.y.min + currentZoom.y.max) / 2;
    const xRange = (currentZoom.x.max - currentZoom.x.min) / 2;
    const yRange = (currentZoom.y.max - currentZoom.y.min) / 2;
    
    currentZoom.x.min = xCenter - (xRange / factor);
    currentZoom.x.max = xCenter + (xRange / factor);
    currentZoom.y.min = yCenter - (yRange / factor);
    currentZoom.y.max = yCenter + (yRange / factor);
    
    window.visitorMap.options.scales.x.min = currentZoom.x.min;
    window.visitorMap.options.scales.x.max = currentZoom.x.max;
    window.visitorMap.options.scales.y.min = currentZoom.y.min;
    window.visitorMap.options.scales.y.max = currentZoom.y.max;
    
    window.visitorMap.update();
}

function resetMap() {
    if (!window.visitorMap) return;
    
    currentZoom = { x: { min: -180, max: 180 }, y: { min: -90, max: 90 } };
    
    window.visitorMap.options.scales.x.min = currentZoom.x.min;
    window.visitorMap.options.scales.x.max = currentZoom.x.max;
    window.visitorMap.options.scales.y.min = currentZoom.y.min;
    window.visitorMap.options.scales.y.max = currentZoom.y.max;
    
    window.visitorMap.update();
}

function getCountryName(countryCode) {
    try {
        const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
        return displayNames.of(countryCode) || countryCode;
    } catch (error) {
        // Fallback for browsers that don't support Intl.DisplayNames
        return countryCode;
    }
}