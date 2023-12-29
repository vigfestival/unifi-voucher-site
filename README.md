This is a fork of https://github.com/glenndehaan/unifi-voucher-site using the latest unifi package to be compatible with later unifi network controllers.

# UniFi Voucher Site

A small UniFi Voucher Site for simple voucher creation

[![Image Size](https://img.shields.io/docker/image-size/glenndehaan/unifi-voucher-site)](https://hub.docker.com/r/glenndehaan/unifi-voucher-site)

## Structure
- ES6 Javascript
- ExpressJS
- Node UniFi
- Tailwind

## Development Usage
- Install NodeJS 16.0 or higher.
- Run `npm ci` in the root folder
- Run `npm start` & `npm run tailwind` in the root folder

Then open up your favorite browser and go to http://localhost:3000/

## Build Usage
- Install NodeJS 16.0 or higher.
- Run `npm ci` in the root folder
- Run `npm run build` in the root folder

## Docker
- Code from master is build by Docker Hub
- Builds can be pulled by using this command: `docker pull glenndehaan/unifi-voucher-site`
- An example docker compose file can be found below:
```yaml
version: '3'
services:
  app:
    image: glenndehaan/unifi-voucher-site
    ports:
      - "8081:3000"
    environment:
      # The IP address to your UniFi OS Console
      UNIFI_IP: '192.168.1.1'
      # The port of your UniFi OS Console, this could be 443 or 8443
      UNIFI_PORT: 443
      # The username of a local UniFi OS account
      UNIFI_USERNAME: 'admin'
      # The password of a local UniFi OS account
      UNIFI_PASSWORD: 'password'
      # The UniFi Site ID
      UNIFI_SITE_ID: 'default'
      # The 'password' used to log in to this voucher portal
      SECURITY_CODE: '0000'
      # use security check (i.e. check for the security code), defaults to 'true' if not provided
      USE_SECURITY_CHECK: 'true'
      # show copyright footer, defaults to 'true' if not provided
      SHOW_FOOTER: 'true'
      # show existing vouchers (as a link), defaults to 'true' if not provided
      SHOW_EXISTING_VOUCHERS: 'true'
      # support label printers and show print button (see printer settings)
      PRINT_VOUCHER: 'false'
      # use network access
      PRINTER_USE_TCP: 'true'
      # printer interface if NOT using a network printer (i.e. PRINTER_USE_TCP is set to 'false') - see https://github.com/Klemen1337/node-thermal-printer/blob/master/README.md#interface-options
      PRINTER_INTERFACE: ''
      # ip of the network enabled label printer
      PRINTER_IP: '192.168.178.100'
      # printer type (i.e. "star", "epson", "brother") -
      PRINTER_TYPE: 'brother'
      # Voucher Types, format: expiration in minutes (required),single-use or multi-use vouchers value - '0' is for multi-use - '1' is for single-use (optional),upload speed limit in kbps (optional),download speed limit in kbps (optional),data transfer limit in MB (optional)
      # To skip a parameter just but nothing in between the comma's
      # After a voucher type add a semicolon, after the semicolon you can start a new voucher type
      VOUCHER_TYPES: '480,0,,,;'
```

## License

MIT
