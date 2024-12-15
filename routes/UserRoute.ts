import express from "express";
import {
  createNewUserHandler,
  deleteUserHandler,
  getAllUsersHandler,
  loginHandler,
  updateUserHandler,
} from "../controllers/userController";
import authMiddelware from "../middleware/authMiddleware";

const UserRoute = express.Router();
UserRoute.route("/").get(authMiddelware , getAllUsersHandler)
UserRoute.route("/:id").delete(authMiddelware , deleteUserHandler).patch(authMiddelware ,updateUserHandler)

UserRoute.route("/login").post(loginHandler); 

//UserRoute.route("/signup").post(createNewUserHandler);
UserRoute.route("/signup").post(authMiddelware, createNewUserHandler);
export default UserRoute;
