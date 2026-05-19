function renderNav(containerId) {
    const nav = document.getElementById(containerId);
    if (!nav) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    } else if (user.role === 'shelter' || user.role === 'rescuer') {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="dashboard.html"> Dashboard</a>
            <a href="profile.html"> Profile</a>
            <a href="#" onclick="logout(); return false;">Logout</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="my-requests.html"> My Requests</a>
            <a href="profile.html"> Profile</a>
            <a href="#" onclick="logout(); return false;">Logout</a>
        `;
    }

    // mark the current page link as active
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a').forEach(function(link) {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}