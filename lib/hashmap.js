/* Simple HashMap wrapper
*  author: David Tomberlin
*  Very simple, just a wrapper around an object
*  to use as a hash map, with some sanely named
*  methods to help readability.  Also added 'entrySet'
*  method, to retrieve a list of key:value pairs easily
*/

function Hash(){
	this.db = {};
}

Hash.prototype = {
	put: function(key, value){
		this.db[key] = value;
	},
	get: function(key){
		var item = this.db[key];
		return item === undefined ? undefined : item;
	},
	contains: function(key){
		return this.db[key] === undefined ? false : true;		
	},
	remove: function(key){
		delete(this.db[key]);
	},
	entrySet: function(){
		var entries = [];
		for(var k in this.db){
			var item = {key: k, value: this.db[k]};
			entries.push(item);
		}
		return entries;
	}
};