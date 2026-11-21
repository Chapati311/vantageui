/**
 * Who made a network device, from the first half of its MAC address (the
 * OUI). A small built-in list of common makers (no lookup service). Phones
 * and laptops today often use a random "private" address: that is said too.
 */
const VENDORS: Record<string, string> = {
  '00:03:93': 'Apple', '00:1c:b3': 'Apple', '00:25:00': 'Apple', '28:cf:e9': 'Apple', '3c:07:54': 'Apple', '40:6c:8f': 'Apple', '60:03:08': 'Apple',
  '7c:d1:c3': 'Apple', '88:66:5a': 'Apple', 'a4:83:e7': 'Apple', 'ac:bc:32': 'Apple', 'b8:e8:56': 'Apple', 'd0:81:7a': 'Apple', 'f0:18:98': 'Apple',
  'f4:0f:24': 'Apple', '90:dd:5d': 'Apple', 'bc:d0:74': 'Apple', '14:7d:da': 'Apple', '5c:c1:d7': 'Samsung',
  '00:12:fb': 'Samsung', '00:16:32': 'Samsung', '34:23:ba': 'Samsung', '50:01:bb': 'Samsung', '8c:77:12': 'Samsung', 'a8:7c:01': 'Samsung', 'f4:7b:5e': 'Samsung',
  '00:1a:11': 'Google', '3c:5a:b4': 'Google', '54:60:09': 'Google', 'f4:f5:d8': 'Google', 'f4:f5:e8': 'Google', '20:df:b9': 'Google', 'd8:6c:63': 'Google',
  '18:b4:30': 'Nest', '64:16:66': 'Nest',
  '44:65:0d': 'Amazon', '68:37:e9': 'Amazon', '74:c2:46': 'Amazon', 'f0:27:2d': 'Amazon', 'fc:65:de': 'Amazon', '0c:47:c9': 'Amazon', '84:d6:d0': 'Amazon',
  'b8:27:eb': 'Raspberry Pi', 'dc:a6:32': 'Raspberry Pi', 'e4:5f:01': 'Raspberry Pi', '28:cd:c1': 'Raspberry Pi',
  '00:1b:21': 'Intel', '3c:a9:f4': 'Intel', '7c:7a:91': 'Intel', 'a4:34:d9': 'Intel', 'f8:63:3f': 'Intel', '84:69:93': 'HP',
  '50:c7:bf': 'TP-Link', '60:32:b1': 'TP-Link', 'b0:4e:26': 'TP-Link', 'c0:25:e9': 'TP-Link', 'ec:08:6b': 'TP-Link', 'f4:f2:6d': 'TP-Link', '98:da:c4': 'TP-Link',
  '00:14:bf': 'Linksys', '20:aa:4b': 'Linksys', '00:24:01': 'D-Link', '1c:7e:e5': 'D-Link', '00:1f:33': 'Netgear', 'a0:40:a0': 'Netgear', '9c:3d:cf': 'Netgear',
  '04:d9:f5': 'ASUS', '2c:56:dc': 'ASUS', '50:46:5d': 'ASUS', 'ac:22:0b': 'ASUS', '6c:99:61': 'Sagemcom (router)', '00:00:c0': 'Western Digital',
  '28:6c:07': 'Xiaomi', '64:09:80': 'Xiaomi', '78:11:dc': 'Xiaomi', 'f8:a4:5f': 'Xiaomi', '00:e0:4c': 'Realtek', '00:1e:c2': 'Apple',
  '48:a4:72': 'Huawei', '00:9a:cd': 'Huawei', 'e8:4e:06': 'Huawei', 'b0:fc:0d': 'Amazon', 'f4:6d:04': 'ASUS', '20:51:f5': 'Sonos',
  '00:0e:58': 'Sonos', '5c:aa:fd': 'Sonos', '94:9f:3e': 'Sonos', 'b8:e9:37': 'Sonos', '00:04:20': 'Logitech', 'd8:bb:c1': 'Micro-Star (MSI)',
  '00:50:56': 'VMware', '08:00:27': 'VirtualBox', '00:15:5d': 'Microsoft (Hyper-V)', '7c:1e:52': 'Microsoft', '00:17:88': 'Philips Hue', 'ec:b5:fa': 'Philips Hue',
  '00:09:b0': 'Onkyo', '00:04:4b': 'NVIDIA', '48:b0:2d': 'NVIDIA', 'cc:46:d6': 'Cisco', '00:1b:63': 'Apple', 'e0:b9:4d': 'Shenzhen (IoT)',
};

/** "6c:99:61:16:a:57" -> "6c:99:61:16:0a:57" */
export function normalizeMac(mac: string): string {
  return mac
    .toLowerCase()
    .split(/[:-]/)
    .map((part) => part.padStart(2, '0'))
    .join(':');
}

export function vendorOf(mac: string | undefined): string {
  if (!mac || !/[0-9a-f]/i.test(mac)) return 'Unknown';
  const m = normalizeMac(mac);
  const first = parseInt(m.slice(0, 2), 16);
  // Bit 2 of the first byte: a locally made ("private") address
  if (first & 0b10) return 'Private address (a phone or laptop hiding its real one)';
  return VENDORS[m.slice(0, 8)] ?? 'Unknown maker';
}

/** Well-known ports in plain words. */
export const PORT_NAMES: Record<number, string> = {
  21: 'FTP (file transfer)', 22: 'SSH (remote login)', 23: 'Telnet (unencrypted login!)', 25: 'Mail (SMTP)', 53: 'DNS', 80: 'Web (HTTP)', 110: 'Mail (POP3)',
  139: 'Windows file sharing', 143: 'Mail (IMAP)', 443: 'Web (HTTPS)', 445: 'Windows file sharing (SMB)', 548: 'Apple file sharing', 554: 'Video stream (RTSP)',
  631: 'Printing (IPP)', 1900: 'UPnP', 3000: 'Dev web server', 3306: 'MySQL database', 3389: 'Windows Remote Desktop', 5000: 'AirPlay / dev server',
  5353: 'Bonjour', 5900: 'Screen sharing (VNC)', 7000: 'AirPlay', 8008: 'Chromecast', 8009: 'Chromecast', 8080: 'Web (alt)', 8443: 'Web (alt HTTPS)',
  9100: 'Printer', 62078: 'iPhone sync (lockdown)', 49152: 'UPnP',
};
