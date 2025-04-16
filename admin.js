// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB1ZIQp5j_hBXJM2uC4_tJg96ZKLj5_JB8",
    authDomain: "portfolio-cac4b.firebaseapp.com",
    databaseURL: "https://portfolio-cac4b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "portfolio-cac4b",
    storageBucket: "portfolio-cac4b.firebasestorage.app",
    messagingSenderId: "560361647150",
    appId: "1:560361647150:web:10af52ec57c5a7e53a03bf",
    measurementId: "G-8XWC6F64FC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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

// Initialize all charts and data listeners
async function initializeDashboard() {
    try {
        await Promise.all([
            setupBasicStats(),
            setupVisitsChart(),
            setupDeviceChart(),
            setupSectionChart(),
            setupScrollChart(),
            setupPerformanceMetrics(),
            setupActivityLog(),
            setupErrorLog(),
            setupActivityFilters(),
            setupEmailStats(),
            setupCompanyStats(),
            setupHRStats()
        ]);
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
    const ctx = document.getElementById('visitsChart').getContext('2d');
    if (!ctx) return;

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
    const ctx = document.getElementById('deviceChart').getContext('2d');
    if (!ctx) return;

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
    const ctx = document.getElementById('sectionChart').getContext('2d');
    if (!ctx) return;

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
    const ctx = document.getElementById('scrollChart').getContext('2d');
    if (!ctx) return;

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

    // Listen for recent company interactions
    db.ref('analytics/companyClicks').orderByChild('timestamp')
    .limitToLast(10).on('value', snapshot => {
        const interactionList = document.getElementById('recent-company-interactions');
        if (!interactionList) return;

        interactionList.innerHTML = '';
        const interactions = [];

        snapshot.forEach(child => {
            interactions.unshift(child.val());
        });

        interactions.forEach(data => {
            const item = document.createElement('div');
            item.className = 'company-interaction';
            item.innerHTML = `
                <div class="interaction-details">
                    <strong>${escapeHtml(data.company)}</strong>
                    <span class="time">${formatTimeAgo(data.timestamp)}</span>
                </div>
                <div class="device-info">
                    ${data.deviceType} • ${data.referrer === 'direct' ? 'Direct' : 'Referral'}
                </div>
            `;
            interactionList.appendChild(item);
        });
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

        // Reset stats display
        document.getElementById('total-hr-visitors').textContent = '0';
        document.getElementById('most-common-role').textContent = '-';
        document.getElementById('most-active-company').textContent = '-';
        document.getElementById('most-common-source').textContent = '-';
        
        // Listen for HR visitors directly
        db.ref('analytics/hrVisitors').on('value', async snapshot => {
            try {
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

                // Update display elements
                document.getElementById('total-hr-visitors').textContent = stats.totalVisitors;

                const mostCommonRole = Object.entries(stats.roles)
                    .sort((a, b) => b[1] - a[1])[0];
                document.getElementById('most-common-role').textContent = 
                    mostCommonRole ? formatRole(mostCommonRole[0]) : '-';

                const mostActiveCompany = stats.companies
                    .sort((a, b) => b.visits - a.visits)[0];
                document.getElementById('most-active-company').textContent = 
                    mostActiveCompany ? mostActiveCompany.name : '-';

                const mostCommonSource = Object.entries(stats.sources)
                    .sort((a, b) => b[1] - a[1])[0];
                document.getElementById('most-common-source').textContent = 
                    mostCommonSource ? formatSource(mostCommonSource[0]) : '-';

                // Update HR Visitors table
                const table = document.getElementById('hr-visitors-table');
                if (table) {
                    table.innerHTML = ''; // Clear before updating
                    updateHRVisitorsTable(visitors);
                }

                // Store the calculated stats
                await db.ref('analytics/hrStats').set(stats);

            } catch (error) {
                console.error('Error calculating HR stats:', error);
                document.getElementById('total-hr-visitors').textContent = '0';
                document.getElementById('most-common-role').textContent = '-';
                document.getElementById('most-active-company').textContent = '-';
                document.getElementById('most-common-source').textContent = '-';
            }
        });
    } catch (error) {
        console.error('Error setting up HR stats:', error);
    }
}

// Update HR Visitors table
function updateHRVisitorsTable(visitors) {
    const table = document.getElementById('hr-visitors-table');
    if (!table) {
        console.error('HR visitors table not found');
        return;
    }

    try {
        // Sort visitors by timestamp (most recent first)
        visitors.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Add visitor rows directly without creating a new table structure
        const rows = visitors.map(visitor => {
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
                    <td>${escapeHtml(formatCompanySize(visitor.companySize) || '-')}</td>
                    <td>${escapeHtml(formatRole(visitor.hiringFor) || '-')}</td>
                    <td>${escapeHtml(formatSource(visitor.source) || '-')}</td>
                    <td>${escapeHtml(formatContactPreference(visitor.contactPreference) || '-')}</td>
                    <td>${escapeHtml(visitor.deviceType || '-')}</td>
                    <td>${timestamp.toLocaleString()}</td>
                </tr>
            `;
        }).join('');

        table.innerHTML = rows;

        // Setup CSV download if there are visitors
        if (visitors.length > 0) {
            setupCSVDownload(visitors);
        }

    } catch (error) {
        console.error('Error updating HR visitors table:', error);
        table.innerHTML = '<tr><td colspan="11">Error loading HR visitor data</td></tr>';
    }
}

// Format display values
function formatRole(role) {
    if (!role) return '-';
    return role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatCompanySize(size) {
    const sizes = {
        'startup': '1-50',
        'small': '51-200',
        'medium': '201-1000',
        'large': '1001-5000',
        'enterprise': '5000+'
    };
    return sizes[size] || size || '-';
}

function formatSource(source) {
    if (!source) return '-';
    return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatContactPreference(pref) {
    if (!pref) return '-';
    return pref.charAt(0).toUpperCase() + pref.slice(1);
}

// Get most common item from object of counts
function getMostCommon(obj) {
    if (!obj) return null;
    return Object.entries(obj).reduce((a, b) => 
        (obj[a] > obj[b] ? a : b), null);
}

// Get most active company
function getMostActiveCompany(companies) {
    if (!companies) return null;
    return Object.entries(companies).reduce((a, b) => 
        (companies[a].visits > companies[b].visits ? a : b), null);
}

// Calculate engagement score
function calculateEngagementScore(company) {
    let score = 0;
    // Base points
    score += (company.visits || 0) * 2;           // 2 points per visit
    score += (company.resumeDownloads || 0) * 5;  // 5 points per resume download
    
    // Recency bonus (within last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (company.lastVisit > weekAgo) {
        score += 10;
    }
    
    // Position diversity bonus
    const uniquePositions = company.positions ? Object.keys(company.positions).length : 0;
    score += uniquePositions * 3;
    
    return score;
}

// Get engagement level based on score
function getEngagementLevel(score) {
    if (score >= 30) return 'high';
    if (score >= 15) return 'medium';
    return 'low';
}

// Update company engagement table with enhanced analytics
function updateCompanyEngagementTable(companies) {
    const table = document.getElementById('company-engagement-table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = companies.map(company => `
        <tr>
            <td>${escapeHtml(company.name)}</td>
            <td>${company.visits}</td>
            <td>${escapeHtml(formatCompanySize(company.size))}</td>
            <td>${company.resumeDownloads}</td>
            <td>${formatTimeAgo(company.lastVisit)}</td>
            <td>${company.score}</td>
        </tr>
    `).join('');
}

// Setup CSV download
function setupCSVDownload(visitors) {
    const downloadBtn = document.getElementById('download-hr-csv');
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
        const csvContent = generateHRVisitorsCSV(visitors);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `hr-visitors-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function generateHRVisitorsCSV(visitors) {
    const headers = [
        'Name',
        'Company',
        'Email',
        'Country Code',
        'Phone Number',
        'Role',
        'Company Size',
        'Hiring For',
        'Source',
        'Contact Preference',
        'Device Type',
        'Timestamp'
    ];

    const rows = visitors.map(visitor => [
        visitor.name,
        visitor.company,
        visitor.email,
        visitor.countryCode,
        visitor.phoneNumber,
        visitor.role,
        visitor.companySize,
        visitor.hiringFor,
        visitor.source,
        visitor.contactPreference,
        visitor.deviceType,
        new Date(visitor.timestamp).toLocaleString()
    ]);

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

// Helper function to calculate total actions for a company
function calculateCompanyActions(companyName) {
    let totalActions = 0;
    
    // Count resume downloads
    db.ref('analytics/resumeClicks').orderByChild('company')
    .equalTo(companyName).once('value', snapshot => {
        snapshot.forEach(() => totalActions++);
    });

    // Count email views
    db.ref('analytics/emailClicks').orderByChild('company')
    .equalTo(companyName).once('value', snapshot => {
        snapshot.forEach(() => totalActions++);
    });

    return totalActions;
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section-container');
    const sidePanel = document.querySelector('.side-panel');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.getElementById('toggle-sidebar');

    // Setup side panel toggle
    toggleBtn.addEventListener('click', () => {
        sidePanel.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        // Store the preference
        localStorage.setItem('sidebarCollapsed', sidePanel.classList.contains('collapsed'));
    });

    // Restore sidebar state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidePanel.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }

    // Hide all sections except overview
    sections.forEach(section => {
        if (section.id !== 'overview') {
            section.style.display = 'none';
        }
    });

    // Add click handlers to nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
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
                
                // Refresh charts if showing charts section
                if (sectionId === 'charts') {
                    if (window.visitsChart) visitsChart.update();
                    if (window.deviceChart) deviceChart.update();
                    if (window.sectionChart) sectionChart.update();
                    if (window.scrollChart) scrollChart.update();
                }
            }
        });
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDashboard();
        setupNavigation();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}); 