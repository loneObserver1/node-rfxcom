#!/usr/bin/env node
/**
 * Script de test pour vérifier le support des sondes Alecto (temperaturerain1)
 * Teste le parsing des messages de type 0x4f
 */

const rfxcom = require('./index');

console.log('='.repeat(80));
console.log('🧪 Test du support Alecto (temperaturerain1)');
console.log('='.repeat(80));
console.log();

// Créer une instance RfxCom (sans port série pour les tests)
const device = new rfxcom.RfxCom("/dev/ttyUSB0");

// Exemple de paquet Alecto basé sur les tests
// Format: [subtype, seqnbr, id_byte1, id_byte2, temp_byte1, temp_byte2, rain_byte1, rain_byte2, status]
// Exemple: [0x01, 0x01, 0xde, 0xad, 0x01, 0x4A, 0x02, 0xee, 0x42]
// - subtype: 0x01 (Alecto WS1200)
// - seqnbr: 0x01
// - id: 0xDEAD
// - temp: 0x014A = 330 / 10 = 33.0°C
// - rain: 0x02EE = 750 / 10 = 75.0mm
// - status: 0x42 (battery: 2, rssi: 4)

const testPackets = [
    {
        name: "Alecto WS1200 - Température positive",
        data: [0x01, 0x01, 0xde, 0xad, 0x01, 0x4A, 0x02, 0xee, 0x42],
        expected: {
            subtype: 1,
            id: "0xDEAD",
            temperature: 33.0,
            rainfall: 75.0,
            batteryLevel: 2,
            rssi: 4
        }
    },
    {
        name: "Alecto WS1200 - Température négative",
        data: [0x01, 0x01, 0xde, 0xad, 0x80, 0x64, 0x02, 0xee, 0x42],
        expected: {
            subtype: 1,
            id: "0xDEAD",
            temperature: -10.0,
            rainfall: 75.0,
            batteryLevel: 2,
            rssi: 4
        }
    },
    {
        name: "Alecto WS1200 - Température 33.3°C",
        data: [0x01, 0x01, 0xde, 0xad, 0x01, 0x4D, 0x02, 0xee, 0x42],
        expected: {
            subtype: 1,
            id: "0xDEAD",
            temperature: 33.3,
            rainfall: 75.0,
            batteryLevel: 2,
            rssi: 4
        }
    }
];

let testsPassed = 0;
let testsFailed = 0;

testPackets.forEach((test, index) => {
    console.log(`\n📦 Test ${index + 1}: ${test.name}`);
    console.log(`   Données: [${test.data.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}]`);
    
    device.once("temperaturerain1", (evt, packetType) => {
        console.log(`   ✅ Événement 'temperaturerain1' reçu (packetType: 0x${packetType.toString(16).toUpperCase()})`);
        console.log(`   📊 Données parsées:`);
        console.log(`      - subtype: ${evt.subtype} (attendu: ${test.expected.subtype})`);
        console.log(`      - id: ${evt.id} (attendu: ${test.expected.id})`);
        console.log(`      - temperature: ${evt.temperature}°C (attendu: ${test.expected.temperature}°C)`);
        console.log(`      - rainfall: ${evt.rainfall}mm (attendu: ${test.expected.rainfall}mm)`);
        console.log(`      - batteryLevel: ${evt.batteryLevel} (attendu: ${test.expected.batteryLevel})`);
        console.log(`      - rssi: ${evt.rssi} (attendu: ${test.expected.rssi})`);
        
        // Vérifier les résultats
        let passed = true;
        if (evt.subtype !== test.expected.subtype) {
            console.log(`      ❌ subtype incorrect`);
            passed = false;
        }
        if (evt.id !== test.expected.id) {
            console.log(`      ❌ id incorrect`);
            passed = false;
        }
        if (Math.abs(evt.temperature - test.expected.temperature) > 0.1) {
            console.log(`      ❌ temperature incorrecte`);
            passed = false;
        }
        if (Math.abs(evt.rainfall - test.expected.rainfall) > 0.1) {
            console.log(`      ❌ rainfall incorrect`);
            passed = false;
        }
        if (evt.batteryLevel !== test.expected.batteryLevel) {
            console.log(`      ❌ batteryLevel incorrect`);
            passed = false;
        }
        if (evt.rssi !== test.expected.rssi) {
            console.log(`      ❌ rssi incorrect`);
            passed = false;
        }
        
        if (passed) {
            console.log(`   ✅ Test réussi !`);
            testsPassed++;
        } else {
            console.log(`   ❌ Test échoué !`);
            testsFailed++;
        }
    });
    
    // Appeler le handler directement avec les données de test
    device.temprainHandler(test.data, 0x4f);
});

// Attendre un peu pour que les événements soient traités
setTimeout(() => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Résultats des tests:');
    console.log(`   ✅ Tests réussis: ${testsPassed}`);
    console.log(`   ❌ Tests échoués: ${testsFailed}`);
    console.log(`   📈 Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(80));
    
    if (testsFailed === 0) {
        console.log('\n🎉 Tous les tests sont passés ! Le support Alecto fonctionne correctement.');
        process.exit(0);
    } else {
        console.log('\n⚠️ Certains tests ont échoué. Vérifiez le code du handler.');
        process.exit(1);
    }
}, 500);

