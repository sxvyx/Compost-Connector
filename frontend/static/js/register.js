// register.js - Handle user registration

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const userTypeRadios = document.querySelectorAll('input[name="user_type"]');
    const composterPrefs = document.getElementById('composter-preferences');
    
    // Show/hide composter preferences based on user type selection
    if (userTypeRadios.length > 0 && composterPrefs) {
        userTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'composter') {
                    composterPrefs.style.display = 'block';
                } else {
                    composterPrefs.style.display = 'none';
                }
            });
        });
    }
    
    // Load waste types for preferences
    loadWasteTypes();
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});

function loadWasteTypes() {
    const wasteTypeContainer = document.getElementById('waste-type-preferences');
    if (!wasteTypeContainer) return;
    
    fetch('/api/waste-types')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load waste types');
            }
            return response.json();
        })
        .then(wasteTypes => {
            wasteTypeContainer.innerHTML = '';
            
            wasteTypes.forEach(type => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'form-check mb-2';
                
                checkboxDiv.innerHTML = `
                    <input class="form-check-input waste-type-checkbox" type="checkbox" 
                           value="${type.waste_type_id}" id="waste-type-${type.waste_type_id}">
                    <label class="form-check-label" for="waste-type-${type.waste_type_id}">
                        ${type.name}
                    </label>
                    <div class="input-group mt-1 mb-3 max-quantity-input" style="display: none;">
                        <span class="input-group-text">Max Quantity (kg)</span>
                        <input type="number" class="form-control" 
                               id="max-quantity-${type.waste_type_id}" min="0.1" step="0.1">
                    </div>
                `;
                
                wasteTypeContainer.appendChild(checkboxDiv);
                
                // Show/hide max quantity input when checkbox is checked
                const checkbox = checkboxDiv.querySelector('.waste-type-checkbox');
                const quantityInput = checkboxDiv.querySelector('.max-quantity-input');
                
                checkbox.addEventListener('change', function() {
                    quantityInput.style.display = this.checked ? 'flex' : 'none';
                });
            });
        })
        .catch(error => {
            console.error('Error loading waste types:', error);
            wasteTypeContainer.innerHTML = '<p class="text-danger">Failed to load waste types. Please try again later.</p>';
        });
}

function handleRegistration(event) {
    event.preventDefault();
    
    // Get form data
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const userType = document.querySelector('input[name="user_type"]:checked')?.value;
    
    // Validate inputs
    if (!username || !email || !password || !confirmPassword || !userType) {
        showError('Please fill in all required fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Get location data
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipcode = document.getElementById('zipcode').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    // Prepare registration data
    const registrationData = {
        username: username,
        email: email,
        password: password,
        user_type: userType,
        location: {
            address: address,
            city: city,
            state: state,
            zipcode: zipcode,
            latitude: latitude,
            longitude: longitude
        }
    };
    
    // Add composter preferences if applicable
    if (userType === 'composter') {
        const preferences = [];
        const checkboxes = document.querySelectorAll('.waste-type-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const wasteTypeId = checkbox.value;
            const maxQuantity = document.getElementById(`max-quantity-${wasteTypeId}`).value;
            
            preferences.push({
                waste_type_id: wasteTypeId,
                max_quantity: maxQuantity || null
            });
        });
        
        if (preferences.length === 0) {
            showError('Please select at least one waste type preference');
            return;
        }
        
        registrationData.preferences = preferences;
    }
    
    // Send registration request
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Registration failed');
            });
        }
        return response.json();
    })
    .then(data => {
        // Show success message and redirect to login
        alert('Registration successful! Please log in with your new account.');
        window.location.href = 'login.html';
    })
    .catch(error => {
        showError(error.message);
    });
}

function showError(message) {
    const errorElement = document.getElementById('register-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}
