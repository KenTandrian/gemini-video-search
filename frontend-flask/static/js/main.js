/**
 * Emtek Media Search - Enhanced UI Interactions
 * Clean white design with elegant animations
 */

// Global app state
const EmtekSearch = {
    isLoading: false,
    searchHistory: [],
    
    init() {
        this.setupGlobalListeners();
        this.setupKeyboardShortcuts();
        this.setupAnimations();
        this.loadSearchHistory();
    },
    
    setupGlobalListeners() {
        // Smooth scrolling for internal links
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
        
        // Enhanced form interactions
        this.setupFormEnhancements();
        
        // Setup intersection observer for animations
        this.setupIntersectionObserver();
    },
    
    setupFormEnhancements() {
        const searchForms = document.querySelectorAll('.search-form');
        
        searchForms.forEach(form => {
            const input = form.querySelector('.search-input');
            const button = form.querySelector('.search-button');
            
            if (input && button) {
                // Enhanced input interactions
                input.addEventListener('input', (e) => {
                    const value = e.target.value.trim();
                    button.style.opacity = value ? '1' : '0.7';
                });
                
                // Form submission with loading state
                form.addEventListener('submit', (e) => {
                    const query = input.value.trim();
                    if (query) {
                        this.handleSearch(form, query);
                        this.addToSearchHistory(query);
                    }
                });
                
                // Auto-complete suggestions (future enhancement)
                input.addEventListener('focus', () => {
                    this.showSearchSuggestions(input);
                });
            }
        });
    },
    
    handleSearch(form, query) {
        const button = form.querySelector('.search-button');
        const input = form.querySelector('.search-input');
        
        // Set loading state
        this.isLoading = true;
        form.classList.add('searching');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        // Add visual feedback
        form.style.transform = 'scale(0.98)';
        setTimeout(() => {
            if (form.style) form.style.transform = '';
        }, 200);
        
        // Store search query
        sessionStorage.setItem('lastSearch', query);
    },
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global search shortcut (Ctrl/Cmd + K)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                    
                    // Add focus animation
                    const inputGroup = searchInput.closest('.search-input-group');
                    if (inputGroup) {
                        inputGroup.style.transform = 'scale(1.02)';
                        setTimeout(() => {
                            if (inputGroup.style) inputGroup.style.transform = '';
                        }, 300);
                    }
                }
            }
            
            // Escape to clear/blur
            if (e.key === 'Escape') {
                const activeInput = document.activeElement;
                if (activeInput && activeInput.classList.contains('search-input')) {
                    if (activeInput.value) {
                        activeInput.value = '';
                        activeInput.dispatchEvent(new Event('input'));
                    } else {
                        activeInput.blur();
                    }
                }
            }
        });
    },
    
    setupAnimations() {
        // Subtle hover effects for clean design
        this.setupCleanHoverEffects();
    },
    
    setupCleanHoverEffects() {
        const cleanElements = document.querySelectorAll(
            '.result-item, .summary-section, .search-input-group, .btn-home'
        );
        
        cleanElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 12px 25px 0 rgba(0, 0, 0, 0.15)';
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
    },
    
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe result items for stagger animation
        document.querySelectorAll('.result-item').forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(item);
        });
    },
    
    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10 searches
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        }
    },
    
    loadSearchHistory() {
        const stored = localStorage.getItem('searchHistory');
        if (stored) {
            this.searchHistory = JSON.parse(stored);
        }
    },
    
    showSearchSuggestions(input) {
        // Future enhancement: show search suggestions
        // For now, just add a subtle highlight effect
        const inputGroup = input.closest('.search-input-group');
        if (inputGroup) {
            inputGroup.style.borderColor = '#2563eb';
        }
    }
};

// Video player utilities
const VideoPlayer = {
    createPreview(videoUrl, thumbnail) {
        // Future enhancement: create video preview on hover
        console.log('Video preview for:', videoUrl);
    },
    
    handleVideoClick(videoUrl) {
        // Track video clicks for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_click', {
                'video_url': videoUrl
            });
        }
    }
};

// Performance utilities
const Performance = {
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    },
    
    preloadCriticalResources() {
        // Preload search endpoint for faster results
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed, continue without it
            });
        }
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    EmtekSearch.init();
    Performance.lazyLoadImages();
    Performance.preloadCriticalResources();
    
    // Add custom loading indicator for clean design
    const style = document.createElement('style');
    style.textContent = `
        .search-form.searching .search-input-group {
            background: linear-gradient(90deg, 
                rgba(37, 99, 235, 0.1) 0%, 
                rgba(37, 99, 235, 0.2) 50%, 
                rgba(37, 99, 235, 0.1) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s linear infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;
    document.head.appendChild(style);
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is hidden
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when page is visible
        document.body.style.animationPlayState = 'running';
    }
});

// Export for global access
window.EmtekSearch = EmtekSearch;
window.VideoPlayer = VideoPlayer; 