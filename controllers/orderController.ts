/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import throwBadRequestError from "../errors/BadRequestError";
import OrderModel from "../models/orderModel";
import ProductModel from "../models/productModel";
import throwNotFoundError from "../errors/NotFoundError";
interface ProductInterface {
  product: string;
  quantity: number;
  type?: string;
}
export const createNewOrder = async (req: Request, res: Response) => {
  try {
    const { products, shipId, address, country, name, phone, price } = req.body;

    if (!products || products.length === 0) {
      throwBadRequestError("لابد من توافر المنتجات");
    }

    // Check if all products exist
    const productIds: any = products.map((e: ProductInterface) => e.product);
    const isProductsExist = await ProductModel.find({
      _id: { $in: productIds },
    });

    if (isProductsExist.length === 0 || !isProductsExist)
      throwBadRequestError("يوجد منتجات غير موجودة");

    let isError = "";

    // Use Promise.all to handle async operations
    await Promise.all(
      products.map(async (e: ProductInterface) => {
        const product = await ProductModel.findOne({ _id: e.product });
        if (!product) {
          isError = `يوجد منتج غير متاح`;
        } else if (product?.type?.length !== 0) {
          if (!e.type) {
            isError = `لا بد من توافر النوع "${product.name}"`;
          } else {
            const isTypeExist = await ProductModel.findOne({
              _id: e.product,
              "type._id": e.type,
            });

            if (!isTypeExist) {
              isError = `يوجد نوع غير متوافر في "${product.name}"`;
            } else {
              const isQuantityOfTypeAvaliable = isTypeExist?.type?.find(
                (item) => item._id.toString() == e.type
              );
              if (
                isQuantityOfTypeAvaliable &&
                isQuantityOfTypeAvaliable.quantity - e.quantity < 0
              ) {
                isError = `كمية ال ${isQuantityOfTypeAvaliable.name} غير متاحة متاح فقط ${isQuantityOfTypeAvaliable.quantity}`;
              }
            }
          }
        } else {
          if (e.type) {
            isError = `${product.name} لا يحتوي علي انواع داخلية`;
          }
          console.log(e, product);
          if (product.quantity - e.quantity < 0) {
            isError = `الكمية المطلوبة ل ${product.name} غير متاحة متاح فقط ${product.quantity}`;
          }
        }
      })
    );

    if (isError !== "") {
      throwBadRequestError(isError);
    }

    if (!name) throwBadRequestError("لابد من توافر اسم العميل");
    if (!phone) throwBadRequestError("لابد من توافر رقم العميل");
    if (!price) throwBadRequestError("لابد من توافر سعر الطلب");
    if (!country) throwBadRequestError("لابد من اختيار المحافظة / المركز");
    if (!address) throwBadRequestError("لابد من توافر العنوان التفصيلي");
    if (!shipId) throwBadRequestError("لابد من توافر مسئول الشحن");
    // all incoming data is right itis time to remove the quantity

    const data = { ...req.body, status: "معلق" };
    const newOrder = await OrderModel.create(data);

    let isErrorInQuantity = "";
    await Promise.all(
      products.map(async (e: ProductInterface) => {
        const product = await ProductModel.findOne({ _id: e.product });
        if (!product) {
          isErrorInQuantity = "لابد من توافر المنتج";
        } else {
          if (product.type && product?.type?.length > 0) {
            await ProductModel.findOneAndUpdate(
              { _id: e.product, "type._id": e.type },
              {
                $inc: { "type.$.quantity": -e.quantity, quantity: -e.quantity },
              },
              { new: true, runValidators: true }
            );
          } else {
            await ProductModel.findOneAndUpdate(
              { _id: e.product },
              {
                $inc: { quantity: -e.quantity },
              },
              { new: true, runValidators: true }
            );
          }
        }
      })
    );
    console.log(isErrorInQuantity);

    res.status(201).json({ data: newOrder });
  } catch (error: any) {
    // Handle errors here, e.g., return a 400 response with the error message.
    res.status(400).json({ error: error.message });
  }
};
export const getAllPendingOrders = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");
 const currentDate  = new Date()
  const pendingOrders = await OrderModel.find({ status: "معلق"
   , createdAt: { $lte: currentDate },
   })
    .populate("products.product")
    .populate("shipId");
  // Manually select the desired type based on products.type
  const processedOrders = pendingOrders.map((order) => ({
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

export const getAllScheduleOrders = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");
  const currentDate  = new Date()
  const pendingOrders = await OrderModel.find({ status: "معلق"
   , createdAt: { $gte: currentDate },
   })
    .populate("products.product")
    .populate("shipId");
  // Manually select the desired type based on products.type
  const processedOrders = pendingOrders.map((order) => ({
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
export const getOrderById = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");

  if (!req.params.id) throwBadRequestError("لابد من توافر رقم الطلب");
  const singleOrder = await OrderModel.find({ id: req.params.id })
    .populate("products.product")
    .populate("shipId");

  if (!singleOrder) throwNotFoundError("هذا الطلب غير موجود");
  // Manually select the desired type based on products.type
  const processedOrders = singleOrder.map((order) => ({
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

  res.status(200).json({ data: processedOrders[0] });
};

export const getOrderByPhone = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");

  if (!req.params.phone) throwBadRequestError("لابد من توافر رقم الطلب");
  const singleOrder = await OrderModel.find({ phone : req.params.phone })
    .populate("products.product")
    .populate("shipId");

  if (!singleOrder) throwNotFoundError("هذا الطلب غير موجود");
  // Manually select the desired type based on products.type
  const processedOrders = singleOrder.map((order) => ({
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
export const getOrderByName = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");

  if (!req.params.name) throwBadRequestError("لابد من توافر رقم الطلب");
  const singleOrder = await OrderModel.find({ name : req.params.name })
    .populate("products.product")
    .populate("shipId");

  if (!singleOrder) throwNotFoundError("هذا الطلب غير موجود");
  // Manually select the desired type based on products.type
  const processedOrders = singleOrder.map((order) => ({
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
export const getAllRunningOrders = async (req: Request, res: Response) => {
  // const { permissions } = req.user;
  // const isHaveAuth = permissions.view.includes("order");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لتصفح الطلبات");

  const runningOrders = await OrderModel.find({ status: "قيد التشغيل" })
    .populate("products.product")
    .populate("shipId");

  // Manually select the desired type based on products.type
  const processedOrders = runningOrders.map((order) => ({
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

export const deleteOrder = async (req: Request, res: Response) => {
  const {
    // user: { permissions },
    params: { id: orderId },
  } = req;
  // const isHaveAuth = permissions?.delete?.includes("ship");
  // if (!isHaveAuth) throwForbiddnError("ليس لديك الصلاحية لحذف مسئول شحن");
  const order: any = await OrderModel.findOneAndDelete({
    _id: orderId,
    status: "معلق",
  });

  if (!order) {
    throwNotFoundError("الطلب غير موجود أو لا يمكن حذفه");
  }

  // Retrieve the products from the order
  if (order && order.products) {
    const products = order.products || [];
    for (const product of products) {
      const existingProduct = await ProductModel.findById(product.product);

      if (existingProduct) {
        existingProduct.quantity += product.quantity;

        if (product.type) {
          // Check if the product has types
          if (existingProduct.type && existingProduct.type.length > 0) {
            const productTypeIndex = existingProduct.type.findIndex((t: any) =>
              t.equals(product.type)
            );

            if (
              productTypeIndex !== -1 &&
              existingProduct.type &&
              existingProduct.type[productTypeIndex]
            ) {
              existingProduct.type[productTypeIndex].quantity +=
                product.quantity;
            } else {
              const errorMessage = ` خطأ في تحديث كمية نوع المنتج: ${product.type}`;
              console.error(errorMessage);
              throwBadRequestError(errorMessage);
            }
          }
        }

        await existingProduct.save();
      }
    }
  }
  res.status(200).json({ data: order });
};
export const updateOrder = async (req: Request, res: Response) => {
  const {
    params: { id: orderId },
  } = req;
  const existingOrder = await OrderModel.findById(orderId);
  if (!existingOrder) {
    throwNotFoundError("لايوجد طلب متوافق");
  }
  if (existingOrder && existingOrder.status !== "معلق") {
    throwBadRequestError("هذا الطلب خرج بالفعل لا يمكن تعديله");
  }
  if (
    req.body &&
    req.body.status !== "قيد التشغيل" &&
    req.body.status !== "معلق"
  ) {
    throwBadRequestError(
      "لا يمكن التغير في تعديل الطلب بالمنتجات بحالة غير قيد التشغيل"
    );
  }
  const productDetails = req.body.products;

  if (!productDetails || productDetails.length === 0) {
    throwBadRequestError("لابد من توافر المنتجات");
  }

 
  if (existingOrder && existingOrder.products) {
    for (const existingProduct of existingOrder.products) {
      const matchingProductIndex = productDetails.findIndex(
        (orderProduct: any) =>
          existingProduct.product.equals(orderProduct.product) &&
          (!orderProduct.type ||
            hasMatchingType(existingProduct.type, orderProduct.type))
      );
      if (matchingProductIndex === -1) {
        await handleRemovedProduct(existingProduct);
        existingOrder.products = existingOrder.products.filter(
          (p) => !p.product.equals(existingProduct.product)
        );
      } else {
        const existingQuantity = existingProduct.quantity || 0;
        const newQuantity = productDetails[matchingProductIndex].quantity || 0;

        // Update the product quantity in the database if it's different
        if (existingQuantity !== newQuantity) {
          const quantityDifference = existingQuantity - newQuantity;
          
          const isQuantityAvailable = await updateProductQuantity(
            existingProduct.product,
            existingProduct.type,
            quantityDifference
          );

          if (isQuantityAvailable) {
            // Update product quantity in the order
            existingProduct.quantity = newQuantity;
          } else {
            // Handle the case where the quantity is not available
            // This could involve returning an error or notifying the user
            throwBadRequestError(`الكمية غير متاحة ل ${existingProduct.type}`);
          }

          // Update product in the database
        }
      }
    }
  }

  for (const orderProduct of productDetails) {
    const existingProductIndex = existingOrder?.products?.findIndex(
      (p) =>
        p.product.equals(orderProduct.product) &&
        (!orderProduct.type || hasMatchingType(p.type, orderProduct.type))
    );

    if (existingProductIndex !== -1) {
      updateExistingProduct(
        existingOrder?.products[Number(existingProductIndex)],
        orderProduct
      );
    } else {
      await handleNewProduct(orderProduct, existingOrder);
    }
  }

  // Update the order
  const updatedOrder = await OrderModel.findOneAndUpdate(
    { _id: orderId },
    {
      $set: {
        ...req.body,
        products: existingOrder?.products,
      },
    },
    { new: true, runValidators: true }
  );

  if (updatedOrder) {
    if(updatedOrder?.shipId?.toString() !== existingOrder?.shipId.toString()) {
      updatedOrder.updates.push({
        info: 'تم تغيير مسئول الشحن' ,
        timestamp: new Date(),
      });
    }
    if(req.body.status) {
      if (req.body.status === "قيد التشغيل") {
        updatedOrder.updates.push({
          info: "تم التشغيل",
          timestamp: new Date(),
        });
        if (req.body.status === "معلق") {
          updatedOrder.updates.push({
            info: "تم التعليق",
            timestamp: new Date(),
          });
    }
   
    }
    else {
      updatedOrder.updates.push({
        info: "تم تعديل معلومات الطلب",
        timestamp: new Date(),
      }); 
      
    }
    await updatedOrder.save();
    return res.json({ data: updatedOrder });
  } else {
    throwBadRequestError("خطأ في تعديل المنتجات في الاوردر");
  }
}
};
async function handleRemovedProduct(existingProduct: any) {
  const removedProduct: any = await ProductModel.findById(
    existingProduct.product
  );

  if (removedProduct) {
    removedProduct.quantity += existingProduct.quantity;

    if (existingProduct.type) {
      const productTypeIndex = removedProduct?.type?.findIndex((t: any) =>
        t.equals(existingProduct.type)
      );

      if (productTypeIndex !== -1) {
        if (
          removedProduct &&
          removedProduct?.type &&
          removedProduct.type[productTypeIndex]
        ) {
          removedProduct.type[productTypeIndex].quantity +=
            existingProduct.quantity;
        } else {
          throwBadRequestError("خطا ف بعض انواع المنتجات");
        }
      }
    }

    await removedProduct.save();
  }
}
function updateExistingProduct(existingProduct: any, orderProduct: any) {
  if (orderProduct.type) {
    existingProduct.type = orderProduct.type;
  }
  if (orderProduct.quantity) {
    existingProduct.quantity = orderProduct.quantity;
  }
}
async function handleNewProduct(orderProduct: any, existingOrder: any) {
  const newProduct = await ProductModel.findById(orderProduct.product);

  if (newProduct) {
    const remainingQuantity = newProduct.quantity - orderProduct.quantity;

    if (remainingQuantity >= 0) {
      newProduct.quantity = remainingQuantity;

      if (orderProduct.type && newProduct.type) {
        const productTypeIndex = newProduct.type.findIndex((t: any) =>
          t.equals(orderProduct.type)
        );

        if (productTypeIndex !== -1) {
          const remainingTypeQuantity =
            newProduct.type[productTypeIndex].quantity - orderProduct.quantity;

          if (remainingTypeQuantity >= 0) {
            newProduct.type[productTypeIndex].quantity = remainingTypeQuantity;
          } else {
            console.error("Error: Negative type quantity");
            throwBadRequestError("Negative type quantity");
          }
        }
      }

      await newProduct.save();
      existingOrder?.products?.push({
        product: newProduct._id,
        type: orderProduct.type,
        quantity: orderProduct.quantity,
      });
    } else {
      throwBadRequestError("الكمية غير متاحة لبعض المنتجات");
    }
  }
}
function hasMatchingType(typesArray: any, targetType: any) {
  return typesArray && typesArray.includes(targetType);
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  const {
    params: { id: orderId },
  } = req;
  const newStatus = req.body.status;

  // Find the order by ID
  const existingOrder = await OrderModel.findById(orderId);
  if(existingOrder?.status !== 'قيد التشغيل' && existingOrder?.status !== 'معلق') {
    throwBadRequestError('هذا الطلب بحاله نهائية')
  }

  if(req?.body?.status === existingOrder?.status) {
    throwBadRequestError('لايمكن التغير لنفس الحالة')
  }

  const { acceptedProducts } = req.body;
  if (!existingOrder) {
    throwNotFoundError("لا يوجد طلب متطابق");
  } else {
    // Check the new status and perform the necessary operations
    switch (newStatus) {
      case "مرتجع":
        // If the new status is 'مرتجع', update product quantities in the database
        for (const product of existingOrder.products) {
          const dbProduct = await ProductModel.findById(product.product);
          if (dbProduct) {
            // Update the product quantity in the database
            dbProduct.quantity += product.quantity;

            // Update the product type quantity if applicable
            if (product.type && dbProduct.type && dbProduct.type.length > 0) {
              const productTypeIndex = dbProduct.type.findIndex((t) =>
                t.equals(product.type)
              );

              if (productTypeIndex !== -1) {
                // Ensure the type index is valid before updating the quantity
                dbProduct.type[productTypeIndex].quantity += product.quantity;
              } else {
                // If the type is not found, you might want to handle this case according to your requirements
                console.error(
                  `Type ${product.type} not found for product ${dbProduct._id}`
                );
                // Handle the case where the type is not found
                // You might want to throw an error or handle it according to your requirements
              }
            }

            // Save the changes to the product
            await dbProduct.save();
          }
        }

        break;
      case "تسليم جزئي":
        if (!acceptedProducts) {
          throwBadRequestError("لابد من توافر المنتجات التي وصلت للعميل");
        } else {
          // Iterate over each accepted product and update its quantity in the order
          for (const acceptedProduct of acceptedProducts) {
            const orderProduct: any = existingOrder.products.find((product) =>
              product.product.equals(acceptedProduct.product)
            );

            if (orderProduct) {
              // Validate that the accepted quantity is within the available quantity
              if (acceptedProduct.quantity <= orderProduct.quantity) {
                // Calculate the remaining quantity in the orderProduct
                const remainingQuantity =
                  orderProduct.quantity - acceptedProduct.quantity;

                // Set the orderProduct quantity to the accepted quantity
                orderProduct.quantity = acceptedProduct.quantity;

                // Save the changes to the orderProduct
                await existingOrder.save();

                // Find the corresponding dbProduct
                const dbProduct = await ProductModel.findById(
                  orderProduct.product
                );

                if (dbProduct) {
                  // Validate that the accepted quantity is within the available quantity
                  if (acceptedProduct.quantity <= dbProduct.quantity) {
                    // Add the remaining quantity to the dbProduct
                    dbProduct.quantity += remainingQuantity;

                    // If the acceptedProduct has a type, update the type quantity in the dbProduct
                    if (acceptedProduct.type && dbProduct.type) {
                      const productTypeIndex = dbProduct.type.findIndex((t) =>
                        t.equals(acceptedProduct.type)
                      );
                      if (productTypeIndex !== -1) {
                        // Add the remaining quantity to the type quantity in the dbProduct
                        dbProduct.type[productTypeIndex].quantity +=
                          remainingQuantity;
                      }
                    }

                    // Save the changes to the dbProduct
                    await dbProduct.save();
                  } else {
                    // Handle the case where the accepted quantity exceeds the available quantity
                    throwBadRequestError(
                      "الكمية المكتوبة اكبر من الكمية المحددة في الطلب"
                    );
                  }
                }
              } else {
                // Handle the case where the accepted quantity exceeds the available quantity in orderProduct
                throwBadRequestError(
                  "الكمية المكتوبة اكبر من الكمية المحددة في الطلب"
                );
              }
            }
          }

          // Iterate over each product in the existing order
          for (const orderProduct of existingOrder.products) {
            // Check if the product is not present in acceptedProducts
            const remainingProduct = acceptedProducts.find(
              (acceptedProduct: any) =>
                orderProduct.product.equals(acceptedProduct.product)
            );

            if (!remainingProduct) {
              // If the product is not in acceptedProducts, calculate the remaining quantity
              const remainingQuantity = orderProduct.quantity;

              // Set the orderProduct quantity to 0
              orderProduct.quantity = 0;

              // Find the corresponding dbProduct
              const dbProduct = await ProductModel.findById(
                orderProduct.product
              );

              if (dbProduct) {
                // Add the remaining quantity to the dbProduct
                dbProduct.quantity += remainingQuantity;

                // If the orderProduct has a type, update the type quantity in the dbProduct
                if (orderProduct.type && dbProduct.type) {
                  const productTypeIndex = dbProduct.type.findIndex((t) =>
                    t.equals(orderProduct.type)
                  );
                  if (productTypeIndex !== -1) {
                    // Add the remaining quantity to the type quantity in the dbProduct
                    dbProduct.type[productTypeIndex].quantity +=
                      remainingQuantity;
                  }
                }

                // Save the changes to the dbProduct
                await dbProduct.save();
              }
            }
          }
        }
        break;

      default:
        // For other statuses, no specific operations are needed
        break;
    }

    // Update the status in the order

    if (newStatus === "تسليم جزئي") {
      if (!req.body.price) throwBadRequestError("لابد من توافر السعر الجديد");

      if (req.body.notes) {
        existingOrder.notes = req.body.notes;
        existingOrder.price = req.body.price;
      } else {
        existingOrder.price = req.body.price;
      }
    }

    if (newStatus !== "معلق") {
      existingOrder.updates.push({
        info: "تم التسليم",
        timestamp: new Date(),
      });
    }

    // Save the changes to the order
    existingOrder.status = newStatus;
    await existingOrder.save();

    return res.status(200).json({ data: existingOrder });
  }
};
async function updateProductQuantity(
  productId: any,
  typeId: string | null | undefined,
  quantityDifference: number
): Promise<boolean> {
  try {
    // Assuming ProductModel.findById is a method provided by your MongoDB model
    const product = await ProductModel.findById(productId);

    if (!product) {
      // Product not found
      return false;
    }

    // Check if the updated quantity will be non-negative
    if (product.quantity + quantityDifference < 0) {
      // Quantity not available
      return false;
    }

    if (product.type && product.type.length > 0) {
      const typeIndex =
        product.type &&
        product.type.findIndex((type: any) => type._id.equals(typeId));

      if (typeIndex === -1) {
        // Type not found
        return false;
      }

      // Check if the quantity is available for the specific type
      if (product.type[typeIndex].quantity + quantityDifference < 0) {
        // Quantity not available for the type
        console.log("here", product.type[typeIndex].quantity);
        console.log("difference", quantityDifference);
        return false;
      }

      // Update quantity for the specific type
      await ProductModel.updateOne(
        { _id: productId, "type._id": typeId },
        {
          $inc: {
            "type.$.quantity": quantityDifference,
            quantity: quantityDifference,
          },
        }
      );
    } else {
      await ProductModel.findByIdAndUpdate(productId, {
        $inc: { quantity: quantityDifference },
      });
    }

    //Update quantity for the product

    // If there is a type ID, update quantity for the specific type

    return true;
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return false;
  }
}

export const runOrders = async (req: Request, res: Response) => {
  if (!req.body.orders) throwBadRequestError("لابد من توافر الطلبات لتشغيلها");

  const ordersToUpdate = await OrderModel.find({
    _id: { $in: req.body.orders },
    status: "معلق",
  });

  if (ordersToUpdate.length !== req.body.orders.length)
    throwBadRequestError("ليس كل هذه الطلبات معلقة");
  // Update the orders
  const updatedOrders = await OrderModel.updateMany(
    { _id: { $in: req.body.orders } },
    {
      $set: {
        status: "قيد التشغيل",
      },
      $push: {
        updates: {
          info: "تم التشغيل",
          timestamp: new Date(),
        },
      },
    }
  );
  res.status(200).json({ data: updatedOrders });
};

async function getOrderCountByStatus(status: string) {
  try {
    const count = await OrderModel.countDocuments({ status: status }).exec();
    return count;
  } catch (error) {
    // Handle the error appropriately
    throwNotFoundError("لا يوج اعداد بعض الطلبات");
    throw error;
  }
}

export const getOrdersCount = async (req: Request, res: Response) => {
  console.log(req.body);
  const pendingOrdersCount = await getOrderCountByStatus("قيد التشغيل");
  const deliveredOrdersCount = await getOrderCountByStatus("تم التسليم");
  const partialDeliveryOrdersCount = await getOrderCountByStatus("تسليم جزئي");
  const returnedOrdersCount = await getOrderCountByStatus("مرتجع");
  res.status(200).json({
    data: {
      pending: pendingOrdersCount,
      deliver: deliveredOrdersCount,
      part: partialDeliveryOrdersCount,
      back: returnedOrdersCount,
    },
  });
};



export const getAllOrdersWithFilter = async (req: Request, res: Response) => {
  const query: any = {};
  const filter = req.query;

  

  if (filter.startOrderDate && filter.endOrderDate) {
    query.createdAt = {
      $gte: new Date(`${filter.startOrderDate}T00:00:00.000Z`),
      $lte: new Date(`${filter.endOrderDate}T23:59:59.999Z`),
    };
  }
  if (filter.status) {
    query.status = filter.status;
  }
  if (filter.startDeliverDate && filter.endDeliverDate) {
    
    query["updates.timestamp"] = {
      $gte: new Date(`${filter.startDeliverDate}T00:00:00.000Z`),
      $lte: new Date(`${filter.endDeliverDate}T23:59:59.999Z`),
    };
    query["updates.info"] = "تم التسليم";
    
  }
  // if (filter.country && filter.city) {
  //   query.country = { $in: decodeURIComponent(filter.country as string)} };
  //   console.log(query)
  // }

  if (filter.country) {
    const decodedCountry = decodeURIComponent(filter.country as string);
    query.country = decodedCountry;
  }
  
  const allOrdersWithFilter = await OrderModel.find(query).populate("products.product")
  .populate("shipId");
// Manually select the desired type based on products.type
if(allOrdersWithFilter.length > 0) {
  const processedOrders = allOrdersWithFilter.map((order) => ({
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
}
else {
  res.status(200).json({ data: allOrdersWithFilter });
}
};


export const updateOrdersByIds = async (req: Request, res: Response) => {
  if (!req.body.orders) throwBadRequestError("لابد من توافر الطلبات لتعديلها");
  if (!req.body.status)
    throwBadRequestError("لابد من اختيار الحالة المراد التحويل لها");

  const ordersToUpdate = await OrderModel.find({
    id: { $in: req.body.orders },
    
  });

  // if (ordersToUpdate.length !== req.body.orders.length) {
  //   throwBadRequestError(" يوجد طلبات غير موجودة او تم تسليمها بالفعل");
  // }
  
  if (ordersToUpdate.length !== req.body.orders.length) {
    const foundOrderIds = ordersToUpdate.map(order => `${order.id}`);
    const missingOrderIds = req.body.orders.filter((orderId : string) => !foundOrderIds.includes(orderId));
    
    return res.status(400).json({ error : ' هذه الطلبات غير مسجلة' , data: missingOrderIds.map((e : string)=>{
      return {id : e , status : 'غير مسجل' }
    }) });
  }

  let notUpdatedOrders = []
  
  if(req.body.status !== 'معلق') {
    for (const orderToUpdate of ordersToUpdate) {
    

      if(req.body.status === orderToUpdate.status) {
        notUpdatedOrders.push({...orderToUpdate.toObject() , message : 'نفس الحالة المرااد التحويل لها'})
      }
      
      if(orderToUpdate.status !== 'قيد التشغيل'   && req.body.status !== orderToUpdate.status) {
        
         if(orderToUpdate.status === 'معلق') {

         }
         else {
          notUpdatedOrders.push(orderToUpdate)
         }
        
          
       
        
      }
    }
   
    if(notUpdatedOrders.length > 0) {
      return res.status(400).json({ error : 'راجع هذه الطلبات اولا' , data: notUpdatedOrders });
    }
  }
 


  let pendingOrders = []
  if(req.body.status !== 'قيد التشغيل') {
    for (const orderToUpdate of ordersToUpdate) {
      if(req.body.status === orderToUpdate.status) {
        pendingOrders.push({...orderToUpdate.toObject() , message : `نفس الحالة المراد التحويل لها`})
      }
      if(orderToUpdate.status !== 'معلق' && req.body.status !== orderToUpdate.status) {
       
        if(orderToUpdate.status === 'قيد التشغيل') {

        }
        else {
          pendingOrders.push(orderToUpdate)
        }
          
      
        
      }
    }
    console.log(pendingOrders.length)
    if(pendingOrders.length > 0) {
      return res.status(400).json({ error : 'راجع هذه الطلبات اولا' , data: pendingOrders });
    }
  }
  

  
  

  
  // Iterate over each order to update
  for (const orderToUpdate of ordersToUpdate) {
    // Update the order
    await OrderModel.updateOne(
      { id: orderToUpdate.id },
      {
        $set: {
          status: req.body.status,
          notes: req.body.notes,
        },
        $push: {
          updates: {
            info:  req.body.status === 'معلق' ? 'تم التعليق'
            : req.body.status === "قيد التشغيل" ? "تم التشغيل" : "تم التسليم",
            timestamp: new Date(),
          },
        },
      }
    );

    // If the new status is 'مرتجع', retrieve quantity from the database
    if (req.body.status === "مرتجع") {
      for (const product of orderToUpdate.products) {
        const dbProduct = await ProductModel.findById(product.product);

        if (dbProduct) {
          // Update the product quantity in the database
          dbProduct.quantity += product.quantity;

          // Update the product type quantity if applicable
          if (product.type && dbProduct.type && dbProduct.type.length > 0) {
            const productTypeIndex = dbProduct.type.findIndex((t) =>
              t.equals(product.type)
            );

            if (productTypeIndex !== -1) {
              // Ensure the type index is valid before updating the quantity
              dbProduct.type[productTypeIndex].quantity += product.quantity;
            } else {
              console.error(
                `Type ${product.type} not found for product ${dbProduct._id}`
              );
              // Handle the case where the type is not found
              // You might want to throw an error or handle it according to your requirements
            }
          }

          // Save the changes to the product
          await dbProduct.save();
        }
      }
    }
  }

  res.status(200).json({ message: "Orders updated successfully" });
};

// export const updateOrdersByIds = async (req: Request, res: Response) => {
//   if (!req.body.orders) throwBadRequestError("لابد من توافر الطلبات لتعديلها");
//   if (!req.body.status)
//     throwBadRequestError("لابد من اختيار الحالة المراد التحويل لها");

//   const ordersToUpdate = await OrderModel.find({
//     id: { $in: req.body.orders },
//     status: "قيد التشغيل",
//   });

//   if (ordersToUpdate.length !== req.body.orders.length)
//     throwBadRequestError(" يوجد طلبات غير موجودة او تم تسليمها بالفعل");

//   // Iterate over each order to update
//   for (const orderToUpdate of ordersToUpdate) {
//     // Update the order
//     await OrderModel.updateOne(
//       { id: orderToUpdate.id },
//       {
//         $set: {
//           status: req.body.status,
//           notes: req.body.notes,
//         },
//         $push: {
//           updates: {
//             info: "تم التسليم",
//             timestamp: new Date(),
//           },
//         },
//       }
//     );

//     // If the new status is 'مرتجع', retrieve quantity from the database
//     if (req.body.status === "مرتجع") {
//       for (const product of orderToUpdate.products) {
//         const dbProduct = await ProductModel.findById(product.product);

//         if (dbProduct) {
//           // Update the product quantity in the database
//           dbProduct.quantity += product.quantity;

//           // Update the product type quantity if applicable
//           if (product.type && dbProduct.type && dbProduct.type.length > 0) {
//             const productTypeIndex = dbProduct.type.findIndex((t) =>
//               t.equals(product.type)
//             );

//             if (productTypeIndex !== -1) {
//               // Ensure the type index is valid before updating the quantity
//               dbProduct.type[productTypeIndex].quantity += product.quantity;
//             } else {
//               console.error(
//                 `Type ${product.type} not found for product ${dbProduct._id}`
//               );
//               // Handle the case where the type is not found
//               // You might want to throw an error or handle it according to your requirements
//             }
//           }

//           // Save the changes to the product
//           await dbProduct.save();
//         }
//       }
//     }
//   }

//   res.status(200).json({ message: "Orders updated successfully" });
// };






