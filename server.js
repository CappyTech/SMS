const app = require('./app');

const port = process.env.NODE_ENV === 'development' ? 80 : 443;
const host = process.env.NODE_ENV === 'development' ? '127.0.0.1' : '0.0.0.0';

app.listen(port, host, () => {
    console.log(`Server running in ${process.env.NODE_ENV} on ${host}:${port}`);
});