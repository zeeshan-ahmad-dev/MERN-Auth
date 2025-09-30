import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    console.log(token)
    if (!token) {
        return res.json({success: false, message: "Not Authorized Login Again"});
    }
    
    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
        
        if (tokenDecode._id) {
            req.userId = tokenDecode._id;
        } else {
            return res.json({ success: false, message: "Not Authorized Login Again"} );
        }

        next();
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export default userAuth;