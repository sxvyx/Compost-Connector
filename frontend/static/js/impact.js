// impact.js - Handle environmental impact statistics display

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.user_id) {
        // Allow viewing impact stats without login, but hide user-specific elements
        document.querySelectorAll('.user-specific').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Load global impact statistics
    loadImpactStats();
    
    // Load impact breakdown by waste type
    loadImpactBreakdown();
});

function loadImpactStats() {
    fetch('/api/impact/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load impact statistics');
            }
            return response.json();
        })
        .then(stats => {
            // Update the impact statistics cards
            document.getElementById('total-waste-diverted').textContent = Math.round(stats.total_waste_diverted || 0);
            document.getElementById('total-co2-saved').textContent = Math.round(stats.total_co2_saved || 0);
            document.getElementById('total-water-saved').textContent = Math.round(stats.total_water_saved || 0);
            document.getElementById('total-matches').textContent = stats.total_successful_matches || 0;
        })
        .catch(error => {
            console.error('Error loading impact statistics:', error);
            alert('Failed to load impact statistics. Please try again later.');
        });
}

function loadImpactBreakdown() {
    fetch('/api/impact/breakdown')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load impact breakdown');
            }
            return response.json();
        })
        .then(breakdown => {
            const tableBody = document.getElementById('impact-breakdown');
            
            if (breakdown.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">No impact data available yet</td>
                    </tr>
                `;
                return;
            }
            
            tableBody.innerHTML = '';
            
            breakdown.forEach(item => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${item.waste_type}</td>
                    <td>${Math.round(item.quantity)} kg</td>
                    <td>${Math.round(item.co2_saved)} kg</td>
                    <td>${Math.round(item.water_saved)} L</td>
                `;
                
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading impact breakdown:', error);
            
            const tableBody = document.getElementById('impact-breakdown');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Failed to load impact breakdown. Please try again later.
                    </td>
                </tr>
            `;
        });
}
