let currentRole = 'admin';

function switchRole(role) {
    currentRole = role;
    const tabs = document.querySelectorAll('.role-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const idLabel = document.getElementById('idLabel');
    const usernameInput = document.getElementById('usernameInput');
    const submitBtn = document.getElementById('submitBtn');
    const portalSubtitle = document.getElementById('portalSubtitle');

    if (role === 'admin') {
        idLabel.innerText = "Admin ID / Email";
        usernameInput.placeholder = "Enter admin credentials...";
        submitBtn.innerText = "Authenticate Admin Portal";
        portalSubtitle.innerText = "Access Menu CRUD, Hiring & System Controls";
    } else if (role === 'employee') {
        idLabel.innerText = "Employee ID / Username";
        usernameInput.placeholder = "Enter staff credentials...";
        submitBtn.innerText = "Access Kitchen & Floor Portal";
        portalSubtitle.innerText = "Access Live Table & Active Order Queue";
    } else if (role === 'rider') {
        idLabel.innerText = "Rider Call Sign / Phone";
        usernameInput.placeholder = "Enter rider ID...";
        submitBtn.innerText = "Access Rider Logistics";
        portalSubtitle.innerText = "Access Delivery Dispatch & Order Tracker";
    }
}

// Auto-dismiss alert message timer
document.addEventListener('DOMContentLoaded', (event) => {
    const alertBox = document.getElementById('alertMessage');
    if (alertBox) {
        setTimeout(() => {
            alertBox.style.opacity = '0';
            setTimeout(() => {
                alertBox.remove();
            }, 500);
        }, 2000);
    }
});

// Password visibility toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const eyeIcon = document.getElementById('eyeIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}