import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = `http://localhost:3000`; // Cambia esto si tu API está en otro lugar

// Prueba de picos: simula picos repentinos de tráfico
export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Carga normal
    { duration: '10s', target: 200 },  // Pico repentino
    { duration: '20s', target: 10 },   // Volver a normalidad
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.15'],
  },
};

function createDummyData() {
  const payload = JSON.stringify({
    title: `Spike test ${Date.now()}`,
    content: 'Request durante pico de tráfico',
    author: 'k6-spike-test',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.post(`${BASE_URL}/api/posts`, payload, params);
}

export default function() {
  // Múltiples requests simultáneos durante el pico
  for (let i = 0; i < 3; i++) {
    group(`Spike request ${i + 1}`, function() {
      let res = http.get(`${BASE_URL}/api/posts`);
      check(res, {
        'status is 200': (res) => res.status === 200,
      });
    });

    group(`Create during spike ${i + 1}`, function() {
      let res = createDummyData();
      check(res, {
        'create status ok': (res) => res.status === 200 || res.status === 201,
      });
    });
  }

  sleep(0.1);
}
