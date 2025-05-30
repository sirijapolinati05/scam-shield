const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const { getDocs, query, collection, where } = require('firebase/firestore');

admin.initializeApp();
sgMail.setApiKey('your-sendgrid-api-key'); // Replace with your SendGrid API key

exports.signUp = functions.https.onRequest(async (req, res) => {
  const { email, password, username, dob, gender } = req.body;

  try {
    const q = query(collection(admin.firestore(), 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: 'username-already-exists' });
    }

    const userRecord = await admin.auth().createUser({ email, password });
    const token = crypto.randomBytes(32).toString('hex');

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      username,
      email,
      uid: userRecord.uid,
      dob,
      gender,
      isVerified: false,
      confirmationToken: token,
      createdAt: new Date(),
    });

    const confirmationLink = `http://localhost:3000/confirm?token=${token}`; // Update for production
    await sgMail.send({
      to: email,
      from: 'your-verified-email@yourdomain.com', // Verified in SendGrid
      subject: 'Email Confirmation',
      text: `Please confirm your email: ${confirmationLink}`,
    });

    res.status(201).json({ message: 'Signup successful! Please check your email.' });
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

exports.confirmEmail = functions.https.onRequest(async (req, res) => {
  const { token } = req.query;

  try {
    const userSnapshot = await admin.firestore().collection('users').where('confirmationToken', '==', token).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userDoc = userSnapshot.docs[0];
    await userDoc.ref.update({ isVerified: true, confirmationToken: null });
    await admin.auth().updateUser(userDoc.id, { emailVerified: true });

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});
