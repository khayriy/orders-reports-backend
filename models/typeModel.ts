// TypeModel.ts
import mongoose, { Document, Schema } from 'mongoose';

interface ITypeModel extends Document {
  // Define fields for TypeModel
  name: string;
}

const typeModelSchema = new Schema<ITypeModel>({
  name: {
    type: String,
    required: true,
  },
});

const TypeModel = mongoose.model<ITypeModel>('TypeModel', typeModelSchema);

export default TypeModel;
