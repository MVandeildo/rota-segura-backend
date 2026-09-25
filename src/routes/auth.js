const express = require("express");
const router = express.Router();
const { hash } = require("bcryptjs");

const usuario = require("../models/usuario");

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email: email });

    if (usuario)
      return res.status(500).json({
        message: "usuario já existe!",
        type: "warning",
      });
    
    const passwordHash = await hash(password, 10);
    const novousuario = new usuario({
      email: email,
      password: passwordHash,
    });

    await novousuario.save();
    res.status(200).json({
      message: "usuario criado com sucesso!",
      type: "success",
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: "Error ao criar usuario!",
      error,
    });
  }
});

const { hash, compare } = require("bcryptjs");

const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("../utils/tokens");

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await usuario.findOne({ email: email });

    if (!usuario)
      return res.status(500).json({
        message: "usuario não existe!",
        type: "error",
      });

      const isMatch = await compare(password, usuario.password);

    if (!isMatch)
      return res.status(500).json({
        message: "Password incorreta!",
        type: "error",
      });

    const accessToken = createAccessToken(usuario._id);
    const refreshToken = createRefreshToken(usuario._id);

    usuario.refreshtoken = refreshToken;
    await usuario.save();

    sendRefreshToken(res, refreshToken);
    sendAccessToken(req, res, accessToken);
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: "Error signing in!",
      error,
    });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refreshtoken");
  return res.json({
    message: "Logged out successfully!",
    type: "success",
  });
});

const { verify } = require("jsonwebtoken");
router.post("/refresh_token", async (req, res) => {
  try {
    const { refreshtoken } = req.cookies;
    if (!refreshtoken)
      return res.status(500).json({
        message: "No refresh token!",
        type: "error",
      });
    
    let id;
    try {
      id = verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET).id;
    } catch (error) {
      return res.status(500).json({
        message: "Invalid refresh token!",
        type: "error",
      });
    }

    if (!id)
      return res.status(500).json({
        message: "Invalid refresh token! 🤔",
        type: "error",
      });

    const usuario = await usuario.findById(id);
    if (!usuario)
      return res.status(500).json({
        message: "usuario doesn't exist! 😢",
        type: "error",
      });
    if (usuario.refreshtoken !== refreshtoken)
      return res.status(500).json({
        message: "Invalid refresh token! 🤔",
        type: "error",
      });
    const accessToken = createAccessToken(usuario._id);
    const refreshToken = createRefreshToken(usuario._id);
    usuario.refreshtoken = refreshToken;
    sendRefreshToken(res, refreshToken);
    return res.json({
      message: "Refreshed successfully! 🤗",
      type: "success",
      accessToken,
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: "Error refreshing token!",
      error,
    });
  }
});

module.exports = router;

const { protected } = require("../utils/protected");
router.get("/protected", protected, async (req, res) => {
  try {
    if (req.usuario)
      return res.json({
        message: "You are logged in! 🤗",
        type: "success",
        usuario: req.usuario,
      });
    return res.status(500).json({
      message: "You are not logged in! 😢",
      type: "error",
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: "Error getting protected route!",
      error,
    });
  }
});