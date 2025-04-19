// Enhanced Portfolio Editor for direct index.html editing
// This script provides a more functional editor for the main portfolio

// Initialize the editor when document is loaded
document.addEventListener('DOMContentLoaded', initializePortfolioEditor);

// Global variables for storing content
let pageContent = {
    hero: {
        name: '',
        title: '',
        tagline: '',
        email: ''
    },
    about: {
        content: [],
        stats: []
    },
    background: {
        content: [],
        resumeLink: ''
    },
    skills: {
        categories: {}
    },
    experience: {
        items: []
    },
    projects: [],
    social: []
};

// Initialize the editor
function initializePortfolioEditor() {
    console.log('Initializing Enhanced Portfolio Editor...');
    
    // Add editor section to the dashboard when the Portfolio tab is clicked
    const navItem = document.querySelector('.nav-item[data-section="portfolio-editor"]');
    if (navItem) {
        navItem.addEventListener('click', setupEditorContent);
    }
    
    // Also check if we're already on the portfolio editor page
    if (window.location.hash === '#portfolio-editor') {
        setupEditorContent();
    }
}

// Setup editor content and initialize the UI
function setupEditorContent() {
    // Get the content container
    const contentContainer = document.getElementById('portfolio-editor');
    if (!contentContainer) return;
    
    // Load the current content from Firebase or directly scrape the index.html
    loadCurrentContent()
        .then(() => {
            renderEditorInterface(contentContainer);
            setupEventListeners();
            addIndexHtmlUploadOption(); // Initialize the HTML upload option
        })
        .catch(error => {
            showErrorMessage('Failed to load portfolio content: ' + error.message);
        });
}

// Load the current content from Firebase or directly from the index.html file
async function loadCurrentContent() {
    try {
        // Try to load from Firebase
        const db = firebase.database();
        const snapshot = await db.ref('portfolioContent').once('value');
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            pageContent = data;
            console.log('Content loaded from Firebase');
            return;
        }
        
        // If no Firebase data, check if we have the index content in Firebase
        const indexHtmlSnapshot = await db.ref('indexHtml').once('value');
        if (indexHtmlSnapshot.exists() && indexHtmlSnapshot.val()) {
            await parseIndexHtml(indexHtmlSnapshot.val());
            console.log('Content parsed from stored index.html');
            return;
        }
        
        // If we're here, we have no data - use default values
        console.log('No existing content found. Using default values.');
        showMessage('Using default template. Add your content to customize.', 'info');
    } catch (error) {
        console.error('Error loading content:', error);
        showErrorMessage('Error loading content: ' + error.message);
        throw error;
    }
}

// Parse the index.html content from a string
function parseIndexHtml(html) {
    try {
        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract content from the DOM
        extractHeroSection(doc);
        extractAboutSection(doc);
        extractBackgroundSection(doc);
        extractSkillsSection(doc);
        extractExperienceSection(doc);
        extractProjectsSection(doc);
        extractSocialLinks(doc);
        
        return true;
    } catch (error) {
        console.error('Error parsing index.html:', error);
        throw new Error('Failed to parse index.html content');
    }
}

// Extract hero section content
function extractHeroSection(doc) {
    const heroSection = doc.querySelector('#hero');
    if (!heroSection) return;
    
    // Extract name
    const nameElement = heroSection.querySelector('h2');
    if (nameElement) {
        const nameMatch = nameElement.innerHTML.match(/I'm\s+<span class="highlight">(.*?)<\/span>/);
        if (nameMatch && nameMatch[1]) {
            pageContent.hero.name = nameMatch[1];
        }
        
        // Extract title
        const titleMatch = nameElement.innerHTML.match(/<\/span>,\s+(.*?)(?=<|$)/);
        if (titleMatch && titleMatch[1]) {
            pageContent.hero.title = titleMatch[1];
        }
    }
    
    // Extract tagline
    const taglineElement = heroSection.querySelector('.tagline');
    if (taglineElement) {
        pageContent.hero.tagline = taglineElement.textContent.replace(/\s+🤓$/, '').trim();
    }
    
    // Extract email
    const emailElement = heroSection.querySelector('.email-link');
    if (emailElement) {
        pageContent.hero.email = emailElement.textContent.trim();
    }
}

// Extract about section content
function extractAboutSection(doc) {
    const aboutSection = doc.querySelector('#about');
    if (!aboutSection) return;
    
    // Extract paragraphs
    const paragraphs = aboutSection.querySelectorAll('.about-text p');
    paragraphs.forEach(p => {
        if (!p.querySelector('ul')) { // Skip paragraphs that contain lists
            pageContent.about.content.push(p.innerHTML);
        }
    });
    
    // Extract list items
    const listItems = aboutSection.querySelectorAll('.about-list li');
    pageContent.about.listItems = Array.from(listItems).map(li => li.textContent);
    
    // Extract stats
    const statItems = aboutSection.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        const number = item.querySelector('.stat-number')?.textContent;
        const label = item.querySelector('.stat-label')?.textContent;
        if (number && label) {
            pageContent.about.stats.push({ number, label });
        }
    });
}

// Extract background section content
function extractBackgroundSection(doc) {
    const backgroundSection = doc.querySelector('#background');
    if (!backgroundSection) return;
    
    // Extract paragraphs
    const paragraphs = backgroundSection.querySelectorAll('.background-content p');
    paragraphs.forEach(p => {
        pageContent.background.content.push(p.innerHTML);
    });
    
    // Extract resume link
    const resumeLink = backgroundSection.querySelector('.resume-link');
    if (resumeLink) {
        pageContent.background.resumeLink = resumeLink.getAttribute('href') || '';
    }
}

// Extract skills section content
function extractSkillsSection(doc) {
    const skillsSection = doc.querySelector('#skills');
    if (!skillsSection) return;
    
    const skillColumns = skillsSection.querySelectorAll('.skill-column');
    skillColumns.forEach(column => {
        const title = column.querySelector('.column-title')?.textContent;
        if (!title || title.includes('SKILLS')) return; // Skip the title column
        
        const skills = Array.from(column.querySelectorAll('li')).map(li => li.textContent);
        pageContent.skills.categories[title] = skills;
    });
}

// Extract experience section content
function extractExperienceSection(doc) {
    const experienceSection = doc.querySelector('#experience');
    if (!experienceSection) return;
    
    const experienceItems = experienceSection.querySelectorAll('.experience-item');
    experienceItems.forEach(item => {
        const company = item.querySelector('.company')?.textContent || '';
        const role = item.querySelector('.role')?.textContent || '';
        const date = item.querySelector('.date')?.textContent || '';
        
        pageContent.experience.items.push({ company, role, date });
    });
}

// Extract projects section content
function extractProjectsSection(doc) {
    const projectsSection = doc.querySelector('#projects');
    if (!projectsSection) return;
    
    const projectItems = projectsSection.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        const titleElement = item.querySelector('.project-title');
        const title = titleElement?.textContent.replace(/\s+→$/, '') || '';
        const link = titleElement?.getAttribute('href') || '#';
        const description = item.querySelector('.project-description')?.textContent || '';
        
        const tags = Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent);
        
        pageContent.projects.push({ title, link, description, tags });
    });
}

// Extract social links
function extractSocialLinks(doc) {
    const socialLinks = doc.querySelectorAll('.social-links .social-link');
    socialLinks.forEach(link => {
        const platform = link.textContent.trim();
        const url = link.getAttribute('href') || '#';
        
        pageContent.social.push({ platform, url });
    });
}

// Render the editor interface
function renderEditorInterface(container) {
    container.innerHTML = `
        <h1>Enhanced Portfolio Editor</h1>
        <div class="editor-description">
            <p>Edit your portfolio content directly and save changes to the index.html file.</p>
        </div>
        
        <div class="editor-tabs">
            <button class="editor-tab active" data-tab="hero">Hero Section</button>
            <button class="editor-tab" data-tab="about">About Me</button>
            <button class="editor-tab" data-tab="background">Background</button>
            <button class="editor-tab" data-tab="skills">Skills</button>
            <button class="editor-tab" data-tab="experience">Experience</button>
            <button class="editor-tab" data-tab="projects">Projects</button>
            <button class="editor-tab" data-tab="social">Social Links</button>
            <button class="editor-tab" data-tab="advanced">Advanced</button>
        </div>
        
        <div class="editor-content">
            <!-- Hero Section Editor -->
            <div class="editor-tab-content active" id="hero-editor">
                <h3>Edit Hero Section</h3>
                <form id="hero-form" class="section-form">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" id="hero-name" value="${pageContent.hero.name}" placeholder="Your name">
                    </div>
                    <div class="form-group">
                        <label>Your Title</label>
                        <input type="text" id="hero-title" value="${pageContent.hero.title}" placeholder="e.g. Full Stack Developer">
                    </div>
                    <div class="form-group">
                        <label>Tagline</label>
                        <input type="text" id="hero-tagline" value="${pageContent.hero.tagline}" placeholder="A brief tagline about yourself">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="hero-email" value="${pageContent.hero.email}" placeholder="your@email.com">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="admin-btn">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button type="button" class="preview-btn secondary-btn">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Other tab contents will be dynamically generated -->
        </div>
        
        <!-- Global Portfolio Actions -->
        <div class="portfolio-actions">
            <button type="button" id="update-portfolio" class="deploy-btn">
                <i class="fas fa-rocket"></i> Update Portfolio
            </button>
            <button type="button" id="backup-portfolio" class="secondary-btn">
                <i class="fas fa-download"></i> Backup Current Version
            </button>
        </div>
        
        <!-- Preview Container -->
        <div id="preview-container" class="preview-container hidden">
            <div class="preview-header">
                <h4>Preview</h4>
                <div class="preview-actions">
                    <button id="toggle-preview-mode" class="icon-btn" title="Toggle desktop/mobile view">
                        <i class="fas fa-mobile-alt"></i>
                    </button>
                    <button id="close-preview" class="icon-btn" title="Close preview">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <iframe id="preview-iframe" class="preview-iframe"></iframe>
        </div>
    `;
    
    // Now populate the remaining tabs dynamically
    renderAboutTab();
    renderBackgroundTab();
    renderSkillsTab();
    renderExperienceTab();
    renderProjectsTab();
    renderSocialTab();
    renderAdvancedTab();
}

// Render the About tab content
function renderAboutTab() {
    const aboutEditor = document.getElementById('about-editor');
    if (!aboutEditor) {
        const tabContent = document.createElement('div');
        tabContent.className = 'editor-tab-content';
        tabContent.id = 'about-editor';
        document.querySelector('.editor-content').appendChild(tabContent);
        
        // Now render the about editor content
        // This will be implemented with the full tab content
    }
}

// Setup event listeners for all interactive elements
function setupEventListeners() {
    // Tab switching
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.editor-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
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
    
    // Form submissions
    const heroForm = document.getElementById('hero-form');
    if (heroForm) {
        heroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveHeroSection();
        });
    }
    
    // Preview buttons
    const previewBtns = document.querySelectorAll('.preview-btn');
    previewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            previewChanges();
        });
    });
    
    // Close preview
    document.getElementById('close-preview')?.addEventListener('click', () => {
        document.getElementById('preview-container').classList.add('hidden');
    });
    
    // Toggle preview mode
    document.getElementById('toggle-preview-mode')?.addEventListener('click', togglePreviewMode);
    
    // Update portfolio button
    document.getElementById('update-portfolio')?.addEventListener('click', updatePortfolio);
    
    // Backup portfolio button
    document.getElementById('backup-portfolio')?.addEventListener('click', backupPortfolio);
}

// Save hero section changes
function saveHeroSection() {
    pageContent.hero.name = document.getElementById('hero-name').value.trim();
    pageContent.hero.title = document.getElementById('hero-title').value.trim();
    pageContent.hero.tagline = document.getElementById('hero-tagline').value.trim();
    pageContent.hero.email = document.getElementById('hero-email').value.trim();
    
    // Save to Firebase
    saveToFirebase()
        .then(() => {
            showSuccessMessage('Hero section updated successfully');
        })
        .catch(error => {
            showErrorMessage('Error updating hero section: ' + error.message);
        });
}

// Save all content to Firebase
async function saveToFirebase() {
    try {
        const db = firebase.database();
        await db.ref('portfolioContent').set(pageContent);
        return true;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        throw error;
    }
}

// Preview changes
function previewChanges() {
    try {
        // Generate HTML preview
        const previewHtml = generatePreviewHtml();
        
        // Show preview container
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.classList.remove('hidden');
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Set iframe content
        const iframe = document.getElementById('preview-iframe');
        if (iframe) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(previewHtml);
            iframeDoc.close();
        }
        
        showSuccessMessage('Preview generated successfully');
    } catch (error) {
        console.error('Preview error:', error);
        showErrorMessage('Error generating preview: ' + error.message);
    }
}

// Toggle preview between desktop and mobile
function togglePreviewMode() {
    const iframe = document.getElementById('preview-iframe');
    if (!iframe) return;
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const body = iframeDoc.body;
    
    if (body.classList.contains('mobile-preview')) {
        body.classList.remove('mobile-preview');
        document.getElementById('toggle-preview-mode').innerHTML = '<i class="fas fa-mobile-alt"></i>';
    } else {
        body.classList.add('mobile-preview');
        document.getElementById('toggle-preview-mode').innerHTML = '<i class="fas fa-desktop"></i>';
    }
}

// Generate preview HTML
function generatePreviewHtml() {
    // This will generate a complete HTML preview based on the current state
    // A more comprehensive implementation would be needed for the full portfolio
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Preview</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        /* Mobile preview styles */
        body.mobile-preview {
            max-width: 375px;
            margin: 0 auto;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <header>
        <h1>Preview Mode</h1>
        <p>This is a preview of your portfolio with the current changes.</p>
    </header>
    
    <main>
        <section id="hero" class="hero-section">
            <div class="container">
                <h1>Hi! <span class="wave">👋</span></h1>
                <h2>I'm <span class="highlight">${pageContent.hero.name}</span>, ${pageContent.hero.title}</h2>
                <p class="tagline">${pageContent.hero.tagline} <span class="emoji">🤓</span></p>
                <div class="contact">
                    <p>Get in touch <span class="point">👉</span> <a href="mailto:${pageContent.hero.email}" class="email-link">${pageContent.hero.email}</a></p>
                </div>
            </div>
        </section>
        
        <!-- Other sections would be added here in a full implementation -->
    </main>
</body>
</html>`;
}

// Update the actual portfolio
async function updatePortfolio() {
    try {
        showMessage('Updating portfolio...', 'info');
        
        // Get all portfolio data from Firebase
        const db = firebase.database();
        const snapshot = await db.ref('portfolioContent').once('value');
        const portfolioData = snapshot.val() || pageContent;
        
        // Generate the index.html content
        const htmlContent = generateIndexHtml(portfolioData);
        
        // Save to index_updated.html for admin to review
        await db.ref('deployedFiles/index_html').set(htmlContent);
        
        // Update deployment timestamp
        await db.ref('deploymentInfo').set({
            lastDeployed: firebase.database.ServerValue.TIMESTAMP,
            status: 'success',
            filename: 'index.html'
        });
        
        showSuccessMessage('Portfolio updated successfully! The changes will be applied once reviewed.');
    } catch (error) {
        console.error('Update error:', error);
        showErrorMessage('Error updating portfolio: ' + error.message);
    }
}

// Backup the current portfolio
function backupPortfolio() {
    try {
        // Create a timestamp for the backup
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
        
        // Fetch the current index.html
        fetch('index.html')
            .then(response => response.text())
            .then(html => {
                // Create a blob and download link
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `index_backup_${timestamp}.html`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                showSuccessMessage('Backup created successfully');
            })
            .catch(error => {
                throw error;
            });
    } catch (error) {
        console.error('Backup error:', error);
        showErrorMessage('Error creating backup: ' + error.message);
    }
}

// Helper functions for messages
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

// Generate complete index.html with all current content
function generateIndexHtml(data) {
    // This is a simplified version - a full implementation would need to handle all sections
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Portfolio</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-content">
            <div class="nav-links">
                <a href="#about">About</a>
                <a href="#skills">Skills</a>
                <a href="#experience">Experience</a>
                <a href="#projects">Projects</a>
                <div class="theme-switch">
                    <span class="sun"><i class="fas fa-sun"></i></span>
                    <label class="switch">
                        <input type="checkbox" id="theme-toggle">
                        <span class="slider"></span>
                    </label>
                    <span class="moon"><i class="fas fa-moon"></i></span>
                </div>
            </div>
        </div>
    </nav>

    <main>
        <!-- Hero Section -->
        <section id="hero" class="hero-section">
            <div class="container">
                <h1>Hi! <span class="wave">👋</span></h1>
                <h2>I'm <span class="highlight">${data.hero.name}</span>, ${data.hero.title}</h2>
                <p class="tagline">${data.hero.tagline} <span class="emoji">🤓</span></p>
                <div class="contact">
                    <p>Get in touch <span class="point">👉</span> <a href="mailto:${data.hero.email}" class="email-link">${data.hero.email}</a></p>
                </div>
            </div>
        </section>

        <!-- More sections would be included here in a complete implementation -->
        
    </main>

    <footer>
        <div class="container">
            <div class="social-links">
                <!-- Social links would be dynamically generated here -->
            </div>
            <p class="amoled-note">This page looks the best in portrait mode, on an AMOLED device.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
}

// Add functionality to upload or paste index.html content
function addIndexHtmlUploadOption() {
    const advancedEditor = document.getElementById('advanced-editor');
    if (!advancedEditor) return;
    
    // Clear any existing content
    advancedEditor.innerHTML = '';
    
    // Create the HTML upload section
    const uploadSection = document.createElement('div');
    uploadSection.className = 'html-upload-section';
    
    // Add a title
    const title = document.createElement('h3');
    title.textContent = 'Upload or paste your index.html content';
    uploadSection.appendChild(title);
    
    // Add description
    const description = document.createElement('p');
    description.textContent = 'This will help solve CORS issues when developing locally. Your HTML content will be stored in Firebase for future use.';
    uploadSection.appendChild(description);
    
    // Add file upload option
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'html-file-upload';
    fileInput.accept = '.html';
    
    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = 'html-file-upload';
    fileLabel.className = 'file-upload-btn';
    fileLabel.textContent = 'Upload HTML File';
    
    uploadSection.appendChild(fileLabel);
    uploadSection.appendChild(fileInput);
    
    // Add textarea for pasting
    const textarea = document.createElement('textarea');
    textarea.id = 'html-content-paste';
    textarea.placeholder = 'Or paste your index.html content here...';
    textarea.rows = 10;
    uploadSection.appendChild(textarea);
    
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.className = 'save-html-btn';
    saveButton.textContent = 'Save HTML Content';
    uploadSection.appendChild(saveButton);
    
    // Add status message
    const statusMsg = document.createElement('div');
    statusMsg.id = 'html-upload-status';
    statusMsg.className = 'status-message';
    uploadSection.appendChild(statusMsg);
    
    // Add the upload section to the advanced editor
    advancedEditor.appendChild(uploadSection);
    
    // Setup event listeners for the upload and save functionality
    setupHtmlUploadListeners(fileInput, textarea, saveButton, statusMsg);
}

// Setup event listeners for HTML upload functionality
function setupHtmlUploadListeners(fileInput, textarea, saveButton, statusMsg) {
    // Handle file upload
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textarea.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // Handle save button click
    saveButton.addEventListener('click', () => {
        const htmlContent = textarea.value.trim();
        if (!htmlContent) {
            statusMsg.textContent = 'Please upload or paste HTML content first.';
            statusMsg.className = 'status-message error';
            return;
        }
        
        // Save the HTML content to Firebase
        saveHtmlContentToFirebase(htmlContent)
            .then(() => {
                statusMsg.textContent = 'HTML content saved successfully! Reload the page to use it.';
                statusMsg.className = 'status-message success';
            })
            .catch(error => {
                statusMsg.textContent = 'Error saving HTML content: ' + error.message;
                statusMsg.className = 'status-message error';
            });
    });
}

// Save HTML content to Firebase
function saveHtmlContentToFirebase(htmlContent) {
    return new Promise((resolve, reject) => {
        try {
            // Make sure Firebase is initialized
            if (!firebase || !firebase.database) {
                reject(new Error('Firebase is not initialized'));
                return;
            }
            
            // Save the content to the indexHtml node
            firebase.database().ref('portfolio/indexHtml').set(htmlContent)
                .then(() => {
                    console.log('HTML content saved to Firebase');
                    resolve();
                })
                .catch(error => {
                    console.error('Error saving HTML content:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('Error in saveHtmlContentToFirebase:', error);
            reject(error);
        }
    });
}

// Render the Advanced tab content
function renderAdvancedTab() {
    const advancedEditor = document.getElementById('advanced-editor');
    if (!advancedEditor) {
        const tabContent = document.createElement('div');
        tabContent.className = 'editor-tab-content';
        tabContent.id = 'advanced-editor';
        document.querySelector('.editor-content').appendChild(tabContent);
        
        // The content will be populated by addIndexHtmlUploadOption()
    }
} 