import CustomError from "./customError";

class NotFoundError extends CustomError {
    
    constructor(msg : string , field? : string) {
        super(msg , 404 , field)
       
    }
}

const throwNotFoundError = (msg : string , field? : string ) =>{
     throw new NotFoundError(msg , field)
}

export default throwNotFoundError