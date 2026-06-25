// ==========================================================================
// NAVIGATION INTERACTIVITY SUB-MODULE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const toggleIcon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && navMenu && toggleIcon) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            if (navMenu.classList.contains('active')) {
                toggleIcon.className = 'fa-solid fa-xmark';
            } else {
                toggleIcon.className = 'fa-solid fa-bars';
            }
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

// ==========================================
// FIREBASE ENGINE AND HISTORY DATA EXTRACTION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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
    document.getElementById('lblActiveUser').textContent = activeUser;
    loadUserWithdrawalLedger();
}

/**
 * Connects to Firestore, isolates historical entries matching the active log signature,
 * and builds table elements.
 */
async function loadUserWithdrawalLedger() {
    const tableBody = document.getElementById('ledgerDataBody');
    
    try {
        // Query the withdrawals collection targeting ONLY the active user's document values
        // Ordered chronologically by requested time
        const historyQuery = query(
            collection(db, 'withdrawals'), 
            where('username', '==', activeUser)
        );
        
        const querySnapshot = await getDocs(historyQuery);
        tableBody.innerHTML = ""; // Wipe loading spinner context

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr class="empty-placeholder">
                    <td colspan="10"><i class="fa-solid fa-folder-open"></i> No withdrawal histories tracked under your profile yet.</td>
                </tr>`;
            return;
        }

        let rowIndex = 1;
        let documentRowsArray = [];

        querySnapshot.forEach(docSnap => {
            documentRowsArray.push(docSnap.data());
        });

        // Sort data row components natively by timestamp (newest items showing first)
        documentRowsArray.sort((x, y) => new Date(y.requestedAt) - new Date(x.requestedAt));

        documentRowsArray.forEach(data => {
            const tr = document.createElement('tr');

            // Format timestamp neatly: YYYY-MM-DD HH:MM:SS
            const dateObj = new Date(data.requestedAt);
            const dateFormatted = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

            // Establish numerical parameter constraints fallback indicators
            const gross = Number(data.grossRequestedAmount || 0);
            const fee = Number(data.processingFee || 0);
            const net = Number(data.netPayoutAmount || 0);

            tr.innerHTML = `
                <td>${rowIndex++}</td>
                <td><strong>System (App Bonus)</strong></td>
                <td>${data.accountName || data.username}</td>
                <td>${data.bankName}</td>
                <td><code>${data.accountNumber}</code></td>
                <td class="currency-text">₦${gross.toLocaleString()}</td>
                <td class="currency-text negative-cost">₦${fee.toLocaleString()}</td>
                <td class="currency-text" style="color: #10b981;">₦${net.toLocaleString()}</td>
                <td>${dateFormatted}</td>
                <td><span class="status-pill ${data.status.toLowerCase()}">${data.status}</span></td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Ledger rendering operational failure:", err);
        tableBody.innerHTML = `
            <tr class="empty-placeholder">
                <td colspan="10" style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading ledger variables from Firestore.</td>
            </tr>`;
    }
}