// ==========================================
// NAVIGATION INTERACTIVE LAYER CONTROLLERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const toggleIcon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && navMenu && toggleIcon) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            toggleIcon.className = navMenu.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to log out of Skill Connect?")) {
                localStorage.removeItem('currentUsername');
                window.location.href = 'auth.html';
            }
        });
    }
});

// ==========================================================================
// FIREBASE DIRECT SPONSOR TEAM EXTRACTION QUERY
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCAm9c9vVJhx1WQO4lmT1VNc2gpa2Np938",
    authDomain: "skillconnectrefpage.firebaseapp.com",
    projectId: "skillconnectrefpage",
    storageBucket: "skillconnectrefpage.firebasestorage.app",
    messagingSenderId: "807369765496",
    appId: "1:807369765496:web:4e1e71149dcdc7511d338d",
    measurementId: "G-9JXE9GK9E4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const activeUser = localStorage.getItem('currentUsername');

if (!activeUser) {
    window.location.href = 'auth.html';
} else {
    document.getElementById('lblActiveProfile').textContent = `@${activeUser}`;
    compileReferralsLedger();
}

/**
 * Connects directly to the 'users' collection and screens for any user documents
 * where the 'sponsor' value matches the logged-in username.
 */
async function compileReferralsLedger() {
    const tableBody = document.getElementById('referralLedgerBody');

    try {
        // Query users collection looking for downlines sponsored by this specific user
        const referralQuery = query(
            collection(db, 'users'),
            where('sponsor', '==', activeUser)
        );

        const querySnapshot = await getDocs(referralQuery);
        tableBody.innerHTML = ""; // Wipe table loading elements

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr class="loading-placeholder">
                    <td colspan="8"><i class="fa-solid fa-folder-open"></i> You have not sponsored any users on Skill Connect yet.</td>
                </tr>`;
            return;
        }

        let dynamicReferralsList = [];

        querySnapshot.forEach(docSnap => {
            dynamicReferralsList.push(docSnap.data());
        });

        // Sort chronologically using the registration date (Newest downlines show first)
        dynamicReferralsList.sort((x, y) => new Date(y.registeredAt) - new Date(x.registeredAt));

        let rowIndex = 1;
        const REGISTRATION_FEE = 2000; // Static base registration value field

        dynamicReferralsList.forEach(userRecord => {
            const tr = document.createElement('tr');

            // Format timestamp neatly from ISO strings (e.g. "2026-06-23T16:21:49.882Z")
            let formattedDate = "N/A";
            if (userRecord.registeredAt) {
                const dateObj = new Date(userRecord.registeredAt);
                formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
            }

            const currentStatus = userRecord.status || "active";

            tr.innerHTML = `
                <td>${rowIndex++}</td>
                <td><strong>@${userRecord.username}</strong></td>
                <td>${userRecord.fullname || 'Not Provided'}</td>
                <td><code>${userRecord.email || 'N/A'}</code></td>
                <td>${userRecord.phone || 'N/A'}</td>
                <td class="mono-fee">₦${REGISTRATION_FEE.toLocaleString()}</td>
                <td><span class="status-pill ${currentStatus.toLowerCase()}">${currentStatus}</span></td>
                <td>${formattedDate}</td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Failed to query referral directory maps:", err);
        tableBody.innerHTML = `
            <tr class="loading-placeholder">
                <td colspan="8" style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading registration ledgers from cloud databases.</td>
            </tr>`;
    }
}