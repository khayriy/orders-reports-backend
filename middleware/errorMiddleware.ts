/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { NextFunction, Request, Response } from 'express'
import CustomError from '../errors/customError'
import { Error as Err } from 'mongoose'
import {   MongoServerError } from 'mongodb'


const errorMiddelware = (err: Error  , req: Request, res: Response , next : NextFunction) => {
   
    let customError = {
        statusCode: 500,
        message: "Some Thing went wrong try later ...." , 
        field : ''
    }

    if (err instanceof CustomError) {
        customError.message = err.message
        customError.statusCode = err.statusCode
        customError.field = err.field || ""
    }
    if (err instanceof Err.ValidationError) {
        customError.message = Object.values(err.errors).map((item) => item.message).join(',')
        customError.statusCode = 400
    }
    if (err instanceof Err.CastError) {
        
        customError.message = `لا يوجد عنصر بهذه القيمة ${err.value}`
        customError.statusCode = 404
    }
    
    if (err instanceof MongoServerError  && err.code === 11000) {
        customError.field = 'email'
        customError.message = `هذا البريد / الهاتف مستخدم بالفعل`
        customError.statusCode = 401
    }

    return res.status(customError.statusCode).json({ error: customError.message , field : customError.field})
}

export default errorMiddelware  