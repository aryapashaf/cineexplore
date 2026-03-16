/**
 * CineExplore - Movie Discovery Application
 * Uses TMDB API for movie data
 */

// ============================================
// Configuration
// ============================================
// Note: Replace with your own TMDB API key
// Get one free at: https://www.themoviedb.org/settings/api
const CONFIG = {
    API_KEY: 'demo_key', // Replace with your TMDB API key
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    IMAGE_SIZES: {
        backdrop: 'w1280',
        poster: 'w500',
        thumbnail: 'w342'
    }
};

// ============================================
// State Management
// ============================================
const state = {
    movies: [],
    currentMovie: null,
    isLoading: false,
    isSearching: false,
    searchQuery: '',
    searchTimeout: null
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Navigation
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    
    // Hero
    heroBackdrop: document.getElementById('hero-backdrop'),
    heroTitle: document.getElementById('hero-title'),
    heroRatingValue: document.getElementById('hero-rating-value'),
    heroDate: document.getElementById('hero-date'),
    heroOverview: document.getElementById('hero-overview'),
    heroBtn: document.getElementById('hero-btn'),
    
    // Movies Grid
    moviesGrid: document.getElementById('movies-grid'),
    sectionTitle: document.getElementById('section-title'),
    movieCount: document.getElementById('movie-count'),
    
    // Loading & Error
    loadingContainer: document.getElementById('loading-container'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    noResults: document.getElementById('no-results'),
    
    // Modal
    modalOverlay: document.getElementById('modal-overlay'),
    modalContainer: document.getElementById('modal-container'),
    modalClose: document.getElementById('modal-close'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalPosterImg: document.getElementById('modal-poster-img'),
    modalTitle: document.getElementById('modal-title'),
    modalRatingValue: document.getElementById('modal-rating-value'),
    modalDate: document.getElementById('modal-date'),
    modalRuntime: document.getElementById('modal-runtime'),
    modalGenres: document.getElementById('modal-genres'),
    modalOverviewText: document.getElementById('modal-overview-text'),
    modalImdbLink: document.getElementById('modal-imdb-link'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch popular movies from TMDB
 */
async function fetchPopularMovies() {
    const url = `${CONFIG.BASE_URL}/movie/popular?api_key=${CONFIG.API_KEY}&language=en-US&page=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results;
}

/**
 * Search movies by query
 */
async function searchMovies(query) {
    const url = `${CONFIG.BASE_URL}/search/movie?api_key=${CONFIG.API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results;
}

/**
 * Get movie details by ID
 */
async function getMovieDetails(movieId) {
    const url = `${CONFIG.BASE_URL}/movie/${movieId}?api_key=${CONFIG.API_KEY}&language=en-US`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

// ============================================
// Image Helpers
// ============================================

/**
 * Get full image URL
 */
function getImageUrl(path, size = 'original') {
    if (!path) return null;
    return `${CONFIG.IMAGE_BASE_URL}/${CONFIG.IMAGE_SIZES[size] || size}${path}`;
}

/**
 * Create poster image element with lazy loading
 */
function createPosterElement(path, alt, size = 'thumbnail') {
    const img = document.createElement('img');
    img.alt = alt;
    img.loading = 'lazy';
    
    if (path) {
        img.src = getImageUrl(path, size);
    } else {
        // Fallback placeholder
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513"><rect fill="%231E293B" width="342" height="513"/><text fill="%2364748B" font-family="sans-serif" font-size="24" x="50%" y="50%" text-anchor="middle">No Image</text></svg>';
    }
    
    return img;
}

// ============================================
// UI Render Functions
// ============================================

/**
 * Update hero section with featured movie
 */
function renderHero(movie) {
    const backdropUrl = getImageUrl(movie.backdrop_path, 'backdrop');
    
    if (backdropUrl) {
        elements.heroBackdrop.style.backgroundImage = `url(${backdropUrl})`;
    }
    
    elements.heroTitle.textContent = movie.title;
    elements.heroRatingValue.textContent = movie.vote_average.toFixed(1);
    elements.heroDate.textContent = movie.release_date ? formatDate(movie.release_date) : 'TBA';
    elements.heroOverview.textContent = movie.overview || 'No overview available.';
    
    // Store current movie for modal
    state.currentMovie = movie;
}

/**
 * Render movie cards grid
 */
function renderMoviesGrid(movies) {
    elements.moviesGrid.innerHTML = '';
    
    if (movies.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    
    movies.forEach((movie, index) => {
        const card = createMovieCard(movie);
        card.style.animationDelay = `${index * 0.05}s`;
        elements.moviesGrid.appendChild(card);
    });
    
    elements.movieCount.textContent = `${movies.length} movies`;
}

/**
 * Create a single movie card element
 */
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;
    
    // Poster image
    const posterImg = createPosterElement(movie.poster_path, movie.title, 'poster');
    card.appendChild(posterImg);
    
    // Rating badge
    const badge = document.createElement('div');
    badge.className = 'movie-card-badge';
    badge.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" width="12" height="12">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        ${movie.vote_average.toFixed(1)}
    `;
    card.appendChild(badge);
    
    // Hover overlay
    const overlay = document.createElement('div');
    overlay.className = 'movie-card-overlay';
    overlay.innerHTML = `
        <h3 class="movie-card-title">${movie.title}</h3>
        <div class="movie-card-rating">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${movie.vote_average.toFixed(1)}
        </div>
    `;
    card.appendChild(overlay);
    
    // Click handler
    card.addEventListener('click', () => openMovieModal(movie));
    
    return card;
}

/**
 * Render modal with movie details
 */
async function renderModal(movie) {
    // Show modal immediately with basic info
    elements.modalTitle.textContent = movie.title;
    elements.modalRatingValue.textContent = movie.vote_average.toFixed(1);
    elements.modalDate.textContent = movie.release_date ? formatDate(movie.release_date) : 'TBA';
    elements.modalOverviewText.textContent = movie.overview || 'No overview available.';
    
    // Backdrop
    const backdropUrl = getImageUrl(movie.backdrop_path, 'backdrop');
    if (backdropUrl) {
        elements.modalBackdrop.style.backgroundImage = `url(${backdropUrl})`;
    }
    
    // Poster
    const posterUrl = getImageUrl(movie.poster_path, 'poster');
    elements.modalPosterImg.src = posterUrl || '';
    elements.modalPosterImg.alt = movie.title;
    
    // Fetch additional details
    try {
        const details = await getMovieDetails(movie.id);
        
        // Runtime
        if (details.runtime) {
            elements.modalRuntime.textContent = `${details.runtime} min`;
        } else {
            elements.modalRuntime.textContent = '';
        }
        
        // Genres
        elements.modalGenres.innerHTML = '';
        if (details.genres && details.genres.length > 0) {
            details.genres.forEach(genre => {
                const tag = document.createElement('span');
                tag.className = 'modal-genre-tag';
                tag.textContent = genre.name;
                elements.modalGenres.appendChild(tag);
            });
        }
        
        // IMDB link
        if (details.imdb_id) {
            elements.modalImdbLink.href = `https://www.imdb.com/title/${details.imdb_id}/`;
            elements.modalImdbLink.style.display = 'inline-flex';
        } else {
            elements.modalImdbLink.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error fetching movie details:', error);
        elements.modalRuntime.textContent = '';
        elements.modalGenres.innerHTML = '';
    }
}

// ============================================
// UI State Functions
// ============================================

/**
 * Show loading state
 */
function showLoading() {
    state.isLoading = true;
    elements.loadingContainer.classList.add('active');
    elements.moviesGrid.style.display = 'none';
    elements.errorContainer.classList.remove('active');
    elements.noResults.classList.remove('active');
}

/**
 * Hide loading state
 */
function hideLoading() {
    state.isLoading = false;
    elements.loadingContainer.classList.remove('active');
    elements.moviesGrid.style.display = 'grid';
}

/**
 * Show error state
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorContainer.classList.add('active');
    elements.moviesGrid.style.display = 'none';
    elements.noResults.classList.remove('active');
    elements.loadingContainer.classList.remove('active');
}

/**
 * Hide error state
 */
function hideError() {
    elements.errorContainer.classList.remove('active');
}

/**
 * Show no results state
 */
function showNoResults() {
    elements.noResults.classList.add('active');
    elements.moviesGrid.style.display = 'none';
}

/**
 * Hide no results state
 */
function hideNoResults() {
    elements.noResults.classList.remove('active');
    elements.moviesGrid.style.display = 'grid';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast active ${type}`;
    
    setTimeout(() => {
        elements.toast.classList.remove('active');
    }, 3000);
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open movie modal
 */
async function openMovieModal(movie) {
    state.currentMovie = movie;
    elements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    await renderModal(movie);
}

/**
 * Close movie modal
 */
function closeModal() {
    elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentMovie = null;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle search input with debounce
 */
function handleSearch() {
    const query = elements.searchInput.value.trim();
    
    // Clear previous timeout
    if (state.searchTimeout) {
        clearTimeout(state.searchTimeout);
    }
    
    // Set new timeout for debounce
    state.searchTimeout = setTimeout(() => {
        if (query) {
            state.searchQuery = query;
            performSearch(query);
        } else {
            // Reset to popular movies
            state.searchQuery = '';
            loadPopularMovies();
        }
    }, 500);
}

/**
 * Perform search
 */
async function performSearch(query) {
    state.isSearching = true;
    showLoading();
    elements.sectionTitle.textContent = `Search Results`;
    
    try {
        const results = await searchMovies(query);
        state.movies = results;
        hideLoading();
        renderMoviesGrid(results);
        
        // Update hero with first result or show message
        if (results.length > 0) {
            renderHero(results[0]);
        } else {
            resetHero();
        }
        
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError('Failed to search movies. Please try again.');
    }
}

/**
 * Load popular movies
 */
async function loadPopularMovies() {
    state.isSearching = false;
    showLoading();
    hideError();
    elements.sectionTitle.textContent = 'Popular Movies';
    
    try {
        const movies = await fetchPopularMovies();
        state.movies = movies;
        hideLoading();
        
        if (movies.length > 0) {
            // First movie goes to hero
            renderHero(movies[0]);
            
            // Rest go to grid (skip first one)
            renderMoviesGrid(movies.slice(1));
        }
        
    } catch (error) {
        console.error('Error loading movies:', error);
        hideLoading();
        showError('Failed to load movies. Please check your API key or try again.');
    }
}

/**
 * Reset hero to default state
 */
function resetHero() {
    elements.heroBackdrop.style.backgroundImage = '';
    elements.heroTitle.textContent = 'Discover Amazing Movies';
    elements.heroRatingValue.textContent = '-';
    elements.heroDate.textContent = '';
    elements.heroOverview.textContent = 'Search for your favorite movies and explore their details.';
}

// ============================================
// Event Listeners
// ============================================

// Search input
elements.searchInput.addEventListener('input', handleSearch);
elements.searchBtn.addEventListener('click', () => {
    const query = elements.searchInput.value.trim();
    if (query && !state.isSearching) {
        // Immediate search on button click
        if (state.searchTimeout) {
            clearTimeout(state.searchTimeout);
        }
        state.searchQuery = query;
        performSearch(query);
    } else if (!query) {
        state.searchQuery = '';
        loadPopularMovies();
    }
});

// Search on Enter key
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = elements.searchInput.value.trim();
        if (query) {
            if (state.searchTimeout) {
                clearTimeout(state.searchTimeout);
            }
            state.searchQuery = query;
            performSearch(query);
        }
    }
});

// Modal close button
elements.modalClose.addEventListener('click', closeModal);

// Close modal on outside click
elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// Hero button click
elements.heroBtn.addEventListener('click', () => {
    if (state.currentMovie) {
        openMovieModal(state.currentMovie);
    }
});

// Retry button
elements.retryBtn.addEventListener('click', () => {
    if (state.searchQuery) {
        performSearch(state.searchQuery);
    } else {
        loadPopularMovies();
    }
});

// ============================================
// Initialize Application
// ============================================

/**
 * Initialize the application
 */
function init() {
    // Check if API key is set
    if (CONFIG.API_KEY === 'demo_key') {
        // Use demo mode with sample data
        loadDemoData();
    } else {
        // Load real data from API
        loadPopularMovies();
    }
}

/**
 * Load demo data for testing without API key
 */
function loadDemoData() {
    // Sample movie data for demo purposes
    const demoMovies = [
        {
            id: 1,
            title: "Dune: Part Two",
            vote_average: 8.6,
            release_date: "2024-02-28",
            overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 2,
            title: "The Batman",
            vote_average: 7.8,
            release_date: "2022-03-04",
            overview: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 3,
            title: "Inception",
            vote_average: 8.4,
            release_date: "2010-07-16",
            overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 4,
            title: "Interstellar",
            vote_average: 8.6,
            release_date: "2014-11-07",
            overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 5,
            title: "The Dark Knight",
            vote_average: 8.5,
            release_date: "2008-07-18",
            overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 6,
            title: "Oppenheimer",
            vote_average: 8.4,
            release_date: "2023-07-21",
            overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 7,
            title: "Barbie",
            vote_average: 6.9,
            release_date: "2023-07-21",
            overview: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 8,
            title: "Spider-Man: Across the Spider-Verse",
            vote_average: 8.3,
            release_date: "2023-06-02",
            overview: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 9,
            title: "Everything Everywhere All at Once",
            vote_average: 7.9,
            release_date: "2022-03-25",
            overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
            backdrop_path: null,
            poster_path: null
        },
        {
            id: 10,
            title: "Avatar: The Way of Water",
            vote_average: 7.6,
            release_date: "2022-12-16",
            overview: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. When a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect Pandora.",
            backdrop_path: null,
            poster_path: null
        }
    ];
    
    // Set demo data
    state.movies = demoMovies;
    
    // Render hero with first movie
    renderHero(demoMovies[0]);
    
    // Render grid with remaining movies
    renderMoviesGrid(demoMovies.slice(1));
    
    hideLoading();
    
    // Show info toast
    showToast('🎬 Demo mode - Add your TMDB API key in app.js for live data!', 'success');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
