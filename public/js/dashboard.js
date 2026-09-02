document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENT REFERENCES ---
    const addPatientForm = document.getElementById('add-patient-form');
    const watchlistBody = document.getElementById('watchlist-body');
    const detailsModal = document.getElementById('details-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalPatientName = document.getElementById('modal-patient-name');
    const modalPatientCondition = document.getElementById('modal-patient-condition');
    const aiRecommendationDiv = document.getElementById('ai-recommendation');
    const chartCanvas = document.getElementById('health-chart');
    let healthChartInstance = null; // To hold the chart object

    // --- EVENT LISTENERS ---
    addPatientForm.addEventListener('submit', handleAddPatient);
    watchlistBody.addEventListener('click', handleWatchlistClick);
    closeModalBtn.addEventListener('click', closeDetailsModal);
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) { // Close if clicking on the background overlay
            closeDetailsModal();
        }
    });

    // --- EVENT HANDLER FUNCTIONS ---

    /**
     * Handles the submission of the 'Add New Patient' form.
     */
    function handleAddPatient(event) {
        event.preventDefault();
        const patientName = document.getElementById('patient-name').value;
        const chronicCondition = document.getElementById('chronic-condition').value;

        if (chronicCondition !== 'None') {
            const newRow = createPatientRow(patientName, chronicCondition);
            watchlistBody.prepend(newRow);
        }
        
        showSuccessMessage(`Patient record for ${patientName} created.`);
        addPatientForm.reset();
    }

    /**
     * Handles clicks within the watchlist table, specifically for 'View Details'.
     */
    function handleWatchlistClick(event) {
        if (event.target.classList.contains('view-details-link')) {
            event.preventDefault();
            const row = event.target.closest('tr');
            const patientName = row.dataset.name;
            const condition = row.dataset.condition;
            openDetailsModal(patientName, condition);
        }
    }

    // --- MODAL AND CHART LOGIC ---

    /**
     * Opens and populates the patient details modal.
     */
    function openDetailsModal(patientName, condition) {
        modalPatientName.textContent = patientName;
        modalPatientCondition.textContent = `Chronic Condition: ${condition}`;

        // Generate sample data and create the chart
        const { labels, datasets, chartTitle } = generateSampleHealthData(condition);
        renderHealthChart(labels, datasets, chartTitle);

        // Fetch AI recommendations
        getAiRecommendation(patientName, condition, datasets);

        detailsModal.classList.remove('hidden');
    }

    /**
     * Closes the patient details modal.
     */
    function closeDetailsModal() {
        detailsModal.classList.add('hidden');
        if (healthChartInstance) {
            healthChartInstance.destroy(); // Destroy the chart to free up memory
        }
    }

    /**
     * Renders the health data chart in the modal.
     */
    function renderHealthChart(labels, datasets, chartTitle) {
        if (healthChartInstance) {
            healthChartInstance.destroy(); // Clear previous chart before drawing a new one
        }
        healthChartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: chartTitle }
                },
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    }

    // --- AI AND DATA SIMULATION ---

    /**
     * Simulates fetching AI-powered recommendations.
     */
    function getAiRecommendation(patientName, condition, datasets) {
        aiRecommendationDiv.innerHTML = `<p class="text-center text-gray-500">Generating AI recommendations...</p>`;
        
        // Simulate an API call delay
        setTimeout(() => {
            let recommendationHtml = `<h4>Analysis for ${patientName}</h4>`;
            if (condition === 'Diabetes') {
                recommendationHtml += `
                    <p>The patient's recent blood sugar readings show some fluctuations, with a recent spike. Based on this trend, consider the following:</p>
                    <ul>
                        <li><strong>Dietary Review:</strong> Recommend a consultation to review their carbohydrate intake. Emphasize whole grains and fiber.</li>
                        <li><strong>Medication Adherence:</strong> Verify if the patient is taking their medication consistently at the same time each day.</li>
                        <li><strong>Physical Activity:</strong> Suggest incorporating a 30-minute brisk walk daily, which can help stabilize glucose levels.</li>
                        <li><strong>Follow-up:</strong> Schedule a follow-up appointment in 2 weeks to monitor progress.</li>
                    </ul>
                `;
            } else if (condition === 'Hypertension') {
                 recommendationHtml += `
                    <p>The patient's blood pressure readings are consistently elevated, particularly the systolic pressure. Key recommendations:</p>
                    <ul>
                        <li><strong>Sodium Intake:</strong> Advise a strict low-sodium diet. Provide a list of high-sodium foods to avoid (e.g., processed foods, pickles).</li>
                        <li><strong>Stress Management:</strong> Discuss stress-reduction techniques like deep breathing exercises or meditation.</li>
                        <li><strong>Home Monitoring:</strong> Encourage daily home blood pressure monitoring and logging the results.</li>
                        <li><strong>Medication Adjustment:</strong> The current medication dosage may need adjustment. Consider this at the next consultation.</li>
                    </ul>
                `;
            } else {
                 recommendationHtml += `<p>No specific AI recommendations available for this condition yet.</p>`;
            }
            aiRecommendationDiv.innerHTML = recommendationHtml;
        }, 1500); // 1.5 second delay
    }

    /**
     * Generates sample data for the chart based on condition.
     */
    function generateSampleHealthData(condition) {
        const labels = ['May', 'June', 'July', 'Aug', 'Sept', 'Oct'];
        let datasets = [];
        let chartTitle = 'Health Data';

        if (condition === 'Diabetes') {
            chartTitle = 'Avg. Blood Sugar (mg/dL)';
            datasets.push({
                label: 'Blood Sugar',
                data: [140, 155, 145, 160, 175, 165],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                tension: 0.1
            });
        } else if (condition === 'Hypertension') {
            chartTitle = 'Blood Pressure (mmHg)';
            datasets.push({
                label: 'Systolic',
                data: [145, 142, 150, 155, 148, 152],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.1
            }, {
                label: 'Diastolic',
                data: [92, 90, 95, 98, 94, 96],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                tension: 0.1
            });
        }
        return { labels, datasets, chartTitle };
    }

    // --- UTILITY FUNCTIONS ---
    
    function createPatientRow(patientName, chronicCondition) {
        const newRow = document.createElement('tr');
        newRow.classList.add('border-b');
        newRow.dataset.name = patientName;
        newRow.dataset.condition = chronicCondition;
        const today = new Date().toISOString().slice(0, 10);
        newRow.innerHTML = `
            <td class="p-4">${patientName}</td>
            <td class="p-4"><span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${chronicCondition}</span></td>
            <td class="p-4">${today}</td>
            <td class="p-4"><a href="#" class="view-details-link text-blue-600 hover:underline">View Details</a></td>
        `;
        return newRow;
    }

    function showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.textContent = message;
        successMessage.className = 'text-green-600 mt-2 text-right text-sm';
        const submitButton = addPatientForm.querySelector('button[type="submit"]');
        submitButton.parentElement.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    }
});

