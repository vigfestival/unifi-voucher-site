/**
 * Import vendor modules
 */
const unifi = require('node-unifi');
const time = require('../modules/time');
const print_voucher = require('../modules/print_voucher');
/**
 * Import own modules
 */
const config = {
    unifi: {
        ip: process.env.UNIFI_IP || '192.168.1.1',
        port: process.env.UNIFI_PORT || 443,
        username: process.env.UNIFI_USERNAME || 'admin',
        password: process.env.UNIFI_PASSWORD || 'password',
        siteID: process.env.UNIFI_SITE_ID || 'default'
    }
};

/**
 * Exports the createVoucher function
 *
 * @param type
 * @returns {Promise<unknown>}
 */
module.exports.createVoucher = (type) => {
    return new Promise((resolve) => {
        /**
         * Create new UniFi controller object
         *
         * @type {Controller}
         */
        const controller = new unifi.Controller({
            host: config.unifi.ip,
            port: config.unifi.port,
            site: config.unifi.siteID,
            sslverify: false
        });

        /**
         * Login and create a voucher
         */
        controller.login(config.unifi.username, config.unifi.password).then(() => {
            controller.getSitesStats().then(() => {
                controller.createVouchers(type.expiration, 1, type.usage === 1 ? 1 : 0, null, typeof type.upload !== "undefined" ? type.upload : null, typeof type.download !== "undefined" ? type.download : null, typeof type.megabytes !== "undefined" ? type.megabytes : null).then((voucher_data) => {
                    controller.getVouchers(voucher_data[0].create_time).then((voucher_data_complete) => {
                        const voucher = `${[voucher_data_complete[0].code.slice(0, 5), '-', voucher_data_complete[0].code.slice(5)].join('')}`;
                        resolve(voucher);
                    }).catch((e) => {
                        console.log('Error while getting voucher!');
                        console.log(e);
                        process.exit(1);
                    });
                }).catch((e) => {
                    console.log('Error while creating voucher!');
                    console.log(e);
                    process.exit(1);
                });
            }).catch((e) => {
                console.log('Error while getting site stats!');
                console.log(e);
                process.exit(1);
            });
        }).catch((e) => {
            console.log('Error while logging in!');
            console.log(e);
            process.exit(1);
        });
    });
};

/**
 * Exports the getExistingVouchers function
 *
 * @returns {Promise<unknown>}
 */
module.exports.getExistingVouchers = () => {
    return new Promise((resolve) => {
        /**
         * Create new UniFi controller object
         *
         * @type {Controller}
         */
        const controller = new unifi.Controller({
            host: config.unifi.ip,
            port: config.unifi.port,
            site: config.unifi.siteID,
            sslverify: false
        });

        /**
         * Login and gets all existing vouchers
         */
        controller.login(config.unifi.username, config.unifi.password).then(() => {
            controller.getSitesStats().then(() => {
                controller.getVouchers().then((voucher_data_complete) => {
                    let vouchers = [];
                    voucher_data_complete.forEach(function (voucher) {
                        vouchers.push({
                            id: voucher._id,
                            create_time: voucher.create_time,
                            code: `${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}`,
                            duration: time(voucher.duration),
                            type: voucher.status === 'VALID_MULTI' ? 'multi-use' : 'single-use',
                            usage_quota: voucher.qos_usage_quota !== undefined ? `${voucher.qos_usage_quota} MB` : 'unlimited',
                            upload_limit: voucher.qos_rate_max_up !== undefined ? `${voucher.qos_rate_max_up} KBit/s` : 'unlimited',
                            download_limit: voucher.qos_rate_max_down !== undefined ? `${voucher.qos_rate_max_down} KBit/s` : 'unlimited'
                        });
                    });
                    resolve(vouchers);
                }).catch((e) => {
                    console.log('Error while getting vouchers!');
                    console.log(e);
                    process.exit(1);
                });
            }).catch((e) => {
                console.log('Error while getting site stats!');
                console.log(e);
                process.exit(1);
            });
        }).catch((e) => {
            console.log('Error while logging in!');
            console.log(e);
            process.exit(1);
        });
    });

};

/**
 * Exports the revokeVoucher function
 *
 * @returns {Promise<unknown>}
 */
module.exports.revokeVoucher = (id) => {
    return new Promise((resolve) => {
        /**
         * Create new UniFi controller object
         *
         * @type {Controller}
         */
        const controller = new unifi.Controller({
            host: config.unifi.ip,
            port: config.unifi.port,
            site: config.unifi.siteID,
            sslverify: false
        });

        /**
         * Login and revoke a voucher
         */
        controller.login(config.unifi.username, config.unifi.password).then(() => {
            controller.getSitesStats().then(() => {
                controller.revokeVoucher(id).then(() => {
                    console.log(`Revoked voucher ${id} ...`);
                    resolve();
                }).catch((e) => {
                    console.log('Error while revoking voucher!');
                    console.log(e);
                    process.exit(1);
                });
            }).catch((e) => {
                console.log('Error while getting site stats!');
                console.log(e);
                process.exit(1);
            });
        }).catch((e) => {
            console.log('Error while logging in!');
            console.log(e);
            process.exit(1);
        });
    });

};


/**
 * Exports the printVoucher function
 *
 * @returns {Promise<unknown>}
 */
module.exports.printVoucher = (create_time) => {
    return new Promise((resolve) => {
        /**
         * Create new UniFi controller object
         *
         * @type {Controller}
         */
        const controller = new unifi.Controller({
            host: config.unifi.ip,
            port: config.unifi.port,
            site: config.unifi.siteID,
            sslverify: false
        });

        /**
         * Login and print a voucher
         */
        controller.login(config.unifi.username, config.unifi.password).then(() => {
            controller.getSitesStats().then(() => {
                controller.getVouchers(create_time).then(async (voucher) => {
                    await print_voucher.printVoucher(voucher[0]);
                    console.log(`Printed voucher ${voucher[0]._id} ...`);
                    resolve();
                }).catch((e) => {
                    console.log('Error while getting voucher!');
                    console.log(e);
                    process.exit(1);
                });
            }).catch((e) => {
                console.log('Error while getting site stats!');
                console.log(e);
                process.exit(1);
            });
        }).catch((e) => {
            console.log('Error while logging in!');
            console.log(e);
            process.exit(1);
        });
    });

};
