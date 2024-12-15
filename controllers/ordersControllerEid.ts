import throwBadRequestError from "../errors/BadRequestError";
import OrderModel from "../models/orderModel";
import { Request, Response } from "express";

export const getOrdersByIds = async (req: Request, res: Response) => {
    
    if (!req.body.orders) throwBadRequestError("لابد من توافر الطلبات لعرضها");
  
    const matchingOrdersByIds = await OrderModel.find({
      id: { $in: req.body.orders },
      
    }).populate("products.product")
    .populate("shipId");
    const processedOrders = matchingOrdersByIds.map((order) => ({
        _id: order._id,
        id: order.id,
        createdAt: order.createdAt,
        updates: order.updates,
        status: order.status,
        price: order.price,
        name: order.name,
        phone: order.phone,
        anotherPhone: order.anotherPhone,
        address: order.address,
        country: order.country,
        notes: order.notes,
        ship: order.shipId,
        products: order.products.map((product) => ({
          product: {
            _id: (product.product as any)._id, // Cast to any to access _id
            name: (product.product as any).name,
            quantity: product.quantity,
            type: (product.product as any).type.find(
              (type: any) => type._id.toString() === product.type
            ), // Manual selection
          },
          // ... other fields
        })),
      }));
    res.status(200).json({ data: processedOrders });
};


export const updateShipOfOrders = async (req: Request, res: Response) => {
  if (!req.body.orders) throwBadRequestError("لابد من توافر الطلبات لتعديلها");
  if (!req.body.ship_id)
    throwBadRequestError('لا بد من اختيار مسئول الشحن');

  const ordersToUpdate = await OrderModel.find({
    id: { $in: req.body.orders },
    
  });

  
  
  if (ordersToUpdate.length !== req.body.orders.length) {
    const foundOrderIds = ordersToUpdate.map(order => `${order.id}`);
    const missingOrderIds = req.body.orders.filter((orderId : string) => !foundOrderIds.includes(orderId));
    
    return res.status(400).json({ error : ' هذه الطلبات غير مسجلة' , data: missingOrderIds.map((e : string)=>{
      return {id : e , status : 'غير مسجل' }
    }) });
  }


 


  let pendingOrders = []
 
    for (const orderToUpdate of ordersToUpdate) {
      console.log(orderToUpdate)
      if(req.body.ship_id === orderToUpdate?.shipId?.toString()) {
        console.log(req.body.ship_id , orderToUpdate.shipId.toString())
        pendingOrders.push({...orderToUpdate.toObject() , message : `نفس مسئول الشحن الحالي`})
      }
      if(orderToUpdate.status !== 'معلق' && orderToUpdate.status !== 'قيد التشغيل') {
       
        
          pendingOrders.push({...orderToUpdate.toObject() , message : `هذا الطلب حالته نهائية`})
      
        
      }
    }

    if(pendingOrders.length > 0) {
      return res.status(400).json({ error : 'راجع هذه الطلبات اولا' , data: pendingOrders });
    }
  
  
  
  // Iterate over each order to update
  for (const orderToUpdate of ordersToUpdate) {
    // Update the order
    await OrderModel.updateOne(
      { id: orderToUpdate.id },
      {
        $set: {
          shipId: req.body.ship_id,
          status : 'معلق'
        },
        $push: {
          updates: {
            info: 'تم تغيير مسئول الشحن' ,
            timestamp: new Date(),
          },
        },
      }
    );

   
  }

  res.status(200).json({ message: "تم تغيير مسئول الشحن بنجاح" });
};
