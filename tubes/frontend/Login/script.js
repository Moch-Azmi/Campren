
const signInBtn = document.getElementById('signInBtn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(res => res.text())
    .then(data => {
        if (data === "registered") {
            // PINDAH KE DASHBOARD
            window.location.href = "tubes/frontend/Dashboard/index.html";
        } else {
            alert("Login gagal");
        }
    });
}

function validateEmail(email) {
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(input, message) {
    input.classList.add('error');
    input.classList.remove('success');
    
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);
    }
}

function showSuccess(input) {
    input.classList.add('success');
    input.classList.remove('error');
    
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function clearValidation(input) {
    input.classList.remove('error', 'success');
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = '';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

function handleSignIn(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    clearValidation(emailInput);
    clearValidation(passwordInput);
    
    let isValid = true;
    
    if (!email) {
        showError(emailInput, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email');
        isValid = false;
    } else {
        showSuccess(emailInput);
    }
    
    if (!password) {
        showError(passwordInput, 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        showSuccess(passwordInput);
    }
    
    if (isValid) {
    setLoading(signInBtn, true);

    fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.text())
    .then(result => {
        setLoading(signInBtn, false);

        if (result === "registered") {
            alert("✅ Account is registered!");
        } else {
            alert("❌ Account is NOT registered!");
        }
    })
    .catch(error => {
        setLoading(signInBtn, false);
        alert("Server error. Check backend.");
        console.error(error);
    });
    }
}

function handleGoogleSignIn(e) {
    e.preventDefault();
    
    setLoading(googleSignInBtn, true);
    
    setTimeout(() => {
        setLoading(googleSignInBtn, false);
        alert('Google Sign In would be initiated here.\nIn production, this would redirect to Google OAuth.');
    }, 1000);
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    
    if (email && validateEmail(email)) {
        alert(`Password reset link would be sent to:\n${email}`);
    } else {
        alert('Please enter a valid email address first.');
        emailInput.focus();
    }
}

function handleSignUp(e) {
    e.preventDefault();
    alert('Sign Up page would be shown here.');
}

emailInput.addEventListener('input', () => {
    if (emailInput.value.trim() && emailInput.classList.contains('error')) {
        clearValidation(emailInput);
    }
});

passwordInput.addEventListener('input', () => {
    if (passwordInput.value && passwordInput.classList.contains('error')) {
        clearValidation(passwordInput);
    }
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSignIn(e);
    }
});

signInBtn.addEventListener('click', handleSignIn);
googleSignInBtn.addEventListener('click', handleGoogleSignIn);

document.querySelector('.forgot-password').addEventListener('click', handleForgotPassword);
document.querySelector('.signup-link').addEventListener('click', handleSignUp);

window.addEventListener('load', () => {
    emailInput.focus();
});

window.addEventListener('load', () => {
    const wavyLines = document.querySelector('.wavy-lines');
    if (wavyLines) {
        wavyLines.style.opacity = '0';
        setTimeout(() => {
            wavyLines.style.transition = 'opacity 1s ease-in';
            wavyLines.style.opacity = '1';
        }, 100);
    }
});

window.addEventListener('load', () => {
    const loginCard = document.querySelector('.login-card');
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        loginCard.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 200);
});
