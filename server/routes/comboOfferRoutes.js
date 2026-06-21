const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getComboOffers, getComboOfferById, createComboOffer,
  updateComboOffer, deleteComboOffer, applyComboOffers,
} = require('../controllers/comboOfferController');

router.get('/',         getComboOffers);                       // public (active only)
router.post('/apply',   applyComboOffers);                     // public — cart check
router.get('/:id',      getComboOfferById);                    // public
router.post('/',        protect, admin, createComboOffer);     // admin
router.put('/:id',      protect, admin, updateComboOffer);     // admin
router.delete('/:id',   protect, admin, deleteComboOffer);     // admin

module.exports = router;