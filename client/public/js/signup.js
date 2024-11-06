document.addEventListener('DOMContentLoaded', function () {
  let signupBtn = document.getElementById('signupBtn');
  let signupNameInput = document.getElementById('signupName');
  let signupEmailInput = document.getElementById('signupEmail');
  let signupPasswordInput = document.getElementById('signupPassword');
  let loginAnchor = document.getElementById('loginAnchor');

  async function signUp() {
    let user = {
      name: signupNameInput.value,
      email: signupEmailInput.value,
      password: signupPasswordInput.value,
    };

    if (!user.name || !user.email || !user.password) {
      swal({ text: 'Please fill in all fields' });
      return;
    }

    if (!isValidEmail(user.email)) {
      swal({ text: 'Invalid email format' });
      return;
    }

    try {
      // Send user data to the backend API to register the user
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const result = await response.json();

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', result.userId); // Store the user's ID
        localStorage.setItem('userName', user.name); // Store the name directly from the input

        swal({
          text: 'Sign up successful',
          icon: 'success',
          buttons: true,
        }).then(() => {
          window.location.href = '/index.html';
        });
        clearForm();
      } else {
        const result = await response.json();
        swal({ text: result.error || 'Failed to register user' });
      }
    } catch (error) {
      swal({ text: 'Error connecting to the server' });
    }
  }

  function isValidEmail(email) {
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function clearForm() {
    signupNameInput.value = '';
    signupEmailInput.value = '';
    signupPasswordInput.value = '';
  }

  signupBtn.addEventListener('click', function () {
    signUp();
  });

  loginAnchor.addEventListener('click', function () {
    window.location.href = 'indexsignup.html';
  });
});
