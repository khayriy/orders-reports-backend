import { Response , Request } from 'express';

const notFoundMiddelware = (req : Request,res : Response)  =>{
    res.status(404).json({message : `${req.originalUrl} Route Not Found Check The End Point`})
}

export default notFoundMiddelware