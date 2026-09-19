module.exports = function checkAuthenticated (req, res, next) {
    if (!req.session.userId) {
        req.flash('error', 'Please sign in to continue.');
        return res.redirect('/login');
    }
    next();
}

