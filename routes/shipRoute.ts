import express from 'express'
import { createNewShip, deleteShip, getAllShips, updateShip , getSingleShip, getSingleShipOrdersByDate} from '../controllers/shipController'

const ShipRoute = express.Router()

ShipRoute.route('/').post(createNewShip).get(getAllShips)

ShipRoute.route('/:id').patch(updateShip).delete(deleteShip).get(getSingleShip)
ShipRoute.route('/date/:id/:date').get(getSingleShipOrdersByDate)


export default ShipRoute