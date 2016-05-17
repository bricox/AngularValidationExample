/*! validatorjs - v2.0.6 -  - 2016-05-14 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Validator = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function AsyncResolvers(onFailedOne, onResolvedAll) {
	this.onResolvedAll = onResolvedAll;
	this.onFailedOne = onFailedOne;
	this.resolvers = {};
	this.resolversCount = 0;
	this.passed = [];
	this.failed = [];
	this.firing = false;
}

AsyncResolvers.prototype = {

	/**
	 * Add resolver
	 *
	 * @param {Rule} rule
	 * @return {integer}
	 */
	add: function(rule) {
		var index = this.resolversCount;
		this.resolvers[index] = rule;
		this.resolversCount++;
		return index;
	},

	/**
	 * Resolve given index
	 *
	 * @param  {integer} index
	 * @return {void}
	 */
	resolve: function(index) {
		var rule = this.resolvers[index];
		if (rule.passes === true) {
			this.passed.push(rule);
		}
		else if (rule.passes === false) {
			this.failed.push(rule);
			this.onFailedOne(rule);
		}

		this.fire();
	},

	/**
	 * Determine if all have been resolved
	 *
	 * @return {boolean}
	 */
	isAllResolved: function() {
		return (this.passed.length + this.failed.length) === this.resolversCount;
	},

	/**
	 * Attempt to fire final all resolved callback if completed
	 *
	 * @return {void}
	 */
	fire: function() {

		if (!this.firing) {
			return;
		}

		if (this.isAllResolved()) {
			this.onResolvedAll(this.failed.length === 0);
		}

	},

	/**
	 * Enable firing
	 *
	 * @return {void}
	 */
	enableFiring: function() {
		this.firing = true;
	}

};

module.exports = AsyncResolvers;

},{}],2:[function(require,module,exports){
var replacements = {

	/**
	 * Between replacement (replaces :min and :max)
	 *
	 * @param  {string} template
	 * @param  {Rule} rule
	 * @return {string}
	 */
	between: function(template, rule) {
		var parameters = rule.getParameters();
		return this._replacePlaceholders(rule, template, { min: parameters[0], max: parameters[1] });
	},

	/**
	 * Required_if replacement.
	 *
	 * @param  {string} template
	 * @param  {Rule} rule
	 * @return {string}
	 */
	required_if: function(template, rule) {
		var parameters = rule.getParameters();
		return this._replacePlaceholders(rule, template, { other: parameters[0], value: parameters[1] });
	}
};

function formatter(attribute)
{
	return attribute.replace(/[_\[]/g, ' ').replace(/]/g, '');
}

module.exports = {
	replacements: replacements,
	formatter: formatter
};

},{}],3:[function(require,module,exports){
var Errors = function() {
	this.errors = {};
};

Errors.prototype = {
	constructor: Errors,

	/**
	 * Add new error message for given attribute
	 *
	 * @param  {string} attribute
	 * @param  {string} message
	 * @return {void}
	 */
	add: function(attribute, message) {
		if (!this.has(attribute)) {
			this.errors[attribute] = [];
		}
		this.errors[attribute].push(message);
	},

	/**
	 * Returns an array of error messages for an attribute, or an empty array
	 * 
	 * @param  {string} attribute A key in the data object being validated
	 * @return {array} An array of error messages
	 */
	get: function(attribute) {
		if (this.has(attribute)) {
			return this.errors[attribute];
		}

		return [];
	},

	/**
	 * Returns the first error message for an attribute, false otherwise
	 * 
	 * @param  {string} attribute A key in the data object being validated
	 * @return {string|false} First error message or false
	 */
	first: function(attribute) {
		if (this.has(attribute)) {
			return this.errors[attribute][0];
		}

		return false;
	},

	/**
	 * Get all error messages from all failing attributes
	 * 
	 * @return {Object} Failed attribute names for keys and an array of messages for values
	 */
	all: function() {
		return this.errors;
	},

	/**
	 * Determine if there are any error messages for an attribute
	 * 
	 * @param  {string}  attribute A key in the data object being validated
	 * @return {boolean}
	 */
	has: function(attribute) {
		if (this.errors.hasOwnProperty(attribute)) {
			return true;
		}

		return false;
	}
};

module.exports = Errors;
},{}],4:[function(require,module,exports){
var Messages = require('./messages');

require('./lang/en');

var container = {

	messages: {},

	/**
	 * Set messages for language
	 *
	 * @param {string} lang
	 * @param {object} rawMessages
	 * @return {void}
	 */
	_set: function(lang, rawMessages) {
		this.messages[lang] = rawMessages;
	},

	/**
	 * Set message for given language's rule.
	 *
	 * @param {string} lang
	 * @param {string} attribute
	 * @param {string|object} message
	 * @return {void}
	 */
	_setRuleMessage: function(lang, attribute, message) {
		this._load(lang);
		if (message === undefined) {
			message = this.messages[lang].def;
		}

		this.messages[lang][attribute] = message;
	},

	/**
	 * Load messages (if not already loaded)
	 *
	 * @param  {string} lang 
	 * @return {void}
	 */
	_load: function(lang) {
		if (!this.messages[lang]) {
			var rawMessages = require('./lang/' + lang);
			this._set(lang, rawMessages);
		}
	},

	/**
	 * Get raw messages for language
	 *
	 * @param  {string} lang
	 * @return {object}
	 */
	_get: function(lang) {
		this._load(lang);
		return this.messages[lang];
	},

	/**
	 * Make messages for given language
	 *
	 * @param  {string} lang
	 * @return {Messages}
	 */
	_make: function(lang) {
		this._load(lang);
		return new Messages(lang, this.messages[lang]);
	}

};

module.exports = container;

},{"./lang/en":5,"./messages":6}],5:[function(require,module,exports){
module.exports = {
	accepted: 'The :attribute must be accepted.',
	alpha: 'The :attribute field must contain only alphabetic characters.',
	alpha_dash: 'The :attribute field may only contain alpha-numeric characters, as well as dashes and underscores.',
	alpha_num: 'The :attribute field must be alphanumeric.',
	between: 'The :attribute field must be between :min and :max.',
	confirmed: 'The :attribute confirmation does not match.',
	email: 'The :attribute format is invalid.',
	def: 'The :attribute attribute has errors.',
	digits: 'The :attribute must be :digits digits.',
	different: 'The :attribute and :different must be different.',
	'in': 'The selected :attribute is invalid.',
	integer: 'The :attribute must be an integer.',
	min: {
		numeric: 'The :attribute must be at least :min.',
		string: 'The :attribute must be at least :min characters.'
	},
	max: {
		numeric: 'The :attribute must be less than :max.',
		string: 'The :attribute must be less than :max characters.'
	},
	not_in: 'The selected :attribute is invalid.',
	numeric: 'The :attribute must be a number.',
	required: 'The :attribute field is required.',
	required_if: 'The :attribute field is required when :other is :value.',
	same: 'The :attribute and :same fields must match.',
	size: {
		numeric: 'The :attribute must be :size.',
		string: 'The :attribute must be :size characters.'
	},
	url: 'The :attribute format is invalid.',
	regex: 'The :attribute format is invalid',
	attributes: {}
};
},{}],6:[function(require,module,exports){
var Attributes = require('./attributes');

var Messages = function(lang, messages) {
	this.lang = lang;
	this.messages = messages;
	this.customMessages = {};
	this.attributeNames = {};
};

Messages.prototype = {
	constructor: Messages,

	/**
	 * Set custom messages
	 *
	 * @param {object} customMessages
	 * @return {void}
	 */
	_setCustom: function(customMessages) {
		this.customMessages = customMessages || {};
	},

	/**
	 * Set custom attribute names.
	 *
	 * @param {object} attributes
	 */
	_setAttributeNames: function(attributes) {
		this.attributeNames = attributes;
	},

	/**
	 * Set the attribute formatter.
	 *
	 * @param {fuction} func
	 * @return {void}
	 */
	_setAttributeFormatter: function(func) {
		this.attributeFormatter = func;
	},

	/**
	 * Get attribute name to display.
	 *
	 * @param  {string} attribute
	 * @return {string}
	 */
	_getAttributeName: function(attribute) {
		var name = attribute;
		if (this.attributeNames.hasOwnProperty(attribute)) {
			return this.attributeNames[attribute];
		}
		else if (this.messages.attributes.hasOwnProperty(attribute)) {
			name = this.messages.attributes[attribute];
		}

		if (this.attributeFormatter)
		{
			name = this.attributeFormatter(name);
		}
		
		return name;
	},

	/**
	 * Get all messages
	 *
	 * @return {object}
	 */
	all: function() {
		return this.messages;
	},

	/**
	 * Render message
	 *
	 * @param  {Rule} rule
	 * @return {string}
	 */
	render: function(rule) {
		if (rule.customMessage) {
			return rule.customMessage;
		}
		var template = this._getTemplate(rule);

		var message;
		if (Attributes.replacements[rule.name]) {
			message = Attributes.replacements[rule.name].apply(this, [template, rule]);
		}
		else {
			message = this._replacePlaceholders(rule, template, {});
		}

		return message;
	},

	/**
	 * Get the template to use for given rule
	 *
	 * @param  {Rule} rule
	 * @return {string}
	 */
	_getTemplate: function(rule) {

		var messages = this.messages;
		var template = messages.def;
		var customMessages = this.customMessages;
		var formats = [rule.name + '.' + rule.attribute, rule.name];

		for (var i = 0, format; i < formats.length; i++) {
			format = formats[i];
			if (customMessages.hasOwnProperty(format)) {
				template = customMessages[format];
				break;
			}
			else if (messages.hasOwnProperty(format)) {
				template = messages[format];
				break;
			}
		}

		if (typeof template === 'object') {
			template = template[rule._getValueType()];
		}

		return template;
	},

	/**
	 * Replace placeholders in the template using the data object
	 *
	 * @param  {Rule} rule
	 * @param  {string} template
	 * @param  {object} data
	 * @return {string}
	 */
	_replacePlaceholders: function(rule, template, data) {
		var message, attribute;

		data.attribute = this._getAttributeName(rule.attribute);
		data[rule.name] = rule.getParameters().join(',');

		if (typeof template === 'string' && typeof data === 'object') {
			message = template;

			for (attribute in data) {
				message = message.replace(':' + attribute, data[attribute]);
			}
		}

		return message;
	}

};

module.exports = Messages;

},{"./attributes":2}],7:[function(require,module,exports){
var rules = {

	required: function(val) {
		var str;

		if (val === undefined || val === null) {
			return false;
		}

		str = String(val).replace(/\s/g, "");
		return str.length > 0 ? true : false;
	},

	required_if: function(val, req, attribute) {
		req = this.getParameters();
		if (this.validator.input[req[0]] === req[1]) {
			return this.validator.getRule('required').validate(val);
		}

		return true;
	},

	// compares the size of strings
	// with numbers, compares the value
	size: function(val, req, attribute) {
		if (val) {
			req = parseFloat(req);

			var size = this.getSize();

			return size === req;
		}

		return true;
	},

	/**
	 * Compares the size of strings or the value of numbers if there is a truthy value
	 */
	min: function(val, req, attribute) {
		var size = this.getSize();
		return size >= req;
	},

	/**
	 * Compares the size of strings or the value of numbers if there is a truthy value
	 */
	max: function(val, req, attribute) {
		var size = this.getSize();
		return size <= req;
	},

	between: function(val, req, attribute) {
		req = this.getParameters();
		var size = this.getSize();
		var min = parseFloat(req[0], 10);
		var max = parseFloat(req[1], 10);
		return size >= min && size <= max;
	},

	email: function(val) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(val);
	},

	numeric: function(val) {
		var num;

		num = Number(val); // tries to convert value to a number. useful if value is coming from form element

		if (typeof num === 'number' && !isNaN(num) && typeof val !== 'boolean') {
			return true;
		} else {
			return false;
		}
	},

	array: function(val) {
		return val instanceof Array;
	},

	url: function(url) {
		return (/^https?:\/\/\S+/).test(url);
	},

	alpha: function(val) {
		return (/^[a-zA-Z]+$/).test(val);
	},

	alpha_dash: function(val) {
		return (/^[a-zA-Z0-9_\-]+$/).test(val);
	},

	alpha_num: function(val) {
		return (/^[a-zA-Z0-9]+$/).test(val);
	},

	same: function(val, req) {
		var val1 = this.validator.input[req];
		var val2 = val;

		if (val1 === val2) {
			return true;
		}

		return false;
	},

	different: function(val, req) {
		var val1 = this.validator.input[req];
		var val2 = val;

		if (val1 !== val2) {
			return true;
		}

		return false;
	},

	"in": function(val, req) {
		var list, i;

		if (val) {
			list = req.split(',');
		}

		if (val && !(val instanceof Array)) {
			val = String(val); // if it is a number

			for (i = 0; i < list.length; i++) {
				if (val === list[i]) {
					return true;
				}
			}

			return false;
		}

		if (val && val instanceof Array) {
			for (i = 0; i < val.length; i++) {
				if (list.indexOf(val[i]) < 0) {
					return false;
				}
			}
		}

		return true;
	},

	not_in: function(val, req) {
		var list = req.split(',');
		var len = list.length;
		var returnVal = true;

		val = String(val); // convert val to a string if it is a number

		for (var i = 0; i < len; i++) {
			if (val === list[i]) {
				returnVal = false;
				break;
			}
		}

		return returnVal;
	},

	accepted: function(val) {
		if (val === 'on' || val === 'yes' || val === 1 || val === '1' || val === true) {
			return true;
		}

		return false;
	},

	confirmed: function(val, req, key) {
		var confirmedKey = key + '_confirmation';

		if (this.validator.input[confirmedKey] === val) {
			return true;
		}

		return false;
	},

	integer: function(val) {
		return String(parseInt(val, 10)) === String(val);
	},

	digits: function(val, req) {
		var numericRule = this.validator.getRule('numeric');
		if (numericRule.validate(val) && String(val).length === parseInt(req)) {
			return true;
		}

		return false;
	},

	regex: function(val, req) {
		var mod = /[g|i|m]{1,3}$/;
		var flag = req.match(mod);
		flag = flag ? flag[0] : "i";
		req = req.replace(mod,"").slice(1,-1);
		req = new RegExp(req,flag);
		return !!val.match(req);
	}

};

function Rule(name, fn, async) {
	this.name = name;
	this.fn = fn;
	this.passes = null;
	this.customMessage = undefined;
	this.async = async;
}

Rule.prototype = {

	/**
	 * Validate rule
	 *
	 * @param  {mixed} inputValue
	 * @param  {mixed} ruleValue
	 * @param  {string} attribute
	 * @param  {function} callback
	 * @return {boolean|undefined}
	 */
	validate: function(inputValue, ruleValue, attribute, callback) {
		var _this = this;
		this._setValidatingData(attribute, inputValue, ruleValue);
		if (typeof callback === 'function') {
			this.callback = callback;
			var handleResponse = function(passes, message) {
				_this.response(passes, message);
			};

			if (this.async) {
				return this.fn.apply(this, [inputValue, ruleValue, attribute, handleResponse]);
			}
			else {
				return handleResponse(this.fn.apply(this, [inputValue, ruleValue, attribute]));
			}
		}
		return this.fn.apply(this, [inputValue, ruleValue, attribute]);
	},

	/**
	 * Set validating data
	 *
	 * @param {string} attribute
	 * @param {mixed} inputValue
	 * @param {mixed} ruleValue
	 * @return {void}
	 */
	_setValidatingData: function(attribute, inputValue, ruleValue) {
		this.attribute = attribute;
		this.inputValue = inputValue;
		this.ruleValue = ruleValue;
	},

	/**
	 * Get parameters
	 *
	 * @return {array}
	 */
	getParameters: function() {
		return this.ruleValue ? this.ruleValue.split(',') : [];
	},

	/**
	 * Get true size of value
	 *
	 * @return {integer|float}
	 */
	getSize: function() {
		var value = this.inputValue;

		if (value instanceof Array) {
			return value.length;
		}

		if (typeof value === 'number') {
			return value;
		}

		if (this.validator._hasNumericRule(this.attribute)) {
			return parseFloat(value, 10);
		}

		return value.length;
	},

	/**
	 * Get the type of value being checked; numeric or string.
	 *
	 * @return {string}
	 */
	_getValueType: function() {
		
		if (typeof this.inputValue === 'number' || this.validator._hasNumericRule(this.attribute))
		{
			return 'numeric';
		}

		return 'string';
	},

	/**
	 * Set the async callback response
	 *
	 * @param  {boolean|undefined} passes  Whether validation passed
	 * @param  {string|undefined} message Custom error message
	 * @return {void}
	 */
	response: function(passes, message) {
		this.passes = (passes === undefined || passes === true);
		this.customMessage = message;
		this.callback(this.passes, message);
	},

	/**
	 * Set validator instance
	 *
	 * @param {Validator} validator
	 * @return {void}
	 */
	setValidator: function(validator) {
		this.validator = validator;
	}

};

var manager = {

	/**
	 * List of async rule names
	 *
	 * @type {Array}
	 */
	asyncRules: [],

	/**
	 * Implicit rules (rules to always validate)
	 *
	 * @type {Array}
	 */
	implicitRules: ['required', 'required_if', 'accepted'],

	/**
	 * Get rule by name
	 *
	 * @param  {string} name
	 * @param {Validator}
	 * @return {Rule}
	 */
	make: function(name, validator) {
		var async = this.isAsync(name);
		var rule = new Rule(name, rules[name], async);
		rule.setValidator(validator);
		return rule;
	},

	/**
	 * Determine if given rule is async
	 *
	 * @param  {string}  name
	 * @return {boolean}
	 */
	isAsync: function(name) {
		for (var i = 0, len = this.asyncRules.length; i < len; i++) {
			if (this.asyncRules[i] === name) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Determine if rule is implicit (should always validate)
	 *
	 * @param {string} name
	 * @return {boolean}
	 */
	isImplicit: function(name) {
		return this.implicitRules.indexOf(name) > -1;
	},

	/**
	 * Register new rule
	 *
	 * @param  {string}   name
	 * @param  {function} fn
	 * @return {void}
	 */
	register: function(name, fn) {
		rules[name] = fn;
	},

	/**
	 * Register async rule
	 *
	 * @param  {string}   name
	 * @param  {function} fn
	 * @return {void}
	 */
	registerAsync: function(name, fn) {
		this.register(name, fn);
		this.asyncRules.push(name);
	}

};


module.exports = manager;

},{}],8:[function(require,module,exports){
// Get required modules
var Rules = require('./rules');
var Lang = require('./lang');
var Errors = require('./errors');
var Attributes = require('./attributes');
var AsyncResolvers = require('./async');

var Validator = function(input, rules, customMessages) {
	var lang = Validator.getDefaultLang();
	this.input = input;

	this.messages = Lang._make(lang);
	this.messages._setCustom(customMessages);
	this.setAttributeFormatter(Validator.prototype.attributeFormatter);

	this.errors = new Errors();
	this.errorCount = 0;
	
	this.hasAsync = false;
	this.rules = this._parseRules(rules);
};

Validator.prototype = {

	constructor: Validator,

	/**
	 * Default language
	 *
	 * @type {string}
	 */
	lang: 'en',

	/**
	 * Numeric based rules
	 *
	 * @type {array}
	 */
	numericRules: ['integer', 'numeric', 'between'],

	/**
	 * Attribute formatter.
	 *
	 * @type {function}
	 */
	attributeFormatter: Attributes.formatter,

	/**
	 * Run validator
	 *
	 * @return {boolean} Whether it passes; true = passes, false = fails
	 */
	check: function() {
		var self = this;

		for (var attribute in this.rules) {
			var attributeRules = this.rules[attribute];
			var inputValue = this.input[attribute]; // if it doesnt exist in input, it will be undefined

			for (var i = 0, len = attributeRules.length, rule, ruleOptions, rulePassed; i < len; i++) {
				ruleOptions = attributeRules[i];
				rule = this.getRule(ruleOptions.name);

				if (!this._isValidatable(rule, inputValue)) {
					continue;
				}
				
				rulePassed = rule.validate(inputValue, ruleOptions.value, attribute);
				if (!rulePassed) {
					this._addFailure(rule);
				}

				if (this._shouldStopValidating(attribute, rulePassed)) {
					break;
				}
			}
		}

		return this.errorCount === 0;
	},

	/**
	 * Run async validator
	 *
	 * @param {function} passes
	 * @param {function} fails
	 * @return {void}
	 */
	checkAsync: function(passes, fails) {
		var _this = this;
		passes = passes || function() {};
		fails = fails || function() {};

		var failsOne = function(rule, message) {
			_this._addFailure(rule, message);
		};

		var resolvedAll = function(allPassed) {
			if (allPassed) {
				passes();
			}
			else {
				fails();
			}
		};

		var validateRule = function(inputValue, ruleOptions, attribute, rule) {
			return function() {
				var resolverIndex = asyncResolvers.add(rule);
				rule.validate(inputValue, ruleOptions.value, attribute, function() { asyncResolvers.resolve(resolverIndex); });
			};
		};

		var asyncResolvers = new AsyncResolvers(failsOne, resolvedAll);

		for (var attribute in this.rules) {
			var attributeRules = this.rules[attribute];
			var inputValue = this.input[attribute]; // if it doesnt exist in input, it will be undefined

			for (var i = 0, len = attributeRules.length, rule, ruleOptions; i < len; i++) {
				ruleOptions = attributeRules[i];

				rule = this.getRule(ruleOptions.name);

				if (!this._isValidatable(rule, inputValue)) {
					continue;
				}

				validateRule(inputValue, ruleOptions, attribute, rule)();
			}
		}

		asyncResolvers.enableFiring();
		asyncResolvers.fire();
	},

	/**
	 * Add failure and error message for given rule
	 *
	 * @param {Rule} rule
	 */
	_addFailure: function(rule) {
		var msg = this.messages.render(rule);	
		this.errors.add(rule.attribute, msg);
		this.errorCount++;
	},

	/**
	 * Parse rules, normalizing format into: { attribute: [{ name: 'age', value: 3 }] }
	 *
	 * @param  {object} rules
	 * @return {object}
	 */
	_parseRules: function(rules) {
		var parsedRules = {};
		for (var attribute in rules) {
			var rulesArray = rules[attribute];
			var attributeRules = [];

			if (typeof rulesArray === 'string') {
				rulesArray = rulesArray.split('|');
			}
			
			for (var i = 0, len = rulesArray.length, rule; i < len; i++) {
				rule = this._extractRuleAndRuleValue(rulesArray[i]);
				if (Rules.isAsync(rule.name)) {
					this.hasAsync = true;
				}
				attributeRules.push(rule);
			}

			parsedRules[attribute] = attributeRules;
		}
		return parsedRules;
	},

	/**
	 * Extract a rule and a value from a ruleString (i.e. min:3), rule = min, value = 3
	 * 
	 * @param  {string} ruleString min:3
	 * @return {object} object containing the name of the rule and value
	 */
	_extractRuleAndRuleValue: function(ruleString) {
		var rule = {}, ruleArray;

		rule.name = ruleString;

		if (ruleString.indexOf(':') >= 0) {
			ruleArray = ruleString.split(':');
			rule.name = ruleArray[0];
			rule.value = ruleArray.slice(1).join(":");
		}

		return rule;
	},

	/**
	 * Determine if attribute has any of the given rules
	 *
	 * @param  {string}  attribute
	 * @param  {array}   findRules
	 * @return {boolean}
	 */
	_hasRule: function(attribute, findRules) {
		var rules = this.rules[attribute] || [];
		for (var i = 0, len = rules.length; i < len; i++) {
			if (findRules.indexOf(rules[i].name) > -1) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Determine if attribute has any numeric-based rules.
	 *
	 * @param  {string}  attribute
	 * @return {Boolean}
	 */
	_hasNumericRule: function(attribute) {
		return this._hasRule(attribute, this.numericRules);
	},

	/**
	 * Determine if rule is validatable
	 *
	 * @param  {Rule}   rule
	 * @param  {mixed}  value
	 * @return {boolean} 
	 */
	_isValidatable: function(rule, value) {
		if (Rules.isImplicit(rule.name)) {
			return true;
		}

		return this.getRule('required').validate(value);
	},


	/**
	 * Determine if we should stop validating.
	 *
	 * @param  {string} attribute
	 * @param  {boolean} rulePassed
	 * @return {boolean}
	 */
	_shouldStopValidating: function(attribute, rulePassed) {

		var stopOnAttributes = this.stopOnAttributes;
		if (stopOnAttributes === false || rulePassed === true) {
			return false;
		}

		if (stopOnAttributes instanceof Array) {
			return stopOnAttributes.indexOf(attribute) > -1;
		}

		return true;
	},

	/**
	 * Set custom attribute names.
	 *
	 * @param {object} attributes
	 * @return {void}
	 */
	setAttributeNames: function(attributes) {
		this.messages._setAttributeNames(attributes);
	},

	/**
	 * Set the attribute formatter.
	 *
	 * @param {fuction} func
	 * @return {void}
	 */
	setAttributeFormatter: function(func) {
		this.messages._setAttributeFormatter(func);
	},

	/**
	 * Get validation rule
	 *
	 * @param  {string} name
	 * @return {Rule}
	 */
	getRule: function(name) {
		return Rules.make(name, this);
	},

	/**
	 * Stop on first error.
	 *
	 * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
	 * @return {void}
	 */
	stopOnError: function(attributes) {
		this.stopOnAttributes = attributes;
	},

	/**
	 * Determine if validation passes
	 *
	 * @param {function} passes
	 * @return {boolean|undefined}
	 */
	passes: function(passes) {
		var async = this._checkAsync('passes', passes);
		if (async) {
			return this.checkAsync(passes);
		}
		return this.check();
	},

	/**
	 * Determine if validation fails
	 *
	 * @param {function} fails
	 * @return {boolean|undefined}
	 */
	fails: function(fails) {
		var async = this._checkAsync('fails', fails);
		if (async) {
			return this.checkAsync(function() {}, fails);
		}
		return !this.check();
	},

	/**
	 * Check if validation should be called asynchronously
	 *
 	 * @param  {string}   funcName Name of the caller
	 * @param  {function} callback
	 * @return {boolean}
	 */
	_checkAsync: function(funcName, callback) {
		var hasCallback = typeof callback === 'function';
		if (this.hasAsync && !hasCallback) {
			throw funcName + ' expects a callback when async rules are being tested.';
		}

		return this.hasAsync || hasCallback;
	}

};

/**
 * Set messages for language
 *
 * @param {string} lang
 * @param {object} messages
 * @return {this}
 */
Validator.setMessages = function(lang, messages) {
	Lang._set(lang, messages);
	return this;
};

/**
 * Get messages for given language
 *
 * @param  {string} lang
 * @return {Messages}
 */
Validator.getMessages = function(lang) {
	return Lang._get(lang);
};

/**
 * Set default language to use
 *
 * @param {string} lang
 * @return {void}
 */
Validator.useLang = function(lang) {
	this.prototype.lang = lang;
};

/**
 * Get default language
 *
 * @return {string}
 */
Validator.getDefaultLang = function() {
	return this.prototype.lang;
};

/**
 * Set the attribute formatter.
 *
 * @param {fuction} func
 * @return {void}
 */
Validator.setAttributeFormatter = function(func) {
	this.prototype.attributeFormatter = func;
};

/**
 * Stop on first error.
 *
 * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
 * @return {void}
 */
Validator.stopOnError = function(attributes) {
	this.prototype.stopOnAttributes = attributes;
};

/**
 * Register custom validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.register = function(name, fn, message) {
	var lang = Validator.getDefaultLang();
	Rules.register(name, fn);
	Lang._setRuleMessage(lang, name, message);
};

/**
 * Register asynchronous validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerAsync = function(name, fn, message) {
	var lang = Validator.getDefaultLang();
	Rules.registerAsync(name, fn);
	Lang._setRuleMessage(lang, name, message);
};

module.exports = Validator;

},{"./async":1,"./attributes":2,"./errors":3,"./lang":4,"./rules":7}]},{},[8])(8)
});