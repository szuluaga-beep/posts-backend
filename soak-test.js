import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = `http://localhost:3000`; // Cambia esto si tu API está en otro lugar

// Prueba de resistencia: carga constante durante tiempo prolongado
export const options = {
  stages: [
    { duration: '1m', target: 15 },    // Ramp-up
    { duration: '5m', target: 15 },    // Soak (resistencia prolongada)
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.1'],
  },
};

function getPosts() {
  return http.get(`${BASE_URL}/api/posts`);
}

function createPost(data) {
  const payload = JSON.stringify(data);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.post(`${BASE_URL}/api/posts`, payload, params);
}

export default function() {
  group('Soak - GET /posts', function() {
    let res = getPosts();
    check(res, {
      'status is 200': (res) => res.status === 200,
      'response time < 300ms': (res) => res.timings.duration < 300,
    });
  });

  sleep(1);

  group('Soak - GET /health', function() {
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
      'status is 200': (res) => res.status === 200,
    });
  });

  sleep(2);

  // Crear posts ocasionalmente durante el soak
  if (Math.random() < 0.3) {
    group('Soak - POST /posts', function() {
      const postData = {
        title: `Soak test ${Date.now()}`,
        content: 'Prueba de resistencia prolongada',
        author: 'k6-soak-test',
      };
      
      let res = createPost(postData);
      check(res, {
        'status ok': (res) => res.status === 200 || res.status === 201,
      });
    });
  }

  sleep(1);
}
