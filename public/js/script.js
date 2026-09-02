document.addEventListener('DOMContentLoaded', () => {
    console.log('PrepAI Frontend Loaded');

    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log(`Navigating to ${e.target.innerText}`);
        });
    });
});