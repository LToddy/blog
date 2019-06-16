import crypto from "crypto";

import { Document, model, Model, Schema, Types } from "mongoose";
import { MongoError } from "mongodb";

import { SECRET } from "../config";


const UserSchema: Schema<IUserDocument> = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  bio: String,
});


// 静态方法
UserSchema.statics.new = function (email: string, username: string, password: string): Promise<IUserDocument> {
  const passwordHash = crypto.createHmac("sha256", SECRET).update(password).digest("hex");

  return User.create({ email, username, passwordHash });
};

UserSchema.statics.queryByUsername = function (username: string): Promise<IUserDocument> {
  return new Promise<IUserDocument>((resolve, reject) => {
    User.findOne({ username }, (err: MongoError, user: IUserDocument) => {
      if (err) {
        return reject(err);
      }

      return resolve(user);
    });
  });
};


// 实例方法
UserSchema.methods.verifyPassword = function (password: string): boolean {
  const passwordHash = crypto.createHmac("sha256", SECRET).update(password).digest("hex");

  return passwordHash === this.passwordHash;
};


export interface IUserDocument extends Document {
  id: Types.ObjectId;
  email: String;
  username: String;
  passwordHash: String;
  bio: String;

  verifyPassword(password: string): boolean;
}

export interface IUserModel extends Model<IUserDocument> {
  new: (email: string, username: string, password: string) => Promise<IUserDocument>;

  queryByUsername: (username: string) => Promise<IUserDocument>;
}

const User: IUserModel = model<IUserDocument, IUserModel>("User", UserSchema);

export default User;
