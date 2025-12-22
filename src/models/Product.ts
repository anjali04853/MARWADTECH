import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
    id: string;
    name: string;
    price: number;
    discount: number;
    stock: number;
    category: 'Electronics' | 'Clothing' | 'Books' | 'Home & Kitchen' | 'Beauty' | 'Sports' | 'Other';
    image: string;
    description?: string;
    status: 'Active' | 'Inactive';
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'discount' | 'image' | 'status' | 'description'> { }

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
    public id!: string;
    public name!: string;
    public price!: number;
    public discount!: number;
    public stock!: number;
    public category!: 'Electronics' | 'Clothing' | 'Books' | 'Home & Kitchen' | 'Beauty' | 'Sports' | 'Other';
    public image!: string;
    public description?: string;
    public status!: 'Active' | 'Inactive';
    public createdBy!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Product.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: { min: 0 },
        },
        discount: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: { min: 0, max: 100 },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 0 },
        },
        category: {
            type: DataTypes.ENUM(
                'Electronics',
                'Clothing',
                'Books',
                'Home & Kitchen',
                'Beauty',
                'Sports',
                'Other'
            ),
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            defaultValue: 'no-photo.jpg',
        },
        description: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active',
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Product',
    }
);

export default Product;
