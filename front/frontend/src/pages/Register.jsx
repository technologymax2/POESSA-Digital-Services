import React,{
 useState,
 useEffect
} from "react";

import axios from "axios";

import CameraCapture
 from "../components/CameraCapture";

import {
 loadModels,
 getFaceDescriptor
}
from "../utils/faceApi";

export default function Register(){

 const [photo,setPhoto]
 = useState("");

 useEffect(()=>{

  loadModels();

 },[]);

 const handleCapture =
 async(image)=>{

  setPhoto(image);

  const img =
   new Image();

  img.src = image;

  img.onload =
   async()=>{

    const descriptor =
      await getFaceDescriptor(
        img
      );

    const payload = {

      pensionerId:
      "POE-001",

      nameAmh:
      "አበበ ከበደ",

      nameEng:
      "Abebe Kebede",

      faydaNumber:
      "123456",

      phone:
      "0911223344",

      age:65,

      gender:"Male",

      pensionAmount:
      5000,

      addressAmh:
      "አዲስ አበባ",

      addressEng:
      "Addis Ababa",

      registeredBy:
      "admin",

      photoUrl:
      image,

      faceDescriptor:
      descriptor
    };

    await axios.post(
      "/api/pensioners",
      payload
    );

    alert(
      "Registered Successfully"
    );
  };
 };

 return(

  <div>

   <h2>
    Register Pensioner
   </h2>

   <CameraCapture
    onCapture={
      handleCapture
    }
   />

   {
    photo &&
    <img
      src={photo}
      width="250"
      alt=""
    />
   }

  </div>
 );
}
