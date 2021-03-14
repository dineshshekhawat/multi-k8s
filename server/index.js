const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client } = require('pg');
const redis = require('redis');

const keys = require('./keys');

let pgClient;
let redisClient;
let redis_publisher;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.listen(5000, err => {
    console.log('Listening');
    setTimeout(init, 10000);
});

init = () => {
    console.log('init()');
    initPostgres();
    initRedis();
}

initPostgres = () => {
    console.log('initPostgres()');
    console.log('keys', keys);
    
    pgClient = new Client({
        user: keys.pgUser,
        host: keys.pgHost,
        database: keys.pgDatabase,
        password: keys.pgPassword,
        port: keys.pgPort
    });

    pgClient
        .connect()
        .then(() => console.log('connected'))
        .catch(err => console.error('connection error', err.stack))

    console.log('pgClient', pgClient);

    pgClient.on('error', () => console.log('Lost PG Connection!'));

    pgClient
        .query('CREATE TABLE IF NOT EXISTS values(number INT)')
        .catch((err) => console.log(err));
}

initRedis = () => {
    console.log('initRedis()');

    redisClient = redis.createClient({
        host: keys.redisHost,
        port: keys.redisPort,
        retry_strategy: () => 1000
    });

    redis_publisher = redisClient.duplicate();
}

// Express Route Handlers
app.get('/', (req, res) => {
    res.send('Hi');
})

app.get('/values/all', async (req, res) => {
    console.log('getAll() values');
    const values = await pgClient
        .query('SELECT * FROM values')
        .catch((err) => console.log(err));
    console.log('values', values);
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redis_publisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({working: true});
});
