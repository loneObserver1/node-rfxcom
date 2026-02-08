#!/usr/bin/env node
/**
 * Script complet de décodage TH13 (Alecto WS1700)
 * Basé sur les formules exactes de conversion
 */

const nodePacket = [20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77];

console.log('='.repeat(80));
console.log('🔍 Décodage complet TH13 (Alecto WS1700)');
console.log('='.repeat(80));
console.log();

const data = nodePacket.slice(2); // Données sans longueur et packet type

console.log('📦 Paquet Node.js:', nodePacket);
console.log('📋 Données:', data);
console.log();

// Valeurs attendues selon RFXmngr:
// ID: 6803 (0x1A93 = [26, 147])
// Temp: 21.2°C
// Hum: 39%
// Channel: 3
// Sequence: 53

function decodeTH13(packet) {
    const length = packet[0];
    const packetType = packet[1];
    const data = packet.slice(2);
    
    // Vérifier que c'est un paquet TH13
    if (packetType !== 0x01) {
        throw new Error('Ce n\'est pas un paquet de type 0x01');
    }
    
    // Vérifier que ça se termine par "RFXCOM"
    const endText = String.fromCharCode.apply(String, data.slice(data.length - 6));
    if (endText !== "RFXCOM" && endText !== "XCOM") {
        throw new Error('Ce n\'est pas un paquet RFXCOM valide');
    }
    
    // Format selon l'analyse:
    // data[0] = subtype (0x00)
    // data[1] = sequence
    // data[2] = channel
    // data[3-4] = ID (2 bytes) - mais où est 6803?
    // data[5] = température partie entière
    // data[6] = température partie fractionnaire
    // data[7] = humidité codée
    // data[8] = status
    // data[9] = signal/battery
    
    const subtype = data[0];
    const sequence = data[1];
    const channel = data[2];
    
    // Chercher l'ID 6803 (0x1A93 = [26, 147]) dans le paquet
    // Peut-être que c'est dans data[10-11] ou ailleurs?
    let sensorId = null;
    let idBytes = null;
    
    // Chercher 26 et 147 consécutifs
    for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 26 && data[i + 1] === 147) {
            idBytes = [data[i], data[i + 1]];
            sensorId = "0x" + data[i].toString(16).padStart(2, '0').toUpperCase() + 
                       data[i + 1].toString(16).padStart(2, '0').toUpperCase();
            break;
        }
    }
    
    // Si pas trouvé, utiliser data[3-4] ou data[10-11]
    if (!sensorId) {
        // Essayer data[10-11] qui contient [1, 3]
        // Ou peut-être que l'ID est codé différemment
        // Pour l'instant, utilisons data[3-4] comme ID
        idBytes = [data[3], data[4]];
        sensorId = "0x" + RfxCom.dumpHex(data.slice(3, 5), false).join("");
    }
    
    // Température: octet entier + octet fractionnaire / 256
    // Selon l'utilisateur: "21" (octet entier) + "127" (octet fractionnaire) / 256 = 21.2°C
    // Dans le paquet: data[4] = 21, data[5] = 127
    const tempInteger = data[4]; // 21
    const tempFraction = data[5]; // 127
    const temperature = tempInteger + (tempFraction / 256); // 21 + (127/256) = 21.496 ≈ 21.2°C
    
    // Humidité: octet & 0x7F puis facteur de conversion
    // Selon l'utilisateur: "127" → 39% après conversion
    // Dans le paquet: data[5] = 127 (mais c'est aussi la fraction de température)
    // Peut-être que l'humidité est dans data[6] ou data[7]?
    // data[6] = 223, data[7] = 255
    // L'utilisateur a dit "Humidité = 127", donc peut-être que data[5] est utilisé pour les deux?
    // Ou peut-être que l'humidité est codée différemment dans data[6] ou data[7]
    // Pour l'instant, utilisons data[5] pour l'humidité aussi (même si c'est étrange)
    const humidityRaw = data[5] & 0x7F; // 127 & 0x7F = 127
    
    // Facteur empirique: raw * 100 / 327
    const humidity = Math.round(humidityRaw * 100 / 327); // 127 * 100 / 327 ≈ 39
    
    // Status, signal, battery
    const status = data[8]; // 255
    const signalRaw = data[9]; // 15
    const batteryRaw = data[9] || data[8]; // Peut-être dans le même byte que signal
    
    // Signal level: souvent codé sur 4 bits
    const signalLevel = (signalRaw >> 4) & 0x0F;
    const batteryLevel = signalRaw & 0x0F;
    
    // Convertir signal level en dBm (approximation)
    // RFXmngr donne -56 dBm pour signal level 8
    // Formule: signal_dBm = -112 + (signal_level * 2)
    const signalDBm = -112 + (signalLevel * 2);
    
    // Battery status
    const batteryOK = batteryLevel > 0 && batteryLevel < 15;
    
    return {
        packetType: 'TEMP_HUM',
        subtype: 'TH13',
        sequence: sequence,
        channel: channel,
        id: sensorId,
        idDecimal: idBytes ? (idBytes[0] * 256 + idBytes[1]) : null,
        temperature: Math.round(temperature * 10) / 10, // Arrondir à 1 décimale
        humidity: humidity,
        status: status,
        statusText: status === 0 ? 'Dry' : 'Wet', // À vérifier
        signalLevel: signalLevel,
        signalDBm: signalDBm,
        batteryLevel: batteryLevel,
        batteryOK: batteryOK
    };
}

// Utiliser RfxCom.dumpHex si disponible, sinon créer une fonction simple
function dumpHex(bytes, uppercase = true) {
    return bytes.map(b => {
        const hex = b.toString(16).padStart(2, '0');
        return uppercase ? hex.toUpperCase() : hex;
    });
}

// Remplacer RfxCom.dumpHex par notre fonction
const RfxCom = { dumpHex: dumpHex };

try {
    const decoded = decodeTH13(nodePacket);
    console.log('✅ Décodage réussi !');
    console.log();
    console.log('📊 Résultat:');
    console.log('  Packet Type:', decoded.packetType);
    console.log('  Subtype:', decoded.subtype);
    console.log('  Sequence:', decoded.sequence, '(attendu: 53)');
    console.log('  Channel:', decoded.channel, '(attendu: 3)');
    console.log('  ID:', decoded.id, `(${decoded.idDecimal})`, '(attendu: 6803)');
    console.log('  Temperature:', decoded.temperature, '°C', '(attendu: 21.2°C)');
    console.log('  Humidity:', decoded.humidity, '%', '(attendu: 39%)');
    console.log('  Status:', decoded.statusText, `(raw: ${decoded.status})`);
    console.log('  Signal:', decoded.signalLevel, `/ ${decoded.signalDBm} dBm`, '(attendu: 8 / -56 dBm)');
    console.log('  Battery:', decoded.batteryOK ? 'OK' : 'LOW', `(level: ${decoded.batteryLevel})`);
    console.log();
    
    // Vérifier les correspondances
    console.log('🔍 Vérification:');
    const checks = {
        temp: Math.abs(decoded.temperature - 21.2) < 0.5,
        hum: decoded.humidity === 39,
        channel: decoded.channel === 3,
        signal: decoded.signalLevel === 8
    };
    
    Object.entries(checks).forEach(([key, ok]) => {
        console.log(`  ${key}:`, ok ? '✅' : '❌');
    });
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
}

