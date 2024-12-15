import CustomError from "./customError";

class BadRequestError extends CustomError {
    
    constructor(msg : string , field? : any) {
        super(msg , 400 , field)
    }
}

const throwBadRequestError = (msg : string , field? : any) =>{
     throw new BadRequestError(msg , field)
}

export default throwBadRequestError