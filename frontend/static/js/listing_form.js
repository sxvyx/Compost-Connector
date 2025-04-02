// listing_form.js - Handle waste listing form

document.addEventListener('DOMContentLoaded', function() {
    const listingForm = document.getElementById('listing-form');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!userData || userData.user_type !== 'producer') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Set the hidden producer_id field
    document.getElementById('producer-id').value = userData.user_id;

    // Load waste types
    loadWasteTypes();

    // Set minimum date for availability
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('availability-start').min = today;
    document.getElementById('availability-end').min = today;

    // Form submission
    listingForm.addEventListener('submit', handleListingSubmission);
});

function loadWasteTypes() {
    fetch('/api/waste-types')
        .then(response => response.json())
        .then(wasteTypes => {
            const wasteTypeSelect = document.getElementById('waste-type');
            const unitSelect = document.getElementById('unit');
            wasteTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.waste_type_id;
                option.textContent = type.name;
                option.dataset.unit = type.recommended_unit; // Store the recommended unit
                wasteTypeSelect.appendChild(option);
            });

            // Update unit field when waste type changes
            wasteTypeSelect.addEventListener('change', function() {
                const selectedOption = wasteTypeSelect.options[wasteTypeSelect.selectedIndex];
                unitSelect.value = selectedOption.dataset.unit || 'kg'; // Default to kg
            });
        })
        .catch(error => console.error('Error loading waste types:', error));
}

function handleListingSubmission(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const listingData = Object.fromEntries(formData.entries());
    
    // Validate dates
    if (new Date(listingData.availability_end) < new Date(listingData.availability_start)) {
        alert('End date must be after start date');
        return;
    }
    
    // Send listing data to server
    fetch('/api/listings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData)
    })
    .then(response => {
        if (!response.ok) {
            // If response is not OK, read it as text to see the error
            return response.text().then(text => {
                console.error('Server response:', text);
                throw new Error(`Server error: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        alert('Listing created successfully!');
        window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error('Error creating listing:', error);
        alert('Failed to create listing. Please try again.');
    });
}
