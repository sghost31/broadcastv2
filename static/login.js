async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Basic client-side validation
    if (!email || !password) {
      alert('Please provide email and password.');
      return;
    }

    try {
      const response = await fetch('http://192.168.1.225:5123/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Response:', response);
      if (response.ok) {
        alert('Login successful!');
        console.log('JWT Token:', data.token);
        window.location.href = '/lobby.html';
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  }