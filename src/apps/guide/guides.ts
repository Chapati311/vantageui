/**
 * Field Guide content: how to do network / device things with this jailbroken
 * iPhone, step by step, with the exact packages to install and commands to
 * type. Everything here is for YOUR OWN devices and networks (or ones you have
 * permission to test); each guide says so where it matters.
 *
 * Packages are Procursus / Sileo package ids (rootless, Dopamine).
 */

export type GuideCategory = 'network' | 'connect' | 'privacy' | 'security' | 'tools' | 'learn';

export interface Need {
  name: string;
  /** Sileo package id (opens sileo://package/<id>) */
  sileo?: string;
  /** App Store / other source, in words */
  where?: string;
  why: string;
}

export interface Step {
  text: string;
  /** A command to type (NewTerm on the phone, or the laptop's terminal) */
  command?: string;
  /** Where the command runs */
  on?: 'iPhone' | 'laptop';
}

export interface Guide {
  id: string;
  title: string;
  category: GuideCategory;
  summary: string;
  needs: Need[];
  steps: Step[];
  /** The Netrunner tool that does it with one tap */
  netrunner?: { tool: string; label: string };
  rules?: string;
  /** Good to know / what the output means */
  notes?: string[];
}

export const CATEGORIES: { id: GuideCategory | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'network', name: 'Network' },
  { id: 'connect', name: 'Connect' },
  { id: 'privacy', name: 'Privacy' },
  { id: 'security', name: 'Security' },
  { id: 'tools', name: 'Tools' },
  { id: 'learn', name: 'Learn' },
];

const NEWTERM: Need = { name: 'NewTerm', where: 'Sileo (Chariz repo), already on your phone', why: 'a terminal on the iPhone, to type the commands' };
const SUDO: Need = { name: 'sudo', sileo: 'sudo', why: 'runs a command as root (asks for the mobile password)' };
const OWN = 'Only your own network and devices, or ones you have permission to test. Scanning other people\'s networks or computers can be illegal, even "just to look".';

export const GUIDES: Guide[] = [
  {
    id: 'devices-on-wifi',
    title: 'Find every device on your Wi-Fi',
    category: 'network',
    summary: 'See phones, laptops, TVs, smart plugs - everything connected to your home network - with their makers.',
    needs: [NEWTERM, SUDO, { name: 'Nmap', sileo: 'nmap', why: 'the classic network scanner' }, { name: 'network-cmds', sileo: 'network-cmds', why: 'arp, ifconfig, netstat' }],
    steps: [
      { text: "Find your phone's address and network range. Look for 'inet' under en0, e.g. 192.168.1.238 netmask 0xffffff00 = range 192.168.1.0/24.", command: 'ifconfig en0', on: 'iPhone' },
      { text: 'Ping-scan the range: nmap asks every address "are you there?" and lists the ones that answer.', command: 'sudo nmap -sn 192.168.1.0/24', on: 'iPhone' },
      { text: 'Show the hardware (MAC) address of each device that answered. The first half of a MAC tells the maker.', command: 'arp -an', on: 'iPhone' },
      { text: 'Give the devices names you recognise (router, TV, your laptop) - Netrunner keeps them and tells you when a NEW device joins.' },
    ],
    netrunner: { tool: 'map', label: 'Open Network Map' },
    rules: OWN,
    notes: ['Phones and laptops often use a "private" random MAC address: that is normal.', 'A device that sleeps may not answer: scan again later.'],
  },
  {
    id: 'ports',
    title: "See what a device of yours is running (open ports)",
    category: 'network',
    summary: 'Which services your laptop, Raspberry Pi or router offer to the network - SSH, file sharing, web pages, printers.',
    needs: [NEWTERM, SUDO, { name: 'Nmap', sileo: 'nmap', why: 'port and service scanner' }],
    steps: [
      { text: 'Scan the 100 most common ports of ONE device of yours (use its address from the network map).', command: 'sudo nmap -F 192.168.1.18', on: 'iPhone' },
      { text: 'Ask nmap to also guess what software answers on each open port.', command: 'sudo nmap -sV --version-light -F 192.168.1.18', on: 'iPhone' },
      { text: 'Anything you don\'t recognise or don\'t use (Telnet 23, SMB 445 on a laptop at a café...) is worth switching off on that device.' },
    ],
    netrunner: { tool: 'map', label: 'Network Map → tap a device → Open ports' },
    rules: OWN,
    notes: ['22 = SSH, 80/443 = web, 445 = Windows file sharing, 548 = Mac file sharing, 631 = printer, 62078 = iPhone sync.'],
  },
  {
    id: 'ssh-into-iphone',
    title: 'Control your iPhone from your laptop (SSH)',
    category: 'connect',
    summary: "Type commands on the phone from the laptop's keyboard, copy files, install packages - over Wi-Fi.",
    needs: [{ name: 'OpenSSH', sileo: 'openssh', why: 'the SSH server (already installed: it is how Vantage OS is developed)' }, NEWTERM],
    steps: [
      { text: 'FIRST change the default passwords (they are "alpine" on every jailbroken iPhone - anyone could log in).', command: 'passwd root', on: 'iPhone' },
      { text: 'And the mobile user too.', command: 'passwd mobile', on: 'iPhone' },
      { text: "On the laptop, connect with the phone's address (Settings › Wi-Fi › ⓘ).", command: 'ssh root@192.168.1.238', on: 'laptop' },
      { text: 'Better than passwords: a key. Make one on the laptop (once) and copy it to the phone - then no password is asked.', command: 'ssh-keygen -t ed25519 && ssh-copy-id root@192.168.1.238', on: 'laptop' },
    ],
    netrunner: { tool: 'security', label: 'Check passwords and SSH' },
    notes: ['Windows 10/11 has ssh built in (PowerShell). On a Mac: Terminal.', 'On public Wi-Fi, turn SSH off (Sileo › OpenSSH › remove, or a toggle tweak).'],
  },
  {
    id: 'ssh-from-iphone',
    title: 'Control your laptop or Raspberry Pi from the iPhone',
    category: 'connect',
    summary: 'Open a terminal on your computer from anywhere in the house.',
    needs: [NEWTERM, { name: 'OpenSSH (client)', sileo: 'openssh', why: 'the ssh command on the phone' }],
    steps: [
      { text: 'Mac: System Settings › General › Sharing › Remote Login ON. Windows: Settings › Apps › Optional features › add "OpenSSH Server", then start the "sshd" service. Raspberry Pi: sudo raspi-config › Interface › SSH.' },
      { text: "Find the computer's address (Mac: System Settings › Wi-Fi › Details; Windows: ipconfig; Pi: hostname -I), then connect from NewTerm.", command: 'ssh yourname@192.168.1.18', on: 'iPhone' },
      { text: 'Run a command on the computer without staying logged in.', command: 'ssh yourname@192.168.1.18 "uptime"', on: 'iPhone' },
    ],
    netrunner: { tool: 'terminal', label: 'Open the Terminal' },
  },
  {
    id: 'files',
    title: 'Send files between laptop and iPhone',
    category: 'connect',
    summary: 'Copy photos, music or documents both ways without cables or iCloud.',
    needs: [{ name: 'OpenSSH', sileo: 'openssh', why: 'scp / sftp file copy' }, { name: 'Filza', where: 'Sileo (TIGI repo) or TrollStore', why: 'a file manager on the phone to find the files' }],
    steps: [
      { text: 'Laptop → phone (into Downloads):', command: 'scp song.mp3 root@192.168.1.238:/var/mobile/Downloads/', on: 'laptop' },
      { text: 'Phone → laptop:', command: 'scp root@192.168.1.238:/var/mobile/Downloads/photo.jpg .', on: 'laptop' },
      { text: 'Or share a whole folder from the laptop as a little web page and open it in Safari on the phone.', command: 'python -m http.server 8000', on: 'laptop' },
    ],
    notes: ['GUI instead: WinSCP (Windows) or Cyberduck (Mac) with "SFTP", the phone\'s address, user root.'],
  },
  {
    id: 'own-traffic',
    title: 'Watch your own phone\'s traffic',
    category: 'privacy',
    summary: 'See every connection your iPhone makes, live, and open it in Wireshark on the laptop.',
    needs: [NEWTERM, SUDO, { name: 'tcpdump', sileo: 'tcpdump', why: 'captures network packets' }, { name: 'Wireshark', where: 'wireshark.org, on the laptop', why: 'to read captures comfortably' }],
    steps: [
      { text: 'Live list of packets on Wi-Fi (Ctrl+C stops).', command: 'sudo tcpdump -i en0 -n -q', on: 'iPhone' },
      { text: 'Only DNS (which names the phone looks up - very telling).', command: 'sudo tcpdump -i en0 -n port 53', on: 'iPhone' },
      { text: 'Save 500 packets to a file, then copy it to the laptop and open it in Wireshark.', command: 'sudo tcpdump -i en0 -c 500 -w /var/mobile/Downloads/cap.pcap', on: 'iPhone' },
      { text: '', command: 'scp root@192.168.1.238:/var/mobile/Downloads/cap.pcap .', on: 'laptop' },
    ],
    netrunner: { tool: 'packets', label: 'Open Packet View' },
    rules: "Capture only your own devices' traffic.",
  },
  {
    id: 'trackers',
    title: "Who's tracking you (which apps talk to whom)",
    category: 'privacy',
    summary: 'See which servers each app contacts, which companies own them, and which are ad/tracking companies.',
    needs: [SUDO, { name: 'lsof', sileo: 'lsof', why: 'lists every open connection per app' }],
    steps: [
      { text: 'Every open connection with the app that owns it.', command: 'sudo lsof -nP -i | grep ESTABLISHED', on: 'iPhone' },
      { text: 'Who owns an address (company, country).', command: 'curl ipinfo.io/157.240.17.174', on: 'iPhone' },
      { text: 'Block trackers for every app: a DNS filter such as NextDNS or AdGuard DNS (free tiers), set in Settings › Wi-Fi or as a profile.' },
    ],
    netrunner: { tool: 'privacy', label: 'Open Privacy Monitor' },
  },
  {
    id: 'lookup-internet',
    title: 'Look up anything on the internet (the legal way)',
    category: 'network',
    summary: 'Where a website lives, who owns a domain, the route your data takes, which certificate protects it.',
    needs: [{ name: 'whois', sileo: 'whois', why: 'domain owner and dates' }, { name: 'traceroute', sileo: 'inetutils-traceroute', why: 'the route to a server' }, { name: 'curl', sileo: 'curl', why: 'web requests, certificates' }],
    steps: [
      { text: 'Who registered a domain, and when it expires.', command: 'whois example.com', on: 'iPhone' },
      { text: 'Every router between you and a server, with how long each hop takes.', command: 'inetutils-traceroute example.com', on: 'iPhone' },
      { text: "A website's HTTPS certificate (who issued it, expiry).", command: 'curl -svI https://example.com 2>&1 | grep -E "subject|expire|issuer"', on: 'iPhone' },
      { text: '"Scanning the internet" itself (port-scanning other people\'s servers) is not OK without permission. Search engines like shodan.io and search.censys.io already show what\'s public - browsing them is legal.' },
    ],
    netrunner: { tool: 'dns', label: 'Open DNS & Whois' },
    rules: 'Look up, don\'t scan: scanning servers you don\'t own can break laws and terms.',
  },
  {
    id: 'bluetooth',
    title: 'See Bluetooth devices around you',
    category: 'network',
    summary: 'Headphones, watches, trackers and smart gadgets nearby, with signal strength and rough distance.',
    needs: [{ name: 'nRF Connect', where: 'App Store (free)', why: 'detailed Bluetooth LE explorer' }],
    steps: [
      { text: 'Open the Bluetooth radar: every device that advertises shows as a blip; closer = stronger signal.' },
      { text: 'For details (services, manufacturer data) use nRF Connect: Scanner tab, tap a device.' },
      { text: 'Hunting for an unknown tracker following you? iPhone already warns about AirTags; Android trackers show in the radar as unnamed devices with a steady strong signal.' },
    ],
    netrunner: { tool: 'ble', label: 'Open Bluetooth Radar' },
    rules: 'Listening is fine; connecting to or pairing with other people\'s devices is not.',
  },
  {
    id: 'speed',
    title: 'Is it my Wi-Fi or my internet? (speed and lag)',
    category: 'network',
    summary: 'Find out where the slowness is: the phone, the Wi-Fi, the router or the provider.',
    needs: [{ name: 'curl', sileo: 'curl', why: 'downloads test files' }, { name: 'ping', sileo: 'inetutils-ping', why: 'measures delay' }],
    steps: [
      { text: 'Ping the router: should be under ~10 ms. Much more = Wi-Fi problem (distance, walls, crowded channel).', command: 'ping -c 10 192.168.1.1', on: 'iPhone' },
      { text: 'Ping the internet: compare with the router. A big jump = provider problem.', command: 'ping -c 10 1.1.1.1', on: 'iPhone' },
      { text: 'Download speed in bytes per second (divide by 125,000 for Mb/s).', command: "curl -o /dev/null -w '%{speed_download}\\n' https://speed.cloudflare.com/__down?bytes=25000000", on: 'iPhone' },
    ],
    netrunner: { tool: 'speed', label: 'Open Speed Test' },
  },
  {
    id: 'secure-phone',
    title: 'Make your jailbroken iPhone safe',
    category: 'security',
    summary: 'The five things that matter most on a jailbroken phone.',
    needs: [NEWTERM],
    steps: [
      { text: 'Change the default "alpine" passwords (the #1 risk).', command: 'passwd root && passwd mobile', on: 'iPhone' },
      { text: 'Use SSH keys and keep SSH off on public Wi-Fi.' },
      { text: 'Only add repos you trust in Sileo (the big ones: Procursus, Chariz, Havoc, BigBoss).' },
      { text: "Don't install cracked/pirated tweaks: they're the usual way malware gets in." },
      { text: 'Check what the phone exposes now and then.', command: 'sudo lsof -nP -iTCP -sTCP:LISTEN', on: 'iPhone' },
    ],
    netrunner: { tool: 'security', label: 'Run the Security Check' },
  },
  {
    id: 'python',
    title: 'Write and run your own scripts (Python)',
    category: 'tools',
    summary: 'Automate things on the phone: rename files, fetch data, tiny web servers.',
    needs: [NEWTERM, { name: 'Python 3', sileo: 'python3', why: 'the Python language' }, { name: 'nano', sileo: 'nano', why: 'a simple text editor in the terminal' }],
    steps: [
      { text: 'Make a script.', command: 'nano hello.py', on: 'iPhone' },
      { text: 'Type: print("hello from my iPhone") - then Ctrl+O, Enter, Ctrl+X to save and quit, and run it.', command: 'python3 hello.py', on: 'iPhone' },
      { text: 'A one-line web server sharing the current folder to your network.', command: 'python3 -m http.server 8080', on: 'iPhone' },
    ],
  },
  {
    id: 'wake',
    title: 'Wake up your PC from the phone (Wake-on-LAN)',
    category: 'connect',
    summary: 'Turn on a sleeping computer on your network without touching it.',
    needs: [{ name: 'Mocha WOL', where: 'App Store (free)', why: 'sends the wake-up packet' }],
    steps: [
      { text: "On the PC: enable Wake-on-LAN in the BIOS/UEFI and in the network adapter's settings (Windows: Device Manager › network adapter › Power Management)." },
      { text: "Note the PC's MAC address (Windows: getmac; Mac: ifconfig en0 | grep ether).", on: 'laptop' },
      { text: 'In the app, add the MAC and press Wake. The PC must be on wired Ethernet for most PCs.' },
    ],
  },
  {
    id: 'ctf',
    title: 'Learn hacking the legal way',
    category: 'learn',
    summary: 'Real challenges built for practice: from Linux basics to web security.',
    needs: [NEWTERM, { name: 'OpenSSH', sileo: 'openssh', why: 'OverTheWire levels are reached over SSH' }],
    steps: [
      { text: 'Start with OverTheWire Bandit level 0 (password: bandit0).', command: 'ssh bandit0@bandit.labs.overthewire.org -p 2220', on: 'iPhone' },
      { text: 'Each level hides the password for the next one. Write down what you learn in Netrunner › Learn › Notes.' },
      { text: 'Then picoCTF (beginner puzzles) and TryHackMe (guided rooms in the browser).' },
    ],
    netrunner: { tool: 'learn', label: 'Open Learn' },
  },
];
