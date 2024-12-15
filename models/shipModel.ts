import mongoose from 'mongoose'

const shipSchema = new mongoose.Schema({
    name : {
        type : String , 
        require : [true , 'لابد من اضافة اسم مسئول الشحن']
    } , 
    phone : {
        type : String , 
        required : [true , "لابد من اضافة رقم هاتف مسئول الشحن"] , 
        maxLength : 11 ,
        minLength : 11 , 
        unique : true 
    } , 

})


const ShipModel = mongoose.model('Ship' , shipSchema)

export default ShipModel