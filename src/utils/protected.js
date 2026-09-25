const { verify } = require("jsonwebtoken");
const usuario = require("../models/usuario");
const protected = async (req, res, next) => {
  const authorization = req.headers["authorization"];
  if (!authorization)
    return res.status(500).json({
      message: "No token! 🤔",
      type: "error",
    });
  const token = authorization.split(" ")[1];
  let id;
  try {
    id = verify(token, process.env.ACCESS_TOKEN_SECRET).id;
  } catch {
    return res.status(500).json({
      message: "Invalid token! 🤔",
      type: "error",
    });
  }
  if (!id)
    return res.status(500).json({
      message: "Invalid token! 🤔",
      type: "error",
    });
  const usuario = await usuario.findById(id);
  if (!usuario)
    return res.status(500).json({
      message: "usuario doesn't exist! 😢",
      type: "error",
    });
  req.usuario = usuario;
  next();
};
module.exports = { protected };