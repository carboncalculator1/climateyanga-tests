    let currentSection = 'personal';
    let calculationData = {};

    function showSection(section) {
        document.getElementById(currentSection).classList.remove('active');
        document.getElementById('results').classList.remove('active');
        document.getElementById(section).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
        currentSection = section;
    }

    function updateSliderValue(slider, outputId) {
        document.getElementById(outputId).textContent = slider.value;
    }

    function changeMeals(delta) {
        const mealsInput = document.getElementById('meals');
        let value = parseInt(mealsInput.value) + delta;
        if (value < 1) value = 1;
        if (value > 10) value = 10;
        mealsInput.value = value;
    }

    function validateInputs(inputs) {
        for (const [key, value] of Object.entries(inputs)) {
            if (isNaN(value) || value < 0) {
                alert(`Please enter a valid number for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        return true;
    }
//save to firestore
async function saveCalculation(inputs, results, type) {
    try {
        const user = auth.currentUser;
        if (!user) {
            if (confirm('You need to be logged in to save calculations. Would you like to login now?')) {
                window.location.href = 'login.html';
            }
            return false;
        }
        
        // Prepare calculation object with separate inputs and results
        const calculation = {
            type: type,
            inputs: inputs,      // Store only the inputs
            results: results,    // Store only the results
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add calculation to user's calculations subcollection
        await db.collection('users').doc(user.uid)
                .collection('calculations')
                .add(calculation);
        
        return true;
    } catch (error) {
        console.error('Error saving calculation:', error);
        return false;
    }
}


   async function calculatePersonal() {
        const inputs = {
            commute: parseFloat(document.getElementById('commuteValue').textContent),
            waste: parseFloat(document.getElementById('wasteValue').textContent),
            electricity: parseFloat(document.getElementById('electricityValue').textContent),
            meals: parseFloat(document.getElementById('meals').value)
        };

        if (!validateInputs(inputs)) return;

        // Convert weekly/daily inputs to monthly values
        const results = {
            Commute: inputs.commute * 0.26 * 22, // 22 working days per month
            Waste: inputs.waste * 0.8 * 4, // Convert weekly to monthly (4 weeks)
            Electricity: inputs.electricity * 0.02, // Already monthly
            Meals: inputs.meals * 0.45 * 30 // Daily to monthly (30 days)
        };

        results.total = Object.values(results).reduce((sum, val) => sum + val, 0);
        calculationData = { ...inputs, ...results };
	// After calculation
    	const saved = await saveCalculation(inputs, results, 'personal');
    	

        displayResults(results);

    }

   async function calculateConstruction() {
        const inputs = {
            embodiedCarbon: parseFloat(document.getElementById('embodiedCarbonValue').textContent),
            constructionElectricity: parseFloat(document.getElementById('constructionElectricityValue').textContent),
            machinery: parseFloat(document.getElementById('machineryValue').textContent),
            constructionTransport: parseFloat(document.getElementById('constructionTransportValue').textContent)
        };

        if (!validateInputs(inputs)) return;

        // Convert weekly inputs to monthly values
        const results = {
            Materials: inputs.embodiedCarbon * 2.7, // Already monthly
            Electricity: inputs.constructionElectricity * 0.02, // Already monthly
            Machinery: inputs.machinery * 0.26 * 4, // Convert weekly to monthly (4 weeks)
            Transport: inputs.constructionTransport * 0.26 * 4 // Convert weekly to monthly (4 weeks)
        };

        results.total = Object.values(results).reduce((sum, val) => sum + val, 0);
        calculationData = { ...inputs, ...results };
results.total = Object.values(results).reduce((sum, val) => sum + val, 0);
        calculationData = { ...inputs, ...results };
	
	// After calculation
    	const saved = await saveCalculation(inputs, results, 'construction');
    	

        displayResults(results);
    }

   async function calculateManufacturing() {
        const inputs = {
            rawMaterial: parseFloat(document.getElementById('rawMaterialValue').textContent),
            manufacturingEnergy: parseFloat(document.getElementById('manufacturingEnergyValue').textContent),
            water: parseFloat(document.getElementById('waterValue').textContent),
            manufacturingWaste: parseFloat(document.getElementById('manufacturingWasteValue').textContent),
            manufacturingTransport: parseFloat(document.getElementById('manufacturingTransportValue').textContent)
        };

        if (!validateInputs(inputs)) return;

        // All inputs are already monthly
        const results = {
            Materials: inputs.rawMaterial * 1.8,
            Energy: inputs.manufacturingEnergy * 0.02, //Everything except fuel
            Water: inputs.water * 0.01,
            Waste: inputs.manufacturingWaste * 0.8,
            Transport: inputs.manufacturingTransport * 0.26
        };

        results.total = Object.values(results).reduce((sum, val) => sum + val, 0);
        calculationData = { ...inputs, ...results };

    		// After calculation
    		const saved = await saveCalculation(inputs, results, 'manufacturing');
    		

        displayResults(results);
    }

    function displayResults(data) {
        document.getElementById(currentSection).classList.remove('active');

        // Update the results with the calculated data
        const totalKg = data.total.toFixed(1);
        const totalTonnes = (data.total / 1000).toFixed(1);
        const dailyAverage = (data.total / 30).toFixed(1);

        // Clear previous results
        const summaryContainer = document.querySelector('.emissions-summary');
        summaryContainer.innerHTML = '';

        // Add new results based on current section
        if (currentSection === 'personal') {
            summaryContainer.innerHTML = `
                <div class="emissions-category">
                    <div class="category-name">Commute</div>
                    <div class="category-value">${data.Commute.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Commute / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Waste</div>
                    <div class="category-value">${data.Waste.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Waste / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Electricity</div>
                    <div class="category-value">${data.Electricity.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Electricity / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Meals</div>
                    <div class="category-value">${data.Meals.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Meals / data.total) * 100).toFixed(1)}% of total</div>
                </div>
            `;
        } else if (currentSection === 'construction') {
            summaryContainer.innerHTML = `
                <div class="emissions-category">
                    <div class="category-name">Materials</div>
                    <div class="category-value">${data.Materials.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Materials / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Electricity</div>
                    <div class="category-value">${data.Electricity.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Electricity / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Machinery</div>
                    <div class="category-value">${data.Machinery.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Machinery / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Transport</div>
                    <div class="category-value">${data.Transport.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Transport / data.total) * 100).toFixed(1)}% of total</div>
                </div>
            `;
        } else if (currentSection === 'manufacturing') {
            summaryContainer.innerHTML = `
                <div class="emissions-category">
                    <div class="category-name">Materials</div>
                    <div class="category-value">${data.Materials.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Materials / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Energy</div>
                    <div class="category-value">${data.Energy.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Energy / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Water</div>
                    <div class="category-value">${data.Water.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Water / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Waste</div>
                    <div class="category-value">${data.Waste.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Waste / data.total) * 100).toFixed(1)}% of total</div>
                </div>
                <div class="emissions-category">
                    <div class="category-name">Transport</div>
                    <div class="category-value">${data.Transport.toFixed(1)} kg CO₂e/month</div>
                    <div class="category-percentage">${((data.Transport / data.total) * 100).toFixed(1)}% of total</div>
                </div>
            `;
        }

        // Update total emissions (show in tonnes for annual total)
        const annualTonnes = (data.total * 12 / 1000).toFixed(1);
        document.getElementById('totalEmissions').textContent = `Total Annual Emissions: ${annualTonnes} Tonnes CO₂e/Year`;
        document.getElementById('dailyAverage').textContent = `Daily Average: ${dailyAverage} kg CO₂e/day`;

        document.getElementById('results').classList.add('active');
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }

    function getIconForCategory(category) {
        const icons = {
            'Commute': 'fas fa-car',
            'Waste': 'fas fa-trash',
            'Electricity': 'fas fa-bolt',
            'Meals': 'fas fa-utensils',
            'Materials': 'fas fa-cubes',
            'Machinery': 'fas fa-tractor',
            'Transport': 'fas fa-truck',
            'Energy': 'fas fa-plug',
            'Water': 'fas fa-tint'
        };

        return `<i class="${icons[category] || 'fas fa-circle'}"></i>`;
    }

// PDF export function
async function exportToPDF() {
    const user = auth.currentUser;
    if (!user) {
        if (confirm('You need to be logged in to export PDF. Would you like to login now?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Get user data for filename
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    const username = userData.username || user.email.split('@')[0];
    
    // Create PDF content
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Carbon Emissions Summary', 105, 15, { align: 'center' });
    
    // Add user info
    doc.setFontSize(12);
    doc.text(`User: ${userData.username || user.email}`, 20, 25);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 32);
    
    // Add calculation summary
    let yPosition = 45;
    doc.setFontSize(16);
    doc.text('Calculation Details', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    for (const [key, value] of Object.entries(calculationData)) {
        if (typeof value === 'number') {
            doc.text(`${key}: ${value.toFixed(2)}`, 20, yPosition);
            yPosition += 7;
            
            // Add new page if needed
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
        }
    }
    
    // Add total
    yPosition += 7;
    doc.setFontSize(14);
    doc.text(`Total Emissions: ${calculationData.total.toFixed(2)} kg CO₂e`, 20, yPosition);
    
    // Save the PDF
    doc.save(`${username}_emissions_summary.pdf`);
}
