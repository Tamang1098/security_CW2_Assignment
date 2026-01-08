const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkProduct = async () => {
    try {
        const uri = 'mongodb://localhost:27017/footballsuppliesnepal';
        await mongoose.connect(uri);

        const products = await Product.find({ name: 'sss' });
        if (products.length === 0) {
            console.log('No product found with name "sss"');
            return;
        }

        const p = products[0];
        console.log('--- PRODUCT DIAGNOSTIC ---');
        console.log('Name:', p.name);
        console.log('Main Image Type:', typeof p.image);
        console.log('Main Image Value:', p.image);
        console.log('Images Array length:', p.images ? p.images.length : 0);
        if (p.images) {
            p.images.forEach((img, i) => {
                console.log(`Image[${i}]:`, img);
            });
        }
        console.log('--------------------------');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkProduct();
