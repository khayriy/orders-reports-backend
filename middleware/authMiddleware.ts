import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import {Request , Response , NextFunction}  from 'express';
import throwBadRequestError from '../errors/BadRequestError'
import  throwAuthError from '../errors/AuthError'

dotenv.config()
interface JwtPayload {
    userId: string , 
    permissions : {
        view : string [] , 
        create : string [] , 
        update : string [] , 
        delete : string []
    } , 
    roleName : string , 
}

const authMiddelware = (req : Request, res : Response, next : NextFunction)=>{
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith('Bearer'))
    {
        throwBadRequestError('تسجيل الدخول مطلوب')  
    }
    else {
        const token = authHeader?.split(' ')[1]

        try {
            const { userId ,permissions , roleName } = jwt.verify(token , process.env.JWT_SECRET) as JwtPayload
            req.user = {userId : userId  , permissions :permissions , roleName : roleName }
            next()
        }
        catch(err){
            throwAuthError(' لا تملك الصلاحية')
        }
    }  
}
export default authMiddelware