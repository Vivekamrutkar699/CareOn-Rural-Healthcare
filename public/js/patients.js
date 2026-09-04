document.addEventListener("DOMContentLoaded", () => {
    const patientForm = document.getElementById("patientForm");
    const patientTableBody = document.getElementById("patientTableBody");
    const patientSearch = document.getElementById("patientSearch");
    const patientCount = document.getElementById("patientCount");
    const formMessage = document.getElementById("formMessage");
    const patientMessage = document.getElementById("patientMessage");
    const savePatientBtn = document.getElementById("savePatientBtn");

    let patients = [];

    async function loadPatients() {
        try {
            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        Loading patients...
                    </td>
                </tr>
            `;

            const response = await fetch("/api/patients");
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to load patients");
            }

            patients = result.data;

            renderPatients(patients);
        } catch (error) {
            console.error("Load patients error:", error);

            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Failed to load patients.
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

        return age;
    }

    function renderPatients(patientList) {
        patientCount.textContent =
            `${patientList.length} Patient${patientList.length === 1 ? "" : "s"}`;

        if (patientList.length === 0) {
            patientTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        No patients registered yet.
                    </td>
                </tr>
            `;

            return;
        }

        patientTableBody.innerHTML = patientList.map(patient => `
            <tr>
                <td>
                    <strong>${escapeHtml(patient.patientId)}</strong>
                </td>

                <td>
                    ${escapeHtml(patient.firstName)}
                    ${escapeHtml(patient.lastName)}
                </td>

                <td>
                    ${calculateAge(patient.dateOfBirth)}
                </td>

                <td>
                    ${escapeHtml(patient.gender || "-")}
                </td>

                <td>
                    ${escapeHtml(patient.phone)}
                </td>

                <td>
                    <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="viewPatient('${patient.id}')"
                    >
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

    function showFormMessage(message, type = "danger") {
        formMessage.innerHTML = `
            <div class="alert alert-${type}">
                ${escapeHtml(message)}
            </div>
        `;
    }

    patientForm.addEventListener("submit", async (event) => {
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
            savePatientBtn.textContent = "Saving...";

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

            const modalElement =
                document.getElementById("patientModal");

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

            await loadPatients();

            patientMessage.innerHTML = `
                <div class="alert alert-success">
                    Patient created successfully.
                </div>
            `;

            setTimeout(() => {
                patientMessage.innerHTML = "";
            }, 3000);

        } catch (error) {
            console.error("Create patient error:", error);

            showFormMessage(error.message);
        } finally {
            savePatientBtn.disabled = false;
            savePatientBtn.textContent = "Save Patient";
        }
    });

    patientSearch.addEventListener("input", () => {
        const searchTerm =
            patientSearch.value.trim().toLowerCase();

        if (!searchTerm) {
            renderPatients(patients);
            return;
        }

        const filteredPatients = patients.filter(patient => {
            const fullName =
                `${patient.firstName} ${patient.lastName}`.toLowerCase();

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
    });

    window.viewPatient = async (id) => {
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
                `Gender: ${patient.gender || "-"}\n` +
                `Blood Group: ${patient.bloodGroup || "-"}`
            );

        } catch (error) {
            console.error("View patient error:", error);
            alert(error.message);
        }
    };

    loadPatients();
});