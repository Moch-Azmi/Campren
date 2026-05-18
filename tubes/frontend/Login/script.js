async function handleLogin() {

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

        console.log("LOGIN RESULT:", result);

        // LOGIN BERHASIL
        if (res.ok && result.status === "registered") {

            // simpan data user
            localStorage.setItem(
                "user",
                JSON.stringify(result)
            );

            alert("Login berhasil");

            window.location.href =
                "../Dashboard/index.html";

        } else {

            alert("Email / password salah");

        }

    } catch (err) {

        console.error(err);

        alert("Server error");

    }

    setLoading(false);
}