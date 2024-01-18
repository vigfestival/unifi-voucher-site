/**
 * Import base packages
 */
const express = require('express');
const multer = require('multer');
const {v4: uuidv4} = require('uuid');
const app = express();

/**
 * Import own modules
 */
const logo = require('./modules/logo');
const types = require('./modules/types');
const time = require('./modules/time');
const unifi = require('./modules/unifi');

/**
 * Define global functions and variables
 */
const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
const voucherTypes = types(process.env.VOUCHER_TYPES || '480,0,,,;');

/**
 * Output logo
 */
logo();

/**
 * Log voucher types
 */
console.log('[VoucherType] Loaded the following types:');
voucherTypes.forEach((type, key) => {
    console.log(`[VoucherType][${key}] ${time(type.expiration)}, ${type.usage === '1' ? 'single-use' : 'multi-use'}${typeof type.upload === "undefined" && typeof type.download === "undefined" && typeof type.megabytes === "undefined" ? ', no limits' : `${typeof type.upload !== "undefined" ? `, upload bandwidth limit: ${type.upload} kb/s` : ''}${typeof type.download !== "undefined" ? `, download bandwidth limit: ${type.download} kb/s` : ''}${typeof type.megabytes !== "undefined" ? `, quota limit: ${type.megabytes} mb` : ''}`}`);
});

/**
 * Log controller
 */
console.log(`[UniFi] Using Controller on: ${process.env.UNIFI_IP || '192.168.1.1'}:${process.env.UNIFI_PORT || 443} (Site ID: ${process.env.UNIFI_SITE_ID || 'default'})`);

/**
 * Trust proxy
 */
app.enable('trust proxy');

/**
 * Set template engine
 */
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/template`);

/**
 * Enable multer
 */
app.use(multer().none());

/**
 * Request logger
 */
app.use((req, res, next) => {
    console.log(`[Web]: ${req.originalUrl}`);
    next();
});

/**
 * Serve static public dir
 */
app.use(express.static(`${__dirname}/public`));

/**
 * Configure routers
 */
app.get('/', (req, res) => {
    const hour = new Date().getHours();
    const timeHeader = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    res.render('home', {
        error: typeof req.query.error === 'string' && req.query.error !== '',
        error_text: req.query.error || '',
        banner_image: process.env.BANNER_IMAGE || `/images/bg-${random(1, 10)}.jpg`,
        app_header: timeHeader,
        sid: uuidv4(),
        timeConvert: time,
        voucher_types: voucherTypes,
        checkPassword: !process.env.USE_SECURITY_CHECK || process.env.USE_SECURITY_CHECK.toUpperCase() === 'TRUE',
        showFooter: !process.env.SHOW_FOOTER || process.env.SHOW_FOOTER.toUpperCase() === 'TRUE',
        showExistingVouchers: !process.env.SHOW_EXISTING_VOUCHERS || process.env.SHOW_EXISTING_VOUCHERS.toUpperCase() === 'TRUE'
    });
});
app.post('/', async (req, res) => {
    if (typeof req.body === "undefined") {
        res.status(400).send();
        return;
    }

    let password = req.body.password;
    let passwordCheck = password === (process.env.SECURITY_CODE || "0000");

    if (process.env.USE_SECURITY_CHECK && process.env.USE_SECURITY_CHECK.toUpperCase() === 'FALSE') {
        passwordCheck = true;
        password = '0000';
    }

    if (!passwordCheck) {
        res.redirect(encodeURI(`/?error=Invalid password!`));
        return;
    }

    const typeCheck = (process.env.VOUCHER_TYPES || '480,0,,,;').split(';').includes(req.body['voucher-type']);

    if (!typeCheck) {
        res.redirect(encodeURI(`/?error=Unknown type!`));
        return;
    }

    res.redirect(encodeURI(`/voucher?code=${password}&type=${req.body['voucher-type']}`));
});
app.get('/voucher', async (req, res) => {
    if (req.query.code !== (process.env.SECURITY_CODE || "0000")) {
        res.status(403).send();
        return;
    }

    if (!(process.env.VOUCHER_TYPES || '480,0,,,;').split(';').includes(req.query.type)) {
        res.status(400).send();
        return;
    }

    const hour = new Date().getHours();
    const timeHeader = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const voucher = await unifi.createVoucher(types(req.query.type, true));

    res.render('voucher', {
        error: typeof req.query.error === 'string' && req.query.error !== '',
        error_text: req.query.error || '',
        banner_image: process.env.BANNER_IMAGE || `/images/bg-${random(1, 10)}.jpg`,
        app_header: timeHeader,
        code: req.query.code,
        type: req.query.type,
        voucher: voucher,
        sid: uuidv4(),
        showFooter: !process.env.SHOW_FOOTER || process.env.SHOW_FOOTER.toUpperCase() === 'TRUE',
        allowPrint: process.env.PRINT_VOUCHER && process.env.PRINT_VOUCHER.toUpperCase() === 'TRUE'
    });
});
app.get('/vouchers', async (req, res) => {
    if (req.query.code !== (process.env.SECURITY_CODE || "0000")) {
        res.status(403).send();
        return;
    }

    const vouchers = await unifi.getExistingVouchers();

    res.render('existing_vouchers', {
        error: typeof req.query.error === 'string' && req.query.error !== '',
        error_text: req.query.error || '',
        app_header: 'Existing vouchers',
        vouchers: vouchers,
        sid: uuidv4(),
        showFooter: !process.env.SHOW_FOOTER || process.env.SHOW_FOOTER.toUpperCase() === 'TRUE',
        allowPrint: process.env.PRINT_VOUCHER && process.env.PRINT_VOUCHER.toUpperCase() === 'TRUE'
    });
});
app.get('/revoke', async (req, res) => {
    await unifi.revokeVoucher(req.query.id);
    res.status(202).end();
});
app.get('/print', async (req, res) => {
    await unifi.printVoucher(req.query.create_time);
    res.status(202).end();
});
app.get('/createandprint', async (req, res) => {
    let typeIndex = req.query.type_index;
    if (typeIndex === undefined || typeIndex == null) {
        typeIndex = 0;
    }
    const voucher = await unifi.createVoucher(voucherTypes[typeIndex]);
    await unifi.printVoucher(voucher.create_time);
    res.status(202).end();
});
/**
 * Setup default 404 message
 */
app.use((req, res) => {
    res.status(404);
    res.send('Not Found!');
});

/**
 * Disable powered by header for security reasons
 */
app.disable('x-powered-by');

/**
 * Start listening on port
 */
app.listen(3000, '0.0.0.0', () => {
    console.log(`[App] Running on: 0.0.0.0:3000`);
});
