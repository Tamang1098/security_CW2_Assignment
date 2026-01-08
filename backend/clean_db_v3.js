const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const cleanPath = (path) => {
    if (!path || typeof path !== 'string') return path;
    // Remove both http and https localhost URLs, keeping only relative part
    return path.replace('http://localhost:5000', '').replace('https://localhost:5000', '');
};

const cleanDatabase = async () => {
    try {
        const uri = 'mongodb://localhost:27017/footballsuppliesnepal';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        const products = await Product.find();
        for (const product of products) {
            let updated = false;

            const newImage = cleanPath(product.image);
            if (newImage !== product.image) {
                product.image = newImage;
                updated = true;
            }

            if (product.images && product.images.length > 0) {
                const newImages = product.images.map(img => cleanPath(img));
                if (JSON.stringify(newImages) !== JSON.stringify(product.images)) {
                    product.images = newImages;
                    updated = true;
                }
            }

            if (updated) {
                await product.save();
                console.log(`Updated product: ${product.name}`);
            }
        }

        const categories = await Category.find();
        for (const cat of categories) {
            const newImage = cleanPath(cat.image);
            if (newImage !== cat.image) {
                cat.image = newImage;
                await cat.save();
                console.log(`Updated category: ${cat.name}`);
            }
        }

        console.log('Cleaning complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

cleanDatabase();
