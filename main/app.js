const express = require('express');
const mongoose = require("mongoose")
const ejsMate = require('ejs-mate');
const session = require('express-session');
const showdown = require('showdown');
const path = require('path');
const flash = require('connect-flash');

const User = require("./models/user");
const { isLoggedIn, extraxtText } = require('./middlewares');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/markScriptDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('Connected to DB'); })
    .catch(err => console.log(err.message));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

const converter = new showdown.Converter({
    tables: true,
    omitExtraWLInCodeBlocks: true,
    strikethrough: true,
    emoji: true,
    completeHTMLDocument: true
});

app.use((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//Home Route
app.get('/', (req, res) => {
    res.render('user/home');
})

//Register Routes
app.route('/register')
    .get(async (req, res) => {
        const userCount = await User.countDocuments({});
        res.render('user/register', { userCount });
    })
    .post(async (req, res) => {
        const { password, username } = req.body;
        const user = new User({ username, password })
        await user.save();
        req.session.username = user.username;
        req.flash('success', 'Successfully Registered');
        res.redirect('/');
    })

//Login Routes
app.route('/login')
    .get((req, res) => {
        res.render('user/login');
    })
    .post(async (req, res) => {
        const { username, password } = req.body;
        const foundUser = await User.findAndValidate(username, password);
        if (foundUser) {
            req.session.username = foundUser.username;
            req.flash('success', 'Welcome to MarkScript!');
            res.redirect('/');
        } else {
            req.flash('error', 'Wrong Credentials');
            res.redirect('/login');
        }
    })

//MyDocs Routes
app.route('/my-docs')
    .get(isLoggedIn, async (req, res) => {
        const { username } = req.session;
        const user = await User.findOne({ username });
        res.render('user/my-docs', { docs: user.docs });
    })
    .post(isLoggedIn, async (req, res) => {
        const { username } = req.session;
        const user = await User.findOne({ username });
        user.docs.push(req.body);
        await user.save();
        req.flash('success', 'Successfully Created the Document');
        res.redirect('/my-docs');
    })

//Generate Route
app.post('/generate/:id', isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username } = req.session;
        const user = await User.findOne({ username });
        const docs = user.docs;

        let text = '# MarkScript';

        for (let doc of docs) {
            if (id === doc._id.toString()) {
                const docId = doc.link.substring(32);
                text = await extraxtText(docId);
            }
        }
        const html = converter.makeHtml(text);
        res.render('user/output.ejs', { html });
    } catch {
        next();
    }
})

//Delete Route
app.post('/delete/:id', isLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username } = req.session;
        const user = await User.findOne({ username });
        user.docs = user.docs.filter(ele => ele._id.toString() !== id);
        await user.save();
        req.flash('success', 'Successfully Deleted the Document');
        res.redirect('/my-docs');
    }
    catch {
        next();
    }
})

//LogOut Route
app.get('/logout', (req, res) => {
    req.session.username = null;
    req.flash('success', 'Successfully Logged Out');
    res.redirect('/');
})

app.all('*', (req, res) => {
    res.render('404');
})

app.listen(3100, (req, res) => {
    console.log('Listening');
})