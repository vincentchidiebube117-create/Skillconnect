// ==========================================
// MOBILE MENU INTERACTIVE NAVIGATION LINK CODES
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
// FIREBASE PEER-TO-PEER TRANSACTION PROCESSING engine
// ==========================================================================
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

const activeSenderUser = localStorage.getItem('currentUsername');

let senderDocId = null;
let senderProfileData = null;
let receiverDocId = null;
let receiverProfileData = null;

if (!activeSenderUser) {
    window.location.href = 'auth.html';
} else {
    loadSenderBalance();
}

/**
 * Grabs the active logged-in user profile, gets their 'walletBalance' parameter
 * and updates the UI text content balance box dynamically.
 */
async function loadSenderBalance() {
    try {
        const senderQuery = query(collection(db, 'users'), where('username', '==', activeSenderUser));
        const snap = await getDocs(senderQuery);

        if (snap.empty) {
            alert("Profile sync error. Re-authenticating.");
            window.location.href = 'auth.html';
            return;
        }

        snap.forEach(docSnap => {
            senderDocId = docSnap.id;
            senderProfileData = docSnap.data();
        });

        // FIXED: Changed from walletBals to walletBalance to match your Firestore screenshot exactly!
        const currentBalance = Number(senderProfileData.walletBalance || 0);
        
        document.getElementById('lblWalletBalance').textContent = `₦${currentBalance.toLocaleString()}`;

    } catch (err) {
        console.error("Error reading balance maps:", err);
        document.getElementById('lblWalletBalance').textContent = "₦0";
    }
}

// ==========================================================================
// STEP 2: FUNDS SUBMISSION ROUTINE TRANSACTION DEPLOYMENT ENGINE
// ==========================================================================
document.getElementById('walletTransferForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const transferAmount = Number(document.getElementById('transferAmount').value);
    const passwordInput = document.getElementById('senderWalletPassword').value;

    // FIXED: Changed from walletBals to walletBalance
    const currentSenderWalletBalance = Number(senderProfileData.walletBalance || 0);

    if (transferAmount > currentSenderWalletBalance) {
        alert(`Insufficient Balance: You are trying to send ₦${transferAmount.toLocaleString()}, but your current wallet balance is only ₦${currentSenderWalletBalance.toLocaleString()}.`);
        return;
    }

    if (passwordInput !== senderProfileData.walletPassword) {
        alert("Authorization Denied: Invalid security wallet password signature.");
        return;
    }

    try {
        // Step 1: Deduct balance parameter directly from the Sender
        const newSenderBal = currentSenderWalletBalance - transferAmount;
        await updateDoc(doc(db, 'users', senderDocId), {
            walletBalance: newSenderBal // FIXED: Field key name updated
        });

        // Step 2: Add matching credit balance balance directly into the Recipient
        // FIXED: Field key name updated from walletBals to walletBalance
        const currentReceiverBal = Number(receiverProfileData.walletBalance || 0);
        const newReceiverBal = currentReceiverBal + transferAmount;
        await updateDoc(doc(db, 'users', receiverDocId), {
            walletBalance: newReceiverBal // FIXED: Field key name updated
        });

        // Step 3: Package operational payload data block and log to 'transfers' collection
        const transferPayload = {
            senderUsername: activeSenderUser,
            senderFullName: senderProfileData.fullname || activeSenderUser,
            receiverUsername: receiverProfileData.username,
            receiverFullName: receiverProfileData.fullname || receiverProfileData.username,
            amountTransferred: transferAmount,
            processedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'transfers'), transferPayload);

        alert(`Transaction Successful!\n\nYou have seamlessly transferred ₦${transferAmount.toLocaleString()} to ${transferPayload.receiverFullName} (@${transferPayload.receiverUsername}).`);
        
        document.getElementById('walletTransferForm').reset();
        document.getElementById('verificationFeedback').classList.add('hidden-element');
        document.getElementById('securedTransferFields').classList.remove('active-section');
        
        document.getElementById('transferAmount').disabled = true;
        document.getElementById('senderWalletPassword').disabled = true;
        document.getElementById('btnExecuteTransfer').disabled = true;

        // Force reload core balance strings dynamically 
        await loadSenderBalance();

    } catch (err) {
        console.error("Critical failure during balance migration routine:", err);
        alert("An error occurred during transaction processing. Please verify network access parameters.");
    }
});

// ==========================================
// STEP 1: RECIPIENT DATA RESOLUTION VERIFIER
// ==========================================
document.getElementById('btnVerifyRecipient').addEventListener('click', async () => {
    const inputUsername = document.getElementById('recipientUsername').value.trim();
    const feedbackBox = document.getElementById('verificationFeedback');
    const secureSection = document.getElementById('securedTransferFields');

    if (!inputUsername) {
        alert("Please specify a recipient username first.");
        return;
    }

    if (inputUsername.toLowerCase() === activeSenderUser.toLowerCase()) {
        alert("Invalid Operation: You cannot execute wallet transfers to your own account registry.");
        return;
    }

    try {
        const receiverQuery = query(collection(db, 'users'), where('username', '==', inputUsername));
        const snapshot = await getDocs(receiverQuery);

        if (snapshot.empty) {
            alert(`User matching username '@${inputUsername}' could not be located in our datastores.`);
            
            // Hide and Reset Input form blocks to clean state locks
            feedbackBox.classList.add('hidden-element');
            secureSection.classList.remove('active-section');
            document.getElementById('transferAmount').disabled = true;
            document.getElementById('senderWalletPassword').disabled = true;
            document.getElementById('btnExecuteTransfer').disabled = true;
            
            receiverDocId = null;
            receiverProfileData = null;
            return;
        }

        snapshot.forEach(docSnap => {
            receiverDocId = docSnap.id;
            receiverProfileData = docSnap.data();
        });

        // Unveil Receiver Data Elements to UI Layout View port
        document.getElementById('lblRecipientFullName').textContent = receiverProfileData.fullname || receiverProfileData.username;
        feedbackBox.classList.remove('hidden-element');
        
        // Active Form Target input parameter components fields
        secureSection.classList.add('active-section');
        document.getElementById('transferAmount').disabled = false;
        document.getElementById('senderWalletPassword').disabled = false;
        document.getElementById('btnExecuteTransfer').disabled = false;

    } catch (err) {
        console.error("Recipient look up framework failure:", err);
    }
});

// ==========================================================================
// STEP 2: FUNDS SUBMISSION ROUTINE TRANSACTION DEPLOYMENT ENGINE
// ==========================================================================
document.getElementById('walletTransferForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const transferAmount = Number(document.getElementById('transferAmount').value);
    const passwordInput = document.getElementById('senderWalletPassword').value;

    // Gate 1: Re-fetch fresh balance block checkpoint values
    const currentSenderWalletBalance = Number(senderProfileData.walletBals || 0);

    if (transferAmount > currentSenderWalletBalance) {
        alert(`Insufficient Balance: You are trying to send ₦${transferAmount.toLocaleString()}, but your current wallet balance is only ₦${currentSenderWalletBalance.toLocaleString()}.`);
        return;
    }

    // Gate 2: Security Token Password Cross-Validation Block Checks
    if (passwordInput !== senderProfileData.walletPassword) {
        alert("Authorization Denied: Invalid security wallet password signature.");
        return;
    }

    try {
        // Step 1: Deduct balance parameter directly from the Sender
        const newSenderBal = currentSenderWalletBalance - transferAmount;
        await updateDoc(doc(db, 'users', senderDocId), {
            walletBals: newSenderBal
        });

        // Step 2: Add matching credit balance balance directly into the Recipient
        const currentReceiverBal = Number(receiverProfileData.walletBals || 0);
        const newReceiverBal = currentReceiverBal + transferAmount;
        await updateDoc(doc(db, 'users', receiverDocId), {
            walletBals: newReceiverBal
        });

        // Step 3: Package operational payload data block and log to 'transfers' collection
        const transferPayload = {
            senderUsername: activeSenderUser,
            senderFullName: senderProfileData.fullname || activeSenderUser,
            receiverUsername: receiverProfileData.username,
            receiverFullName: receiverProfileData.fullname || receiverProfileData.username,
            amountTransferred: transferAmount,
            processedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'transfers'), transferPayload);

        // Notify client and reset interface panels dynamically
        alert(`Transaction Successful!\n\nYou have seamlessly transferred ₦${transferAmount.toLocaleString()} to ${transferPayload.receiverFullName} (@${transferPayload.receiverUsername}).`);
        
        // Clear variables cache profile layers and refresh UI context displays
        document.getElementById('walletTransferForm').reset();
        document.getElementById('verificationFeedback').classList.add('hidden-element');
        document.getElementById('securedTransferFields').classList.remove('active-section');
        
        document.getElementById('transferAmount').disabled = true;
        document.getElementById('senderWalletPassword').disabled = true;
        document.getElementById('btnExecuteTransfer').disabled = true;

        // Force reload core balance strings dynamically 
        await loadSenderBalance();

    } catch (err) {
        console.error("Critical failure during balance migration routine:", err);
        alert("An error occurred during transaction processing. Please verify network access parameters.");
    }
});