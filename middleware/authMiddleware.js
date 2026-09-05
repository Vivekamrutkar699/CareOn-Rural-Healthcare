const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function requireAuth(req, res, next) {
    const token = req.cookies?.careon_token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            res.clearCookie("careon_token");
            return res.redirect("/login");
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication error:", error);

        res.clearCookie("careon_token");

        return res.redirect("/login");
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).render("errors/403", {
                title: "Access Denied",
                user: req.user,
            });
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
};