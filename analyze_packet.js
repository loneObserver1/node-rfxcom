#!/usr/bin/env node
// Analysons le paquet pour comprendre le format
const packet = [20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77];
const data = packet.slice(2); // Données sans longueur et packet type

console.log('Format du paquet Alecto TH13/WS1700:');
console.log('Paquet complet (21 bytes):', packet);
console.log('Données (19 bytes):', data);
console.log('');
console.log('Structure analysée:');
for (let i = 0; i < data.length; i++) {
    console.log(`  data[${i}]:`, data[i], `(0x${data[i].toString(16).padStart(2,'0').toUpperCase()})`);
}
console.log('');
console.log('Fin (RFXCOM):', String.fromCharCode(...data.slice(15)));
console.log('');
console.log('Hypothèses de format Alecto:');
console.log('  ID (bytes 2-3?):', '0x' + data[2].toString(16).padStart(2,'0') + data[3].toString(16).padStart(2,'0'));
const tempSign = (data[4] & 0x80) ? 'neg' : 'pos';
const temp = ((data[4] & 0x7f) * 256 + data[5]) / 10 * ((data[4] & 0x80) ? -1 : 1);
console.log('  Temp (bytes 4-5?):', data[4], data[5], '→', temp, '°C (sign:', tempSign + ')');
console.log('  Rain (bytes 6-7?):', data[6], data[7], '→', (data[6] * 256 + data[7]) / 10, 'mm');
console.log('  Status (byte 8?):', '0x' + data[8].toString(16), '→ battery:', data[8] & 0x0f, ', rssi:', (data[8] >> 4) & 0xf);





