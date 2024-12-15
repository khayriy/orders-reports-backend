import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

interface UserInterface {
  email: string;
  password: string;
  permission: {
    view: string[];
    create: string[];
    update: string[];
    delete: string[];
  };
  roleName: string;
  createJWT: () => string;
  isPasswordMatch: (password: string) => boolean;
}

const userSchema = new mongoose.Schema<UserInterface>(
  {
    email: {
      type: String,
      required: [true, "لا بد من توافر بريد الكتروني للمستخدم"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "لابد من اضافة كلمة مرور للمستحدم"],
    },
    roleName: {
      type: String,
      required: [true, "لابد من اضافة اسم الدور "],
    },
    permission: {
      type: {
        create: Array<string>,
        update: Array<string>,
        view: Array<string>,
        delete: Array<string>,
      },
      required: [true, "يجب اضافة الصلاحيات"],
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordMatch = async function (password: string) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};
userSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, roleName: this.roleName, permissions: this.permission },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};
const UserModel = mongoose.model("User", userSchema);
export default UserModel;
