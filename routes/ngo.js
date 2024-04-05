    const express = require("express");
    const router = express.Router();
    const middleware = require("../middleware/index.js");
    const User = require("../models/user.js");
    const Food = require("../models/food.js");
    const NGO = require("../models/ngo.js");
    const Donor = require("../models/donor.js");
    const NotificationService = require('../config/notificationService');
    const Notification = require('../models/notification.js'); // Corrected file path



    router.get('/ngo/notification', async (req, res) => {
        try {
            const notifications = await Notification.find({ recipient: req.user._id }).sort({ timestamp: -1 });
            await Notification.updateMany({ recipient: req.user._id }, { $set: { status: 'read' } });
            const unreadCount = await NotificationService.getUnreadNotificationCount(req.user._id);
            console.log("", unreadCount);
            res.render("ngo/notification", { title: "Notifications", notifications: notifications, unreadCount: unreadCount});
    
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get("/ngo/dashboard", middleware.ensureNgoLoggedIn, async (req,res) => {
        const numPendingDonations = await Food.countDocuments({ status: "pending" });
        const numAcceptedDonations = await Food.countDocuments({ ngo: req.user._id,status: "accepted" });
        const numCollectedDonations = await Food.countDocuments({ ngo: req.user._id,status: "collected" });
        res.render("ngo/dashboard", {
            title: "Dashboard",
            numPendingDonations, numAcceptedDonations, numCollectedDonations
        });
    });
    
    router.get("/ngo/donations/pending", middleware.ensureNgoLoggedIn, async (req, res) => {
        try {
            const pendingCollections = await Food.find({ status: "pending" }).populate({
                path: 'donor',
                model: User,
                select: '',
                
            });      
            res.render("ngo/pendingCollections", { title: "Pending Collections", pendingCollections });

        } catch (err) {
            console.log(err);
            req.flash("error", "Some error occurred on the server.")
            res.redirect("back");
        }
    });

    // router.post("/ngo/donations/accept/:donationId", middleware.ensureNgoLoggedIn, async (req,res) => {
    //     try {
    //         // const { senderId, message } = req.body;
    //         const senderId = req.user._id;
    //         const message = "{senderId} accepted your donation with donation id {donationId}"
    //         const donationId = req.params.donationId;
    
    //         // Find the donation by ID
    //         const donation = await Food.findById(donationId);
    
    //         if (!donation) {
    //             return res.status(404).json({ error: 'Donation not found' });
    //         }
    
    //         // Retrieve the donor's ID from the donation object
    //         const donorId = donation.donor;
    //         console.log(senderId,donorId,message);
    //         // Send notification to the donor
    //         const notification = await NotificationService.sendNotification(senderId, donorId, message);  
    
    //         // Update donation status
    //         await Food.findByIdAndUpdate(donationId, { status: "accepted" });
    
    //         req.flash("success", "Donation accepted successfully");
    //         res.redirect(`/ngo/donations/pending`);
    //     } catch(err) {
    //         console.log(err);
    //         req.flash("error", "Some error occurred on the server.")
    //         res.redirect("back");
    //     }
    // });
    
    // router.get("/ngo/donations/accept/:donationId", middleware.ensureNgoLoggedIn, async (req,res) => {
    //     try
    //     {
    //         const donationId = req.params.donationId;
    //         await Food.findByIdAndUpdate(donationId, { status: "accepted" });
    //         req.flash("success", "Donation accepted successfully");
    //         res.redirect(`/ngo/donations/pending`);
    //     }
    //     catch(err)
    //     {
    //         console.log(err);
    //         req.flash("error", "Some error occurred on the server.")
    //         res.redirect("back");
    //     }
    // });

    router.get("/ngo/donations/reject/:donationId", middleware.ensureNgoLoggedIn, async (req,res) => {
        try
        {
            const donationId = req.params.donationId;
            await Food.findByIdAndUpdate(donationId, { status: "rejected" });
            req.flash("success", "Donation rejected successfully");
            res.redirect(`/ngo/donations/pending`);
        }
        catch(err)
        {
            console.log(err);
            req.flash("error", "Some error occurred on the server.")
            res.redirect("back");
        }
    });

    router.get("/ngo/donations/previous", middleware.ensureNgoLoggedIn, async (req, res) => {
        try {
            const previousCollections = await Food.find({ngo: req.user._id,status: "collected" }).populate({
                path: 'donor',
                model: User,
                select: '',
                
            });  
            res.render("ngo/previousCollections", { title: "Previous Collections", previousCollections });
        } catch (err) {
            console.log(err);
            req.flash("error", "Some error occurred on the server.")
            res.redirect("back");
        }
    });


    router.get("/ngo/profile", middleware.ensureNgoLoggedIn, (req,res) => {
        res.render("ngo/profile", { title: "My Profile" });
    });

    router.put("/ngo/profile", middleware.ensureNgoLoggedIn, async (req,res) => {
        try
        {
            const id = req.user._id;
            const updateObj = req.body.ngo;    // updateObj: {firstName, lastName, address, phone}
            await User.findByIdAndUpdate(id, updateObj);
            
            req.flash("success", "Profile updated successfully");
            res.redirect("/ngo/profile");
        }
        catch(err)
        {
            console.log(err);
            req.flash("error", "Some error occurred on the server.")
            res.redirect("back");
        }
    });

    router.get("/ngo/collection/view/:collectionId", middleware.ensureNgoLoggedIn, async (req, res) => {
        try {
            const collectionId = req.params.collectionId;
            const collection = await Food.findById(collectionId).populate({
                path: 'donor',
                model: User,
                select: '',
                
            });
            res.render("ngo/collection", { title: "Collection details", collection });
        } catch (err) {
            console.log(err);
            req.flash("error", "Some error occurred on the server.")
            res.redirect("back");
        }
    });



    router.get("/ngo/collection/collect/:collectionId", middleware.ensureNgoLoggedIn, async (req, res) => {
        try {
            const collectionId = req.params.collectionId;
            const food = await Food.findById(collectionId);
            if (!food) {
                req.flash("error", "Food item not found");
                return res.redirect("back");
            }
            
            food.status = "collected";
            food.collectionTime = Date.now();
            food.ngo = req.user._id; 
            
            await food.save();
            console.log(food)

            const senderId = req.user._id;
            const sender = req.user.organisationName;
            const donorId = food.donor;
            const foodName = food.foodName;
            const message = `${sender} accepted your donation of ${foodName}`;
            const status = "unread"; 
            const timestamp = new Date(); 
            
            const notification = await NotificationService.sendNotification(senderId, donorId, message, status, timestamp);
            console.log(notification);
            req.flash("success", "Donation collected successfully");
            res.redirect(`/ngo/collection/view/${collectionId}`);
            
        } catch (err) {
            console.log(err);
            req.flash("error", "Some error occurred on the server.");
            res.redirect("back");
        }
    });
    
    module.exports = router;
