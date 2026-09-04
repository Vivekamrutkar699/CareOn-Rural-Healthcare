document.addEventListener("DOMContentLoaded", () => {
    const patientForm = document.getElementById("patientForm");
    const patientTableBody = document.getElementById("patientTableBody");
    const patientSearch = document.getElementById("patientSearch");
    const patientCount = document.getElementById("patientCount");

    const patientModal = document.getElementById("patientModal");
    const addPatientBtn = document.getElementById("addPatientBtn");
    const closePatientModal =
        document.getElementById("closePatientModal");
    const cancelPatientModal =
        document.getElementById("cancelPatientModal");

    const formMessage = document.getElementById("formMessage");
    const patientMessage = document.getElementById("patientMessage");
    const savePatientBtn = document.getElementById("savePatientBtn");

    let patients = [];

    async function loadPatients() {
        try {
            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <i class="fa-solid fa-spinner fa-spin text-blue-500 text-xl mb-3"></i>
                        <p>Loading patients...</p>
                    </td>
                </tr>
            `;

            const response = await fetch("/api/patients");
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load patients"
                );
            }

            patients = result.data;

            renderPatients(patients);
        } catch (error) {
            console.error("Load patients error:", error);

            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-red-500">
                        <i class="fa-solid fa-circle-exclamation text-xl mb-2"></i>
                        <p>Failed to load patients.</p>
                    </td>
                </tr>
            `;
        }
    }

    function calculateAge(dateOfBirth) {
        if (!dateOfBirth) {
            return "-";
        }

        const birthDate = new Date(dateOfBirth);

        if (Number.isNaN(birthDate.getTime())) {
            return "-";
        }

        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();

        const monthDifference =
            today.getMonth() - birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDate.getDate()
            )
        ) {
            age--;
        }

        return age >= 0 ? age : "-";
    }

    function renderPatients(patientList) {
        patientCount.textContent =
            `${patientList.length} Patient${patientList.length === 1 ? "" : "s"}`;

        if (patientList.length === 0) {
            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">

                        <div class="w-14 h-14 mx-auto mb-4
                                    rounded-full bg-blue-50
                                    flex items-center justify-center">

                            <i class="fa-solid fa-users
                                      text-blue-500 text-xl"></i>

                        </div>

                        <p class="font-medium text-gray-700">
                            No patients registered
                        </p>

                        <p class="text-sm text-gray-500 mt-1">
                            Add your first patient to get started.
                        </p>

                    </td>
                </tr>
            `;

            return;
        }

        patientTableBody.innerHTML = patientList.map(patient => `
            <tr class="hover:bg-gray-50 transition">

                <td class="px-6 py-4 whitespace-nowrap">

                    <span class="font-semibold text-blue-600">
                        ${escapeHtml(patient.patientId)}
                    </span>

                </td>


                <td class="px-6 py-4 whitespace-nowrap">

                    <div class="flex items-center gap-3">

                        <div class="w-10 h-10 rounded-full
                                    bg-blue-100
                                    flex items-center justify-center
                                    text-blue-600 font-semibold">

                            ${escapeHtml(patient.firstName.charAt(0).toUpperCase())}

                        </div>

                        <div>

                            <p class="font-medium text-gray-800">
                                ${escapeHtml(patient.firstName)}
                                ${escapeHtml(patient.lastName)}
                            </p>

                            <p class="text-xs text-gray-500">
                                ${escapeHtml(patient.email || "No email")}
                            </p>

                        </div>

                    </div>

                </td>


                <td class="px-6 py-4 text-gray-600">
                    ${calculateAge(patient.dateOfBirth)}
                </td>


                <td class="px-6 py-4">

                    <span class="inline-flex px-2.5 py-1
                                 rounded-full
                                 bg-gray-100 text-gray-700
                                 text-xs font-medium">

                        ${escapeHtml(patient.gender || "-")}

                    </span>

                </td>


                <td class="px-6 py-4 text-gray-600 whitespace-nowrap">

                    <div class="flex items-center gap-2">

                        <i class="fa-solid fa-phone
                                  text-gray-400 text-xs"></i>

                        ${escapeHtml(patient.phone)}

                    </div>

                </td>


                <td class="px-6 py-4">

                    <button
                        type="button"
                        class="view-patient-btn
                               inline-flex items-center gap-2
                               px-3 py-2
                               rounded-lg
                               border border-blue-200
                               text-blue-600
                               hover:bg-blue-50
                               transition"
                        data-patient-id="${escapeHtml(patient.id)}"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>

                </td>

            </tr>
        `).join("");
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function openModal() {
        patientModal.classList.remove("hidden");
        patientModal.classList.add("flex");

        document.body.classList.add("overflow-hidden");

        const firstInput =
            document.getElementById("patientId");

        if (firstInput) {
            firstInput.focus();
        }
    }

    function closeModal() {
        patientModal.classList.add("hidden");
        patientModal.classList.remove("flex");

        document.body.classList.remove("overflow-hidden");

        formMessage.innerHTML = "";
    }

    function showFormMessage(message, type = "danger") {
        formMessage.innerHTML = `
            <div class="mb-5 p-4 rounded-lg
                        ${type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"}">

                <div class="flex items-start gap-3">

                    <i class="fa-solid
                              ${type === "success"
                                  ? "fa-circle-check"
                                  : "fa-circle-exclamation"}
                              mt-0.5"></i>

                    <p class="text-sm">
                        ${escapeHtml(message)}
                    </p>

                </div>

            </div>
        `;
    }

    function showPatientMessage(message, type = "success") {
        patientMessage.innerHTML = `
            <div class="mb-4 p-4 rounded-lg
                        ${type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"}">

                <div class="flex items-center gap-3">

                    <i class="fa-solid
                              ${type === "success"
                                  ? "fa-circle-check"
                                  : "fa-circle-exclamation"}"></i>

                    <p class="text-sm">
                        ${escapeHtml(message)}
                    </p>

                </div>

            </div>
        `;

        setTimeout(() => {
            patientMessage.innerHTML = "";
        }, 3000);
    }

    async function handleAddPatient(event) {
        event.preventDefault();

        formMessage.innerHTML = "";

        const formData = new FormData(patientForm);

        const patientData = {
            patientId: formData.get("patientId").trim(),
            firstName: formData.get("firstName").trim(),
            lastName: formData.get("lastName").trim(),
            dateOfBirth: formData.get("dateOfBirth"),
            gender: formData.get("gender"),
            phone: formData.get("phone").trim(),
            email: formData.get("email").trim(),
            address: formData.get("address").trim(),
            bloodGroup: formData.get("bloodGroup"),
        };

        try {
            savePatientBtn.disabled = true;

            savePatientBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

            const response = await fetch("/api/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(patientData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                if (result.errors?.length) {
                    const messages = result.errors
                        .map(error => error.message)
                        .join(", ");

                    throw new Error(messages);
                }

                throw new Error(
                    result.message || "Failed to create patient"
                );
            }

            patientForm.reset();

            closeModal();

            await loadPatients();

            showPatientMessage(
                "Patient created successfully."
            );

        } catch (error) {
            console.error("Create patient error:", error);

            showFormMessage(error.message);

        } finally {
            savePatientBtn.disabled = false;

            savePatientBtn.innerHTML = `
                <i class="fa-solid fa-user-plus"></i>
                Save Patient
            `;
        }
    }

    function handleSearch() {
        const searchTerm =
            patientSearch.value.trim().toLowerCase();

        if (!searchTerm) {
            renderPatients(patients);
            return;
        }

        const filteredPatients = patients.filter(patient => {
            const fullName =
                `${patient.firstName} ${patient.lastName}`
                    .toLowerCase();

            const phone =
                (patient.phone || "").toLowerCase();

            const patientId =
                (patient.patientId || "").toLowerCase();

            return (
                fullName.includes(searchTerm) ||
                phone.includes(searchTerm) ||
                patientId.includes(searchTerm)
            );
        });

        renderPatients(filteredPatients);
    }

    async function viewPatient(id) {
        try {
            const response =
                await fetch(`/api/patients/${id}`);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to fetch patient"
                );
            }

            const patient = result.data;

            alert(
                `Patient: ${patient.firstName} ${patient.lastName}\n` +
                `Patient ID: ${patient.patientId}\n` +
                `Phone: ${patient.phone}\n` +
                `Email: ${patient.email || "-"}\n` +
                `Gender: ${patient.gender || "-"}\n` +
                `Blood Group: ${patient.bloodGroup || "-"}`
            );

        } catch (error) {
            console.error("View patient error:", error);

            showPatientMessage(
                error.message,
                "danger"
            );
        }
    }

    addPatientBtn.addEventListener("click", openModal);

    closePatientModal.addEventListener("click", closeModal);

    cancelPatientModal.addEventListener("click", closeModal);

    patientModal.addEventListener("click", event => {
        if (event.target === patientModal) {
            closeModal();
        }
    });

    patientForm.addEventListener(
        "submit",
        handleAddPatient
    );

    patientSearch.addEventListener(
        "input",
        handleSearch
    );

    patientTableBody.addEventListener("click", event => {
        const button =
            event.target.closest(".view-patient-btn");

        if (!button) {
            return;
        }

        viewPatient(button.dataset.patientId);
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !patientModal.classList.contains("hidden")
        ) {
            closeModal();
        }
    });

    loadPatients();
});