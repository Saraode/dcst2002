document.addEventListener('DOMContentLoaded', function () {
  let loginEmailInput = document.getElementById('loginEmail');
  let loginPasswordInput = document.getElementById('loginPassword');
  let loginBtn = document.getElementById('loginBtn');
  let signupAnchor = document.getElementById('signupAnchor');

  async function signIn() {
    let loginEmail = loginEmailInput.value;
    let loginPassword = loginPasswordInput.value;

    if (loginEmail === '' || loginPassword === '') {
      swal({ text: 'Vennligst fyll ut alle feltene' });
      return;
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (response.ok) {
        const result = await response.json();

        // Store both userId and userName in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('userName', result.userName);

        swal({
          text: 'Login successful',
          icon: 'success',
          buttons: true,
        }).then(() => {
          window.location.href = '../index.html';
        });
      } else {
        const result = await response.json();
        swal({ text: result.error || 'Failed to log in' });
      }
    } catch (error) {
      swal({ text: 'Error connecting to the server' });
    }
  }

  loginBtn.addEventListener('click', function () {
    signIn();
  });

  signupAnchor.addEventListener('click', function () {
    window.location.href = 'signup.html';
  });
});
