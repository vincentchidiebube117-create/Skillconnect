// ==========================================================================
// FIREBASE ENGINE AND INTER-ACCOUNT TRANSFER RECORDS AGGREGATION
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, getDocs, or, where, addDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// SECURE CONFIGURATION NOTE: Replace placeholder values with your secure keys.

// 2. FIREBASE INITIALIZATION
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


// Global state variables cached to handle transaction flows cleanly
let globalUserReferralCount = 0;
let globalCourseSalesCount = 0;
let activeIncentiveType = 1; // 1 = Referral (₦50,000), 2 = Course Sales (₦150,000)
let cachedUserProfileDocData = null;
const activeUser = localStorage.getItem('currentUsername');

// ==========================================================================
// DOM CONTENT LOAD ENTRANCE LAYER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initMenuAndAuthEvents();
    initModalEvents();
    
    if (!activeUser) {
        window.location.href = 'auth.html';
    } else {
        syncUserMetricsAndRender();
    }
});

function initMenuAndAuthEvents() {
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
}

function initModalEvents() {
    const modal = document.getElementById('verificationModal');
    const closeX = document.getElementById('btnCloseModal');
    const cancelBtn = document.getElementById('btnCancelModal');
    const form = document.getElementById('frmIncentiveWithdrawal');

    if (closeX) closeX.addEventListener('click', () => modal.classList.remove('open-modal'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('open-modal'));
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processIncentiveSettlement();
        });
    }
}

// ==========================================================================
// METRICS ENGINE & REFERRAL/SALES CONSOLIDATION
// ==========================================================================
async function syncUserMetricsAndRender() {
    const container = document.getElementById('incentivesContainer');
    try {
        const userQuery = query(collection(db, 'users'), where('username', '==', activeUser));
        const snap = await getDocs(userQuery);

        if (snap.empty) {
            window.location.href = 'auth.html';
            return;
        }

        snap.forEach(docSnap => {
            cachedUserProfileDocData = docSnap.data();
        });

        // Pull core courses sold data points for top layout cards
        const totalSales = Number(cachedUserProfileDocData.totalCoursesSold || 0);
        const metricsCounterElement = document.getElementById('lblTotalSales');
        if (metricsCounterElement) {
            metricsCounterElement.textContent = totalSales.toLocaleString();
        }

        // 1. Trigger dynamic system metrics processing for downline counts
        await processReferralIncentiveEngine(activeUser, cachedUserProfileDocData);

        // 2. Trigger dynamic course sales milestone tracking evaluations
        await processCourseSalesIncentiveEngine(activeUser);

    } catch (err) {
        console.error("Critical error mapping profile metrics payload:", err);
        if (container) {
            container.innerHTML = `
                <div class="loading-state" style="color: #ef4444;">
                    <i class="fa-solid fa-circle-exclamation"></i> Sync engine failed to reconcile platform production data.
                </div>`;
        }
    }
}

/**
 * Extends the user processing script to scan downstream references (Incentive 1)
 */
async function processReferralIncentiveEngine(activeUsername, userDataProfile) {
    const lblCount = document.getElementById('lblTotalSellers');
    const barFill = document.getElementById('referralBarFill');
    const textProgress = document.getElementById('lblProgressText');
    const percentProgress = document.getElementById('lblProgressPercent');
    const footerAction = document.getElementById('actionFooterContainer');

    try {
        // Query users collection to find everyone sponsored by this user
        const refQuery = query(collection(db, 'users'), where('sponsor', '==', activeUsername));
        const refSnapshot = await getDocs(refQuery);
        
        globalUserReferralCount = refSnapshot.size;
        
        // Render current stats
        if (lblCount) lblCount.textContent = globalUserReferralCount.toLocaleString();

        // Check if user has already submitted a pending claim for this milestone batch
        const claimsQuery = query(
            collection(db, 'incentive_1_withdrawal'),
            where('username', '==', activeUsername),
            where('status', '==', 'pending')
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const holdsPendingRequest = !claimsSnapshot.empty;

        // Calculate progress toward the 100-referral target milestone line
        const milestoneTarget = 100;
        const remainderProgress = globalUserReferralCount % milestoneTarget;
        
        // If they have 100+ referrals and no pending claim, let them unlock it
        const isEligibleToClaim = globalUserReferralCount >= milestoneTarget && !holdsPendingRequest;
        
        let calculatedPercent = (remainderProgress / milestoneTarget) * 100;
        if (globalUserReferralCount >= milestoneTarget && !holdsPendingRequest) {
            calculatedPercent = 100; // Force filled tracker meter if active claim waiting
        }

        if (barFill) barFill.style.width = `${calculatedPercent}%`;
        if (percentProgress) percentProgress.textContent = `${Math.round(calculatedPercent)}%`;
        if (textProgress) {
            textProgress.textContent = isEligibleToClaim 
                ? `Milestone Reached! 100+ Referrals Unlocked` 
                : `Progress: ${remainderProgress} / ${milestoneTarget}`;
        }

        // Adjust interactive action footer state based on eligibility
        if (footerAction) {
            if (holdsPendingRequest) {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim disabled" style="background-color: #f59e0b; color: #ffffff;" disabled>
                        <i class="fa-solid fa-hourglass-half"></i> Withdrawal Pending Approval
                    </button>`;
            } else if (isEligibleToClaim) {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim active-claim" id="btnTriggerClaim">
                        <i class="fa-solid fa-money-bill-wave"></i> Withdraw ₦50,000 Reward Now
                    </button>`;
                
                document.getElementById('btnTriggerClaim').addEventListener('click', () => {
                    activeIncentiveType = 1;
                    openVerificationModalWindow(50000);
                });
            } else {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim disabled" disabled>
                        <i class="fa-solid fa-lock"></i> Locked (Reach 100 Sellers to Unlock)
                    </button>`;
            }
        }

    } catch (err) {
        console.error("Error operating real-time incentive system modules:", err);
    }
}

/**
 * Core Engine for Card Two: Tracks and processes course order completions by downline team members (Incentive 2)
 */
async function processCourseSalesIncentiveEngine(activeUsername) {
    const lblCount = document.getElementById('lblTotalCourseSales');
    const barFill = document.getElementById('salesBarFill');
    const textProgress = document.getElementById('lblSalesProgressText');
    const percentProgress = document.getElementById('lblSalesProgressPercent');
    const footerAction = document.getElementById('salesActionFooterContainer');

    try {
        // Step 1: Find all users sponsored by this user
        const downlineQuery = query(collection(db, 'users'), where('sponsor', '==', activeUsername));
        const downlineSnapshot = await getDocs(downlineQuery);
        
        const downlineUsernames = [];
        downlineSnapshot.forEach(doc => {
            downlineUsernames.push(doc.data().username);
        });

        globalCourseSalesCount = 0;

        // Step 2: If downlines exist, count their total orders (1 document = 1 sale point)
        if (downlineUsernames.length > 0) {
            const ordersQuery = query(collection(db, 'course_orders'), where('username', 'in', downlineUsernames));
            const ordersSnapshot = await getDocs(ordersQuery);
            globalCourseSalesCount = ordersSnapshot.size;
        }

        if (lblCount) lblCount.textContent = globalCourseSalesCount.toLocaleString();

        // Step 3: Check if a pending withdrawal request for Incentive 2 already exists
        const claimsQuery = query(
            collection(db, 'incentive_2_withdrawal'),
            where('username', '==', activeUsername),
            where('status', '==', 'pending')
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const holdsPendingRequest = !claimsSnapshot.empty;

        // Step 4: Run milestone metrics calculation (100 course sales)
        const milestoneTarget = 100;
        const remainderProgress = globalCourseSalesCount % milestoneTarget;
        const isEligibleToClaim = globalCourseSalesCount >= milestoneTarget && !holdsPendingRequest;

        let calculatedPercent = (remainderProgress / milestoneTarget) * 100;
        if (globalCourseSalesCount >= milestoneTarget && !holdsPendingRequest) {
            calculatedPercent = 100; 
        }

        if (barFill) barFill.style.width = `${calculatedPercent}%`;
        if (percentProgress) percentProgress.textContent = `${Math.round(calculatedPercent)}%`;
        if (textProgress) {
            textProgress.textContent = isEligibleToClaim 
                ? `Milestone Reached! 100+ Team Sales Unlocked` 
                : `Progress: ${remainderProgress} / ${milestoneTarget}`;
        }

        // Step 5: Adjust interactive action button footer state
        if (footerAction) {
            if (holdsPendingRequest) {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim disabled" style="background-color: #f59e0b; color: #ffffff;" disabled>
                        <i class="fa-solid fa-hourglass-half"></i> Withdrawal Pending Approval
                    </button>`;
            } else if (isEligibleToClaim) {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim active-claim" id="btnTriggerSalesClaim" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                        <i class="fa-solid fa-money-bill-wave"></i> Withdraw ₦150,000 Reward Now
                    </button>`;
                
                document.getElementById('btnTriggerSalesClaim').addEventListener('click', () => {
                    activeIncentiveType = 2;
                    openVerificationModalWindow(150000);
                });
            } else {
                footerAction.innerHTML = `
                    <button type="button" class="btn-claim disabled" disabled>
                        <i class="fa-solid fa-lock"></i> Locked (Reach 100 Team Sales to Unlock)
                    </button>`;
            }
        }

    } catch (err) {
        console.error("Error executing course sales incentive matrix logic:", err);
    }
}

/**
 * Populates data points into visual text modules before rendering the modal overlay
 */
function openVerificationModalWindow(amountValue) {
    const modal = document.getElementById('verificationModal');
    
    document.getElementById('modalUsername').textContent = `@${cachedUserProfileDocData.username}`;
    document.getElementById('modalBankName').textContent = cachedUserProfileDocData.bankName || 'Not Set';
    document.getElementById('modalAccountNo').textContent = cachedUserProfileDocData.accountNumber || 'Not Set';
    document.getElementById('modalAccountName').textContent = cachedUserProfileDocData.accountName || 'Not Set';
    
    // Dynamically update the display price inside the preview matrix card
    const payoutDisplay = document.querySelector('.target-payout-row strong');
    if (payoutDisplay) {
        payoutDisplay.textContent = `₦${amountValue.toLocaleString()}.00`;
    }
    
    // Clear previous password attempts
    document.getElementById('txtWalletPassword').value = "";
    
    modal.classList.add('open-modal');
}

/**
 * Processes secure validation and creates the withdrawal document
 */
async function processIncentiveSettlement() {
    const enteredPassword = document.getElementById('txtWalletPassword').value;
    const submitBtn = document.getElementById('btnSubmitWithdrawal');

    // Secure operational verification check directly against database entry parameter
    if (enteredPassword !== cachedUserProfileDocData.password) {
        alert("🔒 Access Denied: Secure wallet password verification failed.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    // Dynamic configuration variables set up depending on active triggering card instance
    const targetCollection = activeIncentiveType === 1 ? "incentive_1_withdrawal" : "incentive_2_withdrawal";
    const payoutAmount = activeIncentiveType === 1 ? 50000 : 150000;
    const finalMetricCount = activeIncentiveType === 1 ? globalUserReferralCount : globalCourseSalesCount;

    try {
        const withdrawalLog = {
            username: cachedUserProfileDocData.username,
            fullname: cachedUserProfileDocData.fullname || 'N/A',
            bankName: cachedUserProfileDocData.bankName || 'N/A',
            accountNumber: cachedUserProfileDocData.accountNumber || 'N/A',
            accountName: cachedUserProfileDocData.accountName || 'N/A',
            amount: payoutAmount,
            status: "pending",
            metricValueAtClaim: finalMetricCount,
            requestedAt: new Date().toISOString()
        };

        // Write directly to your designated Firestore tracking collection channel
        await addDoc(collection(db, targetCollection), withdrawalLog);

        alert(`🎉 Milestone Reward Submitted! Your ₦${payoutAmount.toLocaleString()} incentive withdrawal is pending review and will clear on Friday.`);
        
        document.getElementById('verificationModal').classList.remove('open-modal');
        location.reload();

    } catch (err) {
        console.error("Failed to commit reward withdrawal payload logging:", err);
        alert("Server error processing your transaction. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Authorize Withdrawal`;
    }
}