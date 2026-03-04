import bcrypt from 'bcryptjs'

export const hashPassord = async (password: string) => {

    try {

        const salt = await bcrypt.genSalt(6)
        const hashed = await bcrypt.hash(password, salt)

        return hashed

    } catch (error) {
        throw error
    }
}


export const comparePassword = async (password: string, hashPassord: string) => {

    try {

        const compare = await bcrypt.compare(password, hashPassord)

        return compare

    } catch (error) {
        throw error
    }

}