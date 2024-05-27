  const mongoose = require("mongoose");
  require("dotenv").config();
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("DB Connected");
    })
    .catch((err) => {
      console.log("Something went wrong with DB",err);
    });

  const express = require("express");
  const app = new express();
  const nocache = require("nocache");
  app.use("/",nocache());
  const { v4: uuidv4 } = require("uuid");
  const session = require("express-session");

  console.log("Hiii",process.env.ClientID,process.env.ClientSecret)
  app.use(
    session({
      secret: uuidv4(),
      resave: false,
      saveUninitialized: false,
    })
  );

  const port = process.env.PORT || 4000;
  const path  = require("path");

  app.use(express.static('public'));

  app.use(express.json());
  app.use(express.urlencoded({extended:true}));

  const admin_route = require("./routes/adminRoute");
  app.use("/admin",admin_route);

  const user_route = require("./routes/userRoute");
  app.use("/", user_route);


  app.listen(port,()=>{
      console.log(`Server is running at http://localhost:${port}`);
  });
