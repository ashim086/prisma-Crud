import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
import crypto from "crypto";
dotenv.config();

const private_key = process.env.JWT_PRIVATE_KEY || ''
const expiresIn = process.env.JWT_EXPIRES_IN ?? "15m"
// const expiresIn = "15m"


export const generateToken = (payload: any) => {

    const token = jwt.sign(payload, private_key as string, { expiresIn: expiresIn as any })

    return token
}

export const decode = (token: string): jwt.JwtPayload => {

    const decode = jwt.verify(token, private_key)

    return decode as JwtPayload
}


export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};