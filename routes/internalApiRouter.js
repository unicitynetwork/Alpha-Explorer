"use strict";

const debug = require("debug");
const debugLog = debug("btcexp:router");

const express = require('express');
const router = express.Router();
const util = require('util');
const moment = require('moment');
const qrcode = require('qrcode');
const bitcoinjs = require('bitcoinjs-lib');
const sha256 = require("crypto-js/sha256");
const hexEnc = require("crypto-js/enc-hex");
const Decimal = require("decimal.js");
const markdown = require("markdown-it")();
const asyncHandler = require("express-async-handler");

const utils = require('./../app/utils.js');
const coins = require("./../app/coins.js");
const config = require("./../app/config.js");
const coreApi = require("./../app/api/coreApi.js");
const rpcApi = require("./../app/api/rpcApi.js");



router.get("/blocks-by-height/:blockHeights", function(req, res, next) {
	let blockHeightStrs = req.params.blockHeights.split(",");
	
	let blockHeights = [];
	for (let i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlocksByHeight(blockHeights).then(function(result) {
		res.json(result);
	}).catch(next);
});

router.get("/block-headers-by-height/:blockHeights", function(req, res, next) {
	let blockHeightStrs = req.params.blockHeights.split(",");
	
	let blockHeights = [];
	for (let i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlockHeadersByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});

router.get("/block-stats-by-height/:blockHeights", function(req, res, next) {
	let blockHeightStrs = req.params.blockHeights.split(",");
	
	let blockHeights = [];
	for (let i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlocksStatsByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});



router.get("/difficulty-by-height/:blockHeights", asyncHandler(async (req, res, next) => {
	const blockHeights = req.params.blockHeights.split(",").map(x => parseInt(x));

	let results = await coreApi.getDifficultyByBlockHeights(blockHeights);
	
	res.json(results);

	next();
}));



router.get("/raw-tx-with-inputs/:txid", function(req, res, next) {
	let txid = utils.asHash(req.params.txid);

	let promises = [];

	promises.push(coreApi.getRawTransactionsWithInputs([txid]));

	Promise.all(promises).then(function(results) {
		res.json(results);

		next();

	}).catch(function(err) {
		res.json({success:false, error:err});

		next();
	});
});

router.get("/block-tx-summaries/:blockHash/:blockHeight/:txids", function(req, res, next) {
	let blockHash = req.params.blockHash;
	let blockHeight = parseInt(req.params.blockHeight);
	let txids = req.params.txids.split(",").map(utils.asHash);

	let promises = [];

	let results = [];

	promises.push(new Promise(function(resolve, reject) {
		coreApi.buildBlockAnalysisData(blockHeight, blockHash, txids, 0, results, resolve);
	}));

	Promise.all(promises).then(function() {
		res.json(results);

		next();

	}).catch(function(err) {
		res.json({success:false, error:err});

		next();
	});
});

router.get("/utils/:func/:params", function(req, res, next) {
	let func = req.params.func;
	let params = req.params.params;

	let data = null;

	if (func == "formatLargeNumber") {
		if (params.indexOf(",") > -1) {
			let parts = params.split(",");

			data = utils.formatLargeNumber(parseInt(parts[0]), parseInt(parts[1]));

		} else {
			data = utils.formatLargeNumber(parseInt(params));
		}
	} else if (func == "formatCurrencyAmountInSmallestUnits") {
		let parts = params.split(",");

		data = utils.formatCurrencyAmountInSmallestUnits(new Decimal(parts[0]), parseInt(parts[1]));

	} else {
		data = {success:false, error:`Unknown function: ${func}`};
	}

	res.json(data);

	next();
});


module.exports = router;
