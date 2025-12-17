import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"

  if (!authHeader) {
    return res.status(401).json({ message: "missing token" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "invalid auth header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacher = decoded; // { id, role, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid token" });
  }
}
