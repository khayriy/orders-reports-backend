export default class CustomError extends Error {
    statusCode: number 
    field? : string 
    constructor(msg : string ,  statusCode : number , field? : string ){
        super(msg)
        this.statusCode = statusCode
        this.field = field
    }
}
