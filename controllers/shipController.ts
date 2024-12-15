/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import ShipModel from "../models/shipModel";
import throwNotFoundError from "../errors/NotFoundError";
import throwBadRequestError from "../errors/BadRequestError";
import OrderModel from "../models/orderModel";
import { info } from "console";
export const createNewShip = async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.create.includes("ship");
  // if (!isHaveAuth || !permissions)
    // throwForbiddnError("ليس لديك الصلاحية لاضافة مسئول شحن");
  if (!name) throwBadRequestError("لا بد من توافر اسم مسئول الشحن", "name");
  if (!phone)
    throwBadRequestError("لا بد من توافر  رقم هاتف مسئول الشحن", "phone");
  const newShip = await ShipModel.create({ name: name, phone: phone });
  res.status(201).json({ data: newShip });
};

export const getAllShips = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("ship");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح المنتجات");
  const allShips = await ShipModel.find({});
  res.status(200).json({ data: allShips });
};

export const getSingleShip = async(req : Request , res : Response)=>{
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("ship");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح المنتجات");

  const singleShip = await ShipModel.findOne({_id : req.params.id});
  if(!singleShip) throwNotFoundError('لا  يوجد مسئول شحن متوافق')
  const currentDate = new Date()  
  const pendingOrders = await OrderModel.find({ shipId: req.params.id , createdAt: { $lte: currentDate } ,
    $or: [{ status: 'قيد التشغيل' }, { status: 'معلق' }]  }).populate('products.product').populate('shipId').sort({ updatedAt: -1 });
  
  // Manually select the desired type based on products.type
  const processedOrders = pendingOrders.map((order : any)=> ({
    _id: order._id,
    id : order.id , 
    status: order.status,
    price : order.price , 
    name : order.name , 
    phone : order.phone , 
    anotherPhone : order.anotherPhone ,
    address : order.address , 
    country : order.country , 
    createdAt : order.createdAt ,
    notes : order.notes ,
    ship : order.shipId , 
    updates : order.updates , 
    products: order.products.map((product : any) => ({
      product: {
        _id: (product.product as any)._id, // Cast to any to access _id
        name: (product.product as any).name,
        quantity: product.quantity,
        type: (product.product as any).type.find((type: any) => type._id.toString() === product.type) // Manual selection
      },
      // ... other fields
    })),
  }));
  
  res.status(200).json({ data:{ ship :singleShip , orders : processedOrders} });
}
export const updateShip = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: shipId },
    body: { name, phone },
  } = req;
  // const isHaveAuth = permissions.update.includes("ship");
  // if (!isHaveAuth || !permissions)
  //   throwForbiddnError("ليس لديك الصلاحية لتعديل مسئول شحن");
  if (!name && !phone)
    throwBadRequestError("لابد من ادخال البيانات المراد تعديلها");
  const updatedShip = await ShipModel.findOneAndUpdate(
    { _id: shipId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedShip) throwNotFoundError("لا يوجدد مسئول شحن  لتعديله");
  res.status(200).json({ data: updatedShip });
};
export const deleteShip = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: shipId },
  } = req;
  // const isHaveAuth = permissions?.delete?.includes("ship");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لحذف مسئول شحن");
  const ship = await ShipModel.findById({
    _id: shipId,
  });
  if (!ship) throwNotFoundError("لا يوجدد مسئول شحن متوافق لحذفه");
  console.log(ship)
  res.status(200).json({ data: ship });
};


export const getSingleShipOrdersByDate = async(req : Request , res : Response)=>{
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("ship");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح المنتجات");
 
  const dateOfRunning = req.params.date
  
  if(!dateOfRunning) throwBadRequestError('لابد من اختيار اليوم')
 

  const startDate = new Date(`${dateOfRunning}T00:00:00.000Z`);
    const endDate = new Date(`${dateOfRunning}T23:59:59.999Z`);






    if (isNaN(startDate.getTime())) throwBadRequestError('تاريخ غير صالح');



    let query: any = {};
    query["updates"] = {
      $elemMatch: {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
        info: {
          $in: ["تم التشغيل", "تم تغيير مسئول الشحن"]
        }
      },
    };


  const singleShip = await ShipModel.findOne({_id : req.params.id  });
  if(!singleShip) throwNotFoundError('لا  يوجد مسئول شحن متوافق')
  
  const pendingOrders = await OrderModel.find({ shipId: req.params.id , ...query }).populate('products.product').populate('shipId').sort({ updatedAt: -1 });
  
  // Manually select the desired type based on products.type
  const processedOrders = pendingOrders.map((order : any)=> ({
    _id: order._id,
    id : order.id , 
    status: order.status,
    price : order.price , 
    name : order.name , 
    phone : order.phone , 
    anotherPhone : order.anotherPhone ,
    address : order.address , 
    country : order.country , 
    createdAt : order.createdAt ,
    notes : order.notes ,
    ship : order.shipId , 
    updates : order.updates , 
    products: order.products.map((product : any) => ({
      product: {
        _id: (product.product as any)._id, // Cast to any to access _id
        name: (product.product as any).name,
        quantity: product.quantity,
        type: (product.product as any).type.find((type: any) => type._id.toString() === product.type) // Manual selection
      },
      // ... other fields
    })),
  }));
  
  res.status(200).json({ data:{ ship :singleShip , orders : processedOrders} });
}