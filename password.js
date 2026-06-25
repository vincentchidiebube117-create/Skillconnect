// password.js
// We import the already-initialized db and auth from your central file
import { auth, db } from './firebase-config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById('resetBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const btn = document.getElementById('resetBtn');

    if (!username || !email) return alert("Please fill in both fields.");

    try {
        btn.disabled = true;
        btn.textContent = "Verifying...";

        // Query Firestore using the imported 'db'
        const q = query(collection(db, "users"), where("username", "==", username), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("No account found with that username and email combination.");
            btn.disabled = false;
            btn.textContent = "Send Reset Link";
            return;
        }

        // Send reset email using the imported 'auth'
        await sendPasswordResetEmail(auth, email);
        alert("Success! A password reset link has been sent to your email.");
        window.location.href = "auth.html";

    } catch (error) {
        console.error("Reset Error:", error);
        alert("Error: " + error.message);
        btn.disabled = false;
        btn.textContent = "Send Reset Link";
    }
});