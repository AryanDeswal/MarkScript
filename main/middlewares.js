const mongoose = require("mongoose")
const Document = require('./models/document')

module.exports.extraxtText = async (docId) => {
    if (docId.length !== 36) {
        return '# MarkScript';
    }
    const document = await Document.findOne({ docId });
    const data = document.data.ops[0].insert;
    return data;
}

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    next();
}