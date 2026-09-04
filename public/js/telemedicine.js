document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    // Video call becomes active 10 minutes before appointment.
    const CALL_WINDOW_MINUTES_BEFORE = 10;

    // Video call remains available for 60 minutes after appointment.
    const CALL_WINDOW_MINUTES_AFTER = 60;


    // =========================================================
    // MODAL ELEMENTS
    // =========================================================

    const scheduleModal =
        document.getElementById("schedule-modal");

    const closeModalBtn =
        document.getElementById("close-modal-btn");

    const cancelScheduleBtn =
        document.getElementById("cancel-schedule-btn");

    const scheduleForm =
        document.getElementById("schedule-form");

    const modalPatientName =
        document.getElementById("modal-patient-name");

    const patientIdInput =
        document.getElementById("patient-id-input");

    const patientNameInput =
        document.getElementById("patient-name-input");

    const appointmentDateInput =
        document.getElementById("appointment-date");

    const appointmentTimeInput =
        document.getElementById("appointment-time");


    // =========================================================
    // DYNAMIC CONTENT CONTAINERS
    // =========================================================

    const pendingRequestsContainer =
        document.getElementById("pending-requests-container");

    const upcomingAppointmentsContainer =
        document.getElementById("upcoming-appointments-container");

    const appointmentsEmptyState =
        document.getElementById("appointments-empty-state");


    // =========================================================
    // BASIC ELEMENT VALIDATION
    // =========================================================

    if (!pendingRequestsContainer ||
        !upcomingAppointmentsContainer ||
        !scheduleModal ||
        !scheduleForm) {

        console.error(
            "Telemedicine UI initialization failed: required elements are missing."
        );

        return;
    }


    // =========================================================
    // INITIALIZATION
    // =========================================================

    updateAppointmentStatuses();

    // Keep appointment statuses updated every 30 seconds.
    setInterval(updateAppointmentStatuses, 30000);


    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    pendingRequestsContainer.addEventListener(
        "click",
        handlePendingRequestsClick
    );


    if (closeModalBtn) {
        closeModalBtn.addEventListener(
            "click",
            closeScheduleModal
        );
    }


    if (cancelScheduleBtn) {
        cancelScheduleBtn.addEventListener(
            "click",
            closeScheduleModal
        );
    }


    // Close modal when clicking outside the modal content.
    scheduleModal.addEventListener("click", (event) => {

        if (event.target === scheduleModal) {
            closeScheduleModal();
        }

    });


    scheduleForm.addEventListener(
        "submit",
        handleScheduleSubmit
    );


    // =========================================================
    // PENDING REQUEST HANDLER
    // =========================================================

    function handlePendingRequestsClick(event) {

        const target = event.target.closest("button");

        if (!target) {
            return;
        }

        const card =
            target.closest(".request-card");

        if (!card) {
            return;
        }

        const patientId =
            card.dataset.patientId;

        const patientName =
            card.dataset.patientName;


        // -----------------------------------------
        // Accept & Schedule
        // -----------------------------------------

        if (target.classList.contains("schedule-btn")) {

            openScheduleModal(
                patientId,
                patientName
            );

            return;
        }


        // -----------------------------------------
        // Decline
        // -----------------------------------------

        if (target.classList.contains("decline-btn")) {

            const confirmed = confirm(
                `Are you sure you want to decline the request from ${patientName}?`
            );

            if (!confirmed) {
                return;
            }


            card.classList.add(
                "opacity-0",
                "transition-opacity",
                "duration-500"
            );


            setTimeout(() => {
                card.remove();
            }, 500);
        }
    }


    // =========================================================
    // SCHEDULE APPOINTMENT
    // =========================================================

    function handleScheduleSubmit(event) {

        event.preventDefault();


        const patientId =
            patientIdInput.value.trim();

        const patientName =
            patientNameInput.value.trim();

        const date =
            appointmentDateInput.value;

        const time =
            appointmentTimeInput.value;


        // -----------------------------------------
        // Validate form
        // -----------------------------------------

        if (!patientId ||
            !patientName ||
            !date ||
            !time) {

            alert(
                "Please select an appointment date and time."
            );

            return;
        }


        // -----------------------------------------
        // Validate appointment date/time
        // -----------------------------------------

        const appointmentDateTime =
            new Date(`${date}T${time}`);


        if (Number.isNaN(appointmentDateTime.getTime())) {

            alert(
                "Please enter a valid appointment date and time."
            );

            return;
        }


        // Prevent scheduling in the past.
        if (appointmentDateTime < new Date()) {

            alert(
                "Please select a future date and time."
            );

            return;
        }


        // -----------------------------------------
        // Create appointment card
        // -----------------------------------------

        const newAppointment =
            createAppointmentCard(
                patientId,
                patientName,
                date,
                time
            );


        upcomingAppointmentsContainer.appendChild(
            newAppointment
        );


        // -----------------------------------------
        // Remove empty state
        // -----------------------------------------

        if (appointmentsEmptyState) {
            appointmentsEmptyState.remove();
        }


        // -----------------------------------------
        // Update appointment status
        // -----------------------------------------

        updateAppointmentStatuses();


        // -----------------------------------------
        // Remove original request
        // -----------------------------------------

        const requestCard =
            pendingRequestsContainer.querySelector(
                `.request-card[data-patient-id="${CSS.escape(patientId)}"]`
            );


        if (requestCard) {

            requestCard.classList.add(
                "opacity-0",
                "transition-opacity",
                "duration-300"
            );

            setTimeout(() => {
                requestCard.remove();
            }, 300);
        }


        // -----------------------------------------
        // Close modal
        // -----------------------------------------

        closeScheduleModal();
    }


    // =========================================================
    // APPOINTMENT STATUS MANAGEMENT
    // =========================================================

    function updateAppointmentStatuses() {

        const now = new Date();


        document
            .querySelectorAll(".appointment-card")
            .forEach((card) => {

                const dateTimeString =
                    card.dataset.appointmentDatetime;


                if (!dateTimeString) {
                    return;
                }


                const appointmentTime =
                    new Date(dateTimeString);


                if (Number.isNaN(appointmentTime.getTime())) {
                    return;
                }


                // -----------------------------------------
                // Calculate active window
                // -----------------------------------------

                const startTime =
                    new Date(
                        appointmentTime.getTime() -
                        CALL_WINDOW_MINUTES_BEFORE * 60000
                    );


                const endTime =
                    new Date(
                        appointmentTime.getTime() +
                        CALL_WINDOW_MINUTES_AFTER * 60000
                    );


                const link =
                    card.querySelector(".video-call-link");

                const relativeTimeEl =
                    card.querySelector(".relative-time");


                if (!link) {
                    return;
                }


                // -----------------------------------------
                // Update relative time
                // -----------------------------------------

                if (relativeTimeEl) {

                    relativeTimeEl.textContent =
                        getRelativeTime(
                            appointmentTime,
                            now
                        );
                }


                // -----------------------------------------
                // ACTIVE
                // -----------------------------------------

                if (
                    now >= startTime &&
                    now <= endTime
                ) {

                    setActiveCallState(link);

                }


                // -----------------------------------------
                // EXPIRED / MISSED
                // -----------------------------------------

                else if (now > endTime) {

                    setExpiredCallState(link);

                }


                // -----------------------------------------
                // UPCOMING
                // -----------------------------------------

                else {

                    setUpcomingCallState(link);

                }

            });
    }


    // =========================================================
    // ACTIVE CALL STATE
    // =========================================================

    function setActiveCallState(link) {

        link.href = "/telemedicine";

        link.classList.remove(
            "bg-gray-300",
            "text-gray-500",
            "cursor-not-allowed",
            "bg-red-100",
            "text-red-700",
            "bg-green-500",
            "hover:bg-green-600",
            "shadow"
        );


        link.classList.add(
            "bg-green-500",
            "text-white",
            "hover:bg-green-600",
            "shadow"
        );


        link.innerHTML =
            `<i class="fa-solid fa-video mr-2"></i>
             Start Video Chat`;
    }


    // =========================================================
    // EXPIRED CALL STATE
    // =========================================================

    function setExpiredCallState(link) {

        link.href = "#";


        link.classList.remove(
            "bg-green-500",
            "hover:bg-green-600",
            "shadow",
            "bg-gray-300",
            "text-gray-500"
        );


        link.classList.add(
            "bg-red-100",
            "text-red-700",
            "cursor-not-allowed"
        );


        link.innerHTML =
            `<i class="fa-solid fa-circle-exclamation mr-2"></i>
             Call Missed`;
    }


    // =========================================================
    // UPCOMING CALL STATE
    // =========================================================

    function setUpcomingCallState(link) {

        link.href = "#";


        link.classList.remove(
            "bg-green-500",
            "hover:bg-green-600",
            "shadow",
            "bg-red-100",
            "text-red-700"
        );


        link.classList.add(
            "bg-gray-300",
            "text-gray-500",
            "cursor-not-allowed"
        );


        link.innerHTML =
            `<i class="fa-solid fa-video-slash mr-2"></i>
             Call not active yet`;
    }


    // =========================================================
    // CREATE APPOINTMENT CARD
    // =========================================================

    function createAppointmentCard(
        patientId,
        patientName,
        date,
        time
    ) {

        const card =
            document.createElement("div");


        // -----------------------------------------
        // Appointment Date
        // -----------------------------------------

        const appointmentDateTime =
            new Date(`${date}T${time}`);


        // -----------------------------------------
        // Card Configuration
        // -----------------------------------------

        card.className =
            "appointment-card bg-white rounded-2xl " +
            "border border-gray-100 shadow-sm p-5";


        // Store appointment information.
        card.dataset.appointmentDatetime =
            `${date}T${time}`;

        card.dataset.patientId =
            patientId;


        // -----------------------------------------
        // Format date/time
        // -----------------------------------------

        const formattedDate =
            appointmentDateTime.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }
            );


        const formattedTime =
            appointmentDateTime.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );


        // -----------------------------------------
        // Appointment Card HTML
        // -----------------------------------------

        card.innerHTML = `
            <div class="flex flex-col md:flex-row
                        md:items-center md:justify-between
                        gap-5">

                <div class="flex items-start gap-4">

                    <div
                        class="w-12 h-12 shrink-0
                               rounded-xl bg-green-100
                               text-green-600
                               flex items-center
                               justify-center"
                    >
                        <i class="fa-solid fa-calendar-check text-lg"></i>
                    </div>

                    <div>

                        <p class="font-bold text-lg text-gray-800">
                            ${escapeHtml(patientName)}
                        </p>

                        <p class="text-sm text-gray-500 mt-1">
                            Patient ID:
                            <span class="font-medium">
                                ${escapeHtml(patientId)}
                            </span>
                        </p>

                    </div>

                </div>


                <div class="text-left md:text-right">

                    <p class="font-semibold text-gray-800">
                        ${formattedDate}
                    </p>

                    <p class="text-sm text-gray-500 mt-1">
                        ${formattedTime}
                    </p>

                    <p
                        class="relative-time text-sm
                               text-gray-400 mt-1"
                    >
                        Calculating...
                    </p>

                </div>

            </div>


            <div class="mt-5">

                <a
                    href="#"
                    class="video-call-link w-full
                           text-center block
                           bg-gray-300 text-gray-500
                           font-bold py-3 px-6
                           rounded-xl cursor-not-allowed
                           transition-all duration-300"
                >
                    <i class="fa-solid fa-video-slash mr-2"></i>
                    Call not active yet
                </a>

            </div>
        `;


        return card;
    }


    // =========================================================
    // OPEN SCHEDULE MODAL
    // =========================================================

    function openScheduleModal(
        patientId,
        patientName
    ) {

        modalPatientName.textContent =
            patientName;

        patientIdInput.value =
            patientId;

        patientNameInput.value =
            patientName;


        const now =
            new Date();


        // -----------------------------------------
        // Today's date
        // -----------------------------------------

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");


        const today =
            `${year}-${month}-${day}`;


        appointmentDateInput.min =
            today;

        appointmentDateInput.value =
            today;


        // -----------------------------------------
        // Current time
        // -----------------------------------------

        const hours =
            String(now.getHours())
                .padStart(2, "0");

        const minutes =
            String(now.getMinutes())
                .padStart(2, "0");


        appointmentTimeInput.value =
            `${hours}:${minutes}`;


        // -----------------------------------------
        // Show modal
        // -----------------------------------------

        scheduleModal.classList.remove(
            "hidden"
        );


        // Prevent page scrolling behind modal.
        document.body.classList.add(
            "overflow-hidden"
        );


        // Focus date field.
        setTimeout(() => {
            appointmentDateInput.focus();
        }, 100);
    }


    // =========================================================
    // CLOSE SCHEDULE MODAL
    // =========================================================

    function closeScheduleModal() {

        scheduleModal.classList.add(
            "hidden"
        );


        document.body.classList.remove(
            "overflow-hidden"
        );


        scheduleForm.reset();
    }


    // =========================================================
    // RELATIVE TIME
    // =========================================================

    function getRelativeTime(
        targetDate,
        nowDate
    ) {

        const diff =
            targetDate.getTime() -
            nowDate.getTime();


        const afterWindow =
            CALL_WINDOW_MINUTES_AFTER * 60000;


        // Appointment is completely expired.
        if (diff < -afterWindow) {
            return "Expired";
        }


        // Appointment is currently active.
        if (diff < 0) {
            return "In progress";
        }


        const minutes =
            Math.floor(diff / 60000);


        const hours =
            Math.floor(minutes / 60);


        const days =
            Math.floor(hours / 24);


        if (days > 0) {

            return `in ${days} day${days > 1 ? "s" : ""}`;
        }


        if (hours > 0) {

            return `in ${hours} hour${hours > 1 ? "s" : ""}`;
        }


        if (minutes > 0) {

            return `in ${minutes} min${minutes > 1 ? "s" : ""}`;
        }


        return "Starting now";
    }


    // =========================================================
    // HTML ESCAPING
    // =========================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});