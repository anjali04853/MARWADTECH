import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/config';

interface UserAttributes {
    id: string;
    fullName: string;
    mobileNumber: string;
    password?: string;
    role: 'user' | 'admin';
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'resetPasswordToken' | 'resetPasswordExpire'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public fullName!: string;
    public mobileNumber!: string;
    public password?: string;
    public role!: 'user' | 'admin';
    public resetPasswordToken?: string;
    public resetPasswordExpire?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Sign JWT and return
    public getSignedJwtToken(): string {
        return jwt.sign({ id: this.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRE as any,
        });
    }

    // Match user entered password to hashed password in database
    public async matchPassword(enteredPassword: string): Promise<boolean> {
        if (!this.password) return false;
        return await bcrypt.compare(enteredPassword, this.password);
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        mobileNumber: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9]{10}$/,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user',
        },
        resetPasswordToken: DataTypes.STRING,
        resetPasswordExpire: DataTypes.DATE,
    },
    {
        sequelize,
        modelName: 'User',
        hooks: {
            beforeSave: async (user: User) => {
                if (user.changed('password') && user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

export default User;
