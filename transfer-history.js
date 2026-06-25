// ==========================================
// MOBILE RESPONSIVE UI MENU CONTROL ROUTINES
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
// FIREBASE ENGINE AND INTER-ACCOUNT TRANSFER RECORDS AGGREGATION
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, getDocs, or, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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
    buildTransferLedger();
}

/**
 * Accesses 'transfers' collection, queries items where current client matches 
 * either sender OR receiver parameters, then draws spreadsheet records.
 */
async function buildTransferLedger() {
    const tableBody = document.getElementById('transferLedgerBody');

    try {
        // Query database to capture items where active user is EITHER sender OR receiver
        const historyQuery = query(
            collection(db, 'transfers'),
            or(
                where('senderUsername', '==', activeUser),
                where('receiverUsername', '==', activeUser)
            )
        );

        const querySnapshot = await getDocs(historyQuery);
        tableBody.innerHTML = ""; // Clear loader element text string contents

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr class="loading-placeholder">
                    <td colspan="6"><i class="fa-solid fa-folder-open"></i> No peer-to-peer wallet transfer records found under this account.</td>
                </tr>`;
            return;
        }

        let compiledRowsList = [];

        querySnapshot.forEach(docSnap => {
            compiledRowsList.push(docSnap.data());
        });

        // Chronological sort sequence (newest items on top)
        compiledRowsList.sort((x, y) => new Date(y.processedAt) - new Date(x.processedAt));

        let rowIndex = 1;

        compiledRowsList.forEach(data => {
            const tr = document.createElement('tr');

            const dateObj = new Date(data.processedAt);
            const formattedDateTime = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

            const amount = Number(data.amountTransferred || 0);
            
            let txTypeLabel = "";
            let amountStyle = "";

            // Evaluate if logged user pushed funds or received them to determine ledger layouts
            if (data.senderUsername === activeUser) {
                txTypeLabel = `<span class="type-indicator outgoing">Outgoing Transfer</span>`;
                amountStyle = `color: #dc2626; font-weight:700;`; // Red text for deductions
            } else {
                txTypeLabel = `<span class="type-indicator incoming">Incoming Deposit</span>`;
                amountStyle = `color: #166534; font-weight:700;`; // Green text for additions
            }

            tr.innerHTML = `
                <td>${rowIndex++}</td>
                <td>${txTypeLabel}</td>
                <td>${data.senderFullName} (@${data.senderUsername})</td>
                <td><strong>${data.receiverFullName} (@${data.receiverUsername})</strong></td>
                <td class="mono-payout" style="${amountStyle}">
                    ${data.senderUsername === activeUser ? '- ₦' : '+ ₦'}${amount.toLocaleString()}
                </td>
                <td>${formattedDateTime}</td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Failure compiling wallet transfer history array arrays:", err);
        tableBody.innerHTML = `
            <tr class="loading-placeholder">
                <td colspan="6" style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error communicating with database ledgers.</td>
            </tr>`;
    }
}