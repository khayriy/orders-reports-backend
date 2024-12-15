// import packages
import  express from 'express'
import 'express-async-errors'
import dotenv from 'dotenv'
import cors from "cors"

//import connect dataBase

//import our routes
import UserRoute from './routes/UserRoute'
// import our mddleware
import notFoundMiddelware from './middleware/notFoundMiddleWare';
import errorMiddelware from './middleware/errorMiddleware';
import ProductRoute from './routes/productRoute';
//import authMiddelware from './middleware/authMiddleware';
import ShipRoute from './routes/shipRoute';
import OrderRoute from './routes/orderRoute';
import {connectDB} from './config/ConnectDB'
import authMiddelware from './middleware/authMiddleware'


// setUp cors options 
const corsOptions ={
    origin:'*', 
    credentials:true,            
    optionSuccessStatus:200,
 }
dotenv.config()

const app = express()
app.use(express.json())
app.use(cors(corsOptions))

// our routes
app.use('/api/user' , UserRoute)
app.use('/api/product' , authMiddelware  , ProductRoute)
app.use('/api/ship' , authMiddelware , ShipRoute)
app.use('/api/order' , authMiddelware , OrderRoute)
// app.use('/api/contacts' , authMiddelware , ContactsRoute)
// app.use('/api/chat' , authMiddelware , ChatRoute)

// our middleware
app.use(notFoundMiddelware)
app.use(errorMiddelware)

// our start fuction
const PORT = process.env.PORT || 5000
const start = async () => {
    console.log('ssss');
    try {
      if (!process.env.MONGO_URL) throw new Error('Key to Connect Is Missed');
  
       await connectDB(process.env.MONGO_URL);
       //await connectDB('127.0.0.1:27017')
      

      // Use OrderModel here or in other parts of your application
    
      app.listen(PORT, () => {
        console.log(`App is listening on ${PORT} port`);
      });
    } catch (err) {
      console.log(err);
    }
  };
  
  start();


  
