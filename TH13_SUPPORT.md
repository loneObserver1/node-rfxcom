# Support Alecto TH13/WS1700

## Statut

Le support pour les sondes Alecto TH13/WS1700 a été ajouté au fork `node-rfxcom`.

## Problème identifié

Les sondes Alecto TH13/WS1700 envoient des messages avec le **packet type 0x01** (normalement réservé aux messages de statut), mais contiennent en réalité des données de température et d'humidité.

## Format du paquet

### Paquet RFXmngr (décodé)
```
0A520D35680300D4270289
```

- `0A` = longueur (10)
- `52` = packet type TEMP_HUM
- `0D` = subtype TH13
- `35` = sequence (53)
- `6803` = ID (26627)
- `00` = channel (0)
- `D4` = température codée (212 → 21.2°C)
- `27` = humidité (39%)
- `02` = status
- `89` = signal/battery

### Paquet Node.js (brut)
```
[20, 1, 0, 1, 2, 83, 21, 127, 223, 255, 15, 1, 3, 28, 3, 82, 70, 88, 67, 79, 77]
```

- `20` = longueur
- `1` = packet type (0x01)
- `0` = subtype
- `1` = sequence
- `2` = channel
- `83, 21` = ID (à décoder)
- `127` = température codée (à convertir en 21.2°C)
- `223` = humidité codée (à convertir en 39%)
- ... = autres données
- `82, 70, 88, 67, 79, 77` = "RFXCOM" (ASCII)

## Modifications apportées

1. **Handler dans `statusMessageHandler`** : Détection des paquets TH13 dans les messages de type 0x01
2. **Émission d'événement `temperaturehumidity1`** : Compatible avec le format standard

## À faire

- [ ] Trouver la formule exacte de conversion pour la température (127 → 21.2°C)
- [ ] Trouver la formule exacte de conversion pour l'humidité (223 → 39%)
- [ ] Trouver la position exacte de l'ID (6803) dans le paquet Node.js
- [ ] Valider le décodage avec des paquets réels

## Tests

Des scripts de test ont été créés :
- `test_alecto.js` : Test du handler `temprainHandler` (packet type 0x4f)
- `test_alecto_th13.js` : Test du handler pour packet type 0x01
- `test_th13_decoding.js` : Analyse du format de décodage
- `decode_temp_hum.js` : Comparaison des formats RFXmngr et Node.js

## Références

- [Fork node-rfxcom](https://github.com/loneObserver1/node-rfxcom.git)
- Documentation RFXmngr pour le format TH13

