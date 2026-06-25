// ==========================================
// NAVIGATION & HAMBURGER MENU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
        });

        document.querySelectorAll('.nav-link, .btn-primary').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ==========================================
    // SECTION AGREEMENT (RESILogic Fix)
    // ==========================================
    const policyBox = document.getElementById('policyBox');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const submitBtn = document.getElementById('submitBtn');
    const scrollWarning = document.getElementById('scrollWarning');
    const agreementForm = document.getElementById('agreementForm');

    if (policyBox && agreeCheckbox) {
        policyBox.addEventListener('scroll', () => {
            // Added a 5px buffer tolerance to account for browser zoom and padding variances
            const tolerance = 5;
            const isBottom = (policyBox.scrollTop + policyBox.clientHeight + tolerance) >= policyBox.scrollHeight;

            if (isBottom) {
                agreeCheckbox.disabled = false;
                if (scrollWarning) scrollWarning.style.display = 'none';
            }
        });

        agreeCheckbox.addEventListener('change', () => {
            if(submitBtn) submitBtn.disabled = !agreeCheckbox.checked;
        });
    }

    if (agreementForm) {
        agreementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (agreeCheckbox && agreeCheckbox.checked) {
                // Ensure these element IDs match your HTML wrapper tags
                const agreementSection = document.getElementById('agreementSection');
                const authSection = document.getElementById('authSection');
                
                if(agreementSection) agreementSection.style.display = 'none';
                if(authSection) authSection.style.display = 'block';
                
                if (typeof window.switchTab === 'function') {
                    window.switchTab('login');
                }
            } else {
                alert('Please accept the terms and conditions first.');
            }
        });
    }

    // Initial disable state configuration for registration forms
    const proceed3Btn = document.getElementById('proceedStep3Btn');
    if (proceed3Btn) proceed3Btn.disabled = true;
});

// ==========================================
// FIREBASE CONFIGURATION SETUP (Modular v12)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";

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
const analytics = getAnalytics(app);

// Global State Variable for Username Validation
window.isUsernameAvailableValid = false;

// Module level state cache to capture verified document clean username safely for dashboard transition
let verifiedUsernameCache = null;

// ==========================================
// FORM TAB & STEP NAVIGATION HANDLERS
// ==========================================
window.switchTab = function(tabName) {
    const loginTab = document.getElementById('loginTabBtn');
    const registerTab = document.getElementById('registerTabBtn');
    
    const loginForm = document.getElementById('loginForm');
    const regStep1 = document.getElementById('registerStep1');
    const regStep2 = document.getElementById('registerStep2');
    const regStep3 = document.getElementById('registerStep3');

    if (tabName === 'login') {
        if(loginTab) loginTab.classList.add('active');
        if(registerTab) registerTab.classList.remove('active');
        
        if(loginForm) loginForm.classList.add('active');
        if(regStep1) regStep1.classList.remove('active');
        if(regStep2) regStep2.classList.remove('active');
        if(regStep3) regStep3.classList.remove('active');
    } else {
        if(registerTab) registerTab.classList.add('active');
        if(loginTab) loginTab.classList.remove('active');
        
        // Explicitly activate register step 1 so the form displays when switching to register
        if(regStep1) regStep1.classList.add('active');
        
        if(loginForm) loginForm.classList.remove('active');
        if(regStep2) regStep2.classList.remove('active');
        if(regStep3) regStep3.classList.remove('active');
        
        resetRegistrationForms();
    }
}

window.nextStep = function(current, next) {
    if (current === 1 && next === 2) {
        // Bulletproof check: Look to see if sponsorFullname span is populated from verification
        const sponsorName = document.getElementById('sponsorFullname').textContent.trim();
        if (!sponsorName) {
            alert('Please verify the sponsor username first.');
            return;
        }
    }
    
    if (current === 2 && next === 3) {
        if (!window.isUsernameAvailableValid) {
            alert('Please choose an available username before proceeding.');
            return;
        }
        
        // Ensure Step 2 created passwords match before moving forward
        const loginPassword = document.getElementById('regLoginPassword').value;
        const confirmLoginPassword = document.getElementById('confirmLoginPassword').value;
        if (loginPassword !== confirmLoginPassword) {
            alert('Your login passwords do not match. Please verify.');
            return;
        }
    }
    
    document.getElementById(`registerStep${current}`).classList.remove('active');
    document.getElementById(`registerStep${next}`).classList.add('active');
}

window.prevStep = function(current, prev) {
    document.getElementById(`registerStep${current}`).classList.remove('active');
    document.getElementById(`registerStep${prev}`).classList.add('active');
}

function resetRegistrationForms() {
    const form1 = document.getElementById('registerStep1');
    const form2 = document.getElementById('registerStep2');
    const form3 = document.getElementById('registerStep3');
    
    if(form1) form1.reset();
    if(form2) form2.reset();
    if(form3) form3.reset();
    
    document.getElementById('sponsorVerifyBox').style.display = 'none';
    document.getElementById('proceedStep2Btn').style.display = 'none';
    document.getElementById('verifySponsorBtn').style.display = 'block';
    
    const usernameStatus = document.getElementById('usernameStatus');
    if(usernameStatus) usernameStatus.style.display = 'none';
    
    const proceedBtn = document.getElementById('proceedStep3Btn');
    if(proceedBtn) proceedBtn.disabled = true;

    window.isUsernameAvailableValid = false;
}

// ==========================================
// REAL-TIME USERNAME AVAIL AVAILABILITY CHECKER
// ==========================================
window.checkUsernameAvailability = async function() {
    const username = document.getElementById('regUsername').value.trim();
    const statusDiv = document.getElementById('usernameStatus');
    const proceedBtn = document.getElementById('proceedStep3Btn');

    if (username.length < 3) {
        statusDiv.style.display = 'none';
        if(proceedBtn) proceedBtn.disabled = true;
        window.isUsernameAvailableValid = false;
        return;
    }

    try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);

        statusDiv.style.display = 'block';
        if (querySnapshot.empty) {
            statusDiv.className = 'username-status available';
            statusDiv.textContent = 'Username is available!';
            if(proceedBtn) proceedBtn.disabled = false;
            window.isUsernameAvailableValid = true;
        } else {
            statusDiv.className = 'username-status taken';
            statusDiv.textContent = 'Username is already taken.';
            if(proceedBtn) proceedBtn.disabled = true;
            window.isUsernameAvailableValid = false;
        }
    } catch (err) {
        console.error("Username check error:", err);
    }
}

// ==========================================
// LOGIN VERIFICATION & AUTH LOGIC
// ==========================================
window.verifyLoginUser = async function() {
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const inputPassword = document.getElementById('loginPassword').value.trim();
    const verifyBox = document.getElementById('loginVerifyBox');
    const userSpan = document.getElementById('loginUserFullname');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const verifyBtn = document.getElementById('loginVerifyBtn');

    if (!identifier || !inputPassword) {
        alert('Please enter both your Email/Username and Password.');
        return;
    }

    try {
        const usersRef = collection(db, 'users');
        
        // Check Email
        let q = query(usersRef, where('email', '==', identifier));
        let querySnapshot = await getDocs(q);

        // If empty, check Username
        if (querySnapshot.empty) {
            q = query(usersRef, where('username', '==', identifier));
            querySnapshot = await getDocs(q);
        }

        if (querySnapshot.empty) {
            alert('User does not exist in our records. Please check your details.');
            verifyBox.style.display = 'none';
            return;
        }

        let userData;
        querySnapshot.forEach(doc => {
            userData = doc.data();
        });

        // Strict backend password validation before showing identity
        if (userData.loginPassword !== inputPassword) {
            alert('Wrong password provided. Please check your credentials.');
            verifyBox.style.display = 'none';
            return;
        }

        // Cache the verified user's specific username string
        verifiedUsernameCache = userData.username;

        userSpan.textContent = userData.fullname;
        verifyBox.style.display = 'block';
        
        verifyBtn.style.display = 'none';
        submitBtn.style.display = 'block';

    } catch (error) {
        console.error("Error verifying user:", error);
        alert('An error occurred. Please try again.');
    }
}

// Attach login execution event
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const finalUsername = verifiedUsernameCache || document.getElementById('loginIdentifier').value.trim();
    
    // Save exactly who logged in into localStorage so pages can fetch profiles dynamically
    localStorage.setItem('currentUsername', finalUsername);

    alert('Login Successful! Welcome back.');
    window.location.href = 'dashboard.html'; 
});

// ==========================================
// REGISTRATION WIZARD LOGIC
// ==========================================
window.verifySponsor = async function() {
    const sponsorUsername = document.getElementById('sponsorUsername').value.trim();
    const verifyBox = document.getElementById('sponsorVerifyBox');
    const nameSpan = document.getElementById('sponsorFullname');
    const proceedBtn = document.getElementById('proceedStep2Btn');
    const verifyBtn = document.getElementById('verifySponsorBtn');

    if (!sponsorUsername) {
        alert('Please enter a sponsor username');
        return;
    }

    try {
        const q = query(collection(db, 'users'), where('username', '==', sponsorUsername));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            alert('Sponsor not found! Please check the username.');
            verifyBox.style.display = 'none';
            return;
        }

        let sponsorData;
        querySnapshot.forEach(doc => {
            sponsorData = doc.data();
        });

        nameSpan.textContent = sponsorData.fullname;
        verifyBox.style.display = 'block';
        
        verifyBtn.style.display = 'none';
        proceedBtn.style.display = 'block';

    } catch (error) {
        console.error("Error verifying sponsor:", error);
        alert('Verification failed, please try again.');
    }
}

// Form 3 / Final Processing
document.getElementById('registerStep3').addEventListener('submit', async (e) => {
    e.preventDefault();

    const sponsorUsername = document.getElementById('sponsorUsername').value.trim();
    const confirmSponsor = document.getElementById('confirmSponsor').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const fullname = document.getElementById('regFullname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const dob = document.getElementById('regDob').value;
    const loginPassword = document.getElementById('regLoginPassword').value;
    
    // Capturing new user custom payment/wallet password created in step 3
    const regWalletPassword = document.getElementById('regWalletPassword').value.trim();
    
    // Payment password input used strictly to verify sponsor identity
    const paymentPasswordInput = document.getElementById('regWalletPassword').value.trim();
    
    const paymentError = document.getElementById('paymentErrorMsg');
    paymentError.style.display = 'none';

    if (sponsorUsername !== confirmSponsor) {
        alert('Sponsor username mismatch confirmed in step 3.');
        return;
    }

    try {
        const usersRef = collection(db, 'users');

        // 1. Validate if username already exists
        const checkUserQuery = query(usersRef, where('username', '==', username));
        const checkUser = await getDocs(checkUserQuery);
        
        if(!checkUser.empty) {
            alert('Username is already taken. Please choose another.');
            return;
        }

        // 2. Security rule: Validate existing Email uniqueness
        const checkEmailQuery = query(usersRef, where('email', '==', email));
        const checkEmail = await getDocs(checkEmailQuery);
        if(!checkEmail.empty) {
            alert('This email address is already registered to an existing account.');
            return;
        }

        // 3. Security rule: Validate existing Phone Number uniqueness
        const checkPhoneQuery = query(usersRef, where('phone', '==', phone));
        const checkPhone = await getDocs(checkPhoneQuery);
        if(!checkPhone.empty) {
            alert('This phone number is already registered to an existing account.');
            return;
        }

        // BACKEND CHECK: Fetch Sponsor payload for verification password evaluation
        const sponsorSnapQuery = query(usersRef, where('username', '==', sponsorUsername));
        const sponsorSnap = await getDocs(sponsorSnapQuery);
        
        let actualSponsorData = null;
        let sponsorDocId = null;
        
        sponsorSnap.forEach(doc => {
            actualSponsorData = doc.data();
            sponsorDocId = doc.id;
        });

        // Verify sponsor security credentials
        if (!actualSponsorData || actualSponsorData.walletPassword !== paymentPasswordInput) {
            alert('Wrong password! Sponsor payment password mismatch on the backend.');
            return;
        }

        // Fee logic applied to Sponsor's wallet account balance
        const feeDeducted = 2000;
        const currentSponsorBalance = Number(actualSponsorData.walletBalance || 0);

        if (currentSponsorBalance < feeDeducted) {
            paymentError.textContent = "Insufficient balance. Registration failed.";
            paymentError.style.display = 'block';
            return;
        }

        const sponsorNewBalance = currentSponsorBalance - feeDeducted;
        const assignedWalletBalance = 0; // New user is initialized with zero balance

        // 1. Deduct fee directly from the Sponsor's document balance tracking
        const sponsorDocRef = doc(db, 'users', sponsorDocId);
        await updateDoc(sponsorDocRef, {
            walletBalance: sponsorNewBalance
        });

       // 2. Commit registration payload to users collection for the new user profile
        await setDoc(doc(db, 'users', username), {
            username: username,
            fullname: fullname,
            email: email,
            phone: phone,
            address: address,
            dob: dob,
            sponsor: sponsorUsername,
            loginPassword: loginPassword,
            walletPassword: regWalletPassword, 
            walletBalance: assignedWalletBalance,
            
            // New affiliate performance and commission fields tracking
            bonus: 0,
            totalCoursesSold: 0,
            totalEarnings: 0,
            
            status: "active",
            registeredAt: new Date().toISOString()
        });

        // Auto-login the newly registered account as well!
        localStorage.setItem('currentUsername', username);

        // SUCCESS ROUTE: Notify user and route directly to the dashboard
        alert('Successful registration! Fee of ₦2,000 deducted from Sponsor account. Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
        
    } catch (err) {
        console.error("Registration write transaction error", err);
        alert('Registration failed due to backend errors.');
    }
});



