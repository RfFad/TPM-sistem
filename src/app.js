const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

/**
 * Body Parser
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

/**
 * Static files
 */
app.use(express.static(path.join(__dirname, '../public')));

/**
 * View Engine
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Routes
 */
const webRoutes = require('./routes/web');
app.use('/', webRoutes);

const istilahRoutes = require('./routes/istilahRoutes');
app.use('/istilah', istilahRoutes);

const prosesRoutes = require('./routes/rekrutRoutes/prosesRoutes');
app.use('/prosesRekrut', prosesRoutes);

const revisiRoutes = require('./routes/rekrutRoutes/revisiController');
app.use('/revisi', revisiRoutes);

const dokumenRoutes = require('./routes/dokumen/dokumenRoutes');
app.use('/dokumen', dokumenRoutes);

const authRoutes = require('./routes/auth/authRoutes');
app.use('/auth', authRoutes);

const user = require('./routes/develop/userRoutes')
app.use('/user', user);
/**
 * Server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
