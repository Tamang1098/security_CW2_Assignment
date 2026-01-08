const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const cleanDatabase = async () => {
    try {
        const uri = 'mongodb://localhost:27017/footballsuppliesnepal';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for cleaning.');

        const products = await Product.find();
        console.log(`Found ${products.length} products to check.`);

        for (const product of products) {
            let updated = false;

            // Clean main image
            if (product.image && product.image.includes('http://localhost:5000')) {
                product.image = product.image.replace('http://localhost:5000', '');
                updated = true;
            }
            if (product.image && product.image.includes('https://localhost:5000')) {
                product.image = product.image.replace('https://localhost:5000', '');
                updated = true;
            }

            // Clean additional images
            if (product.images && product.images.length > 0) {
                product.images = product.images.map(img => {
                    if (img.includes('localhost:5000')) {
                        updated = true;
                        return img.replace('http://localhost:5000', '').replace('https://localhost:5000', '');
                    }
                    return img;
                });
            }

            if (updated) {
                await product.save();
                console.log(`Updated product: ${product.name}`);
            }
        }

        // Clean categories
        const categories = await Category.find();
        console.log(`Found ${categories.length} categories to check.`);

        for (const category of categories) {
            if (category.image && category.image.includes('localhost:5000')) {
                category.image = category.image.replace('http://localhost:5000', '').replace('https://localhost:5000', '');
                await category.save();
                console.log(`Updated category: ${category.name}`);
            }
        }

        console.log('Database cleaning complete.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

cleanDatabase();
