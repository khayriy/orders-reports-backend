declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'production';
        PORT?: string;
        JWT_SECRET: string;
        JWT_LIFETIME : string ;
        MONGO_URL : string
      }
    } 
    namespace Express {
      interface Request {
          user : {
            userId? : string ,
            permissions : {
              create : string [] , 
              view : string [] , 
              update : string [] , 
              delete : string []
            }, 
            roleName : string
          }
      }
  }

  }
  
  export {}