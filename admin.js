// admin.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin (you need to set this in your Firestore)
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.data()?.isAdmin) {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        
        // Load admin data
        loadAdminData();
        
        // Set up logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
        
        // Set up refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            loadAdminData();
        });
    });
});

async function loadAdminData() {
    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = '';
        
        let totalCalculations = 0;
        let totalEmissions = 0;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const calculationsCount = userData.calculations ? userData.calculations.length : 0;
            totalCalculations += calculationsCount;
            
            // Calculate total emissions for this user
            let userEmissions = 0;
            if (userData.calculations) {
                userData.calculations.forEach(calc => {
                    userEmissions += calc.results.total || 0;
                });
                totalEmissions += userEmissions;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userData.username || 'N/A'}</td>
                <td>${userData.email}</td>
                <td>${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                <td>${calculationsCount}</td>
                <td>
                    <button class="view-user-btn" data-uid="${doc.id}">View Details</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
        
        // Update stats
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        document.getElementById('totalCalculations').textContent = totalCalculations;
        document.getElementById('avgEmissions').textContent = usersSnapshot.size > 0 
            ? (totalEmissions / usersSnapshot.size).toFixed(1) + ' kg' 
            : '0 kg';
        
        // Add event listeners to view user buttons
        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-uid');
                viewUserDetails(userId);
            });
        });
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function viewUserDetails(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    let detailsHtml = `
        <h3>User: ${userData.username || userData.email}</h3>
        <p>Email: ${userData.email}</p>
        <p>Signup Date: ${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
        <h4>Calculations (${userData.calculations ? userData.calculations.length : 0}):</h4>
    `;
    
    if (userData.calculations && userData.calculations.length > 0) {
        detailsHtml += '<ul>';
        userData.calculations.forEach(calc => {
            detailsHtml += `
                <li>
                    <strong>${calc.type}</strong> - 
                    ${calc.timestamp ? calc.timestamp.toDate().toLocaleDateString() : 'Unknown date'} -
                    Total: ${calc.results.total.toFixed(1)} kg CO₂e
                    <button onclick="viewCalculationDetails('${userId}', ${JSON.stringify(calc).replace(/'/g, "\\'")})">View Details</button>
                </li>
            `;
        });
        detailsHtml += '</ul>';
    } else {
        detailsHtml += '<p>No calculations yet.</p>';
    }
    
    // Show in a modal or new page
    alert(detailsHtml); // In a real app, you'd use a proper modal
}

function viewCalculationDetails(userId, calculation) {
    alert(`
        User: ${userId}
        Type: ${calculation.type}
        Date: ${calculation.timestamp ? calculation.timestamp.toDate().toLocaleString() : 'Unknown'}
        
        Inputs:
        ${JSON.stringify(calculation.inputs, null, 2)}
        
        Results:
        ${JSON.stringify(calculation.results, null, 2)}
    `);
}