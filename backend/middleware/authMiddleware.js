import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access denied ❌ No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👇 Make sure the payload has 'id'
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(403).json({ message: "Invalid or expired token ❌" });
  }
};
