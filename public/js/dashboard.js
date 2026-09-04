document.addEventListener("DOMContentLoaded", () => {
    const totalPatientsElement =
        document.getElementById("totalPatients");

    async function loadDashboardStats() {
        try {
            const response = await fetch("/api/dashboard/stats");

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load dashboard statistics"
                );
            }

            totalPatientsElement.textContent =
                result.data.totalPatients;

        } catch (error) {
            console.error("Dashboard statistics error:", error);

            totalPatientsElement.textContent = "—";
        }
    }

    loadDashboardStats();
});