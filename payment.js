// 1. ALL IMPORTS AT THE TOP
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Global variable to hold form data until the final confirmation button is clicked
let temporaryPaymentData = null;

// 3. NAVIGATION & LOGOUT LOGIC + INITIAL LOADING
document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const logoutBtn = document.querySelector('.logout-link');
    const usernameField = document.getElementById('pay-username');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'auth.html';
        });
    }

    // Automatically pick up the username to seed the ledger display instantly if preset
    if (usernameField && usernameField.value.trim() !== "") {
        loadLedger(usernameField.value.trim());
    }

    // Setup listeners so history loads dynamically while typing or when leaving the input box
    if (usernameField) {
        usernameField.addEventListener('input', () => {
            if (usernameField.value.trim() !== "") {
                loadLedger(usernameField.value.trim());
            }
        });
        
        usernameField.addEventListener('blur', () => {
            if (usernameField.value.trim() !== "") {
                loadLedger(usernameField.value.trim());
            }
        });
    }
});

// 4. STEP 1: PROCEED BUTTON LOGIC (No Firebase submission happens here)
const intentForm = document.getElementById('payment-intent-form');

intentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cache the entered form details into memory safely
    temporaryPaymentData = {
        payerName: document.getElementById('pay-fullname').value,
        username: document.getElementById('pay-username').value,
        amount: document.getElementById('pay-amount').value,
        method: document.getElementById('pay-method').value,
        status: 'processing'
    };

    // Swap cards visually
    document.getElementById('form-gate').classList.add('hidden');
    document.getElementById('details-gate').classList.remove('hidden');
    renderPaymentDetails(temporaryPaymentData.method);
});

// 5. RENDER BANKING DETAILS
function renderPaymentDetails(method) {
    const box = document.getElementById('banking-details');
    if (method === 'bank') {
        box.innerHTML = `
            <div class="bank-details-box">
                <p><strong>Bank:</strong> OPAY</p>
                <p><strong>Account Name:</strong> Skill Connect Global</p>
                <p><strong>Account Number:</strong> 9138859606</p>
                <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid var(--border-color, #334155);">
                <p><strong>Bank:</strong> PARALLEX BANK</p>
                <p><strong>Account Name:</strong> Skill Connect Global</p>
                <p><strong>Account Number:</strong> 0400332857</p>
            </div>`;
    } else {
        box.innerHTML = `
            <div class="bank-details-box">
                <p><strong>USDT Address (TRC20):</strong></p>
                <p style="word-break: break-all; color: #3b82f6;"><code>TQDxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></p>
            </div>`;
    }
}

// 6. STEP 2: CONFIRM TRANSACTION BUTTON LOGIC (Submission happens here!)
const confirmBtn = document.getElementById('confirm-payment');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        const refInput = document.getElementById('final-ref');
        if (!refInput || !refInput.value.trim()) {
            alert("Please provide a valid Transaction ID reference.");
            return;
        }

        if (!temporaryPaymentData) {
            alert("No transaction session found. Please fill out the form again.");
            return;
        }

        try {
            // Change button text immediately on click
            confirmBtn.disabled = true;
            confirmBtn.innerText = "Payment sent for confirmation...";

            // Combine form text inputs, transaction hash code, and native server time stamp
            const finalPayload = {
                ...temporaryPaymentData,
                transactionId: refInput.value.trim(),
                createdAt: serverTimestamp()
            };

            // Write document data packet directly to Firestore collections
            await addDoc(collection(db, "payments"), finalPayload);

            alert("Payment instruction sent successfully! Admin will verify your transaction.");
            
            // Retain username context to load ledger, then clear state variables
            const currentUsername = temporaryPaymentData.username;
            temporaryPaymentData = null;
            refInput.value = "";
            intentForm.reset();

            // Return user to the initial screen state layout
            document.getElementById('details-gate').classList.add('hidden');
            document.getElementById('form-gate').classList.remove('hidden');

            // Force dynamic history ledger table refresh instantly
            await loadLedger(currentUsername);

        } catch (err) {
            console.error("Error saving complete database entry payload: ", err);
            alert("Failed to submit confirmation. Please try again.");
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Confirm Payment Sent";
        }
    });
}

// 7. LEDGER & RECEIPT LOGIC
async function loadLedger(currentUser) {
    if (!currentUser || currentUser.trim() === "") return;
    
    try {
        const q = query(collection(db, "payments"), where("username", "==", currentUser.trim()));
        const querySnapshot = await getDocs(q);
        const body = document.getElementById('ledger-body');
        
        if (!body) return;
        body.innerHTML = "";

        if (querySnapshot.empty) {
            body.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No transaction history found for "${currentUser}".</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');

            // Convert server timestamps to safe readable standard string format text strings
            let displayDate = "Just now...";
            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    displayDate = data.createdAt.toDate().toLocaleDateString();
                } else if (data.createdAt.seconds) {
                    displayDate = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                } else {
                    displayDate = new Date(data.createdAt).toLocaleDateString();
                }
            }

            row.innerHTML = `
                <td>${displayDate}</td>
                <td>₦${parseFloat(data.amount || 0).toLocaleString()}</td>
                <td><span class="status-badge status-${data.status || 'processing'}">${(data.status || 'processing').toUpperCase()}</span></td>
                <td><button onclick="viewReceipt('${doc.id}')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; margin: 0; width: auto;">View</button></td>
            `;
            body.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading transaction records:", error);
    }
}

// Expose viewReceipt to global window so HTML inline button actions can call it inside modules cleanly
window.viewReceipt = function(docId) {
    alert("Displaying receipt info for transaction profile: " + docId);
};

// ==========================================================================
// 8. DYNAMIC RECEIPT MODAL LOGIC
// ==========================================================================

// Expose viewReceipt globally so your table buttons can invoke it seamlessly
window.viewReceipt = async function(docId) {
    const modal = document.getElementById('receipt-modal');
    const contentBox = document.getElementById('receipt-content');
    
    if (!modal || !contentBox) return;

    try {
        // Open the modal container immediately and display a loading spinner/message
        modal.classList.remove('hidden');
        contentBox.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Generating receipt profile...</div>`;

        // Direct fetch request to Firestore for this specific document reference
        const { doc: firestoreDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const docRef = firestoreDoc(db, "payments", docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            contentBox.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Receipt record not found.</div>`;
            return;
        }

        const data = docSnap.data();

        // Calculate a safe human-readable date format text layout
        let receiptDate = "N/A";
        if (data.createdAt) {
            if (typeof data.createdAt.toDate === 'function') {
                receiptDate = data.createdAt.toDate().toLocaleString();
            } else if (data.createdAt.seconds) {
                receiptDate = new Date(data.createdAt.seconds * 1000).toLocaleString();
            } else {
                receiptDate = new Date(data.createdAt).toLocaleString();
            }
        }

        // Render clean structural markup layout inside your custom dashboard card wrapper
        contentBox.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h4 style="font-size: 1.4rem; color: var(--primary, #3b82f6); margin-bottom: 0.25rem;">SkillConnect</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Transaction Receipt</p>
            </div>
            
            <hr style="border: 0; border-top: 1px dashed var(--border-color, #334155); margin-bottom: 1.25rem;">
            
            <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Status:</span> <strong style="color: var(--success, #10b981); text-transform: uppercase;">${data.status || 'processing'}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Username:</span> <span>${data.username || 'N/A'}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Payer Name:</span> <span>${data.payerName || 'N/A'}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Method:</span> <span style="text-transform: uppercase;">${data.method || 'N/A'}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-muted);">Date/Time:</span> <span>${receiptDate}</span></div>
                <div style="display: flex; justify-content: space-between; word-break: break-all; gap: 1rem;"><span style="color: var(--text-muted); shrink: 0;">Ref ID:</span> <span style="font-family: monospace; font-size: 0.85rem; color: #94a3b8;">${data.transactionId || 'N/A'}</span></div>
                
                <hr style="border: 0; border-top: 1px solid var(--border-color, #334155); margin: 0.5rem 0;">
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600;">Amount Paid</span>
                    <strong style="font-size: 1.3rem; color: var(--text-main);">₦${parseFloat(data.amount || 0).toLocaleString()}</strong>
                </div>
            </div>

            <button id="close-receipt-modal" class="btn btn-primary" style="margin-top: 2rem;">Dismiss</button>
        `;

        // Attach event handler to dismiss button action
        document.getElementById('close-receipt-modal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

    } catch (err) {
        console.error("Error generating invoice viewport details: ", err);
        contentBox.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Failed to construct receipt layout views.</div>`;
    }
};

// Click outside the box container structure framework option to close modal natively
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
});