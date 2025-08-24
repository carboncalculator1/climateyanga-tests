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
        const usersSnapshot = await db.collection('users').get();
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = '';

        let totalCalculations = 0;
        let totalEmissions = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();

            // Fetch the calculations subcollection
            const calcSnapshot = await db.collection('users')
                .doc(doc.id)
                .collection('calculations')
                .get();

            const calculationsCount = calcSnapshot.size;
            totalCalculations += calculationsCount;

            let userEmissions = 0;
            calcSnapshot.forEach(calcDoc => {
                const calc = calcDoc.data();
                userEmissions += calc.results?.total || 0;
            });
            totalEmissions += userEmissions;

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
        }

        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        document.getElementById('totalCalculations').textContent = totalCalculations;
        document.getElementById('avgEmissions').textContent = usersSnapshot.size > 0
            ? (totalEmissions / usersSnapshot.size).toFixed(1) + ' kg'
            : '0 kg';

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

    // Fetch calculations subcollection
    const calcSnapshot = await db.collection('users')
        .doc(userId)
        .collection('calculations')
        .orderBy('timestamp', 'desc')
        .get();

    let detailsHtml = `
        <h3>${userData.username || userData.email}</h3>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Signup Date:</strong> ${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
        <h4>Calculations (${calcSnapshot.size}):</h4>
    `;

    if (!calcSnapshot.empty) {
        detailsHtml += '<ul>';
        calcSnapshot.forEach((calcDoc, index) => {
            const calc = calcDoc.data();
            detailsHtml += `
                <li>
                    <strong>${calc.type}</strong> - 
                    ${calc.timestamp ? calc.timestamp.toDate().toLocaleDateString() : 'Unknown date'} - 
                    Total: ${calc.results?.total?.toFixed(1) || 0} kg CO₂e
                    <button class="view-calc-btn" data-uid="${userId}" data-id="${calcDoc.id}">View Details</button>
                </li>
            `;
        });
        detailsHtml += '</ul>';
    } else {
        detailsHtml += '<p>No calculations yet.</p>';
    }

    document.getElementById('userDetailsContent').innerHTML = detailsHtml;

    // Add event listeners for calculation detail buttons
    document.querySelectorAll('.view-calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-uid');
            const calcId = btn.getAttribute('data-id');
            viewCalculationDetails(userId, calcId);
        });
    });
}


async function viewCalculationDetails(userId, calcId) {
    try {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // Get the specific calculation from the subcollection
        const calcDoc = await db.collection('users')
                                .doc(userId)
                                .collection('calculations')
                                .doc(calcId)
                                .get();
        if (!calcDoc.exists) {
            document.getElementById('calculationDetailsContent').innerHTML = '<p>Calculation not found.</p>';
            return;
        }

        const calculation = calcDoc.data();

        const detailsHtml = `
            <p><strong>User:</strong> ${userData.username || userData.email}</p>
            <p><strong>Type:</strong> ${calculation.type}</p>
            <p><strong>Date:</strong> ${calculation.timestamp ? calculation.timestamp.toDate().toLocaleString() : 'Unknown'}</p>
            
            <h4>Inputs:</h4>
            <pre>${JSON.stringify(calculation.inputs, null, 2)}</pre>
            
            <h4>Results:</h4>
            <pre>${JSON.stringify(calculation.results, null, 2)}</pre>
        `;

        document.getElementById('calculationDetailsContent').innerHTML = detailsHtml;

    } catch (error) {
        console.error('Error fetching calculation details:', error);
    }
}
