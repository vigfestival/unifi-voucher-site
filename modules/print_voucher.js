const {ThermalPrinter} = require('node-thermal-printer');
const time = require('./time');
const {exec} = require('child_process');
const fs = require("fs");

const config = {
    printer: {
        ip: process.env.PRINTER_IP || '192.168.1.100',
        type: process.env.PRINTER_TYPE || 'brother',
        useTcp: process.env.PRINTER_USE_TCP ? process.env.PRINTER_USE_TCP.toLowerCase() === 'true' : 'true',
        interface: process.env.PRINTER_INTERFACE || null,
        characterSet: process.env.PRINTER_CHARACTERSET || 'WPC1252',
        useQlMode: process.env.PRINTER_USE_QL_MODE ? process.env.PRINTER_USE_QL_MODE.toLowerCase() === 'true' : 'false',
        QlModel: process.env.PRINTER_QL_MODEL,
        QlBackend: process.env.PRINTER_QL_BACKEND || 'network',
        QlLabelType: process.env.PRINTER_QL_LABEL_TYPE || '29x90'
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
    const {createCanvas} = require('canvas');

    const width = 306;
    const height = 991;

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

    const paddingTop = 60;
    const lineHeight = 90;

    context.font = 'bold 50pt Arial';

    context.textAlign = 'center'
    context.textBaseline = 'middle';
    context.fillStyle = '#000000'

    let duration = time(voucher.duration);
    let type = voucher.status === 'VALID_MULTI' ? 'multi-use' : 'single-use';
    let usage_quota = voucher.quota === 1 ? `${voucher.qos_usage_quota} MB` : 'unlimited';
    let upload_limit = voucher.qos_rate_max_up !== undefined ? `${voucher.qos_rate_max_up} KBit/s` : 'unlimited';
    let download_limit = voucher.qos_rate_max_down !== undefined ? `${voucher.qos_rate_max_down} KBit/s` : 'unlimited';

    const text = `WiFi Voucher Code// + ${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}/Duration: ${duration} | Type: ${type}/Quota: ${usage_quota} | Download: ${download_limit} | Upload: ${upload_limit}` ;
    const lines = text.split(' /');

    lines.forEach((line, i) => {
        context.fillText(line, midWidth, paddingTop + lineHeight * i);
    });

    const fontSizeUsed = drawMultilineText(
        context,
        "This is a text with multiple lines that is vertically centered as expected.",
        {
            rect: {
                x: width / 2,
                y: 0,
                width: width,
                height: height
            },
            font: 'Arial',
            verbose: true,
            lineHeight: 1,
            minFontSize: 100,
            maxFontSize: 200
        }
    )

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`${voucher.id}.png`, buffer);
}

async function printUsingBrotherQlLibrary(voucher) {
    let printerInterface = config.printer.useTcp ? `tcp://${config.printer.ip}:9100` : config.printer.interface
    await createVoucherImage(voucher);
    let commandLine = `brother_ql --backend ${config.printer.QlBackend} --model ${config.printer.QlModel}--printer ${printerInterface} print --label ${config.printer.QlLabelType} ${voucher.id}.png`;
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
        let usage_quota = voucher.quota === 1 ? `${voucher.qos_usage_quota} MB` : 'unlimited';
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
        printer.println("WiFi Voucher Code");// Append text with new line
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
