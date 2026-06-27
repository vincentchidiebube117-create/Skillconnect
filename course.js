document.addEventListener('DOMContentLoaded', () => {
    // Mobile Hamburger Menu Interactivity
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });

        // Close menu if links are interacted with
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Logout Process Management
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmLogout = confirm("Are you sure you want to log out of Skill Connect?");
            if (confirmLogout) {
                // Wipe active local user parameters to secure user dashboard state
                localStorage.removeItem('currentUsername');
                
                // Redirect straight to auth.html landing gateway
                window.location.href = 'auth.html';
            }
        });
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
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

// 1. Static Dataset Definition of Premium Courses
const COURSES = [
    {
        id: "web_dev_ai",
        title: "Website Development with AI",
        educator: "MR.VINCENT CHIIDIEBUBE.N",
        price: 16000,
        link: "https://superb-cannoli-66da01.netlify.app",
        desc: "Master layout construction, responsive styling design, and full-stack architecture deployments accelerated through modern contextual Large Language Model assistants."
    },
    
];

let currentUserDocId = null;
let currentUserData = null;
let purchasedCourseIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // Determine user session identification identity parameters
    const loggedInUsername = localStorage.getItem('currentUsername') || 'admin';
    await fetchUserAndOrders(loggedInUsername);
});

// Fetch active profile data information models
async function fetchUserAndOrders(username) {
    try {
        const usersRef = collection(db, 'users');
        const userQ = query(usersRef, where('username', '==', username));
        const userSnapshot = await getDocs(userQ);

        if (userSnapshot.empty) {
            console.error("User payload could not be loaded.");
            return;
        }

        userSnapshot.forEach((docSnap) => {
            currentUserDocId = docSnap.id;
            currentUserData = docSnap.data();
        });

        // Query the 'course_orders' table to see what this user has already bought
        const ordersRef = collection(db, 'course_orders');
        const ordersQ = query(ordersRef, where('username', '==', username), where('status', '==', 'completed'));
        const ordersSnapshot = await getDocs(ordersQ);

        purchasedCourseIds.clear();
        ordersSnapshot.forEach((orderDoc) => {
            purchasedCourseIds.add(orderDoc.data().courseId);
        });

        renderCourseCatalog();

    } catch (error) {
        console.error("Error executing user balance or ledger query lookups:", error);
    }
}

// Generate UI elements dynamically
function renderCourseCatalog() {
    const container = document.getElementById('courseGridContainer');
    if (!container) return;
    container.innerHTML = "";

    COURSES.forEach(course => {
        const isOwned = purchasedCourseIds.has(course.id);
        const card = document.createElement('div');
        card.className = `course-card ${isOwned ? 'owned' : ''}`;

        card.innerHTML = `
            <div class="course-card-body">
                <span class="course-badge">${isOwned ? 'Enrolled' : 'Available'}</span>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-educator">By ${course.educator}</p>
                <p class="course-preview-text">${course.desc.substring(0, 85)}...</p>
                
                <button type="button" class="details-link-btn" onclick="openCourseModal('${course.id}')">View Details</button>
            </div>
            <div class="course-card-footer">
                <span class="course-price">₦${course.price.toLocaleString()}</span>
                ${isOwned 
                    ? `<a href="${course.link}" target="_blank" class="action-btn access-btn">Access Course</a>`
                    : `<button type="button" class="action-btn order-btn" onclick="processCoursePurchase('${course.id}', ${course.price})">Order Now</button>`
                }
            </div>
        `;
        container.appendChild(card);
    });
}

// Transaction processing pipeline execution module
window.processCoursePurchase = async function(courseId, cost) {
    // 1. Instantly pull fresh, live session information from localStorage to prevent mismatch bugs
    const loggedInUsername = localStorage.getItem('currentUsername') || 'admin';

    try {
        // 2. Fetch the ABSOLUTE LATEST user balance directly from the database right at the time of click
        const usersRef = collection(db, 'users');
        const userQ = query(usersRef, where('username', '==', loggedInUsername));
        const userSnapshot = await getDocs(userQ);

        if (userSnapshot.empty) {
            alert("Session profile error. Please re-authenticate account details.");
            return;
        }

        let liveDocId = null;
        let liveUserData = null;

        userSnapshot.forEach((docSnap) => {
            liveDocId = docSnap.id;
            liveUserData = docSnap.data();
        });

        // 3. Convert value cleanly to verify exact currency amounts
        const currentBalance = Number(liveUserData.walletBalance || 0);

        // 4. Run checking equation rule evaluation guard
        if (currentBalance < cost) {
            alert(`Insufficient funds. This course costs ₦${cost.toLocaleString()}, but your current wallet balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet to proceed.`);
            return;
        }

        // 5. Present structural checkout verification confirmation prompt
        const confirmPurchase = confirm(`Confirm payment of ₦${cost.toLocaleString()} for this skill certification course?`);
        if (!confirmPurchase) return;

        const newBalance = currentBalance - cost;

        // ===================================================
        // 30% REFERRAL SYSTEM ACCRUAL DISTRIBUTION MATRIX
        // ===================================================
        const sponsorId = liveUserData.sponsor || "";
        const commissionBonus = cost * 0.30; // Pay 30% of course price to sponsor

        if (sponsorId) {
            // Locate the Sponsor's actual database profile document
            const sponsorQ = query(usersRef, where('username', '==', sponsorId));
            const sponsorSnapshot = await getDocs(sponsorQ);

            if (!sponsorSnapshot.empty) {
                let sponsorDocId = null;
                let sponsorData = null;

                sponsorSnapshot.forEach((docSnap) => {
                    sponsorDocId = docSnap.id;
                    sponsorData = docSnap.data();
                });

                // Extract or safely default current bonus statistics
                const historicalBonus = Number(sponsorData.bonus || 0);
                const historicalEarnings = Number(sponsorData.totalEarnings || 0);
                const historicalCoursesSold = Number(sponsorData.totalCoursesSold || 0);

                // Increment values based on business logic rules
                const updatedBonus = historicalBonus + commissionBonus;
                const updatedEarnings = historicalEarnings + commissionBonus; // Permanent cumulative tracking
                const updatedCoursesSold = historicalCoursesSold + 1; // Increment aggregate sold tracking metric

                // Write the financial updates straight into the sponsor's document structure
                const sponsorDocRef = doc(db, 'users', sponsorDocId);
                await updateDoc(sponsorDocRef, {
                    bonus: updatedBonus,
                    totalEarnings: updatedEarnings,
                    totalCoursesSold: updatedCoursesSold
                });
                console.log(`Referral earnings credited successfully to sponsor: ${sponsorId}`);
            }
        }
        // ===================================================

        // 6. Debit user balance immediately using the verified database document tracking path
        const userDocRef = doc(db, 'users', liveDocId);
        await updateDoc(userDocRef, {
            walletBalance: newBalance
        });

        // 7. Log validation audit payload entry record into 'course_orders' collection
        const ordersRef = collection(db, 'course_orders');
        await addDoc(ordersRef, {
            username: liveUserData.username,
            fullname: liveUserData.fullname,
            sponsor: sponsorId, // Added sponsor tracking parameters cleanly to the ledger dataset records
            courseId: courseId,
            amountOfCourse: cost,
            status: "completed",
            orderedAt: new Date().toISOString()
        });

        alert("Course order processed successfully! Your access credentials have been unlocked.");
        
        // 8. Sync client runtime state data parameters cleanly to reload view layout representations
        await fetchUserAndOrders(loggedInUsername);

    } catch (err) {
        console.error("Order writing transaction failed:", err);
        alert("An infrastructure write variance error occurred. Try again.");
    }
}
