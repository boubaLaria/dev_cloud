const assert = require('assert');

// --- Fonctions extraites de gps-producer.js pour les tests ---

const TRUCKS = [
  { id: 'TRK-001', driver: 'Martin Dupont',  route: 'Paris-Lyon'     },
  { id: 'TRK-002', driver: 'Sophie Laurent', route: 'Lyon-Marseille'  },
  { id: 'TRK-003', driver: 'Jean Moreau',    route: 'Bordeaux-Paris'  },
];

const BASE_POSITIONS = {
  'Paris-Lyon':     { lat: 48.8566, lng:  2.3522 },
  'Lyon-Marseille': { lat: 45.7640, lng:  4.8357 },
  'Bordeaux-Paris': { lat: 44.8378, lng: -0.5792 },
};

function generateGPSPosition(truck) {
  const base = BASE_POSITIONS[truck.route];
  return {
    truck_id:   truck.id,
    driver:     truck.driver,
    route:      truck.route,
    latitude:   base.lat + (Math.random() - 0.5) * 0.1,
    longitude:  base.lng + (Math.random() - 0.5) * 0.1,
    speed_kmh:  Math.floor(Math.random() * 40) + 70,
    fuel_level: Math.floor(Math.random() * 60) + 20,
    timestamp:  new Date().toISOString(),
    event_type: 'GPS_UPDATE',
  };
}

// --- Tests ---

let passed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Tests GPS Producer\n');

test('La position contient tous les champs obligatoires', () => {
  const pos = generateGPSPosition(TRUCKS[0]);
  for (const field of ['truck_id', 'driver', 'route', 'latitude', 'longitude', 'speed_kmh', 'fuel_level', 'timestamp', 'event_type']) {
    assert.ok(pos[field] !== undefined, `Champ manquant : ${field}`);
  }
});

test('truck_id correspond au camion passé en paramètre', () => {
  const pos = generateGPSPosition(TRUCKS[1]);
  assert.strictEqual(pos.truck_id, 'TRK-002');
  assert.strictEqual(pos.driver, 'Sophie Laurent');
});

test('event_type est toujours GPS_UPDATE', () => {
  TRUCKS.forEach(truck => {
    assert.strictEqual(generateGPSPosition(truck).event_type, 'GPS_UPDATE');
  });
});

test('La vitesse est dans la plage 70-110 km/h', () => {
  for (let i = 0; i < 50; i++) {
    const { speed_kmh } = generateGPSPosition(TRUCKS[0]);
    assert.ok(speed_kmh >= 70 && speed_kmh <= 110, `Vitesse hors plage : ${speed_kmh}`);
  }
});

test('Le niveau de carburant est dans la plage 20-80 %', () => {
  for (let i = 0; i < 50; i++) {
    const { fuel_level } = generateGPSPosition(TRUCKS[0]);
    assert.ok(fuel_level >= 20 && fuel_level <= 80, `Carburant hors plage : ${fuel_level}`);
  }
});

test('Les coordonnées sont des nombres proches des positions de base', () => {
  const pos = generateGPSPosition(TRUCKS[0]); // Paris-Lyon, base 48.8566, 2.3522
  assert.ok(Math.abs(pos.latitude  - 48.8566) <= 0.05, `Latitude trop éloignée : ${pos.latitude}`);
  assert.ok(Math.abs(pos.longitude -  2.3522) <= 0.05, `Longitude trop éloignée : ${pos.longitude}`);
});

test('Le message Kafka est correctement sérialisable en JSON', () => {
  const pos = generateGPSPosition(TRUCKS[2]);
  const serialized = JSON.stringify(pos);
  const deserialized = JSON.parse(serialized);
  assert.strictEqual(deserialized.truck_id, 'TRK-003');
});

test('Le timestamp est une date ISO valide', () => {
  const { timestamp } = generateGPSPosition(TRUCKS[0]);
  assert.ok(!isNaN(Date.parse(timestamp)), `Timestamp invalide : ${timestamp}`);
});

console.log(`\n${passed} test(s) réussi(s)\n`);
