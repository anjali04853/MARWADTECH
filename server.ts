import app from './app';
import sequelize from './src/config/database';
import { PORT, NODE_ENV } from './src/config/config';

// Sync Database
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync models (uncomment if you want auto-migration, CAUTION in production)
        // await sequelize.sync({ alter: true });

        const server = app.listen(PORT, () => {
            console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
        });

        process.on('unhandledRejection', (err: any) => {
            console.error(`Error: ${err.message}`);
            server.close(() => process.exit(1));
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
