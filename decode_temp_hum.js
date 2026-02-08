#!/usr/bin/env node
/**
 * Script pour décoder les paquets TEMP_HUM TH13 (Alecto WS1700)
 * Basé sur le format RFXmngr
 */

// Paquet RFXmngr (hex)
const rfxmngrPacket = "0A520D35680300D4270289";
// Paquet Node.js (décimal)
const nodePacket = [20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77];

console.log('='.repeat(80));
console.log('🔍 Analyse des paquets TEMP_HUM TH13');
console.log('='.repeat(80));
console.log();

// Analyser le paquet RFXmngr
console.log('📦 Paquet RFXmngr (hex):', rfxmngrPacket);
const rfxBytes = [];
for (let i = 0; i < rfxmngrPacket.length; i += 2) {
    rfxBytes.push(parseInt(rfxmngrPacket.substr(i, 2), 16));
}
console.log('   En décimal:', rfxBytes);
console.log('   Longueur:', rfxBytes[0]);
console.log('   Packet type:', '0x' + rfxBytes[1].toString(16).toUpperCase(), '(TEMP_HUM)');
console.log('   Subtype:', '0x' + rfxBytes[2].toString(16).toUpperCase(), '(TH13)');
console.log('   Sequence:', rfxBytes[3]);
console.log('   ID:', '0x' + rfxBytes[4].toString(16).padStart(2,'0') + rfxBytes[5].toString(16).padStart(2,'0'), '=', rfxBytes[4] * 256 + rfxBytes[5]);
console.log('   Channel:', rfxBytes[6]);
console.log('   Temp:', rfxBytes[7], '→', (rfxBytes[7] - 128) / 2, '°C');
console.log('   Humidité:', rfxBytes[8], '%');
console.log('   Status:', rfxBytes[9]);
console.log('   Signal:', rfxBytes[10]);
console.log('   Battery:', rfxBytes[11]);
console.log();

// Analyser le paquet Node.js
console.log('📦 Paquet Node.js (décimal):', nodePacket);
console.log('   Longueur:', nodePacket[0]);
console.log('   Packet type:', '0x' + nodePacket[1].toString(16).toUpperCase());
console.log('   Données:', nodePacket.slice(2));
console.log();

// Fonction de décodage
function decodeTempHumTH13(packet) {
    if (packet.length < 12) {
        throw new Error('Paquet trop court');
    }
    
    const length = packet[0];
    const packetType = packet[1];
    const data = packet.slice(2);
    
    // Vérifier que c'est bien un paquet TEMP_HUM
    if (packetType !== 0x01 && packetType !== 0x52) {
        throw new Error('Ce n\'est pas un paquet TEMP_HUM');
    }
    
    // Format selon RFXmngr:
    // Byte 0: longueur
    // Byte 1: packet type (0x52 = TEMP_HUM)
    // Byte 2: subtype (0x0D = TH13)
    // Byte 3: sequence
    // Byte 4-5: ID (2 bytes)
    // Byte 6: channel
    // Byte 7: temperature (codé: (temp + 128) * 2)
    // Byte 8: humidity
    // Byte 9: status
    // Byte 10: signal
    // Byte 11: battery
    
    // Mais dans Node.js, le format semble différent
    // Analysons le paquet Node.js:
    const subtype = data[0]; // 0x00 dans notre cas
    const sequence = data[1]; // 1
    const channel = data[2]; // 2
    const idByte1 = data[3]; // 83
    const idByte2 = data[4]; // 21
    const tempRaw = data[5]; // 127
    const humidityRaw = data[6]; // 223
    const status = data[7]; // 255
    const signal = data[8]; // 15
    const battery = data[9]; // 1
    
    // Selon RFXmngr: ID = 6803, Temp = 21.2°C, Hum = 39%
    // Dans Node.js: idByte1=83, idByte2=21 → 83*256+21 = 21269 (pas 6803)
    // tempRaw=127 → si on fait (127-128)/2 = -0.5°C (pas 21.2)
    
    // Peut-être que le format est différent. Essayons une autre interprétation:
    // ID pourrait être dans data[4-5] au lieu de data[3-4]
    const id1 = data[4]; // 83 = 0x53
    const id2 = data[5]; // 21 = 0x15
    const id = id1 * 256 + id2; // 83*256+21 = 21269
    
    // Ou peut-être que c'est l'inverse?
    const idAlt = id2 * 256 + id1; // 21*256+83 = 5459
    
    // Ou peut-être que les bytes sont dans un ordre différent
    // Regardons le paquet RFXmngr: 6803 = 0x1A93
    // Dans Node.js on a: 83, 21 = 0x53, 0x15
    // Si on inverse: 21, 83 = 0x15, 0x53 = 5461 (pas 6803)
    
    // Peut-être que le format Node.js est complètement différent
    // Essayons de trouver où sont les données en comparant avec RFXmngr
    
    console.log('🔍 Tentatives de décodage:');
    console.log('   ID (bytes 3-4):', id, '(attendu: 6803)');
    console.log('   ID (bytes 4-5):', id1 * 256 + id2, '(attendu: 6803)');
    console.log('   ID (inverse 4-5):', id2 * 256 + id1, '(attendu: 6803)');
    console.log('   Temp (byte 5):', tempRaw, '→', (tempRaw - 128) / 2, '°C (attendu: 21.2)');
    console.log('   Temp (byte 6):', data[6], '→', (data[6] - 128) / 2, '°C (attendu: 21.2)');
    console.log('   Humidité (byte 6):', humidityRaw, '% (attendu: 39)');
    console.log('   Humidité (byte 7):', data[7], '% (attendu: 39)');
    
    return {
        packetType: packetType === 0x01 ? 'TEMP_HUM' : 'UNKNOWN',
        subtype: 'TH13',
        sequence: sequence,
        channel: channel,
        id: id,
        temperature: (tempRaw - 128) / 2,
        humidity: humidityRaw,
        status: status,
        signal: signal,
        battery: battery
    };
}

// Tester le décodage
try {
    const decoded = decodeTempHumTH13(nodePacket);
    console.log();
    console.log('📊 Résultat du décodage:');
    console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
    console.error('❌ Erreur:', error.message);
}





