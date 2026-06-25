const express = require("express");
const router = express.Router();

const UserPensioner =
 require("../models/UserPensioner");

router.post(
 "/verify",
 async (req,res)=>{

  try{

   const {
    faydaNumber,
    liveDescriptor
   } = req.body;

   const pensioner =
    await UserPensioner.findOne({
      faydaNumber
    });

   if(!pensioner){

    return res.status(404)
      .json({
        success:false,
        message:"Not Found"
      });
   }

   let sum = 0;

   for(
     let i=0;
     i<liveDescriptor.length;
     i++
   ){

     sum += Math.pow(
       liveDescriptor[i]
       -
       pensioner.faceDescriptor[i],
       2
     );
   }

   const distance =
     Math.sqrt(sum);

   const similarity =
     Math.round(
      Math.max(
       0,
       (1-distance)*100
      )
     );

   const verified =
     similarity >= 85;

   res.json({
     success:true,
     similarity,
     verified
   });

  }catch(err){

   res.status(500).json({
    success:false,
    message:err.message
   });
  }
 });

module.exports = router;
