// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        
        // Display user info
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        document.getElementById('userWelcome').textContent = `Welcome, ${userData.username || user.email}!`;
        
        // Load calculation history
        await loadCalculationHistory(user.uid, userData);
        
        // Set up logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
        
        // Toggle history view
        document.getElementById('viewHistoryBtn').addEventListener('click', () => {
            const historySection = document.getElementById('historySection');
            if (historySection.style.display === 'none') {
                historySection.style.display = 'block';
            } else {
                historySection.style.display = 'none';
            }
        });
    });
});

async function loadCalculationHistory(userId, userData) {
    const calculationsList = document.getElementById('calculationsList');
    const totalEmissionsValue = document.getElementById('totalEmissionsValue');
    
    if (!userData.calculations || userData.calculations.length === 0) {
        calculationsList.innerHTML = '<p class="no-data">No calculations yet. Start by creating a new calculation!</p>';
        totalEmissionsValue.textContent = '0';
        return;
    }
    
    // Calculate total emissions
    let totalEmissions = 0;
    userData.calculations.forEach(calc => {
        totalEmissions += calc.results.total || 0;
    });
    totalEmissionsValue.textContent = totalEmissions.toFixed(1);
    
    // Display calculation history
    calculationsList.innerHTML = '';
    userData.calculations.forEach((calc, index) => {
        const calcElement = document.createElement('div');
        calcElement.className = 'calculation-item';
        calcElement.innerHTML = `
            <div class="calc-header">
                <h3>${calc.type} Calculation</h3>
                <span class="calc-date">${new Date(calc.timestamp?.toDate()).toLocaleDateString()}</span>
            </div>
            <div class="calc-summary">
                <p>Total: <strong>${calc.results.total.toFixed(1)} kg CO₂e</strong></p>
                <button class="view-details-btn" data-index="${index}">View Details</button>
            </div>
            <div class="calc-details" id="details-${index}" style="display: none;">
                <h4>Inputs:</h4>
                <pre>${JSON.stringify(calc.inputs, null, 2)}</pre>
                <h4>Results:</h4>
                <pre>${JSON.stringify(calc.results, null, 2)}</pre>
            </div>
        `;
        calculationsList.appendChild(calcElement);
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            const detailsElement = document.getElementById(`details-${index}`);
            if (detailsElement.style.display === 'none') {
                detailsElement.style.display = 'block';
                btn.textContent = 'Hide Details';
            } else {
                detailsElement.style.display = 'none';
                btn.textContent = 'View Details';
            }
        });
    });
}