import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = `http://localhost:3000`; // Cambia esto si tu API está en otro lugar

// Prueba de estrés: carga progresiva hasta el límite
export const options = {
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

function createPost(data) {
  const payload = JSON.stringify(data);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.post(`${BASE_URL}/posts`, payload, params);
}

function getPosts() {
  return http.get(`${BASE_URL}/posts`);
}

function deletePost(id) {
  return http.del(`${BASE_URL}/posts/${id}`);
}

export default function() {
  group('GET /posts', function() {
    let res = getPosts();
    check(res, {
      'status 200': (res) => res.status === 200,
      'response time < 500ms': (res) => res.timings.duration < 500,
    });
  });

  sleep(0.3);

  group('POST /posts', function() {
    const postData = {
      title: `Post estrés ${Date.now()}`,
      content: 'Prueba de estrés k6',
      author: 'k6-stress-test',
    };
    
    let res = createPost(postData);
    check(res, {
      'status 201 or 200': (res) => res.status === 201 || res.status === 200,
      'response time < 500ms': (res) => res.timings.duration < 500,
    });

    if (res.status === 201 || res.status === 200) {
      try {
        const postId = JSON.parse(res.body)._id || JSON.parse(res.body).id;
        
        sleep(0.1);

        group('DELETE /posts/:id', function() {
          let deleteRes = deletePost(postId);
          check(deleteRes, {
            'status 200 or 204': (deleteRes) => deleteRes.status === 200 || deleteRes.status === 204,
          });
        });
      } catch (e) {
        console.error('Error:', e);
      }
    }
  });

  sleep(Math.random() * 0.5);
}
