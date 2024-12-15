import CustomError from "./customError";

class AuthError extends CustomError {
    
    constructor(msg : string , field? : string) {
        super(msg , 401 , field)
       
    }
}

const throwAuthError = (msg : string , field? : string) =>{
     throw new AuthError(msg , field)
}

export default throwAuthError