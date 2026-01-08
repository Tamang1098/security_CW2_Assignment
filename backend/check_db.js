const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkProduct = async () => {
    try {
        const uri = 'mongodb://localhost:27017/footballsuppliesnepal';
        await mongoose.connect(uri);

        const products = await Product.find({ name: 'sss' });
        console.log('Diagnostic result for product "sss":');
        products.forEach(p => {
            console.log('ID:', p._id);
            console.log('Main image path:', JSON.stringify(p.image));
            console.log('Additional images array:', JSON.stringify(p.images));
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkProduct();
