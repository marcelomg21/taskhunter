var express = require('express');
var router = express.Router();

//router.get('/payments', function(req, res) {
//  res.render('payment', { title: 'Pagamentos' });
//});

router.get('/all-payments', function(req, res) {
    res.render('all-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/paid-payments', function(req, res) {
    res.render('paid-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/not-paid-payments', function(req, res) {
    res.render('not-paid-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/transfered-payments', function(req, res) {
    res.render('transfered-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/not-transfered-payments', function(req, res) {
    res.render('not-transfered-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/users', function(req, res) {
    res.render('user', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/', function(req, res) {
    res.render('carousel', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/carousel'
    });
});

router.get('/signin', function(req, res) {
    res.render('signin', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/signin'
    });
});

router.get('/theme', function(req, res) {
    res.render('theme', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

module.exports = router;
