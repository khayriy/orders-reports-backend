// last and most important one 
import express from 'express'
import {getOrdersCount , updateOrdersByIds ,runOrders , createNewOrder, updateOrder , getAllPendingOrders, deleteOrder, updateOrderStatus, getAllRunningOrders, getOrderById, getAllOrdersWithFilter, getOrderByName, getOrderByPhone, getAllScheduleOrders } from '../controllers/orderController'
import { getOrdersByIds, updateShipOfOrders } from '../controllers/ordersControllerEid'

const OrderRoute = express.Router()

OrderRoute.route('/').post(createNewOrder)
OrderRoute.route('/order/:id').patch(updateOrder).delete(deleteOrder).get(getOrderById)



OrderRoute.route('/order/phone/:phone').get(getOrderByPhone)
OrderRoute.route('/order/name/:name').get(getOrderByName)

OrderRoute.route('/run').post(runOrders)
OrderRoute.route('/pending').get(getAllPendingOrders)

OrderRoute.route('/scheduling').get(getAllScheduleOrders)

OrderRoute.route('/running').get(getAllRunningOrders)

OrderRoute.route('/status/:id').patch(updateOrderStatus)
OrderRoute.route('/count').get(getOrdersCount) 

OrderRoute.route('/updateMany').post(updateOrdersByIds)

OrderRoute.route('/filter').get(getAllOrdersWithFilter)
// that is new 
OrderRoute.route('/ids').post(getOrdersByIds)
OrderRoute.route('/updateShip').post(updateShipOfOrders)


export default OrderRoute