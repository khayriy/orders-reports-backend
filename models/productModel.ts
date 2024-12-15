/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema, Types } from 'mongoose';

interface IProduct extends Document {
  name: string;
  type?: Types.ObjectId[] | any[]; // Make the type field optional
  quantity: number;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'you must provide user'],
  },
  type: [
    {
      name: {
        type: String,
      },
      quantity: {
        type: Number,
        min: [0, 'Too few eggs'],
        validate: {
          validator: function (v: any) {
            return v >= 0;
          },
          message: (props: any) => `${props.value} is not a valid quantity!`,
        },
      },
    },
  ],
  quantity: {
    type: Number,
    required: [true, 'you must provide quantity'],
  },
});

// Assuming 'TypeModel' is the name of the referenced model


const ProductModel = mongoose.model<IProduct>('Product', productSchema);

export default ProductModel;



