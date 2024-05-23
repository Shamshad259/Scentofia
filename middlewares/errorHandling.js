const errorHandling = (error,req,res,next)=>{
    res.status(500).render('error',{message:error.message});
}

module.exports = errorHandling;