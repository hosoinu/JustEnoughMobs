import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyA8JLGsugNvlMso3VEoFdOUMCIdqKiF9XQ",
  authDomain: "justenoughmobs.firebaseapp.com",
  projectId: "justenoughmobs",
  storageBucket: "justenoughmobs.firebasestorage.app",
  messagingSenderId: "644805110590",
  appId: "1:644805110590:web:f5b97212c0fbaf4e605a6f",
  measurementId: "G-7Q7BRL80XQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signupForm = document.getElementById('signup-form');
const usernameInput = document.getElementById('signup-username');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const confirmPasswordInput = document.getElementById('signup-confirm-password');
const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmError = document.getElementById('confirm-error');
const successMessage = document.getElementById('success-message');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let isValid = true;

  // Client-side validations
  if (username.length < 3) {
    showError(usernameError, 'Username must be at least 3 characters');
    isValid = false;
  }

  if (!isValidEmail(email)) {
    showError(emailError, 'Please enter a valid email');
    isValid = false;
  }

  if (password.length < 6) {
    showError(passwordError, 'Password must be at least 6 characters');
    isValid = false;
  }

  if (password !== confirmPassword) {
    showError(confirmError, 'Passwords do not match');
    isValid = false;
  }

  if (!isValid) return;

  try {
    // Check if username exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      showError(usernameError, 'Username already taken');
      return;
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    try {
      await updateProfile(user, { displayName: username });
    } catch (updateError) {
      console.error('Error updating profile:', updateError);
      showError(usernameError, 'Failed to update profile. Please try again later.');
    }

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username,
      email,
      foundMobs: [],
      slainMobs: []
    });

    // Show success and redirect
    successMessage.textContent = 'ACCOUNT CREATED SUCCESSFULLY!';
    successMessage.style.display = 'block';
    setTimeout(() => window.location.href = 'index.html', 1500);

  } catch (error) {
    handleAuthError(error);
  }
});

function clearErrors() {
  [usernameError, emailError, passwordError, confirmError].forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
  successMessage.style.display = 'none';
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function handleAuthError(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      showError(emailError, 'Email already registered');
      break;
    case 'auth/weak-password':
      showError(passwordError, 'Password too weak (min 6 chars)');
      break;
    default:
      showError(emailError, 'Error: ' + error.message);
  }
}