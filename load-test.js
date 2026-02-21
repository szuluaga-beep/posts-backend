import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = `http://${__ENV.API_URL ?? 'host.docker.internal:3000'}`;

// Prueba de carga: aumento gradual y mantenimiento de usuarios
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up a 20 usuarios
    { duration: '1m30s', target: 20 }, // Mantener 20 usuarios
    { duration: '30s', target: 0 },    // Ramp-down a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.1'],
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

function getPostById(id) {
  return http.get(`${BASE_URL}/posts/${id}`);
}

function updatePost(id, data) {
  const payload = JSON.stringify(data);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return http.put(`${BASE_URL}/posts/${id}`, payload, params);
}

function deletePost(id) {
  return http.del(`${BASE_URL}/posts/${id}`);
}

export default function() {
  group('Health Check', function() {
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health check status 200': (res) => res.status === 200,
    });
  });

  sleep(0.5);

  group('Get All Posts', function() {
    let res = getPosts();
    check(res, {
      'get posts status 200': (res) => res.status === 200,
      'get posts duration < 300ms': (res) => res.timings.duration < 300,
    });
  });

  sleep(1);

  group('Create Post', function() {
    const postData = {
      title: `Post de carga ${Date.now()}`,
      content: 'Prueba de carga k6 - Crear post',
      author: 'k6-load-test',
    };
    
    let res = createPost(postData);
    check(res, {
      'create post status 201': (res) => res.status === 201 || res.status === 200,
      'create post duration < 300ms': (res) => res.timings.duration < 300,
    });

    if (res.status === 201 || res.status === 200) {
      try {
        const postId = JSON.parse(res.body)._id || JSON.parse(res.body).id;
        
        sleep(0.5);

        group('Get Post By ID', function() {
          let getRes = getPostById(postId);
          check(getRes, {
            'get post by id status 200': (getRes) => getRes.status === 200,
          });
        });

        sleep(0.5);

        group('Delete Post', function() {
          let deleteRes = deletePost(postId);
          check(deleteRes, {
            'delete post status 200': (deleteRes) => deleteRes.status === 200 || deleteRes.status === 204,
          });
        });
      } catch (e) {
        console.error('Error:', e);
      }
    }
  });

  sleep(Math.random() * 2);
}
