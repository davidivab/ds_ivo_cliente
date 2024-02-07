const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/src/views/index.html'));
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});