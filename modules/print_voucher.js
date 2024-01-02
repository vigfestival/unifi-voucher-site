const {ThermalPrinter} = require('node-thermal-printer');
const time = require('./time');
const {exec} = require('child_process');

const config = {
    printer: {
        ip: process.env.PRINTER_IP || '192.168.1.100',
        type: process.env.PRINTER_TYPE || 'brother',
        useTcp: process.env.PRINTER_USE_TCP ? process.env.PRINTER_USE_TCP.toLowerCase() === 'true' : 'true',
        interface: process.env.PRINTER_INTERFACE || null,
        characterSet: process.env.PRINTER_CHARACTERSET || 'WPC1252',
        useQlMode: process.env.PRINTER_USE_QL_MODE ? process.env.PRINTER_USE_QL_MODE.toLowerCase() === 'true' : 'false',
        qlModel: process.env.PRINTER_QL_MODEL,
        qlBackend: process.env.PRINTER_QL_BACKEND || 'network',
        qlLabelType: process.env.PRINTER_QL_LABEL_TYPE || '29x90',
        voucherTitle: process.env.PRINT_VOUCHER_TITLE || 'WiFi Voucher Code'
    }
};

module.exports.printVoucher = async (voucher) => {

    let printSuccessful;
    if (config.printer.useQlMode) {
        printSuccessful = await printUsingBrotherQlLibrary(voucher);
    } else {
        printSuccessful = await printUsingThermalPrinterLibrary(voucher);
    }
    return printSuccessful;
};

async function createVoucherImage(voucher) {
    const fs = require('fs');
    const fileName = `${voucher._id}.png`;

    if (fs.existsSync(fileName)) {
        return;
    }

    const {createCanvas} = require('canvas');

    const width = 991;
    const height = 306;
    const midWidth = width / 2;

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

    const paddingTop = 50;
    const spacingAfterTitle = 25;
    const titleFontSize = 35;
    const titleHeight = titleFontSize + 5;
    const voucherCodeFontSize = 40;
    const voucherCodeHeight = voucherCodeFontSize + 5;
    const spacingAfterVoucherCode = 15;
    const descriptionFontSize = 25;
    const spacingBetweenDescriptionLines = descriptionFontSize + 20;

    context.textAlign = 'center'
    context.textBaseline = 'middle';
    context.fillStyle = '#000000'

    context.font = `bold ${titleFontSize}pt Arial`;
    context.fillText(config.printer.voucherTitle, midWidth, paddingTop);
    context.font = `bold ${voucherCodeFontSize}pt Arial`;
    context.fillText(`${voucher.code}`, midWidth, paddingTop + titleHeight + spacingAfterTitle);
    context.font = `${descriptionFontSize}pt Arial`;
    context.fillText(`Duration: ${voucher.duration} | can be used for ${voucher.type}`, midWidth, paddingTop + titleHeight + spacingAfterTitle + voucherCodeHeight + spacingAfterVoucherCode);
    context.fillText(`Quota: ${voucher.usage_quota} | Download: ${voucher.download_limit} | Upload: ${voucher.upload_limit}`, midWidth, paddingTop + titleHeight + spacingAfterTitle + voucherCodeHeight + spacingAfterVoucherCode + spacingBetweenDescriptionLines);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(fileName, buffer);
}

async function printUsingBrotherQlLibrary(voucher) {
    let printerInterface = config.printer.useTcp ? `tcp://${config.printer.ip}:9100` : config.printer.interface
    await createVoucherImage(voucher);
    let commandLine = `brother_ql --backend ${config.printer.qlBackend} --model ${config.printer.qlModel} --printer ${printerInterface} print --label ${config.printer.qlLabelType} ${voucher._id}.png`;
    console.log(`Executing the following command line: ${commandLine}`)
    exec(commandLine, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return false;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return false;
        }
        console.log(`stdout: ${stdout}`);
        return true;
    });
}

async function printUsingThermalPrinterLibrary(voucher) {
    try {
        let duration = time(voucher.duration);
        let type = voucher.status === 'VALID_MULTI' ? 'multi-use' : 'single-use';
        let usage_quota = voucher.qos_usage_quota !== undefined ? `${voucher.qos_usage_quota} MB` : 'unlimited';
        let upload_limit = voucher.qos_rate_max_up !== undefined ? `${voucher.qos_rate_max_up} KBit/s` : 'unlimited';
        let download_limit = voucher.qos_rate_max_down !== undefined ? `${voucher.qos_rate_max_down} KBit/s` : 'unlimited';

        let printer = new ThermalPrinter({
            type: config.printer.type,                                  // Printer type: 'star', 'epson', 'brother' etc.
            interface: config.printer.useTcp ? `tcp://${config.printer.ip}` : config.printer.interface  // Printer interface
        });
        let isConnected = await printer.isPrinterConnected();       // Check if printer is connected, return bool of status
        console.log(`Printer is connected: ${isConnected}`)

        printer.alignCenter();
        printer.newLine();
        printer.println(config.printer.voucherTitle);// Append text with new line
        printer.newLine();
        printer.println(`${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}`);
        printer.println(`Duration: ${duration} | Type: ${type}`);
        printer.println(`Quota: ${usage_quota} | Download: ${download_limit} | Upload: ${upload_limit}`)
        printer.cut();

        await printer.execute();
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}
