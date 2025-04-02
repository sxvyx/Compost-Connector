// app.js - Main JavaScript for Community Compost Connector

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();

    // Fetch and display impact statistics on the home page
    if (document.getElementById('waste-diverted')) {
        fetchImpactStats();
    }

    // Add event listeners
    addEventListeners();
});

function checkAuthStatus() {
    // Check local storage for user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData && userData.user_id) {
        // User is logged in, update UI accordingly
        document.querySelectorAll('.nav-item.login, .nav-item.register').forEach(el => {
            if (el.parentElement) el.parentElement.style.display = 'none';
        });
        document.querySelectorAll('.nav-item.dashboard, .nav-item.logout').forEach(el => {
            if (el.parentElement) el.parentElement.style.display = 'block';
        });
    } else {
        // User is not logged in, update UI accordingly
        document.querySelectorAll('.nav-item.login, .nav-item.register').forEach(el => {
            if (el.parentElement) el.parentElement.style.display = 'block';
        });
        document.querySelectorAll('.nav-item.dashboard, .nav-item.logout').forEach(el => {
            if (el.parentElement) el.parentElement.style.display = 'none';
        });
    }
}

function fetchImpactStats() {
    fetch('/api/impact/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('waste-diverted').textContent = Math.round(data.total_waste_diverted || 0);
            document.getElementById('co2-saved').textContent = Math.round(data.total_co2_saved || 0);
            document.getElementById('water-saved').textContent = Math.round(data.total_water_saved || 0);
            document.getElementById('matches').textContent = data.total_successful_matches || 0;
        })
        .catch(error => console.error('Error fetching impact stats:', error));
}

function addEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-link');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogout(event) {
    event.preventDefault();
    
    // Clear user data from local storage
    localStorage.removeItem('userData');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show error message
function showError(message, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}
