// matches.js - Handle match interactions

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.user_id) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load matches based on user type
    loadMatches(userData.user_id, userData.user_type);
    
    // Set up confirmation modal
    setupConfirmationModal();
});

function loadMatches(userId, userType) {
    fetch(`/api/matches/${userId}?type=${userType}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load matches');
            }
            return response.json();
        })
        .then(matches => {
            // Group matches by status
            const pendingMatches = matches.filter(match => match.status === 'pending');
            const acceptedMatches = matches.filter(match => match.status === 'accepted');
            const completedMatches = matches.filter(match => match.status === 'completed');
            
            // Display matches in appropriate tabs
            displayMatches('pending-matches-container', pendingMatches, userType);
            displayMatches('accepted-matches-container', acceptedMatches, userType);
            displayMatches('completed-matches-container', completedMatches, userType);
            
            // Show/hide empty state messages
            document.getElementById('no-pending-matches').style.display = pendingMatches.length === 0 ? 'block' : 'none';
            document.getElementById('no-accepted-matches').style.display = acceptedMatches.length === 0 ? 'block' : 'none';
            document.getElementById('no-completed-matches').style.display = completedMatches.length === 0 ? 'block' : 'none';
            
            // Show impact summary if there are completed matches
            if (completedMatches.length > 0) {
                document.getElementById('impact-summary').style.display = 'block';
                calculateUserImpact(completedMatches);
            }
        })
        .catch(error => {
            console.error('Error loading matches:', error);
            alert('Failed to load matches. Please try again later.');
        });
}

function displayMatches(containerId, matches, userType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content except for the empty state message
    const emptyStateMessage = container.querySelector('.alert');
    container.innerHTML = '';
    if (emptyStateMessage) {
        container.appendChild(emptyStateMessage);
    }
    
    // Clone and populate match cards
    matches.forEach(match => {
        const matchCard = createMatchCard(match, userType);
        container.appendChild(matchCard);
    });
}

function createMatchCard(match, userType) {
    // Clone the template
    const template = document.getElementById('match-card-template');
    const matchCard = template.content.cloneNode(true).querySelector('.match-card');
    
    // Set waste type and quantity
    matchCard.querySelector('.waste-type').textContent = match.waste_type || 'Unknown';
    matchCard.querySelector('.quantity').textContent = `${match.quantity} ${match.unit}`;
    
    // Set match status
    const statusBadge = matchCard.querySelector('.match-status');
    statusBadge.textContent = match.status.charAt(0).toUpperCase() + match.status.slice(1);
    statusBadge.classList.add(`badge-${match.status}`);
    
    // Set other user info based on user type
    if (userType === 'producer') {
        matchCard.querySelector('.other-user').textContent = match.composter_name;
        matchCard.querySelector('.email-link').textContent = match.composter_email;
        matchCard.querySelector('.email-link').href = `mailto:${match.composter_email}`;
    } else {
        matchCard.querySelector('.other-user').textContent = match.producer_name;
        matchCard.querySelector('.email-link').textContent = match.producer_email;
        matchCard.querySelector('.email-link').href = `mailto:${match.producer_email}`;
    }
    
    // Set availability dates
    matchCard.querySelector('.availability-dates').textContent = 
        `${formatDate(match.availability_start)} - ${formatDate(match.availability_end)}`;
    
    // Set pickup times if available
    const pickupTimes = matchCard.querySelector('.pickup-times');
    if (match.pickup_time_start && match.pickup_time_end) {
        pickupTimes.textContent = `${formatTime(match.pickup_time_start)} - ${formatTime(match.pickup_time_end)}`;
    } else {
        pickupTimes.textContent = 'Any time';
    }
    
    // Set location
    matchCard.querySelector('.location').textContent = `${match.city}, ${match.state}`;
    
    // Set match score and creation date
    matchCard.querySelector('.match-score').textContent = `${Math.round(match.score * 100)}%`;
    matchCard.querySelector('.created-at').textContent = formatDate(match.created_at);
    
    // Add action buttons based on match status and user type
    const actionsContainer = matchCard.querySelector('.match-actions');
    
    if (match.status === 'pending') {
        if (userType === 'composter') {
            // Composters can accept or reject pending matches
            const acceptBtn = createButton('Accept', 'success', () => updateMatchStatus(match.match_id, 'accepted'));
            const rejectBtn = createButton('Reject', 'danger', () => updateMatchStatus(match.match_id, 'rejected'));
            
            actionsContainer.appendChild(acceptBtn);
            actionsContainer.appendChild(rejectBtn);
        } else {
            // Producers can only view pending matches
            const pendingLabel = document.createElement('span');
            pendingLabel.className = 'badge bg-warning';
            pendingLabel.textContent = 'Awaiting composter response';
            actionsContainer.appendChild(pendingLabel);
        }
    } else if (match.status === 'accepted') {
        // Both users can mark accepted matches as completed
        const completeBtn = createButton('Mark Completed', 'primary', () => updateMatchStatus(match.match_id, 'completed'));
        actionsContainer.appendChild(completeBtn);
    }
    
    return matchCard;
}

function createButton(text, style, clickHandler) {
    const button = document.createElement('button');
    button.className = `btn btn-${style} btn-sm mb-2 me-2`;
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    return button;
}

function updateMatchStatus(matchId, newStatus) {
    // Show confirmation dialog
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    // Set modal content based on action
    document.getElementById('confirmationModalTitle').textContent = `Confirm ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
    
    let message = '';
    if (newStatus === 'accepted') {
        message = 'Are you sure you want to accept this match? This will connect you with the waste producer.';
    } else if (newStatus === 'rejected') {
        message = 'Are you sure you want to reject this match? This cannot be undone.';
    } else if (newStatus === 'completed') {
        message = 'Are you sure you want to mark this match as completed? This will record the environmental impact.';
    }
    
    document.getElementById('confirmationModalBody').textContent = message;
    
    // Set up confirmation button
    const originalClickHandler = confirmBtn.onclick;
    confirmBtn.onclick = () => {
        // Send request to update match status
        fetch(`/api/matches/${matchId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update match status');
            }
            return response.json();
        })
        .then(data => {
            confirmationModal.hide();
            
            // Reload matches to reflect changes
            const userData = JSON.parse(localStorage.getItem('userData'));
            loadMatches(userData.user_id, userData.user_type);
        })
        .catch(error => {
            console.error('Error updating match status:', error);
            alert('Failed to update match status. Please try again later.');
        });
    };
    
    confirmationModal.show();
    
    // Restore original click handler when modal is hidden
    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', () => {
        confirmBtn.onclick = originalClickHandler;
    }, { once: true });
}

function calculateUserImpact(completedMatches) {
    let totalWasteDiverted = 0;
    let totalCO2Saved = 0;
    let totalWaterSaved = 0;
    
    completedMatches.forEach(match => {
        const quantity = parseFloat(match.quantity);
        const wasteType = match.waste_type ? match.waste_type.toLowerCase() : 'default';
        
        // Calculate impact based on waste type
        let co2Factor = 2.0;
        let waterFactor = 50;
        
        if (wasteType.includes('food')) {
            co2Factor = 2.5;
            waterFactor = 80;
        } else if (wasteType.includes('yard') || wasteType.includes('garden')) {
            co2Factor = 1.8;
            waterFactor = 30;
        } else if (wasteType.includes('paper')) {
            co2Factor = 3.2;
            waterFactor = 60;
        }
        
        totalWasteDiverted += quantity;
        totalCO2Saved += quantity * co2Factor;
        totalWaterSaved += quantity * waterFactor;
    });
    
    // Update impact summary
    document.getElementById('user-waste-diverted').textContent = Math.round(totalWasteDiverted);
    document.getElementById('user-co2-saved').textContent = Math.round(totalCO2Saved);
    document.getElementById('user-water-saved').textContent = Math.round(totalWaterSaved);
}

function setupConfirmationModal() {
    // Initialize Bootstrap modal if not already initialized
    const modalElement = document.getElementById('confirmationModal');
    if (modalElement && !bootstrap.Modal.getInstance(modalElement)) {
        new bootstrap.Modal(modalElement);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const date = new Date(`2025-03-27T${timeString}`);
    return date.toLocaleTimeString(undefined, options);
}

// ---------------------------- MAYBE SOMETHING WRONG FROM HERE CHECK ONCE AS WE GOT BREAK HERE

function createMatchCard(match, userType) {
    // Clone the template
    const template = document.getElementById('match-card-template');
    const matchCard = template.content.cloneNode(true).querySelector('.match-card');
    
    // Set waste type and quantity
    matchCard.querySelector('.waste-type').textContent = match.waste_type || 'Unknown';
    matchCard.querySelector('.quantity').textContent = `${match.quantity} ${match.unit}`;
    
    // Set match status
    const statusBadge = matchCard.querySelector('.match-status');
    statusBadge.textContent = match.status.charAt(0).toUpperCase() + match.status.slice(1);
    statusBadge.classList.add(`badge-${match.status}`);
    
    // Set other user info based on user type
    if (userType === 'producer') {
        matchCard.querySelector('.other-user').textContent = match.composter_name;
        matchCard.querySelector('.email-link').textContent = match.composter_email;
        matchCard.querySelector('.email-link').href = `mailto:${match.composter_email}`;
    } else {
        matchCard.querySelector('.other-user').textContent = match.producer_name;
        matchCard.querySelector('.email-link').textContent = match.producer_email;
        matchCard.querySelector('.email-link').href = `mailto:${match.producer_email}`;
    }
    
    // Set availability dates
    matchCard.querySelector('.availability-dates').textContent = 
        `${formatDate(match.availability_start)} - ${formatDate(match.availability_end)}`;
    
    // Set pickup times if available
    const pickupTimes = matchCard.querySelector('.pickup-times');
    if (match.pickup_time_start && match.pickup_time_end) {
        pickupTimes.textContent = `${formatTime(match.pickup_time_start)} - ${formatTime(match.pickup_time_end)}`;
    } else {
        pickupTimes.textContent = 'Any time';
    }
    
    // Set location
    matchCard.querySelector('.location').textContent = `${match.city}, ${match.state}`;
    
    // Set match score and creation date
    matchCard.querySelector('.match-score').textContent = `${Math.round(match.score * 100)}%`;
    matchCard.querySelector('.created-at').textContent = formatDate(match.created_at);
    
    // Add action buttons based on match status and user type
    const actionsContainer = matchCard.querySelector('.match-actions');
    
    if (match.status === 'pending') {
        if (userType === 'composter') {
            // Composters can accept or reject pending matches
            const acceptBtn = createButton('Accept', 'success', () => updateMatchStatus(match.match_id, 'accepted'));
            const rejectBtn = createButton('Reject', 'danger', () => updateMatchStatus(match.match_id, 'rejected'));
            
            actionsContainer.appendChild(acceptBtn);
            actionsContainer.appendChild(rejectBtn);
        } else {
            // Producers can only view pending matches
            const pendingLabel = document.createElement('span');
            pendingLabel.className = 'badge bg-warning';
            pendingLabel.textContent = 'Awaiting composter response';
            actionsContainer.appendChild(pendingLabel);
        }
    } else if (match.status === 'accepted') {
        // Both users can mark accepted matches as completed
        const completeBtn = createButton('Mark Completed', 'primary', () => updateMatchStatus(match.match_id, 'completed'));
        actionsContainer.appendChild(completeBtn);
    }
    
    return matchCard;
}