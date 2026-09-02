document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION CONSTANTS ---
    // The call link will become active 10 minutes before the scheduled time.
    const CALL_WINDOW_MINUTES_BEFORE = 10;
    // The call link will expire and be marked as "missed" 60 minutes after the scheduled time for a 1-hour duration.
    const CALL_WINDOW_MINUTES_AFTER = 60;

    // --- MODAL ELEMENTS ---
    const scheduleModal = document.getElementById('schedule-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
    const scheduleForm = document.getElementById('schedule-form');
    const modalPatientName = document.getElementById('modal-patient-name');
    const patientIdInput = document.getElementById('patient-id-input');
    const patientNameInput = document.getElementById('patient-name-input');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentTimeInput = document.getElementById('appointment-time');

    // --- DYNAMIC CONTENT CONTAINERS ---
    const pendingRequestsContainer = document.getElementById('pending-requests-container');
    const upcomingAppointmentsContainer = document.getElementById('upcoming-appointments-container');

    // --- INITIALIZATION ---
    // Run the status check immediately when the page loads.
    updateAppointmentStatuses();
    // Then, set it to run automatically every 30 seconds to keep the page up-to-date.
    setInterval(updateAppointmentStatuses, 30000);

    // --- EVENT LISTENERS ---
    pendingRequestsContainer.addEventListener('click', handlePendingRequestsClick);
    closeModalBtn.addEventListener('click', closeScheduleModal);
    cancelScheduleBtn.addEventListener('click', closeScheduleModal);
    scheduleModal.addEventListener('click', (e) => {
        // Close modal if the outer dark area is clicked
        if (e.target === scheduleModal) {
            closeScheduleModal();
        }
    });
    scheduleForm.addEventListener('submit', handleScheduleSubmit);

    // --- EVENT HANDLER FUNCTIONS ---

    /**
     * Handles clicks on the "Accept & Schedule" and "Decline" buttons.
     */
    function handlePendingRequestsClick(e) {
        const target = e.target;
        const card = target.closest('.request-card');
        if (!card) return;

        if (target.classList.contains('schedule-btn')) {
            openScheduleModal(card.dataset.patientId, card.dataset.patientName);
        } else if (target.classList.contains('decline-btn')) {
            if (confirm(`Are you sure you want to decline the request from ${card.dataset.patientName}?`)) {
                card.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                setTimeout(() => card.remove(), 500); // Remove after fade-out
            }
        }
    }

    /**
     * Handles the form submission to schedule a new appointment.
     */
    function handleScheduleSubmit(e) {
        e.preventDefault();
        const patientId = patientIdInput.value;
        const patientName = patientNameInput.value;
        const date = appointmentDateInput.value;
        const time = appointmentTimeInput.value;

        // Create a new appointment card and add it to the list.
        const newAppointment = createAppointmentCard(patientId, patientName, date, time);
        upcomingAppointmentsContainer.appendChild(newAppointment);

        // Immediately update the status of all appointments.
        updateAppointmentStatuses();

        // Remove the original request card from the pending list.
        const requestCard = pendingRequestsContainer.querySelector(`[data-patient-id="${patientId}"]`);
        if (requestCard) requestCard.remove();

        closeScheduleModal();
    }


    // --- CORE LOGIC ---

    /**
     * This is the main function. It iterates through all appointment cards
     * and updates their status based on the current time.
     */
    function updateAppointmentStatuses() {
        const now = new Date();
        document.querySelectorAll('.appointment-card').forEach(card => {
            const dtString = card.dataset.appointmentDatetime;
            if (!dtString) return;

            const appointmentTime = new Date(dtString);
            const startTime = new Date(appointmentTime.getTime() - CALL_WINDOW_MINUTES_BEFORE * 60000);
            const endTime = new Date(appointmentTime.getTime() + CALL_WINDOW_MINUTES_AFTER * 60000);

            const link = card.querySelector('.video-call-link');
            const relativeTimeEl = card.querySelector('.relative-time');

            // Update the relative time text (e.g., "in 2 hours")
            relativeTimeEl.textContent = getRelativeTime(appointmentTime, now);

            if (now >= startTime && now <= endTime) {
                // --- STATE 1: ACTIVE ---
                // The call is within the active window.
                link.href = `/telemedicine`;
                link.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed', 'bg-red-100', 'text-red-700');
                link.classList.add('bg-green-500', 'text-white', 'hover:bg-green-600', 'shadow');
                link.innerHTML = `<i class="fa-solid fa-video mr-2"></i> Start Video Chat`;

            } else if (now > endTime) {
                // --- STATE 2: EXPIRED / MISSED ---
                // The active window has passed.
                link.href = '#';
                link.classList.remove('bg-green-500', 'hover:bg-green-600', 'bg-gray-300', 'text-gray-500');
                link.classList.add('bg-red-100', 'text-red-700', 'cursor-not-allowed');
                link.innerHTML = `<i class="fa-solid fa-exclamation-circle mr-2"></i> Call Missed`;

            } else {
                // --- STATE 3: UPCOMING (Default) ---
                // The appointment is in the future.
                link.href = '#';
                link.classList.remove('bg-green-500', 'hover:bg-green-600', 'bg-red-100', 'text-red-700');
                link.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
                link.innerHTML = `<i class="fa-solid fa-video-slash mr-2"></i> Call not active yet`;
            }
        });
    }

    /**
     * Creates the HTML for a new appointment card when one is scheduled.
     */
    function createAppointmentCard(patientId, patientName, date, time) {
        const card = document.createElement('div');
        const appointmentDateTime = new Date(`${date}T${time}`);
        card.className = 'appointment-card bg-white p-5 rounded-lg shadow-md border border-gray-200';
        
        // --- FIX ---
        // Store the exact date and time string, avoiding timezone conversions.
        card.dataset.appointmentDatetime = `${date}T${time}`;
        card.dataset.patientId = patientId;

        const formattedDate = appointmentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-lg text-gray-900">${patientName}</p>
                    <p class="text-sm text-gray-600">Patient ID: ${patientId}</p>
                </div>
                 <div class="text-right">
                    <p class="font-semibold text-gray-800">${formattedDate} at ${formattedTime}</p>
                    <p class="relative-time text-sm text-gray-500">Calculating...</p>
                </div>
            </div>
            <div class="mt-4">
                <a href="#" class="video-call-link w-full text-center block bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed transition-all duration-300">
                   <i class="fa-solid fa-video-slash mr-2"></i> Call not active yet
                </a>
            </div>
        `;
        return card;
    }


    // --- UTILITY FUNCTIONS ---

    function openScheduleModal(patientId, patientName) {
        modalPatientName.textContent = patientName;
        patientIdInput.value = patientId;
        patientNameInput.value = patientName;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        appointmentDateInput.min = today; // Prevent scheduling in the past
        appointmentDateInput.value = today;
        appointmentTimeInput.value = now.toTimeString().substring(0, 5);
        scheduleModal.classList.remove('hidden');
    }

    function closeScheduleModal() {
        scheduleModal.classList.add('hidden');
        scheduleForm.reset();
    }

    /**
     * Calculates a human-readable string for how far away the appointment is.
     */
    function getRelativeTime(targetDate, nowDate) {
        const diff = targetDate - nowDate;
        if (diff < -CALL_WINDOW_MINUTES_AFTER * 60000) return "Expired";
        if (diff < 0) return "In progress";

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} min${minutes > 1 ? 's' : ''}`;
        return "Starting now";
    }
});

