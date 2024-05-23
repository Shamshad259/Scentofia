const Product_Offer = require("../model/productOfferModel");
const Category_Offer = require("../model/categoryOfferModel");
const Product = require("../model/productModel");
const Catergory = require("../model/categoryModel");


const loadProductOffer = async (req,res,next)=>{
    try {
        const products = await Product.find({isDeleted:false});
        const category = await Catergory.find({isDeleted:false});
        const productOffers = await Product_Offer.find().populate("productId");
        res.render("product-offer",{products:products,category:category,productOffers:productOffers});
    } catch (error) {
        next(error);
    }
}

const loadCategoryOffer = async (req,res,next)=>{
    try {
        const products = await Product.find({isDeleted:false});
        const category = await Catergory.find({isDeleted:false});
        const categoryOffers = await Category_Offer.find().populate("categoryId");
        res.render("category-offer",{products:products,category:category,categoryOffers:categoryOffers});
    } catch (error) {
        next(error);
    }
}


const addCategoryOffer = async(req,res,next)=>{
    try {
        const {categoryName , offerPercentage,expiryDate} =req.body;
        let categoryOffer = await Category_Offer.findOne({categoryId:categoryName})
        if(!categoryOffer){
            categoryOffer = await new Category_Offer({
                categoryId:categoryName,
                offerPercentage:offerPercentage,
                expiryDate:expiryDate,
            })
        } else {
            categoryOffer.offerPercentage = offerPercentage;
            categoryOffer.expiryDate = expiryDate;
        }
        categoryOffer.save();
        res.redirect("/admin/categoryOffer")


    } catch (error) {
        next(error);
    }
}


const removeCategoryOffer = async (req,res,next)=>{
    try {
        const offer = await Category_Offer.deleteOne({_id:req.query.id});
        res.json({success:true});
    } catch (error) {
        next(error);
    }
}


const addProductOffer = async(req,res,next)=>{
    try {
        const {productId , offerPercentage,expiryDate} =req.body;
        let productOffer = await Product_Offer.findOne({productId:productId})
        if(!productOffer){
            productOffer = await new Product_Offer({
                productId:productId,
                offerPercentage:offerPercentage,
                expiryDate:expiryDate,
            })
        } else {
            productOffer.offerPercentage = offerPercentage;
            productOffer.expiryDate = expiryDate;
        }
        productOffer.save();
        res.redirect("/admin/productOffer")


    } catch (error) {
        next(error);
    }
}

const removeProductOffer = async (req,res,next)=>{
    try {
        const offer = await Product_Offer.deleteOne({_id:req.query.id});
        res.json({success:true});
    } catch (error) {
        next(error);
    }
}


module.exports = {
  loadProductOffer,
  loadCategoryOffer,
  addCategoryOffer,
  removeCategoryOffer,
  addProductOffer,
  removeProductOffer
};
