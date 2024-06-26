const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    foodName: {
        type: String,
        required: true,
    },
    foodTag: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Donor',
        required:true,
    },
    ngo: {
        type: mongoose.Schema.Types.ObjectId, ref: 'NGO'
    },
    status: {
        type: String,
        enum: ["pending", "accepted","collected"],
        required: true
    },
    donorToNgoMsg: String,
    ngoToDonorMsg: String,
    collectionTime: {
        type: Date,
    },
})

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
