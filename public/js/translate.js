// This function is required by the Google Translate API and is called automatically when the API is ready.
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en', // The default language of your website
        // We include the languages we want to support.
        includedLanguages: 'en,hi,mr',
        // We use a custom layout to hide the default Google Translate banner.
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element'); // This links the service to our hidden div.
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for the custom language dropdown ---
    const dropdownButton = document.getElementById('language-dropdown-button');
    const dropdownMenu = document.getElementById('language-dropdown-menu');
    const languageLinks = dropdownMenu.querySelectorAll('a');

    // --- Logic to show/hide the dropdown menu ---
    dropdownButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
    });

    // Close the dropdown if the user clicks outside of it
    document.addEventListener('click', (event) => {
        if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // --- Logic to handle language selection ---
    languageLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Get the language code (e.g., 'en', 'hi') from the data-lang attribute.
            const lang = this.dataset.lang;
            
            // Find the hidden Google Translate dropdown menu.
            const googleTranslateSelect = document.querySelector('.goog-te-combo');
            
            if (googleTranslateSelect) {
                // Set the value of the Google dropdown to the selected language.
                googleTranslateSelect.value = lang;
                // Trigger a 'change' event to make the Google Translate API perform the translation.
                googleTranslateSelect.dispatchEvent(new Event('change'));
            }
            
            // Hide our custom dropdown menu after selection.
            dropdownMenu.classList.add('hidden');
        });
    });
});
