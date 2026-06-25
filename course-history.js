// ==========================================
// MOBILE INTERACTIVE NAVIGATION CONTROLLERS
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
// FIREBASE CROSS-COLLECTION LINKED COMPILATION
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
    document.getElementById('lblActiveProfile').textContent = activeUser;
    compileAffiliateLedger();
}

async function compileAffiliateLedger() {
    const tableBody = document.getElementById('historyLedgerBody');
    
    try {
        // 1. Fetch entire user mapping system locally to resolve full names cleanly
        const userSnapshot = await getDocs(collection(db, 'users'));
        const userMap = {}; // Format: { username: { fullname, sponsor } }
        
        userSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            userMap[data.username] = {
                fullname: data.fullname || data.username,
                sponsor: data.sponsor || null
            };
        });

        // Get the active user's current meta profile
        const activeUserMeta = userMap[activeUser] || { fullname: activeUser, sponsor: null };

        // 2. Query all completed course orders from Firestore
        const ordersQuery = query(collection(db, 'course_orders'), where('status', '==', 'completed'));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let compiledRows = [];

        ordersSnapshot.forEach(docSnap => {
            const order = docSnap.data();
            const orderUsername = order.username;
            const orderUserMeta = userMap[orderUsername] || { fullname: order.fullname, sponsor: null };
            
            const baseAmount = Number(order.amountOfCourse || 0);
            const calculatedBonus = baseAmount * 0.30; // 30% Sponsor Affiliate Cut

            // SCENARIO 1: The logged-in user is the one who BOUGHT the course
            if (orderUsername === activeUser) {
                compiledRows.push({
                    type: "Personal Purchase",
                    sender: `${activeUserMeta.fullname} (@${activeUser})`,
                    receiver: orderUserMeta.sponsor ? `${userMap[orderUserMeta.sponsor]?.fullname || orderUserMeta.sponsor} (@${orderUserMeta.sponsor})` : "Direct Platform",
                    course: order.courseId || "Skill Course",
                    cost: baseAmount,
                    bonus: 0, // No incoming affiliate bonus on self purchases
                    timestamp: order.orderedAt
                });
            }

            // SCENARIO 2: The logged-in user is the SPONSOR of the person who bought the course
            if (orderUserMeta.sponsor === activeUser) {
                compiledRows.push({
                    type: "Referral Commission",
                    sender: `${orderUserMeta.fullname} (@${orderUsername})`,
                    receiver: `${activeUserMeta.fullname} (@${activeUser})`,
                    course: order.courseId || "Skill Course",
                    cost: baseAmount,
                    bonus: calculatedBonus, // Receives the 30% credit split allocation
                    timestamp: order.orderedAt
                });
            }
        });

        // Wipe loader UI placeholder element
        tableBody.innerHTML = "";

        if (compiledRows.length === 0) {
            tableBody.innerHTML = `
                <tr class="loading-state-row">
                    <td colspan="8"><i class="fa-solid fa-folder-open"></i> No personal orders or affiliate matching bonuses found.</td>
                </tr>`;
            return;
        }

        // Sort chronologically (newest timestamps on top)
        compiledRows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let index = 1;
        compiledRows.forEach(row => {
            const tr = document.createElement('tr');
            
            const dateObj = new Date(row.timestamp);
            const cleanDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

            const badgeClass = row.type === "Personal Purchase" ? "personal-order" : "referral-bonus";

            tr.innerHTML = `
                <td>${index++}</td>
                <td><span class="type-badge ${badgeClass}">${row.type}</span></td>
                <td>${row.sender}</td>
                <td><strong>${row.receiver}</strong></td>
                <td><code>${row.course.toUpperCase()}</code></td>
                <td class="mono-money">₦${row.cost.toLocaleString()}</td>
                <td class="mono-money" style="color: ${row.bonus > 0 ? '#166534' : '#64748b'};">
                    ${row.bonus > 0 ? '+ ₦' + row.bonus.toLocaleString() : '₦0'}
                </td>
                <td>${cleanDate}</td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Affiliate compiler sequence failure:", err);
        tableBody.innerHTML = `
            <tr class="loading-state-row">
                <td colspan="8" style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error compiling ledger rows. Check network connection.</td>
            </tr>`;
    }
}