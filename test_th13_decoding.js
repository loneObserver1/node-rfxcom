#!/usr/bin/env node
/**
 * Test du décodage TH13 basé sur les informations RFXmngr
 */

const nodePacket = [20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77];

// Valeurs attendues selon RFXmngr:
// ID: 6803 (0x1A93)
// Temp: 21.2°C
// Hum: 39%
// Channel: 3
// Sequence: 53

console.log('='.repeat(80));
console.log('🔍 Test de décodage TH13');
console.log('='.repeat(80));
console.log();

const data = nodePacket.slice(2);

console.log('Paquet Node.js:', nodePacket);
console.log('Données (sans longueur et packet type):', data);
console.log();
console.log('Valeurs attendues (RFXmngr):');
console.log('  ID: 6803 (0x1A93)');
console.log('  Temp: 21.2°C');
console.log('  Hum: 39%');
console.log('  Channel: 3');
console.log('  Sequence: 53');
console.log();

// Essayer différentes interprétations
console.log('🔍 Tentatives de décodage:');
console.log();

// Hypothèse 1: Format standard temphumidityHandler
console.log('Hypothèse 1 (format standard):');
console.log('  data[0] (subtype):', data[0]);
console.log('  data[1] (seqnbr):', data[1], '(attendu: 53)');
console.log('  data[2-3] (ID):', '0x' + data[2].toString(16).padStart(2,'0') + data[3].toString(16).padStart(2,'0'), '=', data[2] * 256 + data[3], '(attendu: 6803)');
console.log('  data[4-5] (temp):', ((data[4] & 0x7f) * 256 + data[5]) / 10, '°C (attendu: 21.2)');
console.log('  data[6] (humidity):', data[6], '% (attendu: 39)');
console.log();

// Hypothèse 2: Format décalé
console.log('Hypothèse 2 (format décalé):');
console.log('  Channel:', data[2], '(attendu: 3)');
console.log('  ID (bytes 3-4):', '0x' + data[3].toString(16).padStart(2,'0') + data[4].toString(16).padStart(2,'0'), '=', data[3] * 256 + data[4], '(attendu: 6803)');
console.log('  Temp (byte 5):', data[5] / 10, '°C (attendu: 21.2)');
console.log('  Hum (byte 6):', data[6] & 0x7f, '% (attendu: 39)');
console.log();

// Hypothèse 3: Format avec ID inversé
console.log('Hypothèse 3 (ID inversé):');
console.log('  ID (bytes 4-3):', '0x' + data[4].toString(16).padStart(2,'0') + data[3].toString(16).padStart(2,'0'), '=', data[4] * 256 + data[3], '(attendu: 6803)');
console.log();

// Hypothèse 4: Chercher 6803 dans le paquet
console.log('Hypothèse 4 (chercher 6803 dans le paquet):');
for (let i = 0; i < data.length - 1; i++) {
    const val = data[i] * 256 + data[i + 1];
    if (Math.abs(val - 6803) < 100) {
        console.log(`  Trouvé ${val} à la position ${i}-${i+1}`);
    }
}
console.log();

// Hypothèse 5: Chercher 21.2°C (212 en dixièmes) ou valeurs proches
console.log('Hypothèse 5 (chercher température ~21.2°C):');
for (let i = 0; i < data.length - 1; i++) {
    const val = ((data[i] & 0x7f) * 256 + data[i + 1]) / 10;
    if (Math.abs(val - 21.2) < 5) {
        console.log(`  Trouvé ${val}°C à la position ${i}-${i+1}`);
    }
    // Ou format simple
    const val2 = data[i] / 10;
    if (Math.abs(val2 - 21.2) < 5) {
        console.log(`  Trouvé ${val2}°C (simple) à la position ${i}`);
    }
}
console.log();

// Hypothèse 6: Chercher 39% d'humidité
console.log('Hypothèse 6 (chercher humidité 39%):');
for (let i = 0; i < data.length; i++) {
    if (data[i] === 39 || (data[i] & 0x7f) === 39) {
        console.log(`  Trouvé 39% à la position ${i}`);
    }
}
console.log();

// Hypothèse 7: Format selon la description de l'utilisateur
// "Température = 21 → 21,2 °C (après conversion)"
// "Humidité = 127 → 39 % (codé sur 7 bits)"
console.log('Hypothèse 7 (selon description utilisateur):');
console.log('  Temp (byte 5 = 127):', data[5], '→ 21.2°C après conversion');
console.log('    Conversion possible: (127 - 106) / 1 =', (127 - 106), '°C (pas bon)');
console.log('    Conversion possible: 127 / 6 =', (127 / 6).toFixed(1), '°C (pas bon)');
console.log('    Conversion possible: (127 & 0x7F) / 6 =', ((127 & 0x7F) / 6).toFixed(1), '°C (pas bon)');
console.log('  Hum (byte 6 = 223):', data[6], '→ 39% (codé sur 7 bits)');
console.log('    223 & 0x7F =', (223 & 0x7F), '% (pas 39)');
console.log('    223 >> 1 =', (223 >> 1), '% (pas 39)');
console.log('    Peut-être dans byte 7?', data[7], '→', (data[7] & 0x7F), '%');
console.log();

console.log('💡 Il faut trouver la formule de conversion exacte pour temp et hum.');





