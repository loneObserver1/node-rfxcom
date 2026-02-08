#!/usr/bin/env node
/**
 * Test du support Alecto TH13/WS1700 avec packet type 0x01
 */

const rfxcom = require('./index');

console.log('='.repeat(80));
console.log('🧪 Test du support Alecto TH13/WS1700 (packet type 0x01)');
console.log('='.repeat(80));
console.log();

// Créer une instance RfxCom
const device = new rfxcom.RfxCom("/dev/ttyUSB0");

// Paquet réel reçu de la sonde
const packet = [20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77];
const data = packet.slice(2); // Données sans longueur et packet type

console.log('📦 Paquet reçu:');
console.log('   Longueur:', packet[0]);
console.log('   Packet type:', '0x' + packet[1].toString(16).toUpperCase());
console.log('   Données:', data);
console.log('');

// Écouter l'événement temperaturehumidity1 (pas temperaturerain1 car c'est temp+hum, pas temp+rain)
device.on("temperaturehumidity1", (evt, packetType) => {
    console.log('✅ Événement "temperaturehumidity1" reçu !');
    console.log('   Packet type:', '0x' + packetType.toString(16).toUpperCase());
    console.log('   📊 Données parsées:');
    console.log('      - subtype:', evt.subtype);
    console.log('      - id:', evt.id);
    console.log('      - seqnbr:', evt.seqnbr);
    console.log('      - channel:', evt.channel);
    console.log('      - temperature:', evt.temperature, '°C');
    console.log('      - humidity:', evt.humidity, '%');
    console.log('      - humidityStatus:', evt.humidityStatus);
    console.log('      - batteryLevel:', evt.batteryLevel);
    console.log('      - rssi:', evt.rssi);
    console.log('');
    console.log('🎉 Le support Alecto TH13/WS1700 fonctionne !');
    process.exit(0);
});

// Simuler la réception du paquet via le handler
console.log('🔍 Test du parsing du paquet...');
console.log('');

// Le handler statusMessageHandler sera appelé avec data (sans longueur et packet type)
// Mais dans le code, data.slice(2) est passé au handler, donc on doit passer data directement
// car statusMessageHandler reçoit déjà data.slice(2) depuis le parser

// Simuler l'appel du handler avec les données complètes (comme le parser le ferait)
// Le handler statusMessageHandler reçoit data.slice(2) depuis le parser
// Mais il vérifie que ça se termine par "RFXCOM", donc on doit passer le paquet complet
setTimeout(() => {
    // Le handler attend data qui commence par subtype (data[0] du paquet complet = packet[2])
    // Donc on passe data qui contient déjà tout
    device.statusMessageHandler(data);
    
    // Attendre un peu pour que l'événement soit émis
    setTimeout(() => {
        console.log('⚠️ Aucun événement reçu. Vérifiez le format du paquet.');
        console.log('   Vérification: le paquet se termine-t-il par "RFXCOM"?');
        const endText = String.fromCharCode.apply(String, data.slice(data.length - 6));
        console.log('   Fin du paquet:', endText);
        process.exit(1);
    }, 500);
}, 100);

