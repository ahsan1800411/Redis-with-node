const { default: axios } = require('axios');
const express = require('express');
const redis = require('redis');
const client = redis.createClient();

async function createRedisClient() {
  client.on('connect', () => console.log('Connected to REDIS!'));
  client.on('error', (err) => console.log('Error connecting to REDIS: ', err));
  await client.connect();
}
createRedisClient();

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  const { key, value } = req.body;

  const response = await client.set(key, value);
  res.json(response);
});
app.get('/', async (req, res) => {
  const { key } = req.body;
  const response = await client.get(key);
  res.json(response);
});

app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  const cachedPost = await client.get(`post-${id}`);
  if (cachedPost) {
    return res.json(JSON.parse(cachedPost));
  }
  const { data } = await axios(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  await client.set(`post-${id}`, JSON.stringify(data), 'EX', 10);
  res.json(data);
});

app.listen(8080, () => console.log('Server is up and running'));
