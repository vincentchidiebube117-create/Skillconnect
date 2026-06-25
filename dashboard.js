document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const toggleIcon = menuToggle.querySelector('i');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            // Toggle the mobile nav menu display
            navMenu.classList.toggle('active');

            // Swap between hamburger icon and 'X' close icon
            if (navMenu.classList.contains('active')) {
                toggleIcon.classList.remove('fa-bars');
                toggleIcon.classList.add('fa-xmark');
            } else {
                toggleIcon.classList.remove('fa-xmark');
                toggleIcon.classList.add('fa-bars');
            }
        });

        // Close the menu automatically if a link is clicked (useful for anchor tags)
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    toggleIcon.classList.remove('fa-xmark');
                    toggleIcon.classList.add('fa-bars');
                }
            });
        });
    }
});

// ==========================================
// FIREBASE INITIALIZATION & SDK IMPORTS
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs,updateDoc, } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

// Initialize Firebase instances
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ==========================================
// REAL-TIME DASHBOARD DATA LOADER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Looks for the active username stored during the login or registration flow
    // Defaults to 'Admin' if testing directly without a session
    const loggedInUsername = localStorage.getItem('currentUsername') || 'Admin'; 

    if (loggedInUsername) {
        loadDashboardData(loggedInUsername);
    } else {
        alert("No active session found. Redirecting to login...");
        window.location.href = 'auth.html';
    }
});

async function loadDashboardData(username) {
    try {
        // UI Elements targeting dashboard card metrics
        const dashUsernameElem = document.getElementById('dashUsername');
        const dashFullnameElem = document.getElementById('dashFullname');
        const dashStatusElem = document.getElementById('dashStatus');
        const dashBalanceElem = document.getElementById('dashBalance'); // WALLET BALANCE card (Top Middle)
        const dashReferralsElem = document.getElementById('dashReferrals');
        const restrictionOverlay = document.getElementById('restrictionOverlay');

        // New UI Elements matching your bottom layout requirements
        const dashTotalCoursesSoldElem = document.getElementById('dashTotalCoursesSold');
        const dashAvailableBalanceElem = document.getElementById('dashAvailableBalance'); // AVAILABLE BAL card (Bottom Middle)
        const dashTotalEarningsElem = document.getElementById('dashTotalEarnings');

        // Instantly display username parameter
        if (dashUsernameElem) dashUsernameElem.textContent = username;

        // Fetch user data profile record directly from Firestore
        const userDocRef = doc(db, 'users', username);
        const userSnapshot = await getDoc(userDocRef);

        if (!userSnapshot.exists()) {
            console.error("User profile data could not be located in Firestore.");
            return;
        }

        const userData = userSnapshot.data();

        // ==========================================
        // CARD 1: Profile Status Verification & Lockdown
        // ==========================================
        if (dashFullnameElem) dashFullnameElem.textContent = userData.fullname || 'N/A';
        
        // Grabs status string from Firestore (defaults to 'active' if empty)
        const userStatus = userData.status ? userData.status.toLowerCase().trim() : 'active';

        if (userStatus === 'pending') {
            if (dashStatusElem) {
                dashStatusElem.textContent = "Restricted";
                dashStatusElem.className = "status-badge restricted-status";
            }
            // Block dashboard access entirely by showing fullscreen overlay layout
            if (restrictionOverlay) {
                restrictionOverlay.style.display = 'flex';
            }
            return; // Stops further execution so metrics remain hidden
        } else {
            if (dashStatusElem) {
                dashStatusElem.textContent = "Active";
                dashStatusElem.className = "status-badge active-status";
            }
        }

        // ==========================================
        // CARD 2: Wallet Balances Separation
        // ==========================================
        // 1. Top Card: Wallet Balance (Available Funds) -> Listens strictly to walletBalance
        if (dashBalanceElem) {
            const currentWalletBalance = Number(userData.walletBalance || 0);
            dashBalanceElem.textContent = currentWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // 2. Bottom Card: Available Bal (Withdrawable Amount) -> Listens strictly to bonus
        if (dashAvailableBalanceElem) {
            const currentBonusBalance = Number(userData.bonus || 0);
            dashAvailableBalanceElem.textContent = currentBonusBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // ==========================================
        // CARD 3: Aggregate Referral Counter (Sponsor Match)
        // ==========================================
        const usersRef = collection(db, 'users');
        const referralQuery = query(usersRef, where('sponsor', '==', username));
        const referralSnapshot = await getDocs(referralQuery);

        if (dashReferralsElem) {
            dashReferralsElem.textContent = referralSnapshot.size; // Total count of matched documents found
        }

        // ==========================================
        // ADDITIONAL SYSTEM METRIC ASSIGNMENTS
        // ==========================================
        // Total Course Sold metric counter assignment
        if (dashTotalCoursesSoldElem) {
            dashTotalCoursesSoldElem.textContent = userData.totalCoursesSold || 0;
        }

        // Permanent history record counter for all cumulative bonus income commissions (30%)
        if (dashTotalEarningsElem) {
            const currentTotalEarnings = Number(userData.totalEarnings || 0);
            dashTotalEarningsElem.textContent = currentTotalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

    } catch (error) {
        console.error("Critical error building dashboard profiles dynamically:", error);
    }
}

document.getElementById('updateWalletBtn').addEventListener('click', async () => {
    const email = document.getElementById('verEmail').value;
    const loginPass = document.getElementById('verPassword').value;
    const newWalletPass = document.getElementById('newWalletPassword').value;

    if (!email || !loginPass || !newWalletPass) return alert("All fields are required.");

    try {
        // 1. Search for the user by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return alert("User not found.");

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // 2. Validate Login Password (matching exactly your DB case)
        if (userData.loginPassword !== loginPass) {
            return alert("Invalid login password.");
        }

        // 3. Update the specific walletPassword field
        const userRef = doc(db, "users", userDoc.id);
        await updateDoc(userRef, {
            walletPassword: newWalletPass
        });

        alert("Wallet password updated successfully!");
        // Clear fields
        document.getElementById('verEmail').value = '';
        document.getElementById('verPassword').value = '';
        document.getElementById('newWalletPassword').value = '';

    } catch (error) {
        console.error("Error updating password: ", error);
        alert("Failed to update password.");
    }
});