// dashboard.js - Handle dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.user_id) {
        window.location.href = '/login';
        return;
    }

    // Display user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userData.username;
    }

    // Show appropriate dashboard based on user type
    const producerDashboard = document.getElementById('producer-dashboard');
    const composterDashboard = document.getElementById('composter-dashboard');

    if (userData.user_type === 'producer' && producerDashboard && composterDashboard) {
        producerDashboard.style.display = 'block';
        composterDashboard.style.display = 'none';

        // Load producer-specific data
        loadProducerListings(userData.user_id);
        loadProducerMatches(userData.user_id);
    } else if (userData.user_type === 'composter' && producerDashboard && composterDashboard) {
        producerDashboard.style.display = 'none';
        composterDashboard.style.display = 'block';

        // Load composter-specific data
        loadAvailableListings();
        loadComposterMatches(userData.user_id);
    }

    // Load environmental impact data
    loadUserImpact(userData.user_id);

    // Add event listener for "Create New Listing" button
    const createListingBtn = document.getElementById('create-listing-btn');
    if (createListingBtn) {
        createListingBtn.addEventListener('click', function() {
            window.location.href = '/listing_form';
        });
    }
});

function loadProducerListings(userId) {
    fetch(`/api/listings?producer_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(listings => {
            const listingsContainer = document.getElementById('producer-listings');
            if (listingsContainer) {
                if (listings.length === 0) {
                    listingsContainer.innerHTML = '<p>You have no waste listings yet. Create one to get started!</p>';
                } else {
                    listingsContainer.innerHTML = listings.map(listing => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${listing.waste_type} - ${listing.quantity} ${listing.unit}</h5>
                                <p class="card-text">Available: ${formatDate(listing.availability_start)} to ${formatDate(listing.availability_end)}</p>
                                <p class="card-text">Status: ${listing.status || 'available'}</p>
                            </div>
                        </div>
                    `).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error loading producer listings:', error);
            const listingsContainer = document.getElementById('producer-listings');
            if (listingsContainer) {
                listingsContainer.innerHTML = '<p class="text-danger">Error loading listings. Please try again later.</p>';
            }
        });
}

function loadAvailableListings() {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/listings/available?date_from=${today}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(listings => {
            const listingsContainer = document.getElementById('available-listings');
            if (listingsContainer) {
                if (listings.length === 0) {
                    listingsContainer.innerHTML = '<p>There are no available waste listings at the moment. Check back later!</p>';
                } else {
                    listingsContainer.innerHTML = listings.map(listing => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${listing.waste_type} - ${listing.quantity} ${listing.unit}</h5>
                                <p class="card-text">Available: ${formatDate(listing.availability_start)} to ${formatDate(listing.availability_end)}</p>
                                <p class="card-text">Location: ${listing.city || 'Unknown'}, ${listing.state || 'Unknown'}</p>
                            </div>
                        </div>
                    `).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error loading available listings:', error);
            const listingsContainer = document.getElementById('available-listings');
            if (listingsContainer) {
                listingsContainer.innerHTML = '<p class="text-danger">Error loading available listings. Please try again later.</p>';
            }
        });
}

function loadProducerMatches(userId) {
    fetch(`/api/matches/${userId}?type=producer`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(matches => {
            const matchesContainer = document.getElementById('producer-matches');
            if (matchesContainer) {
                if (matches.length === 0) {
                    matchesContainer.innerHTML = '<p>You have no matches yet. Create a listing to get matched with composters!</p>';
                } else {
                    matchesContainer.innerHTML = matches.map(match => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">Match with ${match.composter_name}</h5>
                                <p class="card-text">Waste: ${match.waste_type || 'Unknown'} - ${match.quantity} ${match.unit}</p>
                                <p class="card-text">Status: ${match.status}</p>
                            </div>
                        </div>
                    `).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error loading producer matches:', error);
            const matchesContainer = document.getElementById('producer-matches');
            if (matchesContainer) {
                matchesContainer.innerHTML = '<p class="text-danger">Error loading matches. Please try again later.</p>';
            }
        });
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function requestMatch(listingId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.user_id) {
        alert('You must be logged in to request a match');
        return;
    }
    
    const matchData = {
        composter_id: userData.user_id,
        listing_id: listingId,
        status: 'pending'
    };
    
    fetch('/api/matches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Match requested successfully!');
        loadComposterMatches(userData.user_id);
    })
    .catch(error => {
        console.error('Error requesting match:', error);
        alert('Failed to request match. Please try again later.');
    });
}


// Add logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('userData');
            window.location.href = '/login';
        });
    }
});
