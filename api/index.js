import express from 'express';
import bodyParser from 'body-parser';
import { config } from 'dotenv';

// import habitRoutes from './src/routes/habitRoutes.js';


config();

const app = express();
app.disable('x-powered-by');


const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//app.use('/api/habits', habitRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
