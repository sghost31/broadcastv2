async function signup() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value;
    const socket = io("https://192.168.1.225:5123", { path: "/socket.io" });
    // Basic client-side validation
    if (!username || !email || !password || !confirmPassword || !phone) {
      alert('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://192.168.1.225:5123/signup', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password, confirmPassword, phone }),
          credentials: 'include',  // Include credentials (cookies) in the request
          mode: 'cors',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful!');
        console.log('JWT Token:', data.token);
        window.location.href = '/verification.html';

      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  }
