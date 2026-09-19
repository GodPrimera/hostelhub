const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.showRegisterForm = (req, res) => {
    res.render('auth/signup', { errors: {}, FormData: {}, error: req.flash('error')[0] || null });
}

exports.registerUser = async (req, res) => {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const matricule = req.body.matricule?.trim().toUpperCase();
    const { password, confirmPassword } = req.body;

    const errors = {};

    if (!name) errors.name = 'Name is required';
    if (!email || !email.trim()) errors.email = 'Email is required';
    if (!matricule) errors.matricule = 'Staff matricule is required';
    if (!password || password.length < 8 ) errors.password = 'Password must be atleast 8 characters';
    if (!confirmPassword || confirmPassword !== password) errors.confirmPassword = 'Please confirm your password';

    if (Object.keys(errors).length > 0) {
        return res.render('auth/signup', {
            errors,
            FormData: { name, email, matricule },
            error: errors.matricule || null
        });
    }

    try {
       const hashedPassword = await bcrypt.hash(password, 10);
       await User.create({ name, email, matricule, password: hashedPassword });
       req.flash('success', 'Account created. Please sign in.');
       return res.redirect('/login');
    } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern || {})[0];
            const message = duplicateField === 'matricule'
                ? 'This staff matricule is already in use'
                : 'This email is already in use';
            return res.render('auth/signup', { errors: {}, FormData: { name, email, matricule }, error: message })
        }
        console.log('Error creating user', err)
        return res.render('auth/signup', { errors, FormData: { name, email, matricule }, error: 'Something went wrong'})
    }
}

exports.showLoginForm = (req, res) => {
    res.render('auth/login', {
        errors: {},
        formData: {},
        error: req.flash('error')[0] || null,
        message: req.flash('success')[0] || null
    });
}

exports.loginUser = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;
        if (!email || !password) {
            return res.render('auth/login', { errors: {}, formData: { email }, error: 'Invalid email or password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', { errors: {}, formData: { email }, error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', { errors: {}, formData: { email }, error: 'Invalid email or password' });
        }

        return req.session.regenerate((sessionError) => {
            if (sessionError) return res.render('auth/login', { errors: {}, formData: { email }, error: 'Unable to start a secure session. Please try again.' });
            req.session.userId = user._id.toString();
            req.session.userName = user.name;
            req.flash('success', 'Logged in successfully.');
            return req.session.save((saveError) => {
                if (saveError) return res.render('auth/login', { errors: {}, formData: { email }, error: 'Unable to save your session. Please try again.' });
                return res.redirect('/dashboard');
            });
        });
    } catch (err) {
        console.error(err);
        return res.render('auth/login', { errors: {}, error: 'Something went wrong', formData: {} });
    }

}



exports.logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.redirect('/dashboard');
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
};
