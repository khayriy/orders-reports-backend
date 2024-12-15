/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, Request } from "express";
import throwBadRequestError from "../errors/BadRequestError";
import ProductModel from "../models/productModel";
import throwNotFoundError from "../errors/NotFoundError";
import hasDuplicates from "../utils/IsArrayEqual";
import { type } from "os";
import mongoose from "mongoose";

export const getAllProducts = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // if (!permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لتصفح المنتجات");
  // const isHaveAuth = permissions.view.includes("product");
  // if (!isHaveAuth )
  //   throwForbiddnError("ليس لديك الصلاحية لتصفح المنتجات");
  const allProducts = await ProductModel.find({});
  res.status(200).json({ data: allProducts });
};
export const createNewProduct = async (req: Request, res: Response) => {
  const { name, type , quantity} = req.body;
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.create.includes("product");
  // if (!isHaveAuth || !permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لاضافة منتج");
  if (!name && type) throwBadRequestError("لا بد من توافر اسم المنتج", "name");

  if(!type && !quantity && name) throwBadRequestError('لابد من اضافة الكمية')
  if (type && hasDuplicates(type)) throwBadRequestError("يوجد عناصر مككرة");
  
  const isExistWithType = await ProductModel.exists({ name: name });
  if (isExistWithType) throwBadRequestError("هذا المنتج موجود بالفعل", "name");
  
  if(name && quantity && !type) {
   
  const newProduct = await ProductModel.create({
    name: name,
    quantity : quantity,
  });
  res.status(201).json({ data: newProduct });
  }
 else {
  const allQuantity = type
  .map((e: any) => Number(e.quantity))
  .reduce((a: number, b: number) => {
    return a + b;
  }, 0);
const newProduct = await ProductModel.create({
  name: name,
  type: type,
  quantity : allQuantity,
});
res.status(201).json({ data: newProduct });
 }
 
};
export const updateProduct = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: productId },
    body: { name, type , totalQuantity  },
  } = req;
  // const isHaveAuth = permissions.update.includes("product");
  // if (!isHaveAuth || !permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لتعديل منتج");
  if (!name && !type && !totalQuantity)
    throwBadRequestError("لا بد من توافر اسم النتج او انواعه ", "name");
  if(totalQuantity && type) throwBadRequestError('لا يمكنك وضع عدد كمية المنتجات حاول ان تضع كمية نوع فقط')
   
  let updatedProduct;
  const getProduct = await ProductModel.findOne({ _id: productId });
  // if(!totalQuantity && getProduct?.type) throwBadRequestError('لا يمكنك وضع عدد كمية المنتجات حاول ان تضع كمية نوع فقط')
  if (!getProduct) throwNotFoundError("لا يوجدد منتج متوافق لتعديله");
  const quantityOfExistProductWithoutType = getProduct && getProduct?.quantity
  if(+Number(quantityOfExistProductWithoutType) + totalQuantity < 0) throwBadRequestError('لا يوجد عدد كافي')
  
  if (!name && getProduct !== null && type) {
    const allTypes = type.concat(getProduct.type);

    if (hasDuplicates(allTypes)) throwBadRequestError("يوجد نوع بهذا الاسم من قبل");
   
    const newQuantity =
      +getProduct.quantity +
      +type
        .map((e: any) => Number(e.quantity))
        .reduce((a: number, b: number) => {
          return a + b;
        }, 0);
   
    updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      { quantity: newQuantity, $push: { type: { $each: [...type] } } },
      { new: true, runValidators: true }
    );
  }
  if ( !type && name ) {
    updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      { name: name },
      { new: true, runValidators: true }
    );
  }
  if (name && type ) {
    updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      { name: name, $push: { type: { $each: [...type] } } },
      { new: true, runValidators: true }
    );
  }
  if(!type && name && totalQuantity) {
    updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      {  $inc : {quantity : totalQuantity} , name: name},
      { new: true, runValidators: true }
  )}
  if(!type && !name && totalQuantity) {   
    updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId },
      {   $inc : {quantity : totalQuantity}},
      { new: true, runValidators: true }
  )}
  res.status(200).json({ data: updatedProduct });
};
export const deleteProduct = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: productId },
  } = req;
  // const isHaveAuth = permissions?.delete?.includes("product");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لحذف منتج");
  if(!productId) throwBadRequestError('لابد من توافر المنتج المراد حذفه')
  const product = await ProductModel.findOneAndDelete({
    _id: productId,
  });
  if (!product) throwNotFoundError("لا يوجدد منتج متوافق لحذفه");
  res.status(200).json({ data: product });
};

export const updateTypeInProduct = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: productId },
    body: { name, quantity, typeId },
  } = req;
  // const isHaveAuth = permissions.update.includes("product");
  // if (!isHaveAuth || !permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لتعديل منتج");
  if (!typeId)
    throwBadRequestError("لا بد من توافر النوع الذي تريد تعديله", "name");

  const updatedP = await ProductModel.findOne({ _id: productId });

  if (!updatedP) {
    throwNotFoundError("لايوجد منتج لتعديله");
  }
  if( updatedP && updatedP.type && updatedP?.type.some((e)=>e.name === name)) throwBadRequestError('هذا الاسم مستخدم من قبل')
  if (updatedP !== null && updatedP?.type) {
    const selectedOne =
      updatedP &&
      updatedP.type &&
      updatedP.type.find((e : any) => e._id.toString() === typeId);
    if (!selectedOne) throwNotFoundError("لا يوجد نوع من هذا المنتج متوافق");
    if (quantity + selectedOne?.quantity < 0)
      throwBadRequestError("الكمية الموجودة غير متاحة");

    if (!name) {
      const updatedProduct = await ProductModel.findOneAndUpdate(
        { _id: productId, "type._id": typeId },
        { $inc: { "type.$.quantity": quantity, quantity: quantity } },
        { new: true, runValidators: true, context: "query" }
      );
      res.status(200).json({ data: updatedProduct });
    }
    if (!quantity) {
      const updatedProduct = await ProductModel.findOneAndUpdate(
        { _id: productId, "type._id": typeId },
        { $set: { "type.$.name": name } },
        { new: true, runValidators: true, context: "query" }
      );
      res.status(200).json({ data: updatedProduct });
    }
    if (name && quantity) {
      const updatedProduct = await ProductModel.findOneAndUpdate(
        { _id: productId, "type._id": typeId },
        {
          $set: { "type.$.name": name },
          $inc: { "type.$.quantity": quantity, quantity: quantity },
        },
        { new: true, runValidators: true }
      );
      res.status(200).json({ data: updatedProduct });
    }
  }
};

export const removeTypeFromProduct = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: productId },
    body: { typeId },
  } = req;
  // const isHaveAuth = permissions.update.includes("product");
  // if (!isHaveAuth || !permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لتعديل منتج");
  // if (!typeId)
  //   throwBadRequestError("لا بد من توافر النوع الذي تريد تعديله", "name");

  const productToRemoveTypeFrom = await ProductModel.findOne({
    _id: productId,
  });

  const selectedOne =
    productToRemoveTypeFrom &&
    productToRemoveTypeFrom.type &&
    productToRemoveTypeFrom.type.find((e :any) => e._id.toString() === typeId);

   if (!selectedOne) throwNotFoundError("لا يوجد نوع من هذا المنتج متوافق");

  const removedType = await ProductModel.findOneAndUpdate(
    { _id: productId, "type._id": typeId },
    { $inc: { quantity: -Number(selectedOne?.quantity)}  , $pull: { type: {_id : typeId} }},
    { new: true, runValidators: true }
  );
  res.status(200).json({ data: removedType });
};


export const addTypeToProduct = async (req: Request, res: Response) => {
  
  const {
    // user: { permissions },
    params: { id: productId },
    body: { typeName , quantity },
  } = req;
 

 
  const newType = {
    _id: new mongoose.Types.ObjectId(),
    name: typeName,
    quantity: Number(quantity),
  };
   
const existingProduct = await ProductModel.findById(productId) 
if(!existingProduct) throwNotFoundError('هذا المنتج غير موجود')
existingProduct?.type?.map((e)=>{
  if(e?.name === typeName) throwBadRequestError('هذا النوع موجود بالفعل')
    return
 })

  const addedType = await ProductModel.findOneAndUpdate(
    { _id: productId },
    { $inc: { quantity: +Number(quantity)}  , $push: { type: newType }},
    { new: true, runValidators: true }
  );
  if(!addedType) throwBadRequestError('خطأ في اضافة النوع')
  res.status(200).json({ data: addedType });
};