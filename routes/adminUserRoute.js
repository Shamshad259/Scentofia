const express = require("express");
const admin_user_route = express();
const adminUserController = require("../controllers/adminUserController");

admin_user_route.set("view engine", "ejs");
admin_user_route.set("views", "./views/admin");

admin_user_route.get("/", adminUserController.loadUsers);
admin_user_route.get("/blockUser", adminUserController.blockUser);
admin_user_route.get("/unblockUser", adminUserController.unblockUser);
admin_user_route.get("/blockedUsers",adminUserController.loadBlockedUsers)

module.exports = admin_user_route;
