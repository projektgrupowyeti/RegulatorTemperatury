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
	window.setTimeout(readBleCharacteristic, 1000);
	
	function readBleCharacteristic() {
  		if (bluetoothDevice != null && characteristicBLE != null) {
			characteristicBLE.readValue();
		}
	}
	
	function onConnectClick(event) {
		bluetoothDevice = null;
		characteristicBLE = null;
		time("Requesting BLE device.\n");
		navigator.bluetooth.requestDevice({
			filters: [{ services: [primaryServiceUUID]}]
			})
			.then(device => {
				bluetoothDevice = device;
				bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
				connect();
			})
			.catch(error => { time('Error! ' + error); });
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
				  		time('Characteristic acquired, adding event listener.');
						characteristicBLE.addEventListener('characteristicvaluechanged', handleTemperatureChanged);
					})
					.catch(error => { time('Error! ' + error); });
			},
			function success() {
		  		time('> Connected.');
				characteristicBLE.readValue();
			},
			function fail() {
		  		time('Failed to connect.');
			});
	}
		
	function onDisconnected() {
  		time('> Disconnected');
  		connect();
	}
	
	function handleTemperatureChanged(event) {
		time('Temperature changed!');
		var regTemp = event.target.value.getUint8(0);
		var curTemp = event.target.value.getUint8(4);
		document.getElementById("read_regulator").innerHTML = regTemp;
		document.getElementById("read_data").innerHTML = curTemp;
		console.log('Current temperature is ' + curTemp);
		console.log('Current regulator setting is ' + regTemp);
	}
	
	function onWriteClick(event) {
		if (bluetoothDevice == null) {
			time("Not connected to any BLE device.\n");
			return;
		}
		
		if (characteristicBLE == null) {
			time("BLE device characteristic is not aquired properly.\n");
			return;
		}
		
		var val = document.getElementById("set_data").value;
		var s = new Set([val, 0, 0, 0, 0]);
		var arr = Uint8Array.from(s);
		characteristicBLE.writeValue(arr)
		.then(_ => {
			time('Value ' + arr + ' is written to device characteristic.');
		})
		.catch(error => { time('Error! ' + error); });
	}
	
	/* Utils */

	// This function keeps calling "toTry" until promise resolves or has
	// retried "max" number of times. First retry has a delay of "delay" seconds.
	// "success" is called upon success.
	function exponentialBackoff(max, delay, toTry, success, fail) {
	  toTry().then(result => success(result))
	  .catch(_ => {
		if (max === 0) {
		  return fail();
		}
		time('Retrying in ' + delay + 's... (' + max + ' tries left)');
		setTimeout(function() {
		  exponentialBackoff(--max, delay * 2, toTry, success, fail);
		}, delay * 1000);
	  });
	}

	function time(text) {
	  console.log('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
	}
	
})
