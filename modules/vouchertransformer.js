const time = require("./time");
module.exports.fromDto = (voucherDto) => {
    let voucher = {
        id: voucher._id,
        create_time: voucher.create_time,
        code: `${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}`,
        duration: time(voucher.duration),
        type: voucher.status === 'VALID_MULTI' ? 'multi-use' : 'single-use',
        usage_quota: voucher.qos_usage_quota !== undefined ? `${voucher.qos_usage_quota} MB` : 'unlimited',
        upload_limit: voucher.qos_rate_max_up !== undefined ? `${voucher.qos_rate_max_up} KBit/s` : 'unlimited',
        download_limit: voucher.qos_rate_max_down !== undefined ? `${voucher.qos_rate_max_down} KBit/s` : 'unlimited'
    };

    return voucher;
}
