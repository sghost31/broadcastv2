async function submitVerificationCode() {
    const verificationCode = document.getElementById('verificationCode').value;

    if (!verificationCode) {
      alert('Please enter the verification code.');
      return;
    }

    try {
      console.log('Sending request to http://192.168.1.225:5123/verify');
      const response = await fetch('http://192.168.1.225:5123/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Verification successful! You can now log in.');
        window.location.href = 'login.html';
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  }