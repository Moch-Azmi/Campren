document.addEventListener("DOMContentLoaded", () => {

const fullnameInput = document.getElementById('fullname');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput  = document.getElementById('confirm-password');

const signupBtn = document.getElementById('signupBtn');
const btnLoader = document.getElementById('btnLoader');
const btnText   = signupBtn.querySelector('.btn-text');

function showError(inputEl, errorId, msg) {
  inputEl.classList.add('error');
  document.getElementById(errorId).textContent = msg;
}

function clearError(inputEl, errorId) {
  inputEl.classList.remove('error');
  document.getElementById(errorId).textContent = '';
}

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validatePassword(v) {
  return v.length >= 8;
}

// ================= SIGNUP =================
signupBtn.addEventListener('click', () => {

  const nama  = fullnameInput.value.trim();
  const email = emailInput.value.trim();
  const pass  = passwordInput.value;
  const conf  = confirmInput.value;

  let valid = true;

  if (!nama) { showError(fullnameInput,'fullname-error','Nama wajib'); valid=false; }
  else clearError(fullnameInput,'fullname-error');

  if (!email || !validateEmail(email)) {
    showError(emailInput,'email-error','Email tidak valid');
    valid=false;
  } else clearError(emailInput,'email-error');

  if (!pass || !validatePassword(pass)) {
    showError(passwordInput,'password-error','Password minimal 8 karakter');
    valid=false;
  } else clearError(passwordInput,'password-error');

  if (conf !== pass) {
    showError(confirmInput,'confirm-password-error','Password tidak sama');
    valid=false;
  } else clearError(confirmInput,'confirm-password-error');

  if (!valid) return;

  signupBtn.disabled = true;
  btnText.textContent = "Loading...";
  btnLoader.classList.add('show');

  fetch("http://localhost:8080/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama,
      email,
      password: pass
    })
  })
  .then(res => res.text())
  .then(result => {

    signupBtn.disabled = false;
    btnLoader.classList.remove('show');
    btnText.textContent = "Sign Up";

    if (result === "registered") {
      btnText.textContent = "Success ✓";

      setTimeout(() => {
        window.location.href = "../Login/index.html";
      }, 1200);

    } else if (result === "email exists") {
      showError(emailInput,'email-error','Email sudah terdaftar');
    } else {
      alert("Signup gagal");
    }

  })
  .catch(err => {
    signupBtn.disabled = false;
    btnLoader.classList.remove('show');
    btnText.textContent = "Sign Up";
    console.error(err);
    alert("Server error");
  });

});


// ================= FOOTER LOGIN LINK FIX =================
document.querySelector(".footer-link").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "../Login/index.html";
});

});