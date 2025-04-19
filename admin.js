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
    // Always use local config to avoid the HTTP fetch issues
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
        
firebase.initializeApp(firebaseConfig);
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// Initialize app after loading config
async function initializeApp() {
    // Verify all required libraries are loaded
    if (!checkDependencies()) {
        console.error('Unable to initialize app due to missing dependencies');
        return;
    }
    
    const initialized = await initializeFirebase();
    if (!initialized) {
        console.error('Failed to initialize Firebase');
        return;
    }
    
    // Set the global db variable
    db = firebase.database();

// Check authentication
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Setup logout
document.getElementById('logout-btn').addEventListener('click', () => {
    firebase.auth().signOut();
});
    
    // First set up navigation so UI is responsive immediately
    setupNavigation();
    
    // Then initialize dashboard (which might take longer)
    initializeDashboard();
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

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
            { name: "Portfolio Editor", fn: setupPortfolioEditor }
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
    // Make sure we have global state
    window.currentSkills = window.currentSkills || { categories: {} };
    window.currentProjects = window.currentProjects || [];
    window.currentCategory = window.currentCategory || '';

    setupEditorTabs();
    loadPortfolioData();
    setupFormSubmissions();
    
    // Set up Add Category Button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const categoryName = prompt('Enter category name:');
            if (categoryName?.trim()) {
                if (!window.currentSkills.categories[categoryName]) {
                    window.currentSkills.categories[categoryName] = [];
                    renderSkillCategories();
                    selectCategory(categoryName);
                } else {
                    showErrorMessage('Category already exists');
                }
            }
        });
    }

    // Set up Add Skill Button
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => {
            if (!window.currentCategory) {
                showErrorMessage('Please select a category first');
                return;
            }
            
            const skillName = prompt('Enter skill name:');
            if (skillName?.trim()) {
                if (!window.currentSkills.categories[window.currentCategory].includes(skillName)) {
                    window.currentSkills.categories[window.currentCategory].push(skillName);
                    renderSkills(window.currentCategory);
                } else {
                    showErrorMessage('Skill already exists in this category');
                }
            }
        });
    }

    // Save Skills Button
    const saveSkillsBtn = document.getElementById('save-skills-btn');
    if (saveSkillsBtn) {
        saveSkillsBtn.addEventListener('click', () => {
            if (Object.keys(window.currentSkills.categories).length === 0) {
                showErrorMessage('Please add at least one category with skills');
                return;
            }
            
            db.ref('portfolioData/skills').set({categories: window.currentSkills.categories})
                .then(() => showSuccessMessage('Skills updated successfully'))
                .catch(error => showErrorMessage('Error updating skills: ' + error.message));
        });
    }
    
    // Add Project Button
    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            showProjectForm();
        });
    }
    
    setupDeployButton();
    
    console.log('Portfolio Editor setup complete');
}

// Function to show project form 
function showProjectForm(project = null) {
    // Check if form already exists
    let projectForm = document.getElementById('project-form');
    
    if (!projectForm) {
        // Create form if it doesn't exist
        const projectsEditor = document.getElementById('projects-editor');
        if (!projectsEditor) return;
        
        const formDiv = document.createElement('div');
        formDiv.className = 'project-form-container';
        formDiv.innerHTML = `
            <h4>${project ? 'Edit' : 'Add'} Project</h4>
            <form id="project-form" class="project-form">
                <input type="hidden" id="project-id">
                <div class="form-group">
                    <label>Project Name</label>
                    <input type="text" id="project-name" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="project-description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Image URL</label>
                    <input type="url" id="project-image">
                </div>
                <div class="form-group">
                    <label>Live Demo URL</label>
                    <input type="url" id="project-url">
                </div>
                <div class="form-group">
                    <label>GitHub URL</label>
                    <input type="url" id="project-github">
                </div>
                <div class="form-group">
                    <label>Technologies (comma-separated)</label>
                    <input type="text" id="project-tech">
                </div>
                <div class="form-actions">
                    <button type="submit" class="admin-btn">
                        <i class="fas fa-save"></i> Save Project
                    </button>
                    <button type="button" id="cancel-project-btn" class="secondary-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        `;
        
        projectsEditor.appendChild(formDiv);
        projectForm = document.getElementById('project-form');
        
        // Add event listeners
        document.getElementById('cancel-project-btn').addEventListener('click', hideProjectForm);
        
        projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const projectData = validateAndGetProjectData();
            if (!projectData) return;
            
            const projectId = document.getElementById('project-id').value;
            
            if (projectId) {
                // Update existing project
                const index = window.currentProjects.findIndex(p => p.id === projectId);
                if (index !== -1) {
                    window.currentProjects[index] = { ...projectData, id: projectId };
                }
            } else {
                // Add new project
                const newId = 'project_' + Date.now();
                window.currentProjects.push({ ...projectData, id: newId });
            }
            
            saveProjects(window.currentProjects);
            hideProjectForm();
            renderProjects(window.currentProjects);
        });
    }
    
    // Fill form if editing existing project
    if (project) {
        document.getElementById('project-id').value = project.id || '';
        document.getElementById('project-name').value = project.name || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-image').value = project.image || '';
        document.getElementById('project-url').value = project.url || '';
        document.getElementById('project-github').value = project.github || '';
        document.getElementById('project-tech').value = project.technologies || '';
    } else {
        // Clear form for new project
        document.getElementById('project-id').value = '';
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';
        document.getElementById('project-image').value = '';
        document.getElementById('project-url').value = '';
        document.getElementById('project-github').value = '';
        document.getElementById('project-tech').value = '';
    }
    
    // Show form
    document.querySelector('.project-form-container').style.display = 'block';
    document.getElementById('projects-list').style.display = 'none';
    document.getElementById('add-project-btn').style.display = 'none';
}

// Function to hide project form
function hideProjectForm() {
    const formContainer = document.querySelector('.project-form-container');
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    
    document.getElementById('projects-list').style.display = 'block';
    document.getElementById('add-project-btn').style.display = 'inline-block';
}

// Function to validate and get project data
function validateAndGetProjectData() {
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    
    if (!name) {
        showErrorMessage('Please enter a project name');
        return null;
    }
    
    if (!description) {
        showErrorMessage('Please enter a project description');
        return null;
    }
    
    return {
        name,
        description,
        image: document.getElementById('project-image').value.trim(),
        url: document.getElementById('project-url').value.trim(),
        github: document.getElementById('project-github').value.trim(),
        technologies: document.getElementById('project-tech').value.trim()
    };
}

// Function to render projects
function renderProjects(projects) {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;
    
    projectsList.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<p>No projects added yet. Click "Add New Project" to get started.</p>';
        return;
    }
    
    projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.innerHTML = `
            <div class="project-header">
                <h3>${escapeHtml(project.name || '')}</h3>
                <div class="project-actions">
                    <button class="icon-btn edit-project" data-id="${project.id}">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="icon-btn delete-project" data-id="${project.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p>${escapeHtml(project.description || '')}</p>
            <div class="project-meta">
                ${project.technologies ? `<div class="project-tech-tags">${project.technologies.split(',').map(tech => `<span>${escapeHtml(tech.trim())}</span>`).join('')}</div>` : ''}
                <div class="project-links">
                    ${project.url ? `<a href="${project.url}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
                    ${project.github ? `<a href="${project.github}" target="_blank" class="project-link"><i class="fab fa-github"></i> GitHub</a>` : ''}
                </div>
            </div>
        `;
        
        // Add edit handler
        projectDiv.querySelector('.edit-project').addEventListener('click', () => {
            showProjectForm(project);
        });
        
        // Add delete handler
        projectDiv.querySelector('.delete-project').addEventListener('click', () => {
            if (confirm(`Delete project "${project.name}"?`)) {
                window.currentProjects = window.currentProjects.filter(p => p.id !== project.id);
                saveProjects(window.currentProjects);
                renderProjects(window.currentProjects);
            }
        });
        
        projectsList.appendChild(projectDiv);
    });
}

// Function to save projects
function saveProjects(projects) {
    db.ref('portfolioData/projects').set(projects)
        .then(() => showSuccessMessage('Projects updated successfully'))
        .catch(error => showErrorMessage('Error updating projects: ' + error.message));
}

// Helper function to safely escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Setup form submissions with validation and error handling
function setupFormSubmissions() {
    // Hero Form
    const heroForm = document.getElementById('hero-form');
    if (heroForm) {
        heroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const heroData = {
                name: document.getElementById('hero-name')?.value?.trim() || '',
                tagline: document.getElementById('hero-tagline')?.value?.trim() || '',
                bio: document.getElementById('hero-bio')?.value?.trim() || '',
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };
            
            if (!heroData.name) {
                showErrorMessage('Please enter your name');
                return;
            }
            
            db.ref('portfolioData/hero').set(heroData)
                .then(() => showSuccessMessage('Hero section updated successfully'))
                .catch(error => showErrorMessage('Error updating hero section: ' + error.message));
        });
    }
    
    // About Form
    const aboutForm = document.getElementById('about-form');
    if (aboutForm) {
        aboutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const aboutData = {
                content: document.getElementById('about-content')?.value?.trim() || '',
                resumeLink: document.getElementById('resume-link')?.value?.trim() || '',
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };
            
            if (!aboutData.content) {
                showErrorMessage('Please enter about content');
                return;
            }
            
            db.ref('portfolioData/about').set(aboutData)
                .then(() => showSuccessMessage('About section updated successfully'))
                .catch(error => showErrorMessage('Error updating about section: ' + error.message));
        });
    }
    
    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('contact-email')?.value?.trim() || '';
            if (!email || !isValidEmail(email)) {
                showErrorMessage('Please enter a valid email address');
                return;
            }
            
            const contactData = {
                email: email,
                linkedin: document.getElementById('contact-linkedin')?.value?.trim() || '',
                github: document.getElementById('contact-github')?.value?.trim() || '',
                twitter: document.getElementById('contact-twitter')?.value?.trim() || '',
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };
            
            db.ref('portfolioData/contact').set(contactData)
                .then(() => showSuccessMessage('Contact information updated successfully'))
                .catch(error => showErrorMessage('Error updating contact information: ' + error.message));
        });
    }
}

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Setup deployment functionality
function setupDeployButton() {
    const deployBtn = document.getElementById('deploy-portfolio');
    if (deployBtn) {
        deployBtn.addEventListener('click', async () => {
            try {
                showMessage('Deploying changes...', 'info');
                
                // Get all portfolio data from Firebase
                const snapshot = await db.ref('portfolioData').once('value');
                const portfolioData = snapshot.val() || {};
                
                // Generate the index.html content
                const htmlContent = generatePortfolioHTML(portfolioData);
                
                // Save to deployed_content instead of using / or . in the path
                await db.ref('deployed_content/html').set(htmlContent);
                
                // Update deployment timestamp
                await db.ref('deploymentInfo').set({
                    lastDeployed: firebase.database.ServerValue.TIMESTAMP,
                    status: 'success',
                    filename: 'index.html'
                });
                
                showMessage('Changes deployed successfully!', 'success');
    } catch (error) {
                console.error('Deployment error:', error);
                showMessage('Error deploying changes: ' + error.message, 'error');
            }
        });
    }
}

// Generate HTML for the portfolio
function generatePortfolioHTML(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.hero?.name || 'Portfolio'}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Hero Section -->
    <section id="hero" class="hero-section">
        <div class="container">
            <h1>${data.hero?.name || ''}</h1>
            <h2>${data.hero?.tagline || ''}</h2>
            <p>${data.hero?.bio || ''}</p>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about-section">
        <div class="container">
            <h2>About Me</h2>
            <div class="about-content">
                <p>${data.about?.content || ''}</p>
                ${data.about?.resumeLink ? `<a href="${data.about.resumeLink}" class="resume-btn" target="_blank">View Resume</a>` : ''}
            </div>
        </div>
    </section>

    <!-- Skills Section -->
    <section id="skills" class="skills-section">
        <div class="container">
            <h2>Skills</h2>
            <div class="skills-grid">
                ${generateSkillsHTML(data.skills)}
            </div>
        </div>
    </section>

    <!-- Projects Section -->
    <section id="projects" class="projects-section">
        <div class="container">
            <h2>Projects</h2>
            <div class="projects-grid">
                ${generateProjectsHTML(data.projects)}
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section">
        <div class="container">
            <h2>Contact</h2>
            <div class="contact-links">
                ${generateContactHTML(data.contact)}
            </div>
        </div>
    </section>
</body>
</html>`;
}

// Helper function to generate skills HTML
function generateSkillsHTML(skills = {}) {
    if (!skills.categories) return '';
    
    return Object.entries(skills.categories)
        .map(([category, skillsList]) => `
            <div class="skills-category">
                <h3>${category}</h3>
                <ul>
                    ${skillsList.map(skill => `<li>${skill}</li>`).join('')}
                </ul>
            </div>
        `).join('');
}

// Helper function to generate projects HTML
function generateProjectsHTML(projects = []) {
    if (!Array.isArray(projects)) return '';
    
    return projects.map(project => `
        <div class="project-card">
            ${project.image ? `<img src="${project.image}" alt="${project.name}">` : ''}
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="project-links">
                ${project.url ? `<a href="${project.url}" target="_blank">Live Demo</a>` : ''}
                ${project.github ? `<a href="${project.github}" target="_blank">GitHub</a>` : ''}
            </div>
            <div class="project-tech">
                ${project.technologies ? project.technologies.split(',').map(tech => `<span>${tech.trim()}</span>`).join('') : ''}
            </div>
        </div>
    `).join('');
}

// Helper function to generate contact HTML
function generateContactHTML(contact = {}) {
    const links = [];
    
    if (contact.email) {
        links.push(`<a href="mailto:${contact.email}" class="contact-link">
            <i class="fas fa-envelope"></i> Email
        </a>`);
    }
    
    if (contact.linkedin) {
        links.push(`<a href="${contact.linkedin}" class="contact-link" target="_blank">
            <i class="fab fa-linkedin"></i> LinkedIn
        </a>`);
    }
    
    if (contact.github) {
        links.push(`<a href="${contact.github}" class="contact-link" target="_blank">
            <i class="fab fa-github"></i> GitHub
        </a>`);
    }
    
    if (contact.twitter) {
        links.push(`<a href="${contact.twitter}" class="contact-link" target="_blank">
            <i class="fab fa-twitter"></i> Twitter
        </a>`);
    }
    
    return links.join('');
}

// Setup portfolio editor initialization
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