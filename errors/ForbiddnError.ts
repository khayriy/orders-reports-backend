import CustomError from "./customError";

class ForbiddnError extends CustomError {
    
    constructor(msg : string , field? : string) {
        super(msg , 403 , field)
       
    }
}

const throwForbiddnError = (msg : string , field? : string) =>{
     throw new ForbiddnError(msg , field)
}

export default throwForbiddnError