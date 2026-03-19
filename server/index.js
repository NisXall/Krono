const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose  = require('mongoose');
const authRoutes = require('./routes/auth');
const { ConnectDB } = require('./config/database');

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

//connect to db
ConnectDB()
.then(() => {
    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
})
.catch((error) => {
    console.error({error:error.message});
});





