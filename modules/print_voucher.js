const {ThermalPrinter, CharacterSet, BreakLine} = require('node-thermal-printer');
const time = require("./time");

const config = {
    printer: {
        ip: process.env.PRINTER_IP || '192.168.1.100',
        type: process.env.PRINTER_TYPE || 'brother',
        useTcp: process.env.PRINTER_USE_TCP || true,
        interface: process.env.PRINTER_INTERFACE || null,
        characterSet: process.env.PRINTER_CHARACTERSET || 'WPC1252'
    }
};

module.exports.printVoucher = async (voucher) => {
    let printer = new ThermalPrinter({
        type: config.printer.type,                                  // Printer type: 'star', 'epson', 'brother' etc.
        interface: config.printer.useTcp ? `tcp://${config.printer.ip}` : config.printer.interface  // Printer interface
    });
    let isConnected = await printer.isPrinterConnected();       // Check if printer is connected, return bool of status

    console.log(`Printer is connected: ${isConnected}`)
    let duration = time(voucher.duration);
    let type= voucher.status === 'VALID_MULTI' ? 'multi-use' : 'single-use';
    let usage_quota = voucher.quota === 1 ? `${voucher.qos_usage_quota} MB` : 'unlimited';
    let upload_limit = voucher.qos_rate_max_up !== undefined ? `${voucher.qos_rate_max_up} KBit/s` : 'unlimited';
    let download_limit = voucher.qos_rate_max_down !== undefined ? `${voucher.qos_rate_max_down} KBit/s` : 'unlimited';

    let printSuccessful = true;
    try {
        let raw = await printer.raw(Buffer.from("Hello world"));    // Print instantly. Returns success or throws error

        printer.alignCenter();
        printer.newLine();
        printer.println("WiFi Voucher Code");// Append text with new line
        printer.newLine();
        printer.println(`${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}`);
        printer.println(`Duration: ${duration} | Type: ${type}`);
        printer.println(`Quota: ${usage_quota} | Download: ${download_limit} | Upload: ${upload_limit}`)
        printer.cut();

        await printer.execute();
    }
    catch (e) {
        console.log(e);
        printSuccessful = false;
    }

    return isConnected && printSuccessful;
};
