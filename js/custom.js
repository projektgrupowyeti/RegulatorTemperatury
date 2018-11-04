// Offset for Site Navigation
$('#siteNav').affix({
	offset: {
		top: 100
	}
})

var readBtn = document.getElementById("readBtn");
var writeBtn = document.getElementById("writeBtn");

console.log("Found button.\n");

readBtn.addEventListener('click', function(event) {
console.log("Button clicked.\n");
navigator.bluetooth.requestDevice({
	acceptAllDevices: true,
	optionalServices: ['31f45c45-8e0d-4c88-94f7-718a38048536'] 
    })
    .then(device => {
	console.log(device.name);
	return device.gatt.connect();
    })
    .then(server => {
      return server.getPrimaryService('31f45c45-8e0d-4c88-94f7-718a38048536');
    })
    .then(service => {
      return service.getCharacteristic('31F45C46-E0D4-C889-4F77-18A380485360'.toLowerCase());
    })
    .then(characteristic => {
      return characteristic.readValue();
    })
    .then(value => {
	console.log(value);
	console.log('Value R is ' + value.getUint8(0));
	console.log('Value G is ' + value.getUint8(1));
	console.log('Value B is ' + value.getUint8(2));
	console.log('Value I is ' + value.getUint8(3));
	console.log('Value S is ' + value.getUint8(4));
	document.getElementById("read_regulator").innerHTML = value.getUint8(0);
	document.getElementById("read_data").innerHTML = value.getUint8(4);
    })
    .catch(error => { 
	console.log(error); 
    });
});

writeBtn.addEventListener('click', function(event) {
console.log("Button clicked.\n");
navigator.bluetooth.requestDevice({
	acceptAllDevices: true,
	optionalServices: ['31f45c45-8e0d-4c88-94f7-718a38048536'] 
    })
    .then(device => {
	console.log(device.name);
	return device.gatt.connect();
    })
    .then(server => {
      return server.getPrimaryService('31f45c45-8e0d-4c88-94f7-718a38048536');
    })
    .then(service => {
      return service.getCharacteristic('31F45C46-E0D4-C889-4F77-18A380485360'.toLowerCase());
    })
    .then(characteristic => {
	var val = document.getElementById("set_data").value;
	var s = new Set([val, 0, 0, 0, 0]);
	var arr = Uint8Array.from(s);
	return characteristic.writeValue(arr);
    })
    .then(_ => {
	console.log('Value is written to device');
    })
    .catch(error => { 
	console.log(error); 
    });
});
