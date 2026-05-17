function renderNav(containerId) {
    const nav = document.getElementById(containerId);
    if (!nav) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // لو مفيش token أو user، يبقى مش logged in
    if (!token || !user) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
        return;
    }

    if (user.role === 'shelter' || user.role === 'rescuer') {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="dashboard.html">🏠 Dashboard</a>
            <a href="profile.html">👤 ${user.first_name}</a>
            <a href="#" onclick="logout(); return false;">Logout</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="profile.html">📋 My Requests</a>
            <a href="profile.html">👤 ${user.first_name}</a>
            <a href="#" onclick="logout(); return false;">Logout</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}