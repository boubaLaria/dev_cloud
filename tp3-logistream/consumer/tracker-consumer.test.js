const assert = require('assert');

// --- Logique extraite de tracker-consumer.js pour les tests ---

function processGPSMessage(rawValue) {
  const value = JSON.parse(rawValue);
  return {
    ...value,
    last_seen:    new Date().toISOString(),
    processed_at: Date.now(),
  };
}

function detectAlerts(position) {
  const alerts = [];
  if (position.speed_kmh < 5)    alerts.push('TRUCK_STOPPED');
  if (position.fuel_level < 20)  alerts.push('LOW_FUEL');
  return alerts;
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

console.log('Tests Tracker Consumer\n');

const sampleMessage = JSON.stringify({
  truck_id:   'TRK-001',
  driver:     'Martin Dupont',
  route:      'Paris-Lyon',
  latitude:   48.87,
  longitude:   2.35,
  speed_kmh:  85,
  fuel_level: 60,
  timestamp:  new Date().toISOString(),
  event_type: 'GPS_UPDATE',
});

test('Le message est correctement parsé', () => {
  const processed = processGPSMessage(sampleMessage);
  assert.strictEqual(processed.truck_id, 'TRK-001');
  assert.strictEqual(processed.speed_kmh, 85);
});

test('Les champs last_seen et processed_at sont ajoutés après traitement', () => {
  const processed = processGPSMessage(sampleMessage);
  assert.ok(processed.last_seen,                         'last_seen manquant');
  assert.ok(typeof processed.processed_at === 'number',  'processed_at doit être un timestamp numérique');
  assert.ok(!isNaN(Date.parse(processed.last_seen)),     'last_seen doit être une date ISO valide');
});

test('Aucune alerte pour un camion en mouvement avec carburant suffisant', () => {
  const alerts = detectAlerts({ speed_kmh: 85, fuel_level: 60 });
  assert.strictEqual(alerts.length, 0);
});

test('Alerte TRUCK_STOPPED si vitesse < 5 km/h', () => {
  const alerts = detectAlerts({ speed_kmh: 2, fuel_level: 50 });
  assert.ok(alerts.includes('TRUCK_STOPPED'));
});

test('Alerte LOW_FUEL si carburant < 20 %', () => {
  const alerts = detectAlerts({ speed_kmh: 80, fuel_level: 15 });
  assert.ok(alerts.includes('LOW_FUEL'));
});

test('Deux alertes simultanées possibles (arrêt + carburant bas)', () => {
  const alerts = detectAlerts({ speed_kmh: 0, fuel_level: 10 });
  assert.ok(alerts.includes('TRUCK_STOPPED'));
  assert.ok(alerts.includes('LOW_FUEL'));
  assert.strictEqual(alerts.length, 2);
});

test('Vitesse exactement à 5 km/h ne déclenche pas TRUCK_STOPPED', () => {
  const alerts = detectAlerts({ speed_kmh: 5, fuel_level: 50 });
  assert.ok(!alerts.includes('TRUCK_STOPPED'));
});

test('Carburant exactement à 20 % ne déclenche pas LOW_FUEL', () => {
  const alerts = detectAlerts({ speed_kmh: 80, fuel_level: 20 });
  assert.ok(!alerts.includes('LOW_FUEL'));
});

test('Un message JSON invalide lève une exception', () => {
  assert.throws(() => processGPSMessage('not-json'), SyntaxError);
});

console.log(`\n${passed} test(s) réussi(s)\n`);
