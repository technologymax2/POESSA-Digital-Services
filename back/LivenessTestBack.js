// routes/pensionerRoutes.js (የBackend ክፍል)
const express = require('express');
const router = express.Router();
const Pensioner = require('../models/Pensioner'); // የእርስዎ የሞዴል ፋይል

// 1. የህይወት ማረጋገጫ ከተጠናቀቀ በኋላ ውጤቱን መቀበል
router.post('/verify-success', async (req, res) => {
    const { faydaNumber, status } = req.body;

    try {
        // የጡረተኛውን መረጃ ማግኘት እና ማዘመን
        const updatedPensioner = await Pensioner.findOneAndUpdate(
            { faydaNumber: faydaNumber },
            { 
                $set: { 
                    lastVerifiedDate: new Date(),
                    verificationStatus: status, // 'Verified'
                    isAlive: true
                } 
            },
            { new: true }
        );

        if (!updatedPensioner) {
            return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም" });
        }

        console.log(`ጡረተኛው ${faydaNumber} በተሳካ ሁኔታ ተረጋግጧል`);
        res.json({ success: true, message: "የህይወት ማረጋገጫ ተመዝግቧል" });

    } catch (err) {
        console.error("Verification Update Error:", err);
        res.status(500).json({ success: false, message: "ሰርቨር ስህተት ተፈጥሯል" });
    }
});

// 2. የ OTP ማረጋገጫ (VerificationCode.js የሚጠራው)
router.post('/verify-otp', async (req, res) => {
    const { faydaNumber, code } = req.body;

    try {
        const pensioner = await Pensioner.findOne({ faydaNumber });
        
        // የOTP ኮድ ማመሳከር (ከዳታቤዝ ጋር)
        if (pensioner && pensioner.otp === code) {
            // ጊዜው ያለፈበት መሆኑን ማረጋገጥ ይቻላል
            res.json({ success: true, message: "ኮድ ትክክል ነው" });
        } else {
            res.status(400).json({ success: false, message: "የተሳሳተ ኮድ" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "ስህተት ተፈጥሯል" });
    }
});

module.exports = router;
