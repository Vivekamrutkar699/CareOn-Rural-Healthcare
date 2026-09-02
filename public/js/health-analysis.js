document.addEventListener('DOMContentLoaded', () => {
    // --- Get all necessary elements from the page ---
    const selectionScreen = document.getElementById('selection-screen');
    const uploadScreen = document.getElementById('upload-screen');
    const analyzeSkinBtn = document.getElementById('analyze-skin-btn');
    const analyzeReportBtn = document.getElementById('analyze-report-btn');
    
    const analysisTypeInput = document.getElementById('analysis-type');
    const imageDropArea = document.getElementById('image-drop-area');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const placeholder = document.getElementById('placeholder');
    const fileNameDisplay = document.getElementById('file-name');
    const analyzeBtn = document.getElementById('analyze-btn');

    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const errorContainer = document.getElementById('error-container');

    let uploadedFile = null;

    // --- Function to set up the uploader ---
    const setupUploader = (type, title) => {
        analysisTypeInput.value = type;
        document.getElementById('page-title').textContent = title;
        document.getElementById('page-subtitle').textContent = 'Upload an image for analysis.';
        selectionScreen.classList.add('hidden');
        uploadScreen.classList.remove('hidden');
    };

    // --- Event Listeners for initial choice ---
    analyzeSkinBtn.addEventListener('click', () => setupUploader('skin', 'Skin Condition Analysis'));
    analyzeReportBtn.addEventListener('click', () => setupUploader('report', 'Medical Report Analysis'));

    // --- Event Listeners for Image Upload ---
    imageDropArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    // Drag and Drop functionality
    imageDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropArea.classList.add('border-blue-500', 'bg-blue-50');
    });
    imageDropArea.addEventListener('dragleave', () => {
        imageDropArea.classList.remove('border-blue-500', 'bg-blue-50');
    });
    imageDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropArea.classList.remove('border-blue-500', 'bg-blue-50');
        handleFile(e.dataTransfer.files[0]);
    });

    // --- File Handling Logic ---
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            uploadedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
            fileNameDisplay.textContent = file.name;
            analyzeBtn.disabled = false;
        } else {
            alert('Please select a valid image file.');
        }
    }

    // --- EDITED CHANGE: Analysis Button Click Handler with Better Error Handling ---
    analyzeBtn.addEventListener('click', async () => {
        if (!uploadedFile) return;

        // Reset UI
        uploadScreen.classList.add('hidden');
        loader.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');

        // Prepare data to send to the backend
        const formData = new FormData();
        formData.append('healthImage', uploadedFile);
        formData.append('analysisType', analysisTypeInput.value);

        try {
            // Send the image and analysis type to the new backend route
            const response = await fetch('/analyze-health-image', {
                method: 'POST',
                body: formData,
            });

            // Check if the server responded with an error status (e.g., 400, 500)
            if (!response.ok) {
                // Try to get a specific error message from the server's response
                let serverError = 'An unknown server error occurred.';
                try {
                    const errorResult = await response.json();
                    serverError = errorResult.error || `Server responded with status: ${response.status}`;
                } catch (e) {
                    // Fallback if the server's error response isn't valid JSON
                    serverError = `Server responded with a non-JSON error (status: ${response.status}). Check the server logs.`;
                }
                // Throw an error to be caught by the catch block below
                throw new Error(serverError);
            }

            const result = await response.json();
            loader.classList.add('hidden');

            if (result.success) {
                // Display the analysis from Gemini
                // Convert Markdown to HTML for better rendering
                resultText.innerHTML = result.analysis
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                    .replace(/\n/g, '<br>'); // Newlines
                resultContainer.classList.remove('hidden');
            } else {
                // This handles errors sent back in a successful response (e.g., Gemini error)
                throw new Error(result.error || 'The server returned an unsuccessful response.');
            }

        } catch (err) {
            // This single catch block now handles both network errors and server errors
            console.error('Error during analysis:', err);
            loader.classList.add('hidden');
            // Display the more specific error message
            errorContainer.textContent = err.message || 'Failed to connect to the server. Please try again.';
            errorContainer.classList.remove('hidden');
            uploadScreen.classList.remove('hidden'); // Show uploader again so the user can retry
        }
    });
});
