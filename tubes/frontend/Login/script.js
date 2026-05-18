document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    const signInBtn = document.getElementById("signInBtn");

    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");

    function setLoading(state) {

        signInBtn.disabled = state;

        signInBtn.textContent =
            state ? "Loading..." : "Sign In";
    }

    async function handleLogin(e) {

        e.preventDefault();

        const email = emailInput.value.trim();

        const password = passwordInput.value.trim();

        if (!email || !password) {

            alert("Email / Password wajib diisi");

            return;
        }

        setLoading(true);

        try {

            const res = await fetch(
                "https://camprentelu.azurewebsites.net/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const result = await res.json();

            console.log("LOGIN:", result);

            if (
                res.ok &&
                result.status === "registered"
            ) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(result)
                );

                alert("Login berhasil");

                window.location.href =
                    "../Dashboard/index.html";

            } else {

                alert("Email / Password salah");

            }

        } catch (err) {

            console.error(err);

            alert("Server error");

        }

        setLoading(false);
    }

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

    document
    .querySelector(".forgot-password")
    .addEventListener("click", (e) => {

        e.preventDefault();

        window.location.href =
            "../Resetpw/index.html";
    });

    document
    .querySelector(".signup-link")
    .addEventListener("click", (e) => {

        e.preventDefault();

        window.location.href =
            "../Registrasi/index.html";
    });

});