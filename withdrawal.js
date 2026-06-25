// ==========================================================================
// MOBILE HAMBURGER MENU & ROUTING INTERACTIVITY (withdrawal.js)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const toggleIcon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && navMenu && toggleIcon) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');

            if (navMenu.classList.contains('active')) {
                toggleIcon.classList.remove('fa-bars');
                toggleIcon.classList.add('fa-xmark');
            } else {
                toggleIcon.classList.remove('fa-xmark');
                toggleIcon.classList.add('fa-bars');
            }
        });

        const navLinks = navMenu.querySelectorAll('.nav-link');
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

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmLogout = confirm("Are you sure you want to log out of Skill Connect?");
            if (confirmLogout) {
                localStorage.removeItem('currentUsername');
                window.location.href = 'auth.html';
            }
        });
    }
});

// ==========================================
// FIREBASE ENGINE AND APP ROUTINE MANAGEMENT
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, collection, addDoc, updateDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

// Operational Context Cache Parameters
const activeUser = localStorage.getItem('currentUsername');
let userOriginalProfileData = null; 
let userDocumentId = null; // Track explicit document key for balance point adjustments
let paymentDetailsLinkedRecord = null;

if (!activeUser) {
    alert("No active session tracked. Redirecting to login verification gateway...");
    window.location.href = 'auth.html';
} else {
    initializeWithdrawalFlow();
}

async function initializeWithdrawalFlow() {
    try {
        const profileQuery = query(collection(db, 'users'), where('username', '==', activeUser));
        const profileSnapshot = await getDocs(profileQuery);
        
        if (profileSnapshot.empty) {
            alert("Security Profile Error: User credentials no longer match registered datastores.");
            return;
        }
        
        profileSnapshot.forEach(docSnap => {
            userDocumentId = docSnap.id; 
            userOriginalProfileData = docSnap.data();
        });

        const paymentDetailsQuery = query(collection(db, 'users_payment_details'), where('username', '==', activeUser));
        const paymentSnapshot = await getDocs(paymentDetailsQuery);

        if (!paymentSnapshot.empty) {
            paymentSnapshot.forEach(docSnap => paymentDetailsLinkedRecord = docSnap.data());
            renderLockedPaymentDetailsState();
        }

    } catch (err) {
        console.error("Failed to map initial system validation states:", err);
    }
}

function renderLockedPaymentDetailsState() {
    document.getElementById('paymentDetailsForm').classList.add('hidden-view');
    document.getElementById('lockedAccountView').classList.remove('hidden-view');

    document.getElementById('lblAccName').textContent = paymentDetailsLinkedRecord.accountName;
    document.getElementById('lblBankName').textContent = paymentDetailsLinkedRecord.bankName;
    document.getElementById('lblAccNum').textContent = paymentDetailsLinkedRecord.accountNumber;
    document.getElementById('lblBranch').textContent = paymentDetailsLinkedRecord.branch || "N/A";
}

// ==========================================================================
// CORE VALIDATION LOGIC FUNCTIONS (DAYS, BALANCES & FEES)
// ==========================================================================

/**
 * Rule 3: Enforces calendar operating window constraints.
 * Allows requests strictly on Mondays (1), Wednesdays (3), and Fridays (5).
 */
function isPortalOpenToday() {
    const currentDay = new Date().getDay();
    return currentDay === 1 || currentDay === 3 || currentDay === 5;
}

/**
 * Rule 2: Evaluates processing charges.
 * Calculates a 2% fee on the requested amount.
 */
function calculateProcessingFee(amount) {
    const chargeRate = 0.02; // 2%
    const calculatedFee = amount * chargeRate;
    const finalPayoutAmount = amount - calculatedFee;
    
    return {
        fee: calculatedFee,
        payout: finalPayoutAmount
    };
}

// ==========================================
// SAVE AND LOCK ACCOUNT FORM HANDLER
// ==========================================
document.getElementById('paymentDetailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const providedPassword = document.getElementById('walletPasswordSetup').value;

    if (providedPassword !== userOriginalProfileData.walletPassword) {
        alert("Security Error: The wallet security password provided does not match your profile.");
        return;
    }

    const payload = {
        username: activeUser,
        accountName: document.getElementById('accountName').value.trim(),
        bankName: document.getElementById('bankName').value,
        accountNumber: document.getElementById('accountNumber').value.trim(),
        branch: document.getElementById('bankBranch').value.trim() || "N/A",
        walletPassword: providedPassword,
        registeredAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, 'users_payment_details'), payload);
        alert("Account details successfully linked and locked to your profile!");
        paymentDetailsLinkedRecord = payload;
        renderLockedPaymentDetailsState();
    } catch (err) {
        console.error("Failed to commit bank configuration payload:", err);
        alert("Error mapping database parameters. Please re-verify fields.");
    }
});

document.getElementById('proceedToWithdrawalBtn').addEventListener('click', () => {
    const cardStep2 = document.getElementById('transactionFormCard');
    cardStep2.classList.remove('disabled-card');

    document.getElementById('withdrawAmount').disabled = false;
    document.getElementById('walletPasswordVerification').disabled = false;
    document.getElementById('submitPayoutBtn').disabled = false;

    cardStep2.scrollIntoView({ behavior: 'smooth' });
});

// ==========================================
// TRANSACTION SETTLEMENT ROUTINES (COLLECTION: withdrawals)
// ==========================================
document.getElementById('payoutExecutionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Validate Portal Availability (Rule 3)
    if (!isPortalOpenToday()) {
        alert("Portal Closed: Withdrawals can only be requested on Mondays, Wednesdays, and Fridays.");
        return;
    }

    const requestedAmount = Number(document.getElementById('withdrawAmount').value);
    const confirmationPassword = document.getElementById('walletPasswordVerification').value;

    // 2. Security Gate Check
    if (confirmationPassword !== paymentDetailsLinkedRecord.walletPassword) {
        alert("Authentication Failed: Invalid password signature asset validation parameters.");
        return;
    }

    // 3. Fetch Fresh Balance Data & Verify Bonus Funds (Rule 1)
    try {
        const freshUserDoc = await getDocs(query(collection(db, 'users'), where('username', '==', activeUser)));
        let exactCurrentBonus = 0;
        
        freshUserDoc.forEach(docSnap => {
            exactCurrentBonus = Number(docSnap.data().bonus || 0);
        });

        if (requestedAmount > exactCurrentBonus) {
            alert(`Insufficient Funds: Your current bonus balance is ₦${exactCurrentBonus.toLocaleString()}. You cannot withdraw ₦${requestedAmount.toLocaleString()}.`);
            return;
        }

        // 4. Calculate 2% Fee Metric Parameters (Rule 2)
        const accountingMetrics = calculateProcessingFee(requestedAmount);

        // 5. Deduct balance from user document instantly
        const userDocReference = doc(db, 'users', userDocumentId);
        const updatedBonusBalance = exactCurrentBonus - requestedAmount;
        
        await updateDoc(userDocReference, {
            bonus: updatedBonusBalance
        });

        // 6. Build and log the complete historical entry payload
        const transactionPayload = {
            username: activeUser,
            accountName: paymentDetailsLinkedRecord.accountName,
            accountNumber: paymentDetailsLinkedRecord.accountNumber,
            bankName: paymentDetailsLinkedRecord.bankName,
            grossRequestedAmount: requestedAmount,       // Full amount requested
            processingFee: accountingMetrics.fee,        // 2% processing cost
            netPayoutAmount: accountingMetrics.payout,   // Amount paid after deduction
            status: "pending",
            requestedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'withdrawals'), transactionPayload);
        
        alert(`Withdrawal processed successfully!\n\nGross: ₦${requestedAmount.toLocaleString()}\n2% Fee: ₦${accountingMetrics.fee.toLocaleString()}\nNet Amount to Receive: ₦${accountingMetrics.payout.toLocaleString()}\n\nSettlement is pending admin approval within 24 hours.`);
        
        document.getElementById('payoutExecutionForm').reset();
        
    } catch (err) {
        console.error("Critical processing breakdown inside transactional sequence:", err);
        alert("An operational failure occurred during transaction logging. Your balance was not compromised. Please retry.");
    }
});