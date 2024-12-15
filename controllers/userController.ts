import { Response, Request } from 'express';
import throwAuthError from "../errors/AuthError"
import throwNotFoundError from "../errors/NotFoundError"
import UserModel from "../models/userModel"
import throwBadRequestError from '../errors/BadRequestError';
import bcrypt from 'bcryptjs';

export const loginHandler =  async (req : Request,res : Response)=>{
    const {email , password } = req.body
    if(!email) throwBadRequestError('لابد من ادخال البريد الالكتروني' , 'email')
    if(!password) throwBadRequestError('لابد من ادخال رمز الدخول' , 'password')
    const user = await UserModel.findOne({email : email})
    if(!user) {
        throwNotFoundError('هذا البريد غير موجود ارجع للمسئول' , "email")
    } 
    else {
        const isMatch = await user.isPasswordMatch(password)
        if(!isMatch) throwAuthError('كلمة مرور خاطئة' , "password")
        const token = user.createJWT()
        
        
        res.status(200).json({ data :  {user , token}})
    }
}

export const createNewUserHandler =  async (req : Request, res : Response)=>{
     const { permissions } = req.user;
     const isHaveAuth = permissions.view.includes("dash");
    
     if (!isHaveAuth) throwAuthError("ليس لديك الصلاحية  لانشاء مستخدم");
    const {email   , password , roleName , permission} = req.body
    const user = await UserModel.create({email , password , roleName , permission}) 
    const token = user.createJWT()
    res.status(201).json({user , token})  
} 

export const getAllUsersHandler =  async (req : Request, res : Response)=>{
  
  console.log(req.user)
  const { permissions } = req.user;
  const isHaveAuth = permissions.view.includes("dash");
 
  if (!isHaveAuth) throwAuthError("ليس لديك الصلاحية  لانشاء مستخدم");
   const allUsers = await UserModel.find({}) 
   res.status(200).json({data : allUsers})  
}

export const updateUserHandler = async (req: Request, res: Response) => {
    const { permissions } = req.user;
    const isHaveAuth = permissions.view.includes("dash");
    if (!isHaveAuth) throwAuthError("ليس لديك الصلاحية  لتعديل مستخدم");
    const {
      // user: { permissions },
      params: { id: shipId },
      body: { roleName, permission , email , password},
    } = req;
   
    if (!roleName && !permission && !email && !password)
      throwBadRequestError("لابد من ادخال البيانات المراد تعديلها");
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password, salt);
        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: shipId },
          { roleName, permission, email, password : newPassword},
          { new: true, runValidators: true }
        );
        if (!updatedUser) throwNotFoundError("لا يوجدد مسئول شحن");
        res.status(200).json({ data: updatedUser });
    }
    else {
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: shipId },
        { roleName, permission, email},
        { new: true, runValidators: true }
      );
      if (!updatedUser) throwNotFoundError("لا يوجدد مسئول شحن");
      res.status(200).json({ data: updatedUser });
    }
      
  };
export const deleteUserHandler = async (req: Request, res: Response) => {
  const { permissions } = req.user;
  const isHaveAuth = permissions.view.includes("dash");
 
  if (!isHaveAuth) throwAuthError("ليس لديك الصلاحية  لانشاء مستخدم");
    
  const {
      params: { id: userId },
    } = req;
    
    const userToDelete = await UserModel.findOne({_id : userId})

    if (!userToDelete || userToDelete == null) throwNotFoundError("لا يوجدد مسئول متوافق لحذفه");
    if(userToDelete  &&  userToDelete.permission && userToDelete.permission.view.includes('dash')) throwBadRequestError('لايمكنك حذف متحكم رئيسي')
    
    const user = await UserModel.findOneAndDelete({
      _id: userId,
    });
    
    res.status(200).json({ data: user });
  };