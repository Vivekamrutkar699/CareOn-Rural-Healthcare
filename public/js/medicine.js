document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ASHA IMAGE SLIDER
    // =========================================================

    const slides =
        document.querySelectorAll("#asha-slider .slide");

    const prevBtn =
        document.getElementById("prev-slide");

    const nextBtn =
        document.getElementById("next-slide");

    const indicatorsContainer =
        document.getElementById("slide-indicators");

    let currentSlide = 0;
    let slideInterval;


    function showSlide(index) {

        if (!slides.length) {
            return;
        }

        currentSlide =
            (index + slides.length) % slides.length;


        slides.forEach((slide, i) => {

            slide.style.opacity =
                i === currentSlide ? "1" : "0";
        });


        updateIndicators();
    }


    function nextSlide() {
        showSlide(currentSlide + 1);
    }


    function prevSlide() {
        showSlide(currentSlide - 1);
    }


    function startSlider() {

        stopSlider();

        slideInterval =
            setInterval(nextSlide, 5000);
    }


    function stopSlider() {

        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }


    function createIndicators() {

        if (!indicatorsContainer) {
            return;
        }

        indicatorsContainer.innerHTML = "";

        slides.forEach((_, index) => {

            const indicator =
                document.createElement("button");

            indicator.type = "button";

            indicator.setAttribute(
                "aria-label",
                `Go to slide ${index + 1}`
            );

            indicator.className =
                "slide-indicator w-2 h-2 rounded-full " +
                "bg-white/50 transition-all duration-300";


            indicator.addEventListener(
                "click",
                () => {

                    stopSlider();

                    showSlide(index);

                    startSlider();
                }
            );


            indicatorsContainer.appendChild(
                indicator
            );
        });
    }


    function updateIndicators() {

        if (!indicatorsContainer) {
            return;
        }

        const indicators =
            indicatorsContainer.querySelectorAll(
                ".slide-indicator"
            );


        indicators.forEach((indicator, index) => {

            if (index === currentSlide) {

                indicator.classList.remove(
                    "bg-white/50",
                    "w-2"
                );

                indicator.classList.add(
                    "bg-white",
                    "w-6"
                );

            } else {

                indicator.classList.remove(
                    "bg-white",
                    "w-6"
                );

                indicator.classList.add(
                    "bg-white/50",
                    "w-2"
                );
            }
        });
    }


    if (slides.length > 0) {

        createIndicators();

        showSlide(0);

        startSlider();


        if (prevBtn) {

            prevBtn.addEventListener(
                "click",
                () => {

                    stopSlider();

                    prevSlide();

                    startSlider();
                }
            );
        }


        if (nextBtn) {

            nextBtn.addEventListener(
                "click",
                () => {

                    stopSlider();

                    nextSlide();

                    startSlider();
                }
            );
        }


        const slider =
            document.getElementById("asha-slider");


        if (slider) {

            slider.addEventListener(
                "mouseenter",
                stopSlider
            );

            slider.addEventListener(
                "mouseleave",
                startSlider
            );
        }
    }


    // =========================================================
    // LOCATION DATA
    // =========================================================

    const locationData = {

        Maharashtra: {

            Pune: [
                "Haveli",
                "Maval",
                "Khed"
            ],

            Satara: [
                "Karad",
                "Patan",
                "Wai"
            ]
        }
    };


    // =========================================================
    // ASHA WORKER DATA
    // =========================================================

    const ashaData = [

        {
            name: "Sunita Pawar",
            state: "Maharashtra",
            district: "Pune",
            block: "Haveli",
            village: "Wagholi",
            phone: "9876543210",
            photo:
                "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=1887&auto=format&fit=crop"
        },

        {
            name: "Priya Jadhav",
            state: "Maharashtra",
            district: "Pune",
            block: "Haveli",
            village: "Manjri",
            phone: "9876543211",
            photo:
                "https://images.unsplash.com/photo-1542596594-649ed6e6b342?q=80&w=1887&auto=format&fit=crop"
        },

        {
            name: "Anita Kulkarni",
            state: "Maharashtra",
            district: "Pune",
            block: "Maval",
            village: "Lonavala",
            phone: "9876543212",
            photo:
                "https://images.unsplash.com/photo-1604928141068-a2ac898a843a?q=80&w=1887&auto=format&fit=crop"
        },

        {
            name: "Meena Deshmukh",
            state: "Maharashtra",
            district: "Satara",
            block: "Karad",
            village: "Oglewadi",
            phone: "9876543213",
            photo:
                "https://images.unsplash.com/photo-1621784563814-1b6b1de41a1a?q=80&w=1887&auto=format&fit=crop"
        }
    ];


    // =========================================================
    // DOM ELEMENTS
    // =========================================================

    const stateSelect =
        document.getElementById("state-select");

    const districtSelect =
        document.getElementById("district-select");

    const blockSelect =
        document.getElementById("block-select");

    const villageSearch =
        document.getElementById("village-search");

    const searchBtn =
        document.getElementById("search-btn");

    const nearMeBtn =
        document.getElementById("near-me-btn");

    const resultsContainer =
        document.getElementById(
            "asha-results-container"
        );


    // =========================================================
    // STATE CHANGE
    // =========================================================

    if (stateSelect) {

        stateSelect.addEventListener(
            "change",
            () => {

                const state =
                    stateSelect.value;


                districtSelect.innerHTML =
                    `<option value="">
                        Select District
                    </option>`;

                blockSelect.innerHTML =
                    `<option value="">
                        Select Block
                    </option>`;


                districtSelect.disabled =
                    true;

                blockSelect.disabled =
                    true;

                villageSearch.disabled =
                    true;


                if (
                    state &&
                    locationData[state]
                ) {

                    Object.keys(
                        locationData[state]
                    ).forEach((district) => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            district;

                        option.textContent =
                            district;

                        districtSelect.appendChild(
                            option
                        );
                    });


                    districtSelect.disabled =
                        false;
                }
            }
        );
    }


    // =========================================================
    // DISTRICT CHANGE
    // =========================================================

    if (districtSelect) {

        districtSelect.addEventListener(
            "change",
            () => {

                const state =
                    stateSelect.value;

                const district =
                    districtSelect.value;


                blockSelect.innerHTML =
                    `<option value="">
                        Select Block
                    </option>`;


                blockSelect.disabled =
                    true;

                villageSearch.disabled =
                    true;


                if (
                    district &&
                    locationData[state] &&
                    locationData[state][district]
                ) {

                    locationData[state][district]
                        .forEach((block) => {

                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                block;

                            option.textContent =
                                block;

                            blockSelect.appendChild(
                                option
                            );
                        });


                    blockSelect.disabled =
                        false;

                    villageSearch.disabled =
                        false;
                }
            }
        );
    }


    // =========================================================
    // SEARCH
    // =========================================================

    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            searchAshaWorkers
        );
    }


    function searchAshaWorkers() {

        const filters = {

            state:
                stateSelect.value,

            district:
                districtSelect.value,

            block:
                blockSelect.value,

            village:
                villageSearch.value
                    .trim()
                    .toLowerCase()
        };


        const filteredResults =
            ashaData.filter((asha) => {

                const matchesState =
                    !filters.state ||
                    asha.state === filters.state;


                const matchesDistrict =
                    !filters.district ||
                    asha.district === filters.district;


                const matchesBlock =
                    !filters.block ||
                    asha.block === filters.block;


                const matchesVillage =
                    !filters.village ||
                    asha.village
                        .toLowerCase()
                        .includes(filters.village);


                return (
                    matchesState &&
                    matchesDistrict &&
                    matchesBlock &&
                    matchesVillage
                );
            });


        renderResults(filteredResults);
    }


    // =========================================================
    // RENDER ASHA RESULTS
    // =========================================================

    function renderResults(results) {

        if (!resultsContainer) {
            return;
        }


        resultsContainer.innerHTML = "";


        if (results.length === 0) {

            resultsContainer.innerHTML = `
                <div
                    class="border border-dashed
                           border-gray-300
                           rounded-xl p-8
                           text-center"
                >

                    <div
                        class="w-12 h-12 mx-auto
                               rounded-full
                               bg-gray-100
                               text-gray-400
                               flex items-center
                               justify-center"
                    >
                        <i class="fa-solid fa-user-slash"></i>
                    </div>

                    <h3
                        class="font-semibold
                               text-gray-700 mt-3"
                    >
                        No ASHA workers found
                    </h3>

                    <p
                        class="text-sm text-gray-400
                               mt-1"
                    >
                        Try changing your search criteria.
                    </p>

                </div>
            `;

            return;
        }


        const resultsHeader =
            document.createElement("div");

        resultsHeader.className =
            "flex items-center justify-between mb-4";


        resultsHeader.innerHTML = `
            <p class="text-sm text-gray-500">
                Found
                <span class="font-semibold text-gray-700">
                    ${results.length}
                </span>
                ASHA worker${results.length > 1 ? "s" : ""}
            </p>
        `;


        resultsContainer.appendChild(
            resultsHeader
        );


        const cardsContainer =
            document.createElement("div");

        cardsContainer.className =
            "grid grid-cols-1 md:grid-cols-2 gap-4";


        results.forEach((asha) => {

            const card =
                document.createElement("div");

            card.className =
                "bg-gray-50 rounded-xl " +
                "border border-gray-200 p-4 " +
                "hover:shadow-sm transition";


            card.innerHTML = `
                <div
                    class="flex items-center
                           justify-between gap-4"
                >

                    <div class="flex items-center gap-4">

                        <img
                            src="${escapeHtml(asha.photo)}"
                            alt="${escapeHtml(asha.name)}"
                            class="w-14 h-14
                                   rounded-full
                                   object-cover
                                   border-2
                                   border-white
                                   shadow-sm"
                        >

                        <div>

                            <h3
                                class="font-bold
                                       text-gray-800"
                            >
                                ${escapeHtml(asha.name)}
                            </h3>

                            <p
                                class="text-sm
                                       text-gray-500 mt-1"
                            >
                                ${escapeHtml(asha.village)},
                                ${escapeHtml(asha.block)}
                            </p>

                            <p
                                class="text-xs
                                       text-gray-400 mt-1"
                            >
                                ${escapeHtml(asha.district)},
                                ${escapeHtml(asha.state)}
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        data-phone="${escapeHtml(asha.phone)}"
                        data-name="${escapeHtml(asha.name)}"
                        class="call-btn shrink-0
                               w-10 h-10 rounded-xl
                               bg-green-100
                               text-green-600
                               hover:bg-green-600
                               hover:text-white
                               transition
                               flex items-center
                               justify-center"
                        title="Call ${escapeHtml(asha.name)}"
                    >
                        <i class="fa-solid fa-phone"></i>
                    </button>

                </div>
            `;


            cardsContainer.appendChild(card);
        });


        resultsContainer.appendChild(
            cardsContainer
        );
    }


    // =========================================================
    // CALL ASHA WORKER
    // =========================================================

    if (resultsContainer) {

        resultsContainer.addEventListener(
            "click",
            (event) => {

                const callButton =
                    event.target.closest(
                        ".call-btn"
                    );


                if (!callButton) {
                    return;
                }


                const phone =
                    callButton.dataset.phone;

                const name =
                    callButton.dataset.name;


                const confirmed =
                    confirm(
                        `Do you want to call ${name}?`
                    );


                if (confirmed) {

                    window.location.href =
                        `tel:${phone}`;
                }
            }
        );
    }


    // =========================================================
    // NEAR ME
    // =========================================================

    if (nearMeBtn) {

        nearMeBtn.addEventListener(
            "click",
            handleNearMe
        );
    }


    function handleNearMe() {

        if (!navigator.geolocation) {

            alert(
                "Location services are not supported by this browser."
            );

            return;
        }


        nearMeBtn.disabled = true;

        nearMeBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Finding nearby workers...
        `;


        navigator.geolocation.getCurrentPosition(
            (position) => {

                /*
                 * The current demo ASHA directory does not yet
                 * contain geographic coordinates.
                 *
                 * We therefore do not pretend to calculate
                 * actual distance here.
                 */

                alert(
                    "Your location was detected. " +
                    "Location-based ASHA matching will be connected " +
                    "when the healthcare directory backend is implemented."
                );


                resetNearMeButton();
            },

            () => {

                alert(
                    "Unable to access your location. " +
                    "Please allow location access and try again."
                );


                resetNearMeButton();
            }
        );
    }


    function resetNearMeButton() {

        nearMeBtn.disabled = false;

        nearMeBtn.innerHTML = `
            <i class="fa-solid fa-location-crosshairs"></i>
            Near Me
        `;
    }


    // =========================================================
    // HEALTHCARE PARTNERS
    // =========================================================

    const partners = [

        {
            name: "Basic Healthcare Services",
            description:
                "A non-profit organization focused on providing affordable primary healthcare to underserved rural communities.",
            website:
                "https://www.bhs.org.in/",
            icon:
                "fa-solid fa-house-medical"
        },

        {
            name: "Aravind Eye Care System",
            description:
                "An organization working to make quality eye care accessible through high-volume and community-focused healthcare services.",
            website:
                "https://aravind.org/",
            icon:
                "fa-solid fa-eye"
        },

        {
            name: "Foundation for Medical Research",
            description:
                "An organization working on public health challenges including infectious diseases and community-based interventions.",
            website:
                "https://fmrindia.org/",
            icon:
                "fa-solid fa-microscope"
        },

        {
            name: "Swasthya Swaraj",
            description:
                "A healthcare initiative focused on improving access to comprehensive healthcare for tribal communities.",
            website:
                "https://swasthyaswaraj.org/",
            icon:
                "fa-solid fa-people-group"
        },

        {
            name: "SEARCH, Gadchiroli",
            description:
                "A community health organization known for research and healthcare interventions in rural and tribal communities.",
            website:
                 "https://searchforhealth.ngo/",
            icon:
                "fa-solid fa-stethoscope"
        },

        {
            name: "Antara Foundation",
            description:
                "Works to strengthen public health delivery and improve maternal and child health outcomes.",
            website:
                "https://www.antara-foundation.org/",
            icon:
                "fa-solid fa-child-reaching"
        },

        {
            name: "ARMMAN",
            description:
                "Uses technology-driven solutions to provide health information and support to women and children.",
            website:
                "https://armman.org/",
            icon:
                "fa-solid fa-mobile-screen-button"
        },

        {
            name: "Seva Mandir",
            description:
                "Works on integrated rural development including health, education, livelihoods, and community participation.",
            website:
                "https://www.sevamandir.org/",
            icon:
                "fa-solid fa-hand-holding-heart"
        },

        {
            name: "Piramal Swasthya",
            description:
                "Provides public primary healthcare initiatives including technology-enabled and community-based healthcare services.",
            website:
                "https://www.piramalswasthya.org/",
            icon:
                "fa-solid fa-hospital"
        }
    ];


    renderPartners(partners);


    function renderPartners(partnerList) {

        const container =
            document.getElementById(
                "partner-container"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        partnerList.forEach((partner) => {

            const card =
                document.createElement("div");


            card.className =
                "bg-white rounded-2xl " +
                "border border-gray-100 " +
                "shadow-sm p-6 " +
                "hover:shadow-md hover:-translate-y-1 " +
                "transition duration-300 ";


            card.innerHTML = `
                <div
                    class="w-12 h-12 rounded-xl
                           bg-blue-100
                           text-blue-600
                           flex items-center
                           justify-center mb-4"
                >
                    <i class="${partner.icon} text-lg"></i>
                </div>


                <h3
                    class="text-lg font-bold
                           text-gray-800 mb-2"
                >
                    ${escapeHtml(partner.name)}
                </h3>


                <p
                    class="text-sm text-gray-500
                           leading-relaxed mb-5"
                >
                    ${escapeHtml(partner.description)}
                </p>


                <a
                    href="${escapeHtml(partner.website)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center
                           gap-2 text-sm
                           font-semibold text-blue-600
                           hover:text-blue-700"
                >
                    Visit Website
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                </a>
            `;


            container.appendChild(card);
        });
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