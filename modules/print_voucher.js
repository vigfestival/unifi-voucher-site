const {ThermalPrinter, CharacterSet, BreakLine} = require('node-thermal-printer');

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
        interface: config.printer.useTcp ? `tcp://${config.printer.ip}` : config.printer.interface,  // Printer interface
        removeSpecialCharacters: false,                           // Removes special characters - default: false
        lineCharacter: "=",                                       // Set character for lines - default: "-"
        breakLine: BreakLine.WORD,                                // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
        options: {                                                 // Additional options
            timeout: 5000                                           // Connection timeout (ms) [applicable only for network printers] - default: 3000
        }
    });
    let isConnected = await printer.isPrinterConnected();       // Check if printer is connected, return bool of status

    let printSuccessful = true;
    try {
        printer.alignCenter();
        printer.newLine();
        printer.println("WiFi Voucher Code");// Append text with new line
        printer.newLine();
        printer.println(`${[voucher.code.slice(0, 5), '-', voucher.code.slice(5)].join('')}`)
        printer.cut();
        await printer.execute();
    }
    catch (e) {
        console.log(e);
        printSuccessful = false;
    }

    return isConnected && printSuccessful;
};
