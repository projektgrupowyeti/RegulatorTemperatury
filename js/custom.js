// Offset for Site Navigation
$('#siteNav').affix({
	offset: {
		top: 100
	}
})

$(document).ready(function() {
	var connectBtn = document.getElementById("connectBtn");
	var writeBtn = document.getElementById("writeBtn");
	
	var primaryServiceUUID = '31f45c45-8e0d-4c88-94f7-718a38048536'.toLowerCase();
	var characteristicUUID = '31F45C46-E0D4-C889-4F77-18A380485360'.toLowerCase();

	var bluetoothDevice;
	var characteristicBLE;
	
	connectBtn.addEventListener('click', onConnectClick);
	writeBtn.addEventListener('click', onWriteClick);
	
	function onConnectClick(event) {
		bluetoothDevice = null;
		characteristicBLE = null;
		console.log("Requesting BLE device.\n");
		navigator.bluetooth.requestDevice({
			filters: [{ services: [primaryServiceUUID]}]
			})
			.then(device => {
				bluetoothDevice = device;
				bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
				connect();
			})
			.catch(error => {
				log('Error! ' + error);
		});
	}
	
	function connect() {
		exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
			function toTry() {
			  time('Connecting to BLE Device... ');
			  return bluetoothDevice.gatt.connect()
				.then(server => {
				  	return server.getPrimaryService(primaryServiceUUID);
					})
					.then(service => {
					  return service.getCharacteristic(characteristicUUID.toLowerCase());
					})
					.then(characteristic => {
				  		characteristicBLE = characteristic;
						characteristic.addEventListener('characteristicvaluechanged', handleTemperatureChanged);
				  		return characteristic.readValue();
					})
					.catch(error => { console.log(error); });
			},
			function success() {
			  log('> Connected.');
			},
			function fail() {
			  time('Failed to connect.');
			});
	}
		
	function onDisconnected() {
  		log('> Disconnected');
  		connect();
	}
	
	function handleTemperatureChanged(event) {
		var regTemp = event.target.value.getUint8(0);
		var curTemp = event.target.value.getUint8(4);
		document.getElementById("read_regulator").innerHTML = regTemp;
		document.getElementById("read_data").innerHTML = curTemp;
		console.log('Current temperature is ' + curTemp);
		console.log('Current regulator setting is ' + regTemp);
	}
	
	function onWriteClick(event) {
		if (bluetoothDevice == null) {
			console.log("Not connected to any BLE device.\n");
			return;
		}
		
		if (characteristicBLE == null) {
			console.log("BLE device characteristic is not aquired properly.\n");
			return;
		}
		
		var val = document.getElementById("set_data").value;
		var s = new Set([val, 0, 0, 0, 0]);
		var arr = Uint8Array.from(s);
		characteristic.writeValue(arr)
		.then(_ => {
			console.log('Value is written to device');
		})
		.catch(error => { 
			console.log('Error! ' + error); 
		});
	}
	
})
