const express = require('express');
const router = express.Router();
const { getUploadUrl, registerDocument, getDocuments, getDocumentAnalysis, compareDocuments, explainClause, downloadDocumentReport, getDocumentReport, negotiateDocument, documentActionItems, getAllActionItems } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

router.get('/upload-url', protect, getUploadUrl);
router.post('/', protect, registerDocument);
router.get('/', protect, cache(600), getDocuments);
router.get('/all/actions', protect, getAllActionItems);
router.get('/:id/analysis', protect, cache(600), getDocumentAnalysis);
router.get('/compare/:idA/:idB', protect, compareDocuments);
router.post('/explain-clause', protect, explainClause);
router.post('/:id/report', protect, downloadDocumentReport);
router.get('/:id/report', protect, getDocumentReport);
router.get('/:id/negotiate', protect, negotiateDocument);
router.get('/:id/actions', protect, documentActionItems);

module.exports = router;
