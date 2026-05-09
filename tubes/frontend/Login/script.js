document.addEventListener("DOMContentLoaded", () => {

const signInBtn = document.getElementById("signInBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

function setLoading(state) {
    signInBtn.disabled = state;
    signInBtn.textContent = state ? "Loading..." : "Sign In";
}

async function handleLogin() {

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Email / Password wajib diisi");
        return;
    }

    setLoading(true);

    try {
        const res = await fetch("https://camprentelu.azurewebsites.net/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!res.ok) {
            throw new Error("HTTP ERROR " + res.status);
        }

        const result = await res.text();

        console.log("Response backend:", result);

        const clean = result.trim().toLowerCase();

        if (clean.includes("registered")) {
            alert("Login sukses");
            window.location.href = "../Dashboard/index.html";
        } else {
            alert("Login gagal / user tidak terdaftar");
        }

    } catch (err) {
        console.error(err);
        alert("Server error / endpoint salah / 404");
    }

    setLoading(false);
}

// tombol login
signInBtn.addEventListener("click", handleLogin);

// enter key support
passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
});

});