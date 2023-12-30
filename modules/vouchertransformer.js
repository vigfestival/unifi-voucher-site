const time = require("./time");
module.exports.fromDto = (voucherDto) => {
    return {
        id: voucherDto._id,
        create_time: voucherDto.create_time,
        code: `${[voucherDto.code.slice(0, 5), '-', voucherDto.code.slice(5)].join('')}`,
        duration: time(voucherDto.duration),
        type: voucherDto.status === 'VALID_MULTI' ? 'multiple devices' : 'a single device',
        usage_quota: voucherDto.qos_usage_quota !== undefined ? `${voucherDto.qos_usage_quota} MB` : 'unlimited',
        upload_limit: voucherDto.qos_rate_max_up !== undefined ? `${voucherDto.qos_rate_max_up} KBit/s` : 'unlimited',
        download_limit: voucherDto.qos_rate_max_down !== undefined ? `${voucherDto.qos_rate_max_down} KBit/s` : 'unlimited'
    };
}
