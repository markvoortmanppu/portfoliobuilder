// Copyright (c) Mark Voortman - mark@voortman.name. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var express = require("express");
var router = express.Router();
var authHelper = require("../helpers/auth");

/* GET portfolio page. */
router.get("/", async function(req, res, next) {
  let parms = { title: "Portfolio", active: { portfolio: true } };

  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;
  const userEmail = req.cookies.graph_user_email;
  const userAdmin = req.cookies.graph_user_admin;

  if (accessToken && userName && userEmail) {
    parms.user = userName;
    parms.email = userEmail;
    parms.admin = userAdmin;
    //parms.debug = `User: ${userName}\nAccess Token: ${accessToken}`;
  } else {
    parms.signInUrl = authHelper.getAuthUrl();
    //parms.debug = parms.signInUrl;
  }

  res.render("portfolio", parms);
});

module.exports = router;
