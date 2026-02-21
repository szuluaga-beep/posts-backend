import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = 'http://localhost:3000'; // Cambia esto si tu API está en otro lugar

// ===================================
// PRUEBAS DE CARGA (Load Test)
// ===================================
export const loadTest = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up a 20 usuarios
    { duration: '1m30s', target: 20 }, // Mantener 20 usuarios
    { duration: '30s', target: 0 },    // Ramp-down a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'], // 95% < 300ms, 99% < 500ms
    http_req_failed: ['rate<0.1'],                   // Tasa de error < 10%
  },
};

// ===================================
// PRUEBAS DE ESTRÉS (Stress Test)
// ===================================
export const stressTest = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up a 50 usuarios
    { duration: '1m', target: 100 },   // Aumento a 100 usuarios
    { duration: '1m', target: 100 },   // Mantener 100 usuarios
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.2'],
  },
};

// ===================================
// PRUEBAS DE PICO (Spike Test)
// ===================================
export const spikeTest = {
  stages: [
    { duration: '20s', target: 10 },   // Carga normal
    { duration: '10s', target: 200 },  // Pico repentino
    { duration: '20s', target: 10 },   // Volver a la normalidad
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.15'],
  },
};

// ===================================
// PRUEBAS DE RESISTENCIA (Soak Test)
// ===================================
export const soakTest = {
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

// Por defecto, usar prueba de carga
export const options = loadTest;

// ===================================
// FUNCIONES AUXILIARES
// ===================================
function createPost(data) {
  const payload = JSON.stringify(data);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.post(`${BASE_URL}/api/posts`, payload, params);
}

function getPosts() {
  return http.get(`${BASE_URL}/api/posts`);
}

function getPostById(id) {
  return http.get(`${BASE_URL}/api/posts/${id}`);
}

function updatePost(id, data) {
  const payload = JSON.stringify(data);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.put(`${BASE_URL}/api/posts/${id}`, payload, params);
}

function deletePost(id) {
  return http.del(`${BASE_URL}/api/posts/${id}`);
}

// ===================================
// PRUEBA PRINCIPAL
// ===================================
export default function() {
  // Prueba de health check
  group('Health Check', function() {
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health check status 200': (res) => res.status === 200,
    });
  });

  sleep(0.5);

  // Prueba GET /posts
  group('Get All Posts', function() {
    let res = getPosts();
    check(res, {
      'get posts status 200': (res) => res.status === 200,
      'get posts duration < 300ms': (res) => res.timings.duration < 300,
    });
  });

  sleep(1);

  // Prueba POST /posts
  group('Create Post', function() {
    const postData = {
      title: `Post de prueba ${Date.now()}`,
      content: 'Este es un post creado por pruebas de carga k6',
      author: 'k6-test-user',
    };
    
    let res = createPost(postData);
    check(res, {
      'create post status 201': (res) => res.status === 201 || res.status === 200,
      'create post duration < 300ms': (res) => res.timings.duration < 300,
    });

    // Guardar el ID del post para pruebas posteriores
    if (res.status === 201 || res.status === 200) {
      try {
        const postId = JSON.parse(res.body)._id || JSON.parse(res.body).id;
        
        sleep(0.5);

        // Prueba GET por ID
        group('Get Post By ID', function() {
          let getRes = getPostById(postId);
          check(getRes, {
            'get post by id status 200': (getRes) => getRes.status === 200,
          });
        });

        sleep(0.5);

        // Prueba PUT
        group('Update Post', function() {
          const updateData = {
            title: `Post actualizado ${Date.now()}`,
            content: 'Contenido actualizado por pruebas de carga',
          };
          let updateRes = updatePost(postId, updateData);
          check(updateRes, {
            'update post status 200': (updateRes) => updateRes.status === 200 || updateRes.status === 204,
          });
        });

        sleep(0.5);

        // Prueba DELETE
        group('Delete Post', function() {
          let deleteRes = deletePost(postId);
          check(deleteRes, {
            'delete post status 200': (deleteRes) => deleteRes.status === 200 || deleteRes.status === 204,
          });
        });
      } catch (e) {
        console.error('Error parsing response:', e);
      }
    }
  });

  sleep(Math.random() * 2); // Sleep aleatorio entre 0-2 segundos
}
