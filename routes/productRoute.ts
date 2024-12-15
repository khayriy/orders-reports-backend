import express from 'express'
import {removeTypeFromProduct ,  updateTypeInProduct, createNewProduct, deleteProduct, getAllProducts, updateProduct, addTypeToProduct } from '../controllers/productController'

const ProductRoute = express.Router()
ProductRoute.route('/').post(createNewProduct).get(getAllProducts)
ProductRoute.route('/:id').patch(updateProduct).delete(deleteProduct)
ProductRoute.route('/add/:id').patch(updateTypeInProduct)
ProductRoute.route('/remove/:id').patch(removeTypeFromProduct)
ProductRoute.route('/addType/:id').patch(addTypeToProduct)

export default ProductRoute