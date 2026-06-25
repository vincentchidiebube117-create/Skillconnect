// ==========================================================================
// FIREBASE API INITIALIZATION CONFIGURATION
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc,
    onSnapshot, 
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Put your real production project credentials here:
const firebaseConfig = {
    apiKey: "AIzaSyCAm9c9vVJhx1WQO4lmT1VNc2gpa2Np938",
    authDomain: "skillconnectrefpage.firebaseapp.com",
    projectId: "skillconnectrefpage",
    storageBucket: "skillconnectrefpage.firebasestorage.app",
    messagingSenderId: "807369765496",
    appId: "1:807369765496:web:4e1e71149dcdc7511d338d",
    measurementId: "G-9JXE9GK9E4"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ==========================================================================
// FIRST COMPONENT: HEADER, STICKY & ACTIVE NAVIGATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements Declarations
    const header = document.getElementById('site-header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const closeMenuElements = document.querySelectorAll('[data-close-menu]');
    const sections = document.querySelectorAll('main section');

    /* ==========================================================================
       1. STICKY HEADER LOGIC
       ========================================================================== */
    const handleStickyHeader = () => {
        if (window.scrollY > 20) {
            header.classList.add('is-sticky');
        } else {
            header.classList.remove('is-sticky');
        }
    };

    window.addEventListener('scroll', handleStickyHeader, { passive: true });


    /* ==========================================================================
       2. MOBILE MENU TOGGLE LOGIC
       ========================================================================== */
    const toggleMenu = () => {
        const isOpen = document.body.classList.toggle('menu-is-open');
        mobileToggle.setAttribute('aria-expanded', isOpen);
    };

    const closeMenu = () => {
        document.body.classList.remove('menu-is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMenu);
    }
    
    closeMenuElements.forEach(element => {
        element.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-is-open')) {
            closeMenu();
            mobileToggle.focus();
        }
    });


    /* ==========================================================================
       3. INTERSECTION OBSERVER FOR ACTIVE LINKS
       ========================================================================== */
    const observerOptions = {
        root: null, 
        rootMargin: '-80px 0px -60px 0px', 
        threshold: 0.2 
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.classList.remove('active');
                        link.removeAttribute('aria-current');
                    }
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            closeMenu();
        });
    });
});


// ==========================================================================
// SECOND COMPONENT: COUNTERS, ANIMATIONS, AND HOVER GLOWS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. ANIMATED COUNTERS LOGIC
       ========================================================================== */
    const runCounters = () => {
        const counters = document.querySelectorAll('.stat-number');
        const speed = 120; 

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = Math.ceil(target / speed);

                if (count < target) {
                    counter.innerText = count + increment > target ? target : count + increment;
                    setTimeout(updateCount, 25);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };


    /* ==========================================================================
       2. SCROLL ANIMS INTERSECTION OBSERVER SETUP
       ========================================================================== */
    const animItems = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    const statSection = document.getElementById('statistics');
    let countersFired = false;

    const observerOptions = {
        root: null, 
        rootMargin: '0px 0px -80px 0px', 
        threshold: 0.1
    };

    const generalObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                
                if (!countersFired && statSection && entry.target.closest('#statistics')) {
                    runCounters();
                    countersFired = true;
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animItems.forEach(item => generalObserver.observe(item));


    /* ==========================================================================
       3. INTERACTIVE MOUSE-MOVE GLOW EFFECTS (CARD TRANSITIONS)
       ========================================================================== */
    const features = document.querySelectorAll('.feature-card, .team-card');

    features.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0px)';
        });
    });
});


// ==========================================================================
// THIRD COMPONENT: REVIEWS TESTIMONIAL WRITE & LIVE STREAM REVIEWS ENGINE
// ==========================================================================
window.SkillConnectDB = db;

document.addEventListener('DOMContentLoaded', () => {
    const testimonialForm = document.getElementById('testimonial-form');
    const formAlertMsg = document.getElementById('form-alert-msg');
    const submitBtn = document.getElementById('submit-review-btn');
    const testimonialsContainer = document.getElementById('testimonials-container-grid'); // Target container for displaying cards

    /* 1. WRITE FUNCTION: CAPTURES & SENDS SUBMISSIONS WITH AUTOMATIC AVATAR INITIALS */
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Saving testimonial data...</span>';
            formAlertMsg.classList.add('hidden');

            const fullName = document.getElementById('review-fullname').value.trim();
            const username = document.getElementById('review-username').value.trim();
            const email = document.getElementById('review-email').value.trim();
            const reviewMessage = document.getElementById('review-message').value.trim();
            
            const selectedStarElement = document.querySelector('input[name="form-stars"]:checked');
            const ratingValue = selectedStarElement ? parseInt(selectedStarElement.value) : 5;

            // Generate initials avatar directly matching your brand theme palette
            const generatedAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563EB&color=ffffff&bold=true&size=128&rounded=true`;

            try {
                await addDoc(collection(db, "testimonial"), {
                    fullname: fullName,
                    username: username,
                    email: email,
                    avatar: generatedAvatarUrl,
                    rating: ratingValue,
                    review: reviewMessage,
                    status: "pending", // Holds review for admin authorization
                    timestamp: serverTimestamp()
                });

                testimonialForm.reset();
                formAlertMsg.className = "form-alert success";
                formAlertMsg.innerText = "Success! Your review has been submitted and is currently pending admin moderation approval.";
                formAlertMsg.classList.remove('hidden');

            } catch (error) {
                console.error("Firestore Write Error: ", error);
                formAlertMsg.className = "form-alert error";
                formAlertMsg.innerText = "Submission Error. Please check your Firestore configurations rules and try again.";
                formAlertMsg.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Submit Review</span>';
            }
        });
    }

    /* 2. READ FUNCTION: DYNAMIC REAL-TIME ON-SNAPSHOT STREAM FOR APPROVED MODULES */
    if (testimonialsContainer) {
        // Query targets only documents where status matches "approved", sorting newest first
        const testimoniesQuery = query(
            collection(db, "testimonial"),
            where("status", "==", "approved"),
            orderBy("timestamp", "desc")
        );

        onSnapshot(testimoniesQuery, (snapshot) => {
            if (snapshot.empty) {
                testimonialsContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                        <p>No student reviews have been verified yet. Be the first to share your journey!</p>
                    </div>`;
                return;
            }

            let htmlPayload = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Build visual star system strings based on rating value metrics
                const ratingStars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

                htmlPayload += `
                    <div class="review-display-card reveal-up reveal-active">
                        <div class="card-user-info">
                            <img src="${data.avatar}" alt="${data.fullname}" class="user-avatar-circle" loading="lazy">
                            <div class="user-identity-meta">
                                <h4>${data.fullname}</h4>
                                <span class="user-handle">@${data.username}</span>
                            </div>
                        </div>
                        <div class="star-rating-display">${ratingStars}</div>
                        <p class="user-review-text">"${data.review}"</p>
                    </div>
                `;
            });

            testimonialsContainer.innerHTML = htmlPayload;
        }, (error) => {
            console.error("Firestore Read Stream Error: ", error);
        });
    }
});


// ==========================================================================
// FOURTH COMPONENT: ACADEMY COURSES DATA FILTER CHIPS PATHWAYS
// ==========================================================================
const ACADEMY_COURSES_DATA = [
    {
        id: "c1",
        title: "Web Development With AI",
        category: "web-dev",
        categoryLabel: "Web Development",
        desc: "Learn HTML, CSS, JavaScript, Firebase, AI-assisted development, responsive design, and real-world projects.",
        badge: "Best Seller",
        duration: "12 Weeks",
        level: "Beginner-Pro",
        students: "1,420",
        price: "N16,000"
    },
    {
        id: "c2",
        title: "Forex Trading Masterclass",
        category: "trading",
        categoryLabel: "Trading",
        desc: "Understand market analysis, risk management, trading psychology, and profitable trading strategies.",
        badge: "Most Popular",
        duration: "8 Weeks",
        level: "Intermediate",
        students: "980",
        price: "N50,000"
    },
    {
        id: "c3",
        title: "Graphic Design Professional",
        category: "graphic-design",
        categoryLabel: "Graphic Design",
        desc: "Master CorelDRAW, Canva, branding, logo design, flyers, social media graphics, and business design projects.",
        badge: "Recommended",
        duration: "6 Weeks",
        level: "All Levels",
        students: "2,110",
        price: "N25,000"
    },
    {
        id: "c4",
        title: "Video Editing With CapCut",
        category: "video-editing",
        categoryLabel: "Video Editing",
        desc: "Create professional videos, social media content, advertisements, and promotional materials.",
        badge: "Trending",
        duration: "4 Weeks",
        level: "Beginner",
        students: "3,450",
        price: "N18,000"
    },
    {
        id: "c5",
        title: "Digital Marketing Blueprint",
        category: "marketing",
        categoryLabel: "Marketing",
        desc: "Learn Facebook Ads, Instagram Marketing, WhatsApp Marketing, SEO, and targeted lead generation.",
        badge: "Best Seller",
        duration: "8 Weeks",
        level: "Intermediate",
        students: "1,890",
        price: "N25,000"
    },
    {
        id: "c6",
        title: "UI/UX Design Systems",
        category: "web-dev", 
        categoryLabel: "Web Development",
        desc: "Design modern user interfaces and responsive mobile apps with industry-standard layout systems.",
        badge: "New Course",
        duration: "10 Weeks",
        level: "Advanced",
        students: "740",
        price: "N20,000"
    },
    {
        id: "c7",
        title: "Content Creation & Branding",
        category: "marketing",
        categoryLabel: "Marketing",
        desc: "Build your personal brand identity framework and produce engaging multimedia viral assets systematically.",
        badge: "Trending",
        duration: "5 Weeks",
        level: "All Levels",
        students: "1,200",
        price: "N25,000"
    },
];

document.addEventListener('DOMContentLoaded', () => {
    const renderGrid = document.getElementById('courses-render-grid');
    const searchInput = document.getElementById('course-search');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';
    let currentSearchTerm = '';

    const buildCourseCardHTML = (course) => {
        return `
            <article class="course-card" data-category="${course.category}">
                <div class="card-media-wrapper">
                    <span class="course-tag-badge">${course.badge}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.263 15.518a3 3 0 012.332-4.747H15M4.263 15.518a3 3 0 005.696 0M4.263 15.518v.013m5.696-.013a3 3 0 015.696 0m0 0v.013m0 0a3 3 0 005.696 0m-5.696 0V10.5m5.696 0a3 3 0 00-5.696 0m5.696 0v.013m-5.696-.013a3 3 0 01-5.696 0m0 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v10.5" />
                    </svg>
                </div>
                <div class="card-body">
                    <span class="category-lbl">${course.categoryLabel}</span>
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-desc">${course.desc}</p>
                    <div class="meta-data-row">
                        <span class="meta-item">⏱ ${course.duration}</span>
                        <span class="meta-item">📊 ${course.level}</span>
                        <span class="meta-item">👥 ${course.students}</span>
                    </div>
                    <div class="price-row">
                        <span class="price-lbl">Tuition Access</span>
                        <span class="price-val">${course.price}</span>
                    </div>
                    <div class="card-cta-group">
                        <button class="btn btn-primary">Enroll Now</button>
                        <button class="btn btn-secondary">Details</button>
                    </div>
                </div>
            </article>
        `;
    };

    const runFilteringPipeline = () => {
        const matchedCourses = ACADEMY_COURSES_DATA.filter(course => {
            const matchesCategory = (currentFilter === 'all' || course.category === currentFilter);
            const matchesSearch = course.title.toLowerCase().includes(currentSearchTerm) || 
                                  course.desc.toLowerCase().includes(currentSearchTerm);
            return matchesCategory && matchesSearch;
        });

        if (matchedCourses.length === 0) {
            renderGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.1rem; font-weight: 500;">No premium modules match your search requirements.</p>
                    <p style="font-size: 0.9rem;">Try modifying your text parameters or clearing selected filter chips.</p>
                </div>`;
            return;
        }

        renderGrid.innerHTML = matchedCourses.map(c => buildCourseCardHTML(c)).join('');
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            runFilteringPipeline();
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            runFilteringPipeline();
        });
    });

    setTimeout(() => {
        runFilteringPipeline();
    }, 800);
});