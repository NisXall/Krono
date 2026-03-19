const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose  = require('mongoose');
const authRoutes = require('./routes/auth')

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);


//connect to db

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
