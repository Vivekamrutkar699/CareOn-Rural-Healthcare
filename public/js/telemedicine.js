document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    const CALL_WINDOW_MINUTES_BEFORE = 10;
    const CALL_WINDOW_MINUTES_AFTER = 60;

    // =========================================================
    // SOCKET.IO
    // =========================================================

    const socket = io();

    // =========================================================
    // WEBRTC VARIABLES & QUEUES
    // =========================================================

    let localStream = null;
    let peerConnection = null;
    let remoteStream = null;
    let localVideoElement = null;
    let remoteVideoElement = null;

    // Asynchronous signaling state & queue management
    let isInitializingMedia = false;
    let localMediaPromise = null;
    let pendingOffer = null;
    let iceCandidateQueue = [];

    // =========================================================
    // WEBRTC CONFIGURATION
    // =========================================================

    const rtcConfiguration = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    };

    // =========================================================
    // ROOM
    // =========================================================

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room");

    // =========================================================
    // SOCKET CONNECTION
    // =========================================================

    socket.on("connect", async () => {
        console.log("Connected to CareOn signaling server:", socket.id);

        if (roomId) {
            socket.emit("join-room", roomId);
            console.log("Joining telemedicine room:", roomId);
            await initializeLocalMedia();
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from CareOn signaling server");
        updateConnectionStatus("disconnected");
        closePeerConnection();
    });

    // =========================================================
    // USER JOINED (Existing peer initiates offer)
    // =========================================================

    socket.on("user-joined", async (data) => {
        console.log("Another user joined the room:", data.socketId);

        // If local media is not ready yet, wait for it before creating offer
        if (!localStream) {
            console.log("Local media not ready yet. Waiting before creating WebRTC offer...");
            try {
                await initializeLocalMedia();
            } catch (error) {
                console.error("Cannot create offer because local media failed:", error);
                return;
            }
        }

        // Avoid duplicate negotiation if peerConnection is already negotiating
        if (peerConnection && peerConnection.signalingState !== "stable" && peerConnection.signalingState !== "closed") {
            console.log("Peer connection is already negotiating; skipping duplicate offer.");
            return;
        }

        const pc = await createPeerConnection();

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log("Sending WebRTC offer...");
            socket.emit("offer", {
                roomId: roomId,
                offer: offer,
            });
        } catch (error) {
            console.error("Error creating WebRTC offer:", error);
        }
    });

    // =========================================================
    // RECEIVE OFFER (New peer receives offer, queues if media acquiring)
    // =========================================================

    socket.on("offer", async (data) => {
        console.log("WebRTC offer received.");

        if (!data || !data.offer) {
            return;
        }

        // If local media is not ready yet, queue the offer to avoid race condition
        if (!localStream) {
            console.log("Local media is not ready yet. Queuing offer until camera/mic completes...");
            pendingOffer = data;

            if (!isInitializingMedia) {
                initializeLocalMedia().catch((err) => {
                    console.error("Failed to initialize media for pending offer:", err);
                });
            }
            return;
        }

        // Local media is ready, handle offer immediately
        await handleOffer(data);
    });

    // =========================================================
    // HANDLE WEBRTC OFFER
    // =========================================================

    async function handleOffer(data) {
        console.log("Handling WebRTC offer from peer:", data.socketId);

        const pc = await createPeerConnection();

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log("Remote description set successfully (offer).");

            // Process any ICE candidates that arrived before remoteDescription was set
            await processQueuedCandidates();

            // Create and set local answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log("Sending WebRTC answer...");
            socket.emit("answer", {
                roomId: roomId,
                answer: answer,
            });
        } catch (error) {
            console.error("Error handling WebRTC offer:", error);
        }
    }

    // =========================================================
    // RECEIVE ANSWER
    // =========================================================

    socket.on("answer", async (data) => {
        console.log("WebRTC answer received.");

        if (!peerConnection) {
            console.error("Peer connection does not exist for received answer.");
            return;
        }

        if (!data || !data.answer) {
            return;
        }

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("Remote description set successfully (answer).");

            // Process any ICE candidates that arrived before answer arrived
            await processQueuedCandidates();
        } catch (error) {
            console.error("Error setting remote description from answer:", error);
        }
    });

    // =========================================================
    // RECEIVE ICE CANDIDATE
    // =========================================================

    socket.on("ice-candidate", async (data) => {
        console.log("ICE candidate received.");

        if (!data || !data.candidate) {
            return;
        }

        // Queue candidate if remote description is not set yet
        if (!peerConnection || !peerConnection.remoteDescription || !peerConnection.remoteDescription.type) {
            console.log("Queuing ICE candidate (peerConnection or remoteDescription not ready).");
            iceCandidateQueue.push(data.candidate);
            return;
        }

        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log("ICE candidate added.");
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    });

    // =========================================================
    // PROCESS QUEUED ICE CANDIDATES
    // =========================================================

    async function processQueuedCandidates() {
        if (!peerConnection || !peerConnection.remoteDescription) {
            return;
        }

        if (iceCandidateQueue.length === 0) {
            return;
        }

        console.log(`Processing ${iceCandidateQueue.length} queued ICE candidate(s)...`);
        const candidates = [...iceCandidateQueue];
        iceCandidateQueue = [];

        for (const candidate of candidates) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("Queued ICE candidate added successfully.");
            } catch (error) {
                console.error("Error adding queued ICE candidate:", error);
            }
        }
    }

    // =========================================================
    // INITIALIZE LOCAL MEDIA
    // =========================================================

    async function initializeLocalMedia() {
        if (localStream) {
            return localStream;
        }

        if (isInitializingMedia && localMediaPromise) {
            return localMediaPromise;
        }

        isInitializingMedia = true;

        localMediaPromise = (async () => {
            console.log("Requesting camera and microphone access...");

            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                console.log("Camera and microphone access granted.");
                createVideoInterface();

                if (localVideoElement) {
                    localVideoElement.srcObject = localStream;
                }

                console.log("Local video stream initialized.");

                // If a peer connection already exists, attach local tracks now
                if (peerConnection) {
                    localStream.getTracks().forEach((track) => {
                        const senders = peerConnection.getSenders ? peerConnection.getSenders() : [];
                        const alreadyAdded = senders.some((s) => s.track === track);
                        if (!alreadyAdded) {
                            peerConnection.addTrack(track, localStream);
                        }
                    });
                }

                // If an offer arrived while waiting for media, process it now
                if (pendingOffer) {
                    console.log("Processing pending WebRTC offer now that local media is ready...");
                    const offerToProcess = pendingOffer;
                    pendingOffer = null;
                    await handleOffer(offerToProcess);
                }

                return localStream;
            } catch (error) {
                console.error("Unable to access camera or microphone:", error);
                pendingOffer = null;
                showMediaError(error);
                throw error;
            } finally {
                isInitializingMedia = false;
            }
        })();

        return localMediaPromise;
    }

    // =========================================================
    // CREATE PEER CONNECTION
    // =========================================================

    async function createPeerConnection() {
        if (peerConnection && peerConnection.connectionState !== "closed") {
            return peerConnection;
        }

        console.log("Creating RTCPeerConnection...");
        peerConnection = new RTCPeerConnection(rtcConfiguration);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                const senders = peerConnection.getSenders ? peerConnection.getSenders() : [];
                const alreadyAdded = senders.some((s) => s.track === track);
                if (!alreadyAdded) {
                    peerConnection.addTrack(track, localStream);
                }
            });
        }

        // Create remote MediaStream
        remoteStream = new MediaStream();
        remoteVideoElement = document.getElementById("remote-video");
        if (remoteVideoElement) {
            remoteVideoElement.srcObject = remoteStream;
        }

        // Receive remote tracks
        peerConnection.ontrack = (event) => {
            console.log("Remote media track received:", event.track ? event.track.kind : "unknown");

            if (event.streams && event.streams[0]) {
                event.streams[0].getTracks().forEach((track) => {
                    if (!remoteStream.getTracks().includes(track)) {
                        remoteStream.addTrack(track);
                    }
                });
            } else if (event.track) {
                if (!remoteStream.getTracks().includes(event.track)) {
                    remoteStream.addTrack(event.track);
                }
            }

            if (!remoteVideoElement) {
                remoteVideoElement = document.getElementById("remote-video");
            }
            if (remoteVideoElement && remoteVideoElement.srcObject !== remoteStream) {
                remoteVideoElement.srcObject = remoteStream;
            }

            updateConnectionStatus("connected");
        };

        // ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate...");
                socket.emit("ice-candidate", {
                    roomId: roomId,
                    candidate: event.candidate,
                });
            }
        };

        // Connection state
        peerConnection.onconnectionstatechange = () => {
            console.log("WebRTC connection state:", peerConnection.connectionState);
            updateConnectionStatus(peerConnection.connectionState);

            if (peerConnection.connectionState === "failed") {
                console.error("WebRTC connection failed.");
            }
        };

        // ICE connection state
        peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", peerConnection.iceConnectionState);
        };

        return peerConnection;
    }

    // =========================================================
    // CLOSE PEER CONNECTION
    // =========================================================

    function closePeerConnection() {
        if (peerConnection) {
            peerConnection.onicecandidate = null;
            peerConnection.ontrack = null;
            peerConnection.onconnectionstatechange = null;
            peerConnection.oniceconnectionstatechange = null;
            peerConnection.close();
            peerConnection = null;
        }

        iceCandidateQueue = [];
        pendingOffer = null;
        console.log("Peer connection closed and queues cleared.");
    }

    // =========================================================
    // VIDEO INTERFACE
    // =========================================================

    function createVideoInterface() {
        if (document.getElementById("webrtc-video-section")) {
            return;
        }

        const section = document.createElement("section");
        section.id = "webrtc-video-section";
        section.className = "mb-8";
        section.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                            <i class="fa-solid fa-video"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Video Consultation</h2>
                            <p class="text-sm text-gray-500 mt-1">Peer-to-peer video consultation</p>
                        </div>
                    </div>
                    <span id="webrtc-status" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-600 text-sm font-semibold">
                        <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                        Waiting for participant
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Remote video -->
                    <div class="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                        <video id="remote-video" autoplay playsinline class="w-full h-full object-cover"></video>
                        <div class="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm font-medium">Remote</div>
                        <div id="remote-placeholder" class="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div class="text-center">
                                <i class="fa-solid fa-user text-4xl mb-3"></i>
                                <p>Waiting for participant...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Local video -->
                    <div class="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                        <video id="local-video" autoplay playsinline muted class="w-full h-full object-cover"></video>
                        <div class="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm font-medium">You</div>
                    </div>
                </div>

                <div class="mt-5 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <i class="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                    <p class="text-sm text-blue-700 leading-relaxed">
                        CareOn uses WebRTC for peer-to-peer audio and video communication. Socket.IO is used only for signaling.
                    </p>
                </div>
            </div>
        `;

        const mainContainer = document.querySelector(".max-w-6xl");
        if (mainContainer) {
            mainContainer.prepend(section);
        } else {
            document.body.prepend(section);
        }

        localVideoElement = document.getElementById("local-video");
        remoteVideoElement = document.getElementById("remote-video");
    }

    // =========================================================
    // CONNECTION STATUS
    // =========================================================

    function updateConnectionStatus(status) {
        const statusElement = document.getElementById("webrtc-status");
        if (!statusElement) {
            return;
        }

        const labels = {
            connected: "Connected",
            connecting: "Connecting...",
            new: "Connecting...",
            checking: "Checking connection...",
            disconnected: "Disconnected",
            failed: "Connection failed",
            closed: "Call ended",
        };

        const label = labels[status] || "Waiting for participant";
        statusElement.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-current"></span>
            ${label}
        `;

        if (status === "connected") {
            const placeholder = document.getElementById("remote-placeholder");
            if (placeholder) {
                placeholder.style.display = "none";
            }
        }
    }

    // =========================================================
    // MEDIA ERROR
    // =========================================================

    function showMediaError(error) {
        let message = "Unable to access your camera or microphone.";

        if (error.name === "NotAllowedError") {
            message = "Camera and microphone permission was denied. Please allow access and try again.";
        } else if (error.name === "NotFoundError") {
            message = "No camera or microphone was found.";
        } else if (error.name === "NotReadableError") {
            message = "Your camera or microphone may already be in use.";
        }

        const errorElement = document.createElement("div");
        errorElement.className = "fixed bottom-5 right-5 z-50 max-w-md bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg";
        errorElement.innerHTML = `
            <div class="flex items-start gap-3">
                <i class="fa-solid fa-triangle-exclamation text-red-500"></i>
                <div>
                    <p class="font-semibold text-red-800">Camera/Microphone Error</p>
                    <p class="text-sm text-red-700 mt-1">${escapeHtml(message)}</p>
                </div>
            </div>
        `;

        document.body.appendChild(errorElement);
        setTimeout(() => {
            errorElement.remove();
        }, 6000);
    }

    // =========================================================
    // STOP MEDIA
    // =========================================================

    function stopLocalMedia() {
        if (!localStream) {
            return;
        }

        localStream.getTracks().forEach((track) => {
            track.stop();
        });
        localStream = null;
        console.log("Local media stopped.");
    }

    // =========================================================
    // CLEANUP
    // =========================================================

    window.addEventListener("beforeunload", () => {
        if (peerConnection) {
            peerConnection.close();
        }
        stopLocalMedia();
    });

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