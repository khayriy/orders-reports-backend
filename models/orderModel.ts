/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose'



const orderSchema = new mongoose.Schema({
   

    id : {
        type: Number,
        unique: true,
        required: true,
    } ,
    products : [
        {
            product : {
                type : mongoose.Schema.Types.ObjectId , 
                ref : 'Product' ,
                required : [true , 'لابد من توافر المنتج']
            }, 
            type : {
                type : String ,
            } ,
            quantity : {
               type : Number , 
               required : [true , "لابد من توافر الكمية"] , 
               minLength : 1 , 
               default : 1
            }
        }
    ] ,
    shipId : {
        type : mongoose.Schema.Types.ObjectId , 
        ref : 'Ship' , 
        required : [true , 'you must provide Ship Responsible']
    } ,
    status : {
        type : String ,
        enum: ['معلق', 'قيد التشغيل' , 'تم التسليم' , 'تسليم جزئي' , 'مرتجع'] ,
        required : [true , 'Must Provide Status']
    } ,
    address : {
        type : String ,
    } , 
    notes : {
        type : String , 
    } , 
    country : {
        type : String , 
        required : [true , 'لابد من اضافة المحافظة / المركز']    
    } , 
    name : {
        type : String , 
        required : [true , 'لابد من توافر اسم العميل']  
    } , 
    phone : {
        type : String , 
        required : [true , 'لابد من توافر رقم العميل']  
    } , 
    anotherPhone : {
        type : String , 
    } , 
    price : {
        type : Number , 
        required : [true , 'لابد من توافر سعر الطلب']  
    } , 
    updates: [
        {
            
            info: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
} , {timestamps: true})





orderSchema.pre('validate', async function (next) {
    try {
        if (!this.id) {
            // Cast this.constructor to the specific type of your model
            const Order = mongoose.model('Order');
            // Check if the generated number is already used
            // Retry until a unique number is generated
           const  maxOrder  = await Order.findOne({}, { id: 1 })
                .sort({ id: -1 })
                .limit(1)
                .exec();

           
            this.id = (maxOrder && maxOrder.id ? maxOrder.id : 0) + 1;
        }
        next();
    } catch (error : any) {
        next(error);
    }
});

const OrderModel = mongoose.model('Order', orderSchema);

export default OrderModel
